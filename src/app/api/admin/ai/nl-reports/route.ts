export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

interface ReportResult {
  intent: string;
  title: string;
  data: unknown;
  generatedAt: string;
}

/**
 * AI: Natural Language Report Generator (Feature 18)
 * Parses a natural language query and runs the appropriate Prisma query.
 * Supported intents: revenue, orders, customers, products, top-sellers
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const days = Math.min(
      Math.max(parseInt(url.searchParams.get('days') || '30', 10), 1),
      365
    );

    if (!query.trim()) {
      return NextResponse.json(
        {
          error: 'q query parameter is required',
          examples: [
            'revenue summary',
            'top customers',
            'order status breakdown',
            'top selling products',
            'new customers',
          ],
        },
        { status: 400 }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);
    const normalizedQuery = query.toLowerCase().trim();

    let result: ReportResult;

    if (
      normalizedQuery.includes('revenue') ||
      normalizedQuery.includes('sales') ||
      normalizedQuery.includes('chiffre')
    ) {
      // Revenue report
      const orders = await prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      });

      result = {
        intent: 'revenue',
        title: `Revenue Summary (last ${days} days)`,
        data: {
          totalRevenue: orders._sum.total ? Number(orders._sum.total) : 0,
          totalOrders: orders._count,
          averageOrderValue: orders._avg.total ? Number(orders._avg.total) : 0,
          period: `${days} days`,
        },
        generatedAt: new Date().toISOString(),
      };
    } else if (
      normalizedQuery.includes('customer') ||
      normalizedQuery.includes('client')
    ) {
      // Customer report
      const newCustomers = await prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: since } },
      });
      const totalCustomers = await prisma.user.count({
        where: { role: 'CUSTOMER' },
      });

      result = {
        intent: 'customers',
        title: `Customer Report (last ${days} days)`,
        data: {
          newCustomers,
          totalCustomers,
          growthRate:
            totalCustomers > 0
              ? Number(((newCustomers / totalCustomers) * 100).toFixed(2))
              : 0,
          period: `${days} days`,
        },
        generatedAt: new Date().toISOString(),
      };
    } else if (
      normalizedQuery.includes('order') ||
      normalizedQuery.includes('commande')
    ) {
      // Order status breakdown
      const statuses = await prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: since } },
      });

      result = {
        intent: 'orders',
        title: `Order Status Breakdown (last ${days} days)`,
        data: {
          statuses: statuses.map((s) => ({
            status: s.status,
            count: s._count,
          })),
          total: statuses.reduce((s, r) => s + r._count, 0),
          period: `${days} days`,
        },
        generatedAt: new Date().toISOString(),
      };
    } else if (
      normalizedQuery.includes('product') ||
      normalizedQuery.includes('top') ||
      normalizedQuery.includes('best') ||
      normalizedQuery.includes('seller') ||
      normalizedQuery.includes('produit')
    ) {
      // Top selling products
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _sum: { quantity: true },
        _count: true,
        where: { createdAt: { gte: since } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      });

      result = {
        intent: 'top-sellers',
        title: `Top Selling Products (last ${days} days)`,
        data: {
          products: topProducts.map((p, index) => ({
            rank: index + 1,
            productId: p.productId,
            productName: p.productName,
            quantitySold: p._sum.quantity || 0,
            orderCount: p._count,
          })),
          period: `${days} days`,
        },
        generatedAt: new Date().toISOString(),
      };
    } else {
      // Default: general overview
      const [orderCount, customerCount, productCount] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: since } } }),
        prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: since } } }),
        prisma.product.count({ where: { isActive: true } }),
      ]);

      result = {
        intent: 'overview',
        title: `General Overview (last ${days} days)`,
        data: {
          orders: orderCount,
          newCustomers: customerCount,
          activeProducts: productCount,
          period: `${days} days`,
        },
        generatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
