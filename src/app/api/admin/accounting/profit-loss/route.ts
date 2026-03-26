export const dynamic = 'force-dynamic';

/**
 * Admin Profit & Loss (Income Statement) by Period
 * GET - Revenue minus expenses grouped by month for a date range
 *
 * Query params:
 *   from  - start date (YYYY-MM-DD), defaults to start of current fiscal year
 *   to    - end date   (YYYY-MM-DD), defaults to today
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { roundCurrency } from '@/lib/financial';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

/** Build a YYYY-MM key from a Date */
function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Friendly month label */
function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
  ];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

/** Generate all month keys between two dates (inclusive) */
function generateMonthKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

interface MonthBucket {
  revenue: number;
  expenses: number;
  netIncome: number;
  revenueByAccount: Record<string, { code: string; name: string; amount: number }>;
  expensesByAccount: Record<string, { code: string; name: string; amount: number }>;
}

// ---------------------------------------------------------------------------
// GET /api/admin/accounting/profit-loss
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (request) => {
  try {
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startDate = parseDate(searchParams.get('from'), startOfYear);
    const endDate = parseDate(searchParams.get('to'), now);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // ACCT-F6 FIX: Use raw SQL GROUP BY with DATE_TRUNC for O(accounts×months) instead of O(lines)
    const monthlyData = await prisma.$queryRaw<Array<{
      month: string; code: string; name: string; type: string;
      total_debit: number; total_credit: number;
    }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', e.date), 'YYYY-MM') as month,
             a.code, a.name, a.type::text,
             COALESCE(SUM(l.debit), 0)::float as total_debit,
             COALESCE(SUM(l.credit), 0)::float as total_credit
      FROM "JournalLine" l
      JOIN "ChartOfAccount" a ON l."accountId" = a.id
      JOIN "JournalEntry" e ON l."entryId" = e.id
      WHERE e.status = 'POSTED'
        AND e.date >= ${startDate} AND e.date <= ${endOfDay}
        AND a.type IN ('REVENUE', 'EXPENSE')
      GROUP BY month, a.code, a.name, a.type
      ORDER BY month, a.code
    `;

    const allMonths = generateMonthKeys(startDate, endDate);
    const buckets = new Map<string, MonthBucket>();

    for (const mk of allMonths) {
      buckets.set(mk, {
        revenue: 0, expenses: 0, netIncome: 0,
        revenueByAccount: {}, expensesByAccount: {},
      });
    }

    for (const row of monthlyData) {
      const bucket = buckets.get(row.month);
      if (!bucket) continue;

      if (row.type === 'REVENUE') {
        const amount = row.total_credit - row.total_debit;
        bucket.revenue += amount;
        if (!bucket.revenueByAccount[row.code]) {
          bucket.revenueByAccount[row.code] = { code: row.code, name: row.name, amount: 0 };
        }
        bucket.revenueByAccount[row.code].amount += amount;
      } else {
        const amount = row.total_debit - row.total_credit;
        bucket.expenses += amount;
        if (!bucket.expensesByAccount[row.code]) {
          bucket.expensesByAccount[code] = { code, name, amount: 0 };
        }
        bucket.expensesByAccount[code].amount += amount;
      }
    }

    // ------ Build monthly breakdown ------
    let totalRevenue = 0;
    let totalExpenses = 0;

    const monthly = allMonths.map((mk) => {
      const bucket = buckets.get(mk)!;
      const revenue = roundCurrency(bucket.revenue);
      const expenses = roundCurrency(bucket.expenses);
      const netIncome = roundCurrency(revenue - expenses);

      totalRevenue += revenue;
      totalExpenses += expenses;

      return {
        period: mk,
        label: monthLabel(mk),
        revenue,
        expenses,
        netIncome,
        margin: revenue > 0 ? roundCurrency((netIncome / revenue) * 100) : 0,
        revenueBreakdown: Object.values(bucket.revenueByAccount).map((a) => ({
          ...a,
          amount: roundCurrency(a.amount),
        })),
        expensesBreakdown: Object.values(bucket.expensesByAccount).map((a) => ({
          ...a,
          amount: roundCurrency(a.amount),
        })),
      };
    });

    totalRevenue = roundCurrency(totalRevenue);
    totalExpenses = roundCurrency(totalExpenses);
    const totalNetIncome = roundCurrency(totalRevenue - totalExpenses);

    return NextResponse.json({
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      monthly,
      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome: totalNetIncome,
        margin: totalRevenue > 0 ? roundCurrency((totalNetIncome / totalRevenue) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error('Profit & Loss error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Erreur lors de la generation de l\'etat des resultats' },
      { status: 500 }
    );
  }
});
