# APTITUDES LMS + AURÉLIA EN LIGNE — Plan Maître Consolidé

**Version**: 2.0 (consolidation complète)
**Date**: 2026-03-24
**Auteur**: Stéphane Michon + Claude (Aurélia)
**Objectif**: Top-2 LMS mondial pour la formation continue en assurance

---

## 1. MODÈLE D'AFFAIRES

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
3. **Tuteur IA Aurélia**: Abonnement mensuel ($29.99/mois ou $249.99/an)
4. **Corporatif**: Forfait tenant illimité pour Aurélia

### Marché cible
- Représentants en assurance au Québec/Canada
- Obtention de certificat (permis initial AMF)
- Formation continue obligatoire (UFC) pour représentants licenciés
- Conformité AMF, CHAD, CSF, IQPF

---

## 2. CE QUI EXISTE DÉJÀ (implémenté dans cette session)

### Schema Prisma (45+ modèles dans lms.prisma)

**Cours et contenu:**
- Course, CourseChapter, Lesson (7 types: VIDEO, TEXT, QUIZ, EXERCISE, DOCUMENT, SCORM, LIVE_SESSION)
- CourseCategory, InstructorProfile, CoursePrerequisite, CourseReview
- CourseOrder (transactions d'achat)

**Évaluation:**
- Quiz, QuizQuestion (5 types: MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN, MATCHING, ORDERING)
- QuizAttempt (résultats avec réponses détaillées)

**Progression:**
- Enrollment, LessonProgress
- Certificate, CertificateTemplate

**Gamification:**
- LmsBadge, LmsBadgeAward, LmsStreak, LmsLeaderboard

**Assurance/Conformité:**
- RegulatoryBody (AMF, CHAD, CSF, IQPF)
- CourseAccreditation, RepresentativeLicense
- CePeriod, CeCredit, ComplianceAssignment

**Portail branded:**
- TenantLmsPortal (subdomain + SSO)

**Tuteur IA (schema):**
- AiTutorSubscription, AiTutorSession, AiTutorMessage, AiTutorKnowledge

**Profil ultra-sophistiqué:**
- StudentProfile (~80 champs: VARK, Gardner, cognitif, psychologique, préférences)
- StudentProfileNote (journal d'observations Aurélia)
- StudentProfileSnapshot (évolution périodique)
- StudentTaskFeedback (feedback par tâche)
- StudentAnalytics (métriques agrégées temps réel)
- QuizResponseDetail (analyse fine par question)

**Apprentissage adaptatif:**
- LmsConcept (noeuds de connaissance)
- LmsConceptPrereq (graphe de prérequis pondéré)
- LmsConceptLessonMap (mapping concept ↔ leçon par Bloom)
- LmsConceptQuestion (questions par concept + Bloom + angle + IRT)
- LmsConceptMastery (maîtrise par étudiant + SM-2)
- LmsLearningPath, LmsLearningPathStep (parcours personnalisé)

### API Routes (20+)
- Admin: courses, chapters, lessons, quizzes, enrollments, categories, instructors, certificates, compliance, analytics, ai-tutor
- Public: catalog, enroll, progress, quiz, quiz/attempt, certificates/verify

### Pages UI (12+)
- Admin: dashboard, cours, nouveau cours, étudiants, certificats, catégories, conformité
- Étudiant: catalogue, détail cours, visionneuse leçon, dashboard, vérification certificat

### Widget Aurélia
- Bouton flottant omniprésent sur chaque page
- Conversation texte + voix (micro)
- Contexte de page injecté automatiquement

---

## 3. CE QU'ON VEUT IMPLÉMENTER

### 3.1 Système de quiz 5 niveaux (Bloom's Taxonomy)

| Niveau | Bloom | Type de question | Passing |
|---|---|---|---|
| 1 | Reconnaissance | QCM, V/F, matching | 80% sur 3+ questions |
| 2 | Compréhension | Trous, reformulation, paraphrase | 75% sur 3+ questions |
| 3 | Application | Scénario, calcul, procédure | 70% sur 3+ questions |
| 4 | Analyse | Comparaison, cas, identifier erreur | 65% sur 3+ questions |
| 5 | Synthèse | Question ouverte (grading IA) | Rubrique IA >= 70% |

**Chaque concept testé sous 3+ angles:**
- Forward (direct): "Qu'est-ce que X?"
- Reverse (inverse): "Quel concept correspond à cette description?"
- Scénario: "Dans cette situation, que faire?"
- Edge case: "Et si la situation était légèrement différente?"
- Comparaison: "Différence entre X et Y?"
- Élimination: "Lequel de ces énoncés est FAUX?"

### 3.2 Apprentissage adaptatif

- **Graphe de concepts** avec prérequis pondérés
- **Mastery-based progression** (pas time-based)
- **Répétition espacée SM-2** (Ebbinghaus forgetting curve)
- **Parcours personnalisé** auto-généré et auto-adapté
- **Détection automatique des lacunes** via quiz results
- **Remédiation** (leçons alternatives, tuteur IA, exercices supplémentaires)

### 3.3 Aurélia en ligne — Tutrice IA personnelle

**Fonctionnalités:**
- Conversation texte ET voix en temps réel
- Omniprésente sur chaque page (widget flottant)
- Connaît le contexte (cours, leçon, concept en cours)
- Profilage conversationnel naturel (~80 dimensions)
- Détection automatique: style d'apprentissage, frustration, risque abandon
- Feedback après chaque tâche
- Recommandations personnalisées
- Suivi conformité UFC proactif

**Architecture technique:**
- Claude Sonnet 4.5 = cerveau (conversations + grading)
- Deepgram Nova-2 = STT (voix → texte) — DÉJÀ PAYÉ
- ElevenLabs = TTS (texte → voix "Sarah") — DÉJÀ PAYÉ
- OpenAI = embeddings pour RAG — DÉJÀ PAYÉ
- PostgreSQL pg_trgm + pgvector = recherche — DÉJÀ PAYÉ
- Railway = hébergement — DÉJÀ PAYÉ

**Coût additionnel: ~$27/mois** (Claude API seulement)

### 3.4 Synchronisation Aurélia locale ↔ cloud

- Local (Mac Studio) = autorité sur le contenu
- Cloud = autorité sur les données étudiants
- Sync quotidienne bidirectionnelle
- Évolution d'une instance = évolution instantanée de l'autre

### 3.5 Profilage étudiant ultra-sophistiqué

**80+ dimensions collectées via:**
1. Conversation naturelle avec Aurélia (onboarding)
2. Détection automatique (comportement, quiz patterns, timing)
3. Feedback explicite (rating, commentaires)

**Catégories:**
- Démographique, professionnel, éducation
- VARK (visuel, auditif, lecture, kinesthésique)
- Gardner (8 intelligences multiples)
- Capacités cognitives mesurées (mémoire, vitesse, attention, rétention)
- Psychologique (motivation, anxiété, confiance, growth mindset)
- Préférences de contenu et de rythme
- Objectifs personnels et contraintes
- Interaction avec Aurélia (style de communication)

### 3.6 Analytics et reporting

**Pour l'étudiant:**
- Bilan hebdomadaire par Aurélia
- Graphe de maîtrise par concept
- Courbe de rétention
- Prédiction de résultats

**Pour le gestionnaire (compagnie d'assurance):**
- Dashboard par département/équipe
- Taux complétion, conformité UFC
- Alertes étudiants à risque
- Profils agrégés (styles, motivations)
- Rapports auto-générés pour les organismes (AMF)

---

## 4. INFRASTRUCTURE EXISTANTE RÉUTILISABLE

| Service | Status | Plan | Utilité Aptitudes |
|---|---|---|---|
| Railway | ACTIF | ~$20/mo | Hébergement + PostgreSQL + Redis |
| Claude API | ACTIF | Max (2 comptes) | Cerveau Aurélia |
| Deepgram | ACTIF | $200 crédit | STT (voix → texte) |
| ElevenLabs | ACTIF | Free 10K/mo | TTS (Aurélia parle) |
| OpenAI | ACTIF | Pay-as-you-go | Embeddings pour RAG |
| Stripe | ACTIF | Prod | Paiements étudiants |
| Telnyx | ACTIF | 4 numéros | Appels téléphoniques avec Aurélia |
| Resend | ACTIF | Free 3K/mo | Emails notifications |

**Coût total additionnel estimé: ~$27-47/mois pour démarrer**

---

## 5. GAP ANALYSIS VS TOP LMS

### Ce qu'on a que les autres n'ont PAS (nos différenciateurs):
1. ✅ Tuteur IA avec personnalité et mémoire
2. ✅ Profilage 80+ dimensions
3. ✅ Quiz 5 niveaux Bloom par concept
4. ✅ Conversation voix avec l'IA
5. ✅ Conformité assurance intégrée (AMF/CHAD/CSF)
6. ✅ Widget IA omniprésent contextuel

### Ce que les top LMS ont qu'on n'a PAS ENCORE:
- [ ] Runtime SCORM 1.2/2004
- [ ] xAPI/Tin Can support
- [ ] Content versioning
- [ ] Éditeur riche WYSIWYG (on a markdown)
- [ ] H5P interactive content
- [ ] Question banks / pools
- [ ] Discussion forums per course
- [ ] Peer review assignments
- [ ] Cohort-based learning
- [ ] Predictive analytics (at-risk)
- [ ] LTI 1.3 tool interop
- [ ] SSO SAML/OIDC (schema ready)
- [ ] Native mobile app

---

## 6. QUESTIONS À VALIDER PAR RECHERCHE

Avant d'exécuter, rechercher et valider:

1. **Adaptive learning state-of-art**: Comment Squirrel AI, Carnegie Learning, Knewton font-ils? Quels algorithmes utilisent-ils au-delà de SM-2?

2. **AI tutoring best practices**: Qu'est-ce que Khanmigo (Khan Academy), Duolingo Birdbrain, et les ITS académiques font de mieux? Quelles erreurs éviter?

3. **Quiz design science**: Que dit la recherche sur l'optimal number of questions par concept? Fréquence des revues? Calibration IRT?

4. **Student profiling ethics**: RGPD/Loi 25 implications du profilage psychologique? Consentement nécessaire?

5. **Voice AI in education**: Études sur l'efficacité de la voix vs texte pour l'apprentissage? Engagement rates?

6. **Insurance CE market**: Que font les concurrents directs (CSI, IFB, IFSE) en termes de LMS? Quelles sont leurs faiblesses?

7. **Gamification science**: Que dit la recherche sur badges/streaks/leaderboard? Quand ça aide vs quand ça nuit?

8. **Knowledge graph tools**: FalkorDB vs Neo4j vs simple Prisma relations pour le graphe de concepts? Performance à l'échelle?

9. **Spaced repetition**: SM-2 vs SM-17 (SuperMemo) vs FSRS (Anki)? Lequel est le plus efficace?

10. **Multi-modal learning**: Comment intégrer efficacement vidéo + texte + quiz + voix pour maximiser la rétention?

---

## 7. PROCHAINES ÉTAPES

1. ✅ Consolider le plan (CE DOCUMENT)
2. 🔄 Recherche exhaustive sur les 10 questions ci-dessus
3. [ ] Analyser les résultats et ajuster le plan
4. [ ] Prioriser les features par impact
5. [ ] Exécuter Phase 1 (Concepts + Quiz 5 niveaux)
6. [ ] Exécuter Phase 2 (Parcours adaptatif)
7. [ ] Exécuter Phase 3 (Aurélia en ligne MVP)
8. [ ] Exécuter Phase 4 (Voix + Profilage)
9. [ ] Exécuter Phase 5 (Platform features)
10. [ ] Exécuter Phase 6 (Intelligence + Sync)
