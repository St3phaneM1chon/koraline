# Guide de Configuration Railway — Suite Koraline

## Prérequis
- Railway CLI: `npm i -g @railway/cli && railway login`
- Lié au projet: `railway link`

---

## TIER 1: CRITIQUE (sans ça l'app ne fonctionne pas)

### 1. Database Schema Sync
```bash
railway run npx prisma db push --accept-data-loss
```

### 2. Variables d'environnement obligatoires
```bash
# Auth
railway variables:set NEXTAUTH_URL="https://attitudes.vip"
railway variables:set NEXTAUTH_SECRET="$(openssl rand -base64 42)"

# Build
railway variables:set NODE_OPTIONS="--max-old-space-size=8192"

# Platform
railway variables:set PLATFORM_TENANT_ID="<ID du tenant Attitudes VIP>"
```

---

## TIER 2: HAUTE PRIORITÉ (fonctionnalités dégradées sans ça)

### 3. Redis
- Ajouter le **Redis add-on** dans Railway Dashboard → New → Redis
- La variable `REDIS_URL` sera auto-injectée

### 4. Stripe (Attitudes VIP)
```bash
railway variables:set STRIPE_SECRET_KEY="sk_live_..."
railway variables:set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Stripe Attitudes (SaaS billing)
railway variables:set STRIPE_ATTITUDES_SECRET_KEY="sk_live_..."
railway variables:set STRIPE_ATTITUDES_WEBHOOK_SECRET="whsec_..."
```

### 5. Email (Resend)
```bash
railway variables:set RESEND_API_KEY="re_..."
railway variables:set SMTP_FROM="noreply@attitudes.vip"
railway variables:set NEXT_PUBLIC_SUPPORT_EMAIL="support@attitudes.vip"
railway variables:set ADMIN_EMAIL="stephane.michon@attitudes.vip"
```

### 6. Cron Secret
```bash
railway variables:set CRON_SECRET="$(openssl rand -base64 32)"
```

### 7. Telnyx VoIP
```bash
railway variables:set TELNYX_API_KEY="KEY_..."
railway variables:set TELNYX_CONNECTION_ID="2907808239930311884"
railway variables:set TELNYX_DEFAULT_CALLER_ID="+14388030370"
railway variables:set TELNYX_WEBHOOK_SECRET="<Ed25519 public key from Telnyx Portal>"
```
**IMPORTANT**: Mettre à jour le webhook URL dans le Telnyx Portal:
- Voice: `https://attitudes.vip/api/voip/webhooks/telnyx`
- SMS: `https://attitudes.vip/api/voip/webhooks/sms`

---

## TIER 3: RECOMMANDÉ

### 8. OAuth Providers
Mettre à jour les redirect URIs dans chaque console:
- **Google**: `https://attitudes.vip/api/auth/callback/google`
- **Apple**: `https://attitudes.vip/api/auth/callback/apple`
- **Microsoft**: `https://attitudes.vip/api/auth/callback/azure-ad`
- **X (Twitter)**: `https://attitudes.vip/api/auth/callback/twitter`

### 9. Sentry
```bash
railway variables:set SENTRY_DSN="https://...@sentry.io/..."
```

### 10. Seed données de base
```bash
# Email accounts Attitudes VIP
railway run node scripts/seed-email-accounts.js

# Seed tenant data (if needed)
railway run node scripts/seeds/seed-tenant.ts
```

---

## Vérification post-configuration
```bash
# Health check
curl -s https://attitudes.vip/api/health | jq .

# Expected: all "pass" except maybe sentry (optional)
# database: pass
# auth: pass
# payments: pass
# email: pass (not "log-only")
# redis: pass (not "warn")
# memory: pass
```

---

## DNS (déjà configuré)
- `attitudes.vip` → Railway CNAME
- `*.koraline.app` → Railway wildcard (pour les sous-domaines tenants)
