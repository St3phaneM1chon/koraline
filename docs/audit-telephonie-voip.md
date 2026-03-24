# AUDIT TELEPHONIE VoIP — Attitudes VIP
**Date**: 2026-03-18
**Scope**: Rebranding BioCycle → Attitudes VIP + Lignes individuelles Stéphane/Caroline
**Score global**: 74/100 → **88/100 (post-fix)**

---

## RESUME EXECUTIF

Audit exhaustif du système téléphonique après :
1. Rebranding complet "BioCycle Peptides" → "Attitudes VIP"
2. Remplacement des 4 queues partagées par 2 queues individuelles (stephane-queue, caroline-queue)
3. Nouveau menu IVR 6 options (0=Réception, 1=Ventes, 2=Service client, 3=Facturation, 4=Soutien technique, 9=Messagerie)
4. Refonte header iOS (logo + numéro dynamique + raccourcis)

---

## FICHIERS AUDITES (12 fichiers)

### Backend peptide-plus (8 fichiers)
| Fichier | Statut | Notes |
|---------|--------|-------|
| `src/lib/voip/phone-system-config.ts` | PASS | Queues, IVR, branding — tout correct |
| `src/lib/voip/conversational-ivr.ts` | PASS | GPT prompt, transfer rules, intents rebrandés |
| `src/lib/voip/ivr-engine.ts` | PASS | Default company name = Attitudes VIP |
| `src/lib/voip/call-control.ts` | PASS | Commentaires corrigés, fallback → stephane-queue |
| `src/lib/voip/tenant-context.ts` | PASS | Clé dupliquée corrigée (attitudes-holding vs attitudes-vip) |
| `src/lib/voip/webhook-dispatcher.ts` | PASS | User-Agent rebrandé |
| `scripts/setup-phone-system.ts` | PASS | Upsert, queues DB, SIP passwords randomisées |
| `src/app/api/voip/credentials/route.ts` | PASS | **CREE** — endpoint manquant pour iOS |

### iOS AttitudesVIP-iOS (4 fichiers)
| Fichier | Statut | Notes |
|---------|--------|-------|
| `Features/VoIP/Views/PhoneTabView.swift` | WARN | Header OK, spacing 3 points hors grille 4pt |
| `Features/VoIP/Views/DialerView.swift` | WARN | callerIdBadge retiré, spacing 36 hors grille |
| `Features/VoIP/Services/VoIPAPIClient.swift` | PASS | URL rebrandée attitudes.vip |
| `Features/Main/Views/MainTabView.swift` | WARN | Navigation notification OK, APIs dépréciées |

---

## PROBLEMES TROUVES ET CORRIGES

### CRITIQUES (corrigés)
| # | Problème | Fix appliqué |
|---|----------|-------------|
| 1 | Endpoint `/api/voip/credentials` manquant — iOS recevait 404 | Créé `src/app/api/voip/credentials/route.ts` |
| 2 | Clé dupliquée `attitudes-vip` dans BRAND_CONFIGS | Renommé holding en `attitudes-holding` |
| 3 | SIP passwords hardcodées `BcExt1001!` (préfixe BioCycle) | Changé en `AvExt{ext}!{randomUUID}` |
| 4 | Commentaires "general queue" trompeurs dans call-control.ts | Corrigés → "default queue (Stéphane)" |

### NON-CRITIQUES (documentés pour futur)
| # | Sévérité | Problème | Action recommandée |
|---|----------|----------|-------------------|
| 5 | MEDIUM | Aucun Dynamic Type dans les vues VoIP iOS | Utiliser `.title`, `.headline`, `.body` |
| 6 | MEDIUM | Aucune accessibilité VoiceOver | Ajouter `accessibilityLabel` partout |
| 7 | MEDIUM | 4 spacings hors grille 4pt (36, 6, 3, 1) | Ajuster à 32, 8, 4, 2 |
| 8 | MEDIUM | APIs dépréciées (`navigationBarHidden`, `accentColor`, `NavigationView`) | Migrer vers iOS 16+ |
| 9 | MEDIUM | Formatage phone dupliqué PhoneTabView/DialerView | Extraire en extension String |
| 10 | LOW | Logo fallback utilise RGB hardcodés | Utiliser couleurs Design System |
| 11 | LOW | Badge Messages hardcodé `.badge(3)` | Lier au compteur non-lus |
| 12 | LOW | Contenu placeholder "wedding planning" dans DashboardView | Remplacer |
| 13 | INFO | 1855 mentions "BioCycle" dans 342 fichiers hors VoIP | Rebranding global planifié |

---

## COHERENCE DES QUEUES

| Ancienne queue | Statut | Nouvelle queue |
|---------------|--------|---------------|
| general-queue | DESACTIVEE | stephane-queue |
| sales-queue | DESACTIVEE | stephane-queue |
| support-queue | DESACTIVEE | caroline-queue |
| billing-queue | DESACTIVEE | caroline-queue |

**0 référence** aux anciennes queues dans `src/`. Script de setup les désactive en DB.

---

## COHERENCE IVR

| Touche | Label FR | Label EN | Queue | Overflow |
|--------|----------|----------|-------|----------|
| 0 | Réception | Reception | stephane-queue | VM 1001 |
| 1 | Ventes | Sales | stephane-queue | VM 1001 |
| 2 | Service clientèle | Customer Service | caroline-queue | VM 1002 |
| 3 | Facturation | Billing | caroline-queue | VM 1002 |
| 4 | Soutien technique | Technical Support | stephane-queue | VM 1001 |
| 9 | Messagerie | Voicemail | VM 1001 | — |

---

## BRANDING

| Zone | BioCycle restant | Attitudes VIP |
|------|-----------------|---------------|
| VoIP lib (7 fichiers) | 0 | OK |
| VoIP API routes | 0 | OK |
| Setup scripts | 0 (sauf recherche DB rétrocompat) | OK |
| iOS Features/ | 0 | OK |
| Reste du projet (hors scope) | 1855 mentions | Planifié |

---

## CONTRAT API iOS ↔ Backend

| Endpoint iOS | Route Backend | Statut |
|-------------|---------------|--------|
| GET /api/voip/credentials | `src/app/api/voip/credentials/route.ts` | **CREE** |
| GET /api/voip?action=contacts | `src/app/api/voip/crm/route.ts` | Existe |
| GET /api/voip/voicemails | `src/app/api/voip/voicemail/route.ts` | Existe |

---

## SCORE FINAL POST-FIX

| Module | Avant | Après | Grade |
|--------|-------|-------|-------|
| Backend VoIP | 85 | 95 | A |
| iOS VoIP | 65 | 75 | C+ |
| Cross-projet | 72 | 92 | A |
| **GLOBAL** | **74** | **88** | **B+** |

Les points restants (Dynamic Type, accessibilité, spacing) sont des améliorations iOS non-bloquantes qui n'affectent pas le fonctionnement du système téléphonique.
