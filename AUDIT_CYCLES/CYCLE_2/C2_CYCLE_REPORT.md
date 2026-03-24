# CYCLE 2 — Rapport d'Audit

**Date**: 2026-03-23
**Score**: ~86/100 → ~90/100 (+4 points)
**Items**: 105 discovered → ~95 fixed (~90%)

---

## Discovery (Re-scan post C1)

105 new findings across deeper analysis:
- 3 CRITICAL (VoIP debug recreated, v1 API no tenant, health info disclosure)
- 25 HIGH (race conditions, CSRF, PII logging)
- 56 MEDIUM (validation, performance, compliance)
- 21 LOW (config, cleanup)

## Key Fixes Applied

### Security (40+ fixes)
- v1 API tenant isolation via API key tenantId
- Platform health requires super-admin auth
- VoIP debug deleted (again)
- 6 PII removals from logs (emails → userId)
- 5 information disclosure fixes
- SQL template validation (reject DROP/ALTER/TRUNCATE)
- SHA256 replacing MD5 for cache keys
- Path traversal defense (resolve + verify)
- Open redirect prevention (callbackUrl validation)
- Content-Type validation on signup
- CORS credentials header
- Webhook rejection in production without secret
- Error message sanitization (whitelist safe messages)

### Architecture (10 $transaction blocks)
- signup, platform webhook, onboarding steps 3+4
- employee update/delete, VoIP queues/IVR/campaigns
- company creation, unsubscribe

### CSRF + Rate Limiting (~16 routes)
- LMS routes (enroll, progress, quiz)
- Platform routes (checkout, modules, licenses, domain)
- Certificate verification rate-limited
- Demo request rate-limited

### LMS Aptitudes Advanced
- Student pages: course detail, lesson viewer, dashboard
- Quiz attempt API
- Certificate verification page
- Progress validation (ownership, video, time limits)
- Tenant isolation on public catalog

### Performance + Compliance
- Removed artificial delays (CSV export)
- Added query limits on unbounded routes
- Cache-Control headers on API routes
- Loi 25 compliance (PII removal from audit logs)
