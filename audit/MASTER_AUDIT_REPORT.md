# MASTER AUDIT REPORT — Module Formation (Aptitudes)

## Date: 2026-03-25 (mis a jour en continu)
## Status: Phase 1 COMPLETE, Phase 2 EN COURS

## Inventaire
| Element | Compte |
|---------|--------|
| Prisma Models | 85 |
| API Routes | 70 (+1 live-sessions student) |
| Admin Pages | 36 |
| Student Pages | 21 |
| Components | 16 |
| Services | 14 (5,405 LOC) |
| Tests E2E | ~150 |

## Findings Summary
| Severite | Total | Resolus | Restants |
|----------|-------|---------|----------|
| P0 (critique) | 10 | **10** | **0** |
| P1 (haute) | 25 | **25** | **0** |
| P2 (moyenne) | 80+ | 7 | 73+ |
| P3 (basse) | 55+ | 0 | 55+ |
| **TOTAL** | **170+** | **42** | **128+** |

## ALL P0 RESOLVED (10/10)
1. SQL injection ($queryRawUnsafe → $queryRaw) — tutor-service.ts
2. Cross-tenant data leak (employees missing tenantId) — lms-service.ts
3. Prompt injection (XML tag sanitization) — tutor-service.ts
4. API timeout (30s AbortController) — tutor-service.ts
5. Input sanitization (strip denormalized stats) — lms-service.ts
6. Tenant spoofing via x-tenant-id header — bundles route
7. Tenant spoofing via x-tenant-id header — bundles/[slug] route
8. Corporate pricing leak via header — bundles/[slug] route
9. Calendar auth bypass (HMAC token) — calendar route
10. XSS stored (DOMPurify sanitization) — LessonViewerClient

## ALL P1 RESOLVED (25/25)
- XP: race condition, deduplication, recursive guard
- Open Badges: email hash SHA-256
- Audit Trail: details serialization, error logging, count filter
- LMS Service: enrollment transaction, delete guard, create DRAFT, lessonId validation, certificate dedup, quiz enrollment check, bundle counter
- FSRS: weights validation, retrievability guard
- Routes: Zod validation (notifications, exam, checkout error leak)
- Pages: auth guard learn layout, sessions-live student API
- Checkout: stop leaking Zod error details

## Build Status: PASS (0 type errors, 3 lint findings)
## Deploy: Railway auto-deploy on push

## Next Steps (Phase 2 continues)
- Corriger les 73+ P2 restants
- Phase 3: aurelia_full_audit.py sur 5 repertoires
- Phase 4: Cadence recurente configuree (mega-audit-lms.sh)
