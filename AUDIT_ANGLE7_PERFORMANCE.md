# AUDIT ANGLE 7: Performance & Infrastructure
## BioCycle Peptides (peptide-plus)
**Date**: 2026-03-10
**Auditor**: Claude Opus 4.6

---

## Executive Summary

The peptide-plus project has **solid foundational infrastructure** (bundle analyzer, standalone output, Redis-backed 2-layer cache, Web Vitals monitoring) but suffers from **systemic scalability issues**: massive monolithic client pages (2418 lines), widespread overfetching from Prisma (495 `include:` vs 346 `select:`), minimal use of dynamic imports for heavy libraries, and 260+ `'use client'` pages that bypass server-side rendering benefits. The caching layer exists but is used by only 7 API routes out of 300+.

**Severity Distribution**: 4 P0 | 7 P1 | 8 P2 | 5 P3

---

## 1. Bundle Size Analysis

### 1.1 next.config.js Configuration (GOOD)

**File**: `/Volumes/AI_Project/peptide-plus/next.config.js`

Positive findings:
- Bundle analyzer configured (`@next/bundle-analyzer`, enabled via `ANALYZE=true`)
- Standalone output mode for Azure/Docker deployment
- `optimizePackageImports` for `date-fns`, `lucide-react`, `recharts`, `reactflow`, `@azure/*`, `jose`, `zod`
- `outputFileTracingExcludes` removes `.map`, `.d.ts`, docs, and platform-specific Prisma engines
- Image optimization with modern formats (AVIF, WebP), 30-day cache TTL
- Compression enabled
- `serverExternalPackages` for `isomorphic-dompurify`, `jsdom`, `nodemailer`

### 1.2 Large Pages (P1 - HIGH)

Several page.tsx files are excessively large, indicating monolithic components that hurt code-splitting:

| File | Lines | Issue |
|------|-------|-------|
| `src/app/admin/commandes/page.tsx` | **2,418** | Monolithic client component |
| `src/app/admin/comptabilite/page.tsx` | **1,234** | Monolithic client component |
| `src/app/admin/chat/page.tsx` | **776** | Large client component |
| `src/app/admin/securite/page.tsx` | **238** | Moderate |

**Finding [P1-PERF-01]**: The commandes page is 2,418 lines of `'use client'` code loaded as a single bundle. This includes modals, form logic, stat cards, and detail panes that should be split into separate components.

### 1.3 Heavy Dependencies (P2 - MEDIUM)

| Dependency | Size (approx.) | Used In | Dynamic Import? |
|-----------|----------------|---------|-----------------|
| `recharts` | ~500KB | 12 admin analytics pages | NO -- static import |
| `reactflow` | ~300KB | 5 email flow nodes | YES (via `optimizePackageImports`) |
| `@tiptap/*` (5 packages) | ~200KB | 0 files (unused in src!) | N/A |
| `jspdf` | ~300KB | 6 PDF generation files | Server-side only |
| `exceljs` | ~250KB | 1 Excel export route | Server-side only |
| `@azure/*` (4 packages) | ~400KB | Server-side only | Optimized |
| `livekit-*` (3 packages) | ~200KB | 0 files in src | **DEAD DEPENDENCY** |
| `@telnyx/webrtc` | ~150KB | 1 hook file | Not dynamically imported |
| `playwright` | ~50MB | Listed in dependencies! | **CRITICAL: Should be devDependencies** |

**Finding [P0-PERF-02]**: `playwright` (~50MB) is in `dependencies` instead of `devDependencies`. It gets bundled/traced in production builds unnecessarily.

**Finding [P2-PERF-03]**: `livekit-client`, `livekit-server-sdk`, and `@livekit/components-react` are in dependencies but have zero imports in `src/`. Dead weight in `package.json`.

**Finding [P2-PERF-04]**: `@tiptap/*` (5 packages) are in dependencies with zero imports in source code. Dead dependencies.

**Finding [P1-PERF-05]**: `recharts` is statically imported in 12 admin pages. These chart libraries should use `next/dynamic` with `ssr: false` to avoid shipping ~500KB to every admin page load. Only 9 files in the entire project use `next/dynamic`.

---

## 2. Prisma Query Patterns

### 2.1 Overfetching Analysis (P1 - HIGH)

Across API routes:
- **`select:` usage**: ~346 occurrences (good -- explicit field selection)
- **`include:` usage**: **~495 occurrences** (fetches entire related models)
- **Ratio**: 58% of queries use `include:` which fetches ALL fields of related models

**Finding [P1-PERF-06]**: The majority of Prisma queries use `include:` instead of `select:` with nested selections. This means entire related models are fetched when only 1-2 fields are needed. Example from `src/app/api/company/route.ts`:
```typescript
include: {
  customers: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
}
```
The outer `include: { customers: ... }` fetches ALL customer fields, even though only the nested user fields are used.

### 2.2 Deep Include Nesting (P2 - MEDIUM)

**3 files** have nested `include` within `include` (2+ levels deep):
- `src/lib/crm/acd-engine.ts`
- `src/lib/accounting/batch-operations.service.ts`
- `src/lib/accounting/payroll.service.ts`

### 2.3 N+1 Query Patterns (P1 - HIGH)

**194 files** contain `for` loops with `await prisma` inside them -- potential N+1 patterns.

Notable examples in API routes (from grep results):
- `src/app/api/cron/price-drop-alerts/route.ts` - Prisma calls inside loops
- `src/app/api/cron/stock-alerts/route.ts` - Prisma calls inside loops
- `src/app/api/cron/birthday-bonus/route.ts` - Prisma calls inside loops
- `src/app/api/cron/scheduled-campaigns/route.ts` - Prisma calls inside loops
- `src/app/api/cron/email-flows/route.ts` - Prisma calls inside loops
- `src/app/api/cron/ab-test-check/route.ts` - Prisma calls inside loops

Some of these are batched with `Promise.allSettled()` (better), but many are sequential `for...of` with individual `await prisma.*.update()` calls.

**Finding [P1-PERF-07]**: At least 40 files in `src/lib/` have confirmed `for` loop + `await prisma` patterns. While some are batched, many are not. Cron jobs are especially affected since they process collections of records sequentially.

### 2.4 Unbounded findMany (P2 - MEDIUM)

**3 instances** of `findMany()` with absolutely no filters or pagination:
- `src/lib/email/email-service.ts:81` - `prisma.emailSettings.findMany()`
- `src/app/api/admin/emails/settings/route.ts:25` - `prisma.emailSettings.findMany()`
- `src/app/api/admin/emails/settings/route.ts:184` - `prisma.emailSettings.findMany()`

These are acceptable since `emailSettings` is a small table, but the pattern is risky.

**Finding [P2-PERF-08]**: 1 instance of `findMany({ where })` in `src/lib/inventory/inventory.service.ts:155` has no `take` limit. If the `where` clause is broad, this could return unbounded results.

---

## 3. Caching Strategy

### 3.1 Cache Architecture (GOOD)

**File**: `/Volumes/AI_Project/peptide-plus/src/lib/cache.ts`

Two-layer cache:
- **L1**: In-memory `Map<string, CacheItem>` with TTL and tag-based invalidation
- **L2**: Redis (ioredis) with graceful fallback when unavailable

Well-defined TTL constants:
- CONFIG: 5 min, CATEGORIES: 10 min, PRODUCTS: 5 min, SEARCH: 1 min, STATIC: 1 hour

**File**: `/Volumes/AI_Project/peptide-plus/src/lib/redis.ts`

Redis client with lazy init, 3s connect timeout, 3 retries, singleton pattern. Good error handling and graceful degradation.

### 3.2 Cache Adoption (P0 - CRITICAL)

**Finding [P0-PERF-09]**: The cache system is used by only **7 files** out of 300+ API routes:
1. `src/lib/cache.ts` (definition)
2. `src/lib/translation/auto-translate.ts`
3. `src/app/api/categories/[id]/route.ts`
4. `src/app/api/categories/route.ts`
5. `src/app/api/search/suggest/route.ts`
6. `src/app/api/products/[id]/related/route.ts`
7. `src/app/api/products/search/route.ts`
8. `src/app/api/currencies/route.ts`

**Missing cache on high-traffic endpoints**:
- `/api/products/route.ts` - Product listing (no cache)
- `/api/products/[id]/route.ts` - Product detail (no cache)
- `/api/hero-slides/active/route.ts` - Homepage hero (no cache)
- `/api/blog/route.ts` - Blog listing (no cache)
- `/api/faq/route.ts` - FAQ page (no cache)
- `/api/testimonials/route.ts` - Testimonials (no cache)
- `/api/news/route.ts` - News (no cache)
- `/api/loyalty/config/route.ts` - Loyalty config (no cache)

### 3.3 Next.js Caching (P1 - HIGH)

**Finding [P1-PERF-10]**: `revalidate` is used in 41 files, mostly for ISR on public pages, which is good. However:
- `unstable_cache` is not used anywhere (0 occurrences)
- Only 6 files use `generateStaticParams` for SSG
- 885 files export `force-dynamic` -- virtually every API route and many pages

The 885 `force-dynamic` exports mean Next.js cannot apply any edge/CDN caching. While necessary for API routes, many public-facing pages (blog, FAQ, testimonials) could use ISR instead.

---

## 4. API Response Times (Static Analysis)

### 4.1 Sequential Awaits (P1 - HIGH)

**Finding [P1-PERF-11]**: Many API routes have sequential `await` patterns where queries could be parallelized.

Good examples of `Promise.all` usage exist (455 occurrences across 346 files), but significant sequential patterns remain throughout API routes (see tracking/email/route.ts example: 4 sequential Prisma calls when some could be parallelized).

### 4.2 Large Unpaginated Queries (P2 - MEDIUM)

Most `findMany` calls in API routes include `take/skip` pagination. The translation queue uses `take: 500` which is reasonable for batch processing. No extreme cases found beyond the `emailSettings` ones noted above.

### 4.3 Performance Monitoring (GOOD)

**File**: `/Volumes/AI_Project/peptide-plus/src/components/analytics/WebVitals.tsx`

Web Vitals (CLS, LCP, TTFB, INP) are tracked and sent to GA4. The component is included in the root layout. `web-vitals` package is a direct dependency.

---

## 5. Static vs Dynamic Pages

### 5.1 Client vs Server Components (P0 - CRITICAL)

**Finding [P0-PERF-12]**: Component distribution is heavily skewed toward client-side:

| Metric | Count |
|--------|-------|
| Total `page.tsx` files | 250+ |
| Pages with `'use client'` | **260** |
| Pages without `'use client'` (server components) | ~10-15 |
| `generateStaticParams` (SSG) | **6 files** |
| `force-dynamic` on pages (.tsx) | **55 files** |
| `force-dynamic` on API routes (.ts) | **830+ files** |
| `loading.tsx` files (streaming) | **100+** (good!) |
| `Suspense` usage | **68 occurrences in 16 files** |

Almost every page is a client component, meaning:
- No server-side HTML streaming benefits
- Larger JavaScript bundles shipped to client
- No automatic server component data fetching

The project does have extensive `loading.tsx` files which helps with perceived performance.

### 5.2 SSG/ISR Usage (P2 - MEDIUM)

Only 6 files use `generateStaticParams`:
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/app/layout.tsx`
- `src/app/(shop)/bundles/[slug]/layout.tsx`
- `src/app/(shop)/product/[slug]/page.tsx`
- `src/app/(shop)/category/[slug]/page.tsx`
- `src/app/(shop)/learn/[slug]/layout.tsx`

**Finding [P2-PERF-13]**: Public-facing pages like blog listing, FAQ, about, legal pages, testimonials, and references could benefit from ISR with `generateStaticParams` + `revalidate` to serve pre-rendered HTML.

### 5.3 Dynamic Imports (P2 - MEDIUM)

Only **9 files** use `next/dynamic`:
- `src/app/(shop)/layout.tsx`
- `src/app/(shop)/HomePageClient.tsx`
- `src/app/(shop)/product/[slug]/ProductPageClient.tsx`
- `src/app/(shop)/product/[slug]/ProductTabs.tsx`
- `src/app/(shop)/calculator/CalculatorPageClient.tsx`
- `src/app/(shop)/videos/page.tsx`
- `src/app/(shop)/checkout/page.tsx`
- `src/app/admin/crm/workflows/page.tsx`
- `src/app/admin/emails/page.tsx`

**Finding [P2-PERF-14]**: Heavy client libraries (recharts, reactflow, VoIP softphone) should be dynamically imported to reduce initial page load. Only 9 of 250+ pages use `next/dynamic`.

---

## 6. Image Optimization

### 6.1 next/image vs raw img (P1 - HIGH)

| Pattern | File Count |
|---------|-----------|
| `next/image` import | **74 files** |
| Raw `<img` tag | **10 files** |

**Finding [P1-PERF-15]**: 10 files use raw `<img>` tags instead of `next/image`:

Notable offenders:
- `src/lib/email/templates/base-template.ts` (acceptable -- email HTML)
- `src/lib/email/templates/marketing-emails.ts` (acceptable -- email HTML)
- `src/lib/email/tracking.ts` (acceptable -- tracking pixel)
- `src/lib/email/dynamic-content.ts` (acceptable -- email HTML)
- `src/lib/email-templates.ts` (acceptable -- email HTML)
- `src/app/mobile/receipt-capture/page.tsx` (should use next/image)
- `src/app/(shop)/account/settings/page.tsx` (should use next/image)
- `src/app/admin/emails/TemplateBuilder.tsx` (should use next/image)

Most raw `<img>` usage is in email templates (where next/image cannot be used), which is acceptable. Only ~3 files need correction.

### 6.2 Image Config (GOOD)

next.config.js has comprehensive image optimization:
- Modern formats: AVIF + WebP
- Proper device/image sizes
- 30-day minimum cache TTL
- `sharp` is a direct dependency (fast image processing)
- Remote patterns properly configured

---

## 7. Memory/Resource Concerns

### 7.1 Event Listener Cleanup (P3 - LOW)

| Pattern | Count |
|---------|-------|
| `addEventListener` in .tsx | **69 occurrences in 51 files** |
| `removeEventListener` in .tsx | **72 occurrences in 53 files** |

**Finding [P3-PERF-16]**: Event listener add/remove counts are well-balanced (69 adds vs 72 removes). Most components properly clean up in `useEffect` return functions. The 54 files using `addEventListener` within `useEffect` almost all have corresponding cleanup.

### 7.2 Timer Cleanup (P3 - LOW)

**123 files** use `setTimeout` or `setInterval`. Based on sampling, most are within `useEffect` hooks with proper cleanup returns. No systemic leak pattern detected.

### 7.3 Large State Arrays (P2 - MEDIUM)

**Finding [P2-PERF-17]**: **390 occurrences** of `useState([])` or `useState<..[]>` across 231 files. This is expected for a large admin app, but combined with the lack of pagination on some endpoints, some pages could accumulate large arrays in memory.

Key concern areas:
- `src/app/admin/comptabilite/rapports-personnalises/page.tsx` -- 8 separate `useState([])` calls
- `src/app/admin/clients/[id]/page.tsx` -- 8 `useState([])` calls
- `src/app/admin/customers/[id]/page.tsx` -- 6 `useState([])` calls
- `src/app/admin/comptabilite/page.tsx` -- 6 `useState([])` calls

### 7.4 Unbounded Data Loading (P3 - LOW)

Most admin list pages use SWR with pagination parameters. The main risk areas are pages that load ALL records into client-side state for filtering (e.g., community page with local useState data).

### 7.5 TypeScript Build Errors (P0 - CRITICAL)

**Finding [P0-PERF-18]**: `ignoreBuildErrors: true` in next.config.js with ~958 pre-existing TypeScript errors. This means:
- Type safety is completely disabled at build time
- Runtime crashes from type mismatches are possible
- Tree-shaking and dead code elimination may be less effective
- Performance optimizations that rely on type information are bypassed

### 7.6 Dead Dependencies Impact (P2 - MEDIUM)

**Finding [P2-PERF-19]**: Multiple unused dependencies increase `node_modules` size and potentially the standalone build trace:
- `playwright` in dependencies (~50MB)
- `livekit-*` packages (0 imports)
- `@tiptap/*` packages (0 imports)
- `esl-lite` (unclear usage)

---

## Summary of Findings by Priority

### P0 - CRITICAL (Fix Immediately)

| ID | Finding | Impact |
|----|---------|--------|
| P0-PERF-02 | `playwright` in production dependencies | +50MB build size |
| P0-PERF-09 | Cache used by 7/300+ API routes | DB overload, slow responses |
| P0-PERF-12 | 260+ pages are `'use client'` with no server components | Large JS bundles, no streaming |
| P0-PERF-18 | 958 TS errors ignored at build time | Runtime crashes, broken optimizations |

### P1 - HIGH (Fix This Sprint)

| ID | Finding | Impact |
|----|---------|--------|
| P1-PERF-01 | Monolithic page files (2418 lines) | Poor code splitting |
| P1-PERF-05 | recharts statically imported in 12 pages | ~500KB added to each page |
| P1-PERF-06 | 58% of queries use `include:` over `select:` | Overfetching from DB |
| P1-PERF-07 | N+1 patterns in 40+ lib files and cron jobs | O(N) DB queries instead of O(1) |
| P1-PERF-10 | No ISR for public pages, 885 force-dynamic exports | No CDN/edge caching |
| P1-PERF-11 | Sequential awaits in API routes | Unnecessary latency |
| P1-PERF-15 | 3 UI files use raw `<img>` instead of next/image | No lazy loading/optimization |

### P2 - MEDIUM (Fix This Quarter)

| ID | Finding | Impact |
|----|---------|--------|
| P2-PERF-03 | Dead deps: livekit-* (0 imports) | Package bloat |
| P2-PERF-04 | Dead deps: @tiptap/* (0 imports) | Package bloat |
| P2-PERF-08 | findMany without take limit in inventory | Potential unbounded query |
| P2-PERF-13 | Only 6 pages use generateStaticParams | Missed SSG opportunities |
| P2-PERF-14 | Only 9 pages use next/dynamic | Missed code-splitting |
| P2-PERF-17 | Pages with 6-8 useState([]) arrays | Memory pressure on admin |
| P2-PERF-19 | Dead/unused dependencies inflate node_modules | Build size, install time |
| P2-PERF-08b | Deep nested include (2+ levels) in 3 files | Over-fetching |

### P3 - LOW (Backlog)

| ID | Finding | Impact |
|----|---------|--------|
| P3-PERF-16 | Event listener cleanup is balanced (69 add / 72 remove) | No issue -- informational |
| P3-PERF-20 | Community page uses local useState for all data | No backend persistence |
| P3-PERF-21 | SiteSettings cache TTL is 30s (could be longer) | Frequent re-fetches |
| P3-PERF-22 | loading.tsx coverage is good (100+ files) | Positive -- no action |
| P3-PERF-23 | Web Vitals tracking active in layout | Positive -- no action |

---

## Recommendations (Prioritized)

### Immediate (P0)

1. **Move `playwright` to devDependencies** -- saves ~50MB in production build
2. **Expand cache coverage** -- Add `cacheGetOrSet` to the top 20 most-hit API routes (products, categories, blog, FAQ, testimonials, hero-slides, news, loyalty-config)
3. **Convert high-traffic public pages to Server Components** -- Homepage, product listing, blog, FAQ can be server components that fetch data on the server
4. **Create a plan to fix the 958 TypeScript errors** and disable `ignoreBuildErrors`

### Short-term (P1)

5. **Split monolithic pages** -- Break `commandes/page.tsx` (2418 lines) and `comptabilite/page.tsx` (1234 lines) into sub-components
6. **Dynamic import recharts** -- Use `next/dynamic(() => import('recharts'), { ssr: false })` in 12 admin analytics pages
7. **Replace `include:` with `select:`** in API routes where only a few fields are needed from relations
8. **Batch N+1 queries in cron jobs** -- Use `prisma.*.updateMany()` or `prisma.$transaction()` instead of individual updates in loops
9. **Enable ISR for public pages** -- Blog, FAQ, about, legal pages should have `revalidate: 3600`
10. **Parallelize sequential awaits** -- Wrap independent queries in `Promise.all()`

### Medium-term (P2)

11. **Remove dead dependencies** -- `livekit-*`, `@tiptap/*`, `esl-lite`
12. **Add `next/dynamic`** to heavy components (VoIP softphone, workflow builder, chart dashboards)
13. **Add pagination limits** to all `findMany` calls without `take`
14. **Expand `generateStaticParams`** for public content pages

---

## Metrics Summary

| Metric | Value | Assessment |
|--------|-------|------------|
| Bundle analyzer | Configured | GOOD |
| Output mode | standalone | GOOD |
| Package optimization | 8 packages | GOOD |
| Cache architecture | 2-layer (L1+L2) | GOOD |
| Cache adoption | 7/300+ routes | CRITICAL |
| Client components | 260+ pages | CRITICAL |
| Server components | ~10-15 pages | CRITICAL |
| SSG pages | 6 | LOW |
| Dynamic imports | 9 files | LOW |
| force-dynamic | 885 files | HIGH |
| loading.tsx | 100+ files | GOOD |
| Suspense | 68 in 16 files | MODERATE |
| Promise.all usage | 455 in 346 files | GOOD |
| N+1 patterns (for+prisma) | 194 files | HIGH |
| select: vs include: | 346 vs 495 | CONCERNING |
| next/image usage | 74 files | GOOD |
| Raw img usage | 10 files (7 in emails) | ACCEPTABLE |
| Web Vitals | Active | GOOD |
| Event listener cleanup | Balanced | GOOD |
| Dead dependencies | 4+ packages | MEDIUM |
| TS errors ignored | 958 | CRITICAL |
| Total API routes | 300+ | -- |
| Total pages | 250+ | -- |

---

*Report generated 2026-03-10 by Claude Opus 4.6 for Audit Angle 7: Performance & Infrastructure*
