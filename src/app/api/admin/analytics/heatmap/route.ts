export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';

interface HeatmapRow {
  day_of_week: number;
  hour_of_day: number;
  order_count: number;
}

/**
 * Analytics: Activity Heatmap
 * Returns order counts grouped by day-of-week and hour-of-day
 * for the last N days (default 90).
 */
async function handler(request: NextRequest) {
  try {
    const days = Math.min(
      Math.max(
        parseInt(new URL(request.url).searchParams.get('days') || '90', 10),
        1
      ),
      365
    );

    const data = await prisma.$queryRaw<HeatmapRow[]>`
      SELECT EXTRACT(DOW FROM "createdAt")::int as day_of_week,
             EXTRACT(HOUR FROM "createdAt")::int as hour_of_day,
             COUNT(*)::int as order_count
      FROM "Order"
      WHERE "createdAt" > NOW() - MAKE_INTERVAL(days => ${days})
      GROUP BY day_of_week, hour_of_day
      ORDER BY day_of_week, hour_of_day
    `;

    // Build a 7x24 matrix for easy frontend rendering
    const matrix: number[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(0)
    );
    for (const row of data) {
      matrix[row.day_of_week][row.hour_of_day] = row.order_count;
    }

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    return NextResponse.json({
      data: {
        raw: data,
        matrix,
        dayNames,
        period: `${days} days`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAdminGuard(handler);
