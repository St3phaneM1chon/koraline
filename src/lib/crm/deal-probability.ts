/**
 * #32 Predictive Deal Closure
 * Show probability % on each deal based on historical stage conversion rates.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface DealProbability {
  dealId: string;
  dealName: string;
  currentStage: string;
  probability: number; // 0-100
  value: number;
  expectedValue: number; // value * probability
  daysInStage: number;
  factors: ProbabilityFactor[];
}

export interface ProbabilityFactor {
  name: string;
  impact: number; // -20 to +20
  description: string;
}

// Default stage probabilities (can be calibrated from historical data)
const STAGE_PROBABILITIES: Record<string, number> = {
  NEW: 10,
  QUALIFIED: 25,
  PROPOSAL: 50,
  NEGOTIATION: 70,
  CONTRACT: 85,
  WON: 100,
  LOST: 0,
};

/**
 * Calculate closure probability for a deal.
 */
export async function calculateDealProbability(dealId: string): Promise<DealProbability | null> {
  try {
    const deal = await prisma.crmDeal.findUnique({
      where: { id: dealId },
      include: {
        stage: true,
        contact: {
          select: {
            id: true,
            orders: { select: { total: true }, take: 10 },
          },
        },
        activities: {
          select: { type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!deal) return null;

    const stageName = deal.stage?.name || 'NEW';
    let baseProbability = STAGE_PROBABILITIES[stageName.toUpperCase()] ?? 20;
    const factors: ProbabilityFactor[] = [];

    // Factor 1: Days in current stage (stale deals have lower probability)
    const daysInStage = deal.stage
      ? Math.floor((Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysInStage > 30) {
      const penalty = Math.min(15, Math.floor(daysInStage / 10));
      baseProbability -= penalty;
      factors.push({
        name: 'Stale Deal',
        impact: -penalty,
        description: `${daysInStage} days in "${stageName}" stage`,
      });
    }

    // Factor 2: Recent activity (engaged deals close better)
    const recentActivities = deal.activities?.filter(
      a => (Date.now() - a.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length || 0;

    if (recentActivities >= 3) {
      baseProbability += 10;
      factors.push({
        name: 'Active Engagement',
        impact: 10,
        description: `${recentActivities} activities in last 7 days`,
      });
    } else if (recentActivities === 0) {
      baseProbability -= 10;
      factors.push({
        name: 'No Recent Activity',
        impact: -10,
        description: 'No activities in last 7 days',
      });
    }

    // Factor 3: Existing customer (repeat buyers close faster)
    const previousOrders = deal.contact?.orders?.length || 0;
    if (previousOrders > 0) {
      const bonus = Math.min(15, previousOrders * 5);
      baseProbability += bonus;
      factors.push({
        name: 'Existing Customer',
        impact: bonus,
        description: `${previousOrders} previous orders`,
      });
    }

    // Factor 4: Deal value (very large deals take longer, slightly lower probability)
    const dealValue = Number(deal.value) || 0;
    if (dealValue > 5000) {
      baseProbability -= 5;
      factors.push({
        name: 'High-Value Deal',
        impact: -5,
        description: `$${dealValue.toFixed(0)} deal requires more decision-makers`,
      });
    }

    // Clamp probability
    const probability = Math.max(5, Math.min(95, Math.round(baseProbability)));
    const expectedValue = Math.round(dealValue * probability / 100);

    return {
      dealId: deal.id,
      dealName: deal.title || `Deal #${deal.id.slice(0, 8)}`,
      currentStage: stageName,
      probability,
      value: dealValue,
      expectedValue,
      daysInStage,
      factors,
    };
  } catch (error) {
    logger.error('[deal-probability] Error:', error);
    return null;
  }
}

/**
 * Batch calculate probabilities for pipeline view.
 */
export async function getPipelineProbabilities(): Promise<DealProbability[]> {
  try {
    const deals = await prisma.crmDeal.findMany({
      where: {
        stage: { isWon: false, isLost: false },
      },
      select: { id: true },
      take: 100,
    });

    const results = await Promise.all(
      deals.map(d => calculateDealProbability(d.id))
    );

    return results.filter((r): r is DealProbability => r !== null);
  } catch (error) {
    logger.error('[deal-probability] Pipeline error:', error);
    return [];
  }
}
