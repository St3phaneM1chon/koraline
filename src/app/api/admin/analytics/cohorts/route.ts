export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

interface CohortRow {
  cohort_month: Date;
  total_users: bigint;
}

interface CohortOrderRow {
  cohort_month: Date;
  users_with_orders: bigint;
}

/**
 * Analytics: Cohort Analysis
 * Groups users by signup month and tracks how many placed orders.
 */
async function handler(request: NextRequest) {
  try {
    const months = parseInt(
      new URL(request.url).searchParams.get('months') || '12',
      10
    );
    const limit = Math.min(Math.max(months, 1), 36);

    // Users grouped by signup month
    const users = await prisma.$queryRaw<CohortRow[]>`
      SELECT DATE_TRUNC('month', "createdAt") as cohort_month,
             COUNT(*)::bigint as total_users
      FROM "User"
      WHERE role = 'CUSTOMER'
        AND "createdAt" > NOW() - MAKE_INTERVAL(months => ${limit})
      GROUP BY cohort_month
      ORDER BY cohort_month
    `;

    // Users who placed at least one order, grouped by signup month
    const orderers = await prisma.$queryRaw<CohortOrderRow[]>`
      SELECT DATE_TRUNC('month', u."createdAt") as cohort_month,
             COUNT(DISTINCT u.id)::bigint as users_with_orders
      FROM "User" u
      INNER JOIN "Order" o ON o."userId" = u.id
      WHERE u.role = 'CUSTOMER'
        AND u."createdAt" > NOW() - MAKE_INTERVAL(months => ${limit})
      GROUP BY cohort_month
      ORDER BY cohort_month
    `;

    const ordererMap = new Map(
      orderers.map((r) => [r.cohort_month.toISOString(), Number(r.users_with_orders)])
    );

    const cohorts = users.map((row) => {
      const totalUsers = Number(row.total_users);
      const usersWithOrders = ordererMap.get(row.cohort_month.toISOString()) || 0;
      return {
        month: row.cohort_month.toISOString().slice(0, 7),
        totalUsers,
        usersWithOrders,
        conversionRate:
          totalUsers > 0
            ? Number(((usersWithOrders / totalUsers) * 100).toFixed(2))
            : 0,
      };
    });

    return NextResponse.json({ data: { cohorts } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
