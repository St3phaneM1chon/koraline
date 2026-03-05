/**
 * Order Status Transition Validation
 *
 * Centralizes the order state machine for use across all API routes.
 * Previously duplicated in:
 *   - src/app/api/admin/orders/route.ts
 *   - src/app/api/admin/orders/[id]/route.ts
 *
 * Statuses: PENDING, CONFIRMED, PROCESSING, SHIPPED, IN_TRANSIT,
 *           OUT_FOR_DELIVERY, DELIVERED, CANCELLED, FAILED, RETURNED,
 *           REFUNDED, EXCEPTION, PRE_ORDER
 */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'EXCEPTION'
  | 'PRE_ORDER';

/**
 * Valid status transitions map.
 *
 * - PENDING           -> CONFIRMED, CANCELLED, FAILED
 * - CONFIRMED         -> PROCESSING, CANCELLED
 * - PROCESSING        -> SHIPPED, CANCELLED
 * - SHIPPED           -> IN_TRANSIT, DELIVERED, RETURNED
 * - IN_TRANSIT        -> OUT_FOR_DELIVERY, DELIVERED, RETURNED, EXCEPTION
 * - OUT_FOR_DELIVERY  -> DELIVERED, RETURNED, EXCEPTION
 * - DELIVERED         -> RETURNED
 * - CANCELLED         -> (terminal)
 * - FAILED            -> PENDING (can retry)
 * - RETURNED          -> REFUNDED
 * - REFUNDED          -> (terminal)
 * - EXCEPTION         -> IN_TRANSIT, DELIVERED, RETURNED
 * - PRE_ORDER         -> PENDING, CANCELLED
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'FAILED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'DELIVERED', 'RETURNED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'EXCEPTION'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED', 'EXCEPTION'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  FAILED: ['PENDING'],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
  EXCEPTION: ['IN_TRANSIT', 'DELIVERED', 'RETURNED'],
  PRE_ORDER: ['PENDING', 'CANCELLED'],
};

/** All valid order statuses */
export const ALL_ORDER_STATUSES: OrderStatus[] = Object.keys(VALID_TRANSITIONS) as OrderStatus[];

/** Terminal states that cannot transition further */
export const TERMINAL_STATUSES: OrderStatus[] = ALL_ORDER_STATUSES.filter(
  (s) => VALID_TRANSITIONS[s].length === 0
);

/** Statuses from which an order can be cancelled */
export const CANCELLABLE_STATUSES: OrderStatus[] = ALL_ORDER_STATUSES.filter(
  (s) => VALID_TRANSITIONS[s].includes('CANCELLED')
);

/**
 * Check whether a status transition is valid.
 *
 * @param from - Current order status
 * @param to   - Desired new status
 * @returns true if the transition is allowed
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from as OrderStatus];
  if (!allowed) return false;
  return allowed.includes(to as OrderStatus);
}

/**
 * Get the list of statuses an order can transition to from its current status.
 *
 * @param currentStatus - Current order status
 * @returns Array of allowed next statuses (empty for terminal states)
 */
export function getAllowedTransitions(currentStatus: string): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus as OrderStatus] || [];
}

/**
 * Validate a status transition and return an error message if invalid.
 * Returns null if the transition is valid.
 *
 * NOTE: For a structured `{ valid, error }` result, use `validateTransition`
 * from `@/lib/order-status-machine` instead.
 *
 * @param from - Current order status
 * @param to   - Desired new status
 * @returns Error message string, or null if valid
 */
export function validateTransitionMessage(from: string, to: string): string | null {
  if (!ALL_ORDER_STATUSES.includes(from as OrderStatus)) {
    return `Unknown current status: ${from}`;
  }

  if (!ALL_ORDER_STATUSES.includes(to as OrderStatus)) {
    return `Invalid target status: ${to}. Must be one of: ${ALL_ORDER_STATUSES.join(', ')}`;
  }

  if (from === to) {
    return null; // No-op transition is fine
  }

  const allowed = VALID_TRANSITIONS[from as OrderStatus];
  if (allowed.includes(to as OrderStatus)) {
    return null; // Valid transition
  }

  return (
    `Invalid status transition: ${from} -> ${to}. ` +
    `Allowed transitions from ${from}: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`
  );
}

/**
 * @deprecated Use `validateTransitionMessage` instead. This alias is kept for
 * backward compatibility with code that was written before the rename.
 */
export const validateTransition = validateTransitionMessage;

/**
 * Check if an order can be cancelled from its current status.
 *
 * @param currentStatus - Current order status
 * @returns true if cancellation is allowed
 */
export function canCancel(currentStatus: string): boolean {
  return isValidTransition(currentStatus, 'CANCELLED');
}

/**
 * Check if an order is a pre-order based on its status or its items.
 *
 * An order is considered a pre-order if:
 * - Its status is 'PRE_ORDER', OR
 * - Any of its items reference a product with isPreOrder flag set
 *
 * @param order - Order object with optional status and items
 * @returns true if the order is a pre-order
 */
export function isPreOrder(order: {
  status?: string;
  items?: Array<{ product?: { isPreOrder?: boolean } }>;
}): boolean {
  if (order.status === 'PRE_ORDER') return true;
  if (order.items && order.items.length > 0) {
    return order.items.some((item) => item.product?.isPreOrder === true);
  }
  return false;
}
