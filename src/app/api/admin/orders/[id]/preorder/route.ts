export const dynamic = 'force-dynamic';

/**
 * Pre-order Management API
 * POST /api/admin/orders/[id]/preorder
 *
 * Converts a PRE_ORDER to a regular PENDING order when stock arrives.
 * Validates that the order is currently in PRE_ORDER status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logAdminAction, getClientIpFromRequest } from '@/lib/admin-audit';
import { isValidTransition } from '@/lib/order-status';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// POST /api/admin/orders/[id]/preorder - Convert pre-order to regular order
// ---------------------------------------------------------------------------

export const POST = withAdminGuard(async (request: NextRequest, { session, params }) => {
  try {
    const orderId = params!.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PRE_ORDER') {
      return NextResponse.json(
        {
          error: `Order is not a pre-order. Current status: ${order.status}`,
          allowedFrom: 'PRE_ORDER',
        },
        { status: 400 }
      );
    }

    // Validate the transition PRE_ORDER -> PENDING
    if (!isValidTransition('PRE_ORDER', 'PENDING')) {
      return NextResponse.json(
        { error: 'Pre-order to pending transition is not configured' },
        { status: 500 }
      );
    }

    // Optionally check stock availability for all items
    const productIds = [...new Set(order.items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        trackInventory: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const stockWarnings: string[] = [];

    for (const item of order.items) {
      const product = productMap.get(item.productId);
      if (product && product.trackInventory && product.stockQuantity < item.quantity) {
        stockWarnings.push(
          `${item.productName}: requested ${item.quantity}, available ${product.stockQuantity}`
        );
      }
    }

    // Update order status from PRE_ORDER to PENDING
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        adminNotes: order.status === 'PRE_ORDER'
          ? `Converted from pre-order on ${new Date().toISOString()}`
          : undefined,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    const ipAddress = getClientIpFromRequest(request);
    await logAdminAction({
      adminUserId: session.user.id,
      action: 'CONVERT_PREORDER',
      targetType: 'Order',
      targetId: orderId,
      previousValue: { status: 'PRE_ORDER' },
      newValue: { status: 'PENDING', stockWarnings },
      ipAddress,
    });

    logger.info('Pre-order converted', {
      event: 'preorder_converted',
      orderId,
      orderNumber: order.orderNumber,
      adminUserId: session.user.id,
      stockWarnings: stockWarnings.length > 0 ? stockWarnings : undefined,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      ...(stockWarnings.length > 0 ? { stockWarnings } : {}),
    });
  } catch (error) {
    logger.error('Pre-order conversion failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
