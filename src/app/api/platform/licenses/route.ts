/**
 * API: /api/platform/licenses
 * Employee license management — Per-seat billing for Koraline tenants.
 *
 * GET: Count employees by role, included vs billed
 * POST: Add a license (creates Stripe subscription item)
 * DELETE: Remove a license
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { getStripeAttitudes, KORALINE_PLANS, KORALINE_LICENSES, type KoralinePlan, type KoralineLicense } from '@/lib/stripe-attitudes';
import { getStripePriceId } from '@/lib/stripe-attitudes';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/csrf-middleware';

const addLicenseSchema = z.object({
  licenseType: z.string().min(1).refine((val) => val in KORALINE_LICENSES, {
    message: 'Type de licence invalide',
  }),
  userId: z.string().min(1),
});

const removeLicenseSchema = z.object({
  userId: z.string().min(1),
});

async function getAuthenticatedOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'OWNER') return null;
  return session.user;
}

/**
 * GET — Employee counts by role, included vs billed.
 */
export async function GET() {
  const user = await getAuthenticatedOwner();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, plan: true, maxEmployees: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Count employees by role (excluding owner)
    const employees = await prisma.user.groupBy({
      by: ['role'],
      where: {
        tenantId: tenant.id,
        role: { not: 'OWNER' },
      },
      _count: true,
    });

    const planConfig = KORALINE_PLANS[tenant.plan as KoralinePlan];
    const includedEmployees = planConfig?.includedEmployees || 0;
    const totalEmployees = employees.reduce((sum, e) => sum + e._count, 0);
    const billedEmployees = Math.max(0, totalEmployees - includedEmployees);

    const roleBreakdown = employees.map(e => {
      const roleLower = e.role.toLowerCase() as KoralineLicense;
      const licenseConfig = KORALINE_LICENSES[roleLower];
      return {
        role: e.role,
        count: e._count,
        monthlyPricePerSeat: licenseConfig?.monthlyPrice || 0,
        licenseName: licenseConfig?.name || e.role,
      };
    });

    return NextResponse.json({
      totalEmployees,
      includedEmployees,
      billedEmployees,
      roles: roleBreakdown,
      licenses: Object.entries(KORALINE_LICENSES).map(([key, lic]) => ({
        key,
        name: lic.name,
        monthlyPrice: lic.monthlyPrice,
      })),
    });
  } catch (error) {
    logger.error('Failed to get licenses', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST — Add a license for a new employee.
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
    const parsed = addLicenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { licenseType, userId } = parsed.data;

    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, plan: true, maxEmployees: true, stripeSubscriptionId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Count current employees
    const currentCount = await prisma.user.count({
      where: { tenantId: tenant.id, role: { not: 'OWNER' } },
    });

    const planConfig = KORALINE_PLANS[tenant.plan as KoralinePlan];
    const included = planConfig?.includedEmployees || 0;

    // If over included limit, add Stripe subscription item
    if (currentCount >= included && tenant.stripeSubscriptionId) {
      const stripe = getStripeAttitudes();
      const priceId = await getStripePriceId('module', licenseType);

      if (priceId) {
        await stripe.subscriptionItems.create({
          subscription: tenant.stripeSubscriptionId,
          price: priceId,
          quantity: 1,
          metadata: {
            koraline_license: licenseType,
            user_id: userId,
          },
        });
      }
    }

    logger.info('License added', { tenantId: tenant.id, licenseType, userId });

    return NextResponse.json({
      message: `Licence ${KORALINE_LICENSES[licenseType as KoralineLicense].name} ajoutée`,
      billed: currentCount >= included,
    });
  } catch (error) {
    logger.error('Failed to add license', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a license.
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
    const parsed = removeLicenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { userId } = parsed.data;

    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, stripeSubscriptionId: true },
    });

    if (!tenant || !tenant.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Find and remove the subscription item for this user
    const stripe = getStripeAttitudes();
    const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
    const item = subscription.items.data.find(i =>
      i.metadata?.user_id === userId && i.metadata?.koraline_license
    );

    if (item) {
      await stripe.subscriptionItems.del(item.id);
    }

    logger.info('License removed', { tenantId: tenant.id, userId });

    return NextResponse.json({ message: 'Licence retirée' });
  } catch (error) {
    logger.error('Failed to remove license', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
