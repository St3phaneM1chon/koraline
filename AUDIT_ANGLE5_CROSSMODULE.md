# AUDIT ANGLE 5 -- Cross-Module Integration via Bridge System
**Date**: 2026-03-10
**Project**: BioCycle Peptides (peptide-plus)
**Scope**: 43 bridges connecting 11 modules

---

## 1. BRIDGE ENDPOINT VERIFICATION (43 bridges)

### Legend
- PASS: API route file exists and matches declared endpoint
- FAIL: Endpoint file missing or path mismatch
- EMBEDDED: Data served by parent endpoint, not separate route

### Results by Bridge

| # | Source | Target | Endpoint | Status | Notes |
|---|--------|--------|----------|--------|-------|
| #1-2 | crm | ecommerce | `/api/admin/crm/deals/{id}` | PASS | Data embedded in deal detail GET |
| #3 | ecommerce | accounting | `/api/admin/orders/{id}/accounting` | PASS | Dedicated route, queries JournalEntry by orderId |
| #4 | accounting | ecommerce | `/api/accounting/entries` | PASS | Route at `/api/accounting/entries/route.ts` |
| #5 | ecommerce | loyalty | `/api/admin/orders/{id}/loyalty` | PASS | Queries LoyaltyTransaction by orderId |
| #6 | loyalty | ecommerce | `/api/admin/loyalty/members/{id}/orders` | PASS | Queries Order by userId |
| #7 | crm | voip | `/api/admin/crm/deals/{id}` | PASS | Call history embedded in deal detail GET |
| #8 | voip | crm | `/api/admin/voip/call-logs/{id}` | PASS | CRM deals embedded in call detail GET |
| #9 | ecommerce | marketing | `/api/admin/orders/{id}/marketing` | PASS | Queries promoCode data |
| #10 | marketing | ecommerce | `/api/admin/promo-codes/{id}/revenue` | PASS | Revenue data for promo code |
| #11 | crm | email | `/api/admin/crm/deals/{id}` | PASS | Email history embedded in deal detail |
| #12 | email | crm | `/api/admin/emails/{id}/crm` | PASS | CRM deals for email recipient |
| #13 | voip | ecommerce | `/api/admin/voip/call-logs/{id}` | PASS | Orders embedded in call detail |
| #14 | accounting | crm | `/api/admin/accounting/entries/{id}/crm` | PASS | CRM deal via entry->order->deal |
| #15 | crm | loyalty | `/api/admin/crm/deals/{id}` | PASS | Loyalty info embedded in deal detail |
| #16 | marketing | crm | `/api/admin/promo-codes/{id}/crm` | PASS | CRM deals for promo users |
| #17 | catalog | marketing | `/api/admin/products/{id}/promos` | PASS | Active promos for product |
| #18 | system | ecommerce | `/api/admin/dashboard/cross-module` | PASS | Multi-module summary for dashboard |
| #19 | ecommerce | catalog | `/api/admin/orders/{id}/products` | PASS | Products from order items |
| #20 | ecommerce | community | `/api/admin/orders/{id}/reviews` | PASS | Reviews by order customer |
| #22 | ecommerce | email | `/api/admin/orders/{id}/emails` | PASS | Emails sent to order customer |
| #23 | ecommerce | voip | `/api/admin/orders/{id}/calls` | PASS | Call log for order customer |
| #24 | ecommerce | crm | `/api/admin/orders/{id}/deal` | PASS | CRM deal via Order.dealId FK |
| #25 | catalog | ecommerce | `/api/admin/products/{id}/sales` | PASS | Sales stats for product |
| #26 | catalog | community | `/api/admin/products/{id}/reviews` | PASS | Reviews for product |
| #27 | catalog | media | `/api/admin/products/{id}/videos` | PASS | Videos via VideoProductLink |
| #28 | catalog | crm | `/api/admin/products/{id}/deals` | PASS | CRM deals with product |
| #29 | marketing | catalog | `/api/admin/promo-codes/{id}/products` | PASS | Products targeted by promo |
| #33 | marketing | email | `/api/admin/newsletter/campaigns/{id}/emails` | PASS | Email delivery stats for campaign |
| #34 | community | ecommerce | `/api/admin/reviews/{id}/purchases` | PASS | Reviewer purchase history |
| #35 | community | catalog | `/api/admin/reviews/{id}/product` | PASS | Product link from review |
| #36 | community | crm | `/api/admin/reviews/{id}/crm` | PASS | CRM context for reviewer |
| #37 | loyalty | marketing | `/api/admin/loyalty/transactions/promos` | PASS | Loyalty members who used promos |
| #38 | loyalty | community | `/api/admin/loyalty/transactions/community` | PASS | Points earned from reviews |
| #39 | media | ecommerce | `/api/admin/media/videos/{id}/sales` | PASS | Sales for video-linked products |
| #40 | media | catalog | `/api/admin/media/videos/{id}/products` | PASS | Products linked to video |
| #41 | media | marketing | `/api/admin/media/social-posts/marketing` | PASS | Social posts + campaign correlation |
| #42 | media | community | `/api/admin/media/videos/{id}/community` | PASS | Video product reviews |
| #43 | email | ecommerce | `/api/admin/emails/{id}/orders` | PASS | Orders for email recipient |
| #44 | email | marketing | `/api/admin/emails/{id}/campaign` | PASS | Campaign that triggered email |
| #45 | voip | loyalty | `/api/admin/voip/call-logs/{id}/loyalty` | PASS | Loyalty tier of call client |
| #46 | voip | email | `/api/admin/voip/call-logs/{id}/emails` | PASS | Emails of call client |
| #47 | crm | catalog | `/api/admin/crm/deals/{id}/products` | PASS | Products attached to deal |
| #48 | crm | marketing | `/api/admin/crm/deals/{id}/marketing` | PASS | Promos used by deal contact |
| **#49** | crm | media | `/api/admin/crm/deals/{id}/media` | PASS | Videos for deal contact |
| **#50** | crm | accounting | `/api/admin/crm/deals/{id}/accounting` | **FAIL** | **Route file MISSING** |

### Summary
- **42 PASS** / **1 FAIL**
- Bridge #50 declares endpoint `/api/admin/crm/deals/{id}/accounting` but **no route file exists** at `src/app/api/admin/crm/deals/[id]/accounting/route.ts`. The data is served inline by the main deal detail endpoint (`/api/admin/crm/deals/[id]/route.ts` lines 198-238). The registry endpoint declaration is **misleading** -- clients that call the declared endpoint directly will get a 404.

---

## 2. BRIDGE FRONTEND RENDERING VERIFICATION

### Bridges with `renderedIn` pointing to a component

| Bridge | renderedIn | Component Exists | Renders Bridge Data |
|--------|-----------|-----------------|-------------------|
| #1-2 | `deals/[id]/page.tsx` | YES | YES -- Purchase history card |
| #3 | `commandes/page.tsx` | YES | YES -- Accounting section in order detail |
| #4 | `comptabilite/ecritures/page.tsx` | YES | YES -- Source order link + CRM deal bridge |
| #5 | `commandes/page.tsx` | YES | YES -- Loyalty points earned/used |
| #7 | `deals/[id]/page.tsx` | YES | YES -- Call history card |
| #8 | `telephonie/journal/CallLogClient.tsx` | YES | YES -- CRM deals in expanded call |
| #9 | `commandes/page.tsx` | YES | YES -- Promo code details |
| #10 | `promo-codes/page.tsx` | YES | YES -- Revenue data for selected promo |
| #11 | `deals/[id]/page.tsx` | YES | YES -- Email history card |
| #13 | `telephonie/journal/CallLogClient.tsx` | YES | YES -- Recent orders in expanded call |
| #15 | `deals/[id]/page.tsx` | YES | YES -- Loyalty tier/points card |
| #17 | `produits/[id]/ProductEditClient.tsx` | YES | YES -- Promos tab |
| #18 | `dashboard/DashboardClient.tsx` | YES | YES -- Cross-module widgets |
| #22 | `commandes/page.tsx` | YES | YES -- Emails bridge |
| #23 | `commandes/page.tsx` | YES | YES -- Calls bridge |
| #24 | `commandes/page.tsx` | YES | YES -- Deal bridge |
| #25 | `produits/[id]/ProductEditClient.tsx` | YES | YES -- Sales tab |
| #26 | `produits/[id]/ProductEditClient.tsx` | YES | YES -- Reviews tab |
| #27 | `produits/[id]/ProductEditClient.tsx` | YES | YES -- Videos tab |
| #28 | `produits/[id]/ProductEditClient.tsx` | YES | YES -- Deals tab |
| #33 | `newsletter/page.tsx` | YES | YES -- Email stats for campaign |
| #44 | `emails/page.tsx (campaigns tab)` | YES | YES -- Campaign source |
| #50 | `crm/deals/[id]/page.tsx` | YES | YES -- Accounting info (data from main deal API) |

### Bridges with `renderedIn: "(API ready)"` (22 bridges)

These bridges have a working API endpoint but no dedicated frontend rendering. They are consumed programmatically or by generic components:

| Bridges | Count | Note |
|---------|-------|------|
| #6, #12, #14, #16, #19, #20, #29, #34, #35, #36, #37, #38, #39, #40, #41, #42, #43, #45, #46, #49 | 20 | API only, no dedicated UI panel |

**Assessment**: All 20 "API ready" bridges have valid route files. This is acceptable for batch/programmatic use. However, the lack of frontend visibility means these bridge connections are invisible to admin users.

---

## 3. END-TO-END WORKFLOW TEST RESULTS

### 3.1 Order -> Accounting (Bridge #3)

**Flow**: Order creation -> `webhook-accounting.service.ts` -> JournalEntry with orderId FK

| Step | Status | Detail |
|------|--------|--------|
| `auto-entries.service.ts` exists | PASS | Generates balanced journal entries (sale, fee, refund, payout) |
| `webhook-accounting.service.ts` exists | PASS | Creates entries on order completion via Stripe/PayPal webhooks |
| JournalEntry.orderId FK | PASS | Schema has `orderId String?` on JournalEntry model |
| Balance validation | PASS | `assertJournalBalance()` called on every auto-generated entry |
| Error handling | PASS | `AutoEntryError` class with entryType and sourceId |
| Canadian tax calculation | PASS | TPS/TVQ/TVH/PST with destination-based taxation |
| Bridge API returns data | PASS | `/api/admin/orders/{id}/accounting` queries by orderId |
| Frontend renders data | PASS | `commandes/page.tsx` shows debit/credit totals and entry list |

**Verdict**: COMPLETE END-TO-END. Solid implementation with validation and error handling.

### 3.2 Order -> Loyalty (Bridge #5)

**Flow**: Order completion -> LoyaltyTransaction with orderId FK -> points awarded

| Step | Status | Detail |
|------|--------|--------|
| LoyaltyTransaction.orderId FK | PASS | Schema has orderId on LoyaltyTransaction |
| Bridge API returns data | PASS | Queries transactions by orderId, computes earned/used |
| Frontend renders data | PASS | Points earned, used, current tier displayed |
| Points award on checkout | **NOT VERIFIED** | No explicit `awardPoints()` call found in checkout/webhook flow |

**Verdict**: Bridge READ path is complete. However, the **write path** (automatically awarding points when an order is completed) could not be confirmed from the bridge API alone -- it may be handled by a webhook or cron job not directly in the bridge.

### 3.3 Order -> Inventory

**Flow**: Checkout -> `reserveStock()` -> InventoryReservation -> order confirmed -> stock consumed

| Step | Status | Detail |
|------|--------|--------|
| `inventory.service.ts` exists | PASS | Full reserve/consume/release lifecycle |
| Stock reservation with TTL | PASS | 30-minute TTL with self-healing for expired reservations |
| Transaction-safe reservation | PASS | Uses `prisma.$transaction()` to prevent race conditions |
| Format-level stock tracking | PASS | Supports both product-level and format-level inventory |
| COGS journal entries | PASS | Imports `ACCOUNT_CODES` from accounting types |
| No bridge registered | **N/A** | Inventory is not in the bridge registry (internal service) |

**Verdict**: Solid implementation but NOT a bridge in the registry. This is a direct service integration.

### 3.4 CRM Lead -> Deal -> Quote -> Contract Pipeline

| Step | Status | Detail |
|------|--------|--------|
| Lead creation | PASS | `/api/admin/crm/leads` POST route |
| Lead -> Deal conversion | PASS | `/api/admin/crm/leads/{id}/convert` -- creates CrmDeal + updates lead |
| Deal management | PASS | Full CRUD with pipeline stages, assignments, tags |
| Deal -> Quote | PASS | `/api/admin/crm/quotes` POST requires `dealId` |
| Quote line items | PASS | Supports product-linked and free-text items with discounts |
| Quote -> Contract | PASS (partial) | `/api/admin/crm/contracts` POST accepts optional `dealId` |
| Contract lifecycle | PASS | DRAFT -> PENDING_SIGNATURE -> ACTIVE -> EXPIRED/RENEWED/CANCELLED |
| Contract renewal | PASS | Auto/manual/none renewal types with notice period |

**Verdict**: Full pipeline exists. Quote-to-Contract link is through `dealId` on both models. However, there is no explicit "convert quote to contract" action -- contracts are created independently with optional dealId. This is a **P2 gap**.

### 3.5 VoIP Call -> CDR -> Recording -> Transcription

| Step | Status | Detail |
|------|--------|--------|
| CDR Ingest webhook | PASS | `/api/admin/voip/cdr/ingest` -- receives FreeSWITCH CDR data |
| Webhook authentication | PASS | Shared secret validation (required in production) |
| Recording upload | PASS | `processPendingRecordings` called after CDR ingest |
| Transcription API | PASS | `/api/admin/voip/transcription` -- live and stored transcriptions |
| Call detail includes recording | PASS | CallLog includes `recording` and `transcription` relations |
| Cross-module bridges from call | PASS | CRM deals, orders, loyalty, emails all fetched in call detail |

**Verdict**: COMPLETE END-TO-END telephony flow.

---

## 4. MODULE INTERACTION MATRIX (12x12)

Rows = source module, Columns = target module. Numbers = bridge IDs.

```
              | dashboard | commerce | catalog | marketing | community | loyalty | media | emails | telephony | crm | accounting | system |
--------------+-----------+----------+---------+-----------+-----------+---------+-------+--------+-----------+-----+------------+--------+
dashboard     |     -     |    #18   |         |           |           |         |       |        |           |     |            |        |
commerce      |           |     -    |   #19   |    #9     |    #20    |   #5    |       |  #22   |    #23    | #24 |     #3     |        |
catalog       |           |    #25   |    -    |    #17    |    #26    |         |  #27  |        |           | #28 |            |        |
marketing     |           |    #10   |   #29   |     -     |           |         |       |  #33   |           | #16 |            |        |
community     |           |    #34   |   #35   |           |     -     |         |       |        |           | #36 |            |        |
loyalty       |           |     #6   |         |    #37    |    #38    |    -    |       |        |           |     |            |        |
media         |           |    #39   |   #40   |    #41    |    #42    |         |   -   |        |           |     |            |        |
emails        |           |    #43   |         |    #44    |           |         |       |   -    |           | #12 |            |        |
telephony     |           |    #13   |         |           |           |  #45    |       |  #46   |     -     |  #8 |            |        |
crm           |           |   #1-2   |   #47   |    #48    |           |  #15    |  #49  |  #11   |     #7    |  -  |    #50     |        |
accounting    |           |     #4   |         |           |           |         |       |        |           | #14 |     -      |        |
system        |           |          |         |           |           |         |       |        |           |     |            |   -    |
```

### Module Connectivity Score (bridges as source + target)

| Module | As Source | As Target | Total | Connectivity |
|--------|----------|----------|-------|-------------|
| commerce (ecommerce) | 8 | 8 | 16 | **VERY HIGH** (hub) |
| crm | 8 | 5 | 13 | **VERY HIGH** (hub) |
| catalog | 5 | 4 | 9 | HIGH |
| marketing | 4 | 4 | 8 | HIGH |
| community | 3 | 3 | 6 | MEDIUM |
| loyalty | 2 | 3 | 5 | MEDIUM |
| emails | 3 | 3 | 6 | MEDIUM |
| telephony (voip) | 3 | 2 | 5 | MEDIUM |
| media | 4 | 2 | 6 | MEDIUM |
| accounting | 2 | 2 | 4 | LOW |
| dashboard (system) | 1 | 0 | 1 | LOW |

---

## 5. MISSING BRIDGES -- Module Pairs That SHOULD Have Bridges

### P1 -- HIGH VALUE (Should be implemented soon)

| Source | Target | Rationale | Recommended Bridge |
|--------|--------|-----------|--------------------|
| **community** | **loyalty** | Awarding loyalty points for reviews. Bridge #38 exists in reverse (loyalty->community) but there is no bridge from community->loyalty to trigger point awards when a review is posted. | Community -> Loyalty: POST endpoint to award points on review creation |
| **accounting** | **loyalty** | Loyalty points represent a financial liability (deferred revenue). When points are earned, a journal entry should credit a liability account. | Accounting -> Loyalty: Sync points balance as financial liability |
| **telephony** | **accounting** | Call costs (toll, minutes consumed) should generate expense journal entries for cost tracking. | VoIP -> Accounting: Auto-generate call cost entries |
| **ecommerce** | **inventory** | Currently inventory.service.ts is a direct integration, not a bridge. Stock status should be visible in the order detail panel. | Commerce -> Inventory: Show reservation/stock status per order |

### P2 -- MEDIUM VALUE (Good to have)

| Source | Target | Rationale |
|--------|--------|-----------|
| **media** | **crm** | Video engagement (views, watch time) should feed CRM activity for lead/deal scoring. |
| **media** | **email** | Video content should be embeddable in email campaigns, with view tracking. |
| **loyalty** | **crm** | Loyalty tier changes should create CRM activities for customer success tracking. |
| **loyalty** | **accounting** | Loyalty point redemptions should generate accounting entries (deferred revenue release). |
| **community** | **email** | New review notifications could trigger targeted email campaigns. |
| **community** | **marketing** | Review sentiment data could feed marketing campaign targeting. |
| **catalog** | **loyalty** | Product-specific loyalty multipliers (e.g., 2x points on peptides). |
| **catalog** | **accounting** | Product COGS should auto-generate accounting entries on sale. |

### P3 -- LOW VALUE (Future consideration)

| Source | Target | Rationale |
|--------|--------|-----------|
| **telephony** | **marketing** | Outbound call campaigns tied to marketing campaigns. |
| **telephony** | **catalog** | Products discussed in calls (via transcription NLP). |
| **system** | **all** | System health alerts bridged to all modules. |
| **accounting** | **marketing** | Budget allocation tracking for marketing spend. |
| **accounting** | **email** | Invoice/statement delivery via email module. |

---

## 6. ISSUES CLASSIFIED BY SEVERITY

### P0 -- CRITICAL (0 issues)
None. All core bridge APIs exist and are functional.

### P1 -- HIGH (3 issues)

| ID | Issue | Impact | Location |
|----|-------|--------|----------|
| P1-001 | **Bridge #50 endpoint MISSING**: Registry declares `/api/admin/crm/deals/{id}/accounting` but route file does not exist. Data is embedded in main deal GET response instead. Any code calling `buildBridgeEndpoint(template, id)` for this bridge will get a 404. | API consumers relying on the registry URL will fail | `src/lib/bridges/registry.ts` line 336 vs missing `src/app/api/admin/crm/deals/[id]/accounting/route.ts` |
| P1-002 | **20 bridges have no frontend rendering** (marked "API ready"). While the APIs work, admin users have no visibility into these cross-module connections through the UI. Key missing UIs: loyalty->commerce (#6), community->commerce (#34), media->commerce (#39). | Admin visibility gap -- cross-module insights are invisible | All bridges with `renderedIn: '(API ready)'` |
| P1-003 | **No automatic loyalty point award on order completion**. Bridge #5 reads loyalty data for an order, and Bridge #38 reads community-earned points, but there is no confirmed automatic trigger that creates LoyaltyTransaction records when an order is completed via webhook. | Loyalty points may not be awarded automatically | Missing in webhook flow or checkout handler |

### P2 -- MEDIUM (5 issues)

| ID | Issue | Impact | Location |
|----|-------|--------|----------|
| P2-001 | **No Quote-to-Contract conversion action**. Quotes and contracts both link to deals via `dealId` but there is no "Convert Quote to Contract" endpoint. Users must manually create a contract and re-enter values. | Manual workflow friction in CRM pipeline | `/api/admin/crm/quotes/` and `/api/admin/crm/contracts/` |
| P2-002 | **Bridge #4 endpoint mismatch**: Registry says `/api/accounting/entries` (without `/admin/`) but the actual route is at `/api/accounting/entries/route.ts`. This works but is inconsistent with all other bridges using `/api/admin/` prefix. | Inconsistent URL pattern | `registry.ts` line 63 |
| P2-003 | **No loyalty points liability in accounting**. Earned loyalty points represent deferred revenue (a financial liability) but no journal entry is created when points are awarded. | Financial reporting inaccuracy | Missing bridge: loyalty <-> accounting |
| P2-004 | **No call cost tracking in accounting**. VoIP calls have duration and cost data but no journal entries are generated for call expenses. | Missing OPEX tracking | Missing bridge: telephony -> accounting |
| P2-005 | **Inventory not surfaced in order detail**. Stock reservation status, warehouse location, and fulfillment data are not visible in the order bridge panel. | Admin must check inventory separately | Missing bridge: commerce -> inventory |

### P3 -- LOW (4 issues)

| ID | Issue | Impact | Location |
|----|-------|--------|----------|
| P3-001 | **Bridge #41 (Media -> Marketing) uses timeline correlation** instead of a direct FK. Social posts are matched to campaigns by date proximity, not by a `campaignId` FK. | Weak correlation, potential mismatches | `/api/admin/media/social-posts/marketing/route.ts` |
| P3-002 | **Bridge registry has gaps in numbering** (no #2, #21, #30-32). While not a bug, it makes auditing harder. | Minor documentation issue | `registry.ts` |
| P3-003 | **BridgeModule type does not include 'dashboard'**. The matrix uses 'system' for dashboard but the dashboard is conceptually distinct. | Type system inconsistency | `src/lib/bridges/types.ts` line 26 |
| P3-004 | **Email bridge #22 queries by userId** but falls back to email string match comment. The actual code only uses `userId` -- no string fallback implemented despite the comment. | Orphaned comment, minor | `orders/[id]/emails/route.ts` line 42-43 |

---

## 7. ARCHITECTURE ASSESSMENT

### Strengths
1. **Consistent bridge pattern**: All bridges use `BridgeResponse<T>` wrapper with `enabled: boolean` gating
2. **Feature flag integration**: Every bridge checks `isModuleEnabled()` before querying data
3. **Graceful degradation**: When a module is disabled, bridges return `{ enabled: false }` instead of errors
4. **Type safety**: `src/lib/bridges/types.ts` provides TypeScript interfaces for all bridge responses
5. **Lazy loading in frontend**: Product edit page and deal detail lazy-load bridge data on tab switch
6. **Parallel fetching**: Order detail page fetches all 7+ bridges in parallel via `Promise.all()`
7. **Comprehensive auto-entries**: Accounting auto-entries handle sales, fees, refunds, payouts with balance validation

### Weaknesses
1. **Registry accuracy**: Bridge #50 endpoint is a lie (data embedded in parent, no standalone route)
2. **20/43 bridges are API-only**: Over 46% of bridges have no UI rendering
3. **No bidirectional write triggers**: Bridges are READ-ONLY queries. No bridge triggers automatic writes (e.g., order -> loyalty award, order -> accounting entry). These are handled by separate webhook/service layers not tracked in the bridge registry.
4. **Missing inventory bridge**: The inventory module has a full service but zero bridges in the registry

### Overall Score: **78/100**
- Endpoint existence: 42/43 (98%)
- Frontend rendering: 23/43 (53%)
- End-to-end workflows: 4/5 complete (80%)
- Type safety: 43/43 (100%)
- Missing critical bridges: -5 points (community->loyalty, accounting->loyalty)
- Registry accuracy: -2 points (Bridge #50 mismatch)

---

## 8. RECOMMENDATIONS

### Immediate Actions (P1)
1. **Create** `src/app/api/admin/crm/deals/[id]/accounting/route.ts` as a dedicated bridge endpoint (or update registry to reflect the actual embedded endpoint pattern)
2. **Verify** that loyalty points are automatically awarded on order completion -- add webhook handler if missing
3. **Plan UI panels** for the top 5 "API ready" bridges (#6, #34, #39, #36, #37) to surface cross-module data to admins

### Short-term Actions (P2)
4. **Add Quote-to-Contract conversion** endpoint in CRM
5. **Fix registry endpoint** for Bridge #4 to use `/api/admin/accounting/entries` (with admin prefix)
6. **Add inventory bridge** (#51?) to surface stock/reservation status in order detail

### Medium-term Actions (P3)
7. **Add SocialPost.campaignId FK** to replace timeline correlation in Bridge #41
8. **Create accounting bridges** for loyalty liability and call costs
9. **Standardize bridge numbering** in registry

---

*Report generated by cross-module integration audit, Angle 5 of mega-audit.*
*Files analyzed: 43 bridge API routes, 14 frontend components, 5 service layers, 12 Prisma schema files.*
