export const dynamic = 'force-dynamic';

/**
 * CRM Revenue Forecast API
 * GET /api/admin/crm/forecast
 *   Query params:
 *     - months (default 3, max 24)
 *     - pipelineId (optional filter)
 *     - range: 'month' | 'quarter' | 'year' (optional, overrides months)
 *
 * Returns:
 *   - summary: weighted, bestCase, worstCase, wonThisMonth
 *   - timeline: monthly forecast (grouped by expectedCloseDate month)
 *   - byPipeline: weighted sum per pipeline
 *   - byAgent: weighted sum per assignedTo
 *   - historicalTrend: last 6 months won/lost
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    // Determine months from range param or explicit months param
    const range = searchParams.get('range'); // 'month' | 'quarter' | 'year'
    let months: number;
    if (range === 'year') {
      months = 12;
    } else if (range === 'quarter') {
      months = 3;
    } else {
      months = Math.min(24, Math.max(1, parseInt(searchParams.get('months') || '3', 10)));
    }

    const now = new Date();

    // ---------------------------------------------------------------------------
    // Base where clause - all open (non-lost, non-won) deals
    // ---------------------------------------------------------------------------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseWhere: Record<string, any> = {
      stage: {
        isWon: false,
        // isLost equivalent: probability === 0 and !isWon → we keep all open stages
      },
    };
    if (pipelineId) baseWhere.pipelineId = pipelineId;

    // ---------------------------------------------------------------------------
    // 1. Summary metrics: weighted, best case, worst case, won this month
    // ---------------------------------------------------------------------------

    // All open deals
    const allOpenDeals = await prisma.crmDeal.findMany({
      where: baseWhere,
      include: {
        stage: { select: { probability: true, isWon: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        pipeline: { select: { id: true, name: true } },
      },
    });

    let weightedTotal = 0;
    let bestCase = 0;
    let worstCase = 0;

    for (const deal of allOpenDeals) {
      const value = Number(deal.value);
      const prob = deal.stage.probability ?? 0;
      weightedTotal += value * prob;
      bestCase += value; // all open deals at face value
      if (prob > 0.6) {
        worstCase += value * prob; // only high-probability deals
      }
    }

    // Won this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const wonDealsThisMonth = await prisma.crmDeal.findMany({
      where: {
        ...(pipelineId ? { pipelineId } : {}),
        stage: { isWon: true },
        actualCloseDate: { gte: monthStart, lte: monthEnd },
      },
      select: { value: true },
    });
    const wonThisMonth = wonDealsThisMonth.reduce((sum, d) => sum + Number(d.value), 0);

    const summary = {
      weightedPipeline: Math.round(weightedTotal * 100) / 100,
      bestCase: Math.round(bestCase * 100) / 100,
      worstCase: Math.round(worstCase * 100) / 100,
      wonThisMonth: Math.round(wonThisMonth * 100) / 100,
      openDealCount: allOpenDeals.length,
    };

    // ---------------------------------------------------------------------------
    // 2. Monthly timeline - deals grouped by expectedCloseDate month
    // ---------------------------------------------------------------------------
    const timeline: Array<{
      month: string;
      totalValue: number;
      weightedValue: number;
      wonValue: number;
      dealCount: number;
    }> = [];

    for (let i = 0; i < months; i++) {
      const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
      const month = (now.getMonth() + i) % 12;
      const mStart = new Date(year, month, 1);
      const mEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        expectedCloseDate: { gte: mStart, lte: mEnd },
      };
      if (pipelineId) where.pipelineId = pipelineId;

      const deals = await prisma.crmDeal.findMany({
        where,
        include: {
          stage: { select: { probability: true, isWon: true } },
        },
      });

      let totalValue = 0;
      let weightedValue = 0;
      let wonValue = 0;

      for (const deal of deals) {
        const value = Number(deal.value);
        totalValue += value;
        weightedValue += value * (deal.stage.probability ?? 0);
        if (deal.stage.isWon && deal.actualCloseDate) {
          wonValue += value;
        }
      }

      timeline.push({
        month: monthLabel,
        totalValue: Math.round(totalValue * 100) / 100,
        weightedValue: Math.round(weightedValue * 100) / 100,
        wonValue: Math.round(wonValue * 100) / 100,
        dealCount: deals.length,
      });
    }

    // ---------------------------------------------------------------------------
    // 3. Forecast by pipeline
    // ---------------------------------------------------------------------------
    const byPipelineMap = new Map<string, { pipelineId: string; pipelineName: string; weighted: number; total: number; dealCount: number }>();

    for (const deal of allOpenDeals) {
      const pid = deal.pipeline.id;
      if (!byPipelineMap.has(pid)) {
        byPipelineMap.set(pid, {
          pipelineId: pid,
          pipelineName: deal.pipeline.name,
          weighted: 0,
          total: 0,
          dealCount: 0,
        });
      }
      const entry = byPipelineMap.get(pid)!;
      const value = Number(deal.value);
      entry.weighted += value * (deal.stage.probability ?? 0);
      entry.total += value;
      entry.dealCount += 1;
    }

    const byPipeline = Array.from(byPipelineMap.values()).map(e => ({
      ...e,
      weighted: Math.round(e.weighted * 100) / 100,
      total: Math.round(e.total * 100) / 100,
    }));

    // ---------------------------------------------------------------------------
    // 4. Forecast by agent
    // ---------------------------------------------------------------------------
    const byAgentMap = new Map<string, { agentId: string; agentName: string; agentEmail: string; weighted: number; total: number; dealCount: number }>();

    for (const deal of allOpenDeals) {
      const aid = deal.assignedTo.id;
      if (!byAgentMap.has(aid)) {
        byAgentMap.set(aid, {
          agentId: aid,
          agentName: deal.assignedTo.name ?? '',
          agentEmail: deal.assignedTo.email ?? '',
          weighted: 0,
          total: 0,
          dealCount: 0,
        });
      }
      const entry = byAgentMap.get(aid)!;
      const value = Number(deal.value);
      entry.weighted += value * (deal.stage.probability ?? 0);
      entry.total += value;
      entry.dealCount += 1;
    }

    const byAgent = Array.from(byAgentMap.values())
      .map(e => ({
        ...e,
        weighted: Math.round(e.weighted * 100) / 100,
        total: Math.round(e.total * 100) / 100,
      }))
      .sort((a, b) => b.weighted - a.weighted);

    // ---------------------------------------------------------------------------
    // 5. Historical won/lost trend - last 6 months
    // ---------------------------------------------------------------------------
    const historicalTrend: Array<{
      month: string;
      wonValue: number;
      wonCount: number;
      lostCount: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const year = now.getFullYear() + Math.floor((now.getMonth() - i) / 12);
      const month = ((now.getMonth() - i) % 12 + 12) % 12;
      const hStart = new Date(year, month, 1);
      const hEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wonWhere: Record<string, any> = {
        stage: { isWon: true },
        actualCloseDate: { gte: hStart, lte: hEnd },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lostWhere: Record<string, any> = {
        stage: { isWon: false, probability: 0 },
        updatedAt: { gte: hStart, lte: hEnd },
      };
      if (pipelineId) {
        wonWhere.pipelineId = pipelineId;
        lostWhere.pipelineId = pipelineId;
      }

      const [wonDeals, lostCount] = await Promise.all([
        prisma.crmDeal.findMany({
          where: wonWhere,
          select: { value: true },
        }),
        prisma.crmDeal.count({ where: lostWhere }),
      ]);

      const wonValue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);

      historicalTrend.push({
        month: monthLabel,
        wonValue: Math.round(wonValue * 100) / 100,
        wonCount: wonDeals.length,
        lostCount,
      });
    }

    return apiSuccess({
      summary,
      timeline,
      byPipeline,
      byAgent,
      historicalTrend,
    }, { request });
  } catch (error) {
    logger.error('[crm/forecast] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to compute forecast', ErrorCode.INTERNAL_ERROR, { request });
  }
});
