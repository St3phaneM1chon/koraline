/**
 * Accounting: Budget Variance Analysis
 * Compares budgeted amounts with actual JournalLine sums
 * for a given year and date range.
 */
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

interface BudgetVarianceItem {
  accountCode: string;
  accountName: string;
  type: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'UNDER' | 'OVER' | 'ON_TARGET';
}

interface BudgetVarianceResult {
  year: number;
  startDate: Date;
  endDate: Date;
  items: BudgetVarianceItem[];
  summary: {
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
    overBudgetCount: number;
    underBudgetCount: number;
    onTargetCount: number;
  };
}

/** Months of the year mapped to BudgetLine field names */
const MONTH_FIELDS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

/**
 * Sums up the budget amounts for the given months from a BudgetLine.
 */
function sumBudgetMonths(
  line: Record<string, unknown>,
  startMonth: number,
  endMonth: number
): number {
  let total = 0;
  for (let m = startMonth; m <= endMonth; m++) {
    const field = MONTH_FIELDS[m - 1];
    const val = line[field];
    total += val instanceof Decimal ? val.toNumber() : Number(val || 0);
  }
  return total;
}

/**
 * Compute budget variance for a given year.
 * @param year - The fiscal year to analyze
 * @param startDate - Start of the period (within the year)
 * @param endDate - End of the period (within the year)
 */
export async function computeBudgetVariance(
  year: number,
  startDate: Date,
  endDate: Date
): Promise<BudgetVarianceResult> {
  // Load active budget lines for the year
  const budgetLines = await prisma.budgetLine.findMany({
    where: { budget: { year, isActive: true } },
    take: 500,
  });

  // Load actual JournalLine sums grouped by accountId
  const actuals = await prisma.journalLine.groupBy({
    by: ['accountId'],
    _sum: { debit: true, credit: true },
    where: {
      entry: {
        date: { gte: startDate, lte: endDate },
        status: 'POSTED',
      },
    },
  });

  // Build map of accountId -> actual net amount
  // For EXPENSE accounts, net = debits - credits
  // For REVENUE accounts, net = credits - debits
  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, type: true },
    take: 500,
  });
  const accountMap = new Map(accounts.map((a) => [a.code, a]));
  const accountIdMap = new Map(accounts.map((a) => [a.id, a]));

  const actualMap = new Map<string, number>();
  for (const row of actuals) {
    const account = accountIdMap.get(row.accountId);
    if (!account) continue;
    const debits = row._sum.debit ? new Decimal(row._sum.debit.toString()).toNumber() : 0;
    const credits = row._sum.credit ? new Decimal(row._sum.credit.toString()).toNumber() : 0;
    // EXPENSE/ASSET: normal balance = debit
    // REVENUE/LIABILITY/EQUITY: normal balance = credit
    const net =
      account.type === 'REVENUE' || account.type === 'LIABILITY' || account.type === 'EQUITY'
        ? credits - debits
        : debits - credits;
    actualMap.set(account.code, net);
  }

  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;

  // Compute variance for each budget line
  const items: BudgetVarianceItem[] = budgetLines.map((line) => {
    const budgeted = sumBudgetMonths(
      line as unknown as Record<string, unknown>,
      startMonth,
      endMonth
    );
    const actual = actualMap.get(line.accountCode) || 0;
    const variance = budgeted - actual;
    const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;

    // 5% threshold for "on target"
    let status: 'UNDER' | 'OVER' | 'ON_TARGET';
    if (Math.abs(variancePercent) <= 5) {
      status = 'ON_TARGET';
    } else if (variance > 0) {
      status = 'UNDER';
    } else {
      status = 'OVER';
    }

    const account = accountMap.get(line.accountCode);

    return {
      accountCode: line.accountCode,
      accountName: account?.name || line.accountName,
      type: line.type,
      budgeted: Number(budgeted.toFixed(2)),
      actual: Number(actual.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      variancePercent: Number(variancePercent.toFixed(2)),
      status,
    };
  });

  const summary = {
    totalBudgeted: items.reduce((s, i) => s + i.budgeted, 0),
    totalActual: items.reduce((s, i) => s + i.actual, 0),
    totalVariance: items.reduce((s, i) => s + i.variance, 0),
    overBudgetCount: items.filter((i) => i.status === 'OVER').length,
    underBudgetCount: items.filter((i) => i.status === 'UNDER').length,
    onTargetCount: items.filter((i) => i.status === 'ON_TARGET').length,
  };

  return { year, startDate, endDate, items, summary };
}
