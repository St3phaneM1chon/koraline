# LMS Aptitudes — Architecture & Design

**Version**: 1.0
**Date**: 2026-03-23
**Plateforme**: Koraline SaaS (Attitudes.vip)

---

## 1. Modele d'affaires

### Flux commercial
```
Attitudes.vip (SaaS Koraline)
  └── Module "Aptitudes" (LMS)
        └── Compagnies d'assurance (tenants)
              ├── Chubb Insurance
              ├── Industrielle Alliance
              ├── Desjardins Assurances
              └── ...
                    └── Etudiants/Representants
                          ├── Achat de formations
                          ├── Obtention de certificats
                          ├── Formation continue (UFC)
                          └── Tuteur IA (abonnement mensuel)
```

### Modele de revenus
1. **Compagnies**: Abonnement mensuel au module Aptitudes (inclus dans plan Koraline ou a la carte)
2. **Etudiants**: Achat individuel de formations (prix par cours)
3. **Tuteur IA**: Abonnement mensuel ($29.99/mois ou $249.99/an)
4. **Corporatif**: Forfait tenant illimite pour le tuteur IA

---

## 2. Architecture technique

### Schema Prisma (prisma/schema/lms.prisma)

**Modeles principaux (30+)**:
- `Course`, `CourseChapter`, `Lesson` — Contenu pedagogique
- `Quiz`, `QuizQuestion`, `QuizAttempt` — Evaluation
- `Enrollment`, `LessonProgress` — Suivi etudiant
- `Certificate`, `CertificateTemplate` — Certification
- `CourseCategory`, `InstructorProfile` — Organisation
- `CourseReview`, `CoursePrerequisite` — Social/prerequis
- `LmsBadge`, `LmsBadgeAward`, `LmsStreak`, `LmsLeaderboard` — Gamification
- `ComplianceAssignment` — Formation obligatoire corporatif

**Modeles assurance/CE**:
- `RegulatoryBody` — Organismes (AMF, CHAD, CSF, IQPF)
- `CourseAccreditation` — Accreditation par organisme
- `RepresentativeLicense` — Permis des representants
- `CePeriod` — Cycle de formation continue (2 ans)
- `CeCredit` — Credits UFC gagnes
- `TenantLmsPortal` — Portail brande (chubb.aptitudes.vip)
- `CourseOrder` — Transactions d'achat

**Modeles tuteur IA**:
- `AiTutorSubscription` — Abonnement mensuel
- `AiTutorSession` — Conversations
- `AiTutorMessage` — Messages
- `AiTutorKnowledge` — Base de connaissances RAG

### Types de lecons
- `VIDEO` — Video avec suivi progression
- `TEXT` — Contenu markdown
- `QUIZ` — Questionnaire auto-corrige
- `EXERCISE` — Exercice avec soumission
- `DOCUMENT` — Document PDF/Word
- `SCORM` — Package SCORM 2004
- `LIVE_SESSION` — Session live (via infra VoIP)

### Types de quiz
- `MULTIPLE_CHOICE` — Choix multiples
- `TRUE_FALSE` — Vrai/Faux
- `FILL_IN` — Remplir les blancs
- `MATCHING` — Association
- `ORDERING` — Mise en ordre

---

## 3. API Routes

### Admin (/api/admin/lms/)
| Route | Methods | Description |
|-------|---------|-------------|
| `/courses` | GET, POST | Liste/creation cours |
| `/courses/[id]` | GET, PATCH, DELETE | Detail/modification cours |
| `/chapters` | GET, POST | Chapitres par cours |
| `/lessons` | GET, POST | Lecons par chapitre |
| `/enrollments` | GET, POST | Inscriptions (individuel + bulk) |
| `/categories` | GET, POST | Categories de cours |
| `/analytics` | GET | Statistiques LMS |
| `/ai-tutor` | GET, POST | Gestion tuteur IA + knowledge base |

### Public (/api/lms/)
| Route | Methods | Description |
|-------|---------|-------------|
| `/courses` | GET | Catalogue public |
| `/enroll` | POST | Auto-inscription |
| `/progress` | GET, POST | Progression etudiant |
| `/quiz` | POST | Soumission quiz |
| `/certificates` | GET | Mes certificats |
| `/certificates/verify` | GET | Verification publique QR |

---

## 4. Pages Admin (/admin/formation/)

| Page | Description |
|------|-------------|
| `/admin/formation` | Dashboard LMS |
| `/admin/formation/cours` | Liste des cours |
| `/admin/formation/cours/nouveau` | Createur de cours |
| `/admin/formation/cours/[id]` | Editeur de cours |
| `/admin/formation/categories` | Categories |
| `/admin/formation/instructeurs` | Instructeurs |
| `/admin/formation/quiz` | Banque de quiz |
| `/admin/formation/medias` | Medias LMS |
| `/admin/formation/modeles-certificats` | Templates certificats |
| `/admin/formation/etudiants` | Inscriptions |
| `/admin/formation/progression` | Suivi progression |
| `/admin/formation/certificats` | Certificats emis |
| `/admin/formation/badges` | Gamification |
| `/admin/formation/classement` | Leaderboard |
| `/admin/formation/avis` | Avis etudiants |
| `/admin/formation/conformite` | Conformite AMF |
| `/admin/formation/rapports` | Rapports corporatifs |
| `/admin/formation/analytics` | Analytics avances |
| `/admin/formation/parametres` | Parametres LMS |

---

## 5. Pages Etudiant

| Page | Description |
|------|-------------|
| `/learn` | Catalogue de formations |
| `/learn/[slug]` | Page detail cours |
| `/learn/[slug]/[chapterId]/[lessonId]` | Visionneuse de lecon |
| `/dashboard/student/courses` | Mes formations |
| `/dashboard/student/certificates` | Mes certificats |

---

## 6. Conformite Assurance (AMF Quebec)

### Organismes supportes
- **AMF** — Autorite des marches financiers
- **CHAD** — Chambre de l'assurance de dommages
- **CSF** — Chambre de la securite financiere
- **IQPF** — Institut quebecois de planification financiere

### Types de permis
- Assurance de personnes (vie)
- Assurance de dommages (IARD)
- Assurance collective
- Planification financiere
- Assurance hypothecaire
- Expert en sinistres
- Epargne collective / valeurs mobilieres

### Categories UFC
- General, Ethique, Conformite, Produits specifiques
- Lutte anti-blanchiment, Protection des renseignements personnels
- Planification financiere

### Cycle de formation continue
- Typiquement 2 ans
- UFC requises par cycle (ex: 30.0)
- UFC ethique minimum (ex: 5.0)
- Suivi automatique des credits
- Alertes d'echeance

---

## 7. Tuteur IA (Aurelia en ligne) — Phase future

### Specialisations
- Droit des assurances
- Conformite AMF
- Ethique professionnelle
- LDPSF (Loi sur la distribution de produits et services financiers)
- LSFSE (Loi sur les societes de fiducie et les societes d'epargne)
- Code civil du Quebec (contrats d'assurance)

### Plans tarifaires
- FREE_TRIAL: 7 jours, 10 questions/jour
- MONTHLY: $29.99/mois, illimite
- ANNUAL: $249.99/an, illimite
- CORPORATE: Inclus dans forfait tenant

### Architecture RAG
- Base de connaissances par tenant (AiTutorKnowledge)
- Embeddings vectoriels (integration vector store existant)
- Citations de sources legales dans les reponses
- Feedback thumbs up/down pour amelioration continue

---

## 8. Roadmap

### Cycle 1 (Fondation) — EN COURS
- [x] Schema Prisma complet
- [x] Navigation admin
- [x] Service LMS
- [x] API Routes CRUD
- [x] Pages admin (Dashboard + Liste cours)
- [ ] Pages admin restantes
- [ ] Pages etudiant
- [ ] Cles i18n

### Cycle 2 (Fonctionnalites avancees)
- [ ] Player video avec suivi progression
- [ ] Moteur quiz auto-corrige
- [ ] PDF certificats avec QR
- [ ] Import SCORM 2004
- [ ] Dashboard instructeur
- [ ] Inscription bulk CSV
- [ ] Portail brande par tenant
- [ ] Webhooks progression
- [ ] Gamification (badges, streaks, classement)

### Cycle 3 (Entreprise)
- [ ] Tuteur IA (Aurelia en ligne)
- [ ] Recommandations IA
- [ ] Parcours adaptatifs
- [ ] Contenu multi-langue (22 locales)
- [ ] Sessions live
- [ ] Suivi conformite AMF
- [ ] Rapports corporatifs
- [ ] API sync LMS externe
