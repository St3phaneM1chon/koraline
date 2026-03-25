# V2 MEGA AUDIT — Parcours 11-12: Certificate Lifecycle & Refund/Reactivation
## Date: 2026-03-25 | 20 findings (4 P0, 5 P1, 6 P2, 5 P3)

### FIXED:
- P11-01 [P0] TOCTOU — issueCertificate $transaction → f878920a
- P11-02 [P0] PII — Public verify leaks full name → e26d91af
- P11-03 [P0] Refund — Certificates not revoked → e26d91af
- P11-04 [P0] Refund — Partial treated as full → e26d91af
- P11-09 [P1] Audit — Certificate issuance not logged → ba8eb1f0
- P11-12 [P2] Integrity — enrollmentCount can go negative → ae9298d2
- P11-13 [P2] Integrity — Bundle refund no enrollmentCount decrement → 91650290
- P11-15 [P2] Idempotency — handleLmsRefund not idempotent → e26d91af
- P11-18 [P3] Schema — CertificateTemplate global @unique → 78fb0b46

### REMAINING:
- P11-05 [P1] Race — Duplicate check nested inline query (restructured in $transaction)
- P11-06 [P1] Missing — Admin certificate revocation endpoint
- P11-07 [P1] Missing — Enrollment reactivation mechanism
- P11-08 [P1] Security — Certificate creation multi-write (now in $transaction)
- P11-10 [P2] Spec — Open Badges uses 2.0 structure not 3.0
- P11-11 [P2] Performance — Certificate list N+1 query
- P11-14 [P2] Atomicity — Bundle refund not in $transaction
- P11-16 [P3] UX — Raw status enum on verification page
- P11-17 [P3] Code — Duplicate verification routes
- P11-19 [P3] Missing — Certificate download endpoint
- P11-20 [P3] i18n — Hardcoded string in verification page
