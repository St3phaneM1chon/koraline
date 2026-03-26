/**
 * API: GET /api/admin/platform/clients/[id]/invoices
 * Super-admin only — List Stripe invoices for a specific tenant.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { getStripeAttitudes } from '@/lib/stripe-attitudes';
import { logger } from '@/lib/logger';

function isSuperAdmin(session: { user: { role?: string; tenantId?: string } }): boolean {
  return session.user.role === 'OWNER' && session.user.tenantId === process.env.PLATFORM_TENANT_ID;
}

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
      select: { stripeCustomerId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = getStripeAttitudes();
    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit: 50,
    });

    const formatted = invoices.data
      .map(inv => ({
        id: inv.id,
        number: inv.number,
        date: inv.created,
        dueDate: inv.due_date,
        amount: inv.total,
        currency: inv.currency,
        status: inv.status,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        attemptCount: inv.attempt_count,
      }))
      .sort((a, b) => (b.date || 0) - (a.date || 0));

    return NextResponse.json({ invoices: formatted });
  } catch (error) {
    logger.error('Failed to list client invoices', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });
