# AUDIT INTEGRATION PLAN — BioCycle Peptides
### Making Everything Work Together
### Date: 2026-03-10

---

## OBJECTIVE

Transform BioCycle Peptides from a collection of well-built modules into a fully integrated, production-grade platform where every module communicates bidirectionally and data flows seamlessly end-to-end.

---

## PHASE 1: DATA INTEGRITY FOUNDATION (Week 1)

**Goal**: Ensure every database record has proper referential integrity.

### 1.1 Clean Orphan Data
```sql
-- Run these BEFORE adding FK constraints
-- See full SQL in AUDIT_ANGLE1_SCHEMA.md section 9
DELETE FROM "Subscription" WHERE "userId" NOT IN (SELECT id FROM "User");
DELETE FROM "Wishlist" WHERE "productId" NOT IN (SELECT id FROM "Product");
-- ... (16 models total)
```

### 1.2 Fix Cascade Deletes
| Model | Current | Target | Reason |
|-------|---------|--------|--------|
| ConsentRecord | Cascade | Restrict | GDPR audit trail |
| ForumPost/Reply/Vote | Cascade | SetNull | Preserve content |
| Conversation | Cascade | SetNull | Preserve messages |
| CustomerNote | Cascade | SetNull | Preserve CRM data |
| VideoSession | Cascade | SetNull | Preserve sessions |
| LoyaltyTransaction | Cascade | Restrict | Financial records |

### 1.3 Add Missing FK Relations
Add `@relation` to 16 models + StockLevel/StockMovement. After cleanup:
```bash
npx prisma validate && npx prisma generate && npm run build
DATABASE_URL='...' npx prisma db push  # Apply to production
```

### 1.4 Verification
- Run orphan check SQL queries post-migration
- Verify `npx prisma validate` passes
- Verify `npm run build` passes

---

## PHASE 2: ACCOUNTING CORRECTNESS (Week 1)

**Goal**: Fix the P0 accounting bug before any discounted order is processed.

### 2.1 Fix generateSaleEntry() Discount Handling
**Current (broken)**:
- Credits: `subtotal - discount` (net)
- Debits: `total` + `discount` (separate contra-revenue line)
- Result: Unbalanced by `discount` amount

**Fix (standard accounting)**:
- Credits: `subtotal` (gross revenue)
- Debits: `total` (cash received) + `discount` (contra-revenue)
- Result: Balanced

### 2.2 Add PST Reversal to Refunds
For BC/SK/MB orders, add a PST debit line in `generateRefundEntry()`.

### 2.3 Handle otherTax
Either add a journal line for `otherTax` or remove the field from `OrderData`.

### 2.4 Consolidate Tax Rate Sources
Use `canadian-tax-config.ts` as single source of truth. Derive simpler maps from it.

---

## PHASE 3: CROSS-MODULE WIRING (Week 2)

**Goal**: Complete the bridge system so all modules talk to each other.

### 3.1 Fix Broken Bridges
| Bridge | Fix |
|--------|-----|
| #50 (CRM->Accounting) | Create `src/app/api/admin/crm/deals/[id]/accounting/route.ts` OR update registry to point to main deal endpoint |
| #4 (Accounting->Ecommerce) | Standardize to `/api/admin/accounting/entries` |

### 3.2 Add Missing Write Triggers
| Trigger | When | Action |
|---------|------|--------|
| Order Completed | Stripe/PayPal webhook | Create LoyaltyTransaction (EARN_PURCHASE) |
| Review Posted | POST /api/community/reviews | Create LoyaltyTransaction (EARN_REVIEW) |
| Points Redeemed | POST /api/loyalty/redeem | Create JournalEntry (deferred revenue release) |
| Call Completed | VoIP CDR ingest | Create Expense journal entry for call cost |

### 3.3 Add Frontend Bridge Panels (Top 5)
Priority panels for the 20 "API ready" bridges:
1. **Order Detail -> Inventory**: Show stock reservation status
2. **Product Detail -> Community**: Show review stats
3. **CRM Contact -> Loyalty**: Show tier/points
4. **CRM Contact -> Orders**: Show purchase history
5. **Media Video -> Sales**: Show product-linked revenue

### 3.4 Add Quote-to-Contract Conversion
Create POST `/api/admin/crm/contracts/from-quote/[quoteId]` that:
- Copies quote values to new contract
- Links via dealId
- Sets initial status to DRAFT

---

## PHASE 4: CRON & QUEUE CLEANUP (Week 2)

### 4.1 BullMQ Decision
**Option A (Recommended)**: Remove 32 dead queue definitions. Keep `media-cleanup` only. All cron work stays HTTP-based.
**Option B**: Implement processors for high-volume queues (email, webhooks). Requires Redis stability.

### 4.2 Webhook Reliability
1. Implement `/api/cron/retry-webhooks` for failed Stripe/PayPal events
2. Add idempotency keys to: WhatsApp, Email-to-Lead, Bounce, SMS, Telnyx, Meta, Zapier, Zoom, Teams, Webex
3. Add DLQ to media-cleanup queue
4. Remove duplicate `update-exchange-rates` cron (keep `fx-rate-sync`)

### 4.3 Webhook Dedup Pattern (Apply to all)
```typescript
// Check existing before processing
const existing = await prisma.webhookEvent.findUnique({
  where: { eventId: webhookId }
});
if (existing) return NextResponse.json({ status: 'duplicate' });
// Process then record
await prisma.webhookEvent.create({ data: { eventId: webhookId, ... } });
```

---

## PHASE 5: API COMPLETENESS (Week 3)

### 5.1 Missing CRUD Endpoints
| Endpoint | Methods to Add |
|----------|---------------|
| `/api/admin/crm/contacts/[id]` | GET, PUT, DELETE |
| `/api/admin/customers` | POST (create), PUT (update basic info) |
| `/api/accounting/entries/[id]` | GET, PUT |

### 5.2 Zod Validation Sprint
Add Zod schemas to 103 admin write routes. Priority order:
1. Financial routes (accounting, payments) — 20 routes
2. User management routes — 15 routes
3. CRM mutation routes — 30 routes
4. Content/marketing routes — 38 routes

### 5.3 Permission Granularity
Add `requiredPermission` to 326 admin routes. Map each to existing permission codes:
- Accounting routes → `accounting.*` permissions
- Product routes → `products.*` permissions
- User routes → `users.*` permissions
- etc.

---

## PHASE 6: i18n COMPLETION (Week 3-4)

### 6.1 Missing Keys (P0)
Generate the 1,142 missing keys for all 22 locales. Priority:
1. Customer-facing pages first (shop, checkout, account)
2. Admin accounting pages (53+49+30 keys)
3. Admin CRM pages (52+27+27 keys)

### 6.2 Hardcoded String Conversion
Convert customer-facing pages first:
1. shipping-policy (34 strings)
2. refund-policy (26 strings)
3. gift-cards (9 strings)
4. estimate/[token] (21 strings)
5. Employee dashboard (54 strings)

### 6.3 Admin Batch (Lower Priority)
949 hardcoded strings across 107 admin files — convert module by module.

---

## PHASE 7: FRONTEND POLISH (Week 4)

### 7.1 Fix Stubs
| Page | Fix |
|------|-----|
| demo | Wire form to `/api/contact` or CRM lead creation |
| aide | Connect to KBArticle model, build sub-pages |
| rewards | Wire to `/api/loyalty` API |
| referrals | Wire to ambassador API |

### 7.2 Delete/Fix
- Delete `(shop)/test/page.tsx`
- Fix mocked webhooks admin page
- Fix 6 media API config pages (connect to platformConnection model)

### 7.3 SEO Metadata
Add `generateMetadata()` to 54 customer-facing pages. Template:
```typescript
export async function generateMetadata(): Promise<Metadata> {
  return { title: '...', description: '...', openGraph: { ... } };
}
```

### 7.4 Nav Completeness
Add 12 unreachable admin pages to `outlook-nav.ts`:
- Blog + Blog Analytics → under "Content" section
- Monitoring, Webhooks → under "System" section
- Fiscal (3 pages) → under "Accounting" section
- etc.

---

## PHASE 8: SECURITY HARDENING (Week 4)

### 8.1 Immediate
- Refactor `$queryRawUnsafe` to tagged template `Prisma.sql`
- Replace `new Function()` with `acorn` AST parser
- Fix timing-safe comparisons (social-posts/cron, PayPal Bearer)
- Remove `community/debug` route

### 8.2 Short-term
- Plan to fix 958 TypeScript errors masked by `ignoreBuildErrors: true`
- Enforce MFA for OWNER/EMPLOYEE after grace period
- Switch webhook in-memory rate limiters to Redis

---

## VERIFICATION CHECKLIST

After each phase:
- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` succeeds
- [ ] `npm run build` succeeds (or TypeScript errors tracked)
- [ ] Key API endpoints respond correctly (curl test)
- [ ] Bridge endpoints return data
- [ ] Cron jobs execute without error
- [ ] i18n keys resolve (no raw key strings in UI)

---

## TIMELINE

| Phase | Week | Focus | Est. Effort |
|-------|------|-------|-------------|
| 1 | Week 1 | Data Integrity | 8h |
| 2 | Week 1 | Accounting Fix | 4h |
| 3 | Week 2 | Cross-Module Wiring | 16h |
| 4 | Week 2 | Cron/Queue Cleanup | 8h |
| 5 | Week 3 | API Completeness | 20h |
| 6 | Week 3-4 | i18n Completion | 24h |
| 7 | Week 4 | Frontend Polish | 12h |
| 8 | Week 4 | Security Hardening | 8h |
| **Total** | **4 weeks** | | **~100h** |

---

*Integration Plan — Mega-Audit v3.0 | Claude Opus 4.6 | 2026-03-10*
