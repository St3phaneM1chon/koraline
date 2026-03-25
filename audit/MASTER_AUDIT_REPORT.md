# MASTER AUDIT REPORT — Module Formation (Aptitudes)

## Date: 2026-03-25
## Status: Phase 1 services COMPLETE, Phase 2 corrections EN COURS

## Inventaire
| Element | Compte |
|---------|--------|
| Prisma Models | 85 |
| API Routes | 69 |
| Admin Pages | 36 |
| Student Pages | 21 |
| Components | 16 |
| Services | 14 (5,405 LOC) |
| Tests E2E | ~150 |

## Findings Summary
| Severite | Total | Resolus | Restants |
|----------|-------|---------|----------|
| P0 (critique) | 5 | 5 | 0 |
| P1 (haute) | 20 | 19 | 1 |
| P2 (moyenne) | 42+ | 5 | 37+ |
| P3 (basse) | 30+ | 0 | 30+ |
| **TOTAL** | **97+** | **29** | **68+** |

## P0 Resolus (5/5)
1. SQL injection ($queryRawUnsafe → $queryRaw) — tutor-service.ts
2. Cross-tenant data leak (employees missing tenantId) — lms-service.ts
3. Prompt injection (XML tag sanitization) — tutor-service.ts
4. API timeout (30s AbortController) — tutor-service.ts
5. Input sanitization (strip denormalized stats) — lms-service.ts

## P1 Resolus (19/20)
1. XP race condition ($transaction) — xp-service.ts
2. XP deduplication (sourceId check) — xp-service.ts
3. Recursive guard (challenge loop) — xp-service.ts
4. Email hash (SHA-256 PII) — open-badges.ts
5. Audit trail details serialization — audit-trail.ts
6. Audit trail error logging — audit-trail.ts
7. Audit count query date filter — audit-trail.ts
8. Enrollment $transaction — lms-service.ts
9. Delete guard (prevent cascade) — lms-service.ts
10. Create force DRAFT + strip id — lms-service.ts
11. LessonId validation vs course — lms-service.ts
12. Certificate dedup — lms-service.ts
13. FSRS weights validation — fsrs-engine.ts
14. FSRS retrievability guard — fsrs-engine.ts
15. Quiz enrollment check — lms-service.ts
16. Bundle counter conditional — lms-service.ts
17. Enrollment deadline check — lms-service.ts
18. Published lessons only — lms-service.ts
19. Over-fetching fix — lms-service.ts

## P2 Resolus (5/42+)
1. getCourses limit cap — lms-service.ts
2. getCourses page validation — lms-service.ts
3. getCourseBySlug select optimization — lms-service.ts

## Build Status: PASS (0 type errors, 3 lint findings)

## Next Steps
- Routes audit (agent background en cours)
- Pages audit (agent background en cours)
- Appliquer les P2/P3 restants
- Phase 3: aurelia_full_audit.py
- Phase 4: Script recurent cree ✓
