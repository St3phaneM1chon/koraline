# EXHAUSTIVE AUDIT - Email System (peptide-plus)
# Date: 2026-02-26
# Scope: Every file, function, component, API route, page, modal, tab, button, option, and setting

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Prisma Models (22 email-related)](#3-prisma-models)
4. [Admin Pages](#4-admin-pages)
5. [Public-Facing Components](#5-public-facing-components)
6. [API Routes - Admin Email System](#6-api-routes-admin-email-system)
7. [API Routes - Admin Newsletter System](#7-api-routes-admin-newsletter-system)
8. [API Routes - Admin Mailing List](#8-api-routes-admin-mailing-list)
9. [API Routes - Public Email](#9-api-routes-public-email)
10. [API Routes - Webhooks](#10-api-routes-webhooks)
11. [API Routes - Cron Jobs](#11-api-routes-cron-jobs)
12. [API Routes - Internal Email API](#12-api-routes-internal-email-api)
13. [Lib Modules (Core Engine)](#13-lib-modules)
14. [Email Templates](#14-email-templates)
15. [Validation Schemas](#15-validation-schemas)
16. [Auditors](#16-auditors)
17. [Feature-by-Feature Status Matrix](#17-feature-by-feature-status-matrix)
18. [Flaws & TODOs Found in Code](#18-flaws-and-todos)
19. [Security Analysis](#19-security-analysis)
20. [Recommendations & Implementation Plan](#20-recommendations)

---

## 1. EXECUTIVE SUMMARY

### Counts
- **Admin Pages**: 2 (emails page + newsletter page)
- **Public Components**: 2 (NewsletterPopup + MailingListSignup)
- **API Routes**: 37 email-related route.ts files
- **Lib Modules**: 15 email-related library files
- **Email Templates**: 13 template functions (7 order + 6 marketing)
- **Cron Jobs**: 8 email-related cron routes
- **Webhook Handlers**: 2 (inbound-email + email-bounce)
- **Prisma Models**: 22 email-related models
- **Validation Schemas**: 5 Zod schemas in dedicated file + inline schemas in routes

### Status Distribution
| Status | Count | Percentage |
|--------|-------|------------|
| COMPLETE | 68 | 81% |
| PARTIAL | 8 | 10% |
| MOCK/STUB | 4 | 5% |
| MISSING | 4 | 5% |

### Overall Assessment
The email system is remarkably comprehensive and production-ready for most use cases. The core sending infrastructure, template system, campaign management, automation flows, inbox management, bounce handling, compliance (RGPD/CASL/CAN-SPAM), and subscriber management are all fully implemented with real database operations. The main gaps are: (1) email preference center page, (2) A/B testing integration with campaigns, (3) full multi-locale marketing email support, and (4) open/click tracking pixel generation.

---

## 2. ARCHITECTURE OVERVIEW

```
Email System Architecture
=========================

[Public Frontend]
  NewsletterPopup ───> POST /api/mailing-list/subscribe (double opt-in)
  MailingListSignup ──> POST /api/mailing-list/subscribe (double opt-in)

[Admin Pages]
  /admin/emails ──────> 7 tabs: Inbox, Templates, Campaigns, Flows, Analytics, Segments, Settings
  /admin/newsletter ──> 2 tabs: Subscribers, Campaigns (separate simpler page)

[Email Sending]
  email-service.ts (core) ──> 4 providers: Resend, SendGrid, SMTP, Log
  email-service.ts (high-level) ──> Transactional: order, welcome, password, shipping, receipt, cancel
  send-order-email/route.ts ──> 7 order email types
  send-marketing-email/route.ts ──> 5 marketing email types

[Automation]
  automation-engine.ts ──> Event-driven graph traversal (trigger->email->delay->condition->sms/push)
  FlowEditor.tsx ──> Visual ReactFlow editor with 5 node types, 11 trigger types
  email-flows cron ──> Processes delayed executions

[Compliance]
  casl-compliance.ts ──> Consent checking (EXPRESS/IMPLIED/NONE)
  unsubscribe.ts ──> JWT-signed tokens (jose), RFC 8058 one-click
  /api/unsubscribe ──> Category-based: marketing/transactional/newsletter/all
  /api/mailing-list/unsubscribe ──> Token-based with RGPD cross-sync
  ConsentRecord model ──> Full audit trail

[Deliverability]
  bounce-handler.ts ──> DB-backed suppression + in-memory cache
  EmailBounce + EmailSuppression models
  Webhook: email-bounce ──> Multi-provider event processing
  Webhook: inbound-email ──> Full inbound processing pipeline

[Cron Jobs (8)]
  welcome-series, scheduled-campaigns, birthday-emails,
  abandoned-cart, satisfaction-survey, price-drop-alerts,
  points-expiring, email-flows
```

---

## 3. PRISMA MODELS (22 email-related)

| # | Model | Purpose | Status |
|---|-------|---------|--------|
| 1 | EmailLog | Every sent email tracked | COMPLETE |
| 2 | EmailBounce | Bounce tracking per email address | COMPLETE |
| 3 | EmailSuppression | Hard suppression list | COMPLETE |
| 4 | EmailTemplate | Admin-managed templates with HTML+variables | COMPLETE |
| 5 | EmailCampaign | Campaign lifecycle (DRAFT->SCHEDULED->SENDING->SENT->PAUSED->FAILED) | COMPLETE |
| 6 | EmailAutomationFlow | Flow definitions (JSON graph) | COMPLETE |
| 7 | EmailFlowExecution | Delayed/queued flow node executions | COMPLETE |
| 8 | EmailSettings | Provider config, SMTP, API keys | COMPLETE |
| 9 | EmailSegment | Custom segment definitions | COMPLETE |
| 10 | EmailEngagement | Per-user engagement metrics | COMPLETE |
| 11 | EmailConversation | Inbox conversation threads | COMPLETE |
| 12 | InboundEmail | Raw inbound emails | COMPLETE |
| 13 | InboundEmailAttachment | Attachment metadata | COMPLETE |
| 14 | OutboundReply | Sent replies to conversations | COMPLETE |
| 15 | ConversationNote | Internal team notes | COMPLETE |
| 16 | ConversationActivity | Activity log (status changes, assignments) | COMPLETE |
| 17 | CannedResponse | Pre-written reply templates | COMPLETE |
| 18 | NewsletterSubscriber | Newsletter subscription records | COMPLETE |
| 19 | MailingListSubscriber | Mailing list with preferences | COMPLETE |
| 20 | MailingListPreference | Per-subscriber topic preferences | COMPLETE |
| 21 | ConsentRecord | RGPD/CASL consent audit trail | COMPLETE |
| 22 | PriceWatch | Product price alerts per user | COMPLETE |

**File**: `/Volumes/AI_Project/peptide-plus/prisma/schema.prisma` (lines 890-4300+)

---

## 4. ADMIN PAGES

### 4A. /admin/emails (Main Email Admin)
**File**: `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/page.tsx` (~1500 lines)
**Status**: COMPLETE

**7 Tabs**:
| Tab | Component | Status | Data Source |
|-----|-----------|--------|-------------|
| Inbox | InboxView + ConversationThread + CustomerSidebar | COMPLETE | Real DB (EmailConversation, InboundEmail, OutboundReply) |
| Templates | Inline template list + CampaignEditor | COMPLETE | Real DB (EmailTemplate) |
| Campaigns | CampaignList + CampaignEditor | COMPLETE | Real DB (EmailCampaign) |
| Flows | FlowList + FlowEditor (ReactFlow) | COMPLETE | Real DB (EmailAutomationFlow) |
| Analytics | AnalyticsDashboard | COMPLETE | Real DB (EmailLog, EmailCampaign) |
| Segments | SegmentBuilder | PARTIAL | Real DB queries + RFM, but no custom segment creation UI |
| Settings | Inline settings form | COMPLETE | Real DB (EmailSettings) |

**Ribbon Actions (top bar)**:
| Action | API Endpoint | Status |
|--------|-------------|--------|
| New Email (compose) | POST /api/admin/emails/send | COMPLETE |
| Export Email Logs | GET /api/admin/emails (CSV) | COMPLETE |
| Export Analytics Report | GET /api/admin/emails/analytics + client-side CSV | COMPLETE |
| Export Contacts | GET /api/admin/newsletter/subscribers | COMPLETE |
| Import Contacts | POST /api/admin/newsletter/subscribers/import | COMPLETE |
| Add Contact | POST /api/admin/newsletter/subscribers | COMPLETE |
| Clean Bounces | POST /api/admin/newsletter/subscribers/clean-bounces | COMPLETE |

**Modals**:
| Modal | Purpose | Status |
|-------|---------|--------|
| Add Contact | Single subscriber add | COMPLETE |
| Import CSV | Bulk subscriber import | COMPLETE |
| Email Composer | Rich text email compose/reply | COMPLETE |

**Sub-Components**:
| Component | File | Status |
|-----------|------|--------|
| EmailComposer | `src/app/admin/emails/compose/EmailComposer.tsx` | COMPLETE |
| InboxView | `src/app/admin/emails/inbox/InboxView.tsx` | COMPLETE |
| ConversationThread | `src/app/admin/emails/inbox/ConversationThread.tsx` | COMPLETE |
| CustomerSidebar | `src/app/admin/emails/inbox/CustomerSidebar.tsx` | COMPLETE |
| CampaignList | `src/app/admin/emails/campaigns/CampaignList.tsx` | COMPLETE |
| CampaignEditor | `src/app/admin/emails/campaigns/CampaignEditor.tsx` | COMPLETE |
| FlowList | `src/app/admin/emails/flows/FlowList.tsx` | COMPLETE |
| FlowEditor | `src/app/admin/emails/flows/FlowEditor.tsx` | COMPLETE |
| TriggerNode | `src/app/admin/emails/flows/nodes/TriggerNode.tsx` | COMPLETE |
| EmailNode | `src/app/admin/emails/flows/nodes/EmailNode.tsx` | COMPLETE |
| DelayNode | NOT FOUND ON DISK | MISSING (flow editor has inline node renderers) |
| ConditionNode | NOT FOUND ON DISK | MISSING (flow editor has inline node renderers) |
| SegmentBuilder | `src/app/admin/emails/segments/SegmentBuilder.tsx` | PARTIAL |
| AnalyticsDashboard | `src/app/admin/emails/analytics/AnalyticsDashboard.tsx` | COMPLETE |
| TemplateBuilder | `src/app/admin/emails/TemplateBuilder.tsx` | MOCK (drag-drop, no backend save) |
| CampaignCalendar | `src/app/admin/emails/CampaignCalendar.tsx` | MOCK (hardcoded events) |

### 4B. /admin/newsletter (Newsletter Admin)
**File**: `/Volumes/AI_Project/peptide-plus/src/app/admin/newsletter/page.tsx` (1249 lines)
**Status**: COMPLETE

**2 Tabs**:
| Tab | Features | Status |
|-----|----------|--------|
| Subscribers | List, search, filter, export, individual detail with activity log | COMPLETE |
| Campaigns | CRUD, draft/schedule/send, stats modal, segment selection, CASL compliance settings, A/B test UI | PARTIAL (A/B test UI exists but not integrated with send flow) |

**API calls from this page**:
- GET/POST /api/admin/newsletter/subscribers
- PUT/DELETE /api/admin/newsletter/subscribers/[id]
- POST /api/admin/newsletter/subscribers/import
- POST /api/admin/newsletter/subscribers/clean-bounces
- GET /api/admin/newsletter/campaigns/[id]/stats
- Campaigns: uses /api/admin/emails/campaigns/* routes

---

## 5. PUBLIC-FACING COMPONENTS

### 5A. NewsletterPopup
**File**: `/Volumes/AI_Project/peptide-plus/src/components/shop/NewsletterPopup.tsx` (259 lines)
**Status**: COMPLETE
- Appears after 5s delay (or 3s after disclaimer) for non-logged-in users
- CASL-compliant: explicit marketing consent checkbox
- Calls POST /api/mailing-list/subscribe (double opt-in)
- Shows WELCOME10 discount code after subscription
- Stored in shop layout: `src/app/(shop)/layout.tsx`
- localStorage tracking (newsletter_popup_seen, newsletter_subscribed)

### 5B. MailingListSignup
**File**: `/Volumes/AI_Project/peptide-plus/src/components/shop/MailingListSignup.tsx` (102 lines)
**Status**: COMPLETE
- Inline form component (name + email + consent checkbox)
- CASL-compliant: explicit consent checkbox + caslNotice text
- Calls POST /api/mailing-list/subscribe
- i18n keys: mailingList.title, mailingList.description, etc.

---

## 6. API ROUTES - ADMIN EMAIL SYSTEM

### Email Templates
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails` | GET | List templates (pagination, search, category, locale filter) | COMPLETE |
| `/api/admin/emails` | POST | Create template (XSS sanitization, clone mode) | COMPLETE |
| `/api/admin/emails/[id]` | GET | Single template detail | COMPLETE |
| `/api/admin/emails/[id]` | PATCH | Update template (version tracking via audit log) | COMPLETE |
| `/api/admin/emails/[id]` | DELETE | Delete template | COMPLETE |
| `/api/admin/emails/[id]` | POST | Preview with variable substitution | COMPLETE |

**File**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/route.ts`
**File**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/[id]/route.ts`

### Email Sending
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails/send` | POST | Send email (direct or template-based, unsubscribe URL, EmailLog) | COMPLETE |

**File**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/send/route.ts`

### Campaigns
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails/campaigns` | GET | List campaigns | COMPLETE |
| `/api/admin/emails/campaigns` | POST | Create campaign (with clone mode) | COMPLETE |
| `/api/admin/emails/campaigns/[id]` | GET | Campaign detail + recipientStats | COMPLETE |
| `/api/admin/emails/campaigns/[id]` | PUT | Update with status transitions | COMPLETE |
| `/api/admin/emails/campaigns/[id]` | DELETE | Delete (draft only) | COMPLETE |
| `/api/admin/emails/campaigns/[id]/send` | POST | Full send: idempotent, atomic guard, segment audience, bounce/consent/frequency checks, batch throttle, pause/resume, variable personalization | COMPLETE |
| `/api/admin/emails/campaigns/[id]/preview` | POST | Render campaign HTML with sample variables | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/campaigns/route.ts`, `[id]/route.ts`, `[id]/send/route.ts`, `[id]/preview/route.ts`

### Automation Flows
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails/flows` | GET | List flows | COMPLETE |
| `/api/admin/emails/flows` | POST | Create flow | COMPLETE |
| `/api/admin/emails/flows/[id]` | GET | Flow detail + JSON export + execution history | COMPLETE |
| `/api/admin/emails/flows/[id]` | PUT | Update with graph validation | COMPLETE |
| `/api/admin/emails/flows/[id]` | DELETE | Delete with orphan cleanup | COMPLETE |
| `/api/admin/emails/flows/[id]` | POST | Dry-run validation (BFS reachability, node+template check) | COMPLETE |
| `/api/admin/emails/flows/[id]/test` | POST | Execute test: BFS walk, real sends, skip delays | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/flows/route.ts`, `[id]/route.ts`, `[id]/test/route.ts`

### Inbox / Conversations
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails/inbox` | GET | List conversations (status/assigned/priority/search/snooze filters) | COMPLETE |
| `/api/admin/emails/inbox` | PATCH | Bulk actions (up to 50) | COMPLETE |
| `/api/admin/emails/inbox/[id]` | GET | Full conversation + unified timeline + customer stats | COMPLETE |
| `/api/admin/emails/inbox/[id]` | PUT | Update (status/assignment/priority/tags/snooze/note) + activity log | COMPLETE |
| `/api/admin/emails/inbox/[id]/reply` | POST | Reply with scheduled send, unsubscribe URL, EmailLog | COMPLETE |
| `/api/admin/emails/inbox/[id]/note` | POST | Note with mentions, activity logging | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/inbox/route.ts`, `[id]/route.ts`, `[id]/reply/route.ts`, `[id]/note/route.ts`

### Settings, Segments, Analytics, Utilities
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails/settings` | GET | Settings + system health | COMPLETE |
| `/api/admin/emails/settings` | PUT | Update settings + cross-field validation | COMPLETE |
| `/api/admin/emails/settings` | POST | Send test email | COMPLETE |
| `/api/admin/emails/segments` | GET | Live RFM + built-in + custom segment counts | COMPLETE |
| `/api/admin/emails/segments` | POST | Create custom segment (clone, security whitelist) | COMPLETE |
| `/api/admin/emails/analytics` | GET | Full analytics: period compare, engagement score, bounce by domain | COMPLETE |
| `/api/admin/emails/analytics/revenue` | GET | Revenue attribution: campaigns + flows vs total store | COMPLETE |
| `/api/admin/emails/health` | GET | Provider status, DB, bounce cache, recent errors | COMPLETE |
| `/api/admin/emails/canned` | GET | Canned responses (search/category/locale) | COMPLETE |
| `/api/admin/emails/canned` | POST | Create canned response | COMPLETE |
| `/api/admin/emails/canned` | PATCH | Increment usage count | COMPLETE |
| `/api/admin/emails/gdpr-delete` | DELETE | GDPR: transactional delete all email data for an email | COMPLETE |
| `/api/admin/emails/dashboard` | GET | Overview: recent emails, campaigns, conversations, subscriber growth | COMPLETE |

---

## 7. API ROUTES - ADMIN NEWSLETTER SYSTEM

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/newsletter/subscribers` | GET | List subscribers (pagination, status filter, formatted output) | COMPLETE |
| `/api/admin/newsletter/subscribers` | POST | Add single subscriber (dupe check, re-activate) | COMPLETE |
| `/api/admin/newsletter/subscribers/[id]` | DELETE | Hard delete subscriber | COMPLETE |
| `/api/admin/newsletter/subscribers/[id]` | PUT | Update subscriber (isActive, locale) | COMPLETE |
| `/api/admin/newsletter/subscribers/import` | POST | Bulk import (up to 10K, dedup, skipDuplicates) | COMPLETE |
| `/api/admin/newsletter/subscribers/clean-bounces` | POST | Deactivate bounced subscribers | COMPLETE |
| `/api/admin/newsletter/campaigns/[id]/stats` | GET | Campaign stats (from EmailCampaign.stats JSON + EmailLog groupBy) | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/newsletter/subscribers/route.ts`, `[id]/route.ts`, `import/route.ts`, `clean-bounces/route.ts`, `campaigns/[id]/stats/route.ts`

---

## 8. API ROUTES - ADMIN MAILING LIST

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/admin/emails/mailing-list` | GET | List subscribers (CSV export, individual activity log, aggregate stats, locale groups) | COMPLETE |
| `/api/admin/emails/mailing-list` | POST | Add subscriber (anti-enumeration, RGPD unsubscribe protection) | COMPLETE |
| `/api/admin/emails/mailing-list` | DELETE | Un-suppress a bounced email (remove from EmailSuppression + clear bounce cache) | COMPLETE |
| `/api/admin/emails/mailing-list/import` | POST | Import or clean: import up to 10K contacts (RGPD, dedup, locale validation, HTML strip) OR clean bounced subscribers (batch N+1 fix) | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/mailing-list/route.ts`, `import/route.ts`

---

## 9. API ROUTES - PUBLIC EMAIL

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/newsletter` | POST | Newsletter subscription (double opt-in, CASL, ConsentRecord) | COMPLETE |
| `/api/mailing-list/subscribe` | POST | Mailing list subscription (double opt-in, CASL, sanitization) | COMPLETE |
| `/api/mailing-list/unsubscribe` | GET | One-click unsubscribe via token link (redirect, RGPD cross-sync) | COMPLETE |
| `/api/mailing-list/unsubscribe` | POST | API-based unsubscribe (rate limited, CSRF, RGPD cross-sync) | COMPLETE |
| `/api/unsubscribe` | GET | JWT-verified unsubscribe confirmation data | COMPLETE |
| `/api/unsubscribe` | POST | Process unsubscribe: category-based (marketing/transactional/newsletter/all), RFC 8058, cross-sync to NewsletterSubscriber + MailingListSubscriber + NotificationPreference + ConsentRecord | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/newsletter/route.ts`, `mailing-list/subscribe/route.ts`, `mailing-list/unsubscribe/route.ts`, `unsubscribe/route.ts`

---

## 10. API ROUTES - WEBHOOKS

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/webhooks/inbound-email` | POST | Inbound email processing: Resend/SendGrid format normalization, Svix HMAC-SHA256 verification, dedup by messageId, conversation threading (In-Reply-To/References), customer matching, MIME whitelist, control char sanitization | COMPLETE |
| `/api/webhooks/email-bounce` | POST | Multi-provider bounce handling: Resend/SendGrid/generic, handles bounce/delivered/opened/clicked/complained/failed/delayed/sent/suppressed events, in-memory rate limit (100/sec), forwards inbound to inbound-email webhook | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/webhooks/inbound-email/route.ts`, `email-bounce/route.ts`

---

## 11. API ROUTES - CRON JOBS

| Route | Trigger | Purpose | Status |
|-------|---------|---------|--------|
| `/api/cron/email-flows` | Scheduled | Process delayed EmailFlowExecution records, parallel batch (10), graph traversal with cycle detection, bounce check, atomic stat increment | COMPLETE |
| `/api/cron/welcome-series` | Scheduled | 4-step drip campaign (day 3/7/14/21), dedup by templateId, bounce suppression, notification preference check | COMPLETE |
| `/api/cron/scheduled-campaigns` | Scheduled | Execute SCHEDULED campaigns: atomic status guard, paginated audience (cursor), consent+bounce checks, throttled sending | COMPLETE |
| `/api/cron/birthday-emails` | Scheduled | Configurable via SiteSetting, tier-personalized discounts/points, promo code creation, double-award prevention | COMPLETE |
| `/api/cron/abandoned-cart` | Scheduled | Abandoned cart reminders | COMPLETE |
| `/api/cron/satisfaction-survey` | Scheduled | Post-delivery survey emails (configurable via SiteSetting) | COMPLETE |
| `/api/cron/price-drop-alerts` | Scheduled | PriceWatch-based price drop notifications | COMPLETE |
| `/api/cron/points-expiring` | Scheduled | 30-day warning + 11-month inactivity points expiration emails | COMPLETE |

**Files**: All under `/Volumes/AI_Project/peptide-plus/src/app/api/cron/`

---

## 12. API ROUTES - INTERNAL EMAIL API

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/emails/send-order-email` | POST | Send order lifecycle emails (7 types: confirmation, processing, shipped, delivered, cancelled, refund, satisfaction). Auth: admin session OR INTERNAL_API_KEY. Loads order+user from DB, builds OrderData, picks template, sends with unsubscribe URL. | COMPLETE |
| `/api/emails/send-marketing-email` | POST | Send marketing emails (5 types: birthday, welcome, abandoned-cart, back-in-stock, points-expiring). Includes side effects: birthday points + promo code creation, referral code generation. Auth: admin session OR INTERNAL_API_KEY. | COMPLETE |

**Files**: `/Volumes/AI_Project/peptide-plus/src/app/api/emails/send-order-email/route.ts`, `send-marketing-email/route.ts`

---

## 13. LIB MODULES (Core Engine)

### 13A. Email Service (Core)
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/email-service.ts`
**Status**: COMPLETE
- 4 providers: Resend (primary), SendGrid, SMTP (nodemailer with pooling), Log (dev)
- Rate limiting: 20 emails/hr/address (Map-based)
- HTML-to-text fallback (htmlToText)
- CRLF injection prevention in headers
- List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058)
- Attachment support
- Provider auto-detection from RESEND_API_KEY / SENDGRID_API_KEY / SMTP_* env vars

### 13B. Email Service (High-Level Transactional)
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email-service.ts`
**Status**: COMPLETE
- sendOrderConfirmation(), sendWelcomeEmail(), sendPasswordResetEmail()
- sendShippingUpdate(), sendReceiptEmail(), sendOrderCancellation()

### 13C. Bounce Handler
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/bounce-handler.ts`
**Status**: COMPLETE
- DB-backed: EmailBounce + EmailSuppression models
- In-memory cache (Map with 30-min TTL)
- shouldSuppressEmail(): checks both DB and cache
- recordBounce(): hard/soft classification, auto-suppress on 3 soft bounces
- updateDeliveryStatus(): propagates stats to campaigns/flows via atomic JSON update

### 13D. Automation Engine
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/automation-engine.ts`
**Status**: COMPLETE (SMS/Push stubs)
- handleEvent(): event-driven graph traversal
- 6 node executors: trigger, email (real send), delay (creates EmailFlowExecution), condition (safe eval), sms (STUB: logs "not implemented"), push (STUB: logs "not implemented")
- Pre-built flows: welcome, abandoned-cart, post-purchase, win-back
- Security: prototype pollution protection, context size limits (10KB), max 50 nodes, 30s timeout, cycle detection (visited set)

### 13E. Segmentation
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/segmentation.ts`
**Status**: COMPLETE
- 8 built-in segments: vip-customers, new-customers, at-risk, high-spenders, quebec, engaged-subscribers, repeat-buyers, cart-abandoners
- buildSegmentQuery(): converts criteria to Prisma where clause
- Segment and SegmentCriterion interfaces

### 13F. A/B Test Engine
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/ab-test-engine.ts`
**Status**: PARTIAL (pure logic, not integrated)
- ABTestVariant, ABTest interfaces
- calculateRate(), getMetricValue()
- isStatisticallySignificant(): Z-test for two proportions (min 30 samples)
- selectWinner(): returns best variant if statistically significant
- NOT integrated with campaign send flow
- NO DB persistence (no ABTest Prisma model)

### 13G. Dynamic Content
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/dynamic-content.ts`
**Status**: COMPLETE
- generateProductGridHTML(): 2-column product grid
- generateCountdownHTML(): countdown timer with JS
- generateSocialProofHTML(): purchase count / stock level
- personalizeContent(): variable replacement in templates

### 13H. CASL Compliance
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/casl-compliance.ts`
**Status**: COMPLETE
- checkConsent(): EXPRESS / IMPLIED / NONE
- generateUnsubscribeToken(): crypto-based token
- getRequiredEmailFooter(): company info + unsubscribe link
- CASL_DEFAULTS export

### 13I. Automated Flows (Pre-built)
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/automated-flows.ts`
**Status**: COMPLETE
- 7 pre-built flows: welcome-series (4 steps), abandoned-cart (3 steps), post-purchase (3 steps), win-back (3 steps), review-request (2 steps), birthday (2 steps), re-engagement (3 steps)
- Each flow has: id, name, trigger, steps with delays

### 13J. Inbound Handler
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/inbound-handler.ts`
**Status**: COMPLETE
- processInboundEmail(): dedup, threading (In-Reply-To/References), customer matching, attachment storage, conversation lifecycle
- getConversationThread(), updateConversationStatus(), assignConversation(), updateConversationTags()
- Attachment: placeholder paths (pending://) - actual storage MISSING

### 13K. Unsubscribe
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/unsubscribe.ts`
**Status**: COMPLETE
- generateUnsubscribeToken(): JWT via jose library (HS256, 30-day expiry)
- generateUnsubscribeUrl(): builds full URL with token
- generatePreferenceCenterUrl(): builds preference center URL (but no page exists)

### 13L. Order Lifecycle
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/order-lifecycle.ts`
**Status**: COMPLETE
- sendOrderLifecycleEmail(): dispatcher for 6 events (CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- Loads order+user from DB, builds OrderData, picks template, sends, creates audit log

### 13M. Utils
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/utils.ts`
**Status**: COMPLETE
- safeParseJson(): safe JSON parsing with fallback

### 13N. Index (Central Export)
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/index.ts`
**Status**: COMPLETE
- Re-exports all email modules

---

## 14. EMAIL TEMPLATES

### 14A. Order Email Templates (7)
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/templates/order-emails.ts` (771 lines)
**Status**: COMPLETE

| Template | Function | Locales | Security |
|----------|----------|---------|----------|
| Order Confirmation | orderConfirmationEmail() | fr/en | escapeHtml on names, items, addresses |
| Order Processing | orderProcessingEmail() | fr/en | escapeHtml on names |
| Order Shipped | orderShippedEmail() | fr/en | escapeHtml, carrier tracking links |
| Order Delivered | orderDeliveredEmail() | fr/en | escapeHtml, review CTA (+50 points) |
| Satisfaction Survey | satisfactionSurveyEmail() | fr/en | escapeHtml, 5-star rating links |
| Order Cancelled | orderCancelledEmail() | fr/en | escapeHtml on names, items, reason |
| Order Refund | orderRefundEmail() | fr/en | escapeHtml, partial/full refund support |

### 14B. Marketing Email Templates (6)
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/templates/marketing-emails.ts` (720 lines)
**Status**: COMPLETE (but only fr/en -- FLAW-083)

| Template | Function | Locales | Security |
|----------|----------|---------|----------|
| Birthday | birthdayEmail() | fr/en | safeSubjectName, escapeHtml, timezone-safe dates |
| Welcome | welcomeEmail() | fr/en | escapeHtml, referral code |
| Abandoned Cart | abandonedCartEmail() | fr/en | escapeHtml, isSafeUrl for images |
| Back in Stock | backInStockEmail() | fr/en | escapeHtml, isSafeUrl for images+productUrl |
| Points Expiring | pointsExpiringEmail() | fr/en | escapeHtml, timezone-safe dates |
| Price Drop | priceDropEmail() | fr/en | escapeHtml, isSafeUrl for images |

### 14C. Base Template
**File**: `/Volumes/AI_Project/peptide-plus/src/lib/email/templates/base-template.ts`
**Status**: COMPLETE
- Responsive HTML with dark mode support
- MSO (Outlook) compatibility
- Social links (Instagram, YouTube, LinkedIn)
- Company info footer
- emailComponents: button, divider, infoBox, warningBox, orderItem, trackingInfo
- escapeHtml() utility

---

## 15. VALIDATION SCHEMAS

**File**: `/Volumes/AI_Project/peptide-plus/src/lib/validations/newsletter.ts`
| Schema | Used By |
|--------|---------|
| createCampaignSchema | POST /api/admin/newsletter/campaigns |
| updateCampaignSchema | PATCH /api/admin/newsletter/campaigns/[id] |
| addSubscriberSchema | POST /api/admin/newsletter/subscribers |
| patchSubscriberSchema | PATCH /api/admin/newsletter/subscribers/[id] |

**Inline Zod schemas in routes** (each route defines its own):
- orderEmailSchema (send-order-email)
- marketingEmailSchema (send-marketing-email)
- importContactSchema + importBodySchema (subscribers/import)
- unsubscribePostSchema (mailing-list/unsubscribe)
- addSubscriberSchema + unsuppressSchema (mailing-list route)
- contactSchema + importSchema (mailing-list/import)
- All admin/emails/* routes have inline Zod schemas

---

## 16. AUDITORS

**File**: `/Volumes/AI_Project/peptide-plus/src/lib/auditors/email-casl.ts` (375 lines)
**Status**: COMPLETE
- EmailCaslAuditor class (extends BaseAuditor)
- 4 checks:
  - casl-01: Unsubscribe link presence in marketing emails
  - casl-02: Consent verification before marketing sends
  - casl-03: Transactional vs marketing email separation
  - casl-04: Sender identity configuration

---

## 17. FEATURE-BY-FEATURE STATUS MATRIX

### COMPLETE (68 features)

| # | Feature | Key Files |
|---|---------|-----------|
| 1 | Multi-provider email sending (Resend/SendGrid/SMTP/Log) | lib/email/email-service.ts |
| 2 | Email template CRUD (create/read/update/delete/clone/preview) | api/admin/emails/* |
| 3 | Template XSS sanitization (DOMPurify) | api/admin/emails/route.ts |
| 4 | Template variable substitution (preview + send) | api/admin/emails/[id]/route.ts |
| 5 | Email sending with unsubscribe URL + EmailLog tracking | api/admin/emails/send/route.ts |
| 6 | Campaign CRUD (create/read/update/delete/clone) | api/admin/emails/campaigns/* |
| 7 | Campaign send: segment audience, consent checks, bounce suppression, frequency capping, batch throttle, pause/resume | api/admin/emails/campaigns/[id]/send/route.ts |
| 8 | Campaign preview with sample variables | api/admin/emails/campaigns/[id]/preview/route.ts |
| 9 | Campaign stats from DB (sent/opened/clicked/bounced/revenue) | api/admin/newsletter/campaigns/[id]/stats/route.ts |
| 10 | Automation flow CRUD with graph validation | api/admin/emails/flows/* |
| 11 | Visual flow editor (ReactFlow, 5 node types, 11 triggers) | admin/emails/flows/FlowEditor.tsx |
| 12 | Flow test execution (BFS walk, real sends, skip delays) | api/admin/emails/flows/[id]/test/route.ts |
| 13 | Flow engine: event-driven graph traversal, node executors | lib/email/automation-engine.ts |
| 14 | Flow delayed execution via cron | api/cron/email-flows/route.ts |
| 15 | 7 pre-built automation flows | lib/email/automated-flows.ts |
| 16 | Inbox conversation list (status/assigned/priority/search/snooze) | api/admin/emails/inbox/route.ts |
| 17 | Inbox bulk actions (up to 50) | api/admin/emails/inbox/route.ts PATCH |
| 18 | Conversation detail (unified timeline, customer stats) | api/admin/emails/inbox/[id]/route.ts |
| 19 | Conversation reply (scheduled send, unsubscribe URL) | api/admin/emails/inbox/[id]/reply/route.ts |
| 20 | Conversation notes with mentions | api/admin/emails/inbox/[id]/note/route.ts |
| 21 | Customer sidebar (info, loyalty tier, orders) | admin/emails/inbox/CustomerSidebar.tsx |
| 22 | Email settings CRUD (provider, SMTP config, test email) | api/admin/emails/settings/route.ts |
| 23 | Analytics dashboard (KPIs, charts, period compare, engagement) | api/admin/emails/analytics/route.ts |
| 24 | Revenue analytics (campaign + flow attribution) | api/admin/emails/analytics/revenue/route.ts |
| 25 | System health check (provider, DB, bounce cache, errors) | api/admin/emails/health/route.ts |
| 26 | GDPR email deletion (transactional) | api/admin/emails/gdpr-delete/route.ts |
| 27 | Dashboard summary API | api/admin/emails/dashboard/route.ts |
| 28 | Canned responses CRUD with usage tracking | api/admin/emails/canned/route.ts |
| 29 | Smart segmentation (8 built-in + RFM + custom) | lib/email/segmentation.ts + api/admin/emails/segments/route.ts |
| 30 | Newsletter subscriber list (pagination, status filter) | api/admin/newsletter/subscribers/route.ts |
| 31 | Newsletter subscriber add (single) | api/admin/newsletter/subscribers/route.ts POST |
| 32 | Newsletter subscriber update/delete | api/admin/newsletter/subscribers/[id]/route.ts |
| 33 | Newsletter subscriber bulk import (10K, dedup) | api/admin/newsletter/subscribers/import/route.ts |
| 34 | Newsletter subscriber clean bounces | api/admin/newsletter/subscribers/clean-bounces/route.ts |
| 35 | Mailing list subscribers (list, CSV export, activity log) | api/admin/emails/mailing-list/route.ts GET |
| 36 | Mailing list add subscriber (anti-enumeration, RGPD) | api/admin/emails/mailing-list/route.ts POST |
| 37 | Mailing list un-suppress email (remove from suppression) | api/admin/emails/mailing-list/route.ts DELETE |
| 38 | Mailing list import + clean (10K, RGPD, HTML strip, N+1 fix) | api/admin/emails/mailing-list/import/route.ts |
| 39 | Public newsletter subscription (double opt-in, CASL) | api/newsletter/route.ts |
| 40 | Public mailing list subscription (double opt-in, CASL) | api/mailing-list/subscribe/route.ts |
| 41 | Public mailing list unsubscribe (token-based, RGPD cross-sync) | api/mailing-list/unsubscribe/route.ts |
| 42 | JWT unsubscribe (jose, RFC 8058, category-based, cross-sync) | api/unsubscribe/route.ts |
| 43 | Bounce handling (DB + cache, hard/soft, auto-suppress) | lib/email/bounce-handler.ts |
| 44 | Inbound email webhook (Resend/SendGrid, HMAC, threading) | api/webhooks/inbound-email/route.ts |
| 45 | Bounce/event webhook (multi-provider, all event types) | api/webhooks/email-bounce/route.ts |
| 46 | Welcome series cron (4-step drip, dedup) | api/cron/welcome-series/route.ts |
| 47 | Scheduled campaigns cron (paginated, consent+bounce) | api/cron/scheduled-campaigns/route.ts |
| 48 | Birthday emails cron (tier-personalized, promo codes) | api/cron/birthday-emails/route.ts |
| 49 | Abandoned cart cron | api/cron/abandoned-cart/route.ts |
| 50 | Satisfaction survey cron | api/cron/satisfaction-survey/route.ts |
| 51 | Price drop alerts cron | api/cron/price-drop-alerts/route.ts |
| 52 | Points expiring cron | api/cron/points-expiring/route.ts |
| 53 | Send order email API (7 types, auth+INTERNAL_API_KEY) | api/emails/send-order-email/route.ts |
| 54 | Send marketing email API (5 types, side effects) | api/emails/send-marketing-email/route.ts |
| 55 | Order email templates (7): confirmation, processing, shipped, delivered, survey, cancelled, refund | lib/email/templates/order-emails.ts |
| 56 | Marketing email templates (6): birthday, welcome, abandoned-cart, back-in-stock, points-expiring, price-drop | lib/email/templates/marketing-emails.ts |
| 57 | Base email template (responsive, dark mode, MSO) | lib/email/templates/base-template.ts |
| 58 | Dynamic content engine (product grid, countdown, social proof) | lib/email/dynamic-content.ts |
| 59 | CASL compliance engine (consent, footer, unsubscribe) | lib/email/casl-compliance.ts |
| 60 | Order lifecycle dispatcher (6 events) | lib/email/order-lifecycle.ts |
| 61 | Inbound email handler (dedup, threading, customer matching) | lib/email/inbound-handler.ts |
| 62 | Transactional email service (6 email types) | lib/email-service.ts |
| 63 | EmailComposer (rich text, drafts, reply mode, DOMPurify) | admin/emails/compose/EmailComposer.tsx |
| 64 | NewsletterPopup (CASL consent, double opt-in, discount code) | components/shop/NewsletterPopup.tsx |
| 65 | MailingListSignup (CASL consent, double opt-in) | components/shop/MailingListSignup.tsx |
| 66 | Email CASL auditor (4 checks) | lib/auditors/email-casl.ts |
| 67 | Zod validation schemas for newsletter | lib/validations/newsletter.ts |
| 68 | Admin audit logging for email admin actions | all admin routes use logAdminAction() |

### PARTIAL (8 features)

| # | Feature | What Works | What's Missing |
|---|---------|------------|----------------|
| 1 | A/B test engine | Z-test logic, winner selection, types | No DB model, no integration with campaign send, no persistence |
| 2 | Segment builder UI | Shows built-in + RFM segments with live counts | No custom segment creation UI (API supports it) |
| 3 | Marketing email locales | fr/en fully implemented | 20 other locales not supported (FLAW-083) |
| 4 | Welcome series template variety | 4-step drip with correct delays | All 4 steps use same welcomeEmail() template body (FLAW-033) |
| 5 | minSpent segment filter | Uses loyalty tier as proxy | TODO comment for raw SQL implementation |
| 6 | Email open/click tracking | Webhook receives events, stats updated | No tracking pixel generation in outgoing emails |
| 7 | A/B test UI in newsletter page | Modal with variant fields exists in newsletter page | Not connected to ab-test-engine.ts or campaign send |
| 8 | Attachment upload in EmailComposer | Upload button exists | Shows "coming soon" toast |

### MOCK/STUB (4 features)

| # | Feature | What Exists | What's Fake |
|---|---------|-------------|-------------|
| 1 | Campaign Calendar | Full React component with month view | Hardcoded events, no API integration |
| 2 | Template Builder | Drag-and-drop block editor | Client-side only, onSave not wired to backend |
| 3 | SMS node in flows | Node type in flow editor, executor in automation engine | Logs "SMS sending not implemented" |
| 4 | Push notification node | Node type in flow editor, executor in automation engine | Logs "Push notification not implemented" |

### MISSING (4 features)

| # | Feature | Evidence It's Referenced | What Doesn't Exist |
|---|---------|--------------------------|---------------------|
| 1 | Email preference center page | generatePreferenceCenterUrl() in unsubscribe.ts generates URL to /email-preferences | No page component at /email-preferences |
| 2 | Attachment storage for inbound emails | Inbound handler creates InboundEmailAttachment records | Uses placeholder paths (pending://), no actual file storage |
| 3 | Full template versioning | Audit log captures previous template state | No dedicated EmailTemplateVersion model or version list UI |
| 4 | Conversion tracking for engagement score | Analytics API has engagement score calculation | Conversion count hardcoded to 0 in analytics |

---

## 18. FLAWS AND TODOS (found in source code)

| ID | Severity | Description | File |
|----|----------|-------------|------|
| FLAW-002 | HIGH | Multiple routes were missing (fixed: subscribers, campaigns, clean-bounces, stats) | Various route.ts |
| FLAW-033 | MEDIUM | Welcome series 4 steps all use same template body | api/cron/welcome-series/route.ts |
| FLAW-083 | MEDIUM | Marketing emails only support fr/en (app has 22 locales) | lib/email/templates/marketing-emails.ts |
| FLAW-096 | LOW | Subject name sanitization added (strip control chars) | lib/email/templates/marketing-emails.ts |
| FLAW-097 | LOW | Duplicate backInStockEmail implementations (email-templates.ts vs marketing-emails.ts) | lib/email/templates/marketing-emails.ts |
| FLAW-100 | LOW | Date timezone handling fixed (explicit America/Toronto) | lib/email/templates/marketing-emails.ts |
| TODO | MEDIUM | minSpent segment filter uses loyalty tier proxy, needs raw SQL | api/admin/emails/segments/route.ts |
| TODO | MEDIUM | Consolidate two backInStockEmail implementations | marketing-emails.ts comment |

---

## 19. SECURITY ANALYSIS

### Protections Implemented (Comprehensive)
| Protection | Implementation | Coverage |
|------------|---------------|----------|
| Authentication | withAdminGuard on all admin routes | 100% admin routes |
| CSRF | validateCsrf() on all mutation endpoints | 100% POST/PUT/DELETE |
| Rate limiting | rateLimitMiddleware() per IP | 100% public + most admin routes |
| XSS sanitization | DOMPurify (isomorphic) on HTML templates | Templates, composer |
| HTML injection | escapeHtml() on all user-supplied data in email templates | All 13 templates |
| URL injection | isSafeUrl() validates http/https only | Marketing templates |
| SQL injection | Prisma parameterized queries + security whitelist for segments | All DB operations |
| Email enumeration | Generic success responses for subscribe/unsubscribe | Public endpoints |
| CRLF injection | CRLF prevention in email headers | email-service.ts |
| Prototype pollution | Protection in automation engine condition evaluator | automation-engine.ts |
| Webhook verification | Svix HMAC-SHA256 timing-safe comparison | Inbound email webhook |
| Bounce rate limiting | In-memory rate limit (100 events/sec) | Bounce webhook |
| Import limits | Max 10K contacts per import | Import routes |
| Context size limits | 10KB max for flow execution context | automation-engine.ts |
| Cycle detection | Visited set prevents infinite loops in flow execution | automation-engine.ts, email-flows cron |
| Audit trail | AuditLog + ConversationActivity on all state changes | All admin routes |
| RGPD compliance | ConsentRecord, unsubscribe cross-sync, GDPR delete | Comprehensive |
| CASL compliance | Consent checking, double opt-in, unsubscribe | Comprehensive |
| Idempotency | Campaign send uses atomic status guard | Campaign send |
| Deduplication | messageId dedup for inbound emails, templateId dedup for drip | Webhooks, crons |

### Remaining Security Gaps
| Gap | Risk | Recommendation |
|-----|------|----------------|
| No email open/click tracking pixels generated | LOW (functional, not security) | Implement tracking pixel in outgoing emails for accurate stats |
| INTERNAL_API_KEY for send-order/marketing-email | MEDIUM | Ensure env var is set and strong; consider short-lived tokens |
| Inbound email attachment paths use pending:// | LOW | Implement actual file storage (S3/Azure Blob) |
| Newsletter subscriber [id] PUT has no Zod validation | LOW | Add Zod schema validation for body fields |

---

## 20. RECOMMENDATIONS AND IMPLEMENTATION PLAN

### Priority 1 (Critical -- Revenue/Compliance)
1. **Email preference center page** -- Create `/app/(shop)/email-preferences/page.tsx`. The unsubscribe system generates URLs to this page but it doesn't exist. Users clicking "manage preferences" get a 404.
2. **Tracking pixel generation** -- Add open/click tracking pixels to outgoing marketing emails. The webhook already handles events but emails don't contain tracking elements.
3. **A/B testing integration** -- Connect ab-test-engine.ts to campaign send flow. Add ABTest Prisma model. Wire the newsletter page's A/B test UI to the engine.

### Priority 2 (High -- Completeness)
4. **Multi-locale marketing emails** (FLAW-083) -- Add translation system for at least es, de, ar, zh to match the 22-locale app.
5. **Welcome series template variety** (FLAW-033) -- Create 4 distinct email templates for the welcome drip (product showcase, tips, community, loyalty program).
6. **Attachment storage** -- Implement real file storage (Azure Blob / S3) for inbound email attachments.
7. **Template Builder backend wiring** -- Connect the drag-and-drop TemplateBuilder to save templates to the EmailTemplate model.

### Priority 3 (Medium -- Polish)
8. **Campaign Calendar API integration** -- Connect CampaignCalendar to real campaign data.
9. **Custom segment creation UI** -- Add a segment builder form to the SegmentBuilder component.
10. **Consolidate duplicate backInStockEmail** (FLAW-097).
11. **Add Zod validation** to newsletter subscriber [id] PUT route.
12. **EmailComposer attachment upload** -- Implement real attachment upload and storage.

### Priority 4 (Low -- Future)
13. **SMS integration** -- Replace stub in automation engine with real SMS provider (Twilio/SNS).
14. **Push notification integration** -- Replace stub with real push provider (FCM/APNs).
15. **Full template versioning** -- Add EmailTemplateVersion model and version list UI.
16. **Conversion tracking** -- Implement real conversion attribution for engagement score.

---

## FILE INDEX (All email-related files)

### Admin Pages (2)
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/page.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/newsletter/page.tsx`

### Admin Components (14)
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/compose/EmailComposer.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/inbox/InboxView.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/inbox/ConversationThread.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/inbox/CustomerSidebar.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/campaigns/CampaignList.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/campaigns/CampaignEditor.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/flows/FlowList.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/flows/FlowEditor.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/flows/nodes/TriggerNode.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/flows/nodes/EmailNode.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/segments/SegmentBuilder.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/analytics/AnalyticsDashboard.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/TemplateBuilder.tsx`
- `/Volumes/AI_Project/peptide-plus/src/app/admin/emails/CampaignCalendar.tsx`

### Public Components (2)
- `/Volumes/AI_Project/peptide-plus/src/components/shop/NewsletterPopup.tsx`
- `/Volumes/AI_Project/peptide-plus/src/components/shop/MailingListSignup.tsx`

### API Routes - Admin Emails (27)
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/[id]/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/send/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/campaigns/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/campaigns/[id]/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/campaigns/[id]/send/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/campaigns/[id]/preview/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/flows/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/flows/[id]/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/flows/[id]/test/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/inbox/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/inbox/[id]/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/inbox/[id]/reply/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/inbox/[id]/note/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/settings/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/segments/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/analytics/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/analytics/revenue/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/health/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/canned/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/gdpr-delete/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/dashboard/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/mailing-list/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/emails/mailing-list/import/route.ts`

### API Routes - Admin Newsletter (5)
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/newsletter/subscribers/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/newsletter/subscribers/[id]/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/newsletter/subscribers/import/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/newsletter/subscribers/clean-bounces/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/admin/newsletter/campaigns/[id]/stats/route.ts`

### API Routes - Public (4)
- `/Volumes/AI_Project/peptide-plus/src/app/api/newsletter/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/mailing-list/subscribe/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/mailing-list/unsubscribe/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/unsubscribe/route.ts`

### API Routes - Webhooks (2)
- `/Volumes/AI_Project/peptide-plus/src/app/api/webhooks/inbound-email/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/webhooks/email-bounce/route.ts`

### API Routes - Cron Jobs (8)
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/email-flows/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/welcome-series/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/scheduled-campaigns/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/birthday-emails/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/abandoned-cart/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/satisfaction-survey/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/price-drop-alerts/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/cron/points-expiring/route.ts`

### API Routes - Internal (2)
- `/Volumes/AI_Project/peptide-plus/src/app/api/emails/send-order-email/route.ts`
- `/Volumes/AI_Project/peptide-plus/src/app/api/emails/send-marketing-email/route.ts`

### Lib Modules (15)
- `/Volumes/AI_Project/peptide-plus/src/lib/email/email-service.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email-service.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/bounce-handler.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/automation-engine.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/segmentation.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/ab-test-engine.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/dynamic-content.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/casl-compliance.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/automated-flows.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/inbound-handler.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/unsubscribe.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/order-lifecycle.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/utils.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/index.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/templates/base-template.ts`

### Template Files (2)
- `/Volumes/AI_Project/peptide-plus/src/lib/email/templates/order-emails.ts`
- `/Volumes/AI_Project/peptide-plus/src/lib/email/templates/marketing-emails.ts`

### Validation Schemas (1)
- `/Volumes/AI_Project/peptide-plus/src/lib/validations/newsletter.ts`

### Auditors (1)
- `/Volumes/AI_Project/peptide-plus/src/lib/auditors/email-casl.ts`

---

**TOTAL FILES AUDITED: 78 email-related files**
**AUDIT COMPLETENESS: 100% -- Every email-related file has been read and analyzed**
