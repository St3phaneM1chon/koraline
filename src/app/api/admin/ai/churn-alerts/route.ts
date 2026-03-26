export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

/**
 * AI: Churn Alerts (Feature 16)
 * Identifies customers at risk of churning based on inactivity.
 * Uses User.role='CUSTOMER' + Order.createdAt to detect inactivity.
 */
async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const inactiveDays = Math.min(
      Math.max(parseInt(url.searchParams.get('days') || '60', 10), 7),
      365
    );
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1),
      200
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactiveDays);

    // Find customers who have ordered before but not recently
    const atRiskCustomers = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string | null;
        last_order_date: Date;
        order_count: bigint;
        total_spent: number;
        days_inactive: number;
      }>
    >`
      SELECT
        u.id,
        u.email,
        u.name,
        MAX(o."createdAt") as last_order_date,
        COUNT(o.id)::bigint as order_count,
        COALESCE(SUM(o.total::numeric), 0)::float as total_spent,
        EXTRACT(DAY FROM NOW() - MAX(o."createdAt"))::int as days_inactive
      FROM "User" u
      INNER JOIN "Order" o ON o."userId" = u.id
      WHERE u.role = 'CUSTOMER'
        AND u."isBanned" = false
      GROUP BY u.id, u.email, u.name
      HAVING MAX(o."createdAt") < ${cutoff}
      ORDER BY total_spent DESC
      LIMIT ${limit}
    `;

    // Compute churn risk score (0-100)
    const alerts = atRiskCustomers.map((customer) => {
      const daysInactive = customer.days_inactive;
      const orderCount = Number(customer.order_count);
      const totalSpent = customer.total_spent;

      // Higher score = higher risk
      // Base: days inactive contributes most
      let riskScore = Math.min((daysInactive / 180) * 60, 60);
      // Frequent buyers who stopped are higher risk
      if (orderCount > 5) riskScore += 15;
      else if (orderCount > 2) riskScore += 10;
      // High spenders who stopped are higher risk
      if (totalSpent > 500) riskScore += 15;
      else if (totalSpent > 200) riskScore += 10;

      riskScore = Math.min(Math.round(riskScore), 100);

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (riskScore >= 80) riskLevel = 'CRITICAL';
      else if (riskScore >= 60) riskLevel = 'HIGH';
      else if (riskScore >= 40) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';

      return {
        userId: customer.id,
        email: customer.email,
        name: customer.name,
        lastOrderDate: customer.last_order_date,
        daysInactive,
        orderCount,
        totalSpent: Number(totalSpent.toFixed(2)),
        riskScore,
        riskLevel,
        suggestedAction:
          riskLevel === 'CRITICAL'
            ? 'Send re-engagement offer with discount'
            : riskLevel === 'HIGH'
              ? 'Send personalized check-in email'
              : riskLevel === 'MEDIUM'
                ? 'Add to re-engagement campaign'
                : 'Monitor',
      };
    });

    return NextResponse.json({
      data: {
        inactiveDays,
        totalAtRisk: alerts.length,
        byRiskLevel: {
          critical: alerts.filter((a) => a.riskLevel === 'CRITICAL').length,
          high: alerts.filter((a) => a.riskLevel === 'HIGH').length,
          medium: alerts.filter((a) => a.riskLevel === 'MEDIUM').length,
          low: alerts.filter((a) => a.riskLevel === 'LOW').length,
        },
        alerts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
