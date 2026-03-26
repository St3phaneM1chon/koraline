# V2 Deploy Checklist

## Pre-Deploy

- [x] `npx prisma validate` — Schema valid
- [x] `npx prisma generate` — Client generated
- [x] `npm run build` — Zero TypeScript errors
- [ ] `DATABASE_URL=<prod> npx prisma db push` — Sync schema changes:
  - LmsBadgeAward: @@unique now includes tenantId
  - LmsStreak: @@unique([tenantId, userId]) replaces @unique userId
  - CertificateTemplate: @unique removed from name
  - LmsBadge: @unique removed from name
- [ ] Verify no orphan data before schema push (unique constraint changes)

## Post-Deploy

### Content Import (one-time)
- [ ] `psql $DATABASE_URL < scripts/pqap-content-seed.sql` — 32 chapters → lesson manualText
- [ ] `psql $DATABASE_URL < scripts/pqap-questions-seed.sql` — 518 questions → 14 QuestionBanks
- [ ] OR: `npx tsx scripts/import-pqap-content.ts` + `npx tsx scripts/import-exam-questions.ts`

### Verify New Endpoints
- [ ] GET /api/lms/badges — Student badges/achievements
- [ ] GET /api/lms/challenges — Active challenges
- [ ] GET /api/lms/cohort — Cohort membership
- [ ] POST /api/lms/vote — Upvote discussions/QA
- [ ] POST /api/lms/daily-login — Daily XP
- [ ] POST /api/lms/reviews — Course reviews
- [ ] POST /api/lms/course-completion — Trigger completion
- [ ] GET /api/lms/certificates/verify/{code} — Public verification
- [ ] GET /api/lms/certificates/{id}/download — Certificate download
- [ ] GET /api/lms/certificates/{id}/share — LinkedIn + Open Badge
- [ ] PATCH /api/admin/lms/certificates — Revoke certificate
- [ ] PATCH /api/admin/lms/enrollments/{id} — Enrollment status change
- [ ] GET/POST /api/admin/lms/challenges — Challenge management
- [ ] GET/POST /api/admin/lms/badges — Badge management
- [ ] POST /api/admin/lms/notifications — Broadcast announcements

### Verify Critical Fixes
- [ ] Quiz timer enforced server-side (start attempt, wait, submit late → rejected)
- [ ] Refund revokes certificate (full refund → cert status REVOKED)
- [ ] Partial refund does NOT suspend enrollment
- [ ] Discussion requires enrollment
- [ ] CeCredit created on course completion with accreditation
- [ ] Streak updates on lesson completion
- [ ] Badge awards create notifications
- [ ] XP dedup inside transaction

### Environment Variables
- [ ] CRON_SECRET must be set (compliance reminders reject if unset)
- [ ] ANTHROPIC_API_KEY for AI tutor
- [ ] ELEVENLABS_API_KEY for TTS (with 15s timeout)
- [ ] DEEPGRAM_API_KEY for STT (with 60s timeout)

## Files Changed (V2 Session)
- 98 files, +6,939/-475 lines
- 24 new files created
- 14 new API routes
- 4 schema constraint changes
- 22 locale files updated
