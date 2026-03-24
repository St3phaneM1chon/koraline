# AUDIT ANGLE 8: Business Logic Correctness
**Date**: 2026-03-10
**Project**: BioCycle Peptides (peptide-plus)
**Scope**: Tax engine, order state machine, pricing, accounting, inventory, loyalty

---

## 1. TAX CALCULATION VERIFICATION

### 1.1 Canadian Provincial Tax Rates

| Province | Expected GST | Actual GST | Expected PST/QST | Actual PST/QST | Expected HST | Actual HST | Status |
|----------|-------------|------------|-------------------|-----------------|-------------|------------|--------|
| AB       | 5%          | 5%         | 0%                | 0%              | 0%          | 0%         | PASS   |
| BC       | 5%          | 5%         | PST 7%            | PST 7%          | 0%          | 0%         | PASS   |
| MB       | 5%          | 5%         | PST 7%            | PST 7%          | 0%          | 0%         | PASS   |
| NB       | 0%          | 0%         | 0%                | 0%              | 15%         | 15%        | PASS   |
| NL       | 0%          | 0%         | 0%                | 0%              | 15%         | 15%        | PASS   |
| NS       | 0%          | 0%         | 0%                | 0%              | 14% (2025+) | 14%        | PASS   |
| NT       | 5%          | 5%         | 0%                | 0%              | 0%          | 0%         | PASS   |
| NU       | 5%          | 5%         | 0%                | 0%              | 0%          | 0%         | PASS   |
| ON       | 0%          | 0%         | 0%                | 0%              | 13%         | 13%        | PASS   |
| PE       | 0%          | 0%         | 0%                | 0%              | 15%         | 15%        | PASS   |
| QC       | 5%          | 5%         | QST 9.975%        | QST 9.975%      | 0%          | 0%         | PASS   |
| SK       | 5%          | 5%         | PST 6%            | PST 6%          | 0%          | 0%         | PASS   |
| YT       | 5%          | 5%         | 0%                | 0%              | 0%          | 0%         | PASS   |

**All 13 provinces/territories: CORRECT**

### 1.2 Calculation Logic Verification

- **GST-only provinces** (AB, NT, NU, YT): Only GST 5% applied. CORRECT.
- **HST provinces** (ON, NB, NL, NS, PE): Only HST applied (no separate GST/PST). CORRECT.
- **GST+QST** (QC): Both GST 5% and QST 9.975% applied separately. CORRECT.
- **GST+PST** (BC, SK, MB): Both GST and PST applied separately. CORRECT.

### 1.3 NS HST Rate Change (15% -> 14% on 2025-04-01)

- `canadian-tax-engine.ts` uses **14%** (current rate). CORRECT for 2026.
- `canadian-tax-config.ts` supports date-based lookup with `getTaxRateForProvince(code, asOfDate)` for historical transactions. CORRECT.
- **Consistency note**: The two files are slightly different: `canadian-tax-engine.ts` is the customer-facing tax calculator (always uses current rates), while `canadian-tax-config.ts` is the accounting/compliance engine (supports historical rates). This is acceptable architecture.

### 1.4 Rounding

- `canadian-tax-engine.ts` uses `Math.round(n * 100) / 100` -- standard rounding to 2 decimal places. CORRECT.
- `financial.ts` uses banker's rounding (round half to even) via `roundCurrency()`. Used by accounting module.
- **Minor inconsistency**: The customer-facing tax engine uses standard rounding while the accounting module uses banker's rounding. In practice, this rarely causes a 1-cent difference, but it could occur on exact half-cent amounts.

### 1.5 International VAT Rates

| Country | Expected VAT | Actual VAT | Status |
|---------|-------------|------------|--------|
| GB      | 20%         | 20%        | PASS   |
| DE      | 19%         | 19%        | PASS   |
| FR      | 20%         | 20%        | PASS   |
| IT      | 22%         | 22%        | PASS   |
| AU      | 10%         | 10%        | PASS   |
| JP      | 10%         | 10%        | PASS   |
| CH      | 8.1%        | 8.1%       | PASS   |
| FI      | 25.5%       | 25.5%      | PASS   |
| HU      | 27%         | 27%        | PASS   |
| AE      | 5%          | 5%         | PASS   |

All 30 international VAT rates verified as reasonable and current.

### 1.6 Tax Issues Found

| ID | Severity | Issue |
|----|----------|-------|
| T-1 | P2 | `calculateTax()` defaults unknown provinces to QC rates (line 49: `PROVINCE_TAX[prov] \|\| PROVINCE_TAX.QC`). This silently applies Quebec tax to invalid province codes instead of returning an error or zero tax. Could overcharge customers with typos in province. |
| T-2 | P3 | `otherTax` field exists in `OrderData` interface but is never used in journal entry generation. If non-zero, it would cause an unbalanced entry (debit total includes it but no credit line is generated). |
| T-3 | P3 | `calculateInternationalTax()` is a stub that returns zero for all non-CA countries. The separate `calculateVAT()` function exists but is not called from `calculateInternationalTax()`. Two separate international tax paths could confuse callers. |
| T-4 | P3 | Rounding inconsistency between `canadian-tax-engine.ts` (standard `Math.round`) and `financial.ts` (banker's rounding). Could cause 1-cent discrepancies between customer receipt and accounting. |

---

## 2. ORDER STATE MACHINE VERIFICATION

### 2.1 Transition Map

```
PRE_ORDER ----> PENDING ----> CONFIRMED ----> PROCESSING ----> SHIPPED
     |             |              |               |               |
     v             v              v               v               v
  CANCELLED     FAILED       CANCELLED       CANCELLED      IN_TRANSIT
                  |                                             |
                  v                                             v
               PENDING (retry)                       OUT_FOR_DELIVERY
                                                        |         |
                                                        v         v
                                                    DELIVERED   RETURNED
                                                        |         |
                                                        v         v
                                                    RETURNED   REFUNDED (terminal)
                                                        |
                                                        v
                                                    REFUNDED (terminal)
```

### 2.2 Terminal States

| State | Outgoing Transitions | Terminal? | Expected | Status |
|-------|---------------------|-----------|----------|--------|
| CANCELLED | [] | Yes | Yes | PASS |
| REFUNDED  | [] | Yes | Yes | PASS |

### 2.3 Key Transition Verification

| Transition | Allowed? | Business Sense | Status |
|------------|----------|----------------|--------|
| PRE_ORDER -> PENDING | Yes | Pre-order becomes active | PASS |
| PRE_ORDER -> CANCELLED | Yes | Customer cancels pre-order | PASS |
| PENDING -> CONFIRMED | Yes | Payment confirmed | PASS |
| PENDING -> CANCELLED | Yes | Customer cancels | PASS |
| PENDING -> FAILED | Yes | Payment fails | PASS |
| FAILED -> PENDING | Yes | Retry payment | PASS |
| CONFIRMED -> PROCESSING | Yes | Start fulfillment | PASS |
| CONFIRMED -> CANCELLED | Yes | Cancel before shipping | PASS |
| PROCESSING -> SHIPPED | Yes | Package shipped | PASS |
| PROCESSING -> CANCELLED | Yes | Cancel during processing | PASS |
| SHIPPED -> IN_TRANSIT | Yes | Carrier scan | PASS |
| SHIPPED -> DELIVERED | Yes | Direct delivery | PASS |
| SHIPPED -> RETURNED | Yes | RTS/refused | PASS |
| IN_TRANSIT -> OUT_FOR_DELIVERY | Yes | Last mile | PASS |
| IN_TRANSIT -> DELIVERED | Yes | Delivered | PASS |
| IN_TRANSIT -> RETURNED | Yes | Return to sender | PASS |
| IN_TRANSIT -> EXCEPTION | Yes | Delivery issue | PASS |
| OUT_FOR_DELIVERY -> DELIVERED | Yes | Successfully delivered | PASS |
| OUT_FOR_DELIVERY -> RETURNED | Yes | Failed delivery | PASS |
| OUT_FOR_DELIVERY -> EXCEPTION | Yes | Delivery problem | PASS |
| DELIVERED -> RETURNED | Yes | Customer return | PASS |
| RETURNED -> REFUNDED | Yes | Refund processed | PASS |
| EXCEPTION -> IN_TRANSIT | Yes | Issue resolved, back in transit | PASS |
| EXCEPTION -> DELIVERED | Yes | Exception resolved, delivered | PASS |
| EXCEPTION -> RETURNED | Yes | Exception results in return | PASS |

### 2.4 Illegal Transition Tests

| Illegal Transition | Blocked? | Status |
|-------------------|----------|--------|
| DELIVERED -> PROCESSING | Yes | PASS |
| DELIVERED -> PENDING | Yes | PASS |
| CANCELLED -> PENDING | Yes | PASS |
| REFUNDED -> any | Yes | PASS |
| SHIPPED -> PENDING | Yes | PASS |
| CONFIRMED -> DELIVERED | Yes (must go through PROCESSING/SHIPPED) | PASS |

### 2.5 State Machine Issues

| ID | Severity | Issue |
|----|----------|-------|
| SM-1 | P3 | Same-state transition (`from === to`) returns `null` (valid) in `validateTransitionMessage` but `{ valid: false }` in `validateTransition` from `order-status-machine.ts`. Inconsistent behavior between the two APIs. |
| SM-2 | P3 | `EXCEPTION` state has no transition back to `CANCELLED`. If an exception occurs during shipping and the order needs cancellation, there is no direct path. Would need manual DB intervention. |

---

## 3. PRICING SERVICE VERIFICATION

### 3.1 Resolution Order

The documented priority is:
1. **ProductTierPrice** (product-specific override per tier) -- line 87-101
2. **LoyaltyTierConfig.discountPercent** (general tier-wide discount) -- line 104-118
3. **Base product price** (no discount) -- line 121-128

**Verification**: CORRECT. The code fetches all three in parallel via `Promise.all` and evaluates in the documented priority order.

### 3.2 Decimal Precision

- Uses Prisma `Decimal` type throughout.
- `decimalRound2()` uses `Decimal.ROUND_HALF_UP` to 2 decimal places. CORRECT.
- All intermediate calculations use `Decimal` arithmetic, not floating-point. CORRECT.

### 3.3 Batch Function (N+1 Prevention)

- `getEffectivePrices()` uses exactly 3 queries regardless of product count:
  1. `product.findMany` (all products)
  2. `productTierPrice.findMany` (all tier prices)
  3. `loyaltyTierConfig.findUnique` (tier config)
- Results indexed with `Map` for O(1) lookup. CORRECT.

### 3.4 Edge Cases

| Edge Case | Handling | Status |
|-----------|----------|--------|
| Zero base price | `basePrice.gt(ZERO)` check prevents divide-by-zero in discount% calculation | PASS |
| Negative savings (tier price > base) | `savings.lt(ZERO) ? ZERO : savings` clamps to zero | PASS |
| Missing tier config | Falls through to base price (no discount) | PASS |
| Product not found | Throws `Error('Product not found: ${productId}')` | PASS |
| Empty productIds array | Returns empty Map immediately | PASS |
| Effective price goes negative | `effective.lt(ZERO) ? ZERO : effective` clamps to zero | PASS |

### 3.5 Pricing Issues

| ID | Severity | Issue |
|----|----------|-------|
| PR-1 | P2 | When `tierPrice` (product-specific) is higher than `basePrice` (e.g., premium upcharge), `savings` is clamped to ZERO but `effectivePrice` is set to the (higher) `specific` price. The `discountPercent` could be negative before clamping, which is misleading but not incorrect. No actual financial issue. |
| PR-2 | P3 | `getEffectivePrices` does not return results for product IDs that don't exist in the database. Callers should handle missing entries, but no error is thrown. Could silently omit products. |

---

## 4. ACCOUNTING DOUBLE-ENTRY VERIFICATION

### 4.1 Sale Entry (`generateSaleEntry`)

**Debit side:**
- Bank account (DEBIT): `order.total` (line 182)
- Discounts/Returns (DEBIT): `order.discount` (line 262, only if > 0)

**Credit side:**
- Sales revenue (CREDIT): `order.subtotal - order.discount` (line 192)
- Shipping charged (CREDIT): `order.shipping` (line 203, only if > 0)
- TPS payable (CREDIT): `order.tps` (line 214, only if > 0)
- TVQ payable (CREDIT): `order.tvq` (line 224, only if > 0)
- TVH payable (CREDIT): `order.tvh` (line 238, only if > 0)
- PST payable (CREDIT): `order.pst` (line 248, only if > 0)

**Balance verification:**
```
Debits  = total + discount
Credits = (subtotal - discount) + shipping + tps + tvq + tvh + pst + discount
        = subtotal + shipping + tps + tvq + tvh + pst
```

If `total = subtotal + shipping + tps + tvq + tvh + pst - discount + otherTax`:
- When `otherTax = 0` and `discount = 0`: Debits = total = subtotal + shipping + tps + tvq + tvh + pst = Credits. BALANCED.
- When `discount > 0` and `otherTax = 0`: Debits = (subtotal + shipping + taxes) + discount. Credits = (subtotal - discount) + shipping + taxes + discount = subtotal + shipping + taxes. Wait -- let me recalculate:

Actually:
```
Debits  = order.total + order.discount
        = (subtotal - discount + shipping + taxes) + discount
        = subtotal + shipping + taxes

Credits = (subtotal - discount) + shipping + taxes + discount(contra-revenue debit... no, discount is a DEBIT line)
```

Wait. Let me re-read. The discount line (line 256-265) is a DEBIT:
```
Debits  = order.total (bank) + order.discount (contra-revenue)
Credits = (order.subtotal - order.discount) (sales) + order.shipping + order.tps + order.tvq + order.tvh + order.pst
```

Assuming `order.total = (order.subtotal - order.discount) + order.shipping + order.tps + order.tvq + order.tvh + order.pst`:

```
Debits  = [(subtotal - discount) + shipping + taxes] + discount
        = subtotal + shipping + taxes

Credits = (subtotal - discount) + shipping + taxes
        = subtotal - discount + shipping + taxes
```

**This is UNBALANCED when discount > 0!**

Wait, no. Let me re-read the credit lines more carefully:
- Sales credit = `order.subtotal - order.discount` (line 192)
- Plus discount debit = `order.discount` (line 262)

So:
```
Total Debits  = order.total + order.discount
Total Credits = (order.subtotal - order.discount) + order.shipping + taxes

If order.total = order.subtotal + order.shipping + taxes - order.discount:
Total Debits  = (subtotal + shipping + taxes - discount) + discount = subtotal + shipping + taxes
Total Credits = (subtotal - discount) + shipping + taxes = subtotal - discount + shipping + taxes
```

**UNBALANCED by `order.discount`!**

Actually wait -- the discount debit is NOT a credit, it's a debit on the contra-revenue account. Let me recalculate total debits and total credits properly:

**Debit lines:**
1. Bank: `order.total`
2. Discounts/Returns: `order.discount` (if > 0)

**Credit lines:**
1. Sales: `order.subtotal - order.discount`
2. Shipping: `order.shipping`
3. TPS: `order.tps`
4. TVQ: `order.tvq`
5. TVH: `order.tvh`
6. PST: `order.pst`

```
Sum Debits  = order.total + order.discount
Sum Credits = (order.subtotal - order.discount) + order.shipping + order.tps + order.tvq + order.tvh + order.pst

If order.total = subtotal - discount + shipping + tps + tvq + tvh + pst:
Sum Debits  = (subtotal - discount + shipping + taxes) + discount = subtotal + shipping + taxes
Sum Credits = (subtotal - discount) + shipping + taxes = subtotal + shipping + taxes - discount
```

**THERE IS AN IMBALANCE OF `order.discount`!**

But wait -- the code calls `assertJournalBalance(lines)` at line 268, which would throw if unbalanced. So either:
1. The formula for `order.total` already includes the discount differently, or
2. This is a bug that would throw at runtime for any order with a discount.

Let me think again. The standard accounting treatment of a sale with discount:
- Debit Cash (what customer pays = total after discount)
- Debit Discount (contra-revenue = discount amount)
- Credit Revenue (full subtotal before discount)
- Credit Tax liabilities

So: `Debits = total_paid + discount = (subtotal - discount + shipping + taxes) + discount = subtotal + shipping + taxes`
And: `Credits = subtotal + shipping + taxes`

But the code credits `order.subtotal - order.discount` for sales, not `order.subtotal`. This means:
```
Credits = (subtotal - discount) + shipping + taxes
```

Which gives `Credits = subtotal - discount + shipping + taxes`, but Debits = `subtotal + shipping + taxes`.

**The issue is that the sales credit should be `order.subtotal` (gross), not `order.subtotal - order.discount`.** The discount is already captured as a separate debit line on the contra-revenue account (Discounts/Returns 4900).

**However**, there is an alternative interpretation: If the code treats sales credit as the net sale (after discount), then there should be no separate discount debit line. The current code does BOTH: credits net sale AND debits the discount, which double-counts the discount.

Let me verify by checking `assertJournalBalance`. It checks `sum(debit) === sum(credit)`. If this code runs in production with discounts and doesn't crash, then perhaps `order.total` is defined differently than I assumed. Perhaps `order.total = order.subtotal + order.shipping + taxes` (without subtracting discount), meaning the customer pays the full amount and the discount is conceptual.

Actually, in practice this code HAS `assertJournalBalance` validation, so either:
- No orders with discounts have been processed yet, OR
- The `order.total` value passed to this function equals `subtotal + shipping + taxes` (full price, not discounted), which would mean the discount line is the correction.

If `order.total = subtotal + shipping + taxes` (NOT subtotal - discount):
```
Debits  = (subtotal + shipping + taxes) + discount = subtotal + shipping + taxes + discount
Credits = (subtotal - discount) + shipping + taxes = subtotal + shipping + taxes - discount
```
Still unbalanced by `2 * discount`.

The only way this balances is if the discount debit and the sales credit adjustment cancel out, which requires:
`order.total = (subtotal - discount) + shipping + taxes`

Then:
```
Debits  = (subtotal - discount + shipping + taxes) + discount = subtotal + shipping + taxes
Credits = (subtotal - discount) + shipping + taxes = subtotal - discount + shipping + taxes
```
Unbalanced by `discount`.

**CONCLUSION**: The `generateSaleEntry` function has a double-entry imbalance when `order.discount > 0`. The sales revenue is credited at `subtotal - discount` (net), but the discount is also separately debited to Discounts/Returns. This creates a debit-side excess equal to `order.discount`. The `assertJournalBalance` call at line 268 would catch this at runtime, causing a throw. This is either a latent bug (no orders with discounts yet) or the `order.total` input compensates in some unexpected way.

### 4.2 Fee Entry (`generateFeeEntry`)

```
Debit:  Fee expense (Stripe/PayPal fees)    = fee
Credit: Bank/Clearing account               = fee
```
**BALANCED. CORRECT.**

### 4.3 Refund Entry (`generateRefundEntry`)

```
Debit:  Discounts/Returns (contra-revenue)  = refund.amount - tps - tvq - tvh
Debit:  TPS payable                          = refund.tps
Debit:  TVQ payable                          = refund.tvq
Debit:  TVH payable                          = refund.tvh
Credit: Bank account                         = refund.amount

Sum Debits  = (amount - tps - tvq - tvh) + tps + tvq + tvh = amount
Sum Credits = amount
```
**BALANCED. CORRECT.**

Note: Refund entry does not reverse PST. If original order had PST (BC/SK/MB), the PST portion of the refund is not separately reversed. This means the net sale amount debit absorbs the PST portion, which is incorrect for tax remittance purposes.

### 4.4 Stripe Payout Entry (`generateStripePayoutEntry`)

```
Debit:  Main bank account    = payout.net
Credit: Stripe account       = payout.net
```
**BALANCED. CORRECT.** Properly uses `ADJUSTMENT` type instead of `AUTO_SALE`.

### 4.5 Accounting Issues

| ID | Severity | Issue |
|----|----------|-------|
| A-1 | **P0** | `generateSaleEntry()` double-counts discounts: sales revenue is credited at `subtotal - discount` (net) AND `discount` is debited to Discounts/Returns. This creates a debit-side excess of `order.discount`. The `assertJournalBalance()` on line 268 would throw at runtime for any order with a non-zero discount. Either the function is broken for discount orders, or no discount orders have been processed yet. **Fix**: Credit sales at `order.subtotal` (gross) instead of `order.subtotal - order.discount`, OR remove the separate discount debit line. |
| A-2 | P1 | `otherTax` field in `OrderData` interface is never processed in `generateSaleEntry()`. If passed as non-zero, the total would include it but no credit line is created, causing an imbalance. The `assertJournalBalance` would catch this, but the error message would be confusing. |
| A-3 | P2 | `generateRefundEntry()` does not handle PST reversal. If the original order included BC/SK/MB PST, the refund entry lumps PST into the net refund amount instead of separately debiting PST_PAYABLE. This means PST liability is not properly reduced in the books. |
| A-4 | P3 | `generateStripePayoutEntry()` uses `ADJUSTMENT` type because `AUTO_PAYOUT` doesn't exist in the `JournalEntryType` enum. The comment notes this should be changed when a dedicated type is added. Low priority but affects reporting filters. |

---

## 5. INVENTORY RESERVATION VERIFICATION

### 5.1 Reservation Flow

| Step | Implementation | Status |
|------|---------------|--------|
| Reserve on checkout | `reserveStock()` creates `InventoryReservation` with TTL (default 30 min) | PASS |
| Check available stock | Subtracts active reservations from total stock before reserving | PASS |
| Consume on payment | `consumeReservation()` marks reservations as CONSUMED, decrements stock | PASS |
| Release on failure | `releaseReservation()` sets status to RELEASED | PASS |
| Expire stale reservations | `releaseExpiredReservations()` cron releases expired reservations | PASS |
| Self-healing | `reserveStock()` auto-releases expired reservations before checking stock (E-19 fix) | PASS |

### 5.2 Race Condition Protection

- Reservation wrapped in `$transaction` (line 47). CORRECT.
- Stock decrement uses atomic conditional SQL: `UPDATE ... WHERE stockQuantity >= requested` (line 171-177). CORRECT. Prevents negative inventory.
- Consumption of all reservations in single transaction (BUG-036 fix). CORRECT.

### 5.3 WAC (Weighted Average Cost)

- WAC recalculated on purchase: `(currentQty * currentWAC + newQty * newCost) / (currentQty + newQty)`. CORRECT.
- WAC rounded to 4 decimal places (`Math.round(newWAC * 10000) / 10000`). CORRECT.
- Zero-division handled: if `newTotalQty = 0`, uses `item.unitCost`. CORRECT.

### 5.4 COGS Entry

- `generateCOGSEntry()` creates balanced journal entry: Debit PURCHASES (5010), Credit INVENTORY (1210). CORRECT.
- Validates period is open before creating entry. CORRECT.
- Uses `assertJournalBalance` before persist. CORRECT.

### 5.5 Inventory Issues

| ID | Severity | Issue |
|----|----------|-------|
| I-1 | P2 | `consumeReservation()` does not release stock back when `rowsAffected === 0` (insufficient stock at consumption time). It logs a warning but the reservation is already marked as CONSUMED. This means the reservation is consumed but stock was not actually decremented. Could lead to phantom stock deductions in COGS. |
| I-2 | P3 | `adjustStock()` for negative adjustments uses conditional SQL `WHERE stockQuantity >= absQuantity` which silently does nothing if stock is insufficient. No error is returned to the caller. The function appears to succeed but stock is unchanged. |
| I-3 | P3 | `logStockChange()` is fire-and-forget (catches errors silently). If audit logging fails, there's no retry or alert. Acceptable for audit trail but could mask audit completeness issues. |

---

## 6. LOYALTY SYSTEM VERIFICATION

### 6.1 Points Earning

| Action | Points | Implementation | Status |
|--------|--------|---------------|--------|
| Purchase | 1 per $1 (floor) | `Math.floor(amount * pointsPerDollar)` | PASS |
| Signup | 500 | One-time, duplicate check in DB | PASS |
| Review | 50 | Duplicate check per product | PASS |
| Referral | 1000 | Admin-only award | PASS |
| Birthday | 200 | Once per calendar year check | PASS |
| Bonus | Up to 10,000 | Admin-only, capped at 10K | PASS |

### 6.2 Points Redemption

| Reward | Points Cost | Value | Status |
|--------|------------|-------|--------|
| DISCOUNT_5 | 500 | $5 | PASS (1 pt = $0.01) |
| DISCOUNT_10 | 900 | $10 | PASS (slight bonus) |
| DISCOUNT_25 | 2,000 | $25 | PASS |
| DISCOUNT_50 | 3,500 | $50 | PASS |
| DISCOUNT_100 | 6,000 | $100 | PASS |
| FREE_SHIPPING | 300 | Free ship | PASS |
| DOUBLE_POINTS | 1,000 | 2x next | PASS |

### 6.3 Tier System

| Tier | Min Points | Multiplier | Status |
|------|-----------|------------|--------|
| BRONZE | 0 | 1.0x | PASS |
| SILVER | 500 | 1.25x | PASS |
| GOLD | 2,000 | 1.5x | PASS |
| PLATINUM | 5,000 | 2.0x | PASS |
| DIAMOND | 10,000 | 3.0x | PASS |

### 6.4 Key Safety Features

| Feature | Status |
|---------|--------|
| Atomic point increment (no TOCTOU race) | PASS - Uses `tx.user.update({ data: { loyaltyPoints: { increment } } })` |
| Row-level locking on redemption | PASS - Uses `SELECT ... FOR UPDATE` |
| Fraud velocity check (3 redemptions/hour) | PASS |
| Rate limiting on earn/redeem endpoints | PASS |
| CSRF validation | PASS |
| Bonus cap (10,000 per transaction) | PASS |
| Overflow protection (maxPointsPerTransaction: 100,000) | PASS |
| Promo code rollback on failure | PASS - Points refunded if promo creation fails |
| lifetimePoints never decremented on redemption | PASS (F-038 fix) |
| Duplicate signup bonus prevention | PASS |
| Duplicate birthday bonus prevention (per year) | PASS |
| Duplicate review bonus prevention (per product) | PASS |

### 6.5 Points Expiration

- Purchase points expire after 12 months (configured, `calculateExpirationDate`). CORRECT.
- Reminders at 90, 30, and 7 days before expiration. CORRECT.
- Grace period of 14 days. CORRECT.
- `processExpirations()` identifies expired batches. CORRECT.
- Cron endpoint exists at `/api/cron/points-expiring`. CORRECT.

### 6.6 Referral Milestones

| Milestone | Points | Idempotent? | Status |
|-----------|--------|-------------|--------|
| 5 referrals | 500 | Yes (checks existing transactions) | PASS |
| 10 referrals | 1,500 | Yes | PASS |
| 25 referrals | 5,000 | Yes | PASS |
| 50 referrals | 15,000 | Yes | PASS |

### 6.7 Loyalty Issues

| ID | Severity | Issue |
|----|----------|-------|
| L-1 | P2 | `calculatePoints()` in `points-engine.ts` applies tier multiplier at earn-time (G7 fix), but the `/api/loyalty/earn` route uses `calculatePurchasePoints()` from `constants.ts` which does NOT apply tier multiplier (uses default `tierMultiplier = 1`). This means purchase points are NOT multiplied by tier, contradicting the PLATINUM "2x points" and DIAMOND "3x points" perks. |
| L-2 | P3 | The GET `/api/loyalty` endpoint has side effects: it generates referral codes and recalculates tiers. Comments (FLAW-088, FLAW-089) acknowledge this violates HTTP GET idempotency but it's flagged as TODO, not yet fixed. |
| L-3 | P3 | `earnPointsSchema` in `validations/loyalty.ts` allows types `PURCHASE, SIGNUP, REVIEW, REFERRAL, BIRTHDAY, BONUS` but the main `validations.ts` is actually used by the API route. Need to verify these stay in sync. |
| L-4 | P3 | `evaluateStreak()` in `points-engine.ts` has a UTC date normalization but the surprise-delight birthday check uses local `new Date()` which could cause timezone-related edge cases around midnight. |
| L-5 | P2 | Only PURCHASE points get an `expiresAt` (1 year). BONUS, REFERRAL, SIGNUP, REVIEW, and BIRTHDAY points never expire, which may be intentional but is not documented. The `processExpirations()` function would never touch these. |

---

## 7. CROSS-CUTTING ISSUES

| ID | Severity | Issue | Domain |
|----|----------|-------|--------|
| X-1 | P2 | `canadian-tax-engine.ts` and `accounting/types.ts TAX_RATES` are two separate sources of truth for tax rates. If one is updated and the other is not, tax calculations will diverge between customer-facing and accounting-facing flows. The `canadian-tax-config.ts` is a third source, used for place-of-supply taxation. Three overlapping tax rate definitions increase drift risk. |
| X-2 | P3 | The inventory service uses `Math.round()` for WAC rounding while the accounting service uses `roundCurrency()` (banker's rounding). WAC feeds into COGS entries, so a rounding difference could propagate. |

---

## 8. ISSUE SUMMARY

### P0 - Critical (Blocks correctness)

| ID | Issue |
|----|-------|
| A-1 | `generateSaleEntry()` double-counts discounts, creating unbalanced journal entries for any order with a non-zero discount. `assertJournalBalance()` would throw at runtime. |

### P1 - High (Significant business impact)

| ID | Issue |
|----|-------|
| A-2 | `otherTax` in `OrderData` is never journaled; non-zero values would cause runtime throw. |
| A-3 | Refund entries do not reverse PST for BC/SK/MB provinces. |

### P2 - Medium (Should fix)

| ID | Issue |
|----|-------|
| T-1 | Unknown provinces silently default to Quebec tax rates instead of error/zero. |
| PR-1 | Tier prices higher than base price produce misleading discount calculations. |
| I-1 | Reservation consumed but stock not decremented when insufficient at consumption time (silent failure). |
| L-1 | Tier multiplier not applied to purchase points despite being a documented perk. |
| L-5 | Non-purchase points never expire; undocumented behavior. |
| X-1 | Three overlapping tax rate definitions increase drift risk. |

### P3 - Low (Nice to fix)

| ID | Issue |
|----|-------|
| T-2 | `otherTax` field exists but is never used in journal generation. |
| T-3 | Two separate international tax functions (`calculateInternationalTax` and `calculateVAT`). |
| T-4 | Rounding inconsistency between tax engine and financial module. |
| SM-1 | Same-state transition handled differently by two validation APIs. |
| SM-2 | No EXCEPTION -> CANCELLED transition path. |
| PR-2 | `getEffectivePrices` silently omits non-existent products. |
| A-4 | Stripe payout uses ADJUSTMENT type instead of dedicated AUTO_PAYOUT. |
| I-2 | `adjustStock()` silently does nothing when insufficient stock for negative adjustment. |
| I-3 | Audit logging is fire-and-forget with no retry. |
| L-2 | GET `/api/loyalty` has side effects (generates codes, recalculates tiers). |
| L-3 | Earn points schema potentially duplicated between files. |
| L-4 | Timezone inconsistency in birthday/streak date calculations. |
| X-2 | WAC rounding (Math.round) vs accounting rounding (banker's) inconsistency. |

---

## 9. RECOMMENDATIONS

### Immediate (P0)
1. **Fix `generateSaleEntry()` discount handling**: Either credit sales at gross `order.subtotal` (standard accounting), or remove the separate discount debit line and keep the net credit. The standard approach is: Debit Cash (total), Debit Discounts/Returns (discount), Credit Sales (subtotal gross), Credit Tax liabilities, Credit Shipping.

### Short-term (P1)
2. **Handle `otherTax`**: Either remove the field from `OrderData` or add a journal line for it (e.g., credit INTL_TAX_PAYABLE).
3. **Add PST reversal to refund entries**: Check if original order had PST and create a debit line for PST_PAYABLE.

### Medium-term (P2)
4. **Apply tier multiplier to purchase points**: Pass user's tier to `calculatePurchasePoints()` in the earn route.
5. **Consolidate tax rate sources**: Use `canadian-tax-config.ts` as the single source of truth, deriving the simpler maps from it.
6. **Add error handling for unknown provinces** in tax calculations.
7. **Handle insufficient-stock-at-consumption**: Either throw an error or create an adjustment transaction.

---

*Audit completed by Claude Opus 4.6 on 2026-03-10. READ-ONLY analysis -- no files were modified.*
