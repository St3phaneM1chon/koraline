/**
 * Unified Accounting Service
 * Creates journal entries for ALL purchasable items:
 * - CourseOrder (LMS)
 * - Membership (recurring)
 * - Booking (appointments/services)
 * - EventRegistration (paid events)
 *
 * Mirrors the pattern from webhook-accounting.service.ts but for non-ecommerce transactions.
 */

import { prisma } from '@/lib/db';
import { getNextEntryNumber, getAccountId } from './webhook-accounting.service';
import { assertPeriodOpen } from '@/lib/accounting/validation';
import { logger } from '@/lib/logger';

// Account codes for service revenue (not product sales)
const SERVICE_ACCOUNTS = {
  SERVICE_REVENUE: '4600', // Revenue from services (courses, bookings, memberships)
  CASH_STRIPE: '1050',     // Stripe cash account
  TPS_PAYABLE: '2310',     // TPS collected
  TVQ_PAYABLE: '2320',     // TVQ collected
};

interface UnifiedTransaction {
  type: 'course_order' | 'membership' | 'booking' | 'event_registration';
  referenceId: string;
  tenantId: string;
  amount: number;
  currency: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  stripePaymentIntentId?: string | null;
  taxTps?: number;
  taxTvq?: number;
  paidAt: Date;
}

/**
 * Create accounting entries for any non-ecommerce transaction.
 * Idempotent: checks if entry already exists for this reference.
 */
export async function createAccountingEntryForTransaction(
  tx: UnifiedTransaction
): Promise<{ journalEntryId: string } | null> {
  try {
    // Check accounting period
    await assertPeriodOpen(tx.paidAt);

    // Idempotency: check if entry already exists
    const existing = await prisma.journalEntry.findFirst({
      where: {
        description: { contains: `[${tx.type}:${tx.referenceId}]` },
      },
      select: { id: true },
    });
    if (existing) {
      logger.info('Accounting entry already exists', {
        type: tx.type,
        referenceId: tx.referenceId,
        journalEntryId: existing.id,
      });
      return { journalEntryId: existing.id };
    }

    // Get account IDs
    let revenueAccountId: string;
    let cashAccountId: string;
    try {
      revenueAccountId = await getAccountId(SERVICE_ACCOUNTS.SERVICE_REVENUE);
      cashAccountId = await getAccountId(SERVICE_ACCOUNTS.CASH_STRIPE);
    } catch {
      // If service accounts don't exist, try fallback to standard sales account
      try {
        revenueAccountId = await getAccountId('4500'); // Standard sales
        cashAccountId = await getAccountId('1050');     // Cash/Stripe
      } catch {
        logger.warn('Accounting accounts not configured, skipping entry', {
          type: tx.type,
          referenceId: tx.referenceId,
        });
        return null;
      }
    }

    // Create journal entry in transaction
    return await prisma.$transaction(async (ptx) => {
      const entryNumber = await getNextEntryNumber(ptx);
      const tps = tx.taxTps || 0;
      const tvq = tx.taxTvq || 0;
      const netRevenue = tx.amount - tps - tvq;

      // Build lines
      const lines: { accountId: string; description: string; debit: number; credit: number }[] = [];

      // DEBIT: Cash/Stripe for total amount
      lines.push({
        accountId: cashAccountId,
        description: `Paiement ${tx.description}`,
        debit: tx.amount,
        credit: 0,
      });

      // CREDIT: Service revenue (net of taxes)
      lines.push({
        accountId: revenueAccountId,
        description: tx.description,
        debit: 0,
        credit: netRevenue,
      });

      // CREDIT: TPS payable (if applicable)
      if (tps > 0) {
        try {
          const tpsAccountId = await getAccountId(SERVICE_ACCOUNTS.TPS_PAYABLE);
          lines.push({
            accountId: tpsAccountId,
            description: `TPS ${tx.description}`,
            debit: 0,
            credit: tps,
          });
        } catch { /* TPS account not configured, include in revenue */ }
      }

      // CREDIT: TVQ payable (if applicable)
      if (tvq > 0) {
        try {
          const tvqAccountId = await getAccountId(SERVICE_ACCOUNTS.TVQ_PAYABLE);
          lines.push({
            accountId: tvqAccountId,
            description: `TVQ ${tx.description}`,
            debit: 0,
            credit: tvq,
          });
        } catch { /* TVQ account not configured, include in revenue */ }
      }

      // Create journal entry
      const entry = await ptx.journalEntry.create({
        data: {
          tenantId: tx.tenantId,
          entryNumber,
          date: tx.paidAt,
          type: 'AUTO_SALE',
          status: 'POSTED',
          description: `[${tx.type}:${tx.referenceId}] ${tx.description}`,
          createdBy: 'system:unified-accounting',
          lines: {
            create: lines.map((line, index) => ({
              tenantId: tx.tenantId,
              lineNumber: index + 1,
              accountId: line.accountId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
          },
        },
      });

      logger.info('Accounting entry created', {
        type: tx.type,
        referenceId: tx.referenceId,
        journalEntryId: entry.id,
        amount: tx.amount,
      });

      return { journalEntryId: entry.id };
    });
  } catch (error) {
    logger.error('Failed to create accounting entry', {
      type: tx.type,
      referenceId: tx.referenceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ── Convenience wrappers ────────────────────────────────────────────

/**
 * Create accounting entry for a CourseOrder
 */
export async function createAccountingForCourseOrder(
  courseOrderId: string,
  tenantId: string
): Promise<{ journalEntryId: string } | null> {
  const order = await prisma.courseOrder.findUnique({
    where: { id: courseOrderId },
  });
  if (!order || order.status !== 'paid') return null;

  // Fetch course title separately since CourseOrder has no relation to Course
  const course = await prisma.course.findUnique({
    where: { id: order.courseId },
    select: { title: true },
  });

  return createAccountingEntryForTransaction({
    type: 'course_order',
    referenceId: courseOrderId,
    tenantId,
    amount: Number(order.totalAmount),
    currency: order.currency || 'CAD',
    description: `Formation: ${course?.title || 'Cours'}`,
    stripePaymentIntentId: order.stripePaymentIntentId,
    paidAt: order.paidAt || order.createdAt,
  });
}

/**
 * Create accounting entry for a Membership subscription payment
 */
export async function createAccountingForMembership(
  membershipId: string,
  tenantId: string,
  paymentAmount: number
): Promise<{ journalEntryId: string } | null> {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { plan: { select: { name: true } } },
  });
  if (!membership) return null;

  return createAccountingEntryForTransaction({
    type: 'membership',
    referenceId: membershipId,
    tenantId,
    amount: paymentAmount,
    currency: 'CAD',
    description: `Membership: ${membership.plan?.name || 'Plan'}`,
    paidAt: new Date(),
  });
}

/**
 * Create accounting entry for a Booking payment
 */
export async function createAccountingForBooking(
  bookingId: string,
  tenantId: string
): Promise<{ journalEntryId: string } | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: { select: { name: true } } },
  });
  if (!booking || booking.paymentStatus !== 'paid') return null;

  return createAccountingEntryForTransaction({
    type: 'booking',
    referenceId: bookingId,
    tenantId: tenantId,
    amount: Number(booking.paymentAmount || 0),
    currency: 'CAD',
    description: `Réservation: ${booking.service?.name || 'Service'} — ${booking.customerName}`,
    stripePaymentIntentId: booking.stripePaymentIntentId,
    paidAt: booking.createdAt,
  });
}

/**
 * Create accounting entry for a paid Event Registration
 */
export async function createAccountingForEventRegistration(
  registrationId: string,
  tenantId: string
): Promise<{ journalEntryId: string } | null> {
  const reg = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: { select: { title: true } } },
  });
  if (!reg || reg.paymentStatus !== 'paid') return null;

  return createAccountingEntryForTransaction({
    type: 'event_registration',
    referenceId: registrationId,
    tenantId: tenantId,
    amount: Number(reg.amountPaid || 0),
    currency: 'CAD',
    description: `Événement: ${reg.event?.title || 'Event'} — ${reg.name}`,
    stripePaymentIntentId: reg.stripePaymentIntentId,
    paidAt: reg.createdAt,
  });
}
