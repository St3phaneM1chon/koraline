# LMS Pages Audit — UI Quality, Security, Accessibility

**Date**: 2026-03-24
**Scope**: 57 pages (36 admin formation + 21 student learn)
**Auditor**: Claude Code (automated static analysis)

---

## Summary

| Severity | Count |
|----------|-------|
| **P1 (Critical)** | 5 |
| **P2 (High)** | 14 |
| **P3 (Medium)** | 12 |
| **Total** | **31** |

---

## P1 — Critical (Security / XSS / Auth)

### P1-01: XSS — LessonViewerClient uses dangerouslySetInnerHTML WITHOUT sanitization
- **File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx`
- **Lines**: 564, 580, 642
- **Detail**: The `renderMarkdown()` function (line 252) converts markdown to HTML using regex `.replace()` and injects it via `dangerouslySetInnerHTML`. Unlike the article pages (`page.tsx`, `ArticlePageClient.tsx`) which use `DOMPurify.sanitize()`, this component does NOT sanitize. The lesson `textContent`, `manualText`, and supplementary text content from the API is inserted as raw HTML.
- **Impact**: If an admin or instructor injects `<script>` or `<img onerror=...>` into lesson content, it executes in every student's browser. Stored XSS.
- **Fix**: Wrap `renderMarkdown()` output in `DOMPurify.sanitize()` before passing to `dangerouslySetInnerHTML`.

### P1-02: No auth guard on student /learn/* pages (except lesson viewer)
- **Files**: All `src/app/(shop)/learn/` client pages (dashboard, review, mastery, achievements, glossaire, preferences, discussions, roleplay, xp, cohorte, sessions-live, etc.)
- **Detail**: The learn `layout.tsx` only checks if the `formation` module is enabled. It does NOT verify the user is authenticated. Only `learn/[slug]/[chapterId]/[lessonId]/page.tsx` checks `session?.user?.id`. All other student pages are accessible to unauthenticated users. The pages fetch data from `/api/lms/*` endpoints which may or may not have server-side auth — but the pages themselves display empty states or errors rather than redirecting to login.
- **Impact**: Unauthenticated users can access student dashboard, review queue, mastery data, discussion forums, and roleplay features. Data leakage depends on API-level auth.
- **Fix**: Add `auth()` check to `learn/layout.tsx` — redirect to `/auth/signin` if `!session?.user?.id`.

### P1-03: Portal customCss stored and injected without sanitization
- **File**: `src/app/admin/formation/portail/page.tsx`
- **Detail**: The portal configuration allows admins to enter arbitrary CSS (`customCss` field). This CSS is stored in the database and presumably injected into the student portal. While this is an admin-only feature, a compromised admin account could inject CSS-based attacks (`content: url(...)`, `background: url(...)` for data exfiltration, or `expression()` for IE).
- **Impact**: Medium — requires admin access, but CSS injection can be used for data exfiltration or defacement on the student portal.
- **Fix**: Validate/sanitize CSS server-side. Strip `url()`, `expression()`, `@import`, and `javascript:` from CSS before storing.

### P1-04: Courses list page — unhandled fetch error crashes page
- **File**: `src/app/admin/formation/cours/page.tsx`
- **Line**: 37-42
- **Detail**: `fetchCourses` does NOT have a try/catch. A network error or API failure will cause an unhandled promise rejection. The loading state will never resolve to false, leaving the user stuck on a loading spinner.
- **Fix**: Wrap in try/catch like other pages do, set `courses` to `[]` and `loading` to `false` on error.

### P1-05: Sessions-live student page calls admin API
- **File**: `src/app/(shop)/learn/sessions-live/page.tsx`
- **Line**: 11
- **Detail**: The student-facing sessions-live page calls `/api/admin/lms/live-sessions?upcoming=true` — an admin API endpoint. If this endpoint has admin auth checks, the page will always fail for students. If it does NOT have auth checks, it exposes admin data to students.
- **Fix**: Create a student-facing API endpoint `/api/lms/live-sessions` or ensure the admin endpoint properly handles student requests.

---

## P2 — High (Missing States, A11y, Hardcoded Strings)

### P2-01: 10 scaffold admin pages have hardcoded French strings (i18n violation)
- **Files**:
  - `banques-questions/page.tsx` — "Banques de questions", "Nom", "Domaine", "Chargement...", "Aucune donnee", etc.
  - `carnet-notes/page.tsx` — "Carnet de notes", "Etudiant", "Quiz moy.", etc.
  - `cohortes/page.tsx` — "Cohortes", "Debut", "Membres", etc.
  - `diffusion-progressive/page.tsx` — "Diffusion progressive", "Chapitre", etc.
  - `evaluation-pairs/page.tsx` — "Evaluation par les pairs", etc.
  - `grilles-evaluation/page.tsx` — "Grilles d'evaluation", etc.
  - `modeles-cours/page.tsx` — "Modeles de cours", etc.
  - `outils-lti/page.tsx` — "Outils LTI", etc.
  - `parcours-roles/page.tsx` — "Parcours par role", etc.
  - `sessions-direct/page.tsx` — "Sessions en direct", etc.
  - `xapi/page.tsx` — "xAPI / LRS", etc.
- **Detail**: These pages use hardcoded French text instead of `t()` translation calls. All other LMS pages use `useTranslations()`.
- **Impact**: Non-French users see untranslated content. Violates the project's i18n rules.

### P2-02: 10 scaffold admin pages use `any` type extensively
- **Files**: Same 10 pages as P2-01 (banques-questions, carnet-notes, cohortes, diffusion-progressive, evaluation-pairs, grilles-evaluation, modeles-cours, outils-lti, parcours-roles, sessions-direct, xapi)
- **Detail**: These pages use `eslint-disable @typescript-eslint/no-explicit-any` and have `useState<any[]>`, `useState<any>({})`, `Column<any>[]`. No proper TypeScript interfaces defined.
- **Impact**: Type safety lost. Potential runtime errors from incorrect data access.

### P2-03: LMS dashboard page (formation/page.tsx) — no error state
- **File**: `src/app/admin/formation/page.tsx`
- **Lines**: 25-33
- **Detail**: The fetch `.catch(() => setLoading(false))` silently swallows errors. If the API is down, the user sees stat cards with `0` values — indistinguishable from having no data. No error message, no retry button.
- **Impact**: Admin thinks there are 0 courses/students when actually the API failed.

### P2-04: 10 scaffold pages — missing form validation
- **Files**: banques-questions, cohortes, diffusion-progressive, evaluation-pairs, grilles-evaluation, modeles-cours, outils-lti, parcours-roles, sessions-direct
- **Detail**: The create forms have no `required` attribute on inputs, no validation before submit. Forms can be submitted completely empty (only `e.preventDefault()` is called). The name field is not validated client-side.
- **Impact**: Empty records can be created in the database. Poor UX — user gets a server error instead of a clear validation message.

### P2-05: carnet-notes and diffusion-progressive — require manual course ID input
- **Files**: `carnet-notes/page.tsx`, `diffusion-progressive/page.tsx`
- **Detail**: These pages require the user to manually type a course ID (UUID) into a text input to load data. There is no course selector dropdown. Regular admins would not know the UUID.
- **Impact**: Page is effectively unusable without developer knowledge.

### P2-06: Corporatif pages — hardcoded French strings
- **Files**: `corporatif/page.tsx`, `corporatif/[id]/page.tsx`, `corporatif/[id]/dashboard/page.tsx`
- **Detail**: All three corporatif pages have hardcoded French: "Comptes corporatifs", "Employes", "Departement", "Budget formation", "Progression par employe", etc. They call `useTranslations()` but never use `t()`.

### P2-07: Forfaits page — hardcoded French strings
- **File**: `src/app/admin/formation/forfaits/page.tsx`
- **Detail**: "Forfaits de formation", "Prix individuel", "Prix corporatif", "Cours inclus", "Supprimer ce forfait?", etc.

### P2-08: Student discussions page — no actual data fetching
- **File**: `src/app/(shop)/learn/discussions/page.tsx`
- **Detail**: The page has `const [courseId] = useState('')` which is always empty. The `useEffect` checks `if (!courseId)` and returns immediately, so data is never fetched. The page always shows "no discussions".
- **Impact**: Feature is completely non-functional.

### P2-09: Student XP page — hardcoded mock data, never fetches real data
- **File**: `src/app/(shop)/learn/xp/page.tsx`
- **Detail**: Line 24: `setXp({ balance: 0, totalEarned: 0, level: 1, xpToNextLevel: 500, recentTransactions: [] })` — hardcoded. The fetch to `/api/lms/recommendations` result is discarded. No actual XP endpoint is called.
- **Impact**: Page always shows 0 XP regardless of actual progress.

### P2-10: Student cohorte page — fully static, no data fetching
- **File**: `src/app/(shop)/learn/cohorte/page.tsx`
- **Detail**: The page is entirely hardcoded JSX with no data fetching. Always shows "Aucune cohorte active" with placeholder text.
- **Impact**: Feature is a placeholder, not functional.

### P2-11: No keyboard focus management on modal open/close
- **Files**: All pages using `<Modal>` component (badges, categories, instructors, cert-templates, forfaits, corporatif, cohortes, etc.)
- **Detail**: When modals open, focus is not explicitly trapped. Whether focus management works depends entirely on the `Modal` component implementation. None of the page-level code manages focus.
- **Impact**: Keyboard users and screen reader users may not be able to interact with modals properly.

### P2-12: Delete actions use `confirm()` — not accessible
- **Files**: badges, instructors, cert-templates, forfaits, avis (reviews), media
- **Detail**: Delete buttons use `window.confirm()` for confirmation. This native dialog is not styleable, not keyboard-trap-safe, and provides a poor UX. Some pages silently fail on delete errors (empty catch blocks).
- **Impact**: Inconsistent UX. No error feedback if deletion fails.

### P2-13: Multiple admin pages show truncated user IDs instead of names
- **Files**: conformite, etudiants, inscriptions, carnet-notes, corporatif/[id]
- **Detail**: These pages display `row.userId.slice(0, 12) + '...'` instead of a user name. The API likely returns a UUID, but the pages don't resolve it to a human-readable name.
- **Impact**: Admin cannot identify which student is which.

### P2-14: Admin formation error.tsx files lack retry functionality
- **Files**: All `error.tsx` files in formation subdirectories
- **Detail**: While error boundary files exist (analytics, avis, badges, etc. — about 15 of them), the scaffold pages (banques-questions, cohortes, etc.) do NOT have error.tsx files.
- **Pages without error.tsx**: banques-questions, carnet-notes, categories, cohortes, corporatif, cours/nouveau, diffusion-progressive, evaluation-pairs, forfaits, grilles-evaluation, modeles-cours, outils-lti, parcours-roles, sessions-direct, xapi

---

## P3 — Medium (Responsive, Minor A11y, Polish)

### P3-01: carnet-notes and diffusion-progressive — raw text input for course ID not responsive
- **Files**: `carnet-notes/page.tsx`, `diffusion-progressive/page.tsx`
- **Detail**: The course ID input uses inline flex layout (`flex gap-2`) with fixed `w-64`. On narrow mobile screens (375px), this may overflow.

### P3-02: Corporate dashboard — Tailwind dynamic class interpolation
- **File**: `corporatif/[id]/dashboard/page.tsx`
- **Lines**: 37-38
- **Detail**: Uses dynamic Tailwind classes `bg-${color}/10` and `text-${color}` which are NOT safe — Tailwind purges unused classes at build time. The `color` prop values like `"primary"`, `"success"`, `"destructive"` will not generate valid CSS.
- **Impact**: Stat cards will have missing background/text colors in production.

### P3-03: Analytics page — Math.random() in skeleton causes hydration mismatch
- **File**: `src/app/admin/formation/analytics/page.tsx`
- **Line**: 111
- **Detail**: `style={{ height: \`${20 + Math.random() * 60}%\` }}` in `ChartSkeleton` component. Random values differ between server and client rendering, causing a React hydration mismatch warning.
- **Fix**: Use deterministic values or `suppressHydrationWarning`.

### P3-04: Glossaire page — large inline data arrays
- **File**: `src/app/(shop)/learn/glossaire/page.tsx`
- **Detail**: The PQAP glossary data is imported from `@/lib/lms/pqap-glossary`. This is fine, but the domain color mapping and filter logic is defined inline in the component, making the file large.
- **Impact**: Minor — maintainability concern only.

### P3-05: Achievements page — 30 SVG path constants inline
- **File**: `src/app/(shop)/learn/achievements/page.tsx`
- **Detail**: All 30 badge definitions with full SVG path data are defined inline as a const array. This makes the file very large and hard to maintain.
- **Impact**: Minor — maintainability concern.

### P3-06: Portal preview — img tags without next/image
- **File**: `src/app/admin/formation/portail/page.tsx`
- **Lines**: 138, 428
- **Detail**: Uses native `<img>` tags for logo preview. The `// eslint-disable-next-line @next/next/no-img-element` pattern is used elsewhere (media page). This is acceptable for user-provided URLs but loses Next.js image optimization.

### P3-07: Instructor avatar — img tag without next/image
- **File**: `src/app/admin/formation/instructeurs/page.tsx`
- **Line**: 160
- **Detail**: Uses native `<img>` for instructor avatars. Same concern as P3-06.

### P3-08: Media library — img tag without next/image
- **File**: `src/app/admin/formation/medias/page.tsx`
- **Line**: 235
- **Detail**: Uses native `<img>` for media thumbnails with explicit `eslint-disable` comment.

### P3-09: Student forfaits pages — no loading/error handling visible
- **Files**: `src/app/(shop)/learn/forfaits/page.tsx`, `src/app/(shop)/learn/forfaits/[slug]/page.tsx`
- **Detail**: Not fully verified but follows the same client-side fetch pattern. Should verify these pages have proper loading/error states.

### P3-10: Multiple pages use `confirm()` for delete without i18n
- **Files**: forfaits, corporatif (alert messages), media, badges, instructors, cert-templates
- **Detail**: The `confirm()` message is sometimes translated via `t()` but the native browser dialog cannot be styled or localized consistently across browsers.

### P3-11: CSV export in analytics — BOM character for Excel compatibility
- **File**: `src/app/admin/formation/analytics/page.tsx`
- **Line**: 343
- **Detail**: Uses `'\uFEFF'` BOM prefix for CSV export — this is correct for Excel compatibility but may cause issues with other CSV parsers. Not a bug, just a note.

### P3-12: Multiple student pages use hardcoded French strings
- **Files**: `cohorte/page.tsx` ("Ma cohorte", "Aucune cohorte active"), `sessions-live/page.tsx`, `discussions/page.tsx`, `xp/page.tsx` ("Chargement...")
- **Detail**: These student pages have hardcoded French strings instead of using `t()`.

---

## Pages with Good Quality (No Findings)

The following pages demonstrate solid quality across all criteria:

| Page | Loading | Error | Empty | Validation | i18n | A11y |
|------|---------|-------|-------|------------|------|------|
| analytics | Skeleton | Full error UI + retry | Per-section empty states | N/A | Full `t()` | aria-label on select |
| avis (reviews) | DataTable loading | Catch → empty | EmptyState | N/A | Full `t()` | aria-labels on actions |
| badges | Skeleton grid | Error in modal | EmptyState + CTA | name required | Full `t()` | aria-labels |
| categories | DataTable loading | Error in modal | EmptyState + CTA | name+slug required | Full `t()` | htmlFor labels |
| certificats | DataTable loading | Catch → empty | EmptyState | N/A | Full `t()` | - |
| classement | DataTable loading | Catch → empty | EmptyState | N/A | Full `t()` | aria-labels on toggle |
| conformite | StatCards + DataTable | Catch → empty | EmptyState | N/A | Full `t()` | - |
| cours (list) | DataTable loading | No catch (P1-04) | EmptyState + CTA | N/A | Full `t()` | - |
| cours/nouveau | N/A | Error block | N/A | title+slug required | Full `t()` | htmlFor, pattern |
| etudiants | DataTable loading | Catch → empty | EmptyState + filters | N/A | Full `t()` | - |
| inscriptions | Loader + DataTable | Error msg + Empty | EmptyState + CSV preview | email regex + course | Full `t()` | htmlFor, aria |
| instructeurs | DataTable loading | Error in modal | EmptyState + CTA | name required | Full `t()` | aria-labels |
| medias | Skeleton grid | Catch → empty | EmptyState + CTA | File type check | Full `t()` | aria-labels |
| modeles-certificats | Skeleton grid | Error in modal | EmptyState + CTA | name required | Full `t()` | aria-labels |
| parametres | Loader spinner | Error msg | N/A (settings form) | Type coercion | Full `t()` | role=switch, aria-checked |
| portail | Loader spinner | Error msg | N/A (config form) | Subdomain regex | Full `t()` | role=switch, aria-checked |
| progression | DataTable loading | Catch → empty | EmptyState | N/A | Full `t()` | - |
| quiz | DataTable loading | Catch → empty | EmptyState | Full quiz editor | Full `t()` | - |
| rapports | On-demand loading | Catch → empty | Per-report empty | N/A | Full `t()` | - |

---

## Recommendations — Priority Order

1. **P1-01 (XSS)**: Add `DOMPurify.sanitize()` to `LessonViewerClient.tsx` `renderMarkdown()` output — estimated 15 min.
2. **P1-02 (Auth)**: Add `auth()` check to `src/app/(shop)/learn/layout.tsx` — estimated 10 min.
3. **P1-04 (Crash)**: Add try/catch to `cours/page.tsx` `fetchCourses` — estimated 5 min.
4. **P1-05 (Wrong API)**: Change sessions-live student page to use a student API endpoint — estimated 15 min.
5. **P2-01 + P2-02**: Refactor 10 scaffold pages to use `useTranslations()` and proper TypeScript interfaces — estimated 2-3 hours.
6. **P2-05**: Replace course ID text inputs with dropdown selectors — estimated 30 min per page.
7. **P2-08/09/10**: Fix non-functional student pages (discussions, xp, cohorte) — estimated 1-2 hours.
8. **P2-13**: Resolve user IDs to names in admin tables — requires API changes, estimated 1-2 hours.
9. **P3-02**: Fix dynamic Tailwind classes in corporate dashboard — estimated 15 min.
10. **P3-03**: Fix hydration mismatch in analytics skeleton — estimated 5 min.
