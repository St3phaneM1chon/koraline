/**
 * Cohort Analysis Engine (J17 - Cohort Analysis)
 * Cohort-based analysis for customer retention, revenue trends,
 * and lead conversion tracking. Returns grid data suitable for
 * heatmap visualization in the admin dashboard.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CohortEntity = 'lead' | 'deal' | 'customer';
export type CohortDimension = 'created_month' | 'first_purchase' | 'source';
export type CohortMetric = 'retention' | 'revenue' | 'conversion' | 'activity';

export interface CohortConfig {
  entity: CohortEntity;
  cohortBy: CohortDimension;
  metric: CohortMetric;
  months?: number;
}

export interface CohortCell {
  period: number; // 0 = cohort month, 1 = month +1, etc.
  value: number;
  count: number;
}

export interface CohortRow {
  cohortKey: string; // e.g., '2026-01' or 'Google Ads'
  cohortSize: number;
  cells: CohortCell[];
}

export interface CohortGrid {
  entity: CohortEntity;
  cohortBy: CohortDimension;
  metric: CohortMetric;
  rows: CohortRow[];
  periodLabels: string[];
  summary: {
    totalCohorts: number;
    totalEntities: number;
    avgFirstPeriodValue: number;
    avgLastPeriodValue: number;
  };
}

export interface CohortComparison {
  cohort1: { key: string; data: CohortRow };
  cohort2: { key: string; data: CohortRow };
  differences: { period: number; diff: number; percentChange: number }[];
  winner: string;
  winnerMetric: number;
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Build a cohort analysis grid from the given configuration.
 */
export async function buildCohort(config: CohortConfig): Promise<CohortGrid> {
  const months = config.months || 12;

  switch (config.metric) {
    case 'retention':
      return getRetentionCohorts(months, config.cohortBy);
    case 'revenue':
      return getRevenueCohorts(months, config.cohortBy);
    case 'conversion':
      return getConversionCohorts(months, config.cohortBy);
    case 'activity':
      return getActivityCohorts(months, config.cohortBy);
    default:
      throw new Error(`Unknown metric: ${config.metric}`);
  }
}

/**
 * Customer retention cohorts by signup month.
 * Shows what percentage of customers from each signup month
 * placed orders in subsequent months.
 */
export async function getRetentionCohorts(
  months: number = 12,
  cohortBy: CohortDimension = 'created_month',
): Promise<CohortGrid> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  // Get customers with their first order date
  const customers = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
      orders: { some: {} },
    },
    select: {
      id: true,
      createdAt: true,
      orders: {
        select: { createdAt: true, total: true, status: true },
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Group customers into cohorts
  const cohortMap = new Map<string, { customerId: string; orderDates: Date[] }[]>();

  for (const customer of customers) {
    const cohortKey = getCohortKey(customer, cohortBy);
    if (!cohortKey) continue;

    const existing = cohortMap.get(cohortKey) || [];
    existing.push({
      customerId: customer.id,
      orderDates: customer.orders.map((o) => o.createdAt),
    });
    cohortMap.set(cohortKey, existing);
  }

  // Build retention grid
  const rows: CohortRow[] = [];
  const maxPeriods = Math.min(months, 12);

  for (const [cohortKey, members] of cohortMap.entries()) {
    const cohortMonth = parseCohortMonth(cohortKey);
    if (!cohortMonth) continue;

    const cells: CohortCell[] = [];

    for (let period = 0; period < maxPeriods; period++) {
      const periodStart = new Date(cohortMonth);
      periodStart.setMonth(periodStart.getMonth() + period);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const activeCount = members.filter((m) =>
        m.orderDates.some((d) => d >= periodStart && d < periodEnd),
      ).length;

      cells.push({
        period,
        value: members.length > 0 ? Math.round((activeCount / members.length) * 100) : 0,
        count: activeCount,
      });
    }

    rows.push({
      cohortKey,
      cohortSize: members.length,
      cells,
    });
  }

  rows.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey));

  const periodLabels = Array.from({ length: maxPeriods }, (_, i) =>
    i === 0 ? 'Month 0' : `Month ${i}`,
  );

  logger.info('[CohortAnalysis] Retention cohorts built', { cohorts: rows.length, months });

  return {
    entity: 'customer',
    cohortBy,
    metric: 'retention',
    rows,
    periodLabels,
    summary: buildSummary(rows),
  };
}

/**
 * Revenue cohorts showing revenue per cohort over time.
 */
export async function getRevenueCohorts(
  months: number = 12,
  cohortBy: CohortDimension = 'created_month',
): Promise<CohortGrid> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const customers = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
      orders: { some: { status: { not: 'CANCELLED' } } },
    },
    select: {
      id: true,
      createdAt: true,
      orders: {
        select: { createdAt: true, total: true, status: true },
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const cohortMap = new Map<string, { orders: { date: Date; total: number }[] }[]>();

  for (const customer of customers) {
    const cohortKey = getCohortKey(customer, cohortBy);
    if (!cohortKey) continue;

    const existing = cohortMap.get(cohortKey) || [];
    existing.push({
      orders: customer.orders.map((o) => ({
        date: o.createdAt,
        total: Number(o.total),
      })),
    });
    cohortMap.set(cohortKey, existing);
  }

  const maxPeriods = Math.min(months, 12);
  const rows: CohortRow[] = [];

  for (const [cohortKey, members] of cohortMap.entries()) {
    const cohortMonth = parseCohortMonth(cohortKey);
    if (!cohortMonth) continue;

    const cells: CohortCell[] = [];

    for (let period = 0; period < maxPeriods; period++) {
      const periodStart = new Date(cohortMonth);
      periodStart.setMonth(periodStart.getMonth() + period);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      let revenue = 0;
      let count = 0;

      for (const member of members) {
        const periodOrders = member.orders.filter(
          (o) => o.date >= periodStart && o.date < periodEnd,
        );
        if (periodOrders.length > 0) {
          count++;
          revenue += periodOrders.reduce((sum, o) => sum + o.total, 0);
        }
      }

      cells.push({
        period,
        value: Math.round(revenue * 100) / 100,
        count,
      });
    }

    rows.push({ cohortKey, cohortSize: members.length, cells });
  }

  rows.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey));

  const periodLabels = Array.from({ length: maxPeriods }, (_, i) =>
    i === 0 ? 'Month 0' : `Month ${i}`,
  );

  logger.info('[CohortAnalysis] Revenue cohorts built', { cohorts: rows.length, months });

  return {
    entity: 'customer',
    cohortBy,
    metric: 'revenue',
    rows,
    periodLabels,
    summary: buildSummary(rows),
  };
}

/**
 * Lead-to-deal conversion cohorts by month.
 */
export async function getConversionCohorts(
  months: number = 12,
  cohortBy: CohortDimension = 'created_month',
): Promise<CohortGrid> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const leads = await prisma.crmLead.findMany({
    where: { createdAt: { gte: startDate } },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      source: true,
      convertedDealId: true,
    },
  });

  const cohortMap = new Map<string, { createdAt: Date; convertedAt: Date | null }[]>();

  for (const lead of leads) {
    const key = cohortBy === 'source'
      ? lead.source || 'Unknown'
      : formatMonthKey(lead.createdAt);

    const existing = cohortMap.get(key) || [];
    // If convertedDealId is set, the lead was converted; use updatedAt as the conversion date
    existing.push({
      createdAt: lead.createdAt,
      convertedAt: lead.convertedDealId ? lead.updatedAt : null,
    });
    cohortMap.set(key, existing);
  }

  const maxPeriods = Math.min(months, 12);
  const rows: CohortRow[] = [];

  for (const [cohortKey, members] of cohortMap.entries()) {
    const cells: CohortCell[] = [];

    if (cohortBy === 'source') {
      // For source-based cohorts, show conversion rate over time since creation
      for (let period = 0; period < maxPeriods; period++) {
        const convertedWithinPeriod = members.filter((m) => {
          if (!m.convertedAt) return false;
          const daysSinceCreation = (m.convertedAt.getTime() - m.createdAt.getTime()) / 86400000;
          return daysSinceCreation <= (period + 1) * 30;
        }).length;

        cells.push({
          period,
          value: members.length > 0 ? Math.round((convertedWithinPeriod / members.length) * 100) : 0,
          count: convertedWithinPeriod,
        });
      }
    } else {
      const cohortMonth = parseCohortMonth(cohortKey);
      if (!cohortMonth) continue;

      for (let period = 0; period < maxPeriods; period++) {
        const cutoffDate = new Date(cohortMonth);
        cutoffDate.setMonth(cutoffDate.getMonth() + period + 1);

        const convertedByPeriod = members.filter(
          (m) => m.convertedAt && m.convertedAt < cutoffDate,
        ).length;

        cells.push({
          period,
          value: members.length > 0 ? Math.round((convertedByPeriod / members.length) * 100) : 0,
          count: convertedByPeriod,
        });
      }
    }

    rows.push({ cohortKey, cohortSize: members.length, cells });
  }

  rows.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey));

  const periodLabels = Array.from({ length: maxPeriods }, (_, i) =>
    i === 0 ? 'Month 0' : `Month ${i}`,
  );

  logger.info('[CohortAnalysis] Conversion cohorts built', { cohorts: rows.length, months });

  return {
    entity: 'lead',
    cohortBy,
    metric: 'conversion',
    rows,
    periodLabels,
    summary: buildSummary(rows),
  };
}

/**
 * Compare two specific cohorts side by side.
 */
export async function getCohortComparison(
  cohortGrid: CohortGrid,
  cohort1Key: string,
  cohort2Key: string,
): Promise<CohortComparison> {
  const row1 = cohortGrid.rows.find((r) => r.cohortKey === cohort1Key);
  const row2 = cohortGrid.rows.find((r) => r.cohortKey === cohort2Key);

  if (!row1) throw new Error(`Cohort "${cohort1Key}" not found`);
  if (!row2) throw new Error(`Cohort "${cohort2Key}" not found`);

  const maxPeriods = Math.min(row1.cells.length, row2.cells.length);
  const differences: CohortComparison['differences'] = [];

  for (let i = 0; i < maxPeriods; i++) {
    const v1 = row1.cells[i]?.value || 0;
    const v2 = row2.cells[i]?.value || 0;
    const diff = v2 - v1;
    const percentChange = v1 !== 0 ? Math.round((diff / v1) * 100) : 0;

    differences.push({ period: i, diff, percentChange });
  }

  const avg1 = row1.cells.length > 0
    ? row1.cells.reduce((s, c) => s + c.value, 0) / row1.cells.length
    : 0;
  const avg2 = row2.cells.length > 0
    ? row2.cells.reduce((s, c) => s + c.value, 0) / row2.cells.length
    : 0;

  return {
    cohort1: { key: cohort1Key, data: row1 },
    cohort2: { key: cohort2Key, data: row2 },
    differences,
    winner: avg1 >= avg2 ? cohort1Key : cohort2Key,
    winnerMetric: Math.max(avg1, avg2),
  };
}

// ---------------------------------------------------------------------------
// Activity Cohorts (internal)
// ---------------------------------------------------------------------------

async function getActivityCohorts(
  months: number,
  cohortBy: CohortDimension,
): Promise<CohortGrid> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: startDate } },
    select: {
      id: true,
      createdAt: true,
    },
    take: 1000,
  });

  const activities = await prisma.crmActivity.findMany({
    where: {
      createdAt: { gte: startDate },
      performedById: { in: users.map((u) => u.id) },
    },
    select: { performedById: true, createdAt: true },
  });

  // Build activity lookup
  const activityByUser = new Map<string, Date[]>();
  for (const a of activities) {
    if (!a.performedById) continue;
    const list = activityByUser.get(a.performedById) || [];
    list.push(a.createdAt);
    activityByUser.set(a.performedById, list);
  }

  const cohortMap = new Map<string, { userId: string; createdAt: Date }[]>();

  for (const user of users) {
    const key = cohortBy === 'created_month' ? formatMonthKey(user.createdAt) : formatMonthKey(user.createdAt);
    const existing = cohortMap.get(key) || [];
    existing.push({ userId: user.id, createdAt: user.createdAt });
    cohortMap.set(key, existing);
  }

  const maxPeriods = Math.min(months, 12);
  const rows: CohortRow[] = [];

  for (const [cohortKey, members] of cohortMap.entries()) {
    const cohortMonth = parseCohortMonth(cohortKey);
    if (!cohortMonth) continue;

    const cells: CohortCell[] = [];

    for (let period = 0; period < maxPeriods; period++) {
      const periodStart = new Date(cohortMonth);
      periodStart.setMonth(periodStart.getMonth() + period);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      let activeCount = 0;
      for (const member of members) {
        const userActivities = activityByUser.get(member.userId) || [];
        if (userActivities.some((d) => d >= periodStart && d < periodEnd)) {
          activeCount++;
        }
      }

      cells.push({
        period,
        value: members.length > 0 ? Math.round((activeCount / members.length) * 100) : 0,
        count: activeCount,
      });
    }

    rows.push({ cohortKey, cohortSize: members.length, cells });
  }

  rows.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey));

  return {
    entity: 'customer',
    cohortBy,
    metric: 'activity',
    rows,
    periodLabels: Array.from({ length: maxPeriods }, (_, i) => `Month ${i}`),
    summary: buildSummary(rows),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseCohortMonth(key: string): Date | null {
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1);
}

function getCohortKey(
  entity: { createdAt: Date; orders?: { createdAt: Date }[] },
  dimension: CohortDimension,
): string {
  if (dimension === 'first_purchase' && entity.orders && entity.orders.length > 0) {
    return formatMonthKey(entity.orders[0].createdAt);
  }
  return formatMonthKey(entity.createdAt);
}

function buildSummary(rows: CohortRow[]): CohortGrid['summary'] {
  const totalEntities = rows.reduce((sum, r) => sum + r.cohortSize, 0);
  const firstPeriodValues = rows.map((r) => r.cells[0]?.value || 0);
  const lastPeriodValues = rows.map((r) => {
    const lastCell = r.cells[r.cells.length - 1];
    return lastCell?.value || 0;
  });

  return {
    totalCohorts: rows.length,
    totalEntities,
    avgFirstPeriodValue:
      firstPeriodValues.length > 0
        ? Math.round((firstPeriodValues.reduce((s, v) => s + v, 0) / firstPeriodValues.length) * 10) / 10
        : 0,
    avgLastPeriodValue:
      lastPeriodValues.length > 0
        ? Math.round((lastPeriodValues.reduce((s, v) => s + v, 0) / lastPeriodValues.length) * 10) / 10
        : 0,
  };
}
