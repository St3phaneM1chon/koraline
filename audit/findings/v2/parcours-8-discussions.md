# V2 MEGA AUDIT — Parcours 8: Discussion & Social
## Date: 2026-03-25 | 23 findings (0 P0, 6 P1, 7 P2, 10 P3)

### FIXED:
- P8-01 [P1] Auth — Discussion/QA no enrollment check → 9d1b596d
- P8-03 [P1] Cross-tenant — parentReplyId not validated → ba8eb1f0
- P8-06 [P1] PII — Leaderboard leaks userId in materialized path → 91650290
- P8-09 [P2] Pagination — QA answers unbounded → ae9298d2
- P8-10 [P2] Race condition — replyCount drift → ba8eb1f0
- P8-12 [P2] Auth — isInstructor flag not set → ba8eb1f0
- P8-15 [P2] Security — courseId URL injection → ae9298d2
- P8-19-22 [P3] i18n — Hardcoded French strings → 5e3ca3af

### REMAINING (P2/P3):
- P8-04 [P1] LmsBadgeAward unique constraint → 78fb0b46 (FIXED in schema)
- P8-05 [P1] LmsStreak unique constraint → 78fb0b46 (FIXED in schema)
- P8-07 [P2] No upvote API endpoint
- P8-08 [P2] Discussion pagination missing
- P8-13 [P2] No delete/edit for discussions
- P8-14 [P2] Discussions expose raw userId
- P8-17 [P3] Achievements page uses mock data
- P8-18 [P3] Cohort page static
- P8-23-24 [P3] a11y missing labels
- P8-25 [P3] Discussion detail view missing
