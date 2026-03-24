/**
 * API: GET /api/platform/invoices
 * List Stripe invoices for the current tenant.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { getStripeAttitudes } from '@/lib/stripe-attitudes';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = getStripeAttitudes();
    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit: 24,
    });

    const formatted = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      date: inv.created,
      dueDate: inv.due_date,
      status: inv.status,
      total: inv.total,
      currency: inv.currency,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
    }));

    return NextResponse.json({ invoices: formatted });
  } catch (error) {
    logger.error('Failed to list invoices', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
