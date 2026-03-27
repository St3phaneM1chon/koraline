/**
 * API: /api/admin/platform/analytics
 * Super-admin only — Platform-wide revenue analytics for MRR trends, churn, and module popularity.
 * GET: Returns MRR/ARR totals, plan breakdown, monthly trend, churn rate, and module stats.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { KORALINE_PLANS, KORALINE_MODULES, type KoralinePlan, type KoralineModule } from '@/lib/stripe-constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSuperAdmin(session: { user: { role?: string; tenantId?: string } }): boolean {
  return session.user.role === 'OWNER' && session.user.tenantId === process.env.PLATFORM_TENANT_ID;
}

function computeMRR(plan: string, modulesEnabled: string[]): number {
  const planPrice = KORALINE_PLANS[plan as KoralinePlan]?.monthlyPrice || 0;
  const modulePrice = modulesEnabled.reduce((sum, key) => {
    return sum + (KORALINE_MODULES[key as KoralineModule]?.monthlyPrice || 0);
  }, 0);
  return planPrice + modulePrice;
}

/** Parse modulesEnabled JSON safely from a tenant record. */
function parseModules(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }
  return [];
}

/** Return a YYYY-MM string for a given Date. */
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Generate an ordered array of YYYY-MM keys from `start` to `end` (inclusive). */
function monthRange(start: Date, end: Date): string[] {
  const months: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(toMonthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

// ---------------------------------------------------------------------------
// GET — Platform-wide revenue analytics
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request: NextRequest, { session }) => {
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super-admin access required' }, { status: 403 });
  }

  try {
    // Parse period query param
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6m';
    const now = new Date();
    let periodStart: Date;
    switch (period) {
      case '12m':
        periodStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'all':
        periodStart = new Date(2020, 0, 1); // far enough back
        break;
      case '6m':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
    }

    // Fetch all tenants (platform-level, no tenant filter)
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        plan: true,
        status: true,
        modulesEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ------ Current totals (ACTIVE tenants only) ------
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
    let totalMRR = 0;
    const mrrByPlanMap = new Map<string, { mrr: number; count: number }>();

    // Module popularity tracking
    const moduleCountMap = new Map<string, number>();
    const moduleRevenueMap = new Map<string, number>();

    for (const t of activeTenants) {
      const modules = parseModules(t.modulesEnabled);
      const mrr = computeMRR(t.plan, modules);
      totalMRR += mrr;

      // Plan breakdown
      const existing = mrrByPlanMap.get(t.plan) || { mrr: 0, count: 0 };
      existing.mrr += mrr;
      existing.count += 1;
      mrrByPlanMap.set(t.plan, existing);

      // Module popularity (count add-on modules only — those in KORALINE_MODULES)
      for (const mod of modules) {
        if (mod in KORALINE_MODULES) {
          moduleCountMap.set(mod, (moduleCountMap.get(mod) || 0) + 1);
          const modPrice = KORALINE_MODULES[mod as KoralineModule]?.monthlyPrice || 0;
          moduleRevenueMap.set(mod, (moduleRevenueMap.get(mod) || 0) + modPrice);
        }
      }
    }

    const totalClients = activeTenants.length;
    const avgArpu = totalClients > 0 ? Math.round(totalMRR / totalClients) : 0;

    // MRR by plan
    const mrrByPlan = Array.from(mrrByPlanMap.entries())
      .map(([plan, data]) => ({ plan, mrr: data.mrr, count: data.count }))
      .sort((a, b) => b.mrr - a.mrr);

    // ------ MRR Trend (monthly data points) ------
    // For each month in the period, compute cumulative MRR by counting tenants
    // that were created on or before that month-end and are currently ACTIVE.
    // Cancelled/suspended tenants are excluded from their cancellation month onward.
    const months = monthRange(periodStart, now);
    const mrrTrend = months.map(monthKey => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      // End of this month
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      let monthMRR = 0;
      let monthClients = 0;

      for (const t of tenants) {
        // Tenant must have been created on or before this month
        if (t.createdAt > monthEnd) continue;

        // If tenant is cancelled/suspended, check if that happened before this month-end
        if (t.status === 'CANCELLED' || t.status === 'SUSPENDED') {
          if (t.updatedAt <= monthEnd) continue; // was already gone by this month
        }

        const modules = parseModules(t.modulesEnabled);
        monthMRR += computeMRR(t.plan, modules);
        monthClients += 1;
      }

      return { month: monthKey, mrr: monthMRR, clients: monthClients };
    });

    // ------ Churn data (last 30 days) ------
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const cancelledClients30d = tenants.filter(
      t => (t.status === 'CANCELLED' || t.status === 'SUSPENDED') && t.updatedAt >= thirtyDaysAgo
    ).length;

    const newClients30d = tenants.filter(t => t.createdAt >= thirtyDaysAgo).length;

    // Churn rate = cancelled in 30d / (active + cancelled in 30d) — standard logo churn
    const churnBase = totalClients + cancelledClients30d;
    const churnRate = churnBase > 0
      ? Math.round((cancelledClients30d / churnBase) * 10000) / 100 // 2 decimal %
      : 0;

    // ------ Module popularity ------
    const modulePopularity = Array.from(moduleCountMap.entries())
      .map(([mod, count]) => ({
        module: mod,
        count,
        revenue: moduleRevenueMap.get(mod) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      // Current totals
      totalMRR,
      totalARR: totalMRR * 12,
      totalClients,
      avgArpu,

      // Breakdown
      mrrByPlan,

      // Trend
      mrrTrend,

      // Churn
      churnRate,
      newClients30d,
      cancelledClients30d,

      // Modules
      modulePopularity,
    });
  } catch (error) {
    logger.error('Failed to compute platform analytics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { skipCsrf: true });
