export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * AI: Stock Predictions (Feature 17)
 * Uses Product.stockQuantity + OrderItem.quantity to compute sales velocity
 * and predict when products will run out of stock.
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lookbackDays = Math.min(
      Math.max(parseInt(url.searchParams.get('days') || '30', 10), 7),
      180
    );

    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    // Get active products with current stock
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        stockQuantity: true,
        price: true,
      },
      take: 500,
    });

    // Get sales velocity: quantity sold per product in the lookback period
    const salesData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: true,
      where: {
        createdAt: { gte: since },
      },
    });

    const salesMap = new Map(
      salesData.map((s) => [
        s.productId,
        {
          totalSold: s._sum.quantity || 0,
          orderCount: s._count,
        },
      ])
    );

    const predictions = products
      .map((product) => {
        const sales = salesMap.get(product.id);
        const totalSold = sales?.totalSold || 0;
        const orderCount = sales?.orderCount || 0;

        // Daily velocity
        const dailyVelocity = totalSold / lookbackDays;

        // Days until stockout (0 if already out of stock)
        let daysUntilStockout: number | null = null;
        if (dailyVelocity > 0) {
          daysUntilStockout = Math.floor(product.stockQuantity / dailyVelocity);
        }

        // Stock status
        let status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'OVERSTOCKED';
        if (product.stockQuantity === 0) {
          status = 'OUT_OF_STOCK';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
          status = 'CRITICAL';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 30) {
          status = 'LOW';
        } else if (dailyVelocity === 0 && product.stockQuantity > 50) {
          status = 'OVERSTOCKED';
        } else {
          status = 'ADEQUATE';
        }

        // Suggested reorder quantity (30 days of supply)
        const suggestedReorder =
          dailyVelocity > 0
            ? Math.ceil(dailyVelocity * 30) - product.stockQuantity
            : 0;

        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stockQuantity,
          price: Number(product.price),
          totalSoldInPeriod: totalSold,
          orderCountInPeriod: orderCount,
          dailyVelocity: Number(dailyVelocity.toFixed(2)),
          daysUntilStockout,
          status,
          suggestedReorder: Math.max(suggestedReorder, 0),
        };
      })
      .sort((a, b) => {
        // Sort: OUT_OF_STOCK first, then CRITICAL, then by daysUntilStockout
        const priority = {
          OUT_OF_STOCK: 0,
          CRITICAL: 1,
          LOW: 2,
          ADEQUATE: 3,
          OVERSTOCKED: 4,
        };
        return priority[a.status] - priority[b.status];
      });

    return NextResponse.json({
      data: {
        lookbackDays,
        totalProducts: predictions.length,
        summary: {
          outOfStock: predictions.filter((p) => p.status === 'OUT_OF_STOCK').length,
          critical: predictions.filter((p) => p.status === 'CRITICAL').length,
          low: predictions.filter((p) => p.status === 'LOW').length,
          adequate: predictions.filter((p) => p.status === 'ADEQUATE').length,
          overstocked: predictions.filter((p) => p.status === 'OVERSTOCKED').length,
        },
        predictions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
