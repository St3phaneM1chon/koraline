/**
 * I-PAYMENT-13: Revenue Reconciliation Report
 * Compares order totals against Stripe payments for a given period
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Generate reconciliation report for a date range
export const GET = withAdminGuard(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(to) : new Date();

  // Get orders in period
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      paymentStatus: { in: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentStatus: true,
      stripePaymentId: true,
      createdAt: true,
      currency: { select: { code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get payment errors in period
  const paymentErrors = await prisma.paymentError.count({
    where: { createdAt: { gte: startDate, lte: endDate } },
  });

  // Calculate totals
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const totalRefunded = orders
    .filter((o) => o.paymentStatus === 'REFUNDED' || o.paymentStatus === 'PARTIALLY_REFUNDED')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersWithStripe = orders.filter((o) => o.stripePaymentId);
  const ordersWithoutStripe = orders.filter((o) => !o.stripePaymentId);

  return NextResponse.json({
    period: { from: startDate.toISOString(), to: endDate.toISOString() },
    summary: {
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalRefunded: Math.round(totalRefunded * 100) / 100,
      netRevenue: Math.round((totalRevenue - totalRefunded) * 100) / 100,
      paymentErrors,
      matchedWithStripe: ordersWithStripe.length,
      unmatchedOrders: ordersWithoutStripe.length,
    },
    unmatched: ordersWithoutStripe.map((o) => ({
      orderNumber: o.orderNumber,
      total: Number(o.total),
      status: o.paymentStatus,
      date: o.createdAt,
    })),
  });
});
