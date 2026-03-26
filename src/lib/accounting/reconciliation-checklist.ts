/**
 * Accounting: Reconciliation Checklist (Feature 11)
 * Compares BankTransaction records with JournalLine entries
 * to identify unreconciled items and provide a reconciliation summary.
 */
import { prisma } from '@/lib/db';

export interface ReconciliationItem {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: string;
  status: string;
  matchedEntryId: string | null;
  matchedEntryNumber: string | null;
}

export interface ReconciliationSummary {
  bankAccountId: string;
  totalTransactions: number;
  reconciled: number;
  pending: number;
  disputed: number;
  reconciledAmount: number;
  pendingAmount: number;
  items: ReconciliationItem[];
}

/**
 * Get the reconciliation checklist for a bank account.
 * Lists all BankTransactions with their reconciliation status
 * and matched JournalEntry info.
 *
 * @param bankAccountId - The bank account to reconcile
 * @param startDate - Start of the reconciliation period
 * @param endDate - End of the reconciliation period
 */
export async function getReconciliationChecklist(
  bankAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<ReconciliationSummary> {
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      bankAccountId,
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
    include: {
      matchedEntry: {
        select: { entryNumber: true },
      },
    },
    orderBy: { date: 'desc' },
    take: 500,
  });

  let reconciledAmount = 0;
  let pendingAmount = 0;
  let reconciled = 0;
  let pending = 0;
  let disputed = 0;

  const items: ReconciliationItem[] = transactions.map((txn) => {
    const amount = Number(txn.amount);
    const status = txn.reconciliationStatus;

    if (status as string === 'RECONCILED') {
      reconciled++;
      reconciledAmount += Math.abs(amount);
    } else if (status as string === 'DISPUTED') {
      disputed++;
      pendingAmount += Math.abs(amount);
    } else {
      pending++;
      pendingAmount += Math.abs(amount);
    }

    return {
      id: txn.id,
      date: txn.date,
      description: txn.description,
      amount,
      type: txn.type,
      status,
      matchedEntryId: txn.matchedEntryId,
      matchedEntryNumber: txn.matchedEntry?.entryNumber || null,
    };
  });

  return {
    bankAccountId,
    totalTransactions: transactions.length,
    reconciled,
    pending,
    disputed,
    reconciledAmount: Number(reconciledAmount.toFixed(2)),
    pendingAmount: Number(pendingAmount.toFixed(2)),
    items,
  };
}
