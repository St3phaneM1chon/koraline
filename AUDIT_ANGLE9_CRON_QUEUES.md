# AUDIT ANGLE 9 — Cron Jobs, BullMQ Queues & Webhook Handlers
## BioCycle Peptides (peptide-plus)
### Date: 2026-03-10

---

## SUMMARY COUNTS

| Category          | Count |
|-------------------|-------|
| Cron jobs         | **33** |
| BullMQ queues     | **33** (defined) / **1** (with processor) |
| Webhook handlers  | **15** (active receivers) + 1 stub (410 Gone) |

---

## 1. CRON INFRASTRUCTURE

### 1.1 Shared Lock Mechanism — `src/lib/cron-lock.ts`

All 33 cron jobs use `withJobLock()` which provides:
- **Distributed lock**: Redis SETNX with TTL (default 5 min), in-memory fallback when Redis unavailable
- **AbortController**: Signal passed to job function; aborts on timeout
- **Execution tracking**: `trackCronExecution()` logs name, status, duration, items processed, errors
- **Authentication**: Every route checks `CRON_SECRET` via `timingSafeEqual` (timing-safe comparison)

### 1.2 Cron Matrix (33 routes)

All routes located at `src/app/api/cron/{name}/route.ts`.

| # | Name | Auth | Idempotent | Locking | Error Handling | Return Status |
|---|------|------|-----------|---------|----------------|---------------|
| 1 | `ab-test-check` | CRON_SECRET + timingSafeEqual | YES — campaign status guard (only processes AB_TESTING) | withJobLock | try/catch + logger | JSON {processed, winners, duration} |
| 2 | `abandoned-cart` | CRON_SECRET + timingSafeEqual | YES — EmailLog dedup (24h), bounce suppression | withJobLock | try/catch + logger | JSON {checked, notified, duration} |
| 3 | `aging-reminders` | CRON_SECRET + timingSafeEqual | YES — 3-stage escalation (7/30/60 days), audit trail | withJobLock | try/catch + logger + per-invoice try/catch | JSON {processed, reminded, duration} |
| 4 | `birthday-bonus` | CRON_SECRET + timingSafeEqual | YES — $transaction checks existing EARN_BIRTHDAY this year | withJobLock | try/catch + logger | JSON {processed, awarded, duration} |
| 5 | `birthday-emails` | CRON_SECRET + timingSafeEqual | YES — $transaction dedup, configurable via SiteSetting | withJobLock | try/catch + logger | JSON {processed, sent, duration} |
| 6 | `browse-abandonment` | CRON_SECRET + timingSafeEqual | YES — EmailLog dedup (72h), bounce suppression | withJobLock | try/catch + logger | JSON {checked, notified, duration} |
| 7 | `calculate-agent-stats` | CRON_SECRET + timingSafeEqual | YES — upsert pattern (replaces stale stats) | withJobLock | try/catch + logger | JSON {processed, duration} |
| 8 | `calculate-metrics` | CRON_SECRET + timingSafeEqual | YES — upsert pattern, batch 50, signal.aborted check | withJobLock | try/catch + logger | JSON {processed, duration} |
| 9 | `churn-alerts` | CRON_SECRET + timingSafeEqual | YES — 30-day cooldown dedup via EmailLog | withJobLock | try/catch + logger | JSON {checked, alerted, duration} |
| 10 | `data-retention` | CRON_SECRET + timingSafeEqual | YES — date-based window (only deletes expired data) | withJobLock | try/catch + per-policy try/catch | JSON {policies, deleted, duration} |
| 11 | `deal-rotting` | CRON_SECRET + timingSafeEqual | YES — read-only detection (no state mutation) | withJobLock | try/catch + logger | JSON {checked, rotting, duration} |
| 12 | `dependency-check` | CRON_SECRET + timingSafeEqual | YES — replaces status in Redis each run | withJobLock | try/catch + per-service try/catch | JSON {services, healthy, down, duration} |
| 13 | `email-flows` | CRON_SECRET + timingSafeEqual | YES — processes only PENDING executions, marks COMPLETED | withJobLock | try/catch + cycle detection | JSON {processed, executed, duration} |
| 14 | `fx-rate-sync` | CRON_SECRET + timingSafeEqual | YES — upsert Currency rates | withJobLock | try/catch + fallback provider | JSON {updated, source, duration} |
| 15 | `lead-scoring` | CRON_SECRET + timingSafeEqual | YES — recalculates all scores (idempotent by design) | withJobLock | try/catch + logger | JSON {processed, updated, duration} |
| 16 | `low-stock-alerts` | CRON_SECRET + timingSafeEqual | PARTIAL — sends digest email each run (no dedup) | withJobLock | try/catch + logger | JSON {checked, alerts, duration} |
| 17 | `media-cleanup` | CRON_SECRET + timingSafeEqual | YES — only deletes stale files (>24h pending, >30d orphan) | withJobLock | try/catch + signal.aborted | JSON {deleted, freed, duration} |
| 18 | `points-expiring` | CRON_SECRET + timingSafeEqual | YES — $transaction checks existing EXPIRE entry | withJobLock | try/catch + logger | JSON {expired, warned, duration} |
| 19 | `price-drop-alerts` | CRON_SECRET + timingSafeEqual | YES — marks PriceWatch as notified after send | withJobLock | try/catch + bounce suppression | JSON {checked, notified, duration} |
| 20 | `process-callbacks` | CRON_SECRET + timingSafeEqual | YES — only processes due CALL tasks, marks completed | withJobLock | try/catch + individual fallback per batch | JSON {processed, created, duration} |
| 21 | `release-reservations` | CRON_SECRET + timingSafeEqual | YES — delegates to releaseExpiredReservations() | withJobLock | try/catch + logger | JSON {released, duration} |
| 22 | `replenishment-reminder` | CRON_SECRET + timingSafeEqual | YES — 3-step flow (25/30/35 days), checks reorder status | withJobLock | try/catch + logger | JSON {checked, reminded, duration} |
| 23 | `revenue-recognition` | CRON_SECRET + timingSafeEqual | YES — delegates to recognizeRevenue() service | withJobLock | try/catch + logger | JSON {processed, duration} |
| 24 | `satisfaction-survey` | CRON_SECRET + timingSafeEqual | YES — dedup via orderId in messageId, prefs check | withJobLock | try/catch + logger | JSON {checked, sent, duration} |
| 25 | `scheduled-campaigns` | CRON_SECRET + timingSafeEqual | YES — atomic SCHEDULED->SENDING status guard | withJobLock | try/catch + batch consent/prefs/bounce | JSON {processed, sent, duration} |
| 26 | `scheduled-reports` | CRON_SECRET + timingSafeEqual | PARTIAL — updates nextSendAt but **actual report gen is TODO** | withJobLock | try/catch + logger | JSON {processed, duration} |
| 27 | `stock-alerts` | CRON_SECRET + timingSafeEqual | YES — batch marks notifications as sent | withJobLock | try/catch + logger | JSON {checked, notified, duration} |
| 28 | `sync-email-tracking` | CRON_SECRET + timingSafeEqual | YES — delegates to syncEmailEngagementsToCrm() | withJobLock | try/catch + logger | JSON {synced, duration} |
| 29 | `update-exchange-rates` | CRON_SECRET + timingSafeEqual | YES — delegates to updateExchangeRates() | withJobLock | try/catch + logger | JSON {updated, duration} |
| 30 | `voip-notifications` | CRON_SECRET + timingSafeEqual | YES — tags array tracks notification state | withJobLock | try/catch + logger | JSON {processed, notified, duration} |
| 31 | `voip-recordings` | CRON_SECRET + timingSafeEqual | YES — only uploads PENDING recordings | withJobLock | try/catch + logger | JSON {processed, uploaded, duration} |
| 32 | `voip-transcriptions` | CRON_SECRET + timingSafeEqual | YES — only transcribes PENDING, 10min timeout | withJobLock | try/catch + logger | JSON {processed, transcribed, duration} |
| 33 | `welcome-series` | CRON_SECRET + timingSafeEqual | YES — step-based drip (3/7/14/21 days), step 4 skip-if-ordered | withJobLock | try/catch + logger | JSON {processed, sent, duration} |

**Auth coverage**: 33/33 (100%)
**Locking coverage**: 33/33 (100%)
**Error handling**: 33/33 (100%)
**Idempotency**: 31/33 strong, 2/33 partial (low-stock-alerts may re-send identical digest; scheduled-reports is incomplete)

---

## 2. BULLMQ QUEUE INFRASTRUCTURE

### 2.1 Queue Configuration — `src/lib/queue.ts`

- **33 QUEUE_NAMES** defined as constants (matching cron route names)
- **Default retry**: 3 attempts, exponential backoff (5s base)
- **Job retention**: completed 7 days (max 1000), failed 30 days
- **Worker defaults**: concurrency 1, stall interval 30s, lock duration 5 min
- **Connection**: Redis-based (uses `getRedisClient()`)

### 2.2 Queue Registry — `src/lib/queue-registry.ts`

| Queue Name | Processor Registered | Status |
|------------|---------------------|--------|
| `media-cleanup` | YES — `src/lib/jobs/media-cleanup.ts` | ACTIVE |
| All other 32 queues | NO — names defined only, no processors | NAMES ONLY |

### 2.3 Queue Matrix (Active Processors Only)

| Queue | Processor | Retry | DLQ | Concurrency | Notes |
|-------|-----------|-------|-----|-------------|-------|
| `media-cleanup` | `handleMediaCleanup()` — cleans stale review uploads (>24h) & orphan media (>30d) | 3 attempts, exponential backoff (5s) | NO | 1 | Also invocable via cron HTTP route |

### 2.4 Admin Queue API

- `GET /api/admin/queues` — lists all queue stats (protected by `withAdminGuard`)
- `GET /api/admin/queues/[name]` — shows recent jobs for a specific queue
- `POST /api/admin/queues/[name]` — manually triggers a job on the queue
- `DELETE /api/admin/queues/[name]` — cleans completed/failed jobs

---

## 3. WEBHOOK HANDLERS

### 3.1 Webhook Matrix

| # | Provider/Route | Signature Verification | Idempotency | Error Handling | Rate Limit | Notes |
|---|---------------|----------------------|-------------|----------------|-----------|-------|
| 1 | **Stripe** `/api/payments/webhook` | `stripe.webhooks.constructEvent()` (HMAC) | 3-layer: in-memory LRU (5000) + Redis SET (1h TTL) + DB WebhookEvent | try/catch, returns 200 on processing error, failWebhookEvent() tracks for retry | NO (Stripe rate-limits outbound) | Handles: checkout.session.completed, payment_intent.succeeded/failed, charge.refunded. Sanitizes PCI/PII. Lazy Stripe init. Raw payload stored for replay. |
| 2 | **PayPal** `/api/webhooks/paypal` | YES — PayPal API `verify-webhook-signature` endpoint (server-to-server verification) | YES — WebhookEvent findUnique by eventId, skips if exists. Ambassador commission uses upsert. | try/catch per handler + outer try/catch. Returns 200 on handler error (prevents PayPal retries). | NO | Handles: CAPTURE.COMPLETED, CAPTURE.REFUNDED, CAPTURE.DENIED. Accounting entries, inventory, ambassador commission, order status machine. TODO: item 72 retry mechanism. |
| 3 | **WhatsApp (Twilio)** `/api/webhooks/whatsapp` | YES — `validateTwilioSignature()` HMAC. Rejects if TWILIO_AUTH_TOKEN missing (503). | NO — no dedup on MessageSid | try/catch, returns 200 on error (prevents Twilio retries) | NO | Creates InboxConversation + InboxMessage. TwiML response. |
| 4 | **Email-to-Lead** `/api/webhooks/email-inbound` | YES — `x-webhook-secret` header, `timingSafeEqual`. Rejects if EMAIL_WEBHOOK_SECRET missing (503). | NO — no MessageId dedup (creates CrmActivity each time) | try/catch, returns 500 on error | NO | Auto-creates CrmLead (source: EMAIL). Creates InboxConversation + InboxMessage. |
| 5 | **Email Bounce** `/api/webhooks/email-bounce` | YES — Svix HMAC-SHA256 (Resend) with timestamp validation (5 min tolerance) + Bearer token fallback. Fail-closed if no secret. | NO — events processed each time | try/catch, returns 500 on error | YES (100/sec in-memory) | Multi-provider: Resend, SendGrid, generic. Handles bounces, complaints, delivery tracking. Forwards inbound emails to /api/webhooks/inbound-email. |
| 6 | **Zoom** `/api/webhooks/zoom` | YES — `validateZoomSignature()` HMAC. Rejects if secret missing (503). URL validation handled separately. | NO | try/catch, returns 500 on error | NO | Delegates to `handleZoomWebhook()`. |
| 7 | **Teams** `/api/webhooks/teams` | YES — Bearer token `timingSafeEqual`. Rejects if secret missing (503). Subscription validation handled pre-auth. | NO | try/catch, returns 500 on error | NO | Zod input validation. Teams subscription validation returns plain text. |
| 8 | **Webex** `/api/webhooks/webex` | YES — `validateWebexSignature()` HMAC-SHA1 via x-spark-signature. Tries DB secret first, then env var. Rejects if neither exists. | NO | try/catch, returns 500 on error | NO | Delegates to `handleWebexWebhook()`. |
| 9 | **Shipping** `/api/webhooks/shipping` | YES — Bearer token `timingSafeEqual` with SHA-256 length normalization. Fail-closed if no secret. | YES — forward-only status rank (prevents downgrade). Zod validation. | try/catch per update + outer try/catch. Returns results summary. | YES (200/sec in-memory) | Batch support (up to 100). Updates Order tracking, status, timestamps. Validates against order status machine. |
| 10 | **Meta (Facebook/Instagram)** `/api/webhooks/meta` | YES — HMAC-SHA256 via `x-hub-signature-256` with `META_APP_SECRET`. GET verification via `hub.verify_token` (timing-safe). Fail-closed. | NO | try/catch, returns 200 on error (Meta requirement) | NO | Handles Facebook Messenger + Instagram DMs. Zod validation. |
| 11 | **Zapier** `/api/webhooks/zapier` | YES — `x-api-key` header, `timingSafeEqual`. | NO — creates new records each time | try/catch, returns 500 on error | NO | Actions: create_lead, create_deal, update_deal. Zod discriminated union validation. GET provides sample data for trigger setup. |
| 12 | **SMS Inbound (Telnyx)** `/api/webhooks/sms-inbound` | YES — Telnyx HMAC-SHA256 (timestamp + body). Production: fail-closed. Dev: skips verification (with warning). | NO — no MessageId dedup | try/catch, returns 200 on error (prevents retries) | NO | SMS opt-out handling (STOP keywords). Creates InboxConversation + InboxMessage + CrmActivity. |
| 13 | **Inbound Email** `/api/webhooks/inbound-email` | YES — Svix HMAC-SHA256 (Resend) + timestamp validation (5 min) + Bearer fallback. Fail-closed. | YES — dedup by `messageId` (InboundEmail.findUnique). Email threading via In-Reply-To/References. | try/catch, returns 500 on error | NO (30MB payload limit) | Multi-provider normalization (Resend, SendGrid, generic). MIME type whitelist for attachments. Control char sanitization. Conversation threading + reopening. |
| 14 | **Telnyx VoIP** `/api/voip/webhooks/telnyx` | YES — HMAC-SHA256 (timestamp + body), timestamp validation (5 min). Production: fail-closed. Dev: skips (with warning). | NO | try/catch, returns 200 on error (prevents retries) | NO | Handles: call.initiated/answered/hangup, DTMF, recording, AMD, transcription. Dispatches to external webhook targets (Zapier, Make) fire-and-forget. Typed interface. |
| 15 | **Stripe (deprecated stub)** `/api/webhooks/stripe` | N/A — returns 410 Gone | N/A | N/A | N/A | Redirects to /api/payments/webhook |
| 16 | **v1 Webhooks** `/api/v1/webhooks` | YES — `withApiAuth` middleware (API key) | N/A — this is a webhook REGISTRATION endpoint, not a receiver | Standard error handling | N/A | GET lists registered webhooks, POST creates new webhook endpoint with signing secret. Not a webhook receiver. |

**Signature verification coverage**: 14/14 active receivers (100%)
**Fail-closed on missing secret**: 13/14 (Telnyx VoIP and SMS Inbound skip in dev mode only)
**Idempotency**: 4/14 strong (Stripe, PayPal, Shipping, Inbound Email), 10/14 none

---

## 4. ISSUES CLASSIFIED

### P0 — Critical (Production Impact)

| ID | Issue | Location | Details |
|----|-------|----------|---------|
| P0-01 | **32 BullMQ queues have no processor** | `src/lib/queue-registry.ts` | 33 queue names defined but only `media-cleanup` has a registered processor. The other 32 queues are dead code — cron work is done via HTTP route invocation, not BullMQ workers. Jobs enqueued to these queues will never be processed. Admin queue UI may show misleading data. |
| P0-02 | **No DLQ (Dead Letter Queue) configured** | `src/lib/queue.ts` | Failed BullMQ jobs after 3 retries are left in the failed state forever. No DLQ, no alerting, no automatic escalation. |
| P0-03 | **Stripe/PayPal webhook retry mechanism is TODO** | `src/app/api/payments/webhook/route.ts` (line 183), `src/app/api/webhooks/paypal/route.ts` (line 164) | Failed webhook events are recorded with status=FAILED but never automatically retried. The `/api/cron/retry-webhooks` cron job referenced in comments does not exist. Manual intervention required for every failed payment event. |

### P1 — High (Reliability/Security Risk)

| ID | Issue | Location | Details |
|----|-------|----------|---------|
| P1-01 | **Duplicate cron: fx-rate-sync and update-exchange-rates** | `src/app/api/cron/fx-rate-sync/` & `src/app/api/cron/update-exchange-rates/` | Both sync exchange rates. `fx-rate-sync` uses Bank of Canada primary with open.er-api fallback. `update-exchange-rates` delegates to `updateExchangeRates()`. Running both wastes resources and may cause race conditions on Currency table writes. |
| P1-02 | **scheduled-reports is a no-op** | `src/app/api/cron/scheduled-reports/route.ts` | Updates `nextSendAt` and marks reports as processed, but actual report generation and email sending are not implemented. The cron silently pretends to work. |
| P1-03 | **10/14 webhook handlers lack idempotency** | Multiple webhook routes | WhatsApp, Email-to-Lead, Bounce, Zoom, Teams, Webex, Meta, Zapier, SMS, Telnyx VoIP have no dedup. Retried webhooks from providers will create duplicate records (leads, messages, activities). |
| P1-04 | **Telnyx VoIP and SMS skip signature verification in dev** | `src/app/api/voip/webhooks/telnyx/route.ts`, `src/app/api/webhooks/sms-inbound/route.ts` | When `TELNYX_WEBHOOK_SECRET` is not set AND `NODE_ENV !== 'production'`, requests are accepted without signature verification. If NODE_ENV is misconfigured in staging, this becomes an open endpoint. |
| P1-05 | **low-stock-alerts may spam admin** | `src/app/api/cron/low-stock-alerts/route.ts` | No dedup — sends a digest email every time the cron runs, even if stock levels haven't changed since last alert. |
| P1-06 | **In-memory rate limiting is not distributed** | `src/app/api/webhooks/email-bounce/route.ts`, `src/app/api/webhooks/shipping/route.ts` | Rate limits (100/sec, 200/sec) use process-local memory. In multi-instance Azure deployments, each instance has its own counter — effective rate limit is N * stated limit. |

### P2 — Medium (Technical Debt)

| ID | Issue | Location | Details |
|----|-------|----------|---------|
| P2-01 | **BullMQ queue names are misleading** | `src/lib/queue.ts` | 33 queue names suggest BullMQ processes the work, but in reality HTTP cron routes handle everything. The queue infrastructure is largely unused scaffolding. |
| P2-02 | **Email-to-Lead webhook creates duplicate CrmActivity** | `src/app/api/webhooks/email-inbound/route.ts` | No dedup on messageId — every webhook retry creates a new CrmActivity record. |
| P2-03 | **WhatsApp webhook lacks MessageSid dedup** | `src/app/api/webhooks/whatsapp/route.ts` | Twilio can retry delivery; each retry creates a duplicate InboxMessage. |
| P2-04 | **Stripe webhook returns 200 on handler error** | `src/app/api/payments/webhook/route.ts` | The failWebhookEvent path still returns 200 to Stripe. While this prevents Stripe retries (which is intentional given the internal retry TODO), the retry mechanism doesn't exist yet (P0-03), so failed events are silently lost. |
| P2-05 | **email-bounce webhook forwards to inbound-email via internal HTTP** | `src/app/api/webhooks/email-bounce/route.ts` (processInboundResendEmail) | On `email.received`, fetches email body from Resend API then makes an internal HTTP POST to `/api/webhooks/inbound-email`. This adds latency and a network hop. Should call the handler function directly. |
| P2-06 | **PayPal Bearer token fallback not timing-safe in email-bounce** | `src/app/api/webhooks/email-bounce/route.ts` line 128 | `authHeader !== \`Bearer ${webhookSecret}\`` uses simple string comparison, not `timingSafeEqual`. |

### P3 — Low (Improvement Opportunities)

| ID | Issue | Location | Details |
|----|-------|----------|---------|
| P3-01 | **No cron scheduling metadata in code** | All cron routes | Cron schedules are configured externally (Azure/Vercel cron, or manual). No documentation in code of expected frequency. Adding schedule comments would aid auditability. |
| P3-02 | **deal-rotting is read-only** | `src/app/api/cron/deal-rotting/route.ts` | Detects rotting deals but takes no action (no email, no assignment, no notification). |
| P3-03 | **v1 webhook registration creates signing secrets but no delivery mechanism** | `src/app/api/v1/webhooks/route.ts` | Endpoints can be registered with signing secrets, but there is no event dispatching system that sends events to these endpoints. |
| P3-04 | **Admin queue UI may mislead operators** | `src/app/api/admin/queues/route.ts` | Shows stats for 33 queues, but 32 have no processors. Operators may think work is being queued when it's actually handled by HTTP cron. |
| P3-05 | **Zapier webhook has no rate limiting** | `src/app/api/webhooks/zapier/route.ts` | External callers can hit this endpoint without rate limits, potentially creating unlimited leads/deals. |
| P3-06 | **Meta webhook catches all errors and returns 200** | `src/app/api/webhooks/meta/route.ts` | Even internal errors return 200 to prevent Meta retries. This is correct per Meta's requirements but means processing failures are completely silent except for logs. |

---

## 5. RECOMMENDATIONS

### Immediate (P0 fixes)

1. **Decide on BullMQ strategy**: Either implement processors for the 32 empty queues or remove them entirely. Current state is confusing scaffolding that wastes Redis memory and misleads operators. If HTTP cron is the chosen pattern, simplify `queue.ts` to only define the queues that actually use BullMQ workers.

2. **Implement webhook retry cron** (`/api/cron/retry-webhooks`): The TODO at item 72 in the Stripe webhook is critical. Failed payment events currently sit in the DB with status=FAILED and are never retried. Implement the described cron: query FAILED events with retryCount < 3, exponential backoff (5/15/45 min), admin alert after max retries.

3. **Add DLQ configuration**: BullMQ supports `deadLetterQueue` option. Configure it for `media-cleanup` (the only active queue) so failed jobs are not silently stuck.

### Short-term (P1 fixes)

4. **Consolidate exchange rate sync**: Remove `update-exchange-rates` and keep only `fx-rate-sync` (which has Bank of Canada primary + fallback). Or vice versa. Having two crons doing the same thing is a bug waiting to happen.

5. **Implement scheduled-reports**: Either implement the report generation or remove the cron to avoid the silent no-op.

6. **Add idempotency to high-volume webhooks**: At minimum, WhatsApp (MessageSid), SMS Inbound (Telnyx message ID), and Email-to-Lead (messageId) should dedup before creating records.

7. **Switch in-memory rate limiters to Redis**: For email-bounce and shipping webhooks, use Redis INCR with TTL for distributed rate limiting.

### Medium-term (P2/P3 improvements)

8. **Document cron schedules in code**: Add JSDoc comments with expected frequency (`@schedule every 5 min`, `@schedule daily 2am`, etc.).

9. **Add rate limiting to Zapier webhook**: Prevent abuse via API key holders.

10. **Fix timing-safe comparison in email-bounce Bearer fallback**: Replace `authHeader !== \`Bearer ${webhookSecret}\`` with `timingSafeEqual`.

11. **Replace internal HTTP forwarding with direct function calls**: email-bounce `processInboundResendEmail` should import and call the inbound-email handler directly.

---

## 6. ARCHITECTURE NOTES

### Cron Execution Flow
```
External scheduler (Azure Timer / Vercel Cron / uptime robot)
  → POST /api/cron/{name} with Authorization: Bearer CRON_SECRET
    → timingSafeEqual auth check
    → withJobLock (Redis SETNX + in-memory fallback)
      → Job logic (Prisma queries, email sends, etc.)
      → trackCronExecution (logs to structured logger)
    → JSON response with counts/duration
```

### BullMQ (Intended vs Actual)
```
INTENDED: 33 queues → 33 processors → async job processing
ACTUAL:   33 queue NAMES defined → 1 processor registered (media-cleanup)
          32 queue names are unused constants
          All "cron work" goes through HTTP routes, not BullMQ
```

### Webhook Dedup Layers (Stripe — best example)
```
1. In-memory LRU Map (5000 entries, 10 min TTL) — zero latency
2. Redis SET with 1h TTL — distributed dedup
3. DB WebhookEvent table (findUnique by eventId) — durable dedup
   → If any layer says "already seen", return 200 immediately
```

---

*Audit performed: 2026-03-10 — READ-ONLY analysis, no files modified.*
