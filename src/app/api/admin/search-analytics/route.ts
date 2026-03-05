export const dynamic = 'force-dynamic';

/**
 * Admin Search Analytics Dashboard API (I-SEARCH)
 * GET /api/admin/search-analytics?days=30
 *
 * Returns comprehensive search analytics:
 * - Top search queries (last 7/30 days)
 * - Zero-result searches (content gaps)
 * - Search volume over time (daily breakdown)
 * - Average results per query
 * - Comparison with previous period
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { getSearchAnalytics } from '@/lib/search-analytics';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Get daily search volume breakdown for the given period.
 */
async function getSearchVolumeOverTime(days: number): Promise<{ date: string; count: number; zeroResults: number }[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Use raw query for date grouping (Prisma groupBy doesn't support date truncation)
  const dailyVolume = await prisma.$queryRaw<{ date: string; count: bigint; zero_results: bigint }[]>`
    SELECT
      DATE("createdAt") AS date,
      COUNT(*) AS count,
      SUM(CASE WHEN "resultCount" = 0 THEN 1 ELSE 0 END) AS zero_results
    FROM "SearchLog"
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  return dailyVolume.map(row => ({
    date: String(row.date),
    count: Number(row.count),
    zeroResults: Number(row.zero_results),
  }));
}

/**
 * Get average search duration (response time) in ms.
 */
async function getAvgSearchDuration(days: number): Promise<number | null> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.searchLog.aggregate({
    where: {
      createdAt: { gte: since },
      duration: { not: null },
    },
    _avg: { duration: true },
  });
  return result._avg.duration ? Math.round(result._avg.duration) : null;
}

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(1, parseInt(searchParams.get('days') || '30', 10)), 365);

    // Fetch base analytics + enhanced metrics in parallel
    const [analytics, volumeOverTime, avgDuration] = await Promise.all([
      getSearchAnalytics(days),
      getSearchVolumeOverTime(days),
      getAvgSearchDuration(days),
    ]);

    // Also get 7-day summary for quick stats
    const sevenDayAnalytics = days !== 7 ? await getSearchAnalytics(7) : null;

    return NextResponse.json({
      data: {
        ...analytics,
        volumeOverTime,
        avgDurationMs: avgDuration,
        // Include 7-day quick stats when viewing a longer period
        ...(sevenDayAnalytics ? {
          last7Days: {
            totalSearches: sevenDayAnalytics.totalSearches,
            uniqueQueries: sevenDayAnalytics.uniqueQueries,
            avgResultCount: sevenDayAnalytics.avgResultCount,
            topQueries: sevenDayAnalytics.topQueries.slice(0, 5),
            zeroResultQueries: sevenDayAnalytics.zeroResultQueries.slice(0, 5),
          },
        } : {}),
      },
    });
  } catch (error) {
    logger.error('[admin/search-analytics] GET error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to fetch search analytics' }, { status: 500 });
  }
});
