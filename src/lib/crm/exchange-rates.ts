/**
 * CRM Exchange Rates - Currency conversion utilities
 *
 * - convertCurrency: Convert an amount from one currency to another using DB rates
 * - fetchExchangeRates: Fetch rates from exchangerate-api.com and upsert into DB
 * - getAvailableCurrencies: Return supported currency codes
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Available currencies
// ---------------------------------------------------------------------------

const SUPPORTED_CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'CHF', 'AUD', 'JPY'] as const;

/**
 * Returns the list of available/supported currency codes.
 */
export function getAvailableCurrencies(): string[] {
  return [...SUPPORTED_CURRENCIES];
}

// ---------------------------------------------------------------------------
// Convert currency using DB rates
// ---------------------------------------------------------------------------

/**
 * Convert an amount from one currency to another using exchange rates stored in the database.
 *
 * @param amount - The amount to convert
 * @param from   - Source currency code (e.g. 'CAD')
 * @param to     - Target currency code (e.g. 'USD')
 * @returns The converted amount
 * @throws Error if no exchange rate is found for the pair
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  // Same currency, no conversion needed
  if (fromUpper === toUpper) {
    return amount;
  }

  // Try direct rate
  const directRate = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: fromUpper,
        toCurrency: toUpper,
      },
    },
  });

  if (directRate) {
    return amount * Number(directRate.rate);
  }

  // Try inverse rate
  const inverseRate = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: toUpper,
        toCurrency: fromUpper,
      },
    },
  });

  if (inverseRate && Number(inverseRate.rate) !== 0) {
    return amount / Number(inverseRate.rate);
  }

  // Try cross-rate via a common base (e.g. USD)
  const commonBases = ['USD', 'EUR', 'CAD'];

  for (const base of commonBases) {
    if (base === fromUpper || base === toUpper) continue;

    const fromToBase = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: { fromCurrency: fromUpper, toCurrency: base },
      },
    });

    const baseToTarget = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: { fromCurrency: base, toCurrency: toUpper },
      },
    });

    if (fromToBase && baseToTarget) {
      return amount * Number(fromToBase.rate) * Number(baseToTarget.rate);
    }
  }

  throw new Error(`No exchange rate found for ${fromUpper} -> ${toUpper}`);
}

// ---------------------------------------------------------------------------
// Fetch rates from external API
// ---------------------------------------------------------------------------

/**
 * Fetches exchange rates from exchangerate-api.com (free, no API key required)
 * and upserts them into the database.
 *
 * @param baseCurrency - The base currency code (e.g. 'USD')
 */
export async function fetchExchangeRates(baseCurrency: string): Promise<void> {
  const base = baseCurrency.toUpperCase();
  const url = `https://open.er-api.com/v6/latest/${base}`;

  logger.info('[exchange-rates] Fetching rates', { baseCurrency: base, url });

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    logger.error('[exchange-rates] API request failed', {
      status: response.status,
      body: text.slice(0, 500),
    });
    throw new Error(`Exchange rate API returned ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  if (data.result !== 'success' || !data.rates) {
    logger.error('[exchange-rates] Unexpected API response', { data });
    throw new Error('Exchange rate API returned unexpected format');
  }

  const now = new Date();
  const targetCurrencies = SUPPORTED_CURRENCIES.filter(c => c !== base);
  let upsertedCount = 0;

  for (const target of targetCurrencies) {
    const rate = data.rates[target];
    if (rate === undefined || rate === null) {
      logger.warn('[exchange-rates] No rate for currency pair', {
        from: base,
        to: target,
      });
      continue;
    }

    await prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: base,
          toCurrency: target,
        },
      },
      create: {
        fromCurrency: base,
        toCurrency: target,
        rate: new Prisma.Decimal(rate),
        source: 'api',
        fetchedAt: now,
      },
      update: {
        rate: new Prisma.Decimal(rate),
        source: 'api',
        fetchedAt: now,
      },
    });
    upsertedCount++;
  }

  logger.info('[exchange-rates] Rates updated', {
    baseCurrency: base,
    upsertedCount,
    targetCurrencies: targetCurrencies.length,
  });
}
