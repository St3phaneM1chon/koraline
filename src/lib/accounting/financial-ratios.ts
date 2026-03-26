/**
 * Accounting: Financial Ratios
 * Computes key financial ratios from ChartOfAccount types
 * and JournalLine balances: liquidity, profitability, leverage.
 */
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

interface FinancialRatios {
  currentRatio: number | null;
  debtToEquity: number | null;
  grossProfitMargin: number | null;
  netProfitMargin: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  workingCapital: number;
  rawTotals: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
  };
  computedAt: string;
}

/**
 * Compute financial ratios from the general ledger.
 * Uses ChartOfAccount.type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
 * to classify balances.
 *
 * @param asOfDate - Optional cutoff date for journal entries (defaults to now)
 */
export async function computeFinancialRatios(
  asOfDate?: Date
): Promise<FinancialRatios> {
  const dateFilter = asOfDate || new Date();

  // Get all account types
  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, type: true },
    take: 1000,
  });

  const accountTypeMap = new Map(accounts.map((a) => [a.id, a.type]));

  // Sum debits and credits per account
  const totals = await prisma.journalLine.groupBy({
    by: ['accountId'],
    _sum: { debit: true, credit: true },
    where: {
      entry: {
        date: { lte: dateFilter },
        status: 'POSTED',
      },
    },
  });

  // Aggregate by account type
  const typeTotals: Record<string, number> = {
    ASSET: 0,
    LIABILITY: 0,
    EQUITY: 0,
    REVENUE: 0,
    EXPENSE: 0,
  };

  for (const row of totals) {
    const type = accountTypeMap.get(row.accountId);
    if (!type || !typeTotals.hasOwnProperty(type)) continue;

    const debits = row._sum.debit
      ? new Decimal(row._sum.debit.toString()).toNumber()
      : 0;
    const credits = row._sum.credit
      ? new Decimal(row._sum.credit.toString()).toNumber()
      : 0;

    // Normal balance direction
    switch (type) {
      case 'ASSET':
      case 'EXPENSE':
        typeTotals[type] += debits - credits;
        break;
      case 'LIABILITY':
      case 'EQUITY':
      case 'REVENUE':
        typeTotals[type] += credits - debits;
        break;
    }
  }

  const totalAssets = typeTotals.ASSET;
  const totalLiabilities = typeTotals.LIABILITY;
  const totalEquity = typeTotals.EQUITY;
  const totalRevenue = typeTotals.REVENUE;
  const totalExpenses = typeTotals.EXPENSE;
  const netIncome = totalRevenue - totalExpenses;

  const safeDiv = (numerator: number, denominator: number): number | null =>
    denominator !== 0 ? Number((numerator / denominator).toFixed(4)) : null;

  return {
    // Liquidity
    currentRatio: safeDiv(totalAssets, totalLiabilities),
    workingCapital: Number((totalAssets - totalLiabilities).toFixed(2)),

    // Leverage
    debtToEquity: safeDiv(totalLiabilities, totalEquity),

    // Profitability
    grossProfitMargin: safeDiv(totalRevenue - totalExpenses, totalRevenue),
    netProfitMargin: safeDiv(netIncome, totalRevenue),
    returnOnAssets: safeDiv(netIncome, totalAssets),
    returnOnEquity: safeDiv(netIncome, totalEquity),

    rawTotals: {
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilities: Number(totalLiabilities.toFixed(2)),
      totalEquity: Number(totalEquity.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
    },

    computedAt: new Date().toISOString(),
  };
}
