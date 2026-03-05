/**
 * Order Events Helper
 *
 * Provides a central `recordOrderEvent` function for recording audit-trail
 * events against an order.  Call it from any place that mutates an order
 * (status changes, refunds, shipping updates, admin notes, system webhooks).
 *
 * Event types:
 *   STATUS_CHANGE  – Order status transition (e.g. PENDING → CONFIRMED)
 *   NOTE           – Manual admin note added to the order
 *   PAYMENT        – Payment event (capture, refund, partial-refund, error)
 *   SHIPPING       – Shipping / tracking update
 *   REFUND         – Refund issued
 *   SYSTEM         – Automated system event (webhook, cron, etc.)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export type OrderEventType =
  | 'STATUS_CHANGE'
  | 'NOTE'
  | 'PAYMENT'
  | 'SHIPPING'
  | 'REFUND'
  | 'SYSTEM';

/**
 * Record an audit-trail event for an order.
 *
 * @param orderId  - The order to attach the event to
 * @param type     - Category of the event (see OrderEventType)
 * @param title    - Short human-readable summary (e.g. "Status changed to SHIPPED")
 * @param details  - Optional longer description / structured text
 * @param metadata - Optional arbitrary JSON payload (old/new values, IDs, amounts …)
 * @param actorId  - userId of the admin/user who triggered the event; null for system events
 *
 * The function never throws – errors are logged and swallowed so that a
 * timeline write failure never breaks the caller's happy path.
 */
export async function recordOrderEvent(
  orderId: string,
  type: OrderEventType,
  title: string,
  details?: string,
  metadata?: Record<string, unknown>,
  actorId?: string | null
): Promise<void> {
  try {
    await prisma.orderEvent.create({
      data: {
        orderId,
        type,
        title,
        details: details ?? null,
        // Prisma Json? field requires InputJsonValue; cast via unknown for generic Record type
        metadata: metadata !== undefined
          ? (metadata as unknown as Prisma.InputJsonValue)
          : undefined,
        actorId: actorId ?? null,
      },
    });
  } catch (error) {
    // Non-fatal: log but do not rethrow
    logger.error('[OrderEvents] Failed to record order event', {
      orderId,
      type,
      title,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
