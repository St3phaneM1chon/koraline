# APTITUDES LMS + AURÉLIA EN LIGNE — Plan Maître v3.0

**Version**: 3.0 (consolidation plan initial + recherche + audit réalité)
**Date**: 2026-03-24
**Auteur**: Stéphane Michon + Claude (Aurélia)
**Objectif**: Top-2 LMS mondial pour la formation continue en assurance

---

## 1. CE QUI EST FAIT — Inventaire vérifié (7,068 LOC)

### 1.1 Backend — COMPLET ✅

**Schema Prisma** (51 modèles, 1702 lignes dans `lms.prisma`) — 100% fait
- Cours, chapitres, leçons (7 types), quiz (5 types), tentatives
- Inscriptions, progression, certificats, templates
- Gamification (badges, streaks, leaderboard)
- Conformité assurance (AMF, CHAD, CSF, IQPF, UFC, CeCredits)
- Tuteur IA (subscriptions, sessions, messages, knowledge base)
- Profil étudiant (~80 dimensions: VARK, Gardner, cognitif, psycho)
- Apprentissage adaptatif (concepts, prérequis, mastery, learning paths)
- Diagnostic quiz, role-play, micro-leçons, study reminders
- Consentement Loi 25 (LmsConsentRecord)
- Portail branded multi-tenant (TenantLmsPortal)
- FSRS parameters, IRT calibration

**15 API Routes** — TOUTES fonctionnelles (2,444 LOC)
| Route | LOC | Description |
|-------|-----|-------------|
| `courses` | 78 | Catalogue publié (pagination, filtres, recherche) |
| `enroll` | 48 | Auto-inscription étudiant |
| `progress` | 78 | Suivi progression leçons |
| `mastery` | 307 | Grille maîtrise concepts (FSRS) |
| `diagnostic` | 88 | Quiz diagnostic pré-cours (Squirrel AI) |
| `quiz` | 60 | Catalogue quiz |
| `quiz/[id]/attempt` | 126 | Tentative quiz avec auto-correction |
| `quiz/results` | 115 | Résultats détaillés |
| `learning-path` | 440 | Parcours adaptatif auto-généré |
| `certificates/verify` | 43 | Vérification publique QR |
| `tutor/chat` | 138 | Chat Socratique Aurélia (Claude + RAG) |
| `tutor/stt` | 219 | Speech-to-text (Deepgram) |
| `review-queue` | 127 | File révision espacée (FSRS) |
| `roleplay` | 168 | Création scénarios role-play |
| `roleplay/[sessionId]` | 409 | Session role-play interactive |

**Admin API**: courses CRUD (GET, POST) — fonctionnel

**5 Services** — TOUS fonctionnels (1,709 LOC)
| Service | LOC | Description |
|---------|-----|-------------|
| `lms-service.ts` | 564 | CRUD complet, inscription, progression, certificats, quiz grading |
| `tutor-service.ts` | 464 | Tutrice Socratique (RAG pg_trgm, anti-hallucination, citations loi) |
| `irt-engine.ts` | 253 | IRT 3-paramètres (difficulté, discrimination, chance) + calibration |
| `diagnostic-service.ts` | 254 | Diagnostic 5 min (cartographie concepts, skip leçons connues) |
| `fsrs-engine.ts` | 174 | FSRS (89.6% rétention, 19 paramètres ML) |

### 1.2 Frontend — FONCTIONNEL ✅

**7 pages admin** (1,316 LOC) — dashboard, cours, nouveau cours, étudiants, certificats, catégories, conformité

**12 pages étudiant** (3,907 LOC) — catalogue, détail cours, visionneuse leçon, diagnostic, role-play, mastery

**1 composant** — AureliaWidget.tsx (291 LOC) — bouton flottant, chat, voix, contexte de page

### 1.3 Améliorations recherche INTÉGRÉES ✅

| # | Amélioration | Source | Status |
|---|---|---|---|
| 1 | Quiz diagnostic rapide 5 min | Squirrel AI | ✅ Service + API + page |
| 2 | FSRS au lieu de SM-2 (89.6% rétention) | Research 2025 | ✅ Engine complet |
| 3 | IRT 3-paramètres + calibration | Psychométrie | ✅ Engine complet |
| 4 | Mode Socratique Aurélia | ITS research | ✅ tutor-service |
| 5 | Anti-hallucination citations loi | Khanmigo | ✅ System prompt |
| 7 | Consentement Loi 25 profilage | Légal | ✅ Schema LmsConsentRecord |
| 8 | Micro-leçons 5 min | EdTech | ✅ Schema MicroLesson |
| 9 | Role-play simulation client | Différenciateur | ✅ API + pages + 577 LOC |
| 14 | Mastery visualization concepts | UX research | ✅ Page /learn/mastery |
| 16 | Rappels étude espacée | Compliance | ✅ Schema StudyReminder |

---

## 2. CE QUI MANQUE — Gap Analysis

### 2.1 Améliorations recherche NON intégrées

| # | Amélioration | Source | Priorité | Effort |
|---|---|---|---|---|
| 6 | Accréditation AMF pour UFC | Marché | CRITIQUE | Business (hors code) |
| 10 | Détection émotion vocale | Deepgram | MOYENNE | 2h (API Deepgram sentiment) |
| 11 | Mode "walk & learn" audio | Mobile | MOYENNE | 4h (playlist audio, TTS leçons) |
| 12 | LECTOR confusion sémantique | arXiv 2025 | BASSE | 8h (analyse paires concepts) |
| 13 | Leaderboard équipe (pas individuel) | Gamification | MOYENNE | 3h (UI + API groupes) |
| 15 | Mode hors-ligne PWA | Mobile | BASSE | 8h (service worker, cache) |

### 2.2 Pages admin manquantes (12/19 = 63% manquant)

| Page | Priorité | Effort | Description |
|------|----------|--------|-------------|
| `/admin/formation/cours/[id]` | CRITIQUE | 4h | Éditeur de cours existant (chapitres, leçons, drag & drop) |
| `/admin/formation/quiz` | CRITIQUE | 6h | Banque de quiz (créer questions par concept/Bloom) |
| `/admin/formation/analytics` | HAUTE | 4h | Analytics avancés (graphes, tendances, at-risk) |
| `/admin/formation/rapports` | HAUTE | 3h | Rapports corporatifs (par département, par équipe) |
| `/admin/formation/instructeurs` | HAUTE | 2h | Gestion instructeurs (profils, cours assignés) |
| `/admin/formation/progression` | HAUTE | 3h | Suivi progression étudiants (vue détaillée) |
| `/admin/formation/modeles-certificats` | MOYENNE | 3h | Éditeur templates certificats |
| `/admin/formation/badges` | MOYENNE | 2h | Gestion badges + attribution |
| `/admin/formation/classement` | BASSE | 2h | Vue leaderboard admin |
| `/admin/formation/avis` | BASSE | 2h | Modération avis étudiants |
| `/admin/formation/medias` | BASSE | 3h | Bibliothèque médias LMS |
| `/admin/formation/parametres` | BASSE | 2h | Paramètres module LMS |

### 2.3 Pages étudiant manquantes

| Page | Priorité | Effort | Description |
|------|----------|--------|-------------|
| `/dashboard/student/certificates` | HAUTE | 2h | Mes certificats (télécharger PDF, partager) |
| `/dashboard/student/courses` (enrichir) | HAUTE | 3h | Dashboard enrichi (streaks, badges, progression) |
| Page review-queue UI | HAUTE | 3h | Interface révision espacée (flashcards FSRS) |
| Intégration calendrier | MOYENNE | 3h | Rappels UFC dans Google/Outlook Calendar |

### 2.4 Composants manquants

| Composant | Priorité | Effort | Description |
|-----------|----------|--------|-------------|
| `QuizPlayer.tsx` | CRITIQUE | 4h | Lecteur quiz interactif (5 types, timer, feedback) |
| `VideoPlayer.tsx` | HAUTE | 3h | Lecteur vidéo avec suivi progression (%), timestamps |
| `ConsentBanner.tsx` | HAUTE | 2h | Bannière consentement Loi 25 pour profilage |
| `MasteryGraph.tsx` | MOYENNE | 3h | Graphe concepts vert/jaune/rouge (réutilisable) |
| `ReviewCard.tsx` | MOYENNE | 2h | Flashcard pour révision espacée |
| `BadgeDisplay.tsx` | BASSE | 1h | Affichage badges/streaks |
| `ProgressRing.tsx` | BASSE | 1h | Anneau progression (réutilisable) |

### 2.5 Fonctionnalités cross-cutting

| Fonctionnalité | Priorité | Effort | Description |
|----------------|----------|--------|-------------|
| i18n complet LMS | CRITIQUE | 4h | ~80 clés manquantes dans 22 locales |
| Admin API courses/[id] | CRITIQUE | 2h | GET, PUT, DELETE cours individuel |
| PDF certificats QR | HAUTE | 3h | Génération PDF avec QR de vérification |
| Tests E2E LMS | HAUTE | 6h | Playwright: inscription, cours, quiz, certificat |
| Import SCORM 2004 | BASSE | 8h | Parser + runtime SCORM |
| xAPI/Tin Can | BASSE | 6h | Tracking xAPI statements |
| LTI 1.3 | BASSE | 8h | Interopérabilité outils externes |
| SSO SAML/OIDC | BASSE | 6h | SSO entreprise (schema ready) |
| Éditeur WYSIWYG | MOYENNE | 4h | Rich editor pour contenu leçons (Tiptap/Plate) |
| Discussion forums | BASSE | 6h | Forums par cours |

### 2.6 Infrastructure

| Tâche | Priorité | Effort | Description |
|-------|----------|--------|-------------|
| `.env.production` → Railway | CRITIQUE | 5 min | Corriger l'URL DB |
| Env vars Railway complètes | CRITIQUE | 15 min | ANTHROPIC_API_KEY, DEEPGRAM, ELEVENLABS, etc. |
| Seed data LMS | HAUTE | 2h | Cours démo, questions, concepts d'exemple |
| ElevenLabs TTS intégration | HAUTE | 2h | Aurélia parle (voix "Sarah") |
| Deepgram sentiment | MOYENNE | 2h | Détection émotion dans voix étudiant |

---

## 3. PLAN D'EXÉCUTION — 6 Phases

### Phase 0: Stabilisation (IMMÉDIAT — 30 min)
**Objectif**: Tout fonctionne en production

- [ ] Corriger `.env.production` → Railway PostgreSQL
- [ ] Vérifier env vars Railway (ANTHROPIC_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY)
- [ ] Vérifier `attitudes.vip/api/lms/courses` retourne 200
- [ ] Vérifier `attitudes.vip/api/health` retourne healthy
- [ ] Sauvegarder apprentissages en mémoire vectorielle

### Phase 1: Complétude Critique (4-6h)
**Objectif**: Un utilisateur peut suivre un cours complet de A à Z

- [ ] **Admin API courses/[id]** — GET, PUT, DELETE cours individuel (2h)
- [ ] **QuizPlayer.tsx** — Lecteur quiz interactif 5 types avec timer et feedback immédiat (4h)
- [ ] **i18n LMS complet** — ~80 clés dans 22 locales (4h)
- [ ] **Éditeur de cours** `/admin/formation/cours/[id]` — chapitres, leçons, drag & drop réordonner (4h)
- [ ] **Banque de quiz** `/admin/formation/quiz` — créer questions par concept et niveau Bloom (6h)
- [ ] **ConsentBanner.tsx** — Loi 25 opt-in profilage (2h)

### Phase 2: Expérience Étudiant Complète (4-6h)
**Objectif**: L'étudiant a un dashboard riche et peut réviser efficacement

- [ ] **VideoPlayer.tsx** — Lecteur vidéo avec suivi %, timestamps, reprise (3h)
- [ ] **Review Queue UI** — Interface flashcards FSRS pour révision espacée (3h)
- [ ] **Dashboard étudiant enrichi** — streaks, badges, progression globale, cours en cours (3h)
- [ ] **Mes certificats** `/dashboard/student/certificates` — télécharger PDF, partager (2h)
- [ ] **PDF certificats** — Génération PDF avec QR de vérification (3h)
- [ ] **ElevenLabs TTS** — Aurélia parle avec voix "Sarah" (2h)

### Phase 3: Administration Complète (4-6h)
**Objectif**: Le gestionnaire de compagnie d'assurance peut tout gérer

- [ ] **Analytics avancés** `/admin/formation/analytics` — graphes tendances, at-risk detection (4h)
- [ ] **Rapports corporatifs** `/admin/formation/rapports` — par département/équipe, export CSV/PDF (3h)
- [ ] **Gestion instructeurs** `/admin/formation/instructeurs` — profils, cours assignés (2h)
- [ ] **Suivi progression** `/admin/formation/progression` — vue détaillée par étudiant (3h)
- [ ] **Templates certificats** `/admin/formation/modeles-certificats` — éditeur visuel (3h)
- [ ] **Badges** `/admin/formation/badges` — création, attribution, conditions (2h)
- [ ] **Paramètres LMS** `/admin/formation/parametres` — config module par tenant (2h)

### Phase 4: Différenciateurs (6-8h)
**Objectif**: Ce qui nous rend unique vs la compétition

- [ ] **Détection émotion vocale** — Deepgram sentiment dans tutor-service (2h)
- [ ] **Mode "walk & learn"** — Playlist audio TTS des leçons, lecture continue (4h)
- [ ] **Leaderboard équipe** — classement par département (pas individuel) (3h)
- [ ] **Intégration calendrier** — Rappels UFC dans Google/Outlook Calendar (3h)
- [ ] **MasteryGraph.tsx** — Graphe concepts interactif vert/jaune/rouge (3h)
- [ ] **Éditeur WYSIWYG** — Rich editor pour contenu leçons (Tiptap) (4h)
- [ ] **Seed data** — Cours démo complet avec questions, concepts, parcours (2h)
- [ ] **Avis étudiants** + **Classement** + **Médias** (pages admin restantes) (6h)

### Phase 5: Enterprise & Compliance (8-12h)
**Objectif**: Prêt pour les grandes compagnies d'assurance

- [ ] **Import SCORM 2004** — Parser + runtime dans iframe (8h)
- [ ] **SSO SAML/OIDC** — Intégration enterprise SSO (6h)
- [ ] **Portail branded UI** — Interface tenant custom (subdomain, logo, couleurs) (4h)
- [ ] **Discussion forums** — Forums par cours avec modération (6h)
- [ ] **Inscription bulk CSV** — Import masse étudiants (2h)
- [ ] **xAPI/Tin Can** — Tracking interopérable (6h)
- [ ] **LTI 1.3** — Intégration outils pédagogiques externes (8h)
- [ ] **Mode hors-ligne PWA** — Service worker, cache leçons texte/quiz (8h)
- [ ] **Accréditation AMF** — Processus business (soumission cours pour approbation)

### Phase 6: Intelligence Avancée (6-10h)
**Objectif**: IA prédictive et synchronisation

- [ ] **Predictive analytics** — Détection étudiants at-risk (ML basique) (6h)
- [ ] **LECTOR** — Confusion sémantique entre concepts similaires (8h)
- [ ] **Rapports auto AMF** — Génération automatique rapports conformité (4h)
- [ ] **Sync Aurélia locale ↔ cloud** — Bidirectionnelle quotidienne (6h)
- [ ] **Blockchain certificats** — Hash vérification (pas NFT) (4h)
- [ ] **CAT adaptatif** — Computer Adaptive Testing pour quiz (6h)
- [ ] **Tests E2E complets** — Playwright: parcours complet étudiant + admin (6h)

---

## 4. MODÈLE D'AFFAIRES

### Flux commercial
```
Attitudes.vip (SaaS Koraline)
  └── Module "Aptitudes" (LMS)
        └── Compagnies d'assurance (tenants)
              ├── Chubb Insurance
              ├── Industrielle Alliance
              ├── Desjardins Assurances
              └── ...
                    └── Représentants/Étudiants
                          ├── Achat de formations (certificat initial)
                          ├── Formation continue obligatoire (UFC/CE credits AMF)
                          └── Tuteur IA Aurélia (abonnement mensuel)
```

### Sources de revenus
1. **Compagnies**: Abonnement mensuel au module Aptitudes (dans plan Koraline ou à la carte)
2. **Étudiants**: Achat individuel de formations (prix par cours)
3. **Tuteur IA Aurélia**: $29.99/mois ou $249.99/an
4. **Corporatif**: Forfait tenant illimité pour Aurélia

### Marché cible
- Représentants en assurance au Québec/Canada
- Certificat initial (permis AMF)
- Formation continue obligatoire (UFC)
- Conformité AMF, CHAD, CSF, IQPF
- **OPPORTUNITÉ**: IFSE ferme juin 2025 → disruption massive → timing parfait

### Coûts additionnels estimés
| Service | Coût | Status |
|---------|------|--------|
| Claude API (tuteur) | ~$27/mois | À configurer |
| Deepgram STT | $200 crédit | DÉJÀ PAYÉ |
| ElevenLabs TTS | 10K chars/mois gratuit | DÉJÀ PAYÉ |
| Railway hosting | ~$20/mois | DÉJÀ PAYÉ |
| Stripe | Commission transaction | DÉJÀ CONFIGURÉ |
| **Total additionnel** | **~$27-47/mois** | |
| **Marge à 50 étudiants** | **97%** ($1,500 revenu vs $47 coût) |

---

## 5. DIFFÉRENCIATEURS VS CONCURRENCE

### Ce qu'on a que PERSONNE n'a
1. ✅ **Tutrice IA Socratique** avec personnalité, mémoire, et anti-hallucination
2. ✅ **FSRS** (89.6% rétention vs 47% SM-2 de la compétition)
3. ✅ **IRT 3-paramètres** (calibration psychométrique comme le GRE/GMAT)
4. ✅ **Diagnostic rapide 5 min** (Squirrel AI inspired)
5. ✅ **Role-play simulation** (Aurélia joue le client)
6. ✅ **Profilage 80 dimensions** (VARK, Gardner, cognitif, psycho)
7. ✅ **Widget IA omniprésent** contextuel
8. ✅ **Voix bidirectionnelle** (STT Deepgram + TTS ElevenLabs)
9. ✅ **Multi-tenant** natif (portail branded par compagnie)
10. ✅ **Conformité intégrée** (AMF/CHAD/CSF/IQPF/UFC)

### Concurrence directe
| Concurrent | Forces | Faiblesses | Notre avantage |
|------------|--------|------------|----------------|
| **CSI** | Marque, accrédité AMF | LMS basique, pas d'IA | IA tutrice, adaptatif |
| **SeeWhy Learning** | Taux réussite élevé | Licensing initial seulement | UFC + initial |
| **IFSE** | ~~Établi~~ | **FERME juin 2025** | Timing parfait |
| **CHAD** | Obligatoire IARD | Interne seulement | Plateforme ouverte |

---

## 6. ARCHITECTURE TECHNIQUE

### Stack
```
Frontend: Next.js 15 (App Router) + TypeScript strict + Tailwind
Backend:  API Routes Next.js + Prisma ORM
Database: PostgreSQL (Railway) — 363 tables dont 36 LMS
Hosting:  Railway Pro ($20/mo) + Cloudflare CDN/WAF
Auth:     Auth.js v5 + OAuth (Google, Meta, X, Apple)
IA:       Claude Sonnet 4.5 (tuteur) + Deepgram (STT) + ElevenLabs (TTS)
Paiement: Stripe (cours + abonnements tuteur)
i18n:     22 langues, français référence
```

### Sécurité implémentée
- Tenant scoping sur TOUTES les queries
- Auth guards (`withUserGuard`) sur toutes les routes
- CSRF protection
- Rate limiting
- Anti-hallucination (citations sources obligatoires)
- Consentement Loi 25 (opt-in profilage)
- Validation serveur des progressions (anti-triche)
- Vérification ownership avant modification

---

## 7. RECHERCHE INTÉGRÉE — Résumé des 16 améliorations

| # | Amélioration | Status | Détail |
|---|---|---|---|
| 1 | Quiz diagnostic rapide 5 min | ✅ FAIT | diagnostic-service.ts (254 LOC) |
| 2 | FSRS (89.6% rétention) | ✅ FAIT | fsrs-engine.ts (174 LOC) |
| 3 | IRT 3-paramètres | ✅ FAIT | irt-engine.ts (253 LOC) |
| 4 | Mode Socratique | ✅ FAIT | tutor-service.ts system prompt |
| 5 | Anti-hallucination | ✅ FAIT | Citations loi obligatoires |
| 6 | Accréditation AMF | ❌ Phase 5 | Processus business |
| 7 | Consentement Loi 25 | ✅ Schema | UI ConsentBanner → Phase 1 |
| 8 | Micro-leçons 5 min | ✅ Schema | MicroLesson model créé |
| 9 | Role-play simulation | ✅ FAIT | 2 API routes + 2 pages (577 LOC) |
| 10 | Détection émotion vocale | ❌ Phase 4 | Deepgram sentiment API |
| 11 | Mode "walk & learn" | ❌ Phase 4 | Playlist audio TTS |
| 12 | LECTOR confusion sémantique | ❌ Phase 6 | Analyse paires concepts |
| 13 | Leaderboard équipe | ❌ Phase 4 | Schema exists, UI manque |
| 14 | Mastery visualization | ✅ FAIT | /learn/mastery (393 LOC) |
| 15 | Mode hors-ligne PWA | ❌ Phase 5 | Service worker |
| 16 | Rappels calendrier | ✅ Schema | UI → Phase 4 |

**Score**: 10/16 améliorations intégrées (62.5%), les 6 restantes planifiées Phases 4-6.

---

## 8. MÉTRIQUES DE SUCCÈS

### KPI Techniques
- Build: 0 erreurs TypeScript strict ✅
- Tests E2E: couverture parcours critique (Phase 6)
- Performance: < 3s chargement page, < 500ms API
- Uptime: 99.9% (Railway + Cloudflare)

### KPI Business (à 6 mois)
- 1+ compagnie d'assurance cliente
- 50+ étudiants actifs
- 5+ cours publiés avec quiz
- Accréditation AMF pour au moins 1 cours
- NPS > 40

### KPI Pédagogiques
- Taux rétention FSRS > 85%
- Taux complétion cours > 70%
- Satisfaction tuteur IA > 4/5
- Temps moyen certification < temps industrie

---

## 9. RISQUES ET MITIGATIONS

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Pas d'accréditation AMF | UFC non reconnues | HAUTE | Commencer processus ASAP |
| Hallucinations tuteur IA | Perte confiance | MOYENNE | Anti-hallucination + RAG sourcé |
| Coût Claude API élevé | Marge réduite | BASSE | Caching réponses fréquentes |
| Concurrence CSI | Parts de marché | MOYENNE | Différenciation IA + UX |
| Loi 25 non-conformité | Amendes $25M | HAUTE | ConsentBanner + EFVP |
| Schema trop complexe | Maintenance | BASSE | 51 modèles = gérable |

---

## 10. PROCHAINES ÉTAPES IMMÉDIATES

1. ✅ Schema LMS poussé vers Railway (312→363 tables)
2. [ ] **Phase 0** — Corriger `.env.production`, vérifier env vars Railway
3. [ ] **Phase 1** — Commencer par QuizPlayer + éditeur cours + i18n
4. [ ] Seed data — Créer 1 cours démo complet pour tester le flow
5. [ ] Test E2E — Parcours inscription → cours → quiz → certificat
