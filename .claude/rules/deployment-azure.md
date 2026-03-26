# REGLE NON NEGOCIABLE: Deploiement Railway - Attitudes.vip (Koraline)

> **Migration**: Ce fichier remplace l'ancien guide Azure. Railway est le provider depuis 2026-03-24.
> Les credentials Azure sont conserves pour projets futurs (Azure AD OAuth, KeyVault).

## OBLIGATION #1 - SEARCH BEFORE SOLVE

**Avant TOUT troubleshooting de build/deploy, CHERCHER d'abord:**

```bash
# 1. Memoire vectorielle (via TodoMaster)
curl -s -X POST "http://localhost:8002/api/vector/search?query=DESCRIPTION_ERREUR&limit=5"

# 2. Knowledge islands Next.js
python3 /Volumes/AI_Project/AttitudesVIP-iOS/Scripts/aurelia_knowledge_islands.py --briefing nextjs

# 3. Knowledge islands Railway
python3 /Volumes/AI_Project/AttitudesVIP-iOS/Scripts/aurelia_knowledge_islands.py --briefing railway
```

---

## OBLIGATION #2 - Checklist Pre-Deploiement (Railway)

Avant chaque `git push` qui declenche un deploy Railway:

### A. Schema DB sync
```bash
cd /Volumes/AI_Project/peptide-plus
npx prisma validate
npx prisma generate
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```
Si schema change, appliquer en production:
```bash
DATABASE_URL='postgresql://...' npx prisma db push
```

### B. Variables d'environnement Railway
Verifier dans Railway dashboard (Settings > Variables):
- `DATABASE_URL` (Railway PostgreSQL, PAS localhost!)
- `REDIS_URL` (Railway Redis add-on)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://attitudes.vip`
- `NODE_OPTIONS=--max-old-space-size=8192`
- `SENTRY_DSN` (optionnel mais recommande)

### C. Lazy initialization des SDKs
**ANTIPATTERN**: Initialiser un SDK au top-level (crash si env var absente au build)
```typescript
// MAUVAIS
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// BON
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
```

### D. Pas de fichiers manquants
```bash
git diff --name-only  # Verifier que tous les imports sont commites
```

### E. SSR/cookies safety
```bash
grep -rn "cookies()\|headers()" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

---

## OBLIGATION #3 - Compte-Rendu Post-Deploiement

Meme obligation qu'avant. Sauvegarder en vectoriel:
```bash
/opt/homebrew/bin/python3.13 /Volumes/AI_Project/AttitudesVIP-iOS/Scripts/aurelia_vector_store.py \
  --add "Deploy attitudes.vip YYYY-MM-DD: DESCRIPTION" \
  --id "learning-deploy-railway-YYYY-MM-DD"
```

---

## OBLIGATION #4 - Ordering Pipeline (Railway)

1. `npx prisma validate`
2. `npx prisma generate`
3. `NODE_OPTIONS="--max-old-space-size=8192" npm run build`
4. Schema sync production si change: `DATABASE_URL='...' npx prisma db push`
5. `git add && git commit && git push` → Railway auto-deploy
6. Verification: `curl -s https://attitudes.vip/api/health`
7. Compte-rendu

**JAMAIS** pusher si le build local echoue.

---

## DIFFERENCES RAILWAY vs AZURE

| Aspect | Azure (ancien) | Railway (actuel) |
|--------|---------------|-----------------|
| Deploy | GitHub Actions → az webapp | git push → auto-build |
| Build | Oryx + zip package | Nixpacks (auto-detect) |
| Redis | Azure Cache (manquant) | Railway add-on (1 clic) |
| Storage | Azure Blob Storage | Local filesystem / S3 |
| DB | Azure PostgreSQL Flexible | Railway PostgreSQL |
| SSL/TLS | Terminaison au LB (HTTP interne) | HTTPS end-to-end |
| Cookies | Pas de __Secure- (workaround) | __Secure- fonctionne |
| Container | 600s startup, cert update | Demarrage rapide (~30s) |
| Filesystem | Read-only (RUN_FROM_PACKAGE) | Read-write (ephemere) |

---

## KEDB - Known Error Database

### KB universels (s'appliquent toujours)

**KB-PP-BUILD-001**: PrismaClient crash en CI → Lazy init singleton
**KB-PP-BUILD-002**: Stripe SDK crash en CI → Lazy init factory
**KB-PP-BUILD-003**: cookies()/headers() crash SSR → force-dynamic
**KB-PP-BUILD-004**: Schema drift → prisma db push AVANT deploy
**KB-PP-BUILD-005**: OAuth tokens snake_case → Utiliser snake_case
**KB-PP-BUILD-011**: FK orphan blocks prisma db push → Nettoyer orphelins avant

### KB Railway-specifiques

**KB-PP-RAILWAY-001**: OOM pendant build
- **Symptome**: Build tue sans erreur, exit code 137
- **Cause**: Next.js build depasse 4GB RAM par defaut
- **Fix**: `NODE_OPTIONS=--max-old-space-size=8192` + `webpackMemoryOptimizations: true`

**KB-PP-RAILWAY-002**: Fichiers non commites
- **Symptome**: `Module not found` en prod mais build local OK
- **Cause**: Fichier modifie localement mais pas git add/commit
- **Fix**: `git status` avant push

### KB Azure (archive — ne s'appliquent plus)

Les KB suivants sont archives et ne s'appliquent PAS a Railway:
- KB-PP-BUILD-006: WEBSITE_RUN_FROM_PACKAGE read-only (Azure-only)
- KB-PP-BUILD-007: SCM container restart (Azure Kudu)
- KB-PP-BUILD-008: Container startup 230s timeout (Azure cert update)
- KB-PP-BUILD-009: Webex OAuth scopes (pas lie a Azure mais detecte pendant)
- KB-PP-BUILD-010: Config-change restart loop (Azure settings)
- KB-PP-BUILD-012: bash -e kills health check (GitHub Actions + Azure)
