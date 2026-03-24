/**
 * API: POST /api/platform/billing-portal
 * Creates a Stripe Billing Portal session for the tenant owner.
 * Allows managing payment methods, viewing invoices, and cancelling.
 */

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { getStripeAttitudes } from '@/lib/stripe-attitudes';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/csrf-middleware';

export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfValid = await validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user || session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { ownerUserId: session.user.id },
      select: { stripeCustomerId: true, slug: true },
    });

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const stripe = getStripeAttitudes();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${origin}/admin/abonnement`,
    });

    logger.info('Billing portal session created', { slug: tenant.slug });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    logger.error('Failed to create billing portal session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
