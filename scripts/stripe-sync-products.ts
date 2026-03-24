/**
 * Script: Stripe Product & Price Catalog Sync
 *
 * Synchronizes KORALINE_PLANS, KORALINE_MODULES, and KORALINE_LICENSES
 * from stripe-attitudes.ts into real Stripe Products + Prices.
 *
 * Idempotent: checks metadata.koraline_key before creating.
 * Stores Price IDs in SiteSetting for runtime lookup.
 *
 * Usage: npx tsx scripts/stripe-sync-products.ts
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getStripe(): Stripe {
  const key = process.env.STRIPE_ATTITUDES_SECRET_KEY;
  if (!key) throw new Error('STRIPE_ATTITUDES_SECRET_KEY required');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

// ---------------------------------------------------------------------------
// Constants (mirrored from stripe-attitudes.ts to avoid import issues in scripts)
// ---------------------------------------------------------------------------

const PLANS = {
  essential: { name: 'Koraline Essentiel', description: 'Boutique en ligne complete pour petites entreprises', monthlyPrice: 14900 },
  pro: { name: 'Koraline Pro', description: 'Suite complete pour PME actives', monthlyPrice: 29900 },
  enterprise: { name: 'Koraline Enterprise', description: 'Suite complete pour grandes entreprises', monthlyPrice: 59900 },
} as const;

const MODULES = {
  crm_advanced: { name: 'CRM Avance', monthlyPrice: 14900 },
  marketplace_starter: { name: 'Marketplace Starter', monthlyPrice: 9900 },
  marketplace_pro: { name: 'Marketplace Pro', monthlyPrice: 24900 },
  marketplace_enterprise: { name: 'Marketplace Enterprise', monthlyPrice: 49900 },
  chat: { name: 'Chat & Tickets', monthlyPrice: 4900 },
  email_marketing: { name: 'Email Marketing', monthlyPrice: 4900 },
  loyalty: { name: 'Programme Fidelite', monthlyPrice: 3900 },
  subscriptions: { name: 'Abonnements & Recurrent', monthlyPrice: 2900 },
  ambassadors: { name: 'Ambassadeurs & Affiliation', monthlyPrice: 1900 },
  monitoring: { name: 'Monitoring & Webhooks', monthlyPrice: 2900 },
  accounting_advanced: { name: 'Comptabilite Avancee', monthlyPrice: 9900 },
} as const;

const LICENSES = {
  admin: { name: 'Licence Admin', monthlyPrice: 3500 },
  manager: { name: 'Licence Gestionnaire', monthlyPrice: 2500 },
  employee: { name: 'Licence Employe', monthlyPrice: 1500 },
  readonly: { name: 'Licence Lecture seule', monthlyPrice: 500 },
} as const;

const DATA_ACCUMULATION_RATE = 0.15; // 15% of module price

const LOYALTY_TIERS = {
  single: { discount: 10, couponName: 'Fidelite 1 module -10%' },
  double: { discount: 15, couponName: 'Fidelite 2 modules -15%' },
  full: { discount: 25, couponName: 'Fidelite Suite complete -25%' },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findExistingProduct(stripe: Stripe, koralineKey: string): Promise<Stripe.Product | null> {
  const products = await stripe.products.search({
    query: `metadata["koraline_key"]:"${koralineKey}"`,
  });
  return products.data[0] || null;
}

async function findExistingPrice(stripe: Stripe, koralineKey: string): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.search({
    query: `metadata["koraline_key"]:"${koralineKey}"`,
  });
  return prices.data[0] || null;
}

async function storePriceId(key: string, priceId: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: priceId },
    create: { key, value: priceId },
  });
}

// ---------------------------------------------------------------------------
// Sync Functions
// ---------------------------------------------------------------------------

async function syncPlans(stripe: Stripe) {
  console.log('\n--- Syncing Plans ---');
  for (const [key, plan] of Object.entries(PLANS)) {
    const koralineKey = `plan_${key}`;

    let product = await findExistingProduct(stripe, koralineKey);
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { koraline_key: koralineKey, type: 'plan' },
      });
      console.log(`  Created product: ${plan.name} (${product.id})`);
    } else {
      console.log(`  Exists: ${plan.name} (${product.id})`);
    }

    // Monthly price
    const priceKey = `price_plan_${key}_monthly`;
    let price = await findExistingPrice(stripe, priceKey);
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'cad',
        unit_amount: plan.monthlyPrice,
        recurring: { interval: 'month' },
        metadata: { koraline_key: priceKey },
      });
      console.log(`    Created price: ${plan.monthlyPrice / 100} CAD/mo (${price.id})`);
    } else {
      console.log(`    Price exists: ${price.id}`);
    }
    await storePriceId(`stripe.price.plan.${key}`, price.id);
  }
}

async function syncModules(stripe: Stripe) {
  console.log('\n--- Syncing Modules ---');
  for (const [key, mod] of Object.entries(MODULES)) {
    const koralineKey = `module_${key}`;

    let product = await findExistingProduct(stripe, koralineKey);
    if (!product) {
      product = await stripe.products.create({
        name: `Module: ${mod.name}`,
        metadata: { koraline_key: koralineKey, type: 'module' },
      });
      console.log(`  Created product: ${mod.name} (${product.id})`);
    } else {
      console.log(`  Exists: ${mod.name} (${product.id})`);
    }

    // Unit monthly price
    const priceKey = `price_module_${key}_monthly`;
    let price = await findExistingPrice(stripe, priceKey);
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'cad',
        unit_amount: mod.monthlyPrice,
        recurring: { interval: 'month' },
        metadata: { koraline_key: priceKey },
      });
      console.log(`    Created price: ${mod.monthlyPrice / 100} CAD/mo (${price.id})`);
    } else {
      console.log(`    Price exists: ${price.id}`);
    }
    await storePriceId(`stripe.price.module.${key}`, price.id);

    // Data accumulation price (15% of module price)
    const accumPrice = Math.round(mod.monthlyPrice * DATA_ACCUMULATION_RATE);
    const accumPriceKey = `price_accumulation_${key}`;
    let accumPriceObj = await findExistingPrice(stripe, accumPriceKey);
    if (!accumPriceObj) {
      accumPriceObj = await stripe.prices.create({
        product: product.id,
        currency: 'cad',
        unit_amount: accumPrice,
        recurring: { interval: 'month' },
        nickname: `Accumulation donnees: ${mod.name}`,
        metadata: { koraline_key: accumPriceKey, type: 'accumulation' },
      });
      console.log(`    Created accumulation price: ${accumPrice / 100} CAD/mo (${accumPriceObj.id})`);
    } else {
      console.log(`    Accumulation price exists: ${accumPriceObj.id}`);
    }
    await storePriceId(`stripe.price.accumulation.${key}`, accumPriceObj.id);
  }
}

async function syncLicenses(stripe: Stripe) {
  console.log('\n--- Syncing Licenses ---');
  for (const [key, lic] of Object.entries(LICENSES)) {
    const koralineKey = `license_${key}`;

    let product = await findExistingProduct(stripe, koralineKey);
    if (!product) {
      product = await stripe.products.create({
        name: lic.name,
        metadata: { koraline_key: koralineKey, type: 'license' },
      });
      console.log(`  Created product: ${lic.name} (${product.id})`);
    } else {
      console.log(`  Exists: ${lic.name} (${product.id})`);
    }

    const priceKey = `price_license_${key}_monthly`;
    let price = await findExistingPrice(stripe, priceKey);
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'cad',
        unit_amount: lic.monthlyPrice,
        recurring: { interval: 'month' },
        metadata: { koraline_key: priceKey },
      });
      console.log(`    Created price: ${lic.monthlyPrice / 100} CAD/mo (${price.id})`);
    } else {
      console.log(`    Price exists: ${price.id}`);
    }
    await storePriceId(`stripe.price.license.${key}`, price.id);
  }
}

async function syncSocleMini(stripe: Stripe) {
  console.log('\n--- Syncing Socle Mini (a la carte) ---');
  const koralineKey = 'socle_mini';

  let product = await findExistingProduct(stripe, koralineKey);
  if (!product) {
    product = await stripe.products.create({
      name: 'Koraline Socle Mini',
      description: 'Dashboard + Systeme + Permissions (gratuit)',
      metadata: { koraline_key: koralineKey, type: 'socle' },
    });
    console.log(`  Created product: Socle Mini (${product.id})`);
  } else {
    console.log(`  Exists: Socle Mini (${product.id})`);
  }

  const priceKey = 'price_socle_mini';
  let price = await findExistingPrice(stripe, priceKey);
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'cad',
      unit_amount: 0,
      recurring: { interval: 'month' },
      metadata: { koraline_key: priceKey },
    });
    console.log(`    Created price: 0 CAD/mo (${price.id})`);
  } else {
    console.log(`    Price exists: ${price.id}`);
  }
  await storePriceId('stripe.price.socle_mini', price.id);
}

async function syncLoyaltyCoupons(stripe: Stripe) {
  console.log('\n--- Syncing Loyalty Coupons ---');
  for (const [tier, config] of Object.entries(LOYALTY_TIERS)) {
    const koralineKey = `coupon_loyalty_${tier}`;

    // Check existing coupons
    const coupons = await stripe.coupons.list({ limit: 100 });
    const existing = coupons.data.find(c => c.metadata?.koraline_key === koralineKey);

    if (!existing) {
      const coupon = await stripe.coupons.create({
        percent_off: config.discount,
        duration: 'repeating',
        duration_in_months: 24,
        name: config.couponName,
        metadata: { koraline_key: koralineKey, type: 'loyalty' },
      });
      console.log(`  Created coupon: ${config.couponName} (${coupon.id})`);
      await storePriceId(`stripe.coupon.loyalty.${tier}`, coupon.id);
    } else {
      console.log(`  Exists: ${config.couponName} (${existing.id})`);
      await storePriceId(`stripe.coupon.loyalty.${tier}`, existing.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Stripe Catalog Sync for Koraline ===');
  const stripe = getStripe();

  await syncPlans(stripe);
  await syncModules(stripe);
  await syncLicenses(stripe);
  await syncSocleMini(stripe);
  await syncLoyaltyCoupons(stripe);

  console.log('\n=== Sync Complete ===');

  // Verify stored prices
  const settings = await prisma.siteSetting.findMany({
    where: { key: { startsWith: 'stripe.' } },
    orderBy: { key: 'asc' },
  });
  console.log(`\nStored ${settings.length} Stripe price/coupon IDs in SiteSetting:`);
  for (const s of settings) {
    console.log(`  ${s.key} = ${s.value}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
