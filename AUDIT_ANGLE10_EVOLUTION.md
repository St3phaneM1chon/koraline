# AUDIT ANGLE 10: Evolution & Missing Features

**Project**: BioCycle Peptides (peptide-plus)
**Date**: 2026-03-10
**Auditor**: Claude Opus 4.6

---

## EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Total Pages | 332 |
| Admin Pages | 218 |
| API Routes | 830 |
| Prisma Models | 302 (across 12 schema files) |
| Nav Items (outlook-nav.ts) | ~130 unique hrefs |
| TODOs/FIXMEs in page.tsx files | 42 distinct items |
| Simulated/Mock data pages | 5 |
| Pages NOT in nav | 20+ |
| Overall Platform Maturity | ~68% |

**Key Finding**: The platform has extraordinary breadth -- 12 admin modules, 218 admin pages, 830 API routes -- rivaling the combined feature set of Shopify Plus + Salesforce + Zendesk. However, many advanced pages (CRM analytics, dashboards, wallboards) use simulated/mock data, monitoring is entirely fake, 20+ pages are unreachable from navigation, and critical enterprise features (territory management, AI lead scoring, email sequences) are missing.

---

## 1. STUB INVENTORY

### 1.1 Explicit TODO/FIXME/IMP Items in Admin Pages

| ID | File | Description | Category | Effort |
|---|---|---|---|---|
| **IMP-013** | `admin/media/page.tsx` | Create reusable `<MediaPicker>` modal component | Frontend component | 3d |
| **IMP-014** | `admin/media/page.tsx` | Webhook routes for TikTok, YouTube, Meta, X, LinkedIn | API routes | 5d |
| **IMP-015** | `admin/media/page.tsx` | IntegrationConfig Prisma model for encrypted platform credentials | Schema + API | 3d |
| **IMP-019** | `admin/media/images/page.tsx` | Client-side crop/resize before upload | Frontend | 3d |
| **IMP-020** | `admin/media/images/page.tsx` | Full Azure Computer Vision AI tagging integration | Backend + API | 5d |
| **IMP-021** | `admin/media/images/page.tsx` | Automatic watermarking on product images | Backend | 3d |
| **IMP-023** | `admin/media/videos/page.tsx` | Direct video file upload + server-side transcoding | Backend + Storage | 10d |
| **IMP-024** | `admin/media/videos/page.tsx` | Analytics tracking for media views/downloads/shares | Backend + API | 3d |
| **IMP-025** | `admin/media/images/page.tsx` | Blur placeholder + intersection observer for progressive loading | Frontend | 2d |
| **IMP-026** | `admin/media/library/page.tsx` | Load folders dynamically from DB instead of hardcoded list | Backend | 1d |
| **IMP-027** | `admin/media/images/page.tsx` | Auto-generate thumbnail/medium/large variants at upload | Backend | 3d |
| **IMP-028** | `admin/media/images/page.tsx` | Content moderation via Azure Content Moderator | Backend + Azure | 5d |
| **IMP-030** | `admin/media/library/page.tsx` | Advanced filters (date range, size, dimensions, uploadedBy) | Frontend | 2d |
| **IMP-031** | `admin/media/library/page.tsx` | Sort buttons in UI (API params already exist) | Frontend | 0.5d |
| **IMP-034** | `admin/media/images/page.tsx` | Full usage tracking from all entity references | Backend | 3d |
| **IMP-035** | `admin/bannieres/page.tsx` | Responsive variants for banner images (tablet, retina) | Frontend + API | 2d |
| **IMP-036** | `admin/media/videos/page.tsx` | OAuth flow for social integrations (instead of manual copy-paste) | Backend + API | 5d |
| **IMP-037** | `admin/media/videos/page.tsx` | Post scheduling functionality for social media | Backend + API | 5d |
| **IMP-039** | `admin/media/page.tsx` | Analytics dashboard showing media metrics (views, engagement, ROI) | Frontend + API | 5d |
| **F35** | Multiple `api-*` pages | Use i18n for title/description instead of hardcoded English | Frontend | 1d |
| **F36/F37** | `admin/media/library/images` | Use i18n instead of hardcoded "Upload" | Frontend | 0.5d |
| **F77** | `admin/bannieres/page.tsx` | "Preview" tab for WYSIWYG banner editing | Frontend | 3d |
| **F81** | `admin/media/library/page.tsx` | Load folders dynamically from DB | Backend | 1d |
| **F84** | `admin/media/page.tsx` | Extract QuickLink to reusable component | Refactor | 0.5d |
| **FLAW-022** | `admin/webinaires/page.tsx` | "View attendees" button has no onClick handler -- non-functional stub | Frontend + API | 2d |
| **FLAW-085** | `admin/seo/page.tsx` | Replace plain Input with MediaUploader for OG image selection | Frontend | 0.5d |
| -- | `admin/parametres/page.tsx` | PayPal integration settings (TODO in code) | Backend + API | 3d |
| -- | `admin/parametres/page.tsx` | Google Analytics integration settings (TODO in code) | Backend + API | 3d |
| -- | `admin/comptabilite/temps/page.tsx` | Uses hardcoded 'Admin' instead of session user name | Frontend bug | 0.5d |
| -- | `admin/commandes/page.tsx` | Bulk checkboxes not supported by ContentList component | Component | 3d |

**Total identified TODOs/FIXMEs**: 30 distinct items spanning ~85 dev-days of work.

### 1.2 Pages Using Simulated/Mock Data

| Page | Severity | What's Simulated | Impact |
|---|---|---|---|
| **`admin/monitoring/page.tsx`** | **P0** | ALL data -- described in header comment as "SIMULATED / HARDCODED demonstration data" that does "NOT reflect real system state." TODO to connect to Azure Application Insights/Datadog. | Admins have NO real monitoring visibility |
| **`admin/comptabilite/page.tsx`** | **P1** | Dashboard has "Fallback simulated data for demo" on line 499 | Accounting dashboard unreliable |
| **`admin/crm/clv/page.tsx`** | **P1** | "Fallback: if dedicated endpoints don't exist, use mock data" on line 77 | CLV analysis shows fake data |
| **`admin/crm/wallboard/page.tsx`** | **P2** | "Simulated distribution (bell curve around 10-14h)" for call volume chart on line 178 | Wallboard shows fabricated metrics |
| **`admin/fidelite/page.tsx`** | **P2** | "Gamification: simulated active challenges" and "Expiration summary (simulated)" | Loyalty dashboard partially fake |

### 1.3 Schema-Level TODOs

| Location | Description | Priority |
|---|---|---|
| `accounting.prisma` (line 24-31) | TODO #51: Create AuditTrail model (replaces console.info logs) | Done (model exists in system.prisma) |
| `accounting.prisma` (line 28-31) | TODO #52: Create RecurringEntryTemplate model | P2 -- not yet created |

---

## 2. NAV vs PAGES GAP ANALYSIS

### 2.1 Navigation Coverage

All ~130 unique hrefs in `outlook-nav.ts` resolve to existing `page.tsx` files. **Zero broken nav links.** The emails section uses query parameters (`?folder=inbox`, `?tab=templates`) which all route to the same page with tab switching.

### 2.2 Pages That Exist But Are NOT in the Nav (20+ hidden pages)

**Accounting module (12 hidden pages -- most critical gap)**:

| Page | Path | Should be in Nav? |
|---|---|---|
| AI Assistant | `admin/comptabilite/ai-assistant` | YES -- valuable feature hidden |
| Public API | `admin/comptabilite/api-publique` | YES |
| Purchase Orders | `admin/comptabilite/bons-commande` | YES |
| Estimates/Quotes | `admin/comptabilite/devis` | YES |
| Inventory | `admin/comptabilite/inventaire` | YES |
| Multi-Entity | `admin/comptabilite/multi-entite` | YES -- enterprise feature |
| Batch Operations | `admin/comptabilite/operations-lot` | YES |
| Payroll | `admin/comptabilite/paie` | YES -- critical HR feature |
| Client Portal | `admin/comptabilite/portail-client` | YES |
| Project Costing | `admin/comptabilite/projets-couts` | YES |
| Custom Reports | `admin/comptabilite/rapports-personnalises` | YES |
| SR&DE Tax Credits | `admin/comptabilite/rsde` | YES -- Canadian-specific |
| Time Tracking | `admin/comptabilite/temps` | YES |
| Workflows | `admin/comptabilite/workflows` | YES |

**Other modules (8+ hidden pages)**:

| Page | Path | Should be in Nav? |
|---|---|---|
| Blog Management | `admin/blog` + `admin/blog/analytics` | YES (marketing section) |
| Bundle Management | `admin/bundles` | YES (catalog section) |
| Monitoring | `admin/monitoring` | YES (system section) |
| Reports | `admin/rapports` | YES (dashboard section) |
| Security | `admin/securite` | YES (system section) |
| Webhooks | `admin/webhooks` | YES (system section) |
| Fiscal (3 pages) | `admin/fiscal/*` | YES (accounting section) |
| Payment Reconciliation | `admin/paiements/reconciliation` | YES (commerce section) |
| Analytics (2 pages) | `admin/analytics/*` | YES (dashboard section) |
| Media Analytics | `admin/media/analytics` | YES (media section) |
| Brand Kit | `admin/media/brand-kit` | YES (media section) |
| Social Scheduler | `admin/media/social-scheduler` | YES (media section) |
| Conference | `admin/telephonie/conference` | YES (telephony section) |
| CRM Pipelines (config) | `admin/crm/pipelines` | YES (CRM section) |

**Impact**: Users cannot discover ~20 fully built features including Payroll, Blog management, Multi-entity accounting, SR&DE tax credits, and Media analytics. This is **P0** -- adding nav entries is trivial (1-2 hours of work) for massive feature discovery improvement.

---

## 3. CRM PHASE 5 GAP ANALYSIS (Enterprise Features)

### 3.1 What Exists (Comprehensive)

The CRM module is the largest in the platform with **45+ pages** and **90+ API routes** across 6 functional groups:

**Core CRM** (Well-implemented, 75-90%):
- Lead Management: Full CRUD, import, scoring (0-100), temperature (Hot/Warm/Cold), BANT/MEDDIC qualification, DNC status
- Pipeline/Deals: Kanban board, multiple pipelines, stage history, deal products, deal teams, recurring revenue tracking
- Prospect Lists: Google Maps scraping, enrichment, deduplication, scoring, CRM integration
- Quotes/CPQ: Full CRUD with line items, currency, terms, PDF potential
- Contracts: 7 lifecycle statuses (DRAFT through EXPIRED), renewal management
- Unified Inbox: Multi-channel (email, chat, phone, SMS), assignment, SLA

**Call Center** (Well-implemented, 70-85%):
- Dialer: Power dialer with AMD, campaign management, disposition tracking
- Wallboard: Real-time display (but uses simulated call volume data)
- QA Scoring: Forms with weighted criteria, agent evaluation
- Coaching: Session management, scoring criteria
- Scheduling: Agent shifts, break management
- Adherence: Schedule compliance tracking

**Automation** (Partially implemented, 50-70%):
- Workflows: 8 trigger types, 11 action types, execution engine with step-by-step logging
- Playbooks: CRUD with stage guidance and checklists
- Lead Forms: Web-to-lead form builder
- Compliance: CRTC calling rules, GDPR consent records, DNC list

**Analytics** (Pages exist but many use computed/mock data, 30-60%):
- 13 analytics pages: CLV, churn, cohort, heatmaps, attribution, funnel, deal journey, recurring revenue, activity reports, snapshots, workflow analytics, dashboard builder, report builder

### 3.2 Missing vs Salesforce/HubSpot

| Feature | Salesforce | HubSpot | BioCycle Status | Priority |
|---|---|---|---|---|
| **Territory Management** | Full territories + rules | Enterprise | **NOT STARTED** -- no model, no page, no API | P1 |
| **AI Lead Scoring** | Einstein scoring | Predictive scoring | Manual score field only (0-100) | P1 |
| **Email Sequences/Cadences** | Sales Cadences | Sequences | CrmWorkflow exists but no sequence-specific UX | P1 |
| **Meeting Scheduler** | Built-in meetings | Calendar links | No booking page or calendar integration | P2 |
| **Price Books** | Full CPQ | Product Library | CrmDealProduct exists, no multi-price-book UI | P2 |
| **Custom Objects/Fields** | Full builder | Custom properties | No custom object builder; `customFields Json` exists | P2 |
| **Role Hierarchy** | Complex hierarchy | Simple | PermissionGroup exists but flat (no hierarchy) | P2 |
| **AI Forecasting** | Einstein Forecasting | Revenue tools | Basic forecast page, no ML predictions | P2 |
| **Proposal/Document Generation** | CPQ documents | Documents tool | Quote exists, no proposal template builder | P2 |
| **Partner Portal** | Partner Community | N/A | No partner/channel management | P3 |
| **Sandboxes** | Full sandbox | Beta | No data sandbox feature | P3 |
| **Advanced Report Builder** | Drag-and-drop | Custom Reports | Report builder page exists but limited | P2 |
| **Mobile CRM** | Salesforce1 app | Full mobile | No CRM mobile experience | P2 |
| **Social CRM / Listening** | Social Studio | Social inbox | Social scheduler exists, no listening/monitoring | P3 |
| **Call Intelligence (AI)** | Einstein Call Coaching | CallHub | Transcription + sentiment exist, no AI coaching tips | P2 |

---

## 4. FEATURE COMPLETENESS BY MODULE

### Scoring Methodology
Each module scored on: Pages exist & functional (20%), APIs functional (25%), Data model supports feature (20%), Cross-module integration (15%), Production readiness -- no mocks (10%), Edge cases & i18n (10%).

| # | Module | Score | Pages | APIs | Key Gaps |
|---|---|---|---|---|---|
| 1 | **Dashboard** | **75%** | 1 | 2 | Monitoring page 100% fake. Analytics pages hidden from nav. No real-time feeds. |
| 2 | **Commerce** | **82%** | 7+ | ~60 | Bulk checkboxes TODO. Payment reconciliation hidden. No abandoned cart recovery. Single gateway (Stripe). |
| 3 | **Catalog** | **85%** | 4+ | ~15 | Bundle page hidden from nav. No product comparison builder for admin. |
| 4 | **Marketing** | **70%** | 5 | ~15 | Blog management hidden from nav. No marketing automation workflow builder. Banner preview is TODO. Social scheduler hidden. |
| 5 | **Community** | **65%** | 4 | ~15 | Forum falls back to hardcoded data. Ambassador "view attendees" is a non-functional stub. |
| 6 | **Loyalty** | **55%** | 2 | ~8 | Gamification challenges are simulated. Expiration summary is simulated. No referral tracking dashboard in admin. |
| 7 | **Media** | **70%** | 30+ | ~30 | 15+ TODOs. No direct video upload. Hardcoded folder list. Multiple hardcoded English strings. Brand kit and social scheduler hidden from nav. |
| 8 | **Emails** | **78%** | 1 (9 tabs) | ~25 | No drag-and-drop email builder. Flow builder is basic. No real-time notification sound. |
| 9 | **Telephony** | **68%** | 20+ | ~33 | Conference pages hidden from nav. Speech analytics sub-pages hidden. Wallboard uses simulated data. FusionPBX integration may not be live. |
| 10 | **CRM** | **58%** | 45+ | ~90 | Many analytics pages use mock/computed data (CLV, churn, cohort, heatmaps). Report/dashboard builders are basic. No territory management. No AI scoring. |
| 11 | **Accounting** | **72%** | 35+ | ~133 | **14 pages hidden from nav** including Payroll, Time Tracking, Multi-entity. Dashboard has simulated fallback. Schema TODOs exist. |
| 12 | **System** | **70%** | 14+ | ~20 | Monitoring is 100% fake. Security page hidden. Webhook management hidden. Fiscal pages (4) hidden. No system health with real data. |

### Weighted Overall Score: **68%**

The score is lower than a pure "pages exist" count would suggest because many pages exist with simulated data, hidden navigation, or incomplete backend integration. The platform has excellent *breadth* but needs *depth* work.

---

## 5. SCHEMA EVOLUTION NEEDS

### 5.1 Models That Need New Fields/Relations

| Model | Needed Fields | Reason | Priority |
|---|---|---|---|
| `CrmLead` | `territoryId String?`, `leadScoreAI Float?`, `predictedCloseProb Float?` | Territory management, AI-powered scoring | P1 |
| `CrmDeal` | `forecastCategory String?` (commit/best-case/pipeline/omitted), `competitorNames String[]` | Forecast accuracy, competitive tracking | P1 |
| `User` | `calendarUrl String?`, `meetingDuration Int?`, `outOfOfficeUntil DateTime?` | Meeting scheduler integration | P2 |
| `Product` | `compareAttributes Json?` | Admin-defined comparison attributes | P3 |
| `Order` | `abandonedAt DateTime?`, `recoveryEmailSentAt DateTime?`, `recoveryConvertedAt DateTime?` | Abandoned cart recovery pipeline | P1 |
| `CrmWorkflow` | `category String?`, `tags String[]` | Workflow organization/filtering | P2 |
| `CrmPipeline` | `quotaAmount Decimal?`, `forecastEnabled Boolean` | Per-pipeline forecasting config | P2 |

### 5.2 New Models Needed for Planned Features

| Model | Purpose | Key Fields | Priority |
|---|---|---|---|
| `Territory` | Sales territory management | id, name, region, parentId, managerId, assignmentRules Json | P1 |
| `TerritoryAssignment` | Agent-territory mapping | id, territoryId, userId, role, effectiveFrom, effectiveTo | P1 |
| `LeadScoringRule` | AI/rule-based lead scoring | id, name, field, operator, value, scoreImpact, isActive | P1 |
| `LeadScoringModel` | ML model metadata | id, name, version, accuracy, trainedAt, features Json | P1 |
| `EmailSequence` | Sales email cadences | id, name, status, enrollmentCriteria Json, steps Json | P1 |
| `EmailSequenceEnrollment` | Track enrollee progress | id, sequenceId, leadId/contactId, currentStep, status, pausedAt | P1 |
| `MeetingSlot` | Calendar availability | id, userId, date, startTime, endTime, duration, bufferMinutes | P2 |
| `MeetingBooking` | Scheduled meetings | id, slotId, guestEmail, guestName, meetingUrl, status, notes | P2 |
| `RecurringEntryTemplate` | Accounting recurring templates | id, name, frequency, lines Json, nextRunDate, isActive | P2 |
| `ProposalTemplate` | Document generation | id, name, sections Json, variables Json, brandingConfig Json | P2 |
| `PartnerCompany` | Channel/partner management | id, name, tier, commissionRate, agreementUrl, status | P3 |
| `CustomObjectDefinition` | User-defined entities | id, name, apiName, fields Json, relationships Json | P3 |

### 5.3 Payroll/HR/Territory/Forecasting Model Status

| Area | Schema Status | API Status | UI Status | In Nav? |
|---|---|---|---|---|
| **Payroll** | PayrollRun, PayrollEmployee, PayStub exist in accounting.prisma | 8+ routes (`/api/accounting/payroll/*`) | Full page with 4 tabs | **NO** |
| **HR/Employees** | Employee fields on User model | CRUD API exists | Page exists | YES |
| **Time Tracking** | TimeEntry, TimeProject models exist | 7+ routes | Full page with timer | **NO** |
| **Territory Management** | **NOT EXISTS** | **NOT EXISTS** | **NOT EXISTS** | N/A |
| **Pipeline Forecasting** | CrmDeal has isRecurring, mrrValue, recurringInterval | `/api/admin/crm/forecast` exists | Page exists | YES |
| **Project Costing** | ProjectCost model exists | 6+ routes | Full page | **NO** |
| **Multi-Entity** | AccountingEntity model exists | 4+ routes | Full page | **NO** |

---

## 6. COMPETITIVE ANALYSIS (Brief)

### 6.1 vs Shopify Plus (~$2,300/mo)

| Feature | Shopify Plus | BioCycle | Gap |
|---|---|---|---|
| Product management | Full | Full | Parity |
| Checkout customization | Checkout extensions | Single flow | BioCycle gap |
| Multi-currency checkout | Full | Schema supports it | BioCycle gap (checkout needs work) |
| Shopify Flow automation | Full visual builder | Workflow model exists | BioCycle gap (no visual builder) |
| B2B / wholesale channel | Full | Company/distributor model | BioCycle partial |
| POS (point of sale) | Full | None | Major BioCycle gap |
| App ecosystem | 8,000+ apps | None | Major BioCycle gap |
| Headless commerce API | Storefront API | Public API exists | BioCycle partial |
| **Built-in CRM** | None | 45+ pages, 90 APIs | **Major BioCycle advantage** |
| **Built-in Accounting** | None | 35+ pages, 133 APIs | **Major BioCycle advantage** |
| **Built-in Telephony** | None | 20+ pages, VoIP | **Major BioCycle advantage** |
| **Built-in Loyalty** | Via app | Native | **BioCycle advantage** |

### 6.2 vs Salesforce Sales Cloud (~$150/user/mo)

| Feature | Salesforce | BioCycle CRM | Gap |
|---|---|---|---|
| Contact/Lead management | Full | Full | Parity |
| Pipeline/Deals | Full | Full | Parity |
| Einstein AI | Full | None | BioCycle gap -- need AI |
| Territory Management | Full | Not started | BioCycle gap |
| CPQ | Add-on ($75/user) | Basic quotes | BioCycle gap |
| Reports & Dashboards | Full builder | Basic builder pages | BioCycle gap |
| AppExchange | 5,000+ | None | Major BioCycle gap |
| Mobile CRM | Salesforce1 | None | BioCycle gap |
| **Built-in E-commerce** | None | Full | **Major BioCycle advantage** |
| **Built-in Call Center** | Add-on | Built-in VoIP | **BioCycle advantage** |
| **Built-in Accounting** | None | Full Canadian accounting | **Major BioCycle advantage** |

### 6.3 vs Zendesk Support (~$89/agent/mo)

| Feature | Zendesk | BioCycle | Gap |
|---|---|---|---|
| Ticketing | Full | Full (CrmTicket) | Parity |
| Knowledge Base | Full + public portal | KBArticle with `isPublic` flag | BioCycle gap (no public KB page) |
| Live Chat | Full (WebSocket) | Full (SSE + translation) | Near parity |
| Call Center | Zendesk Talk | Full VoIP integration | Parity+ (more features) |
| Answer Bot | AI-powered | Basic chatbot | BioCycle gap |
| SLA Management | Full | SlaPolicy model | Parity |
| CSAT Surveys | Full | CallSurvey exists | Parity |
| Help Center | Full themed | Aide page uses hardcoded data | BioCycle gap |
| **Built-in CRM** | Via Sell add-on | 45+ CRM pages | **Major BioCycle advantage** |

---

## 7. SCALABILITY READINESS

### 7.1 Can the Architecture Handle 100K Products?

| Aspect | Current State | Ready? | Action Required |
|---|---|---|---|
| **Database indexes** | Extensive indexes on Product model (isActive, createdAt, slug, categoryId, etc.) | YES | Good coverage |
| **Pagination** | API uses `skip/take` pattern | PARTIAL | Need cursor-based pagination for >50K rows (skip is O(n)) |
| **Search** | SQL-based `WHERE ... LIKE` patterns | NO | Need Meilisearch or Elasticsearch for full-text at scale |
| **Image handling** | No auto-thumbnail generation (IMP-027 is TODO) | NO | Need CDN + responsive images + lazy loading |
| **Translation tables** | 14 translation models per content type | CONCERN | 100K products x 22 locales = 2.2M translation rows |
| **Category tree** | Parent-child with parentId | YES | Works at scale with materialized path or nested sets |

**Verdict**: Handles ~10K products today. 100K requires search engine, cursor pagination, CDN, and translation optimization.

### 7.2 Can it Handle 1,000 Concurrent Users?

| Aspect | Current State | Ready? | Action Required |
|---|---|---|---|
| **Connection pooling** | `src/lib/db.ts` configures `connection_limit` (default 10) and `pool_timeout` (10s) | NO | Default 10 connections for 830 routes is insufficient. Need PgBouncer (documented in Azure research but not enabled) |
| **Caching** | ~30 API routes use cache headers (stale-while-revalidate) | PARTIAL | Need Redis cache layer for hot data (product listings, categories, settings) |
| **Session management** | NextAuth with DB sessions | PARTIAL | Session table will grow; need TTL-based cleanup |
| **Real-time features** | Chat uses SSE/polling | CONCERN | SSE holds open connections; 1000 chat users = 1000 persistent connections |
| **Static generation** | Most pages are dynamic (SSR) | NO | Product pages should use ISR (Incremental Static Regeneration) |
| **Rate limiting** | ApiKey model has `rateLimit` field | PARTIAL | No global rate limiting middleware for unauthenticated routes |
| **Horizontal scaling** | Azure App Service single instance | NO | Need load balancer, sticky sessions, shared state |

### 7.3 What Would Break First at Scale?

**Rank-ordered failure predictions:**

1. **P0: Database connection pool exhaustion** -- 10 connections shared across 830 routes. The orders page alone runs 9 parallel Prisma queries in `Promise.all`. Under 50+ concurrent admin users, pool exhaustion causes cascading 500 errors.

2. **P0: SQL search performance** -- `WHERE name LIKE '%query%'` queries on products, customers, and CRM entities. With 100K+ rows, these become multi-second queries that block the connection pool.

3. **P1: SSR memory pressure** -- All public pages are server-side rendered. 1000 concurrent SSR requests will exhaust Node.js heap memory (default ~1.5GB on Azure B2).

4. **P1: Translation table explosion** -- 302 models with 14 translation model types across 22 locales. JOIN queries for translated content will degrade.

5. **P2: No CDN** -- Product images served directly from Azure Blob Storage without edge caching. Each image request hits origin.

6. **P2: SSE connection limit** -- Chat system uses Server-Sent Events. Each active chat holds a persistent HTTP connection. Azure App Service has a ~4096 connection limit per instance.

7. **P3: Audit log table growth** -- AuditLog and AuditTrail tables will grow unbounded. No archival or partitioning strategy.

---

## 8. 12-MONTH ROADMAP PROPOSAL

### Q1 (Months 1-3): "Fix What Exists"

**Goal**: Eliminate all mock data, expose hidden pages, fix critical infrastructure gaps.

| # | Task | Priority | Effort | Module |
|---|---|---|---|---|
| 1 | **Add 20+ missing pages to admin navigation** | P0 | 2h | System |
| 2 | **Connect monitoring to Azure Application Insights** -- replace all simulated data | P0 | 5d | System |
| 3 | **Replace mock data in accounting dashboard** -- remove simulated fallback | P0 | 2d | Accounting |
| 4 | **Replace mock data in CRM analytics** -- CLV, wallboard call volume chart | P0 | 3d | CRM |
| 5 | **Replace simulated loyalty data** -- gamification challenges, expiration summary | P0 | 2d | Loyalty |
| 6 | **Enable PgBouncer** on Azure PostgreSQL Flexible Server | P0 | 1d | Infrastructure |
| 7 | **Fix FLAW-022** -- Wire "View attendees" button on webinars page | P1 | 1d | Community |
| 8 | **Fix hardcoded i18n strings** -- F35, F36, F37, F38 across media pages | P1 | 1d | Media |
| 9 | **Load media folders from DB** -- IMP-026/F81 | P1 | 1d | Media |
| 10 | **Fix comptabilite/temps hardcoded 'Admin' user** | P1 | 0.5d | Accounting |
| 11 | **Territory Management** -- New Prisma models + CRUD API + admin page | P1 | 15d | CRM |
| 12 | **AI Lead Scoring** -- Rule engine + scoring model + auto-calculation cron | P1 | 12d | CRM |
| 13 | **Abandoned cart recovery** -- New fields on Order + email trigger workflow | P1 | 8d | Commerce |
| 14 | **Search engine integration** -- Meilisearch for products, customers, articles | P1 | 10d | Infrastructure |

**Q1 Estimated Effort**: ~65 dev-days
**Q1 Deliverables**: Zero mock data in admin, all pages discoverable, PgBouncer live, territory management, AI lead scoring, search engine, abandoned cart recovery.

### Q2 (Months 4-6): "Scale & Automate"

**Goal**: Visual builders, email sequences, media pipeline, CDN.

| # | Task | Priority | Effort | Module |
|---|---|---|---|---|
| 15 | **Email Sequences** -- New models + multi-step cadence builder + enrollment tracking | P1 | 15d | CRM |
| 16 | **CDN integration** -- Azure CDN or Cloudflare for images/assets | P1 | 5d | Infrastructure |
| 17 | **Image processing pipeline** -- Auto-thumbnails (IMP-027), watermarking (IMP-021), crop/resize (IMP-019) | P1 | 12d | Media |
| 18 | **Direct video upload + transcoding** (IMP-023) | P1 | 12d | Media |
| 19 | **OAuth flow for social integrations** (IMP-036) | P1 | 5d | Media |
| 20 | **Social media post scheduling** (IMP-037) | P2 | 5d | Media |
| 21 | **Platform webhook routes** (IMP-014) | P2 | 5d | Media |
| 22 | **Cursor-based pagination** -- Replace skip/take for large datasets | P2 | 5d | Infrastructure |
| 23 | **Meeting scheduler** -- Calendar availability + booking page | P2 | 10d | CRM |
| 24 | **Content moderation** (IMP-028) -- Azure Content Moderator for user uploads | P2 | 5d | Media |
| 25 | **Drag-and-drop email builder** -- MJML or React Email visual editor | P2 | 15d | Email |
| 26 | **PayPal integration** -- Second payment gateway | P2 | 5d | Commerce |

**Q2 Estimated Effort**: ~104 dev-days
**Q2 Deliverables**: Email sequences, CDN live, image/video pipeline, social OAuth, meeting scheduler, email builder.

### Q3 (Months 7-9): "Enterprise Features"

**Goal**: B2B storefront, advanced analytics, mobile.

| # | Task | Priority | Effort | Module |
|---|---|---|---|---|
| 27 | **AI forecasting** -- ML-predicted deal close dates and win probability | P2 | 15d | CRM |
| 28 | **Document/Proposal generation** -- Template builder + PDF generation | P2 | 10d | CRM |
| 29 | **Public Help Center** -- Customer-facing KB from KBArticle model | P2 | 8d | Community |
| 30 | **Omnichannel agent desktop** -- Unified view across email, chat, phone, SMS | P2 | 20d | CRM |
| 31 | **WebSocket for real-time** -- Replace SSE/polling in chat and wallboard | P2 | 8d | Infrastructure |
| 32 | **B2B storefront** -- Separate wholesale experience for distributors | P2 | 25d | Commerce |
| 33 | **Multi-location inventory** -- Warehouse model integration with commerce | P2 | 10d | Commerce |
| 34 | **Advanced report builder** -- Functional drag-and-drop with custom queries | P2 | 15d | CRM |
| 35 | **Custom fields/objects** -- User-defined fields on leads, deals, contacts | P2 | 15d | CRM |
| 36 | **ISR for public pages** -- Incremental Static Regeneration for product pages | P2 | 5d | Infrastructure |

**Q3 Estimated Effort**: ~131 dev-days (needs 2-3 developers)
**Q3 Deliverables**: AI forecasting, proposal generation, public help center, agent desktop, B2B, multi-location inventory.

### Q4 (Months 10-12): "Differentiate & Delight"

**Goal**: Mobile CRM, AI intelligence, partner portal, accessibility.

| # | Task | Priority | Effort | Module |
|---|---|---|---|---|
| 37 | **Mobile CRM companion app** -- React Native/Expo for sales reps | P2 | 30d | CRM |
| 38 | **AI call intelligence** -- Auto-summaries, coaching tips from transcriptions | P2 | 15d | Telephony |
| 39 | **Partner/channel management** -- Partner portal, commission tracking | P3 | 15d | Commerce |
| 40 | **Social listening** -- Monitor brand mentions across platforms | P3 | 10d | Media |
| 41 | **Advanced RBAC** -- Role hierarchy, field-level security | P3 | 10d | System |
| 42 | **Accessibility audit** -- WCAG 2.1 AA compliance across all pages | P2 | 10d | All |
| 43 | **Performance optimization** -- ISR, lazy loading, code splitting, bundle analysis | P2 | 8d | Infrastructure |
| 44 | **Remaining IMP items** -- Complete all outstanding media TODOs (IMP-025, 030, 031, 034, 035, 039) | P3 | 12d | Media |
| 45 | **RecurringEntryTemplate model** -- Schema TODO #52 | P3 | 3d | Accounting |

**Q4 Estimated Effort**: ~113 dev-days
**Q4 Deliverables**: Mobile CRM beta, AI call intelligence, partner portal, accessibility compliance, performance optimization.

---

## PRIORITY SUMMARY

| Priority | Count | Total Effort | Description |
|---|---|---|---|
| **P0** | 7 items | ~16 dev-days | Monitoring fake, mock data in 4 pages, connection pooling, hidden nav pages |
| **P1** | 10 items | ~95 dev-days | Territory management, AI scoring, email sequences, search engine, CDN, media pipeline |
| **P2** | 20+ items | ~250 dev-days | Visual builders, meeting scheduler, B2B, agent desktop, mobile CRM, AI forecasting |
| **P3** | 10+ items | ~55 dev-days | Partner portal, social listening, custom objects, POS, plugin system |

### Estimated Annual Investment
- **Total**: ~413 dev-days = ~21 person-months
- **Team needed**: 2 senior developers full-time for 12 months
- **ROI priorities**: P0 items (1-2 weeks) unlock immediate trust; P1 items (3 months) unlock enterprise CRM sales

---

## KEY FILES REFERENCED

- Navigation config: `/Volumes/AI_Project/peptide-plus/src/lib/admin/outlook-nav.ts`
- Schema files: `/Volumes/AI_Project/peptide-plus/prisma/schema/*.prisma` (12 files, 302 models)
- DB connection pooling: `/Volumes/AI_Project/peptide-plus/src/lib/db.ts`
- Admin pages: `/Volumes/AI_Project/peptide-plus/src/app/admin/` (218 page.tsx files)
- API routes: `/Volumes/AI_Project/peptide-plus/src/app/api/` (830 route.ts files)
- Monitoring (simulated): `/Volumes/AI_Project/peptide-plus/src/app/admin/monitoring/page.tsx`
- CRM CLV (mock fallback): `/Volumes/AI_Project/peptide-plus/src/app/admin/crm/clv/page.tsx`
- CRM wallboard (simulated): `/Volumes/AI_Project/peptide-plus/src/app/admin/crm/wallboard/page.tsx`
- Accounting dashboard (simulated): `/Volumes/AI_Project/peptide-plus/src/app/admin/comptabilite/page.tsx`
- Loyalty (simulated): `/Volumes/AI_Project/peptide-plus/src/app/admin/fidelite/page.tsx`
