/**
 * API: /api/platform/modules
 * Marketplace modules — Self-service module management for tenant owners.
 *
 * GET: List all available modules with status and pricing
 * POST: Activate a module (adds Stripe subscription item)
 * DELETE: Deactivate a module (option to keep data accumulation)
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import {
  getStripeAttitudes,
  KORALINE_MODULES,
  type KoralineModule,
} from '@/lib/stripe-attitudes';
import { getStripePriceId } from '@/lib/stripe-attitudes';
import { validateModuleActivation, validateModuleDeactivation } from '@/lib/module-dependencies';
import { startAccumulation, stopAccumulation, getAccumulationBillingStatus } from '@/lib/module-data-accumulation';
import { invalidateModuleFlags } from '@/lib/module-flags';
import { tenantModuleActivatedEmail } from '@/lib/email/templates/tenant-emails';
import { sendEmail } from '@/lib/email/email-service';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/csrf-middleware';

const activateModuleSchema = z.object({
  moduleKey: z.string().min(1).refine((val) => val in KORALINE_MODULES, {
    message: 'Module invalide',
  }),
});

const deactivateModuleSchema = z.object({
  moduleKey: z.string().min(1),
  keepAccumulation: z.boolean().optional(),
});

async function getAuthenticatedOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'OWNER') return null;
  return session.user;
}

/**
 * GET — List all modules with status, pricing, and compatibility.
 */
export async function GET() {
  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: {
        id: true,
        plan: true,
        modulesEnabled: true,
        featuresFlags: true,
        stripeSubscriptionId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const enabledModules = parseJson<string[]>(tenant.modulesEnabled, []);
    const flags = parseJson<{ modulesDataAccumulating?: Array<{ key: string; startedAt: string; freeUntil: string | null }> }>(tenant.featuresFlags, {});
    const accumulating = flags.modulesDataAccumulating || [];

    const modules = await Promise.all(
      Object.entries(KORALINE_MODULES).map(async ([key, mod]) => {
        const isActive = enabledModules.includes(key);
        const accumEntry = accumulating.find(a => a.key === key);
        const deps = validateModuleActivation(key, enabledModules, tenant.plan);

        let accumStatus = null;
        if (accumEntry) {
          accumStatus = await getAccumulationBillingStatus(tenant.id, key);
        }

        return {
          key,
          name: mod.name,
          description: (mod as { description?: string }).description || '',
          monthlyPrice: mod.monthlyPrice,
          isActive,
          isAccumulating: !!accumEntry,
          accumulation: accumStatus,
          canActivate: deps.valid,
          missingDeps: deps.missingDeps,
          requiredPlan: deps.requiredPlan || null,
        };
      })
    );

    return NextResponse.json({ modules, plan: tenant.plan });
  } catch (error) {
    logger.error('Failed to list modules', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST — Activate a module.
 */
export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfValid = await validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = activateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { moduleKey } = parsed.data;

    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        plan: true,
        modulesEnabled: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const enabledModules = parseJson<string[]>(tenant.modulesEnabled, []);

    // Already active?
    if (enabledModules.includes(moduleKey)) {
      return NextResponse.json({ message: 'Module déjà actif' });
    }

    // Validate dependencies
    const deps = validateModuleActivation(moduleKey, enabledModules, tenant.plan);
    if (!deps.valid) {
      return NextResponse.json({
        error: 'Dépendances non satisfaites',
        missingDeps: deps.missingDeps,
        requiredPlan: deps.requiredPlan,
      }, { status: 400 });
    }

    // Add to Stripe subscription
    if (tenant.stripeSubscriptionId) {
      const stripe = getStripeAttitudes();
      const priceId = await getStripePriceId('module', moduleKey);

      if (priceId) {
        await stripe.subscriptionItems.create({
          subscription: tenant.stripeSubscriptionId,
          price: priceId,
          quantity: 1,
          metadata: { koraline_module: moduleKey, tenant_slug: tenant.slug },
        });
      }
    }

    // Update tenant modules
    enabledModules.push(moduleKey);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { modulesEnabled: JSON.stringify(enabledModules) },
    });

    // Update feature flag
    await prisma.siteSetting.upsert({
      where: { key: `ff.${moduleKey}_module` },
      update: { value: 'true' },
      create: { key: `ff.${moduleKey}_module`, value: 'true' },
    });
    invalidateModuleFlags();

    // Stop accumulation if it was running
    await stopAccumulation(tenant.id, moduleKey);

    const mod = KORALINE_MODULES[moduleKey as KoralineModule];
    logger.info('Module activated', { tenantId: tenant.id, moduleKey });

    // Send email notification (non-blocking)
    const emailData = tenantModuleActivatedEmail({
      tenantName: tenant.name,
      ownerName: tenant.name,
      moduleName: mod.name,
      monthlyPrice: mod.monthlyPrice,
      adminUrl: `https://${tenant.slug}.koraline.app/admin/abonnement/modules`,
    });
    sendEmail({
      to: { email: user.email || '' },
      subject: emailData.subject,
      html: emailData.html,
      emailType: 'transactional',
    }).catch(() => {});

    return NextResponse.json({
      message: `Module ${mod.name} activé`,
      moduleKey,
      monthlyPrice: mod.monthlyPrice,
    });
  } catch (error) {
    logger.error('Failed to activate module', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE — Deactivate a module (with optional data accumulation).
 */
export async function DELETE(request: NextRequest) {
  // CSRF validation
  const csrfValid = await validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deactivateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { moduleKey, keepAccumulation } = parsed.data;

    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: {
        id: true,
        slug: true,
        plan: true,
        modulesEnabled: true,
        stripeSubscriptionId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const enabledModules = parseJson<string[]>(tenant.modulesEnabled, []);

    if (!enabledModules.includes(moduleKey)) {
      return NextResponse.json({ message: 'Module déjà inactif' });
    }

    // Validate deactivation (check dependents)
    const deps = validateModuleDeactivation(moduleKey, enabledModules);
    if (!deps.valid) {
      return NextResponse.json({
        error: 'Ce module est requis par d\'autres modules actifs',
        dependentModules: deps.dependentModules,
      }, { status: 400 });
    }

    // Remove from Stripe subscription
    if (tenant.stripeSubscriptionId) {
      const stripe = getStripeAttitudes();
      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
      const item = subscription.items.data.find(i =>
        i.metadata?.koraline_module === moduleKey
      );
      if (item) {
        await stripe.subscriptionItems.del(item.id);
      }
    }

    // Update tenant modules
    const updated = enabledModules.filter(m => m !== moduleKey);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { modulesEnabled: JSON.stringify(updated) },
    });

    // Update feature flag
    await prisma.siteSetting.upsert({
      where: { key: `ff.${moduleKey}_module` },
      update: { value: 'false' },
      create: { key: `ff.${moduleKey}_module`, value: 'false' },
    });
    invalidateModuleFlags();

    // Start data accumulation if requested
    if (keepAccumulation) {
      const hasPlan = tenant.plan !== 'alacarte';
      await startAccumulation(tenant.id, moduleKey, hasPlan);
    }

    logger.info('Module deactivated', { tenantId: tenant.id, moduleKey, keepAccumulation });

    return NextResponse.json({
      message: `Module ${moduleKey} désactivé`,
      accumulating: !!keepAccumulation,
    });
  } catch (error) {
    logger.error('Failed to deactivate module', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function parseJson<T>(data: unknown, fallback: T): T {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return fallback; }
  }
  if (data !== null && data !== undefined) return data as T;
  return fallback;
}
