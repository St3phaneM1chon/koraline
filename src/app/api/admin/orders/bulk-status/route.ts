export const dynamic = 'force-dynamic';

/**
 * Bulk Order Status Update API
 * POST /api/admin/orders/bulk-status
 *
 * Accepts { orderIds: string[], status: string } and updates all specified orders
 * to the new status, validating each transition individually via the order-status-machine,
 * and recording an OrderEvent audit trail entry for each successful change.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { validateTransition, ALL_ORDER_STATUSES } from '@/lib/order-status-machine';
import { recordOrderEvent } from '@/lib/order-events';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const bulkStatusSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(ALL_ORDER_STATUSES as [string, ...string[]]),
}).strict();

// ---------------------------------------------------------------------------
// POST /api/admin/orders/bulk-status
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const parsed = bulkStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderIds, status: targetStatus } = parsed.data;

    // Fetch all orders
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true, status: true },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Validate transitions for each order
    const results: {
      updated: Array<{ id: string; orderNumber: string; previousStatus: string }>;
      skipped: Array<{ id: string; orderNumber: string; currentStatus: string; reason: string }>;
      notFound: string[];
    } = {
      updated: [],
      skipped: [],
      notFound: [],
    };

    // Find orderIds that were not found in DB
    const foundIds = new Set(orders.map((o) => o.id));
    for (const id of orderIds) {
      if (!foundIds.has(id)) {
        results.notFound.push(id);
      }
    }

    // Separate valid vs invalid transitions using the structured state-machine validator
    const validOrders: Array<{ id: string; orderNumber: string; previousStatus: string }> = [];
    for (const order of orders) {
      const check = validateTransition(order.status, targetStatus);
      if (!check.valid) {
        results.skipped.push({
          id: order.id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          reason: check.error ?? `Invalid transition: ${order.status} -> ${targetStatus}`,
        });
      } else {
        validOrders.push({
          id: order.id,
          orderNumber: order.orderNumber,
          previousStatus: order.status,
        });
      }
    }

    // Perform bulk update in a transaction, then fire OrderEvents for audit trail
    if (validOrders.length > 0) {
      const validIds = validOrders.map((o) => o.id);

      await prisma.order.updateMany({
        where: { id: { in: validIds } },
        data: {
          status: targetStatus,
          updatedAt: new Date(),
          // Set timestamp fields based on target status
          ...(targetStatus === 'SHIPPED' ? { shippedAt: new Date() } : {}),
          ...(targetStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
      });

      // Record an OrderEvent for each updated order (non-fatal: errors are swallowed inside recordOrderEvent)
      await Promise.all(
        validOrders.map((o) =>
          recordOrderEvent(
            o.id,
            'STATUS_CHANGE',
            `Status changed to ${targetStatus}`,
            `Bulk status update by admin`,
            { previousStatus: o.previousStatus, newStatus: targetStatus, bulk: true },
            session.user.id,
          )
        )
      );

      results.updated = validOrders;
    }

    // Log admin action
    const ipAddress = getClientIpFromRequest(request);
    await logAdminAction({
      adminUserId: session.user.id,
      action: 'BULK_UPDATE_ORDER_STATUS',
      targetType: 'Order',
      targetId: orderIds.join(','),
      previousValue: validOrders.map((o) => ({ id: o.id, status: o.previousStatus })),
      newValue: { targetStatus, updatedCount: validOrders.length },
      ipAddress,
    });

    logger.info('Bulk order status update', {
      event: 'bulk_order_status_update',
      adminUserId: session.user.id,
      targetStatus,
      totalRequested: orderIds.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      notFound: results.notFound.length,
    });

    return NextResponse.json({
      success: true,
      targetStatus,
      updated: results.updated.length,
      skipped: results.skipped.length,
      notFound: results.notFound.length,
      details: results,
    });
  } catch (error) {
    logger.error('Bulk status update failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
