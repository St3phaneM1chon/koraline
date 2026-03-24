/**
 * Module Data Accumulation — D35/D36 Implementation
 *
 * Manages "data accumulation" mode for inactive modules:
 * - Data continues to flow in background
 * - Free for 12 months with a plan, 15% of module price after
 * - Loyalty incentive: activate within 12 months → 24-month discount
 *
 * NOTE: Accumulation data is stored in tenant.featuresFlags.modulesDataAccumulating
 */

import { prisma } from '@/lib/db';
import { KORALINE_MODULES, type KoralineModule } from '@/lib/stripe-attitudes';
import {
  KORALINE_DATA_ACCUMULATION_RATE,
  KORALINE_FREE_ACCUMULATION_MONTHS,
  KORALINE_LOYALTY_DISCOUNTS,
} from '@/lib/stripe-constants';

export interface AccumulationEntry {
  key: string;
  startedAt: string;
  freeUntil: string | null; // null = no free period (a la carte)
}

export interface AccumulationStatus {
  isAccumulating: boolean;
  isFree: boolean;
  freeUntil: string | null;
  monthlyRate: number; // in cents
  startedAt: string | null;
}

interface FeaturesFlags {
  modulesDataAccumulating?: AccumulationEntry[];
  [key: string]: unknown;
}

function parseFeaturesFlags(data: unknown): FeaturesFlags {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return {}; }
  }
  if (data && typeof data === 'object') return data as FeaturesFlags;
  return {};
}

function getAccumulatingFromFlags(flags: FeaturesFlags): AccumulationEntry[] {
  return flags.modulesDataAccumulating || [];
}

/**
 * Check if a module is currently accumulating data for a tenant.
 */
export async function isModuleAccumulating(
  tenantId: string,
  moduleKey: string
): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { featuresFlags: true },
  });
  if (!tenant) return false;

  const flags = parseFeaturesFlags(tenant.featuresFlags);
  const accumulating = getAccumulatingFromFlags(flags);
  return accumulating.some(a => a.key === moduleKey);
}

/**
 * Get the billing status for a module's data accumulation.
 */
export async function getAccumulationBillingStatus(
  tenantId: string,
  moduleKey: string
): Promise<AccumulationStatus> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { featuresFlags: true },
  });

  if (!tenant) {
    return { isAccumulating: false, isFree: false, freeUntil: null, monthlyRate: 0, startedAt: null };
  }

  const flags = parseFeaturesFlags(tenant.featuresFlags);
  const accumulating = getAccumulatingFromFlags(flags);
  const entry = accumulating.find(a => a.key === moduleKey);

  if (!entry) {
    return { isAccumulating: false, isFree: false, freeUntil: null, monthlyRate: 0, startedAt: null };
  }

  const now = new Date();
  const isFree = entry.freeUntil ? new Date(entry.freeUntil) > now : false;
  const mod = KORALINE_MODULES[moduleKey as KoralineModule];
  const monthlyRate = mod ? Math.round(mod.monthlyPrice * KORALINE_DATA_ACCUMULATION_RATE) : 0;

  return {
    isAccumulating: true,
    isFree,
    freeUntil: entry.freeUntil,
    monthlyRate: isFree ? 0 : monthlyRate,
    startedAt: entry.startedAt,
  };
}

/**
 * Start data accumulation for a module.
 */
export async function startAccumulation(
  tenantId: string,
  moduleKey: string,
  hasPlan: boolean
): Promise<AccumulationEntry> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { featuresFlags: true, createdAt: true },
  });
  if (!tenant) throw new Error('Tenant not found');

  const flags = parseFeaturesFlags(tenant.featuresFlags);
  const accumulating = getAccumulatingFromFlags(flags);

  // Check not already accumulating
  if (accumulating.some(a => a.key === moduleKey)) {
    return accumulating.find(a => a.key === moduleKey)!;
  }

  let freeUntil: string | null = null;
  if (hasPlan) {
    const freeDate = new Date(tenant.createdAt);
    freeDate.setMonth(freeDate.getMonth() + KORALINE_FREE_ACCUMULATION_MONTHS);
    // Only give free period if still within 12 months of tenant creation
    if (freeDate > new Date()) {
      freeUntil = freeDate.toISOString();
    }
  }

  const entry: AccumulationEntry = {
    key: moduleKey,
    startedAt: new Date().toISOString(),
    freeUntil,
  };

  accumulating.push(entry);
  flags.modulesDataAccumulating = accumulating;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { featuresFlags: JSON.stringify(flags) },
  });

  return entry;
}

/**
 * Stop data accumulation (module fully activated or cancelled).
 */
export async function stopAccumulation(
  tenantId: string,
  moduleKey: string
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { featuresFlags: true },
  });
  if (!tenant) return;

  const flags = parseFeaturesFlags(tenant.featuresFlags);
  const accumulating = getAccumulatingFromFlags(flags);
  const filtered = accumulating.filter(a => a.key !== moduleKey);
  flags.modulesDataAccumulating = filtered;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { featuresFlags: JSON.stringify(flags) },
  });
}

/**
 * Calculate loyalty discount tier based on number of modules activated within 12 months.
 */
export function calculateLoyaltyDiscount(
  activatedModulesCount: number,
  totalModulesCount: number
): { rate: number; term: number; tier: string } | null {
  if (activatedModulesCount >= totalModulesCount) {
    return { ...KORALINE_LOYALTY_DISCOUNTS.full, tier: 'full' };
  }
  if (activatedModulesCount >= 2) {
    return { ...KORALINE_LOYALTY_DISCOUNTS.double, tier: 'double' };
  }
  if (activatedModulesCount >= 1) {
    return { ...KORALINE_LOYALTY_DISCOUNTS.single, tier: 'single' };
  }
  return null;
}

/**
 * Check if tenant is eligible for loyalty discount (within 12 months of creation).
 */
export async function isEligibleForLoyaltyDiscount(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { createdAt: true, plan: true },
  });
  if (!tenant || tenant.plan === 'alacarte') return false;

  const eligibilityEnd = new Date(tenant.createdAt);
  eligibilityEnd.setMonth(eligibilityEnd.getMonth() + KORALINE_FREE_ACCUMULATION_MONTHS);
  return new Date() < eligibilityEnd;
}
