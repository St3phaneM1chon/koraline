# Master Integration Plan — Koraline Feature Gap Closure

**Date**: 2026-03-28
**Scope**: 6 phases, 14-17 weeks, ~95 features across 28 domains
**Source Documents**: GAP_ANALYSIS.md, FEATURE_TAXONOMY.md, TECH_RESEARCH_2026.md
**Principle**: PRESERVE and EXTEND existing Koraline modules -- never replace working systems

---

## Table of Contents

1. [Phase 1: Foundation & Infrastructure (Weeks 1-2)](#phase-1-foundation--infrastructure)
2. [Phase 2: Core Feature Gaps -- Low Risk (Weeks 3-5)](#phase-2-core-feature-gaps--low-risk)
3. [Phase 3: Core Feature Gaps -- Medium Risk (Weeks 6-8)](#phase-3-core-feature-gaps--medium-risk)
4. [Phase 4: Advanced Features (Weeks 9-12)](#phase-4-advanced-features)
5. [Phase 5: Innovation & Polish (Weeks 13-15)](#phase-5-innovation--polish)
6. [Phase 6: Testing & Launch (Weeks 16-17)](#phase-6-testing--launch)
7. [Cross-Phase Dependencies](#cross-phase-dependencies)
8. [Risk Registry](#risk-registry)

---

## Guiding Principles

1. **Extend, Never Replace**: Koraline has ~437 pages, ~1048 API routes, ~310 Prisma tables. Every new feature integrates with existing infrastructure.
2. **Tenant-First Design**: Every feature must be tenant-isolated from day one (tenantId on every model, every query filtered).
3. **Module Architecture**: New features follow the existing module-based a-la-carte pricing model (tenants enable/disable modules).
4. **i18n from Day One**: Every user-facing string goes through `t()` across all 22 locales.
5. **Build Before Push**: `npx prisma generate && NODE_OPTIONS="--max-old-space-size=8192" npm run build` before every push.

---

## Phase 1: Foundation & Infrastructure

**Timeline**: Weeks 1-2 (10 business days)
**Goal**: Build the architectural foundation that all subsequent phases depend on

---

### 1.1 Visual Page Builder Architecture

**What Exists (PRESERVE)**:
- Admin homepage sections engine (`src/app/admin/contenu/` -- homepage section management)
- Page templates system (`src/app/admin/contenu/` -- page content editor)
- Existing React components library (`src/components/`)
- Content pages service (`src/lib/content-pages.ts`)

**What to Build**:
Section-based visual editor that extends the existing homepage sections engine into a general-purpose page builder.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/page-builder/builder-engine.ts` -- Core section registry and rendering engine |
| | `src/lib/page-builder/section-types.ts` -- Section type definitions (hero, text, gallery, CTA, testimonials, pricing, FAQ, features, team, contact) |
| | `src/lib/page-builder/section-renderer.tsx` -- Server component that renders any section by type |
| | `src/lib/page-builder/drag-drop-context.tsx` -- Client component wrapping dnd-kit for section reordering |
| | `src/components/page-builder/SectionToolbar.tsx` -- Floating toolbar for add/edit/delete/move sections |
| | `src/components/page-builder/SectionPicker.tsx` -- Modal to pick section type from library |
| | `src/components/page-builder/LivePreview.tsx` -- iframe-based preview of the page being built |
| | `src/components/page-builder/sections/HeroSection.tsx` -- Editable hero section |
| | `src/components/page-builder/sections/TextSection.tsx` -- Rich text section |
| | `src/components/page-builder/sections/GallerySection.tsx` -- Image gallery section |
| | `src/components/page-builder/sections/CTASection.tsx` -- Call-to-action section |
| | `src/components/page-builder/sections/TestimonialsSection.tsx` -- Customer testimonials |
| | `src/components/page-builder/sections/PricingSection.tsx` -- Pricing table section |
| | `src/components/page-builder/sections/FAQSection.tsx` -- Accordion FAQ section |
| | `src/components/page-builder/sections/FeaturesSection.tsx` -- Feature grid section |
| | `src/components/page-builder/sections/TeamSection.tsx` -- Team members grid |
| | `src/components/page-builder/sections/ContactSection.tsx` -- Contact form section |
| | `src/app/api/admin/page-builder/sections/route.ts` -- CRUD for page sections |
| | `src/app/api/admin/page-builder/reorder/route.ts` -- Section reorder endpoint |
| | `src/app/api/admin/page-builder/preview/route.ts` -- Preview renderer |
| | `src/app/admin/contenu/page-builder/page.tsx` -- Admin page builder interface |
| **Files to Modify** | `src/lib/content-pages.ts` -- Add section-based content model support |
| | `src/app/admin/contenu/layout.tsx` -- Add page builder nav link |
| **Prisma Schema Changes** | Add to `prisma/schema.prisma`: |

```prisma
model PageSection {
  id          String   @id @default(cuid())
  tenantId    String
  pageId      String
  type        String   // hero, text, gallery, cta, testimonials, pricing, faq, features, team, contact
  order       Int
  config      Json     // Section-specific configuration
  styles      Json?    // Custom styles override
  visible     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  page        ContentPage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  tenant      Tenant      @relation(fields: [tenantId], references: [id])

  @@index([pageId, order])
  @@index([tenantId])
}
```

| **API Endpoints** | `POST /api/admin/page-builder/sections` -- Create section |
|---|---|
| | `PUT /api/admin/page-builder/sections/[id]` -- Update section config |
| | `DELETE /api/admin/page-builder/sections/[id]` -- Delete section |
| | `PUT /api/admin/page-builder/reorder` -- Reorder sections (batch) |
| | `GET /api/admin/page-builder/preview/[pageId]` -- Render preview |
| **Estimated Effort** | 40 hours |
| **Dependencies** | None (foundational) |
| **Risk Level** | Low -- extends existing pattern |
| **Rollback Plan** | Feature-flagged behind `FEATURE_PAGE_BUILDER=true` env var. Existing page editor untouched. |

---

### 1.2 Template System

**What Exists (PRESERVE)**:
- Tenant onboarding wizard (`src/app/admin/platform/` -- onboarding flow)
- Homepage sections engine (already renders section-based pages)
- Existing page templates for default content

**What to Build**:
Template library with industry-specific starter sites that pre-populate sections, pages, products, and content.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/templates/template-engine.ts` -- Template loading, preview, and application engine |
| | `src/lib/templates/template-registry.ts` -- Registry of all available templates with metadata |
| | `src/lib/templates/template-applicator.ts` -- Applies a template to a tenant (creates pages, sections, sample products) |
| | `src/lib/templates/industry-presets.ts` -- Industry-specific content presets (restaurant, fitness, salon, retail, consulting, etc.) |
| | `src/app/api/admin/templates/route.ts` -- List available templates |
| | `src/app/api/admin/templates/[id]/route.ts` -- Get template details |
| | `src/app/api/admin/templates/[id]/apply/route.ts` -- Apply template to tenant |
| | `src/app/api/admin/templates/[id]/preview/route.ts` -- Preview template |
| | `src/app/admin/contenu/templates/page.tsx` -- Template gallery admin page |
| | `src/components/templates/TemplateCard.tsx` -- Template preview card |
| | `src/components/templates/TemplateGallery.tsx` -- Filterable template grid |
| | `src/components/templates/TemplatePreview.tsx` -- Full-page template preview |
| | `data/templates/restaurant.json` -- Restaurant template definition |
| | `data/templates/fitness.json` -- Fitness/gym template |
| | `data/templates/salon.json` -- Hair/beauty salon template |
| | `data/templates/retail.json` -- General retail store |
| | `data/templates/consulting.json` -- Professional services |
| | `data/templates/elearning.json` -- Online courses template |
| | `data/templates/healthcare.json` -- Medical/health practice |
| | `data/templates/realestate.json` -- Real estate agency |
| | `data/templates/nonprofit.json` -- Nonprofit organization |
| | `data/templates/portfolio.json` -- Creative portfolio |
| **Files to Modify** | `src/app/admin/platform/` -- Integrate template selection into onboarding wizard |
| **Prisma Schema Changes** | Add to `prisma/schema.prisma`: |

```prisma
model SiteTemplate {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  industry    String   // restaurant, fitness, salon, retail, consulting, etc.
  thumbnail   String?  // Preview image URL
  config      Json     // Full template definition (sections, pages, sample products)
  tags        String[] // Searchable tags
  premium     Boolean  @default(false)
  active      Boolean  @default(true)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([industry])
  @@index([active])
}
```

| **API Endpoints** | `GET /api/admin/templates` -- List templates (filterable by industry) |
|---|---|
| | `GET /api/admin/templates/[id]` -- Template details |
| | `POST /api/admin/templates/[id]/apply` -- Apply template to current tenant |
| | `GET /api/admin/templates/[id]/preview` -- Render preview |
| **Estimated Effort** | 32 hours (engine) + 24 hours (10 template definitions) = 56 hours |
| **Dependencies** | Phase 1.1 (Page Builder -- templates use sections) |
| **Risk Level** | Low -- data-driven, no existing code touched |
| **Rollback Plan** | Templates are additive data. Remove template records to disable. |

---

### 1.3 Enhanced Admin Content Editor

**What Exists (PRESERVE)**:
- Blog post editor (`src/app/admin/blog/`)
- Product description editor (`src/app/admin/produits/`)
- Content pages editor (`src/app/admin/contenu/`)
- Aurelia AI text generation (already integrated)

**What to Build**:
Rich text editor upgrade with AI-assisted content blocks, image management, and structured content support.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/components/editor/RichTextEditor.tsx` -- Enhanced editor wrapping Tiptap with AI toolbar |
| | `src/components/editor/AIContentToolbar.tsx` -- AI actions: generate, rewrite, expand, summarize, translate |
| | `src/components/editor/ImageUploadBlock.tsx` -- Drag-drop image upload with auto-optimization |
| | `src/components/editor/EmbedBlock.tsx` -- YouTube, Vimeo, social media embed |
| | `src/components/editor/TableBlock.tsx` -- Editable table insertion |
| | `src/components/editor/CodeBlock.tsx` -- Syntax-highlighted code block |
| | `src/lib/editor/ai-content-service.ts` -- AI content generation service (wraps Aurelia) |
| | `src/lib/editor/image-optimizer.ts` -- Client-side image resize/compress before upload |
| | `src/app/api/admin/editor/ai-generate/route.ts` -- AI content generation endpoint |
| | `src/app/api/admin/editor/ai-rewrite/route.ts` -- AI rewrite/improve endpoint |
| | `src/app/api/admin/editor/image-upload/route.ts` -- Optimized image upload endpoint |
| **Files to Modify** | `src/app/admin/blog/` -- Replace textarea with RichTextEditor |
| | `src/app/admin/produits/` -- Upgrade product description editor |
| | `src/app/admin/contenu/` -- Upgrade content page editor |
| | `package.json` -- Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-table` |
| **Prisma Schema Changes** | None (content stored in existing text/JSON fields) |
| **API Endpoints** | `POST /api/admin/editor/ai-generate` -- Generate content from prompt |
| | `POST /api/admin/editor/ai-rewrite` -- Rewrite selected text |
| | `POST /api/admin/editor/image-upload` -- Upload and optimize image |
| **Estimated Effort** | 32 hours |
| **Dependencies** | None |
| **Risk Level** | Low -- progressive enhancement of existing editors |
| **Rollback Plan** | Editor is a component swap. Revert to previous editor component if issues. |

---

### Phase 1 Summary

| Feature | Hours | Risk | Dependencies |
|---------|-------|------|-------------|
| 1.1 Page Builder Architecture | 40 | Low | None |
| 1.2 Template System | 56 | Low | 1.1 |
| 1.3 Enhanced Content Editor | 32 | Low | None |
| **Phase 1 Total** | **128 hours** | | |

---

## Phase 2: Core Feature Gaps -- Low Risk

**Timeline**: Weeks 3-5 (15 business days)
**Goal**: Close the most impactful feature gaps with low implementation risk

---

### 2.1 Booking & Scheduling System (Gap G4, Impact 9/10)

**What Exists (PRESERVE)**:
- Telnyx SMS reminders (`src/lib/voip/` -- SMS sending capability)
- Stripe payment integration (`src/lib/stripe-attitudes.ts` -- payment processing)
- User/customer accounts (`src/app/api/account/` -- customer profiles)
- Email service (`src/lib/email-service.ts` -- transactional emails)
- CRM contacts (`src/app/admin/crm/` -- customer management)

**What to Build**:
Complete booking module for service businesses: services, providers, availability, online booking, payments, reminders.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/booking/booking-service.ts` -- Core booking logic (create, reschedule, cancel, confirm) |
| | `src/lib/booking/availability-engine.ts` -- Calculate available time slots from provider schedules minus existing bookings |
| | `src/lib/booking/reminder-service.ts` -- Email + SMS reminders (24h, 1h before appointment) |
| | `src/lib/booking/calendar-sync.ts` -- Google Calendar + Microsoft Outlook sync (OAuth2) |
| | `src/lib/booking/booking-payment.ts` -- Payment at booking via existing Stripe integration |
| | `src/app/api/admin/booking/services/route.ts` -- CRUD services (haircut, consultation, etc.) |
| | `src/app/api/admin/booking/providers/route.ts` -- CRUD providers (staff members with schedules) |
| | `src/app/api/admin/booking/schedule/route.ts` -- Provider schedule management |
| | `src/app/api/admin/booking/appointments/route.ts` -- Appointment list/management |
| | `src/app/api/admin/booking/settings/route.ts` -- Module settings (buffer time, advance booking, cancellation policy) |
| | `src/app/api/booking/services/route.ts` -- Public: list available services |
| | `src/app/api/booking/availability/route.ts` -- Public: get available slots for date + service + provider |
| | `src/app/api/booking/create/route.ts` -- Public: create a booking |
| | `src/app/api/booking/cancel/route.ts` -- Public: cancel a booking |
| | `src/app/api/booking/reschedule/route.ts` -- Public: reschedule a booking |
| | `src/app/api/cron/booking-reminders/route.ts` -- Cron: send upcoming appointment reminders |
| | `src/app/admin/booking/page.tsx` -- Admin booking dashboard |
| | `src/app/admin/booking/services/page.tsx` -- Manage services |
| | `src/app/admin/booking/providers/page.tsx` -- Manage providers and schedules |
| | `src/app/admin/booking/appointments/page.tsx` -- Appointments calendar view |
| | `src/app/admin/booking/settings/page.tsx` -- Booking module settings |
| | `src/app/(shop)/booking/page.tsx` -- Public booking page |
| | `src/app/(shop)/booking/[serviceSlug]/page.tsx` -- Service detail + slot selection |
| | `src/app/(shop)/booking/confirmation/page.tsx` -- Booking confirmation |
| | `src/components/booking/BookingCalendar.tsx` -- Calendar component showing available slots |
| | `src/components/booking/ServiceCard.tsx` -- Service listing card |
| | `src/components/booking/ProviderPicker.tsx` -- Select provider for service |
| | `src/components/booking/TimeSlotGrid.tsx` -- Available time slots grid |
| | `src/components/booking/BookingSummary.tsx` -- Booking summary before payment |
| | `src/components/booking/IntakeForm.tsx` -- Custom intake form before booking |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add booking to admin navigation |
| | `src/lib/admin/outlook-nav.ts` -- Add booking pages to nav tree |
| | `src/i18n/locales/*.json` -- Add booking namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model BookingService {
  id             String    @id @default(cuid())
  tenantId       String
  name           String
  slug           String
  description    String?
  duration       Int       // Duration in minutes
  price          Decimal?  @db.Decimal(10, 2)
  currency       String    @default("CAD")
  bufferBefore   Int       @default(0) // Minutes buffer before
  bufferAfter    Int       @default(0) // Minutes buffer after
  maxAdvanceDays Int       @default(60) // How far in advance can book
  minAdvanceHours Int      @default(2) // Minimum hours before booking
  requirePayment Boolean   @default(false)
  intakeFormConfig Json?   // Custom intake form fields
  active         Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  tenant         Tenant    @relation(fields: [tenantId], references: [id])
  providers      BookingServiceProvider[]
  appointments   Appointment[]

  @@unique([tenantId, slug])
  @@index([tenantId, active])
}

model BookingProvider {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String?  // Link to existing User/employee
  name        String
  email       String?
  phone       String?
  avatar      String?
  timezone    String   @default("America/Toronto")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])
  services    BookingServiceProvider[]
  schedules   ProviderSchedule[]
  appointments Appointment[]

  @@index([tenantId, active])
}

model BookingServiceProvider {
  id         String          @id @default(cuid())
  serviceId  String
  providerId String
  service    BookingService  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  provider   BookingProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([serviceId, providerId])
}

model ProviderSchedule {
  id         String          @id @default(cuid())
  providerId String
  dayOfWeek  Int             // 0=Sunday, 6=Saturday
  startTime  String          // "09:00"
  endTime    String          // "17:00"
  isWorking  Boolean         @default(true)
  provider   BookingProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([providerId, dayOfWeek])
}

model Appointment {
  id                String          @id @default(cuid())
  tenantId          String
  serviceId         String
  providerId        String
  customerId        String?
  customerName      String
  customerEmail     String
  customerPhone     String?
  startTime         DateTime
  endTime           DateTime
  status            String          @default("confirmed") // confirmed, cancelled, completed, no_show
  notes             String?
  intakeData        Json?           // Custom intake form responses
  paymentIntentId   String?         // Stripe payment intent
  paymentStatus     String?         // paid, pending, refunded
  reminderSentAt    DateTime?
  cancelledAt       DateTime?
  cancellationReason String?
  calendarEventId   String?         // Google/Outlook calendar event ID
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  tenant            Tenant          @relation(fields: [tenantId], references: [id])
  service           BookingService  @relation(fields: [serviceId], references: [id])
  provider          BookingProvider @relation(fields: [providerId], references: [id])

  @@index([tenantId, startTime])
  @@index([providerId, startTime])
  @@index([status])
}
```

| **API Endpoints** | 5 admin routes + 5 public routes + 1 cron route (see files above) |
|---|---|
| **Estimated Effort** | 80 hours |
| **Dependencies** | Stripe (existing), Telnyx SMS (existing), Email service (existing) |
| **Risk Level** | Medium -- calendar sync is complex but well-documented APIs |
| **Rollback Plan** | Module-based: disable booking module for tenant. No existing tables affected. |

---

### 2.2 Membership & Paywall System (Gap G17, Impact 6/10)

**What Exists (PRESERVE)**:
- Stripe subscriptions (`src/lib/stripe-attitudes.ts` -- recurring billing)
- User authentication (`src/lib/auth/` -- session management)
- Role-based access (`src/lib/admin-api-guard.ts`, `src/lib/auth-jwt.ts`)
- LMS course access (`src/lib/lms/` -- already has gated content patterns)
- Password-protected pages (`ContentPage` model)

**What to Build**:
Membership tiers with content gating, drip scheduling, and subscriber management.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/membership/membership-service.ts` -- Core membership logic (subscribe, upgrade, downgrade, cancel) |
| | `src/lib/membership/content-gate.ts` -- Middleware to check membership access before rendering content |
| | `src/lib/membership/drip-scheduler.ts` -- Schedule content release by membership age |
| | `src/app/api/admin/membership/tiers/route.ts` -- CRUD membership tiers |
| | `src/app/api/admin/membership/subscribers/route.ts` -- List/manage subscribers |
| | `src/app/api/admin/membership/content-rules/route.ts` -- Configure which content requires which tier |
| | `src/app/api/membership/subscribe/route.ts` -- Public: subscribe to a tier |
| | `src/app/api/membership/portal/route.ts` -- Public: manage subscription (Stripe billing portal) |
| | `src/app/admin/membership/page.tsx` -- Membership dashboard |
| | `src/app/admin/membership/tiers/page.tsx` -- Manage tiers |
| | `src/app/admin/membership/subscribers/page.tsx` -- Subscriber list |
| | `src/app/admin/membership/content-rules/page.tsx` -- Content gating rules |
| | `src/app/(shop)/membership/page.tsx` -- Public membership landing page |
| | `src/app/(shop)/membership/[tierSlug]/page.tsx` -- Tier detail + subscribe |
| | `src/components/membership/TierCard.tsx` -- Pricing tier card |
| | `src/components/membership/GatedContent.tsx` -- Component that shows content or upgrade prompt |
| | `src/components/membership/SubscriberBadge.tsx` -- Member badge display |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add membership to admin navigation |
| | `src/lib/admin/outlook-nav.ts` -- Add membership pages to nav tree |
| | `src/app/(shop)/blog/[slug]/page.tsx` -- Add membership gate check |
| | `src/app/(shop)/learn/` -- Add membership gate check for courses |
| | `src/i18n/locales/*.json` -- Add membership namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model MembershipTier {
  id                String   @id @default(cuid())
  tenantId          String
  name              String
  slug              String
  description       String?
  price             Decimal  @db.Decimal(10, 2)
  currency          String   @default("CAD")
  interval          String   @default("month") // month, year
  stripePriceId     String?
  features          Json?    // List of included features for display
  maxMembers        Int?     // Optional cap
  trialDays         Int      @default(0)
  order             Int      @default(0)
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  subscribers       MembershipSubscription[]
  contentRules      MembershipContentRule[]

  @@unique([tenantId, slug])
  @@index([tenantId, active])
}

model MembershipSubscription {
  id                   String   @id @default(cuid())
  tenantId             String
  userId               String
  tierId               String
  stripeSubscriptionId String?
  status               String   @default("active") // active, cancelled, past_due, trialing
  startedAt            DateTime @default(now())
  currentPeriodEnd     DateTime?
  cancelledAt          DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  tenant               Tenant           @relation(fields: [tenantId], references: [id])
  user                 User             @relation(fields: [userId], references: [id])
  tier                 MembershipTier   @relation(fields: [tierId], references: [id])

  @@unique([tenantId, userId])
  @@index([tenantId, status])
}

model MembershipContentRule {
  id            String   @id @default(cuid())
  tenantId      String
  tierId        String
  contentType   String   // page, blog_post, course, product, category
  contentId     String   // ID of the gated content
  dripDays      Int?     // Days after subscription start to unlock (null = immediate)
  createdAt     DateTime @default(now())
  tenant        Tenant           @relation(fields: [tenantId], references: [id])
  tier          MembershipTier   @relation(fields: [tierId], references: [id])

  @@unique([tenantId, tierId, contentType, contentId])
  @@index([tenantId, contentType, contentId])
}
```

| **API Endpoints** | 3 admin routes + 2 public routes (see files above) |
|---|---|
| **Estimated Effort** | 48 hours |
| **Dependencies** | Stripe subscriptions (existing) |
| **Risk Level** | Low -- extends existing Stripe subscription patterns |
| **Rollback Plan** | Module-based: disable membership module. Content reverts to public access. |

---

### 2.3 Enhanced Form Builder (Extends Existing)

**What Exists (PRESERVE)**:
- Contact forms (`src/app/api/contact/` -- form submission handling)
- Registration forms (`src/app/api/auth/` -- user registration)
- Custom form builder (basic, exists in admin)
- Pop-up forms and newsletter sign-up

**What to Build**:
Advanced form builder with conditional logic, payment fields, file uploads, and CRM integration.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/forms/form-builder-engine.ts` -- Form schema interpreter (conditional logic, validation rules) |
| | `src/lib/forms/form-analytics.ts` -- Form submission analytics (conversion rates, field drop-off) |
| | `src/lib/forms/form-payment.ts` -- Payment form fields via Stripe Elements |
| | `src/lib/forms/form-crm-bridge.ts` -- Auto-create CRM leads from form submissions |
| | `src/app/api/admin/forms/route.ts` -- CRUD custom forms |
| | `src/app/api/admin/forms/[id]/route.ts` -- Get/update/delete form |
| | `src/app/api/admin/forms/[id]/submissions/route.ts` -- View form submissions |
| | `src/app/api/admin/forms/[id]/analytics/route.ts` -- Form analytics |
| | `src/app/api/forms/[id]/submit/route.ts` -- Public: submit a form |
| | `src/app/admin/formulaires/builder/page.tsx` -- Visual form builder |
| | `src/components/forms/FormBuilder.tsx` -- Drag-drop form field builder |
| | `src/components/forms/FormRenderer.tsx` -- Render form from schema |
| | `src/components/forms/fields/PaymentField.tsx` -- Stripe payment field |
| | `src/components/forms/fields/ConditionalField.tsx` -- Field with show/hide logic |
| | `src/components/forms/fields/FileUploadField.tsx` -- Enhanced file upload |
| | `src/components/forms/fields/SignatureField.tsx` -- Digital signature capture |
| | `src/components/forms/fields/RatingField.tsx` -- Star rating field |
| | `src/components/forms/fields/DatePickerField.tsx` -- Date/time picker |
| **Files to Modify** | `src/app/admin/formulaires/` -- Enhance existing form management pages |
| | `src/lib/crm/` -- Add form-to-lead bridge |
| | `src/i18n/locales/*.json` -- Add form builder keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model CustomForm {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  schema      Json     // Form field definitions with conditional logic
  settings    Json?    // Redirect URL, notifications, CRM integration, payment
  active      Boolean  @default(true)
  submitCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  submissions FormSubmission[]

  @@unique([tenantId, slug])
  @@index([tenantId, active])
}

model FormSubmission {
  id          String   @id @default(cuid())
  tenantId    String
  formId      String
  data        Json     // Submitted field values
  metadata    Json?    // IP, user agent, referrer, UTM params
  userId      String?  // If user was logged in
  paymentId   String?  // Stripe payment ID if form had payment
  crmLeadId   String?  // Created CRM lead ID
  createdAt   DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  form        CustomForm @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@index([tenantId, formId])
  @@index([createdAt])
}
```

| **API Endpoints** | 4 admin routes + 1 public route (see files above) |
|---|---|
| **Estimated Effort** | 40 hours |
| **Dependencies** | Stripe (existing), CRM (existing) |
| **Risk Level** | Low -- new module, no existing code conflict |
| **Rollback Plan** | Feature-flagged. Existing contact forms untouched. |

---

### 2.4 Dynamic Content Collections / CMS (Gap G18, Impact 6/10)

**What Exists (PRESERVE)**:
- Blog post system (`src/app/admin/blog/` -- content with categories, tags)
- Content pages (`src/lib/content-pages.ts` -- static page management)
- Product catalog (`src/app/admin/produits/` -- structured product data)
- FAQ system (existing FAQ pages in admin)
- Translation models (14 existing translation tables)

**What to Build**:
User-defined content types (like Wix CMS Collections or Shopify Metaobjects). Tenants define custom schemas (testimonials, team members, case studies, recipes, etc.) and Koraline generates CRUD admin pages and public display automatically.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/cms/collection-engine.ts` -- Core collection type definition and validation |
| | `src/lib/cms/collection-renderer.ts` -- Dynamic rendering of collection items on public pages |
| | `src/lib/cms/field-types.ts` -- Supported field types (text, richtext, number, date, image, reference, boolean, select, color, url) |
| | `src/app/api/admin/cms/collections/route.ts` -- CRUD collection types |
| | `src/app/api/admin/cms/collections/[id]/route.ts` -- Get/update/delete collection type |
| | `src/app/api/admin/cms/collections/[id]/items/route.ts` -- CRUD items in a collection |
| | `src/app/api/admin/cms/collections/[id]/items/[itemId]/route.ts` -- Get/update/delete item |
| | `src/app/api/cms/[collectionSlug]/route.ts` -- Public: list items in collection |
| | `src/app/api/cms/[collectionSlug]/[itemSlug]/route.ts` -- Public: get single item |
| | `src/app/admin/cms/page.tsx` -- CMS dashboard (list all collections) |
| | `src/app/admin/cms/[collectionId]/page.tsx` -- Collection items list |
| | `src/app/admin/cms/[collectionId]/new/page.tsx` -- Create new item |
| | `src/app/admin/cms/[collectionId]/[itemId]/page.tsx` -- Edit item |
| | `src/app/admin/cms/create/page.tsx` -- Create new collection type |
| | `src/components/cms/CollectionFieldEditor.tsx` -- Dynamic field editor based on field type |
| | `src/components/cms/CollectionItemCard.tsx` -- Item display card |
| | `src/components/cms/CollectionGrid.tsx` -- Grid display of collection items |
| | `src/components/cms/DynamicField.tsx` -- Renders any field type |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add CMS to admin navigation |
| | `src/lib/admin/outlook-nav.ts` -- Add CMS pages to nav tree |
| | `src/i18n/locales/*.json` -- Add cms namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model CmsCollection {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  schema      Json     // Array of field definitions: [{name, type, required, options}]
  displayConfig Json?  // How to display items (grid, list, table, cards)
  singletonMode Boolean @default(false) // If true, collection has exactly one item
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  items       CmsItem[]

  @@unique([tenantId, slug])
  @@index([tenantId, active])
}

model CmsItem {
  id           String   @id @default(cuid())
  tenantId     String
  collectionId String
  slug         String
  data         Json     // Item field values matching collection schema
  status       String   @default("draft") // draft, published, archived
  publishedAt  DateTime?
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  collection   CmsCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@unique([collectionId, slug])
  @@index([tenantId, collectionId, status])
  @@index([sortOrder])
}
```

| **API Endpoints** | 4 admin routes + 2 public routes (see files above) |
|---|---|
| **Estimated Effort** | 56 hours |
| **Dependencies** | Phase 1.3 (Rich Text Editor for richtext fields) |
| **Risk Level** | Medium -- dynamic schema requires careful validation |
| **Rollback Plan** | Module-based. CMS is a standalone module; disable per tenant. |

---

### 2.5 Image Gallery & Portfolio (Gaps G29/Portfolio, Impact 5/10)

**What Exists (PRESERVE)**:
- Media management (`src/app/admin/medias/` -- file upload and management)
- Product images (product gallery already works)
- Content hub (`src/app/admin/media/` -- brand kit, content management)

**What to Build**:
Image gallery component with lightbox, grid/masonry layouts, and portfolio pages for creative professionals.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/components/gallery/ImageGallery.tsx` -- Gallery component with multiple layouts (grid, masonry, slider, lightbox) |
| | `src/components/gallery/Lightbox.tsx` -- Full-screen image lightbox with navigation |
| | `src/components/gallery/MasonryGrid.tsx` -- Masonry layout for varied-size images |
| | `src/components/gallery/PortfolioGrid.tsx` -- Portfolio project grid with categories |
| | `src/lib/gallery/gallery-service.ts` -- Gallery CRUD and image ordering |
| | `src/app/api/admin/galleries/route.ts` -- CRUD galleries |
| | `src/app/api/admin/galleries/[id]/route.ts` -- Get/update/delete gallery |
| | `src/app/api/admin/galleries/[id]/images/route.ts` -- Manage images in gallery |
| | `src/app/api/galleries/[slug]/route.ts` -- Public: get gallery for display |
| | `src/app/admin/medias/galleries/page.tsx` -- Gallery management page |
| | `src/app/(shop)/gallery/page.tsx` -- Public gallery listing |
| | `src/app/(shop)/gallery/[slug]/page.tsx` -- Single gallery view |
| | `src/app/(shop)/portfolio/page.tsx` -- Portfolio listing (uses gallery under the hood) |
| | `src/app/(shop)/portfolio/[slug]/page.tsx` -- Portfolio project detail |
| **Files to Modify** | `src/app/admin/medias/` -- Add galleries sub-nav |
| | `src/lib/admin/outlook-nav.ts` -- Add gallery pages |
| | Page builder sections -- Add gallery section type to builder |
| | `src/i18n/locales/*.json` -- Add gallery namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model Gallery {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  layout      String   @default("grid") // grid, masonry, slider
  category    String?
  coverImageUrl String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  images      GalleryImage[]

  @@unique([tenantId, slug])
  @@index([tenantId, active])
}

model GalleryImage {
  id          String   @id @default(cuid())
  galleryId   String
  imageUrl    String
  thumbnailUrl String?
  title       String?
  description String?
  altText     String?
  sortOrder   Int      @default(0)
  width       Int?
  height      Int?
  createdAt   DateTime @default(now())
  gallery     Gallery  @relation(fields: [galleryId], references: [id], onDelete: Cascade)

  @@index([galleryId, sortOrder])
}
```

| **API Endpoints** | 3 admin routes + 1 public route (see files above) |
|---|---|
| **Estimated Effort** | 32 hours |
| **Dependencies** | Media management (existing) |
| **Risk Level** | Low -- standalone component-based feature |
| **Rollback Plan** | Remove gallery pages and components. Existing media system untouched. |

---

### Phase 2 Summary

| Feature | Hours | Risk | Dependencies |
|---------|-------|------|-------------|
| 2.1 Booking & Scheduling | 80 | Medium | Stripe, Telnyx, Email (existing) |
| 2.2 Membership & Paywall | 48 | Low | Stripe subscriptions (existing) |
| 2.3 Enhanced Form Builder | 40 | Low | Stripe, CRM (existing) |
| 2.4 Dynamic Content Collections | 56 | Medium | Phase 1.3 |
| 2.5 Image Gallery & Portfolio | 32 | Low | Media management (existing) |
| **Phase 2 Total** | **256 hours** | | |

---

## Phase 3: Core Feature Gaps -- Medium Risk

**Timeline**: Weeks 6-8 (15 business days)
**Goal**: Close medium-complexity gaps that require third-party integrations or new architectural patterns

---

### 3.1 App/Plugin Marketplace Architecture (Gap G3, Impact 9/10)

**What Exists (PRESERVE)**:
- OAuth system (`src/lib/auth/` -- existing OAuth2 provider integration)
- Webhook system (`src/app/api/webhooks/` -- existing webhook handling)
- Module-based architecture (tenants already enable/disable modules)
- API routes structure (`src/app/api/` -- ~1048 existing routes)

**What to Build**:
Phase 1 of the app marketplace: Zapier/Make connector (instant 5000+ integrations) + integration hub for 10-20 curated native integrations + plugin SDK foundation.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/integrations/integration-hub.ts` -- Core integration registry and management |
| | `src/lib/integrations/webhook-dispatcher.ts` -- Event-driven webhook dispatcher for integrations |
| | `src/lib/integrations/zapier-connector.ts` -- Zapier trigger/action/search definitions |
| | `src/lib/integrations/make-connector.ts` -- Make (Integromat) module definitions |
| | `src/lib/integrations/plugin-sdk.ts` -- Plugin SDK: lifecycle hooks, data access, UI extension points |
| | `src/lib/integrations/oauth-provider.ts` -- OAuth2 provider for third-party apps |
| | `src/lib/integrations/app-sandbox.ts` -- Sandboxed execution environment for plugins |
| | `src/app/api/admin/integrations/route.ts` -- List available/installed integrations |
| | `src/app/api/admin/integrations/[id]/route.ts` -- Get/install/uninstall integration |
| | `src/app/api/admin/integrations/[id]/configure/route.ts` -- Configure integration settings |
| | `src/app/api/admin/integrations/[id]/logs/route.ts` -- Integration execution logs |
| | `src/app/api/integrations/zapier/triggers/route.ts` -- Zapier triggers endpoint |
| | `src/app/api/integrations/zapier/actions/route.ts` -- Zapier actions endpoint |
| | `src/app/api/integrations/webhook/[integrationId]/route.ts` -- Incoming webhook receiver |
| | `src/app/api/integrations/oauth/authorize/route.ts` -- OAuth2 authorization endpoint |
| | `src/app/api/integrations/oauth/token/route.ts` -- OAuth2 token endpoint |
| | `src/app/admin/integrations/page.tsx` -- Integration hub dashboard |
| | `src/app/admin/integrations/marketplace/page.tsx` -- Browse available integrations |
| | `src/app/admin/integrations/installed/page.tsx` -- Manage installed integrations |
| | `src/app/admin/integrations/[id]/page.tsx` -- Integration detail and configuration |
| | `src/app/admin/integrations/logs/page.tsx` -- Integration logs |
| | `src/components/integrations/IntegrationCard.tsx` -- Integration listing card |
| | `src/components/integrations/IntegrationConfigForm.tsx` -- Dynamic config form |
| | `src/components/integrations/IntegrationStatusBadge.tsx` -- Status indicator |
| | `data/integrations/google-calendar.json` -- Google Calendar integration config |
| | `data/integrations/mailchimp.json` -- Mailchimp integration config |
| | `data/integrations/slack.json` -- Slack integration config |
| | `data/integrations/quickbooks.json` -- QuickBooks integration config |
| | `data/integrations/whatsapp.json` -- WhatsApp Business integration config |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add integrations to admin navigation |
| | `src/lib/admin/outlook-nav.ts` -- Add integration pages to nav tree |
| | `src/i18n/locales/*.json` -- Add integrations namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model Integration {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  icon        String?
  category    String   // communication, marketing, accounting, shipping, crm, productivity
  type        String   // native, zapier, webhook, oauth
  config      Json     // Integration definition (triggers, actions, fields)
  active      Boolean  @default(true)
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  installations TenantIntegration[]
}

model TenantIntegration {
  id             String   @id @default(cuid())
  tenantId       String
  integrationId  String
  config         Json?    // Tenant-specific configuration (API keys, settings)
  credentials    Json?    // Encrypted OAuth tokens
  status         String   @default("active") // active, paused, error
  lastSyncAt     DateTime?
  errorMessage   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  tenant         Tenant      @relation(fields: [tenantId], references: [id])
  integration    Integration @relation(fields: [integrationId], references: [id])
  logs           IntegrationLog[]

  @@unique([tenantId, integrationId])
  @@index([tenantId, status])
}

model IntegrationLog {
  id                    String   @id @default(cuid())
  tenantIntegrationId   String
  event                 String   // trigger_fired, action_executed, error, sync
  direction             String   // inbound, outbound
  payload               Json?
  response              Json?
  status                String   // success, error
  durationMs            Int?
  createdAt             DateTime @default(now())
  tenantIntegration     TenantIntegration @relation(fields: [tenantIntegrationId], references: [id], onDelete: Cascade)

  @@index([tenantIntegrationId, createdAt])
}
```

| **API Endpoints** | 6 admin routes + 4 integration API routes (see files above) |
|---|---|
| **Estimated Effort** | 96 hours |
| **Dependencies** | OAuth (existing), webhooks (existing) |
| **Risk Level** | High -- OAuth provider, sandbox, and third-party API contracts |
| **Rollback Plan** | Module-based. Integration hub is optional module. Zapier connector can be unpublished independently. |

---

### 3.2 Enhanced SEO Automation (Gap G12 + Tech Research #6)

**What Exists (PRESERVE)**:
- Built-in SEO tools (meta tags, sitemaps, canonical tags, clean URLs, redirects, robots.txt)
- AI SEO optimization via Aurelia
- Image SEO (alt text management)
- Google Analytics + Facebook Pixel integration

**What to Build**:
Auto-generated structured data (Schema.org JSON-LD), IndexNow instant indexing, SEO audit tool, and GEO (Generative Engine Optimization) for AI search engines.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/seo/structured-data.ts` -- Auto-generate JSON-LD for Product, Offer, Article, FAQ, BreadcrumbList, LocalBusiness, Event, Course, Organization |
| | `src/lib/seo/indexnow.ts` -- IndexNow integration for instant search engine notification |
| | `src/lib/seo/seo-auditor.ts` -- Page-by-page SEO audit (title length, meta desc, headings, images, internal links) |
| | `src/lib/seo/ai-meta-generator.ts` -- AI-powered meta title/description generation |
| | `src/lib/seo/geo-optimizer.ts` -- GEO optimization: ensure content is structured for AI engines (FAQ schemas, entity markup) |
| | `src/lib/seo/crawl-analyzer.ts` -- Bot crawl log analysis (parse server logs for crawler activity) |
| | `src/app/api/admin/seo/audit/route.ts` -- Run SEO audit on tenant site |
| | `src/app/api/admin/seo/structured-data/route.ts` -- Preview/configure structured data |
| | `src/app/api/admin/seo/indexnow/route.ts` -- Trigger IndexNow ping for specific pages |
| | `src/app/api/admin/seo/ai-generate/route.ts` -- Generate meta tags with AI |
| | `src/app/api/cron/seo-indexnow/route.ts` -- Cron: notify IndexNow of new/updated pages |
| | `src/app/admin/seo/page.tsx` -- SEO dashboard with audit scores |
| | `src/app/admin/seo/audit/page.tsx` -- Detailed audit results |
| | `src/app/admin/seo/structured-data/page.tsx` -- Structured data management |
| | `src/app/admin/seo/ai-optimizer/page.tsx` -- AI meta generation tool |
| | `src/components/seo/StructuredDataPreview.tsx` -- JSON-LD preview component |
| | `src/components/seo/SeoScoreCard.tsx` -- Page SEO score visualization |
| | `src/components/seo/MetaTagEditor.tsx` -- Enhanced meta tag editor with AI suggestions |
| **Files to Modify** | `src/app/(shop)/layout.tsx` -- Inject JSON-LD structured data into all pages |
| | `src/app/(shop)/products/[slug]/page.tsx` -- Add Product + Offer structured data |
| | `src/app/(shop)/blog/[slug]/page.tsx` -- Add Article structured data |
| | `src/app/(shop)/faq/page.tsx` -- Add FAQ structured data |
| | `src/app/admin/seo/` -- Enhance existing SEO admin pages |
| | `src/i18n/locales/*.json` -- Add seo namespace keys (all 22 locales) |
| **Prisma Schema Changes** | None (structured data generated dynamically from existing models) |
| **API Endpoints** | 4 admin routes + 1 cron route (see files above) |
| **Estimated Effort** | 48 hours |
| **Dependencies** | None (uses existing product/blog/page data) |
| **Risk Level** | Low -- read-only enhancements to existing pages |
| **Rollback Plan** | Remove JSON-LD injection from layout. SEO features are additive. |

---

### 3.3 A/B Testing Engine (Gap G20, Impact 6/10)

**What Exists (PRESERVE)**:
- Email campaigns (`src/app/admin/emails/` -- campaign management)
- Analytics system (`src/app/admin/analytics/` -- traffic and conversion tracking)
- Heatmaps (already built-in)
- Feature flags (none currently -- this is new)

**What to Build**:
A/B testing starting with email campaigns (lower risk), then expanding to page sections. Statistical significance engine, results dashboard.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/ab-testing/ab-engine.ts` -- Core A/B test assignment (deterministic hash-based, no flicker) |
| | `src/lib/ab-testing/statistical-engine.ts` -- Bayesian significance calculator (credible intervals, early stopping) |
| | `src/lib/ab-testing/ab-results.ts` -- Aggregate results by variant (conversions, clicks, revenue) |
| | `src/lib/ab-testing/ab-middleware.ts` -- Edge middleware for page variant assignment (cookie-based) |
| | `src/app/api/admin/ab-tests/route.ts` -- CRUD A/B tests |
| | `src/app/api/admin/ab-tests/[id]/route.ts` -- Get/update/stop test |
| | `src/app/api/admin/ab-tests/[id]/results/route.ts` -- Get test results with statistics |
| | `src/app/api/ab-tests/track/route.ts` -- Track conversion event for a test |
| | `src/app/admin/ab-tests/page.tsx` -- A/B testing dashboard |
| | `src/app/admin/ab-tests/create/page.tsx` -- Create new A/B test |
| | `src/app/admin/ab-tests/[id]/page.tsx` -- Test results and management |
| | `src/components/ab-testing/VariantEditor.tsx` -- Side-by-side variant editor |
| | `src/components/ab-testing/ResultsChart.tsx` -- Conversion comparison chart |
| | `src/components/ab-testing/SignificanceIndicator.tsx` -- Statistical significance badge |
| **Files to Modify** | `src/app/admin/emails/` -- Add A/B variant support to email campaigns |
| | `src/middleware.ts` -- Add A/B test variant assignment |
| | `src/i18n/locales/*.json` -- Add ab-testing namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model AbTest {
  id           String   @id @default(cuid())
  tenantId     String
  name         String
  type         String   // email, page_section, checkout, pricing
  status       String   @default("draft") // draft, running, paused, completed
  targetMetric String   // click_rate, conversion_rate, revenue, bounce_rate
  trafficSplit Json     // [{variant: "control", weight: 50}, {variant: "B", weight: 50}]
  variants     Json     // [{id: "control", config: {...}}, {id: "B", config: {...}}]
  startedAt    DateTime?
  endedAt      DateTime?
  winnerId     String?  // Winning variant ID
  minSampleSize Int     @default(100)
  confidenceLevel Decimal @default(0.95) @db.Decimal(3, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  events       AbTestEvent[]

  @@index([tenantId, status])
}

model AbTestEvent {
  id        String   @id @default(cuid())
  testId    String
  variantId String
  visitorId String   // Anonymous cookie-based ID
  eventType String   // impression, click, conversion, revenue
  value     Decimal? @db.Decimal(10, 2) // Revenue value for revenue events
  metadata  Json?
  createdAt DateTime @default(now())
  test      AbTest   @relation(fields: [testId], references: [id], onDelete: Cascade)

  @@index([testId, variantId, eventType])
  @@index([createdAt])
}
```

| **API Endpoints** | 3 admin routes + 1 public tracking route (see files above) |
|---|---|
| **Estimated Effort** | 56 hours |
| **Dependencies** | Email campaigns (existing), analytics (existing) |
| **Risk Level** | Medium -- statistical engine requires careful validation |
| **Rollback Plan** | Stop all running tests. Remove middleware variant assignment. All pages revert to default. |

---

### 3.4 Conversion Optimization Tools

**What Exists (PRESERVE)**:
- Heatmaps (already built-in)
- Abandoned cart recovery (existing)
- Upselling/cross-selling (existing)
- Banner/promotion popups (existing)
- Coupons and discount codes (existing)

**What to Build**:
Express checkout (buy now), social proof notifications, exit-intent popups, and urgency indicators.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/conversion/express-checkout.ts` -- Skip-cart direct-to-checkout for single items |
| | `src/lib/conversion/social-proof.ts` -- Real-time social proof notifications ("X just bought Y") |
| | `src/lib/conversion/exit-intent.ts` -- Exit-intent detection and popup trigger |
| | `src/lib/conversion/urgency-engine.ts` -- Stock countdown, timer countdown, limited offer indicators |
| | `src/components/conversion/BuyNowButton.tsx` -- Express checkout button component |
| | `src/components/conversion/SocialProofToast.tsx` -- Toast notification for recent purchases |
| | `src/components/conversion/ExitIntentPopup.tsx` -- Exit-intent popup with configurable offer |
| | `src/components/conversion/UrgencyBadge.tsx` -- "Only X left!" / countdown timer badge |
| | `src/components/conversion/StickyAddToCart.tsx` -- Sticky add-to-cart bar on scroll |
| | `src/app/api/admin/conversion/settings/route.ts` -- Configure conversion tools |
| | `src/app/api/conversion/social-proof/route.ts` -- Get recent purchases for social proof |
| | `src/app/admin/conversion/page.tsx` -- Conversion tools dashboard |
| **Files to Modify** | `src/app/(shop)/products/[slug]/page.tsx` -- Add BuyNow button, urgency badge, sticky cart |
| | `src/app/(shop)/layout.tsx` -- Add SocialProofToast and ExitIntentPopup |
| | `src/app/(shop)/checkout/page.tsx` -- Handle express checkout flow |
| | `src/i18n/locales/*.json` -- Add conversion namespace keys (all 22 locales) |
| **Prisma Schema Changes** | None (uses existing Order data, configured via Tenant settings JSON) |
| **API Endpoints** | 1 admin settings route + 1 public social proof route |
| **Estimated Effort** | 32 hours |
| **Dependencies** | Checkout system (existing), product catalog (existing) |
| **Risk Level** | Low -- UI components only, no data model changes |
| **Rollback Plan** | Remove components from layouts. Feature-flagged in tenant settings. |

---

### 3.5 Enhanced Analytics Dashboard

**What Exists (PRESERVE)**:
- Traffic analytics (`src/app/admin/analytics/`)
- Commerce/sales analytics
- Acquisition source tracking
- Engagement analytics
- Google Analytics + Facebook Pixel integration
- Heatmaps
- Real-time analytics

**What to Build**:
Site speed dashboard (Core Web Vitals), funnel visualization, cohort analysis enhancement, and AI insights.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/analytics/core-web-vitals.ts` -- Collect and report CWV (LCP, FID, CLS, INP, TTFB) via web-vitals library |
| | `src/lib/analytics/funnel-analyzer.ts` -- Visual funnel: visit -> product view -> add to cart -> checkout -> purchase |
| | `src/lib/analytics/ai-insights.ts` -- AI-generated weekly insights ("Sales up 15% -- here's why") |
| | `src/lib/analytics/benchmark-service.ts` -- Compare tenant metrics to industry averages |
| | `src/app/api/admin/analytics/web-vitals/route.ts` -- CWV data endpoint |
| | `src/app/api/admin/analytics/funnels/route.ts` -- Funnel analysis endpoint |
| | `src/app/api/admin/analytics/ai-insights/route.ts` -- AI insights endpoint |
| | `src/app/api/analytics/web-vitals/route.ts` -- Public: report CWV from client |
| | `src/app/admin/analytics/performance/page.tsx` -- Site speed / Core Web Vitals dashboard |
| | `src/app/admin/analytics/funnels/page.tsx` -- Funnel analysis page |
| | `src/app/admin/analytics/insights/page.tsx` -- AI insights page |
| | `src/components/analytics/WebVitalsChart.tsx` -- CWV gauge charts |
| | `src/components/analytics/FunnelVisualization.tsx` -- Stepped funnel chart |
| | `src/components/analytics/AIInsightCard.tsx` -- AI insight card with explanation |
| **Files to Modify** | `src/app/admin/analytics/layout.tsx` -- Add new analytics sub-pages to nav |
| | `src/app/(shop)/layout.tsx` -- Add web-vitals reporting script |
| | `src/i18n/locales/*.json` -- Add analytics namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model WebVitalsReport {
  id        String   @id @default(cuid())
  tenantId  String
  url       String
  metric    String   // LCP, FID, CLS, INP, TTFB
  value     Float
  rating    String   // good, needs-improvement, poor
  deviceType String  // mobile, desktop
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId, metric, createdAt])
}
```

| **API Endpoints** | 3 admin routes + 1 public reporting route |
|---|---|
| **Estimated Effort** | 40 hours |
| **Dependencies** | Existing analytics system |
| **Risk Level** | Low -- additive analytics, no existing functionality changed |
| **Rollback Plan** | Remove new analytics pages. Existing analytics untouched. |

---

### Phase 3 Summary

| Feature | Hours | Risk | Dependencies |
|---------|-------|------|-------------|
| 3.1 App/Plugin Marketplace | 96 | High | OAuth, webhooks (existing) |
| 3.2 Enhanced SEO Automation | 48 | Low | Existing product/blog data |
| 3.3 A/B Testing Engine | 56 | Medium | Email campaigns, analytics (existing) |
| 3.4 Conversion Optimization | 32 | Low | Checkout, products (existing) |
| 3.5 Enhanced Analytics Dashboard | 40 | Low | Existing analytics |
| **Phase 3 Total** | **272 hours** | | |

---

## Phase 4: Advanced Features

**Timeline**: Weeks 9-12 (20 business days)
**Goal**: Build differentiating advanced features that elevate Koraline above competitors

---

### 4.1 AI-Powered Design Suggestions (Tech Research #1 & #8)

**What Exists (PRESERVE)**:
- Aurelia AI system (text generation, product descriptions, SEO optimization)
- Page builder from Phase 1
- Template system from Phase 1
- AI image generation (DALL-E 3 integration via Aurelia)

**What to Build**:
AI layout suggestions by industry vertical, AI color palette generation, AI content rewriting, and prompt-to-section generation.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/ai-design/layout-suggester.ts` -- Suggest optimal section layouts based on industry and page purpose |
| | `src/lib/ai-design/color-generator.ts` -- AI-generated color palettes from brand description or logo |
| | `src/lib/ai-design/prompt-to-section.ts` -- Generate a complete page section from natural language ("add a pricing table with 3 tiers") |
| | `src/lib/ai-design/accessibility-checker.ts` -- AI-powered accessibility audit (color contrast, alt text, heading hierarchy) |
| | `src/lib/ai-design/design-tokens-generator.ts` -- Generate design tokens (fonts, spacing, colors) from brand brief |
| | `src/app/api/admin/ai-design/suggest-layout/route.ts` -- Get layout suggestions |
| | `src/app/api/admin/ai-design/generate-section/route.ts` -- Generate section from prompt |
| | `src/app/api/admin/ai-design/generate-palette/route.ts` -- Generate color palette |
| | `src/app/api/admin/ai-design/check-accessibility/route.ts` -- Run accessibility check |
| | `src/app/api/admin/ai-design/logo-maker/route.ts` -- AI logo generation (Gap G24) |
| | `src/components/ai-design/AISuggestionPanel.tsx` -- Side panel with AI suggestions |
| | `src/components/ai-design/PromptToSectionInput.tsx` -- Natural language section generator |
| | `src/components/ai-design/ColorPalettePicker.tsx` -- AI-generated palette selector |
| | `src/components/ai-design/AccessibilityReport.tsx` -- Accessibility audit results |
| | `src/components/ai-design/LogoMaker.tsx` -- AI logo generation interface |
| **Files to Modify** | `src/components/page-builder/SectionToolbar.tsx` -- Add "AI Suggest" button |
| | `src/app/admin/contenu/page-builder/page.tsx` -- Integrate AI suggestion panel |
| | `src/i18n/locales/*.json` -- Add ai-design namespace keys (all 22 locales) |
| **Prisma Schema Changes** | None (AI results are ephemeral, applied to existing models) |
| **API Endpoints** | 5 admin routes (see files above) |
| **Estimated Effort** | 48 hours |
| **Dependencies** | Phase 1.1 (Page Builder), Aurelia AI (existing) |
| **Risk Level** | Medium -- AI output quality requires tuning and guardrails |
| **Rollback Plan** | AI features are optional panel. Page builder works without AI suggestions. |

---

### 4.2 Real-Time Collaboration (Tech Research #4)

**What Exists (PRESERVE)**:
- Multi-user/staff accounts (existing role-based access)
- Roles and permissions
- Admin dashboard

**What to Build**:
Real-time collaborative editing using Liveblocks/Yjs for agency/team plans. Presence indicators, cursors, live comments.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/collaboration/room-manager.ts` -- Collaboration room lifecycle (create, join, leave) |
| | `src/lib/collaboration/presence-service.ts` -- Track who is viewing/editing which page |
| | `src/lib/collaboration/yjs-provider.ts` -- Yjs document provider for CRDT-based sync |
| | `src/lib/collaboration/comment-service.ts` -- In-context commenting on page sections |
| | `src/app/api/admin/collaboration/rooms/route.ts` -- List active collaboration rooms |
| | `src/app/api/admin/collaboration/comments/route.ts` -- CRUD page comments |
| | `src/app/api/admin/collaboration/presence/route.ts` -- Presence heartbeat endpoint |
| | `src/components/collaboration/PresenceIndicator.tsx` -- Show who is currently editing |
| | `src/components/collaboration/CollaboratorCursors.tsx` -- Live cursor positions |
| | `src/components/collaboration/PageComments.tsx` -- Comment thread on page sections |
| | `src/components/collaboration/ActivityFeed.tsx` -- Recent edits feed |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add presence indicators |
| | `src/components/page-builder/` -- Integrate collaborative editing |
| | `package.json` -- Add `yjs`, `@liveblocks/react`, `@liveblocks/node` |
| | `src/i18n/locales/*.json` -- Add collaboration namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model PageComment {
  id          String   @id @default(cuid())
  tenantId    String
  pageId      String
  sectionId   String?  // Optional: comment on specific section
  userId      String
  content     String
  resolved    Boolean  @default(false)
  parentId    String?  // Reply threading
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  parent      PageComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies     PageComment[] @relation("CommentReplies")

  @@index([tenantId, pageId])
}
```

| **API Endpoints** | 3 admin routes (see files above) |
|---|---|
| **Estimated Effort** | 64 hours |
| **Dependencies** | Phase 1.1 (Page Builder), Liveblocks account |
| **Risk Level** | High -- CRDT sync is complex, requires thorough testing |
| **Rollback Plan** | Collaboration is opt-in per tenant plan (agency/enterprise). Single-user editing always works. |

---

### 4.3 Mobile App Generation (PWA) (Gap G10, Impact 7/10)

**What Exists (PRESERVE)**:
- Responsive design (all pages are already responsive)
- Mobile-optimized checkout
- Next.js app (PWA-ready architecture)

**What to Build**:
PWA (Progressive Web App) support for tenant storefronts + admin. Service worker for offline, push notifications, add-to-homescreen. Faster to ship than native app.

| Item | Detail |
|------|--------|
| **Files to Create** | `public/sw.js` -- Service worker for offline caching, push notifications |
| | `public/manifest.json` -- PWA manifest template (dynamic per tenant) |
| | `src/lib/pwa/pwa-manifest-generator.ts` -- Generate tenant-specific manifest.json |
| | `src/lib/pwa/push-notification-service.ts` -- Web Push notification sending (VAPID keys) |
| | `src/lib/pwa/offline-cache-strategy.ts` -- Cache strategy definitions (network-first for API, cache-first for assets) |
| | `src/app/api/admin/pwa/settings/route.ts` -- Configure PWA settings (name, icon, colors, push) |
| | `src/app/api/admin/pwa/push/route.ts` -- Send push notification to subscribers |
| | `src/app/api/pwa/manifest/route.ts` -- Dynamic manifest.json per tenant |
| | `src/app/api/pwa/subscribe/route.ts` -- Register push notification subscription |
| | `src/app/api/pwa/push/route.ts` -- Receive push subscription |
| | `src/app/admin/pwa/page.tsx` -- PWA settings and push notification management |
| | `src/components/pwa/InstallPrompt.tsx` -- Add-to-homescreen prompt |
| | `src/components/pwa/OfflineIndicator.tsx` -- Offline status indicator |
| | `src/components/pwa/PushOptIn.tsx` -- Push notification opt-in prompt |
| **Files to Modify** | `src/app/layout.tsx` -- Add manifest link, service worker registration |
| | `src/app/(shop)/layout.tsx` -- Add InstallPrompt and OfflineIndicator |
| | `next.config.js` -- Add PWA headers |
| | `src/i18n/locales/*.json` -- Add pwa namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model PushSubscription {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String?
  endpoint    String
  keys        Json     // p256dh and auth keys
  userAgent   String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])

  @@unique([endpoint])
  @@index([tenantId, active])
}
```

| **API Endpoints** | 2 admin routes + 3 public routes (see files above) |
|---|---|
| **Estimated Effort** | 40 hours |
| **Dependencies** | None |
| **Risk Level** | Low -- PWA is progressive enhancement, falls back gracefully |
| **Rollback Plan** | Remove service worker registration. Site continues working as standard web app. |

---

### 4.4 Advanced E-Commerce Enhancements

**What Exists (PRESERVE)**:
- Full e-commerce suite (products, orders, checkout, cart, payments)
- Stripe integration
- Multi-currency support
- Abandoned cart recovery
- Gift cards, subscriptions, bundles
- B2B/wholesale

**What to Build**:
BNPL (Gap G7), express checkout (Gap G21), real-time carrier rates (Gap G9), and return management (Gap G19).

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/payments/bnpl-service.ts` -- Enable Klarna/Afterpay via Stripe PaymentIntents |
| | `src/lib/shipping/carrier-rates.ts` -- Real-time shipping rate calculation (Canada Post, UPS, FedEx via ShipStation API) |
| | `src/lib/shipping/label-service.ts` -- Discounted shipping label purchase |
| | `src/lib/returns/return-service.ts` -- RMA creation, return label generation, refund processing |
| | `src/app/api/admin/returns/route.ts` -- Admin return management |
| | `src/app/api/admin/returns/[id]/route.ts` -- Process individual return |
| | `src/app/api/admin/shipping/carriers/route.ts` -- Configure carrier accounts |
| | `src/app/api/admin/shipping/labels/route.ts` -- Purchase shipping labels |
| | `src/app/api/shipping/rates/route.ts` -- Public: get real-time shipping rates at checkout |
| | `src/app/api/returns/create/route.ts` -- Public: customer initiates return |
| | `src/app/api/returns/[id]/route.ts` -- Public: return status |
| | `src/app/admin/livraison/carriers/page.tsx` -- Carrier configuration |
| | `src/app/admin/livraison/labels/page.tsx` -- Label management |
| | `src/app/admin/commandes/returns/page.tsx` -- Return management dashboard |
| | `src/app/(shop)/account/returns/page.tsx` -- Customer self-service returns |
| | `src/app/(shop)/account/returns/[id]/page.tsx` -- Return detail/status |
| | `src/components/checkout/BNPLOptions.tsx` -- BNPL payment method selector |
| | `src/components/checkout/CarrierRateSelector.tsx` -- Real-time shipping rate picker |
| | `src/components/checkout/ExpressCheckoutButton.tsx` -- Buy Now / Express checkout |
| | `src/components/returns/ReturnForm.tsx` -- Return request form |
| | `src/components/returns/ReturnStatus.tsx` -- Return tracking status |
| **Files to Modify** | `src/app/(shop)/checkout/page.tsx` -- Add BNPL options and carrier rates |
| | `src/app/(shop)/products/[slug]/page.tsx` -- Add Express Checkout button |
| | `src/lib/stripe-attitudes.ts` -- Add BNPL payment method types |
| | `src/app/admin/commandes/layout.tsx` -- Add returns to order nav |
| | `src/app/(shop)/account/layout.tsx` -- Add returns to account nav |
| | `src/i18n/locales/*.json` -- Add shipping/returns namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model ReturnRequest {
  id            String   @id @default(cuid())
  tenantId      String
  orderId       String
  customerId    String
  reason        String
  description   String?
  status        String   @default("pending") // pending, approved, rejected, received, refunded
  items         Json     // [{productId, quantity, reason}]
  returnLabelUrl String?
  trackingNumber String?
  refundAmount  Decimal? @db.Decimal(10, 2)
  refundId      String?  // Stripe refund ID
  approvedAt    DateTime?
  receivedAt    DateTime?
  refundedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  order         Order    @relation(fields: [orderId], references: [id])

  @@index([tenantId, status])
  @@index([orderId])
}

model CarrierAccount {
  id          String   @id @default(cuid())
  tenantId    String
  carrier     String   // canadapost, ups, fedex, purolator
  accountId   String
  credentials Json     // Encrypted carrier API credentials
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, carrier])
}
```

| **API Endpoints** | 4 admin routes + 3 public routes (see files above) |
|---|---|
| **Estimated Effort** | 72 hours |
| **Dependencies** | Stripe (existing), order system (existing), Shipstation/Shippo API |
| **Risk Level** | Medium -- carrier API contracts, label pricing |
| **Rollback Plan** | Each sub-feature is independent. BNPL disabled by removing payment methods. Carrier rates fall back to flat-rate. Returns module disabled per tenant. |

---

### 4.5 Enhanced Marketing Automation

**What Exists (PRESERVE)**:
- Email campaigns with templates and flows
- Audience segmentation
- SMS marketing via Telnyx
- Mailing list management
- Banner/popup promotions
- Social ads integration (6 platforms)

**What to Build**:
Visual workflow automation builder (Gap G13), social commerce sync (Gap G6), and affiliate marketing system (Gap G22).

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/workflows/workflow-engine.ts` -- Event-driven workflow execution engine (Redis + BullMQ) |
| | `src/lib/workflows/workflow-builder.ts` -- Workflow definition schema (triggers, conditions, actions) |
| | `src/lib/workflows/triggers.ts` -- Trigger registry: order_placed, cart_abandoned, form_submitted, user_registered, booking_created, etc. |
| | `src/lib/workflows/actions.ts` -- Action registry: send_email, send_sms, add_tag, update_field, wait, webhook, create_task, etc. |
| | `src/lib/social-commerce/catalog-sync.ts` -- Product catalog sync to Facebook/Instagram/TikTok/Google Merchant |
| | `src/lib/social-commerce/order-import.ts` -- Import orders from social channels |
| | `src/lib/affiliate/affiliate-service.ts` -- Affiliate tracking links, commission calculation, payouts |
| | `src/app/api/admin/workflows/route.ts` -- CRUD workflows |
| | `src/app/api/admin/workflows/[id]/route.ts` -- Get/update/activate workflow |
| | `src/app/api/admin/workflows/[id]/logs/route.ts` -- Workflow execution logs |
| | `src/app/api/admin/social-commerce/catalogs/route.ts` -- Manage catalog syncs |
| | `src/app/api/admin/social-commerce/sync/route.ts` -- Trigger catalog sync |
| | `src/app/api/admin/affiliates/route.ts` -- Manage affiliates |
| | `src/app/api/admin/affiliates/[id]/route.ts` -- Affiliate detail |
| | `src/app/api/admin/affiliates/commissions/route.ts` -- Commission reports |
| | `src/app/api/affiliates/track/route.ts` -- Public: affiliate link tracking |
| | `src/app/api/affiliates/apply/route.ts` -- Public: apply to be an affiliate |
| | `src/app/admin/workflows/page.tsx` -- Workflow automation dashboard |
| | `src/app/admin/workflows/builder/page.tsx` -- Visual workflow builder (React Flow) |
| | `src/app/admin/workflows/[id]/page.tsx` -- Workflow detail and logs |
| | `src/app/admin/social-commerce/page.tsx` -- Social commerce dashboard |
| | `src/app/admin/social-commerce/catalogs/page.tsx` -- Catalog sync management |
| | `src/app/admin/affiliates/page.tsx` -- Affiliate management dashboard |
| | `src/app/admin/affiliates/[id]/page.tsx` -- Affiliate detail |
| | `src/app/(shop)/affiliates/apply/page.tsx` -- Public affiliate application |
| | `src/app/(shop)/affiliates/dashboard/page.tsx` -- Affiliate self-service dashboard |
| | `src/components/workflows/WorkflowCanvas.tsx` -- Visual workflow editor (React Flow based) |
| | `src/components/workflows/TriggerNode.tsx` -- Trigger node component |
| | `src/components/workflows/ActionNode.tsx` -- Action node component |
| | `src/components/workflows/ConditionNode.tsx` -- Conditional branch node |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add workflows, social commerce, affiliates to nav |
| | `src/lib/admin/outlook-nav.ts` -- Add new pages to nav tree |
| | `package.json` -- Add `reactflow`, `bullmq` |
| | `src/i18n/locales/*.json` -- Add workflows/social-commerce/affiliates namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model Workflow {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  trigger     Json     // {type: "order_placed", conditions: [...]}
  steps       Json     // [{type: "send_email", config: {...}}, {type: "wait", duration: "1d"}, ...]
  status      String   @default("draft") // draft, active, paused
  executionCount Int   @default(0)
  lastExecutedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  logs        WorkflowLog[]

  @@index([tenantId, status])
}

model WorkflowLog {
  id         String   @id @default(cuid())
  workflowId String
  triggerId  String?  // ID of the entity that triggered (orderId, userId, etc.)
  step       Int
  action     String
  status     String   // success, error, skipped
  output     Json?
  error      String?
  duration   Int?     // ms
  createdAt  DateTime @default(now())
  workflow   Workflow  @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([workflowId, createdAt])
}

model Affiliate {
  id             String   @id @default(cuid())
  tenantId       String
  userId         String?
  name           String
  email          String
  code           String   @unique // Unique referral code
  commissionRate Decimal  @db.Decimal(5, 2) // Percentage
  status         String   @default("pending") // pending, approved, rejected, suspended
  totalEarned    Decimal  @default(0) @db.Decimal(10, 2)
  totalPaid      Decimal  @default(0) @db.Decimal(10, 2)
  clicks         Int      @default(0)
  conversions    Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  user           User?    @relation(fields: [userId], references: [id])
  commissions    AffiliateCommission[]

  @@index([tenantId, status])
  @@index([code])
}

model AffiliateCommission {
  id          String   @id @default(cuid())
  affiliateId String
  orderId     String
  amount      Decimal  @db.Decimal(10, 2)
  status      String   @default("pending") // pending, approved, paid
  paidAt      DateTime?
  createdAt   DateTime @default(now())
  affiliate   Affiliate @relation(fields: [affiliateId], references: [id])

  @@index([affiliateId, status])
}

model SocialCatalog {
  id          String   @id @default(cuid())
  tenantId    String
  platform    String   // facebook, instagram, tiktok, google_merchant
  catalogId   String?  // Platform catalog ID
  status      String   @default("pending") // pending, syncing, synced, error
  lastSyncAt  DateTime?
  productCount Int     @default(0)
  errorMessage String?
  config      Json?    // Platform-specific config
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, platform])
}
```

| **API Endpoints** | 7 admin routes + 2 public routes (see files above) |
|---|---|
| **Estimated Effort** | 96 hours |
| **Dependencies** | Email service (existing), BullMQ/Redis (existing), Facebook/Google/TikTok APIs |
| **Risk Level** | Medium-High -- social platform API changes frequently, workflow engine is complex |
| **Rollback Plan** | Each sub-feature independent. Workflows disabled per tenant. Social sync paused. Affiliate program deactivated. |

---

### Phase 4 Summary

| Feature | Hours | Risk | Dependencies |
|---------|-------|------|-------------|
| 4.1 AI Design Suggestions | 48 | Medium | Phase 1.1, Aurelia AI |
| 4.2 Real-Time Collaboration | 64 | High | Phase 1.1, Liveblocks |
| 4.3 PWA / Mobile App | 40 | Low | None |
| 4.4 Advanced E-Commerce | 72 | Medium | Stripe, ShipStation APIs |
| 4.5 Marketing Automation | 96 | Medium-High | Redis/BullMQ, social APIs |
| **Phase 4 Total** | **320 hours** | | |

---

## Phase 5: Innovation & Polish

**Timeline**: Weeks 13-15 (15 business days)
**Goal**: Add differentiating innovations and polish the entire platform

---

### 5.1 Voice UI Integration (Tech Research #5)

**What Exists (PRESERVE)**:
- Aurelia AI tutor with voice (Deepgram STT + ElevenLabs TTS already integrated)
- VoIP telephony module (Telnyx)
- Chatbot widget (Aurelia on storefront)

**What to Build**:
Voice commands for admin ("show today's orders"), voice search on storefronts, voice-to-content for product descriptions.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/voice/voice-command-parser.ts` -- Parse voice input into admin actions |
| | `src/lib/voice/voice-search.ts` -- Voice-activated product search |
| | `src/lib/voice/voice-to-content.ts` -- Dictate product descriptions/blog posts, Aurelia refines |
| | `src/components/voice/VoiceCommandButton.tsx` -- Admin voice command trigger |
| | `src/components/voice/VoiceSearchWidget.tsx` -- Storefront voice search |
| | `src/components/voice/VoiceDictation.tsx` -- Content dictation with AI refinement |
| | `src/app/api/admin/voice/command/route.ts` -- Process voice command |
| | `src/app/api/voice/search/route.ts` -- Process voice search query |
| **Files to Modify** | `src/app/admin/layout.tsx` -- Add VoiceCommandButton to admin header |
| | `src/app/(shop)/layout.tsx` -- Add VoiceSearchWidget option |
| | `src/i18n/locales/*.json` -- Add voice namespace keys (all 22 locales) |
| **Prisma Schema Changes** | None |
| **Estimated Effort** | 32 hours |
| **Dependencies** | Deepgram (existing), ElevenLabs (existing), Aurelia (existing) |
| **Risk Level** | Medium -- voice accuracy varies, needs fallback to text |
| **Rollback Plan** | Voice is opt-in. Remove voice buttons; text interface always available. |

---

### 5.2 AR/VR Web Components

**What Exists (PRESERVE)**:
- Product images and galleries
- 3D viewer (not currently implemented)

**What to Build**:
AR product preview using WebXR and model-viewer (Google's 3D/AR web component). Allow tenants to upload 3D models (.glb) and customers to see products in their space.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/components/ar/ProductARViewer.tsx` -- AR product viewer using `<model-viewer>` web component |
| | `src/components/ar/ARButton.tsx` -- "View in your space" button |
| | `src/lib/ar/model-processor.ts` -- Process and validate 3D model uploads (.glb, .gltf) |
| | `src/app/api/admin/products/[id]/3d-model/route.ts` -- Upload 3D model for product |
| | `src/app/admin/produits/[id]/3d-model/page.tsx` -- 3D model management page |
| **Files to Modify** | `src/app/(shop)/products/[slug]/page.tsx` -- Add AR viewer to product page |
| | `src/app/admin/produits/[id]/page.tsx` -- Add 3D model upload section |
| | `package.json` -- Add `@google/model-viewer` |
| | `src/i18n/locales/*.json` -- Add ar namespace keys (all 22 locales) |
| **Prisma Schema Changes** | Add to Product model: |

```prisma
// Add fields to existing Product model:
// model3dUrl    String?  // URL to .glb file
// arEnabled     Boolean  @default(false)
```

| **Estimated Effort** | 24 hours |
| **Dependencies** | Product catalog (existing) |
| **Risk Level** | Low -- model-viewer handles all complexity; progressive enhancement |
| **Rollback Plan** | Remove model-viewer component. Product pages show regular images. |

---

### 5.3 Advanced Personalization Engine

**What Exists (PRESERVE)**:
- Product recommendations (AI-based)
- Customer segmentation (CRM)
- Analytics tracking (behavior data)
- Aurelia AI (contextual intelligence)

**What to Build**:
Behavior-driven content personalization. Different visitors see different homepage sections, product recommendations, and CTAs based on their profile, history, and real-time behavior.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/personalization/visitor-profiler.ts` -- Build visitor profile from behavior signals (pages viewed, time on site, referrer, device, location) |
| | `src/lib/personalization/segment-matcher.ts` -- Match visitor to defined segments (new visitor, returning, high-value, cart abandoner, etc.) |
| | `src/lib/personalization/content-selector.ts` -- Select personalized content variant based on visitor segment |
| | `src/lib/personalization/recommendation-engine.ts` -- Enhanced product recommendations (collaborative filtering + content-based) |
| | `src/app/api/admin/personalization/segments/route.ts` -- Define visitor segments |
| | `src/app/api/admin/personalization/rules/route.ts` -- Define content personalization rules |
| | `src/app/api/personalization/profile/route.ts` -- Get/update visitor profile (cookie-based) |
| | `src/app/api/personalization/recommendations/route.ts` -- Get personalized recommendations |
| | `src/app/admin/personalization/page.tsx` -- Personalization dashboard |
| | `src/app/admin/personalization/segments/page.tsx` -- Segment management |
| | `src/app/admin/personalization/rules/page.tsx` -- Content rules management |
| | `src/components/personalization/PersonalizedSection.tsx` -- Wrapper that shows segment-appropriate content |
| | `src/components/personalization/SmartRecommendations.tsx` -- AI-driven product recommendations |
| **Files to Modify** | `src/app/(shop)/page.tsx` -- Wrap homepage sections with personalization |
| | `src/app/(shop)/products/[slug]/page.tsx` -- Add personalized recommendations |
| | `src/i18n/locales/*.json` -- Add personalization namespace keys (all 22 locales) |
| **Prisma Schema Changes** | |

```prisma
model PersonalizationSegment {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  conditions  Json     // [{field: "visit_count", operator: "gte", value: 3}, ...]
  priority    Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  rules       PersonalizationRule[]

  @@index([tenantId, active])
}

model PersonalizationRule {
  id          String   @id @default(cuid())
  tenantId    String
  segmentId   String
  contentType String   // page_section, product_recommendation, cta, banner
  contentId   String?  // ID of the content to show
  config      Json     // Rule-specific configuration
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  segment     PersonalizationSegment @relation(fields: [segmentId], references: [id], onDelete: Cascade)

  @@index([tenantId, contentType])
}
```

| **Estimated Effort** | 48 hours |
| **Dependencies** | Analytics (existing), product recommendations (existing) |
| **Risk Level** | Medium -- personalization logic must not slow page loads |
| **Rollback Plan** | Disable personalization rules per tenant. All visitors see default content. |

---

### 5.4 Performance Optimization (Core Web Vitals) (Tech Research #10)

**What Exists (PRESERVE)**:
- Next.js 15 with SSR
- Image optimization via next/image
- Code splitting (automatic)

**What to Build**:
Implement Partial Prerendering (PPR), Turbopack migration, React Server Components enforcement, and bundle optimization.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/performance/bundle-analyzer.ts` -- Automated bundle analysis and reporting |
| | `src/lib/performance/image-cdn-optimizer.ts` -- Ensure all tenant images serve via next/image with modern formats |
| | `scripts/analyze-bundle.ts` -- Bundle analysis script for CI |
| | `scripts/lighthouse-audit.ts` -- Automated Lighthouse CI audit |
| **Files to Modify** | `next.config.js` -- Enable PPR experimental flag, Turbopack, React Compiler preparation |
| | `src/app/(shop)/products/[slug]/page.tsx` -- Convert to PPR (static shell + dynamic pricing) |
| | `src/app/(shop)/page.tsx` -- Convert homepage to PPR |
| | `src/app/(shop)/blog/[slug]/page.tsx` -- Convert blog posts to PPR |
| | `src/app/(shop)/layout.tsx` -- Optimize with RSC patterns |
| | `package.json` -- Add `@next/bundle-analyzer`, `web-vitals` |
| **Prisma Schema Changes** | None |
| **Estimated Effort** | 32 hours |
| **Dependencies** | Phase 3.5 (CWV reporting from analytics dashboard) |
| **Risk Level** | Low -- incremental improvements, fully reversible |
| **Rollback Plan** | Revert next.config.js changes. PPR is opt-in per route. |

---

### 5.5 White-Label Enhancement

**What Exists (PRESERVE)**:
- White-label capability (existing)
- Custom domain per tenant (DNS CNAME)
- Multi-tenant SaaS architecture (existing)
- Module-based pricing (existing)

**What to Build**:
Enhanced white-labeling: custom login page, custom email branding, custom favicon/logo injection, and custom CSS per tenant.

| Item | Detail |
|------|--------|
| **Files to Create** | `src/lib/white-label/brand-injector.ts` -- Inject tenant brand assets (logo, favicon, colors) into pages |
| | `src/lib/white-label/custom-css-engine.ts` -- Safely inject tenant custom CSS (sanitized) |
| | `src/lib/white-label/email-branding.ts` -- Apply tenant branding to all transactional emails |
| | `src/app/api/admin/white-label/settings/route.ts` -- Configure white-label settings |
| | `src/app/api/admin/white-label/css/route.ts` -- Upload custom CSS |
| | `src/app/api/admin/white-label/preview/route.ts` -- Preview branded experience |
| | `src/app/admin/white-label/page.tsx` -- White-label customization dashboard |
| | `src/components/white-label/BrandedLogin.tsx` -- Customizable login page |
| | `src/components/white-label/CustomCSSPreview.tsx` -- Live preview of custom CSS |
| **Files to Modify** | `src/app/layout.tsx` -- Inject tenant brand assets |
| | `src/app/auth/` -- Apply branded login |
| | `src/lib/email-templates.ts` -- Apply tenant email branding |
| | `src/i18n/locales/*.json` -- Add white-label namespace keys (all 22 locales) |
| **Prisma Schema Changes** | Add fields to Tenant model: |

```prisma
// Add to existing Tenant model:
// customCss     String?   // Sanitized custom CSS
// loginLogoUrl  String?   // Custom login page logo
// loginBgUrl    String?   // Custom login background
// emailLogoUrl  String?   // Custom email header logo
// emailFooter   String?   // Custom email footer text
```

| **Estimated Effort** | 32 hours |
| **Dependencies** | Multi-tenant architecture (existing) |
| **Risk Level** | Low -- CSS sanitization is the only security concern |
| **Rollback Plan** | Reset tenant white-label settings to defaults. |

---

### Phase 5 Summary

| Feature | Hours | Risk | Dependencies |
|---------|-------|------|-------------|
| 5.1 Voice UI Integration | 32 | Medium | Deepgram, ElevenLabs (existing) |
| 5.2 AR/VR Web Components | 24 | Low | Product catalog (existing) |
| 5.3 Personalization Engine | 48 | Medium | Analytics, recommendations (existing) |
| 5.4 Performance Optimization | 32 | Low | Phase 3.5 |
| 5.5 White-Label Enhancement | 32 | Low | Multi-tenant (existing) |
| **Phase 5 Total** | **168 hours** | | |

---

## Phase 6: Testing & Launch

**Timeline**: Weeks 16-17 (10 business days)
**Goal**: Ensure production readiness through comprehensive testing, security audit, and documentation

---

### 6.1 Comprehensive Playwright Testing

| Item | Detail |
|------|--------|
| **Files to Create** | `tests/e2e/page-builder.spec.ts` -- Page builder section CRUD, reorder, preview |
| | `tests/e2e/templates.spec.ts` -- Template browse, preview, apply |
| | `tests/e2e/booking.spec.ts` -- Service creation, slot selection, booking flow, cancellation |
| | `tests/e2e/membership.spec.ts` -- Tier creation, subscribe, content gating, cancel |
| | `tests/e2e/form-builder.spec.ts` -- Form creation, submission, payment form |
| | `tests/e2e/cms-collections.spec.ts` -- Collection creation, item CRUD, public display |
| | `tests/e2e/gallery.spec.ts` -- Gallery creation, image upload, lightbox |
| | `tests/e2e/integrations.spec.ts` -- Integration install, configure, logs |
| | `tests/e2e/seo.spec.ts` -- Structured data output, meta generation |
| | `tests/e2e/ab-testing.spec.ts` -- Test creation, variant assignment, results |
| | `tests/e2e/conversion.spec.ts` -- Express checkout, social proof, exit intent |
| | `tests/e2e/workflows.spec.ts` -- Workflow creation, trigger, execution |
| | `tests/e2e/returns.spec.ts` -- Return creation, approval, refund |
| | `tests/e2e/pwa.spec.ts` -- Service worker, offline, push subscription |
| | `tests/e2e/personalization.spec.ts` -- Segment matching, content selection |
| | `tests/e2e/voice.spec.ts` -- Voice command recognition, search |
| | `tests/e2e/ar-viewer.spec.ts` -- 3D model upload, viewer rendering |
| | `tests/e2e/collaboration.spec.ts` -- Multi-user presence, comments |
| **Estimated Effort** | 40 hours |
| **Dependencies** | All previous phases |
| **Risk Level** | Low |

---

### 6.2 Load Testing

| Item | Detail |
|------|--------|
| **Files to Create** | `tests/load/booking-concurrency.ts` -- 100 concurrent booking requests for same slot |
| | `tests/load/checkout-stress.ts` -- 500 concurrent checkout sessions |
| | `tests/load/api-throughput.ts` -- API endpoint throughput testing (1000 rps target) |
| | `tests/load/collaboration-rooms.ts` -- 50 users in same collaboration room |
| | `tests/load/workflow-execution.ts` -- 1000 workflow triggers in 1 minute |
| **Tool** | k6 or Artillery for load testing |
| **Estimated Effort** | 16 hours |
| **Dependencies** | All previous phases |
| **Risk Level** | Low |

---

### 6.3 Security Audit

| Item | Detail |
|------|--------|
| **Scope** | All new API endpoints from Phases 1-5 (~60 routes) |
| **Checklist** | Auth guards on all admin routes (withAdminGuard) |
| | Zod input validation on all POST/PUT endpoints |
| | tenantId filtering on all queries (cross-tenant prevention) |
| | CSRF tokens on all mutations |
| | Rate limiting on public endpoints |
| | XSS prevention in custom CSS injection (white-label) |
| | SQL injection prevention in CMS dynamic queries |
| | File upload validation (magic bytes, size limits, type whitelist) |
| | Webhook signature verification for integrations |
| | OAuth token encryption at rest |
| **Estimated Effort** | 24 hours |
| **Dependencies** | All previous phases |
| **Risk Level** | Medium -- may uncover issues requiring fixes |

---

### 6.4 Documentation

| Item | Detail |
|------|--------|
| **Files to Create** | Update `PROJECT_MAP.md` with all new pages, routes, models |
| | Update `src/lib/admin/outlook-nav.ts` with all new navigation entries |
| | Create API documentation for integration SDK (`data/integrations/SDK.md`) |
| | Create template authoring guide (`data/templates/AUTHORING.md`) |
| | Update i18n keys documentation |
| **Estimated Effort** | 16 hours |
| **Dependencies** | All previous phases |
| **Risk Level** | Low |

---

### 6.5 Production Deployment

| Item | Detail |
|------|--------|
| **Pre-deploy Checklist** | `npx prisma validate` |
| | `npx prisma generate` |
| | `NODE_OPTIONS="--max-old-space-size=8192" npm run build` |
| | `git status` (verify all files committed) |
| | Database schema sync: `DATABASE_URL='...' npx prisma db push` |
| | Environment variables: verify all new env vars set in Railway |
| | Feature flags: verify module toggles for gradual rollout |
| **Deployment Strategy** | Phase-gated rollout: enable features per phase for beta tenants first |
| | Monitor Railway logs for 24h after each phase activation |
| | Health check: `curl -s https://attitudes.vip/api/health` |
| **Estimated Effort** | 8 hours |
| **Dependencies** | All tests passing |
| **Risk Level** | Medium -- production data requires careful migration |

---

### Phase 6 Summary

| Feature | Hours | Risk | Dependencies |
|---------|-------|------|-------------|
| 6.1 Playwright Testing | 40 | Low | Phases 1-5 |
| 6.2 Load Testing | 16 | Low | Phases 1-5 |
| 6.3 Security Audit | 24 | Medium | Phases 1-5 |
| 6.4 Documentation | 16 | Low | Phases 1-5 |
| 6.5 Production Deployment | 8 | Medium | All tests passing |
| **Phase 6 Total** | **104 hours** | | |

---

## Cross-Phase Dependencies

```
Phase 1 ─────────────────────────────────────────────────────
  1.1 Page Builder ─────────┬── 1.2 Templates
                             ├── 4.1 AI Design
                             ├── 4.2 Collaboration
                             └── 5.3 Personalization

  1.3 Content Editor ───────── 2.4 CMS Collections

Phase 2 ─────────────────────────────────────────────────────
  2.1 Booking ──────────────── 4.5 Workflows (booking trigger)
  2.2 Membership ───────────── 2.4 CMS (gated collections)
  2.3 Forms ────────────────── 4.5 Workflows (form trigger)
  2.5 Gallery ──────────────── 1.1 Page Builder (gallery section)

Phase 3 ─────────────────────────────────────────────────────
  3.1 Integrations ─────────── 4.5 Workflows (webhook actions)
  3.3 A/B Testing ──────────── 5.4 Performance (edge middleware)
  3.5 Analytics ────────────── 5.4 Performance (CWV data)

Phase 4 ─────────────────────────────────────────────────────
  4.3 PWA ──────────────────── standalone
  4.4 E-Commerce ───────────── standalone

Phase 5 ─────────────────────────────────────────────────────
  All features independent (polish layer)

Phase 6 ─────────────────────────────────────────────────────
  Depends on ALL previous phases
```

---

## Risk Registry

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R1 | Liveblocks costs exceed budget at scale | Medium | Medium | Start with Yjs self-hosted; migrate to Liveblocks only for enterprise plans |
| R2 | Social platform API breaks (Facebook/TikTok) | High | Medium | Abstract behind adapter pattern; quick swap when APIs change |
| R3 | Carrier rate API latency slows checkout | Medium | High | Cache rates for 15 minutes; show "estimated" while loading real-time |
| R4 | Template quality insufficient for launch | Medium | High | Hire designer for 10 premium templates; use AI for additional templates |
| R5 | Workflow engine Redis memory pressure | Low | High | BullMQ with disk-backed persistence; job TTL limits |
| R6 | PWA service worker caching stale content | Medium | Medium | Network-first strategy for API; versioned cache busting |
| R7 | Custom CSS injection XSS vulnerability | Medium | Critical | DOMPurify sanitization; CSP headers; CSS-only (no JS) |
| R8 | A/B test statistical engine gives wrong results | Low | High | Use well-tested Bayesian library; manual verification for first 10 tests |
| R9 | CMS dynamic schema validation bypass | Medium | High | Server-side Zod validation on every item save; field type whitelist |
| R10 | Build time increases beyond Railway limits | Medium | Medium | Turbopack, webpackMemoryOptimizations, NODE_OPTIONS 8GB |

---

## Total Effort Summary

| Phase | Timeline | Hours | Risk Profile |
|-------|----------|-------|-------------|
| **Phase 1**: Foundation | Weeks 1-2 | 128 | Low |
| **Phase 2**: Core Gaps (Low Risk) | Weeks 3-5 | 256 | Low-Medium |
| **Phase 3**: Core Gaps (Medium Risk) | Weeks 6-8 | 272 | Medium |
| **Phase 4**: Advanced Features | Weeks 9-12 | 320 | Medium-High |
| **Phase 5**: Innovation & Polish | Weeks 13-15 | 168 | Low-Medium |
| **Phase 6**: Testing & Launch | Weeks 16-17 | 104 | Low-Medium |
| **TOTAL** | **17 weeks** | **1,248 hours** | |

---

## New Prisma Models Summary (All Phases)

| Phase | New Models | Estimated New Fields |
|-------|-----------|---------------------|
| 1 | PageSection, SiteTemplate | ~20 |
| 2 | BookingService, BookingProvider, BookingServiceProvider, ProviderSchedule, Appointment, MembershipTier, MembershipSubscription, MembershipContentRule, CustomForm, FormSubmission, CmsCollection, CmsItem, Gallery, GalleryImage | ~120 |
| 3 | Integration, TenantIntegration, IntegrationLog, AbTest, AbTestEvent, WebVitalsReport | ~50 |
| 4 | ReturnRequest, CarrierAccount, Workflow, WorkflowLog, Affiliate, AffiliateCommission, SocialCatalog, PushSubscription, PageComment | ~80 |
| 5 | PersonalizationSegment, PersonalizationRule | ~15 |
| **Total New Models** | **~31** | **~285 fields** |

Current Koraline: ~310 tables. After integration: ~341 tables.

---

## Gap Coverage Matrix

| Gap ID | Gap Name | Phase | Status |
|--------|----------|-------|--------|
| G1 | Template Marketplace | Phase 1.2 | Covered (50 templates, 10 industries) |
| G2 | Free Trial | Not in plan | Billing change only, separate task |
| G3 | App Marketplace | Phase 3.1 | Covered (Zapier + 10-20 native) |
| G4 | Booking & Scheduling | Phase 2.1 | Covered (full module) |
| G5 | POS | Not in plan | Requires Stripe Terminal hardware -- separate initiative |
| G6 | Social Commerce | Phase 4.5 | Covered (catalog sync) |
| G7 | BNPL | Phase 4.4 | Covered (Klarna/Afterpay via Stripe) |
| G8 | Shipping Labels | Phase 4.4 | Covered (ShipStation integration) |
| G9 | Carrier Rates | Phase 4.4 | Covered (real-time rates) |
| G10 | Admin Mobile App | Phase 4.3 | Covered (PWA approach) |
| G11 | Dropshipping | Not in plan | Printful API -- separate task |
| G12 | Structured Data | Phase 3.2 | Covered (JSON-LD auto-generation) |
| G13 | Workflow Automation | Phase 4.5 | Covered (visual builder) |
| G15 | Agentic Storefronts | Not in plan | MCP server -- separate initiative |
| G17 | Membership/Paywall | Phase 2.2 | Covered (full module) |
| G18 | CMS Collections | Phase 2.4 | Covered (dynamic content types) |
| G19 | Return Management | Phase 4.4 | Covered (self-service returns) |
| G20 | A/B Testing | Phase 3.3 | Covered (email + page testing) |
| G21 | Express Checkout | Phase 3.4 | Covered (Buy Now button) |
| G22 | Affiliate Marketing | Phase 4.5 | Covered (full system) |
| G24 | AI Logo Maker | Phase 4.1 | Covered (AI logo generation) |
| G25 | Course Certificates | Not in plan | LMS enhancement -- separate task |
| G26 | Custom Fonts | Phase 5.5 | Can be included in white-label |
| G27 | Zapier/Make Connector | Phase 3.1 | Covered (part of integration hub) |
| G29 | Portfolio Pages | Phase 2.5 | Covered (gallery/portfolio) |

**Gaps Covered**: 22 of 30 identified gaps (73%)
**Gaps Deferred**: G2 (trial), G5 (POS), G11 (dropshipping), G15 (agentic), G25 (certificates), G14 (multi-channel), G16 (events), G30 (auto-translate) -- these are standalone initiatives with specialized requirements.

---

*Generated 2026-03-28 from GAP_ANALYSIS.md, FEATURE_TAXONOMY.md, and TECH_RESEARCH_2026.md. This plan covers 6 phases across 17 weeks with 1,248 estimated hours of work, adding ~31 new Prisma models and closing 22 of 30 identified competitive gaps.*
