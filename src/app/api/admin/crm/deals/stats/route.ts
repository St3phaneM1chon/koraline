export const dynamic = 'force-dynamic';

/**
 * CRM Deal Statistics API
 * GET /api/admin/crm/deals/stats -- Pipeline statistics
 *
 * Returns: totalDeals, totalValue, weightedValue, winRate,
 * avgCycleTime, dealsByStage.
 */

import { NextRequest } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ErrorCode } from '@/lib/error-codes';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET: Pipeline statistics
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    // Build base filter
    const dealWhere = pipelineId ? { pipelineId } : {};

    // Fetch all deals with their stages for calculations
    const deals = await prisma.crmDeal.findMany({
      where: dealWhere,
      select: {
        id: true,
        value: true,
        stageId: true,
        createdAt: true,
        actualCloseDate: true,
        stage: {
          select: {
            id: true,
            name: true,
            probability: true,
            isWon: true,
            isLost: true,
          },
        },
      },
    });

    // Total deals
    const totalDeals = deals.length;

    // Total value (sum of all deal values)
    let totalValue = 0;
    let weightedValue = 0;

    for (const deal of deals) {
      const val = Number(deal.value);
      totalValue += val;
      weightedValue += val * deal.stage.probability;
    }

    // Win rate: won / (won + lost)
    const wonCount = deals.filter(d => d.stage.isWon).length;
    const lostCount = deals.filter(d => d.stage.isLost).length;
    const closedCount = wonCount + lostCount;
    const winRate = closedCount > 0 ? wonCount / closedCount : 0;

    // Average cycle time: avg days from creation to actualCloseDate for won deals
    const wonDeals = deals.filter(d => d.stage.isWon && d.actualCloseDate);
    let avgCycleTime = 0;

    if (wonDeals.length > 0) {
      let totalDays = 0;
      for (const deal of wonDeals) {
        const created = deal.createdAt.getTime();
        const closed = deal.actualCloseDate!.getTime();
        totalDays += (closed - created) / (1000 * 60 * 60 * 24);
      }
      avgCycleTime = Math.round((totalDays / wonDeals.length) * 100) / 100;
    }

    // Deals by stage: group and aggregate
    const stageMap = new Map<string, { stageId: string; stageName: string; count: number; totalValue: number }>();

    for (const deal of deals) {
      const existing = stageMap.get(deal.stageId);
      if (existing) {
        existing.count += 1;
        existing.totalValue += Number(deal.value);
      } else {
        stageMap.set(deal.stageId, {
          stageId: deal.stageId,
          stageName: deal.stage.name,
          count: 1,
          totalValue: Number(deal.value),
        });
      }
    }

    const dealsByStage = Array.from(stageMap.values());

    // If filtering by pipeline, fetch stages that have no deals to include them with count 0
    if (pipelineId) {
      const allStages = await prisma.crmPipelineStage.findMany({
        where: { pipelineId },
        select: { id: true, name: true, position: true },
        orderBy: { position: 'asc' },
      });

      for (const stage of allStages) {
        if (!stageMap.has(stage.id)) {
          dealsByStage.push({
            stageId: stage.id,
            stageName: stage.name,
            count: 0,
            totalValue: 0,
          });
        }
      }

      // Sort by stage position
      const positionMap = new Map(allStages.map(s => [s.id, s.position]));
      dealsByStage.sort((a, b) => (positionMap.get(a.stageId) ?? 0) - (positionMap.get(b.stageId) ?? 0));
    }

    const stats = {
      totalDeals,
      totalValue: Math.round(totalValue * 100) / 100,
      weightedValue: Math.round(weightedValue * 100) / 100,
      winRate: Math.round(winRate * 10000) / 10000, // 4 decimal places
      avgCycleTime,
      wonCount,
      lostCount,
      openCount: totalDeals - closedCount,
      dealsByStage,
    };

    return apiSuccess(stats, { request });
  } catch (error) {
    logger.error('[crm/deals/stats] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError('Failed to fetch deal statistics', ErrorCode.INTERNAL_ERROR, { request });
  }
});
