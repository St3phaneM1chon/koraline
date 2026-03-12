// =============================================================================
// Unified Tax Calculator (T2-8)
//
// Single entry point for all tax calculations:
// - Domestic (Canada) orders: delegates to canadian-tax-engine.ts
// - International orders: uses international-tax-config.ts with VAT/GST rates
// - B2B reverse charge: EU/EEA/UK orders with valid VAT ID -> 0% VAT
//
// This module does NOT replace existing Canadian tax calculations. It wraps
// them and adds international VAT support on top.
// =============================================================================

import {
  calculateTax as calculateCanadianTax,
  getTotalTaxRate as getCanadianTotalTaxRate,
  type TaxResult as CanadianTaxResult,
  type TaxBreakdown as CanadianTaxBreakdown,
} from '@/lib/tax/canadian-tax-engine';

import {
  getInternationalTaxRate,
  isEUCountry,
  isReverseChargeApplicable,
  validateVATNumberFormat,
  type InternationalTaxRate,
  type TaxRegion,
} from './international-tax-config';

// -----------------------------------------------------------------------------
// 1. Types
// -----------------------------------------------------------------------------

export type TaxType =
  | 'GST'       // Canadian Goods and Services Tax
  | 'HST'       // Canadian Harmonized Sales Tax
  | 'PST'       // Canadian Provincial Sales Tax
  | 'QST'       // Quebec Sales Tax
  | 'RST'       // Manitoba Retail Sales Tax
  | 'VAT'       // Value Added Tax (EU, UK, etc.)
  | 'GST_INTL'  // International GST (AU, NZ, SG, IN)
  | 'JCT'       // Japanese Consumption Tax
  | 'IVA'       // Impuesto al Valor Agregado (MX, AR, ES, IT)
  | 'NONE';     // No tax (export zero-rated or tax-free jurisdiction)

export interface UnifiedTaxLineItem {
  name: string;
  nameShort: string;    // e.g., 'VAT', 'GST', 'HST'
  rate: number;         // Decimal (e.g., 0.20 for 20%)
  rateDisplay: string;  // e.g., '20%', '9.975%'
  amount: number;       // Tax amount in the order currency
  type: TaxType;
  registrationNumber?: string;
}

export interface UnifiedTaxResult {
  /** Pre-tax amount */
  subtotal: number;

  /** Total tax amount (sum of all line items) */
  totalTax: number;

  /** Grand total (subtotal + totalTax) */
  total: number;

  /** Individual tax line items */
  lineItems: UnifiedTaxLineItem[];

  /** Whether this is a domestic (Canadian) or international order */
  orderType: 'domestic' | 'international';

  /** Country code of the buyer */
  countryCode: string;

  /** Province/state/region code (for domestic orders) */
  regionCode?: string;

  /** Whether B2B reverse charge was applied (EU/EEA/UK only) */
  reverseChargeApplied: boolean;

  /** If reverse charge, the buyer's VAT ID */
  buyerVatId?: string;

  /** The standard rate that WOULD have applied (useful for invoice display) */
  standardRateBeforeReverseCharge?: number;

  /** Tax region classification */
  taxRegion: TaxRegion | 'CANADA';

  /** Notes for the invoice (e.g., "Reverse charge: Article 196 EU VAT Directive") */
  invoiceNotes: string[];
}

export interface UnifiedTaxInput {
  /** Pre-tax amount */
  subtotal: number;

  /** ISO 3166-1 alpha-2 country code of the buyer */
  countryCode: string;

  /** Province/state code (required for CA orders, optional for others) */
  regionCode?: string;

  /**
   * Product category for rate selection.
   * 'standard' uses the standard rate, 'reduced' uses the reduced rate if available.
   * Defaults to 'standard'.
   */
  rateCategory?: 'standard' | 'reduced' | 'super_reduced' | 'zero';

  /**
   * Buyer's VAT/tax ID (for B2B reverse charge).
   * If provided and valid, reverse charge is applied for EU/EEA/UK orders.
   */
  buyerVatId?: string;

  /** Seller's GST/HST registration number (for Canadian invoices) */
  sellerGstNumber?: string;

  /** Seller's QST registration number (for Quebec invoices) */
  sellerQstNumber?: string;

  /** Transaction date for rate lookups (defaults to now) */
  asOfDate?: Date;
}

// -----------------------------------------------------------------------------
// 2. Main Calculator
// -----------------------------------------------------------------------------

/**
 * Calculate tax for any order worldwide.
 *
 * Routing logic:
 * 1. Country is 'CA' -> delegate to Canadian tax engine
 * 2. Country is 'US' -> zero-rated export (no Canadian tax, no US tax collected)
 * 3. Country is EU/EEA/UK with B2B VAT ID -> reverse charge (0%)
 * 4. Country in international config -> apply destination VAT/GST
 * 5. Unknown country -> zero-rated export
 */
export function calculateUnifiedTax(input: UnifiedTaxInput): UnifiedTaxResult {
  const {
    subtotal,
    countryCode: rawCountry,
    regionCode: rawRegion,
    rateCategory = 'standard',
    buyerVatId,
    sellerGstNumber,
    sellerQstNumber,
  } = input;

  const countryCode = rawCountry.toUpperCase();
  const regionCode = rawRegion?.toUpperCase();

  // ---- Route: Canada (domestic) ----
  if (countryCode === 'CA') {
    return calculateDomesticTax(subtotal, regionCode || 'QC', sellerGstNumber, sellerQstNumber);
  }

  // ---- Route: United States (export, no tax collected) ----
  if (countryCode === 'US') {
    return createZeroRatedResult(subtotal, countryCode, 'AMERICAS', [
      'Export zero-rated / Exportation detaxee.',
      'US state/local sales tax may apply at destination. / Les taxes de vente americaines peuvent s\'appliquer.',
    ]);
  }

  // ---- Route: International ----
  return calculateInternationalTax(subtotal, countryCode, rateCategory, buyerVatId);
}

// -----------------------------------------------------------------------------
// 3. Domestic (Canadian) Tax
// -----------------------------------------------------------------------------

function calculateDomesticTax(
  subtotal: number,
  provinceCode: string,
  gstNumber?: string,
  qstNumber?: string
): UnifiedTaxResult {
  const result: CanadianTaxResult = calculateCanadianTax(subtotal, provinceCode, gstNumber, qstNumber);

  const lineItems: UnifiedTaxLineItem[] = result.breakdown.map(
    (item: CanadianTaxBreakdown) => ({
      name: item.name,
      nameShort: extractShortName(item.name),
      rate: item.rate / 100, // Canadian engine returns percentage, we use decimal
      rateDisplay: `${item.rate}%`,
      amount: item.amount,
      type: mapCanadianTaxType(item.name),
      registrationNumber: item.registrationNumber,
    })
  );

  return {
    subtotal,
    totalTax: result.totalTax,
    total: result.total,
    lineItems,
    orderType: 'domestic',
    countryCode: 'CA',
    regionCode: result.province,
    reverseChargeApplied: false,
    taxRegion: 'CANADA',
    invoiceNotes: [],
  };
}

// -----------------------------------------------------------------------------
// 4. International Tax
// -----------------------------------------------------------------------------

function calculateInternationalTax(
  subtotal: number,
  countryCode: string,
  rateCategory: 'standard' | 'reduced' | 'super_reduced' | 'zero',
  buyerVatId?: string
): UnifiedTaxResult {
  const taxConfig = getInternationalTaxRate(countryCode);

  // Unknown country: treat as zero-rated export
  if (!taxConfig) {
    return createZeroRatedResult(subtotal, countryCode, 'OTHER', [
      'Export zero-rated / Exportation detaxee.',
    ]);
  }

  // ---- B2B Reverse Charge Check ----
  if (buyerVatId && isReverseChargeApplicable(countryCode, buyerVatId)) {
    const formatValid = validateVATNumberFormat(buyerVatId, countryCode);

    if (formatValid) {
      return createReverseChargeResult(subtotal, countryCode, taxConfig, buyerVatId);
    }
    // If VAT number format is invalid, fall through to normal taxation
    // (the invoice should note the invalid VAT number)
  }

  // ---- Determine applicable rate ----
  const rate = selectRate(taxConfig, rateCategory);

  // Zero-rate countries (HK, US via config with 0% rate)
  if (rate === 0) {
    return createZeroRatedResult(subtotal, countryCode, taxConfig.region, [
      taxConfig.notes || 'No VAT/GST applicable in this jurisdiction.',
    ]);
  }

  // ---- Calculate tax ----
  const taxAmount = round(subtotal * rate);
  const total = round(subtotal + taxAmount);

  const taxType = determineTaxType(taxConfig);
  const taxLabel = getTaxLabel(taxConfig, taxType);

  const lineItems: UnifiedTaxLineItem[] = [
    {
      name: `${taxLabel} (${taxConfig.countryName})`,
      nameShort: taxLabel,
      rate,
      rateDisplay: formatRate(rate),
      amount: taxAmount,
      type: taxType,
    },
  ];

  const invoiceNotes: string[] = [];
  if (taxConfig.notes) {
    invoiceNotes.push(taxConfig.notes);
  }

  return {
    subtotal,
    totalTax: taxAmount,
    total,
    lineItems,
    orderType: 'international',
    countryCode,
    reverseChargeApplied: false,
    taxRegion: taxConfig.region,
    invoiceNotes,
  };
}

// -----------------------------------------------------------------------------
// 5. Reverse Charge Result
// -----------------------------------------------------------------------------

function createReverseChargeResult(
  subtotal: number,
  countryCode: string,
  taxConfig: InternationalTaxRate,
  buyerVatId: string
): UnifiedTaxResult {
  const invoiceNotes: string[] = [];

  if (isEUCountry(countryCode)) {
    invoiceNotes.push(
      'Reverse charge: Article 196, EU VAT Directive 2006/112/EC. ' +
      'VAT to be accounted for by the recipient. / ' +
      'Autoliquidation: Article 196, Directive TVA 2006/112/CE. ' +
      'TVA due par le destinataire.'
    );
  } else if (taxConfig.region === 'UK') {
    invoiceNotes.push(
      'Reverse charge applies. VAT to be accounted for by the recipient under UK domestic reverse charge rules. / ' +
      'Autoliquidation applicable. TVA due par le destinataire selon les regles britanniques.'
    );
  } else {
    invoiceNotes.push(
      'Reverse charge applies. Tax to be accounted for by the recipient. / ' +
      'Autoliquidation applicable. Taxe due par le destinataire.'
    );
  }

  invoiceNotes.push(`Buyer VAT ID / No TVA acheteur: ${buyerVatId}`);

  return {
    subtotal,
    totalTax: 0,
    total: subtotal,
    lineItems: [
      {
        name: `VAT Reverse Charge (${taxConfig.countryName})`,
        nameShort: 'VAT RC',
        rate: 0,
        rateDisplay: '0% (reverse charge)',
        amount: 0,
        type: 'VAT',
      },
    ],
    orderType: 'international',
    countryCode,
    reverseChargeApplied: true,
    buyerVatId,
    standardRateBeforeReverseCharge: taxConfig.standardRate,
    taxRegion: taxConfig.region,
    invoiceNotes,
  };
}

// -----------------------------------------------------------------------------
// 6. Zero-Rated Export Result
// -----------------------------------------------------------------------------

function createZeroRatedResult(
  subtotal: number,
  countryCode: string,
  region: TaxRegion,
  notes: string[]
): UnifiedTaxResult {
  return {
    subtotal,
    totalTax: 0,
    total: subtotal,
    lineItems: [],
    orderType: 'international',
    countryCode,
    reverseChargeApplied: false,
    taxRegion: region,
    invoiceNotes: notes,
  };
}

// -----------------------------------------------------------------------------
// 7. Rate Selection
// -----------------------------------------------------------------------------

function selectRate(
  config: InternationalTaxRate,
  category: 'standard' | 'reduced' | 'super_reduced' | 'zero'
): number {
  switch (category) {
    case 'zero':
      return config.zeroRated ? 0 : config.standardRate;
    case 'super_reduced':
      return config.superReducedRate ?? config.reducedRate ?? config.standardRate;
    case 'reduced':
      return config.reducedRate ?? config.standardRate;
    case 'standard':
    default:
      return config.standardRate;
  }
}

// -----------------------------------------------------------------------------
// 8. Tax Type Determination
// -----------------------------------------------------------------------------

function determineTaxType(config: InternationalTaxRate): TaxType {
  const code = config.countryCode;

  // Specific tax type names by country
  if (config.isEU || config.region === 'UK' || config.region === 'EEA' || config.region === 'EFTA') {
    return 'VAT';
  }
  if (['AU', 'NZ', 'SG', 'IN', 'MY'].includes(code)) return 'GST_INTL';
  if (code === 'JP') return 'JCT';
  if (['MX', 'AR', 'CL', 'CO', 'PE', 'ES', 'IT'].includes(code)) return 'IVA';
  if (config.standardRate === 0) return 'NONE';

  return 'VAT'; // Default for other countries with a tax
}

function getTaxLabel(_config: InternationalTaxRate, taxType: TaxType): string {
  switch (taxType) {
    case 'GST_INTL': return 'GST';
    case 'JCT': return 'JCT';
    case 'IVA': return 'IVA';
    case 'VAT': return 'VAT';
    case 'NONE': return 'Tax';
    default: return 'VAT';
  }
}

function mapCanadianTaxType(taxName: string): TaxType {
  const upper = taxName.toUpperCase();
  if (upper.includes('HST') || upper.includes('TVH')) return 'HST';
  if (upper.includes('QST') || upper.includes('TVQ')) return 'QST';
  if (upper.includes('PST') || upper.includes('TVP')) return 'PST';
  if (upper.includes('RST')) return 'RST';
  return 'GST';
}

function extractShortName(fullName: string): string {
  // "TPS / GST" -> "GST", "TVQ / QST" -> "QST", "TVH / HST" -> "HST"
  const parts = fullName.split('/').map((s) => s.trim());
  return parts.length > 1 ? parts[1] : parts[0];
}

// -----------------------------------------------------------------------------
// 9. Formatting Helpers
// -----------------------------------------------------------------------------

function formatRate(rate: number): string {
  const pct = rate * 100;
  // Avoid floating-point display artifacts
  if (Number.isInteger(pct)) return `${pct}%`;
  // Show up to 3 decimal places, trim trailing zeros
  return `${parseFloat(pct.toFixed(3))}%`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// -----------------------------------------------------------------------------
// 10. Convenience Functions (for existing code migration)
// -----------------------------------------------------------------------------

/**
 * Quick tax calculation for checkout flow.
 * Drop-in enhancement: if country is CA, uses Canadian engine.
 * If international, applies destination VAT.
 *
 * Returns a simplified object compatible with existing payment route patterns.
 */
export function calculateTaxForCheckout(
  subtotal: number,
  province: string,
  country: string = 'CA',
  buyerVatId?: string
): {
  taxAmount: number;
  total: number;
  breakdown: Array<{ name: string; rate: number; amount: number }>;
  reverseCharge: boolean;
} {
  const result = calculateUnifiedTax({
    subtotal,
    countryCode: country,
    regionCode: province,
    buyerVatId,
  });

  return {
    taxAmount: result.totalTax,
    total: result.total,
    breakdown: result.lineItems.map((li) => ({
      name: li.name,
      rate: li.rate * 100, // Return as percentage for backward compat
      amount: li.amount,
    })),
    reverseCharge: result.reverseChargeApplied,
  };
}

/**
 * Get the effective tax rate (as percentage) for a given destination.
 * For Canadian provinces, returns the combined rate.
 * For international, returns the standard VAT rate.
 * For B2B reverse charge, returns 0.
 */
export function getEffectiveTaxRate(
  countryCode: string,
  regionCode?: string,
  buyerVatId?: string
): number {
  const country = countryCode.toUpperCase();

  if (country === 'CA') {
    return getCanadianTotalTaxRate(regionCode || 'QC');
  }

  if (country === 'US') return 0;

  // Check reverse charge
  if (buyerVatId && isReverseChargeApplicable(country, buyerVatId)) {
    if (validateVATNumberFormat(buyerVatId, country)) {
      return 0;
    }
  }

  const config = getInternationalTaxRate(country);
  if (!config) return 0;

  return config.standardRate * 100; // Return as percentage
}

/**
 * Format a UnifiedTaxResult for display in an invoice or receipt.
 * Returns human-readable strings for each tax line.
 */
export function formatTaxResultForInvoice(
  result: UnifiedTaxResult,
  lang: 'en' | 'fr' = 'en'
): Array<{ label: string; rate: string; amount: string }> {
  if (result.lineItems.length === 0) {
    const label = lang === 'fr' ? 'Exportation detaxee' : 'Export zero-rated';
    return [{ label, rate: '0%', amount: formatCurrency(0) }];
  }

  return result.lineItems.map((item) => ({
    label: item.name,
    rate: item.rateDisplay,
    amount: formatCurrency(item.amount),
  }));
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

// -----------------------------------------------------------------------------
// 11. Re-exports for convenience
// -----------------------------------------------------------------------------

export {
  getInternationalTaxRate,
  isEUCountry,
  isReverseChargeApplicable,
  validateVATNumberFormat,
  getSupportedCountries,
  getEUCountries,
  getCountriesByRegion,
} from './international-tax-config';

export type {
  InternationalTaxRate,
  TaxRegion,
  ReverseChargeRule,
} from './international-tax-config';
