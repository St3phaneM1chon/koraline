/**
 * Admin API — Performance Dashboard Data
 * GET /api/admin/performance — aggregated CWV metrics, per-page stats, score
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { computePerformanceScore } from '@/lib/performance/web-vitals';

export const GET = withAdminGuard(async (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // 1. Aggregate CWV metrics (averages)
  const metrics = ['LCP', 'FID', 'CLS', 'TTFB', 'INP'] as const;
  const aggregated: Record<string, { avg: number; p75: number; p95: number; count: number; good: number; poor: number }> = {};

  for (const metric of metrics) {
    const entries = await prisma.webVitalEntry.findMany({
      where: { tenantId, metric, createdAt: { gte: since } },
      select: { value: true, rating: true },
      orderBy: { value: 'asc' },
    });

    if (entries.length === 0) {
      aggregated[metric] = { avg: 0, p75: 0, p95: 0, count: 0, good: 0, poor: 0 };
      continue;
    }

    const values = entries.map((e) => e.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const p75Idx = Math.floor(values.length * 0.75);
    const p95Idx = Math.floor(values.length * 0.95);

    aggregated[metric] = {
      avg: Math.round(avg * 100) / 100,
      p75: Math.round(values[p75Idx] * 100) / 100,
      p95: Math.round(values[p95Idx] * 100) / 100,
      count: entries.length,
      good: entries.filter((e) => e.rating === 'good').length,
      poor: entries.filter((e) => e.rating === 'poor').length,
    };
  }

  // 2. Overall performance score
  const score = computePerformanceScore({
    lcp: aggregated.LCP?.avg || undefined,
    fid: aggregated.FID?.avg || undefined,
    cls: aggregated.CLS?.avg || undefined,
    ttfb: aggregated.TTFB?.avg || undefined,
    inp: aggregated.INP?.avg || undefined,
  });

  // 3. Per-page breakdown (top 20 slowest pages)
  const pageBreakdown = await prisma.webVitalEntry.groupBy({
    by: ['page'],
    where: { tenantId, createdAt: { gte: since } },
    _avg: { value: true },
    _count: { id: true },
    orderBy: { _avg: { value: 'desc' } },
    take: 20,
  });

  // 4. Trend data (daily averages for LCP over the period)
  const trendEntries = await prisma.webVitalEntry.findMany({
    where: { tenantId, metric: 'LCP', createdAt: { gte: since } },
    select: { value: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyTrend: Record<string, { total: number; count: number }> = {};
  for (const e of trendEntries) {
    const day = e.createdAt.toISOString().split('T')[0];
    if (!dailyTrend[day]) dailyTrend[day] = { total: 0, count: 0 };
    dailyTrend[day].total += e.value;
    dailyTrend[day].count += 1;
  }

  const trend = Object.entries(dailyTrend).map(([date, d]) => ({
    date,
    avgLcp: Math.round(d.total / d.count),
  }));

  // 5. Rating distribution
  const ratingDist = await prisma.webVitalEntry.groupBy({
    by: ['rating'],
    where: { tenantId, createdAt: { gte: since } },
    _count: { id: true },
  });

  const totalEntries = ratingDist.reduce((a, r) => a + r._count.id, 0);

  return NextResponse.json({
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 50 ? 'D' : 'F',
    metrics: aggregated,
    pageBreakdown: pageBreakdown.map((p) => ({
      page: p.page,
      avgValue: Math.round((p._avg.value || 0) * 100) / 100,
      count: p._count.id,
    })),
    trend,
    ratingDistribution: {
      good: ratingDist.find((r) => r.rating === 'good')?._count.id || 0,
      needsImprovement: ratingDist.find((r) => r.rating === 'needs-improvement')?._count.id || 0,
      poor: ratingDist.find((r) => r.rating === 'poor')?._count.id || 0,
      total: totalEntries,
    },
    period: { days, since: since.toISOString() },
  });
}, { skipCsrf: true });
