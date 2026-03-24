# CRM Automation (Workflows, Compliance, QA, Qualification, Duplicates, Forms, Playbooks, Analytics)

Ce fichier couvre les 8 pages de la sous-section Automation du CRM.

---

## Workflows
**URL**: `/admin/crm/workflows` | **Score**: **A- (88/100)**

Systeme d'automatisation avec builder visuel drag & drop.

**Fonctionnalites**: Liste des workflows avec statut. Toggle vue grille/liste. Actions start/pause/delete. Builder visuel charge dynamiquement (SSR false) via `WorkflowBuilder` composant. Creation de workflows.

**API**: GET/POST `/api/admin/crm/workflows`, actions start/pause/delete

**Note**: Import dynamique du builder pour eviter les erreurs SSR.

---

## Compliance
**URL**: `/admin/crm/compliance` | **Score**: **B+ (85/100)**

Gestion de la conformite reglementaire (DNC, consentement, CASL/TCPA).

**Fonctionnalites**: Gestion liste DNC (Do Not Call). Upload de listes de numeros bloques. Verification DNC. Parametres de conformite. Icones: Shield, Phone, Ban, CheckCircle2, XCircle, AlertTriangle.

**API**: GET/POST via `/api/admin/crm/compliance`

---

## QA (Assurance Qualite)
**URL**: `/admin/crm/qa` | **Score**: **B (80/100)**

Evaluation de la qualite des interactions agents.

**Structure**: Page wrapper Suspense qui delegue a `QAClient`.

---

## Qualification (Lead Scoring)
**URL**: `/admin/crm/qualification` | **Score**: **B+ (85/100)**

Systeme de qualification des leads avec frameworks (BANT, MEDDIC, etc.).

**Fonctionnalites**: Liste des leads avec score, temperature, statut, framework de qualification. Evaluation par criteres avec CheckCircle2/XCircle/MinusCircle. Recherche et filtres. Sauvegarde du framework de qualification.

**API**: GET/PUT via `/api/admin/crm/qualification`

---

## Duplicates (Deduplication)
**URL**: `/admin/crm/duplicates` | **Score**: **A- (87/100)**

Detection et fusion des doublons de leads.

**Fonctionnalites**: Detection automatique par: email exact, telephone exact, nom fuzzy, nom+entreprise fuzzy. Comparaison cote a cote des doublons. Fusion avec choix du lead principal. Recherche.

**API**: GET `/api/admin/crm/duplicates`, POST merge

---

## Forms (Formulaires)
**URL**: `/admin/crm/forms` | **Score**: **B+ (84/100)**

Constructeur de formulaires pour capture de leads.

**Fonctionnalites**: Champs configurables (text, email, tel, textarea, select). Marquage required/optional. Options pour select. Code d'integration embeddable (Copy).

**API**: GET/POST `/api/admin/crm/forms`

---

## Playbooks
**URL**: `/admin/crm/playbooks` | **Score**: **B+ (85/100)**

Guides de vente structures avec etapes et ressources.

**Fonctionnalites**: Liste des playbooks avec etapes expandables. Statut complet/incomplet par etape. Liens vers ressources. Creation avec etapes ordonnees.

**API**: GET/POST `/api/admin/crm/playbooks`

---

## Workflow Analytics
**URL**: `/admin/crm/workflow-analytics` | **Score**: **B (80/100)**

Analytique des workflows d'automatisation.

**Structure**: Page wrapper Suspense qui delegue a `WorkflowAnalyticsClient`.
