/**
 * #45 Expense Policy Alerts
 * Flag expenses >$500 without approval and other policy violations.
 */

import { logger } from '@/lib/logger';

export interface PolicyViolation {
  id: string;
  type: 'amount_threshold' | 'missing_receipt' | 'duplicate' | 'category_mismatch' | 'weekend_expense';
  severity: 'high' | 'medium' | 'low';
  message: string;
  amount: number;
  expenseDescription: string;
  suggestedAction: string;
}

export interface PolicyConfig {
  amountThreshold: number;       // Default: 500
  requireReceiptAbove: number;   // Default: 25
  maxMealAmount: number;         // Default: 100
  maxTravelDailyRate: number;    // Default: 300
  flagWeekendExpenses: boolean;  // Default: true
}

const DEFAULT_POLICY: PolicyConfig = {
  amountThreshold: 500,
  requireReceiptAbove: 25,
  maxMealAmount: 100,
  maxTravelDailyRate: 300,
  flagWeekendExpenses: true,
};

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  hasReceipt: boolean;
  approvedBy: string | null;
  vendor?: string;
}

/**
 * Check a single expense against policy rules.
 */
export function checkExpensePolicy(
  expense: Expense,
  policy: PolicyConfig = DEFAULT_POLICY
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  // Rule 1: Amount exceeds threshold without approval
  if (expense.amount > policy.amountThreshold && !expense.approvedBy) {
    violations.push({
      id: `${expense.id}-threshold`,
      type: 'amount_threshold',
      severity: 'high',
      message: `Expense of $${expense.amount.toFixed(2)} exceeds $${policy.amountThreshold} threshold without approval`,
      amount: expense.amount,
      expenseDescription: expense.description,
      suggestedAction: 'Requires manager approval before processing',
    });
  }

  // Rule 2: Missing receipt for expenses above minimum
  if (expense.amount > policy.requireReceiptAbove && !expense.hasReceipt) {
    violations.push({
      id: `${expense.id}-receipt`,
      type: 'missing_receipt',
      severity: 'medium',
      message: `Missing receipt for $${expense.amount.toFixed(2)} expense`,
      amount: expense.amount,
      expenseDescription: expense.description,
      suggestedAction: 'Upload receipt or provide written justification',
    });
  }

  // Rule 3: Meal expenses over limit
  if (
    ['TRAVEL', 'MEALS', 'RESTAURANT'].some(c =>
      expense.category?.toUpperCase().includes(c) ||
      expense.description?.toLowerCase().includes('meal') ||
      expense.description?.toLowerCase().includes('restaurant')
    ) &&
    expense.amount > policy.maxMealAmount
  ) {
    violations.push({
      id: `${expense.id}-meal`,
      type: 'category_mismatch',
      severity: 'medium',
      message: `Meal/dining expense of $${expense.amount.toFixed(2)} exceeds $${policy.maxMealAmount} daily limit`,
      amount: expense.amount,
      expenseDescription: expense.description,
      suggestedAction: 'Verify if expense includes multiple people or provide justification',
    });
  }

  // Rule 4: Weekend expenses
  if (policy.flagWeekendExpenses) {
    const day = expense.date.getDay();
    if ((day === 0 || day === 6) && expense.amount > 50) {
      violations.push({
        id: `${expense.id}-weekend`,
        type: 'weekend_expense',
        severity: 'low',
        message: `Weekend expense of $${expense.amount.toFixed(2)} on ${day === 0 ? 'Sunday' : 'Saturday'}`,
        amount: expense.amount,
        expenseDescription: expense.description,
        suggestedAction: 'Verify business purpose for weekend expense',
      });
    }
  }

  return violations;
}

/**
 * Batch check multiple expenses against policy.
 */
export function batchCheckExpenses(
  expenses: Expense[],
  policy: PolicyConfig = DEFAULT_POLICY
): {
  violations: PolicyViolation[];
  summary: { high: number; medium: number; low: number; total: number };
} {
  const allViolations: PolicyViolation[] = [];

  for (const expense of expenses) {
    allViolations.push(...checkExpensePolicy(expense, policy));
  }

  // Check for duplicates
  const seen = new Map<string, Expense>();
  for (const expense of expenses) {
    const key = `${expense.amount}-${expense.date.toISOString().slice(0, 10)}-${expense.vendor || expense.description}`;
    if (seen.has(key)) {
      const original = seen.get(key)!;
      allViolations.push({
        id: `${expense.id}-duplicate`,
        type: 'duplicate',
        severity: 'high',
        message: `Potential duplicate: $${expense.amount.toFixed(2)} matches expense ${original.id} on same date`,
        amount: expense.amount,
        expenseDescription: expense.description,
        suggestedAction: 'Verify this is not a duplicate submission',
      });
    } else {
      seen.set(key, expense);
    }
  }

  logger.info(`[expense-policy] Checked ${expenses.length} expenses, found ${allViolations.length} violations`);

  return {
    violations: allViolations.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    }),
    summary: {
      high: allViolations.filter(v => v.severity === 'high').length,
      medium: allViolations.filter(v => v.severity === 'medium').length,
      low: allViolations.filter(v => v.severity === 'low').length,
      total: allViolations.length,
    },
  };
}
