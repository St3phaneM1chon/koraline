/**
 * API: /api/admin/platform/clients/[id]/subscription
 * Super-admin only — Manage tenant Stripe subscription (plan + modules).
 * GET:  Current subscription details from Stripe
 * PUT:  Change plan and/or modules with proration
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  KORALINE_PLANS,
  KORALINE_MODULES,
  type KoralinePlan,
} from '@/lib/stripe-constants';
import { getStripeAttitudes, getStripePriceId } from '@/lib/stripe-attitudes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSuperAdmin(session: { user: { role?: string; tenantId?: string } }): boolean {
  return session.user.role === 'OWNER' && session.user.tenantId === process.env.PLATFORM_TENANT_ID;
}

function parseModules(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }
  return [];
}

// Base module keys that come included with plans (not billed as add-ons)
const BASE_MODULE_KEYS = new Set([
  'commerce', 'catalogue', 'marketing', 'emails', 'comptabilite', 'systeme',
  'crm', 'communaute', 'media', 'loyalty',
]);

// ---------------------------------------------------------------------------
// GET — Current subscription details
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (_request, { session, params }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  const tenantId = params?.id;
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        modulesEnabled: true,
        maxEmployees: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const modules = parseModules(tenant.modulesEnabled);
    const planInfo = KORALINE_PLANS[tenant.plan as KoralinePlan];

    // Base response without Stripe details
    const baseResponse = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      planName: planInfo?.name || tenant.plan,
      planMonthlyPrice: planInfo?.monthlyPrice || 0,
      includedEmployees: planInfo?.includedEmployees ?? 0,
      maxEmployees: tenant.maxEmployees,
      modulesEnabled: modules,
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
      stripe: null as Record<string, unknown> | null,
    };

    // Fetch Stripe subscription details if available
    if (tenant.stripeSubscriptionId) {
      try {
        const stripe = getStripeAttitudes();
        const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId, {
          expand: ['items.data.price.product'],
        });

        const items = subscription.items.data.map((item) => {
          const price = item.price;
          const product = typeof price.product === 'object' && price.product !== null
            ? price.product
            : null;
          return {
            id: item.id,
            priceId: price.id,
            productName: product && 'name' in product ? (product as { name: string }).name : null,
            unitAmount: price.unit_amount,
            currency: price.currency,
            quantity: item.quantity,
          };
        });

        baseResponse.stripe = {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          items,
          latestInvoice: typeof subscription.latest_invoice === 'string'
            ? subscription.latest_invoice
            : subscription.latest_invoice?.id || null,
        };
      } catch (stripeErr) {
        logger.warn('Failed to fetch Stripe subscription details', {
          tenantId,
          subscriptionId: tenant.stripeSubscriptionId,
          error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
        });
        // Return base response without Stripe details rather than failing
      }
    }

    return NextResponse.json(baseResponse);
  } catch (error) {
    logger.error('Failed to get subscription details', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });

// ---------------------------------------------------------------------------
// PUT — Change plan and/or modules
// ---------------------------------------------------------------------------

const updateSubscriptionSchema = z.object({
  plan: z.enum(['essential', 'pro', 'enterprise']).optional(),
  modulesEnabled: z.array(
    z.string().refine(
      (m) => m in KORALINE_MODULES || BASE_MODULE_KEYS.has(m),
      'Invalid module key'
    )
  ).optional(),
});

export const PUT = withAdminGuard(async (request, { session, params }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  const tenantId = params?.id;
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Must provide at least one of plan or modules
    if (!data.plan && !data.modulesEnabled) {
      return NextResponse.json({ error: 'Must provide plan and/or modulesEnabled' }, { status: 400 });
    }

    // Fetch current tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const oldPlan = tenant.plan;
    const oldModules = parseModules(tenant.modulesEnabled);
    const newPlan = data.plan || oldPlan;
    const newPlanInfo = KORALINE_PLANS[newPlan as KoralinePlan];

    if (!newPlanInfo) {
      return NextResponse.json({ error: `Unknown plan: ${newPlan}` }, { status: 400 });
    }

    // Compute new modules list: plan base modules + requested add-ons
    const planBaseModules = newPlanInfo.includedModules as readonly string[];
    const requestedModules = data.modulesEnabled ?? oldModules;
    const allModules = [...new Set([...planBaseModules, ...requestedModules])];

    // Identify add-on modules (those not included in the plan, billed separately)
    const addOnModules = allModules.filter(
      (mod) => !planBaseModules.includes(mod) && !BASE_MODULE_KEYS.has(mod)
    );

    // Compute what changed
    const planChanged = data.plan !== undefined && data.plan !== oldPlan;
    const modulesChanged = data.modulesEnabled !== undefined &&
      (JSON.stringify([...oldModules].sort()) !== JSON.stringify([...allModules].sort()));

    if (!planChanged && !modulesChanged) {
      return NextResponse.json({
        message: 'No changes detected',
        tenant: { id: tenant.id, plan: oldPlan, modulesEnabled: oldModules, maxEmployees: tenant.maxEmployees },
      });
    }

    // -----------------------------------------------------------------------
    // Stripe: Update subscription if tenant has one
    // -----------------------------------------------------------------------
    let stripeResult: Record<string, unknown> | null = null;

    if (tenant.stripeSubscriptionId) {
      try {
        const stripe = getStripeAttitudes();
        const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        const existingItems = subscription.items.data;

        // Build the new desired set of price IDs
        const desiredPriceIds: { priceId: string; type: string; key: string }[] = [];

        // Plan price
        const newPlanPriceId = await getStripePriceId('plan', newPlan);
        if (newPlanPriceId) {
          desiredPriceIds.push({ priceId: newPlanPriceId, type: 'plan', key: newPlan });
        }

        // Add-on module prices
        for (const mod of addOnModules) {
          const modPriceId = await getStripePriceId('module', mod).catch(() => null);
          if (modPriceId) {
            desiredPriceIds.push({ priceId: modPriceId, type: 'module', key: mod });
          }
        }

        // Build items array for subscription update
        // Strategy: specify all desired items; Stripe will add/remove as needed
        const updateItems: Array<{
          id?: string;
          price?: string;
          quantity?: number;
          deleted?: boolean;
        }> = [];

        const matchedExistingIds = new Set<string>();

        // For each desired price, find existing item or create new
        for (const desired of desiredPriceIds) {
          const existingItem = existingItems.find((item) => item.price.id === desired.priceId);
          if (existingItem) {
            // Keep existing item (no change needed)
            matchedExistingIds.add(existingItem.id);
          } else {
            // Add new item
            updateItems.push({ price: desired.priceId, quantity: 1 });
          }
        }

        // Mark items to remove (existing items not in desired set)
        for (const existing of existingItems) {
          if (!matchedExistingIds.has(existing.id)) {
            // Check if a different price for the same type exists in desired set
            const isDesired = desiredPriceIds.some((d) => d.priceId === existing.price.id);
            if (!isDesired) {
              updateItems.push({ id: existing.id, deleted: true });
            }
          }
        }

        // Apply update if there are changes
        if (updateItems.length > 0) {
          const updatedSubscription = await stripe.subscriptions.update(
            tenant.stripeSubscriptionId,
            {
              items: updateItems,
              proration_behavior: 'create_prorations',
              metadata: {
                tenantId: tenant.id,
                tenant_slug: tenant.slug,
                plan: newPlan,
              },
            }
          );

          stripeResult = {
            subscriptionId: updatedSubscription.id,
            status: updatedSubscription.status,
            itemsUpdated: updateItems.length,
            prorationBehavior: 'create_prorations',
          };
        } else {
          stripeResult = { message: 'No Stripe item changes needed' };
        }
      } catch (stripeErr) {
        // Log but don't block DB update — Stripe can be reconciled later
        logger.error('Failed to update Stripe subscription', {
          tenantId,
          subscriptionId: tenant.stripeSubscriptionId,
          error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
        });
        stripeResult = {
          error: 'Stripe update failed — DB updated, reconcile manually',
          details: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
        };
      }
    }

    // -----------------------------------------------------------------------
    // DB: Update tenant in a transaction with audit event
    // -----------------------------------------------------------------------
    const newMaxEmployees = newPlanInfo.includedEmployees;
    const actor = session.user.email || 'super-admin';

    const updatedTenant = await prisma.$transaction(async (tx) => {
      // Update tenant
      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          plan: newPlan,
          modulesEnabled: JSON.stringify(allModules),
          maxEmployees: newMaxEmployees,
        },
      });

      // Create audit events
      if (planChanged) {
        await tx.tenantEvent.create({
          data: {
            tenantId,
            type: 'PLAN_CHANGED',
            actor,
            details: {
              from: oldPlan,
              to: newPlan,
              oldMaxEmployees: tenant.maxEmployees,
              newMaxEmployees,
              stripeResult: stripeResult ? { updated: true } : null,
            },
          },
        });
      }

      if (modulesChanged) {
        const added = allModules.filter((m) => !oldModules.includes(m));
        const removed = oldModules.filter((m) => !allModules.includes(m));
        await tx.tenantEvent.create({
          data: {
            tenantId,
            type: 'MODULES_CHANGED',
            actor,
            details: {
              from: oldModules,
              to: allModules,
              added,
              removed,
              addOnModules,
            },
          },
        });
      }

      return updated;
    });

    logger.info('Subscription updated', {
      tenantId,
      planChanged,
      modulesChanged,
      oldPlan,
      newPlan,
      oldModules,
      newModules: allModules,
      stripeUpdated: !!stripeResult && !('error' in stripeResult),
    });

    return NextResponse.json({
      tenant: {
        id: updatedTenant.id,
        plan: updatedTenant.plan,
        modulesEnabled: allModules,
        maxEmployees: updatedTenant.maxEmployees,
      },
      changes: {
        planChanged,
        modulesChanged,
        oldPlan: planChanged ? oldPlan : undefined,
        newPlan: planChanged ? newPlan : undefined,
        oldModules: modulesChanged ? oldModules : undefined,
        newModules: modulesChanged ? allModules : undefined,
      },
      stripe: stripeResult,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Failed to update subscription', {
      tenantId,
      error: errMsg,
    });
    return NextResponse.json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { details: errMsg }),
    }, { status: 500 });
  }
});
