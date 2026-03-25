# MEGA AUDIT V2 — Parcours End-to-End #1, #2, #3
## Date: 2026-03-25 | Auditeur: Claude Opus 4.6 | Scope: LMS Module Fresh Audit

---

## PARCOURS 1: Inscription Individuelle

### P1-01 [P0] SECURITY — Checkout: No duplicate enrollment check before Stripe session creation
**File**: `src/app/api/lms/checkout/route.ts:60-71`
**Code**:
```ts
if (type === 'course') {
    const course = await prisma.course.findFirst({ where: { id, tenantId } });
    // ... directly creates Stripe checkout session
```
**Issue**: For paid courses, the route never checks if the user is already enrolled before creating a Stripe Checkout session. A user who is already enrolled can be charged again. The `enrollUser()` call in the webhook will then throw "Already enrolled" AFTER payment is captured, leaving the customer charged without recourse in the normal flow.
**Fix**: Add `const existing = await prisma.enrollment.findUnique({ where: { tenantId_courseId_userId: { tenantId, courseId: id, userId } } }); if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });` before Stripe session creation.
**Category**: integrity

---

### P1-02 [P0] SECURITY — Checkout: No course status check for paid courses
**File**: `src/app/api/lms/checkout/route.ts:61`
**Code**:
```ts
const course = await prisma.course.findFirst({ where: { id, tenantId } });
```
**Issue**: The checkout route does not filter by `status: 'PUBLISHED'`. A user can buy a DRAFT or ARCHIVED course by passing its ID directly. The self-enrollment route `/api/lms/enroll` correctly calls `enrollUser()` which checks status, but the checkout route bypasses this for the Stripe session creation.
**Fix**: Add `status: 'PUBLISHED'` to the where clause.
**Category**: integrity

---

### P1-03 [P1] INTEGRITY — Webhook: enrollUser + updateMany is a TOCTOU race
**File**: `src/app/api/payments/webhook/route.ts:1652-1664`
**Code**:
```ts
await enrollUser(tenantId, itemId, userId);
// Update enrollment with payment info
await prisma.enrollment.updateMany({
    where: { tenantId, courseId: itemId, userId },
    data: { enrollmentSource: 'purchase', paymentType: ... },
});
```
**Issue**: `enrollUser()` runs inside a `$transaction` that creates the enrollment, but the subsequent `updateMany` runs outside that transaction. If the process crashes between the two, the enrollment exists but with `enrollmentSource: 'self'` instead of `'purchase'`. More critically, if two webhook retries fire concurrently, the first `enrollUser()` succeeds and the second throws "Already enrolled", causing the webhook handler to throw an unhandled error.
**Fix**: Wrap the enrollment + update + CourseOrder creation in a single `prisma.$transaction()`. Alternatively, catch "Already enrolled" in the webhook and treat it as idempotent success.
**Category**: integrity

---

### P1-04 [P1] SECURITY — Checkout: `getBaseUrl()` trusts the Host header
**File**: `src/app/api/lms/checkout/route.ts:186-189`
**Code**:
```ts
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') ?? 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}
```
**Issue**: `Host` and `x-forwarded-proto` headers are attacker-controlled. An attacker sending `Host: evil.com` would cause the Stripe success/cancel URLs to point to `https://evil.com/learn/dashboard?checkout=success`. After payment, the user is redirected to a phishing domain. CWE-601 (Open Redirect).
**Fix**: Use `process.env.NEXT_PUBLIC_APP_URL` or a hardcoded allowlist instead of trusting request headers.
**Category**: security

---

### P1-05 [P1] INTEGRITY — Checkout: Extra DB query for cancel URL slug
**File**: `src/app/api/lms/checkout/route.ts:114`
**Code**:
```ts
cancel_url: `${getBaseUrl(request)}/learn/${(await prisma.course.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? ''}?checkout=cancelled`,
```
**Issue**: The course was already fetched on line 61. This extra `findUnique` is redundant and adds latency. It also does NOT check tenantId, so in theory it could leak another tenant's course slug (though the impact is low).
**Fix**: Use the `course` variable already fetched: `cancel_url: \`...\${course.slug}...\``
**Category**: performance

---

### P1-06 [P1] SECURITY — Enroll route: `session.user.id!` non-null assertion
**File**: `src/app/api/lms/enroll/route.ts:35`
**Code**:
```ts
const enrollment = await enrollUser(tenantId, parsed.data.courseId, session.user.id!);
```
**Issue**: The `!` asserts non-null but `session.user.id` could be `undefined` in edge cases (e.g., corrupt session). If it's undefined, the enrollment will be created with `userId: undefined`, which Prisma will reject but with an unhelpful error. The checkout route (line 44) correctly checks `if (!userId)`.
**Fix**: Add `if (!session.user.id) return NextResponse.json({ error: 'User ID missing' }, { status: 401 });` before the call.
**Category**: robustness

---

### P1-07 [P2] INTEGRITY — Enroll route: sends email outside of try-catch for enrollUser
**File**: `src/app/api/lms/enroll/route.ts:38-45`
**Code**:
```ts
const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId }, select: { title: true, slug: true } });
```
**Issue**: The email-sending code fetches the course outside the enrollment try-catch. If `enrollUser` succeeds but this `findUnique` throws (e.g., DB connection drop), the route returns 500 even though enrollment succeeded. The enrollment is created but the user sees an error.
**Fix**: Move the email block into a separate try-catch or fire-and-forget pattern.
**Category**: robustness

---

### P1-08 [P2] UX — LearnPageClient uses hardcoded article data, not DB courses
**File**: `src/app/(shop)/learn/LearnPageClient.tsx:7-83`
**Issue**: The "Learning Center" landing page shows hardcoded peptide articles, not the actual LMS courses from the database. A student browsing `/learn` sees static articles rather than the course catalog. The actual course catalog is served by `/api/lms/courses` but `LearnPageClient` never calls it.
**Fix**: Either integrate the course catalog into LearnPageClient, or add a clear navigation path to `/learn/dashboard` or a dedicated catalog page.
**Category**: UX

---

### P1-09 [P2] UX — Article slug collision with course slugs
**File**: `src/app/(shop)/learn/[slug]/page.tsx`
**Issue**: The `[slug]` route renders hardcoded articles. If a course has the same slug as one of the 8 hardcoded articles (e.g., "what-are-peptides"), the student will see the article instead of the course detail page. The `CourseDetailClient` component exists but this page file only renders `ArticlePageClient` with `articlesContent`.
**Fix**: The `[slug]/page.tsx` should first check if slug matches a course (via API or direct query), and fall back to article rendering only if no course matches.
**Category**: UX

---

### P1-10 [P1] INTEGRITY — Webhook LMS handler: no try-catch for enrollUser failure
**File**: `src/app/api/payments/webhook/route.ts:1652-1654`
**Code**:
```ts
if (type === 'course') {
    await enrollUser(tenantId, itemId, userId);
```
**Issue**: If `enrollUser()` throws (e.g., "Already enrolled" from a duplicate webhook delivery, or "Course is full"), the exception propagates up and the webhook returns 500, causing Stripe to retry indefinitely. The in-memory dedup cache only covers 10 minutes, so retries after that window will hit the same error.
**Fix**: Wrap in try-catch, treating "Already enrolled" as idempotent success. For other errors, log and mark the webhook event as failed to prevent infinite retries.
**Category**: integrity

---

### P1-11 [P2] INTEGRITY — Checkout: bundle free enrollment bypass
**File**: `src/app/api/lms/checkout/route.ts:125-183`
**Issue**: For courses, `isFree` is checked and the user is enrolled directly (line 68-71). But for bundles, there is no `isFree` check. If a bundle has `price: 0` (not corporate-sponsored), the route will attempt to create a Stripe session with `unit_amount: 0`, which Stripe may reject or process as a $0 charge.
**Fix**: Add a free bundle check: `if (bundle.price === 0 || bundle.price === null) { await enrollUserInBundle(...); return ... }`
**Category**: integrity

---

## PARCOURS 2: Parrainage Corporatif

### P2-01 [P0] INTEGRITY — Corporate enroll: budget NOT checked before enrolling
**File**: `src/app/api/admin/lms/corporate/[id]/enroll/route.ts:55-130`
**Issue**: The route enrolls employees and increments `budgetUsed` (line 126-129) but NEVER checks if `budgetUsed + totalCost <= budgetAmount`. A corporate account with a $5,000 budget can enroll employees worth $50,000 because the budget is only updated, never validated against the cap.
**Fix**: Before the enrollment loop, calculate total cost and check: `if (account.budgetAmount && Number(account.budgetUsed) + expectedCost > Number(account.budgetAmount)) return apiError('Budget exceeded', ...)`
**Category**: integrity

---

### P2-02 [P1] INTEGRITY — Corporate enroll: error handling swallows individual course failures
**File**: `src/app/api/admin/lms/corporate/[id]/enroll/route.ts:117-121`
**Code**:
```ts
} catch {
    results.enrollmentsSkipped++;
}
```
**Issue**: When enrolling individual courses (not bundles), ANY error is silently counted as "skipped". This includes "Course is full", "Enrollment closed", or database errors. The admin sees `enrollmentsSkipped: 3` but has no idea why. The bundle path (line 74-76) correctly captures the error message, but the course path does not.
**Fix**: Capture and report the error message: `} catch (err) { results.errors.push(\`Failed: \${(err as Error).message}\`); }`
**Category**: robustness

---

### P2-03 [P1] INTEGRITY — Corporate enroll: N+1 email queries
**File**: `src/app/api/admin/lms/corporate/[id]/enroll/route.ts:137-146`
**Code**:
```ts
for (const userId of userIds) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
```
**Issue**: For 500 employees (max batch), this sends 500 sequential DB queries. With a 5ms round trip, that is 2.5 seconds of DB time just for email lookups.
**Fix**: Batch fetch: `const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } });`
**Category**: performance

---

### P2-04 [P1] SECURITY — Corporate create: slug uniqueness not enforced across tenants
**File**: `src/app/api/admin/lms/corporate/route.ts:39-48`
**Code**:
```ts
const account = await prisma.corporateAccount.create({
    data: { tenantId, ...parsed.data, ... },
});
```
**Issue**: The Prisma schema has `@@unique([tenantId, slug])`, but the route does NOT check for existing slugs before creating. If the slug already exists, Prisma will throw a raw P2002 error that is not caught, returning a 500 with potentially leaking internal details.
**Fix**: Add a try-catch for Prisma unique constraint errors, returning a user-friendly 409.
**Category**: robustness

---

### P2-05 [P1] SECURITY — Corporate employees: userId not validated as real user
**File**: `src/app/api/admin/lms/corporate/[id]/employees/route.ts:60-81`
**Issue**: When adding employees, the route accepts any `userId` string and creates a `CorporateEmployee` record. It never verifies that the userId corresponds to an actual User in the same tenant. An admin can add ghost userIds that don't exist, leading to broken enrollments later.
**Fix**: Validate each userId: `const user = await prisma.user.findFirst({ where: { id: emp.userId, tenantId } }); if (!user) { results.skipped++; continue; }`
**Category**: integrity

---

### P2-06 [P1] INTEGRITY — Corporate employee N+1: sequential DB queries in loop
**File**: `src/app/api/admin/lms/corporate/[id]/employees/route.ts:60-82`
**Code**:
```ts
for (const emp of employeesToAdd) {
    const existing = await prisma.corporateEmployee.findUnique({ ... });
    // ...
    await prisma.corporateEmployee.create({ ... });
```
**Issue**: For a bulk add of 500 employees, this executes up to 1000 sequential DB queries (500 findUnique + 500 create). This will timeout on large batches.
**Fix**: Batch the existence check: `const existingEmps = await prisma.corporateEmployee.findMany({ where: { corporateAccountId: id, userId: { in: employeesToAdd.map(e => e.userId) } } }); const existingSet = new Set(existingEmps.map(e => e.userId));` Then use `createMany` for all new employees.
**Category**: performance

---

### P2-07 [P2] SECURITY — Corporate dashboard: no check that corporate account belongs to tenant
**File**: `src/app/api/admin/lms/corporate/[id]/dashboard/route.ts:14`
**Code**:
```ts
const stats = await getCorporateDashboardStats(tenantId, id);
```
**Issue**: The `id` comes from URL params and is passed directly. The `getCorporateDashboardStats` function does check `findFirst({ where: { id: corporateAccountId, tenantId } })`, so tenant isolation is technically enforced. However, the route swallows ALL errors as "Corporate account not found" (line 16-17), masking real database errors.
**Fix**: Distinguish between not-found and internal errors in the catch block.
**Category**: robustness

---

### P2-08 [P1] INTEGRITY — Corporate enroll: courseBundleOrder.amount double-counts
**File**: `src/app/api/admin/lms/corporate/[id]/enroll/route.ts:80-93`
**Code**:
```ts
await prisma.courseBundleOrder.create({
    data: {
        amount: pricing.price * userIds.length,
        totalAmount: pricing.price * userIds.length,
```
**Issue**: If some users were already enrolled (skipped via `enrollUserInBundle`), the order amount still reflects ALL users, not just the newly enrolled ones. The corporate account is charged the full price even when some enrollments were skipped.
**Fix**: Use `results.enrollmentsCreated` count or track per-user pricing to compute the actual cost.
**Category**: integrity

---

### P2-09 [P2] INTEGRITY — Corporate dashboard stats: lessonProgress loaded without tenant filter
**File**: `src/lib/lms/lms-service.ts:950-953`
**Code**:
```ts
include: {
    lessonProgress: { select: { isCompleted: true, quizScore: true, quizPassed: true } },
},
```
**Issue**: The `lessonProgress` relation is loaded via enrollment include without filtering by tenantId. While the parent enrollments are tenant-filtered, if the LessonProgress table had orphaned records from a different tenant (e.g., from a migration), they would be included. Low-severity but violates defense-in-depth.
**Fix**: Add `where: { tenantId }` to the lessonProgress include.
**Category**: integrity

---

### P2-10 [P2] INTEGRITY — Corporate enroll: bundle courses may belong to different tenant
**File**: `src/app/api/admin/lms/corporate/[id]/enroll/route.ts:56-57`
**Code**:
```ts
const bundle = await prisma.courseBundle.findFirst({ where: { id: itemId, tenantId } });
```
**Issue**: The bundle is verified to belong to the tenant, but `enrollUserInBundle` internally fetches the bundle again without tenant check on the contained courses. If a bundle's items somehow reference courses from another tenant, the enrollment would cross tenant boundaries. The `enrollUserInBundle` function does check `bundle.tenantId !== tenantId` but does NOT verify each `item.course.tenantId`.
**Fix**: In `enrollUserInBundle`, verify each `item.course` belongs to the same tenant.
**Category**: security

---

### P2-11 [P1] SECURITY — Corporate employee DELETE: uses query param for userId
**File**: `src/app/api/admin/lms/corporate/[id]/employees/route.ts:90-91`
**Code**:
```ts
const userId = searchParams.get('userId');
```
**Issue**: DELETE requests should not rely on query parameters for critical identifiers because query params are logged in server access logs, proxy logs, and browser history. The `userId` is PII-adjacent (it's a user identifier). RFC 7231 recommends DELETE bodies or path params.
**Fix**: Accept `userId` in the request body or as a path parameter.
**Category**: security

---

## PARCOURS 3: Progression Sequentielle

### P3-01 [P0] SECURITY — Lesson page: missing tenant isolation on course query
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/page.tsx:35-39`
**Code**:
```ts
const course = await prisma.course.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      ...(tenantId ? { tenantId } : {}),
    },
```
**Issue**: If `tenantId` is null (line 27-31 catches the error silently), the query has NO tenant filter. This means a student can access any published course from any tenant by navigating to `/learn/{slug}/{chapterId}/{lessonId}`. This is a cross-tenant data leak.
**Fix**: If `tenantId` is null, redirect to login or return 403. Never allow unscoped queries.
**Category**: security

---

### P3-02 [P1] SECURITY — Lesson page: no canAccessLesson gate enforcement
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/page.tsx:19-193`
**Issue**: The page checks enrollment (line 81-96) and validates chapterId/lessonId (lines 103-111), but it NEVER calls `canAccessLesson()` server-side. Sequential completion is enforced only client-side in the sidebar (LessonViewerClient line 406). A student can bypass the sequential gate by directly navigating to any lesson URL.
**Fix**: After finding the enrollment, call `const access = await canAccessLesson(tenantId, enrollment.id, lessonId); if (!access.allowed) redirect(\`/learn/\${slug}\`);`
**Category**: security

---

### P3-03 [P1] INTEGRITY — updateLessonProgress: completedAt set but never unset
**File**: `src/lib/lms/lms-service.ts:296-301`
**Code**:
```ts
update: {
    ...data,
    completedAt: data.isCompleted ? new Date() : undefined,
```
**Issue**: When `isCompleted` is `true`, `completedAt` is set to `new Date()`. When `isCompleted` is `false`, `completedAt` is set to `undefined` (which means "don't update" in Prisma, NOT "set to null"). So a lesson that was marked complete and then unmarked keeps its `completedAt` timestamp, even though `isCompleted` is now `false`. This creates a data inconsistency.
**Fix**: Change `undefined` to `null` when `data.isCompleted === false`: `completedAt: data.isCompleted === true ? new Date() : data.isCompleted === false ? null : undefined`
**Category**: integrity

---

### P3-04 [P1] INTEGRITY — recalculateEnrollmentProgress: reads outside transaction
**File**: `src/lib/lms/lms-service.ts:323-386`
**Issue**: `recalculateEnrollmentProgress` is called from `updateLessonProgress` but runs entirely without a transaction. If two lessons are completed simultaneously (e.g., parallel API calls from a quiz auto-complete), both reads see the same `lessonProgress` state, and both write the same `lessonsCompleted` count. One completion is lost.
**Fix**: Wrap `recalculateEnrollmentProgress` in a `prisma.$transaction()` with `isolationLevel: 'Serializable'` or use an atomic increment approach.
**Category**: integrity

---

### P3-05 [P1] INTEGRITY — recalculateEnrollmentProgress: course completion increments outside enrollment check
**File**: `src/lib/lms/lms-service.ts:348-351`
**Code**:
```ts
await prisma.course.update({
    where: { id: enrollment.courseId },
    data: { completionCount: { increment: 1 } },
});
```
**Issue**: This runs BEFORE the enrollment is updated to COMPLETED (line 385). If the process crashes between lines 351 and 385, the course `completionCount` is incremented but the enrollment remains ACTIVE. On the next progress update, `progressPercent >= 100 && !enrollment.completedAt` is true again, incrementing `completionCount` a second time.
**Fix**: Move the course update to after the enrollment update, or wrap both in a single transaction. Also add a guard: only increment if the enrollment was NOT already COMPLETED.
**Category**: integrity

---

### P3-06 [P1] INTEGRITY — canAccessExam: quiz pass check uses lessonProgress.quizPassed, not QuizAttempt
**File**: `src/lib/lms/lms-service.ts:774-776`
**Code**:
```ts
const quizPassedSet = new Set(
    enrollment.lessonProgress.filter(p => p.quizPassed).map(p => p.lessonId)
);
```
**Issue**: `quizPassed` on `LessonProgress` is only set when the student explicitly calls `updateLessonProgress` with `quizPassed: true`. But the quiz submission route (`/api/lms/quiz`) calls `submitQuizAttempt()` which creates a `QuizAttempt` but does NOT update `LessonProgress.quizPassed`. So a student can pass all quizzes but still be blocked from the exam because `quizPassed` is never set on their LessonProgress.
**Fix**: In `submitQuizAttempt`, after a passing attempt, update the corresponding LessonProgress: `await prisma.lessonProgress.updateMany({ where: { lessonId: quiz.lesson.id, userId }, data: { quizPassed: true } });`
**Category**: integrity

---

### P3-07 [P1] INTEGRITY — issueCertificate: nested await in Prisma where clause
**File**: `src/lib/lms/lms-service.ts:501`
**Code**:
```ts
where: { tenantId, userId, enrollment: { courseId: (await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { courseId: true } }))?.courseId ?? '' } },
```
**Issue**: This is an inline `await` inside a Prisma `where` object. If `findUnique` returns null, `courseId` becomes `''`, and the `findFirst` searches for a certificate with `courseId: ''`, which will never match. So the duplicate check is silently bypassed for invalid enrollmentIds. Also, this is a separate DB query when the enrollmentId is already known and the enrollment is fetched again on line 508.
**Fix**: Fetch the enrollment once and use its courseId for the duplicate check.
**Category**: integrity

---

### P3-08 [P2] INTEGRITY — issueCertificate: certificate issued but enrollment not linked atomically
**File**: `src/lib/lms/lms-service.ts:548-563`
**Issue**: The certificate is created (line 548) and then the enrollment is updated (line 560-563) in separate operations. If the process crashes between the two, a certificate exists but is orphaned (no enrollment points to it). The enrichment query in `/api/lms/certificates` (line 53) tries to find the enrollment by `certificateId`, which would fail for orphaned certificates.
**Fix**: Wrap certificate creation + enrollment update in `prisma.$transaction()`.
**Category**: integrity

---

### P3-09 [P2] PERFORMANCE — canAccessLesson: fetches entire course with all lessons
**File**: `src/lib/lms/lms-service.ts:678-693`
**Issue**: Every time a student navigates to a lesson, `canAccessLesson` loads the full course with ALL chapters, ALL lessons, and ALL lessonProgress. For a course with 200 lessons, this is a heavy query just to check if one lesson is accessible.
**Fix**: Use a count-based approach: count completed lessons with `sortOrder < targetLesson.sortOrder` and compare to total lessons with lower sortOrder.
**Category**: performance

---

### P3-10 [P2] PERFORMANCE — canAccessExam: also fetches entire course
**File**: `src/lib/lms/lms-service.ts:746-763`
**Issue**: Same as P3-09. The exam gate loads all chapters, all lessons, and all lessonProgress just to check if any are incomplete.
**Fix**: Use aggregate queries instead of loading everything into memory.
**Category**: performance

---

### P3-11 [P1] SECURITY — LessonViewerClient: videoUrl rendered as iframe src without validation
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:558-567`
**Code**:
```ts
{lesson.type === 'VIDEO' && lesson.videoUrl && (
    <div className="aspect-video bg-black">
        <iframe src={lesson.videoUrl} ...
```
**Issue**: `lesson.videoUrl` comes from the database and is rendered directly as an iframe `src`. If an admin is tricked into entering a malicious URL (e.g., `javascript:...` or a data URI), this becomes an XSS vector. The `videoExplainerUrl` (line 627) has the same issue. CWE-79.
**Fix**: Validate that URLs start with `https://` and match an allowlist of video hosts (youtube.com, vimeo.com, etc.).
**Category**: security

---

### P3-12 [P1] SECURITY — LessonViewerClient: visualAnchorUrl renders unvalidated img src
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:604-608`
**Code**:
```ts
<img src={lesson.visualAnchorUrl} alt={...} className="max-w-full rounded-lg mx-auto" />
```
**Issue**: `visualAnchorUrl` is rendered as an `<img>` tag. A malicious URL like `https://evil.com/track.gif?userId=X` could be used for tracking. More importantly, if the URL is a `javascript:` or `data:` URI, it could be exploited. Also, `<img>` tags with external URLs bypass CSP in some configurations.
**Fix**: Validate the URL against an allowlist of image hosts or require URLs to be from the same origin.
**Category**: security

---

### P3-13 [P2] UX — LessonViewerClient: "Mark Complete" has no undo
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:235-255`
**Issue**: Once a student marks a lesson complete, the button changes to a static "Marked complete" label with no way to undo. The API supports `isCompleted: false`, but the UI does not expose it. If a student accidentally marks a lesson complete, they cannot reverse it.
**Fix**: Add an "Undo" button or make the completed state toggleable.
**Category**: UX

---

### P3-14 [P2] UX — LessonViewerClient: silent failure on mark complete
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:247-253`
**Code**:
```ts
} catch {
    // silent fail
}
```
**Issue**: If the progress update API call fails (network error, 500, etc.), the error is silently swallowed. The student sees the button go back to "Mark Complete" without any error message. They may think it worked if they navigate away.
**Fix**: Show an error toast: `setError('Failed to save progress. Please try again.')`.
**Category**: UX

---

### P3-15 [P2] UX — Exam page: hardcoded French strings
**File**: `src/app/(shop)/learn/[slug]/examen/page.tsx:45-165`
**Issue**: The exam page contains numerous hardcoded French strings: "Chargement de l'examen...", "Cours non trouve", "Examen de qualification", "Examen reussi!", "Examen verrouille", "Lecons restantes:", "Commencer l'examen", "Tentatives precedentes", "Reussi", "Echoue", "Continuer le cours". These should use `t()` for i18n support. The app supports 22 locales.
**Fix**: Replace all hardcoded strings with `t('lms.exam.xxx')` keys and add them to all 22 locale files.
**Category**: UX

---

### P3-16 [P1] SECURITY — Exam page: courseId fetched via public courses endpoint
**File**: `src/app/(shop)/learn/[slug]/examen/page.tsx:31-36`
**Code**:
```ts
fetch(`/api/lms/courses?slug=${slug}`)
    .then(r => r.json())
    .then(async (d) => {
        const course = d.data?.courses?.[0] ?? d.data;
        if (!course?.id) { setError('Cours non trouve'); return; }
        const res = await fetch(`/api/lms/exam/${course.id}`);
```
**Issue**: The `/api/lms/courses` endpoint does not support a `slug` filter parameter. Looking at the route handler (lines 20-26), it only supports `category`, `search`, and `level` params. So `d.data?.courses?.[0]` returns the first published course, NOT the one matching the slug. The exam is then loaded for the wrong course.
**Fix**: Either add `slug` support to `/api/lms/courses`, or fetch the course detail from a dedicated endpoint like `/api/lms/courses/[slug]`.
**Category**: security/integrity

---

### P3-17 [P2] INTEGRITY — updateLessonProgress: videoProgress not upper-bounded
**File**: `src/lib/lms/lms-service.ts:281-282`
**Code**:
```ts
if (data.videoProgress !== undefined && data.videoProgress < 0) {
    throw new Error("Video progress cannot be negative");
}
```
**Issue**: Video progress is validated as `>= 0` but has no upper bound. A client could send `videoProgress: 999999999`, which would be stored. The `videoProgress.int()` Zod validation in the progress route (line 19) uses `z.number().int().min(0)` without `.max()`.
**Fix**: Add `.max(86400)` (max video duration in seconds) to the Zod schema, and validate in the service.
**Category**: integrity

---

### P3-18 [P2] PERFORMANCE — Progress route leaks Zod error details
**File**: `src/app/api/lms/progress/route.ts:52`
**Code**:
```ts
return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
```
**Issue**: Unlike other routes that hide Zod details (quiz route, checkout route), the progress route exposes full Zod error details including field names and validation messages. This leaks internal schema information (CWE-209).
**Fix**: Remove `details: parsed.error.flatten()` — return only `{ error: 'Validation failed' }`.
**Category**: security

---

### P3-19 [P2] INTEGRITY — recalculateEnrollmentProgress: division by totalLessons which could be stale
**File**: `src/lib/lms/lms-service.ts:331`
**Code**:
```ts
const total = enrollment.totalLessons || 1;
```
**Issue**: `totalLessons` is set at enrollment time and never updated. If the instructor adds or removes lessons after enrollment, `totalLessons` is stale. A course with 10 lessons at enrollment time that later grows to 20 shows 100% completion when only 10/20 lessons are done.
**Fix**: Recount lessons on each progress recalculation: `const total = await prisma.lesson.count({ where: { chapter: { courseId: enrollment.courseId }, isPublished: true } });`
**Category**: integrity

---

### P3-20 [P2] SECURITY — Certificate verify: timing oracle for enumeration
**File**: `src/app/api/lms/certificates/verify/route.ts:25-28`
**Code**:
```ts
const certificate = await verifyCertificate(code);
if (!certificate) {
    return NextResponse.json({ valid: false, error: 'Certificate not found' }, { status: 404 });
}
```
**Issue**: The response distinguishes between "not found" (404) and "found but expired/revoked" (200 with `valid: false`). An attacker can enumerate valid certificate codes by checking for 200 vs 404. Rate limiting (30/min) partially mitigates but is too generous for enumeration (1800 guesses/hour per IP).
**Fix**: Always return 200 with `valid: false` for both not-found and found-but-invalid cases. Reduce rate limit to 10/min.
**Category**: security

---

### P3-21 [P1] INTEGRITY — enrollUserInBundle: not wrapped in transaction
**File**: `src/lib/lms/lms-service.ts:840-916`
**Issue**: `enrollUserInBundle` creates multiple enrollments in a loop (line 890-902) and then increments the bundle enrollment count (line 909-912), all without a transaction. If the process fails mid-loop, some enrollments exist while others don't, and the bundle count may or may not be incremented. Unlike `enrollUser` which uses `$transaction`, the bundle variant does not.
**Fix**: Wrap the entire function body in `prisma.$transaction()`.
**Category**: integrity

---

### P3-22 [P2] PERFORMANCE — enrollUserInBundle: N+1 lesson count queries
**File**: `src/lib/lms/lms-service.ts:886-888`
**Code**:
```ts
const totalLessons = await prisma.lesson.count({
    where: { chapter: { courseId: item.courseId }, isPublished: true },
});
```
**Issue**: For each course in the bundle, a separate count query is executed. For a bundle with 10 courses, that's 10 extra queries.
**Fix**: Batch the lesson counts upfront using `groupBy` or a raw query.
**Category**: performance

---

### P3-23 [P2] INTEGRITY — Lesson page: fetches all lesson content for sidebar, including manualText and supplementaryTexts
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/page.tsx:42-69`
**Issue**: The server query fetches `manualText`, `supplementaryTexts`, `textContent`, and other heavy fields for ALL lessons in the course (not just the current one). These are passed into the outline prop unnecessarily. For a course with 100 lessons, each with 5KB of manual text, that's 500KB of serialized data sent to the client.
**Fix**: Only select heavy content fields for the current lesson. The outline only needs `id`, `title`, `type`, `chapterId`.
**Category**: performance

---

### P3-24 [P2] UX — Aurelia widget: non-functional
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:542-553`
**Issue**: The Aurelia chat widget has a text input and "Send" button, but the button has no `onClick` handler. The input has no state management (no `useState`, no `onChange`). The widget is purely cosmetic and cannot actually send messages.
**Fix**: Either implement the Aurelia integration or remove the widget to avoid confusing students.
**Category**: UX

---

### P3-25 [P2] UX — Notes: stored in localStorage, lost on device change
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:149-162`
**Issue**: Student notes are saved to `localStorage` with key `lms-notes-{lessonId}`. Notes are lost when the student uses a different browser or device. For a compliance-oriented LMS, this is a significant limitation.
**Fix**: Sync notes to the server via an API endpoint (e.g., `PATCH /api/lms/progress` with a `notes` field on LessonProgress).
**Category**: UX

---

### P3-26 [P1] INTEGRITY — recalculateEnrollmentProgress: auto-certificate only issued when certificateTemplateId exists
**File**: `src/lib/lms/lms-service.ts:363-382`
**Code**:
```ts
if (course?.certificateTemplateId) {
    try {
        // ...
        await issueCertificate(enrollment.tenantId, enrollmentId, enrollment.userId, studentName);
    } catch {
        // Certificate issuance failure should not block completion
    }
```
**Issue**: The auto-certificate logic silently catches ALL errors, including "Required quizzes not passed". This means a student who completes 100% of lessons but fails quizzes will still have their enrollment marked as COMPLETED, but no certificate is issued, and no error is surfaced anywhere. The student sees "Course Completed" but has no certificate and no explanation why.
**Fix**: Log the error with context so admins can diagnose: `catch (err) { logger.warn('[LMS] Certificate not issued', { enrollmentId, reason: (err as Error).message }); }`
**Category**: integrity

---

### P3-27 [P2] SECURITY — LessonProgress: timeSpent can be spoofed
**File**: `src/lib/lms/lms-service.ts:283-286`
**Issue**: `timeSpent` is accepted from the client and incrementally added to the stored value. A student can send `timeSpent: 28800` (8 hours max per update) repeatedly to inflate their study time. For compliance courses where time-on-task matters, this undermines auditability.
**Fix**: Track time server-side using `lastAccessedAt` deltas, or at minimum validate that the cumulative timeSpent doesn't exceed wallclock time since enrollment.
**Category**: security

---

### P3-28 [P2] UX — Course completion page: /api/lms/course-completion endpoint does not exist
**File**: `src/app/(shop)/learn/[slug]/complete/page.tsx:145`
**Code**:
```ts
const res = await fetch(`/api/lms/course-completion?slug=${slug}`);
```
**Issue**: The course completion page calls `/api/lms/course-completion` which does not exist in the API routes (searched all routes, no match). The page will always show a loading spinner followed by the error state.
**Fix**: Create the `/api/lms/course-completion/route.ts` endpoint that returns the `CompletionData` interface.
**Category**: UX

---

### P3-29 [P2] UX — Course completion page: /api/lms/reviews endpoint does not exist
**File**: `src/app/(shop)/learn/[slug]/complete/page.tsx:168`
**Code**:
```ts
await fetch('/api/lms/reviews', { method: 'POST', ... });
```
**Issue**: The review submission calls `/api/lms/reviews` which does not exist. The review form will silently fail (the catch block is empty, line 178-179).
**Fix**: Create the `/api/lms/reviews/route.ts` endpoint.
**Category**: UX

---

### P3-30 [P2] UX — Course completion page: /api/lms/certificate-pdf endpoint does not exist
**File**: `src/app/(shop)/learn/[slug]/complete/page.tsx:269`
**Code**:
```ts
<a href={`/api/lms/certificate-pdf?code=${data.verificationCode}`}
```
**Issue**: The "Download PDF" button links to `/api/lms/certificate-pdf` which does not exist. Clicking it will return a 404.
**Fix**: Create the PDF generation endpoint or link to an existing one.
**Category**: UX

---

### P3-31 [P1] SECURITY — Checkout: promoCode accepted but never applied
**File**: `src/app/api/lms/checkout/route.ts:20-24`
**Code**:
```ts
const checkoutSchema = z.object({
  type: z.enum(['course', 'bundle']),
  id: z.string().min(1),
  promoCode: z.string().optional(),
});
```
**Issue**: The schema accepts a `promoCode` field, but it is never used in the handler. `parsed.data.promoCode` is never read or applied to pricing. This is misleading if the frontend sends promo codes, as users would think their discount was applied.
**Fix**: Either implement promo code logic or remove the field from the schema.
**Category**: integrity

---

### P3-32 [P1] INTEGRITY — enrollUser: enrollment count increment is denormalized and can drift
**File**: `src/lib/lms/lms-service.ts:199-202`
**Code**:
```ts
await tx.course.update({
    where: { id: courseId },
    data: { enrollmentCount: { increment: 1 } },
});
```
**Issue**: `enrollmentCount` is incremented on enrollment but NEVER decremented on cancellation or suspension. The LMS refund handler suspends enrollments (webhook line 1742-1744) but does not decrement `enrollmentCount`. Over time, the count will be inflated.
**Fix**: Add `enrollmentCount: { decrement: 1 }` in the refund handler. Also add a periodic reconciliation job.
**Category**: integrity

---

### P3-33 [P2] INTEGRITY — resolvePricing: corporatePrice of 0 treated as "no corporate price"
**File**: `src/lib/lms/lms-service.ts:1039-1047`
**Code**:
```ts
const corpPrice = Number(item.corporatePrice ?? 0);
if (corpPrice > 0) {
    return { price: corpPrice, ... };
}
```
**Issue**: A legitimate corporate price of $0 (fully sponsored) is treated as "no corporate price set" because the check is `> 0`. The function falls through to the account-level discount, which may be less favorable.
**Fix**: Check for explicit null/undefined: `if (item.corporatePrice !== null && item.corporatePrice !== undefined)`
**Category**: integrity

---

### P3-34 [P2] SECURITY — Certificates route: N+1 enrollment queries for thumbnail enrichment
**File**: `src/app/api/lms/certificates/route.ts:48-63`
**Code**:
```ts
const enrichedCertificates = await Promise.all(
    certificates.map(async (cert) => {
        const enrollment = await prisma.enrollment.findFirst({ ... });
```
**Issue**: For each certificate (up to 100), a separate DB query fetches the enrollment. For a prolific student, this means up to 100 sequential queries.
**Fix**: Batch fetch enrollments: `const enrollments = await prisma.enrollment.findMany({ where: { certificateId: { in: certIds } } })`
**Category**: performance

---

### P3-35 [P2] SECURITY — Student dashboard: streak model uses userId as primary lookup without tenant
**File**: `src/app/api/lms/student/dashboard/route.ts:36-39`
**Code**:
```ts
prisma.lmsStreak.findUnique({
    where: { userId },
    select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
}),
```
**Issue**: The `LmsStreak` model uses `userId` as a unique key (not tenant-scoped). If two tenants have users with the same ID (unlikely with CUID but possible in migration scenarios), streaks would be shared across tenants.
**Fix**: Use a tenant+user compound lookup or verify the streak's tenantId matches.
**Category**: security

---

### P3-36 [P2] INTEGRITY — Bulk enrollment route: Promise.allSettled creates parallel enrollments without coordination
**File**: `src/app/api/admin/lms/enrollments/route.ts:62-66`
**Code**:
```ts
const results = await Promise.allSettled(
    parsed.data.userIds.map(userId =>
        enrollUser(tenantId, parsed.data.courseId, userId, session.user.id)
    )
);
```
**Issue**: `enrollUser` uses `$transaction` internally, but all users are enrolled in parallel. For a course with `maxEnrollments: 50` and 100 parallel enrollment attempts, the race condition means more than 50 enrollments could be created because each transaction reads the count independently before the others commit.
**Fix**: Process sequentially or use a distributed lock/semaphore on the courseId.
**Category**: integrity

---

### P3-37 [P2] INTEGRITY — Bulk enrollment CSV route: error messages leak to admin
**File**: `src/app/api/admin/lms/enrollments/bulk/route.ts:99-108`
**Code**:
```ts
} else {
    errors.push({
        email: row.email,
        courseSlug: row.courseSlug,
        reason: error instanceof Error ? error.message : 'unknown_error',
    });
}
```
**Issue**: Raw error messages from `enrollUser` are pushed into the response. While this is an admin-only route, internal error messages like "PrismaClientKnownRequestError: ..." should not be exposed.
**Fix**: Map known error messages to safe codes; default to "enrollment_failed".
**Category**: security

---

### P3-38 [P2] UX — LessonViewerClient: study timer not persisted
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:87-133`
**Issue**: The study timer resets to 0 on every page load. It's a purely local counter that is never sent to the server. Navigating between lessons resets it. It provides no value for tracking actual study time.
**Fix**: Send the timer value to the server when marking complete (via `timeSpent` field), or persist it in localStorage across lesson navigations.
**Category**: UX

---

### P3-39 [P1] INTEGRITY — LMS refund: bundle enrollment suspension is fire-and-forget
**File**: `src/app/api/payments/webhook/route.ts:1761-1765`
**Code**:
```ts
for (const enrollmentId of bundleOrder.enrollmentIds) {
    await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'SUSPENDED' },
    }).catch(() => {});
}
```
**Issue**: If an enrollment doesn't exist (deleted, or ID is corrupted), the error is silently swallowed. If the bundleOrder has 10 enrollmentIds and 5 fail, only 5 are actually suspended but the order is marked as "refunded". The student retains access to 5 courses they were refunded for.
**Fix**: Track which suspensions succeeded and log failures. Consider using `updateMany` with `id: { in: enrollmentIds }` for atomicity.
**Category**: integrity

---

### P3-40 [P2] INTEGRITY — Corporate enroll: welcome emails sent for ALL userIds, including skipped
**File**: `src/app/api/admin/lms/corporate/[id]/enroll/route.ts:137-147`
**Issue**: The email loop iterates over ALL `userIds`, not just the ones that were successfully enrolled. Users who were already enrolled (skipped) receive duplicate "Welcome to course X" emails.
**Fix**: Track successfully enrolled userIds and only send emails to those: `const enrolledUserIds = [...successfullyEnrolled];`
**Category**: UX

---

### P3-41 [P2] PERFORMANCE — Lesson page: totalEstimatedMinutes recalculated with N nested finds
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/page.tsx:146-151`
**Code**:
```ts
const totalEstimatedMinutes = allLessons.reduce((acc, l) => {
    const lesson = course.chapters.flatMap((ch) => ch.lessons).find((cl) => cl.id === l.id);
    return acc + (lesson?.estimatedMinutes || 0);
}, 0);
```
**Issue**: For each lesson in `allLessons`, it calls `flatMap` + `find` on the chapters array. This is O(n*m) where n is the number of lessons and m is the flattened lesson count. For 200 lessons, this is 40,000 operations. The data is already available from the flat `allLessons` construction.
**Fix**: Compute during the initial loop: `let totalEstimatedMinutes = 0; for (const ch of course.chapters) for (const l of ch.lessons) totalEstimatedMinutes += l.estimatedMinutes || 0;`
**Category**: performance

---

### P3-42 [P2] UX — LessonViewerClient sidebar: `allOutlineLessons` recomputed on every render
**File**: `src/app/(shop)/learn/[slug]/[chapterId]/[lessonId]/LessonViewerClient.tsx:393`
**Code**:
```ts
const allOutlineLessons = courseOutline.flatMap(c => c.lessons);
```
**Issue**: This is inside the `.map()` callback for each chapter, meaning it's recomputed once per chapter on every render. It should be computed once outside the map.
**Fix**: Move `const allOutlineLessons = courseOutline.flatMap(c => c.lessons);` before the `.map()` call, or wrap in `useMemo`.
**Category**: performance

---

---

## Summary

| Severity | Count |
|----------|-------|
| P0       | 3     |
| P1       | 18    |
| P2       | 21    |
| **Total**| **42**|

### By Category

| Category     | Count |
|-------------|-------|
| Security     | 12    |
| Integrity    | 18    |
| Performance  | 7     |
| UX           | 10    |
| Robustness   | 4     |

### Top 5 Critical Findings

1. **P1-01 [P0]** — Checkout creates Stripe session without checking existing enrollment (double charge)
2. **P2-01 [P0]** — Corporate enrollment never validates budget cap (unlimited spend)
3. **P3-01 [P0]** — Lesson page drops tenant isolation when tenantId is null (cross-tenant data leak)
4. **P3-02 [P1]** — Sequential lesson gate is client-side only, server never enforces it
5. **P3-06 [P1]** — Quiz pass status never written to LessonProgress, blocking exam access

### Missing Endpoints (Blocking UX)

| Endpoint | Called By | Status |
|----------|-----------|--------|
| `/api/lms/course-completion` | Complete page | MISSING |
| `/api/lms/reviews` | Review form | MISSING |
| `/api/lms/certificate-pdf` | PDF download | MISSING |
