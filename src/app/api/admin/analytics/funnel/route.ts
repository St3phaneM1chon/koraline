export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * Analytics: Conversion Funnel
 * Counts orders by status to estimate the sales funnel
 * and includes active carts as the top-of-funnel metric.
 */
async function handler(_request: NextRequest) {
  try {
    const [cartCount, totalOrders, pendingOrders, completedOrders, cancelledOrders] =
      await Promise.all([
        prisma.cart.count({ where: { items: { some: {} } } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.count({ where: { status: 'CANCELLED' } }),
      ]);

    const processingOrders = totalOrders - pendingOrders - completedOrders - cancelledOrders;

    const funnel = {
      stages: [
        { name: 'Active Carts', count: cartCount },
        { name: 'Orders Created', count: totalOrders },
        { name: 'Pending', count: pendingOrders },
        { name: 'Processing', count: processingOrders },
        { name: 'Delivered', count: completedOrders },
        { name: 'Cancelled', count: cancelledOrders },
      ],
      conversionRate:
        cartCount > 0
          ? Number(((totalOrders / cartCount) * 100).toFixed(2))
          : 0,
      completionRate:
        totalOrders > 0
          ? Number(((completedOrders / totalOrders) * 100).toFixed(2))
          : 0,
      cancellationRate:
        totalOrders > 0
          ? Number(((cancelledOrders / totalOrders) * 100).toFixed(2))
          : 0,
    };

    return NextResponse.json({ data: funnel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
