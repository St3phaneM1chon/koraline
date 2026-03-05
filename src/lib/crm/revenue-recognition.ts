/**
 * CRM Revenue Recognition Rules / ASC 606 (B15)
 *
 * Revenue recognition per ASC 606 (IFRS 15) standard.
 * Similar to Salesforce Revenue Cloud, NetSuite Revenue Management.
 *
 * ASC 606 Five-Step Model:
 * 1. Identify the contract
 * 2. Identify performance obligations
 * 3. Determine transaction price
 * 4. Allocate price to obligations
 * 5. Recognize revenue when/as obligations are satisfied
 *
 * Recognition methods:
 * - point_in_time: Revenue recognized at delivery/transfer
 * - over_time: Revenue recognized over service period
 * - milestone: Revenue recognized at milestone completion
 *
 * Recognition schedules stored in CrmDeal.metadata JSON.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecognitionMethod = 'point_in_time' | 'over_time' | 'milestone';

export interface RevenueRulesConfig {
  recognitionMethod: RecognitionMethod;
  performanceObligations: string[];
  servicePeriodMonths?: number;
  milestones?: {
    name: string;
    percentage: number; // % of total to recognize
  }[];
}

export interface RevenueScheduleEntry {
  month: string;           // YYYY-MM
  amount: number;
  recognized: boolean;
  recognizedAt: string | null;
  obligation: string;
  method: RecognitionMethod;
}

export interface RevenueSchedule {
  dealId: string;
  dealTitle: string;
  totalValue: number;
  currency: string;
  method: RecognitionMethod;
  entries: RevenueScheduleEntry[];
  totalRecognized: number;
  totalDeferred: number;
}

export interface DeferredRevenueReport {
  period: { start: string; end: string };
  totalDeferred: number;
  byDeal: {
    dealId: string;
    dealTitle: string;
    deferredAmount: number;
    expectedRecognitionDate: string;
  }[];
  byObligation: {
    obligation: string;
    deferredAmount: number;
  }[];
}

export interface RecognizedRevenueReport {
  period: { start: string; end: string };
  totalRecognized: number;
  byMonth: {
    month: string;
    amount: number;
  }[];
  byDeal: {
    dealId: string;
    dealTitle: string;
    recognizedAmount: number;
  }[];
}

export interface ASC606Report {
  period: { start: string; end: string };
  contractRevenue: number;
  recognizedRevenue: number;
  deferredRevenue: number;
  unbilledRevenue: number;
  performanceObligations: {
    obligation: string;
    totalAllocated: number;
    recognized: number;
    deferred: number;
    method: RecognitionMethod;
  }[];
  contractLiabilities: number;
  contractAssets: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get revenue rules config from audit trail (config storage pattern).
 */
async function getDefaultRules(): Promise<RevenueRulesConfig> {
  try {
    const trail = await prisma.auditTrail.findFirst({
      where: { entityType: 'REVENUE_RECOGNITION_RULES', action: 'CONFIG' },
      orderBy: { createdAt: 'desc' },
    });
    if (trail?.metadata) {
      return trail.metadata as unknown as RevenueRulesConfig;
    }
  } catch {
    // Fall through to defaults
  }

  return {
    recognitionMethod: 'point_in_time',
    performanceObligations: ['Product Delivery'],
  };
}

// ---------------------------------------------------------------------------
// configureRevenueRules
// ---------------------------------------------------------------------------

/**
 * Setup revenue recognition rules at the organization level.
 */
export async function configureRevenueRules(
  config: RevenueRulesConfig,
): Promise<{ success: boolean; error?: string }> {
  if (!config.recognitionMethod) {
    return { success: false, error: 'recognitionMethod is required' };
  }
  if (!config.performanceObligations || config.performanceObligations.length === 0) {
    return { success: false, error: 'At least one performance obligation is required' };
  }

  if (config.recognitionMethod === 'milestone') {
    if (!config.milestones || config.milestones.length === 0) {
      return { success: false, error: 'Milestones are required for milestone recognition' };
    }
    const totalPct = config.milestones.reduce((sum, m) => sum + m.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return { success: false, error: `Milestone percentages must sum to 100% (got ${totalPct}%)` };
    }
  }

  if (config.recognitionMethod === 'over_time' && !config.servicePeriodMonths) {
    return { success: false, error: 'servicePeriodMonths is required for over_time recognition' };
  }

  await prisma.auditTrail.create({
    data: {
      entityType: 'REVENUE_RECOGNITION_RULES',
      entityId: 'default',
      action: 'CONFIG',
      userId: 'system',
      metadata: config as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info('[Revenue] Recognition rules configured', {
    method: config.recognitionMethod,
    obligations: config.performanceObligations.length,
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// recognizeRevenue
// ---------------------------------------------------------------------------

/**
 * Apply revenue recognition rules to a deal.
 * Generates a recognition schedule based on the configured method.
 */
export async function recognizeRevenue(dealId: string): Promise<RevenueSchedule> {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: { stage: true, products: true },
  });

  if (!deal) throw new Error('Deal not found');

  const rules = await getDefaultRules();
  const dealValue = Number(deal.value);
  const entries: RevenueScheduleEntry[] = [];
  const now = new Date();

  switch (rules.recognitionMethod) {
    case 'point_in_time': {
      // Recognize full revenue at close/delivery
      const closeDate = deal.actualCloseDate || deal.expectedCloseDate || now;
      const month = formatMonth(closeDate);
      const isRecognized = deal.stage.isWon === true;

      for (const obligation of rules.performanceObligations) {
        const amount = dealValue / rules.performanceObligations.length;
        entries.push({
          month,
          amount: Math.round(amount * 100) / 100,
          recognized: isRecognized,
          recognizedAt: isRecognized ? closeDate.toISOString() : null,
          obligation,
          method: 'point_in_time',
        });
      }
      break;
    }

    case 'over_time': {
      // Spread revenue evenly over service period
      const startDate = deal.actualCloseDate || deal.expectedCloseDate || now;
      const months = rules.servicePeriodMonths || 12;
      const monthlyAmount = dealValue / months;

      for (let i = 0; i < months; i++) {
        const entryDate = new Date(startDate);
        entryDate.setMonth(entryDate.getMonth() + i);
        const month = formatMonth(entryDate);
        const isRecognized = deal.stage.isWon === true && entryDate <= now;

        entries.push({
          month,
          amount: Math.round(monthlyAmount * 100) / 100,
          recognized: isRecognized,
          recognizedAt: isRecognized ? entryDate.toISOString() : null,
          obligation: rules.performanceObligations[0] || 'Service',
          method: 'over_time',
        });
      }
      break;
    }

    case 'milestone': {
      // Recognize at milestone completion
      const closeDate = deal.actualCloseDate || deal.expectedCloseDate || now;
      const milestones = rules.milestones || [];

      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const milestoneDate = new Date(closeDate);
        milestoneDate.setMonth(milestoneDate.getMonth() + i);
        const amount = (dealValue * milestone.percentage) / 100;

        entries.push({
          month: formatMonth(milestoneDate),
          amount: Math.round(amount * 100) / 100,
          recognized: false,
          recognizedAt: null,
          obligation: milestone.name,
          method: 'milestone',
        });
      }
      break;
    }
  }

  // Store schedule in deal metadata
  const schedule: RevenueSchedule = {
    dealId,
    dealTitle: deal.title,
    totalValue: dealValue,
    currency: deal.currency,
    method: rules.recognitionMethod,
    entries,
    totalRecognized: entries.filter((e) => e.recognized).reduce((s, e) => s + e.amount, 0),
    totalDeferred: entries.filter((e) => !e.recognized).reduce((s, e) => s + e.amount, 0),
  };

  await prisma.crmDeal.update({
    where: { id: dealId },
    data: {
      customFields: {
        ...(deal.customFields as Record<string, unknown> || {}),
        revenueSchedule: schedule,
        revenueScheduleUpdatedAt: new Date().toISOString(),
      } as unknown as Prisma.InputJsonValue,
    },
  });

  logger.info('[Revenue] Recognition schedule generated', {
    dealId,
    method: rules.recognitionMethod,
    totalValue: dealValue,
    recognized: schedule.totalRecognized,
    deferred: schedule.totalDeferred,
  });

  return schedule;
}

// ---------------------------------------------------------------------------
// getRevenueSchedule
// ---------------------------------------------------------------------------

/**
 * Get the revenue recognition schedule for a deal.
 */
export async function getRevenueSchedule(dealId: string): Promise<RevenueSchedule | null> {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    select: { customFields: true, title: true, value: true, currency: true },
  });

  if (!deal) return null;

  const meta = (deal.customFields as Record<string, unknown>) || {};
  const schedule = meta.revenueSchedule as RevenueSchedule | undefined;

  if (!schedule) return null;

  return {
    ...schedule,
    dealId,
    dealTitle: deal.title,
    totalValue: Number(deal.value),
    currency: deal.currency,
  };
}

// ---------------------------------------------------------------------------
// getDeferredRevenue
// ---------------------------------------------------------------------------

/**
 * Get total deferred revenue (contracted but not yet earned) for a period.
 */
export async function getDeferredRevenue(
  period: { start: Date; end: Date },
): Promise<DeferredRevenueReport> {
  // Get all won deals with revenue schedules
  const deals = await prisma.crmDeal.findMany({
    where: {
      stage: { isWon: true },
      customFields: { not: Prisma.JsonNull },
    },
    select: { id: true, title: true, customFields: true },
  });

  const byDeal: DeferredRevenueReport['byDeal'] = [];
  const obligationTotals = new Map<string, number>();
  let totalDeferred = 0;

  for (const deal of deals) {
    const meta = (deal.customFields as Record<string, unknown>) || {};
    const schedule = meta.revenueSchedule as RevenueSchedule | undefined;
    if (!schedule?.entries) continue;

    let dealDeferred = 0;
    let lastExpectedDate = '';

    for (const entry of schedule.entries) {
      if (!entry.recognized) {
        const entryDate = new Date(entry.month + '-01');
        if (entryDate >= period.start && entryDate <= period.end) {
          dealDeferred += entry.amount;
          lastExpectedDate = entry.month;

          const current = obligationTotals.get(entry.obligation) || 0;
          obligationTotals.set(entry.obligation, current + entry.amount);
        }
      }
    }

    if (dealDeferred > 0) {
      byDeal.push({
        dealId: deal.id,
        dealTitle: deal.title,
        deferredAmount: Math.round(dealDeferred * 100) / 100,
        expectedRecognitionDate: lastExpectedDate,
      });
      totalDeferred += dealDeferred;
    }
  }

  return {
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    totalDeferred: Math.round(totalDeferred * 100) / 100,
    byDeal,
    byObligation: Array.from(obligationTotals.entries()).map(([obligation, amount]) => ({
      obligation,
      deferredAmount: Math.round(amount * 100) / 100,
    })),
  };
}

// ---------------------------------------------------------------------------
// getRecognizedRevenue
// ---------------------------------------------------------------------------

/**
 * Get revenue recognized in a period.
 */
export async function getRecognizedRevenue(
  period: { start: Date; end: Date },
): Promise<RecognizedRevenueReport> {
  const deals = await prisma.crmDeal.findMany({
    where: {
      stage: { isWon: true },
      customFields: { not: Prisma.JsonNull },
    },
    select: { id: true, title: true, customFields: true },
  });

  const monthlyTotals = new Map<string, number>();
  const dealTotals = new Map<string, { title: string; amount: number }>();
  let totalRecognized = 0;

  for (const deal of deals) {
    const meta = (deal.customFields as Record<string, unknown>) || {};
    const schedule = meta.revenueSchedule as RevenueSchedule | undefined;
    if (!schedule?.entries) continue;

    let dealRecognized = 0;

    for (const entry of schedule.entries) {
      if (entry.recognized && entry.recognizedAt) {
        const recognizedDate = new Date(entry.recognizedAt);
        if (recognizedDate >= period.start && recognizedDate <= period.end) {
          dealRecognized += entry.amount;
          const monthKey = entry.month;
          monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + entry.amount);
        }
      }
    }

    if (dealRecognized > 0) {
      dealTotals.set(deal.id, { title: deal.title, amount: dealRecognized });
      totalRecognized += dealRecognized;
    }
  }

  return {
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    totalRecognized: Math.round(totalRecognized * 100) / 100,
    byMonth: Array.from(monthlyTotals.entries())
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byDeal: Array.from(dealTotals.entries()).map(([dealId, data]) => ({
      dealId,
      dealTitle: data.title,
      recognizedAmount: Math.round(data.amount * 100) / 100,
    })),
  };
}

// ---------------------------------------------------------------------------
// generateASC606Report
// ---------------------------------------------------------------------------

/**
 * Generate an ASC 606 compliant revenue report for a period.
 */
export async function generateASC606Report(
  period: { start: Date; end: Date },
): Promise<ASC606Report> {
  const recognized = await getRecognizedRevenue(period);
  const deferred = await getDeferredRevenue(period);

  // Get total contract value for won deals in the period
  const wonDeals = await prisma.crmDeal.findMany({
    where: {
      stage: { isWon: true },
      actualCloseDate: { gte: period.start, lte: period.end },
    },
    select: { value: true, customFields: true },
  });

  const contractRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);

  // Build performance obligation breakdown
  const obligationMap = new Map<string, {
    totalAllocated: number;
    recognized: number;
    deferred: number;
    method: RecognitionMethod;
  }>();

  for (const deal of wonDeals) {
    const meta = (deal.customFields as Record<string, unknown>) || {};
    const schedule = meta.revenueSchedule as RevenueSchedule | undefined;
    if (!schedule?.entries) continue;

    for (const entry of schedule.entries) {
      const existing = obligationMap.get(entry.obligation) || {
        totalAllocated: 0,
        recognized: 0,
        deferred: 0,
        method: entry.method,
      };
      existing.totalAllocated += entry.amount;
      if (entry.recognized) {
        existing.recognized += entry.amount;
      } else {
        existing.deferred += entry.amount;
      }
      obligationMap.set(entry.obligation, existing);
    }
  }

  const report: ASC606Report = {
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    contractRevenue: Math.round(contractRevenue * 100) / 100,
    recognizedRevenue: recognized.totalRecognized,
    deferredRevenue: deferred.totalDeferred,
    unbilledRevenue: Math.max(0, Math.round((recognized.totalRecognized - contractRevenue) * 100) / 100),
    performanceObligations: Array.from(obligationMap.entries()).map(([obligation, data]) => ({
      obligation,
      totalAllocated: Math.round(data.totalAllocated * 100) / 100,
      recognized: Math.round(data.recognized * 100) / 100,
      deferred: Math.round(data.deferred * 100) / 100,
      method: data.method,
    })),
    contractLiabilities: deferred.totalDeferred, // Deferred = liability
    contractAssets: Math.max(0, recognized.totalRecognized - contractRevenue),
  };

  logger.info('[Revenue] ASC 606 report generated', {
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    contractRevenue: report.contractRevenue,
    recognized: report.recognizedRevenue,
    deferred: report.deferredRevenue,
  });

  return report;
}
