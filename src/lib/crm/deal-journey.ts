/**
 * CRM Deal Journey Analytics (B19)
 *
 * Visualize the complete journey of a deal from creation to close.
 * Similar to HubSpot Enterprise Deal Analytics and Salesforce Path Analytics.
 *
 * Features:
 * - Complete chronological journey: stage changes, activities, tasks, emails
 * - Aggregate journey metrics: avg time per stage, common paths, drop-offs
 * - Winning/losing pattern analysis
 * - Side-by-side deal journey comparison
 * - Activity heatmap by stage and time
 *
 * Data sources: CrmDealStageHistory, CrmActivity, CrmDeal, CrmTask
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JourneyEvent {
  id: string;
  type: 'stage_change' | 'activity' | 'task' | 'note' | 'email' | 'call' | 'meeting';
  title: string;
  description: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface DealJourney {
  dealId: string;
  dealTitle: string;
  dealValue: number;
  currency: string;
  currentStage: string;
  isWon: boolean;
  isLost: boolean;
  createdAt: string;
  closedAt: string | null;
  totalDurationDays: number;
  events: JourneyEvent[];
  stageTimeline: {
    stageName: string;
    enteredAt: string;
    exitedAt: string | null;
    durationHours: number;
  }[];
  touchpointCount: number;
}

export interface JourneyAnalytics {
  pipelineId: string;
  period: { start: string; end: string };
  avgDaysToClose: number;
  avgTouchpoints: number;
  avgStageChanges: number;
  stageMetrics: {
    stageName: string;
    avgDurationHours: number;
    medianDurationHours: number;
    dropOffRate: number;  // % that left the pipeline from this stage
    conversionRate: number; // % that moved to next stage
  }[];
  commonPaths: {
    path: string[];
    count: number;
    percentage: number;
    avgDays: number;
  }[];
  dropOffPoints: {
    stageName: string;
    count: number;
    topReasons: string[];
  }[];
}

export interface WinLossPattern {
  type: 'winning' | 'losing';
  patterns: {
    pattern: string;
    frequency: number;
    avgValue: number;
    examples: string[];
  }[];
  avgTouchpoints: number;
  avgDaysToClose: number;
  topActivities: { type: string; avgCount: number }[];
  commonStageSequences: { sequence: string[]; count: number }[];
}

export interface JourneyComparison {
  deal1: DealJourney;
  deal2: DealJourney;
  differences: {
    metric: string;
    deal1Value: string | number;
    deal2Value: string | number;
  }[];
}

export interface JourneyHeatmapCell {
  stageName: string;
  dayOfWeek: number; // 0=Sunday
  hour: number;      // 0-23
  activityCount: number;
}

// ---------------------------------------------------------------------------
// getDealJourney
// ---------------------------------------------------------------------------

/**
 * Get the complete chronological journey of a deal.
 */
export async function getDealJourney(dealId: string): Promise<DealJourney> {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: {
      stage: true,
      pipeline: true,
    },
  });

  if (!deal) throw new Error('Deal not found');

  // Fetch all journey components
  const [stageHistory, activities, tasks] = await Promise.all([
    prisma.crmDealStageHistory.findMany({
      where: { dealId },
      include: { fromStage: true, toStage: true, changedBy: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.crmActivity.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.crmTask.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Build events timeline
  const events: JourneyEvent[] = [];

  // Stage change events
  for (const sh of stageHistory) {
    events.push({
      id: sh.id,
      type: 'stage_change',
      title: `Stage: ${sh.fromStage?.name || 'New'} -> ${sh.toStage.name}`,
      description: null,
      timestamp: sh.createdAt.toISOString(),
      metadata: {
        fromStage: sh.fromStage?.name || null,
        toStage: sh.toStage.name,
        changedBy: sh.changedBy?.id || null,
        durationInPrevious: sh.duration,
      },
    });
  }

  // Activity events
  for (const act of activities) {
    const typeMap: Record<string, JourneyEvent['type']> = {
      CALL: 'call',
      EMAIL: 'email',
      MEETING: 'meeting',
      NOTE: 'note',
    };

    events.push({
      id: act.id,
      type: typeMap[act.type] || 'activity',
      title: act.title,
      description: act.description,
      timestamp: act.createdAt.toISOString(),
      metadata: {
        activityType: act.type,
        ...(act.metadata as Record<string, unknown> || {}),
      },
    });
  }

  // Task events
  for (const task of tasks) {
    events.push({
      id: task.id,
      type: 'task',
      title: task.title,
      description: task.description,
      timestamp: task.createdAt.toISOString(),
      metadata: {
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() || null,
        completedAt: task.completedAt?.toISOString() || null,
      },
    });
  }

  // Sort all events chronologically
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Build stage timeline
  const stageTimeline: DealJourney['stageTimeline'] = [];
  for (let i = 0; i < stageHistory.length; i++) {
    const sh = stageHistory[i];
    const next = stageHistory[i + 1];
    const enteredAt = sh.createdAt;
    const exitedAt = next?.createdAt || null;
    const durationMs = exitedAt
      ? exitedAt.getTime() - enteredAt.getTime()
      : Date.now() - enteredAt.getTime();

    stageTimeline.push({
      stageName: sh.toStage.name,
      enteredAt: enteredAt.toISOString(),
      exitedAt: exitedAt?.toISOString() || null,
      durationHours: Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10,
    });
  }

  const closedAt = deal.actualCloseDate?.toISOString() || null;
  const totalDurationMs = (deal.actualCloseDate || new Date()).getTime() - deal.createdAt.getTime();
  const totalDurationDays = Math.round((totalDurationMs / (1000 * 60 * 60 * 24)) * 10) / 10;

  return {
    dealId,
    dealTitle: deal.title,
    dealValue: Number(deal.value),
    currency: deal.currency,
    currentStage: deal.stage.name,
    isWon: deal.stage.isWon,
    isLost: deal.stage.isLost,
    createdAt: deal.createdAt.toISOString(),
    closedAt,
    totalDurationDays,
    events,
    stageTimeline,
    touchpointCount: activities.length + tasks.length,
  };
}

// ---------------------------------------------------------------------------
// getJourneyAnalytics
// ---------------------------------------------------------------------------

/**
 * Aggregate journey metrics for a pipeline: avg time per stage, paths, drop-offs.
 */
export async function getJourneyAnalytics(
  pipelineId: string,
  period: { start: Date; end: Date },
): Promise<JourneyAnalytics> {
  const deals = await prisma.crmDeal.findMany({
    where: {
      pipelineId,
      createdAt: { gte: period.start, lte: period.end },
    },
    include: {
      stage: true,
      stageHistory: {
        include: { fromStage: true, toStage: true },
        orderBy: { createdAt: 'asc' },
      },
      activities: true,
    },
  });

  if (deals.length === 0) {
    return {
      pipelineId,
      period: { start: period.start.toISOString(), end: period.end.toISOString() },
      avgDaysToClose: 0,
      avgTouchpoints: 0,
      avgStageChanges: 0,
      stageMetrics: [],
      commonPaths: [],
      dropOffPoints: [],
    };
  }

  // Calculate overall metrics
  const closedDeals = deals.filter((d) => d.actualCloseDate);
  const avgDaysToClose = closedDeals.length > 0
    ? closedDeals.reduce((sum, d) => {
        const days = (d.actualCloseDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / closedDeals.length
    : 0;

  const avgTouchpoints = deals.reduce((sum, d) => sum + d.activities.length, 0) / deals.length;
  const avgStageChanges = deals.reduce((sum, d) => sum + d.stageHistory.length, 0) / deals.length;

  // Stage metrics
  const stageStats = new Map<string, { durations: number[]; exits: number; advances: number; total: number }>();

  for (const deal of deals) {
    for (let i = 0; i < deal.stageHistory.length; i++) {
      const sh = deal.stageHistory[i];
      const stageName = sh.toStage.name;

      if (!stageStats.has(stageName)) {
        stageStats.set(stageName, { durations: [], exits: 0, advances: 0, total: 0 });
      }
      const stats = stageStats.get(stageName)!;
      stats.total++;

      if (sh.duration > 0) {
        stats.durations.push(sh.duration / 3600); // Convert seconds to hours
      }

      const next = deal.stageHistory[i + 1];
      if (next) {
        stats.advances++;
      } else if (deal.stage.isLost) {
        stats.exits++;
      }
    }
  }

  const stageMetrics = Array.from(stageStats.entries()).map(([stageName, stats]) => {
    const sorted = [...stats.durations].sort((a, b) => a - b);
    const avgDuration = sorted.length > 0
      ? sorted.reduce((a, b) => a + b, 0) / sorted.length
      : 0;
    const medianDuration = sorted.length > 0
      ? sorted[Math.floor(sorted.length / 2)]
      : 0;

    return {
      stageName,
      avgDurationHours: Math.round(avgDuration * 10) / 10,
      medianDurationHours: Math.round(medianDuration * 10) / 10,
      dropOffRate: stats.total > 0 ? Math.round((stats.exits / stats.total) * 10000) / 100 : 0,
      conversionRate: stats.total > 0 ? Math.round((stats.advances / stats.total) * 10000) / 100 : 0,
    };
  });

  // Common paths
  const pathCounts = new Map<string, { count: number; totalDays: number }>();
  for (const deal of deals) {
    const path = deal.stageHistory.map((sh) => sh.toStage.name);
    const pathKey = path.join(' -> ');
    const existing = pathCounts.get(pathKey) || { count: 0, totalDays: 0 };
    const days = ((deal.actualCloseDate || new Date()).getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    pathCounts.set(pathKey, { count: existing.count + 1, totalDays: existing.totalDays + days });
  }

  const commonPaths = Array.from(pathCounts.entries())
    .map(([pathStr, data]) => ({
      path: pathStr.split(' -> '),
      count: data.count,
      percentage: Math.round((data.count / deals.length) * 10000) / 100,
      avgDays: Math.round((data.totalDays / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Drop-off points
  const lostDeals = deals.filter((d) => d.stage.isLost);
  const dropOffMap = new Map<string, { count: number; reasons: string[] }>();

  for (const deal of lostDeals) {
    const lastStage = deal.stageHistory.length > 0
      ? deal.stageHistory[deal.stageHistory.length - 1].toStage.name
      : deal.stage.name;

    const existing = dropOffMap.get(lastStage) || { count: 0, reasons: [] };
    existing.count++;
    if (deal.lostReason) existing.reasons.push(deal.lostReason);
    dropOffMap.set(lastStage, existing);
  }

  const dropOffPoints = Array.from(dropOffMap.entries())
    .map(([stageName, data]) => ({
      stageName,
      count: data.count,
      topReasons: [...new Set(data.reasons)].slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count);

  logger.info('[Deal-Journey] Analytics generated', {
    pipelineId,
    deals: deals.length,
    avgDaysToClose: Math.round(avgDaysToClose * 10) / 10,
  });

  return {
    pipelineId,
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    avgDaysToClose: Math.round(avgDaysToClose * 10) / 10,
    avgTouchpoints: Math.round(avgTouchpoints * 10) / 10,
    avgStageChanges: Math.round(avgStageChanges * 10) / 10,
    stageMetrics,
    commonPaths,
    dropOffPoints,
  };
}

// ---------------------------------------------------------------------------
// getWinningPatterns
// ---------------------------------------------------------------------------

/**
 * Analyze won deals for common journey patterns.
 */
export async function getWinningPatterns(
  pipelineId: string,
): Promise<WinLossPattern> {
  return analyzePatterns(pipelineId, 'winning');
}

// ---------------------------------------------------------------------------
// getLosingPatterns
// ---------------------------------------------------------------------------

/**
 * Analyze lost deals for common anti-patterns.
 */
export async function getLosingPatterns(
  pipelineId: string,
): Promise<WinLossPattern> {
  return analyzePatterns(pipelineId, 'losing');
}

/**
 * Shared analysis logic for winning/losing patterns.
 */
async function analyzePatterns(
  pipelineId: string,
  type: 'winning' | 'losing',
): Promise<WinLossPattern> {
  const isWon = type === 'winning';

  const deals = await prisma.crmDeal.findMany({
    where: {
      pipelineId,
      stage: isWon ? { isWon: true } : { isLost: true },
    },
    include: {
      stageHistory: {
        include: { toStage: true },
        orderBy: { createdAt: 'asc' },
      },
      activities: true,
      tasks: true,
    },
    take: 500,
  });

  if (deals.length === 0) {
    return { type, patterns: [], avgTouchpoints: 0, avgDaysToClose: 0, topActivities: [], commonStageSequences: [] };
  }

  // Average metrics
  const avgTouchpoints = deals.reduce((sum, d) => sum + d.activities.length, 0) / deals.length;
  const closedDeals = deals.filter((d) => d.actualCloseDate);
  const avgDaysToClose = closedDeals.length > 0
    ? closedDeals.reduce((sum, d) => {
        return sum + (d.actualCloseDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / closedDeals.length
    : 0;

  // Activity type distribution
  const activityTypeCounts = new Map<string, number>();
  for (const deal of deals) {
    for (const act of deal.activities) {
      activityTypeCounts.set(act.type, (activityTypeCounts.get(act.type) || 0) + 1);
    }
  }

  const topActivities = Array.from(activityTypeCounts.entries())
    .map(([actType, count]) => ({
      type: actType,
      avgCount: Math.round((count / deals.length) * 10) / 10,
    }))
    .sort((a, b) => b.avgCount - a.avgCount);

  // Stage sequences
  const sequenceCounts = new Map<string, number>();
  for (const deal of deals) {
    const seq = deal.stageHistory.map((sh) => sh.toStage.name);
    const key = seq.join(' -> ');
    sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
  }

  const commonStageSequences = Array.from(sequenceCounts.entries())
    .map(([key, count]) => ({ sequence: key.split(' -> '), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Identify patterns
  const patterns: WinLossPattern['patterns'] = [];

  // Pattern: High activity deals
  const highActivity = deals.filter((d) => d.activities.length > avgTouchpoints * 1.5);
  if (highActivity.length > deals.length * 0.3) {
    patterns.push({
      pattern: isWon ? 'High engagement leads to wins' : 'Excessive activity without progress',
      frequency: Math.round((highActivity.length / deals.length) * 100),
      avgValue: highActivity.reduce((s, d) => s + Number(d.value), 0) / highActivity.length,
      examples: highActivity.slice(0, 3).map((d) => d.title),
    });
  }

  // Pattern: Quick close
  const quickClose = closedDeals.filter((d) => {
    const days = (d.actualCloseDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return days < avgDaysToClose * 0.5;
  });
  if (quickClose.length > 0) {
    patterns.push({
      pattern: isWon ? 'Quick decision-maker engagement' : 'Deals abandoned early',
      frequency: Math.round((quickClose.length / deals.length) * 100),
      avgValue: quickClose.reduce((s, d) => s + Number(d.value), 0) / quickClose.length,
      examples: quickClose.slice(0, 3).map((d) => d.title),
    });
  }

  return {
    type,
    patterns,
    avgTouchpoints: Math.round(avgTouchpoints * 10) / 10,
    avgDaysToClose: Math.round(avgDaysToClose * 10) / 10,
    topActivities,
    commonStageSequences,
  };
}

// ---------------------------------------------------------------------------
// compareJourneys
// ---------------------------------------------------------------------------

/**
 * Side-by-side comparison of two deal journeys.
 */
export async function compareJourneys(
  dealId1: string,
  dealId2: string,
): Promise<JourneyComparison> {
  const [deal1, deal2] = await Promise.all([
    getDealJourney(dealId1),
    getDealJourney(dealId2),
  ]);

  const differences: JourneyComparison['differences'] = [
    { metric: 'Value', deal1Value: deal1.dealValue, deal2Value: deal2.dealValue },
    { metric: 'Duration (days)', deal1Value: deal1.totalDurationDays, deal2Value: deal2.totalDurationDays },
    { metric: 'Touchpoints', deal1Value: deal1.touchpointCount, deal2Value: deal2.touchpointCount },
    { metric: 'Stage changes', deal1Value: deal1.stageTimeline.length, deal2Value: deal2.stageTimeline.length },
    { metric: 'Outcome', deal1Value: deal1.isWon ? 'Won' : deal1.isLost ? 'Lost' : 'Open', deal2Value: deal2.isWon ? 'Won' : deal2.isLost ? 'Lost' : 'Open' },
    { metric: 'Current stage', deal1Value: deal1.currentStage, deal2Value: deal2.currentStage },
    { metric: 'Events', deal1Value: deal1.events.length, deal2Value: deal2.events.length },
  ];

  return { deal1, deal2, differences };
}

// ---------------------------------------------------------------------------
// getJourneyHeatmap
// ---------------------------------------------------------------------------

/**
 * Generate a heatmap of activity by stage and time (day of week x hour).
 */
export async function getJourneyHeatmap(
  pipelineId: string,
): Promise<JourneyHeatmapCell[]> {
  const activities = await prisma.crmActivity.findMany({
    where: {
      deal: { pipelineId },
    },
    include: {
      deal: {
        include: { stage: true },
      },
    },
    take: 10000,
  });

  const cellMap = new Map<string, JourneyHeatmapCell>();

  for (const act of activities) {
    if (!act.deal) continue;

    const date = new Date(act.createdAt);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const stageName = act.deal.stage.name;
    const key = `${stageName}-${dayOfWeek}-${hour}`;

    const existing = cellMap.get(key) || {
      stageName,
      dayOfWeek,
      hour,
      activityCount: 0,
    };
    existing.activityCount++;
    cellMap.set(key, existing);
  }

  return Array.from(cellMap.values()).sort(
    (a, b) => b.activityCount - a.activityCount,
  );
}
