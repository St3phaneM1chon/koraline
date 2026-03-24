/**
 * Stripe Catalog Cache
 *
 * In-memory cache of Stripe Price IDs with auto-heal.
 * Reads from SiteSetting (synced by stripe-sync-products.ts).
 */

import { prisma } from '@/lib/db';
import { cachedQuery, CacheTags } from '@/lib/cache';
import { KORALINE_MODULES, type KoralineModule } from '@/lib/stripe-attitudes';

const CACHE_TTL = 3600; // 1 hour

/**
 * Get all Stripe Price IDs for modules (batch lookup).
 */
export async function getModulePriceIds(): Promise<Record<string, string>> {
  return cachedQuery(
    'stripe-catalog:module-prices',
    CACHE_TTL,
    async () => {
      const settings = await prisma.siteSetting.findMany({
        where: { key: { startsWith: 'stripe.price.module.' } },
        select: { key: true, value: true },
        take: 100,
      });
      const map: Record<string, string> = {};
      for (const s of settings) {
        const moduleKey = s.key.replace('stripe.price.module.', '');
        map[moduleKey] = s.value;
      }
      return map;
    },
    [CacheTags.SITE_SETTINGS],
  );
}

/**
 * Get the data accumulation price ID for a module.
 */
export async function getAccumulationPriceId(moduleKey: KoralineModule): Promise<string | null> {
  const result = await cachedQuery(
    `stripe-catalog:accumulation:${moduleKey}`,
    CACHE_TTL,
    async () => {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: `stripe.price.accumulation.${moduleKey}` },
        select: { value: true },
      });
      return { priceId: setting?.value || null };
    },
    [CacheTags.SITE_SETTINGS],
  );
  return result.priceId;
}

/**
 * Get all plan price IDs.
 */
export async function getPlanPriceIds(): Promise<Record<string, string>> {
  return cachedQuery(
    'stripe-catalog:plan-prices',
    CACHE_TTL,
    async () => {
      const settings = await prisma.siteSetting.findMany({
        where: { key: { startsWith: 'stripe.price.plan.' } },
        select: { key: true, value: true },
        take: 100,
      });
      const map: Record<string, string> = {};
      for (const s of settings) {
        const planKey = s.key.replace('stripe.price.plan.', '');
        map[planKey] = s.value;
      }
      return map;
    },
    [CacheTags.SITE_SETTINGS],
  );
}

/**
 * Get license price IDs.
 */
export async function getLicensePriceIds(): Promise<Record<string, string>> {
  return cachedQuery(
    'stripe-catalog:license-prices',
    CACHE_TTL,
    async () => {
      const settings = await prisma.siteSetting.findMany({
        where: { key: { startsWith: 'stripe.price.license.' } },
        select: { key: true, value: true },
        take: 100,
      });
      const map: Record<string, string> = {};
      for (const s of settings) {
        const licKey = s.key.replace('stripe.price.license.', '');
        map[licKey] = s.value;
      }
      return map;
    },
    [CacheTags.SITE_SETTINGS],
  );
}

/**
 * Calculate the data accumulation monthly price for a module (15% of unit price).
 */
export function getAccumulationMonthlyPrice(moduleKey: KoralineModule): number {
  const mod = KORALINE_MODULES[moduleKey];
  if (!mod) return 0;
  return Math.round(mod.monthlyPrice * 0.15);
}
