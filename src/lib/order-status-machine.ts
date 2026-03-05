/**
 * Order status transition validation
 * Enforces valid state transitions for order lifecycle
 *
 * This module augments `order-status.ts` with additional helpers and the
 * `validateTransitionResult` function that returns a structured result object.
 * The canonical transition map is defined in `order-status.ts`.
 *
 * All API routes should import from `@/lib/order-status-machine` for the
 * structured validation, or from `@/lib/order-status` for the simpler helpers.
 */

export {
  ALL_ORDER_STATUSES,
  type OrderStatus,
  VALID_TRANSITIONS,
  TERMINAL_STATUSES,
  CANCELLABLE_STATUSES,
  isValidTransition,
  getAllowedTransitions,
  canCancel,
  isPreOrder,
} from './order-status';

import { VALID_TRANSITIONS, ALL_ORDER_STATUSES, type OrderStatus } from './order-status';

// ---------------------------------------------------------------------------
// Structured validation (returns { valid, error? } instead of string | null)
// ---------------------------------------------------------------------------

/**
 * Check whether a transition from `from` to `to` is allowed.
 */
export function canTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from as OrderStatus];
  if (!allowed) return false;
  return allowed.includes(to as OrderStatus);
}

/**
 * Return the list of statuses reachable from the given status.
 */
export function getValidNextStatuses(current: string): string[] {
  return VALID_TRANSITIONS[current as OrderStatus] || [];
}

/**
 * Full validation with a structured result object.
 *
 * Unlike `validateTransition` in order-status.ts (which returns string | null),
 * this returns `{ valid: boolean; error?: string }` for easier consumption in
 * API route handlers.
 */
export function validateTransition(
  from: string,
  to: string,
): { valid: boolean; error?: string } {
  if (from === to) {
    return { valid: false, error: `Order is already ${from}` };
  }

  if (!ALL_ORDER_STATUSES.includes(from as OrderStatus)) {
    return { valid: false, error: `Unknown current status: ${from}` };
  }

  if (!ALL_ORDER_STATUSES.includes(to as OrderStatus)) {
    return {
      valid: false,
      error: `Invalid target status: ${to}. Must be one of: ${ALL_ORDER_STATUSES.join(', ')}`,
    };
  }

  if (!canTransition(from, to)) {
    const allowed = getValidNextStatuses(from);
    return {
      valid: false,
      error: `Cannot transition from ${from} to ${to}. Valid: ${allowed.join(', ') || 'none (terminal state)'}`,
    };
  }
  return { valid: true };
}
