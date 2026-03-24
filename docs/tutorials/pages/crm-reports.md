# CRM Reports (13 pages)

Ce fichier couvre les 13 pages de la sous-section Reports du CRM.

---

## Analytics (Vue d'ensemble)
**URL**: `/admin/crm/analytics` | **Score**: **B+ (85/100)**

Dashboard analytique CRM avec stats pipeline, taux de conversion, cycle de vente moyen. Inclut le composant ForecastDashboard integre.

**API**: GET `/api/admin/crm/deals/stats`

---

## Report Builder
**URL**: `/admin/crm/reports/builder` | **Score**: **B+ (84/100)**

Constructeur de rapports personnalises avec selection d'entite et export.

**Fonctionnalites**: 4 entites (leads, deals, calls, agents). Selection de colonnes. Filtres. Execution de requete. Resultat en tableau. Export.

---

## Funnel Analysis
**URL**: `/admin/crm/funnel-analysis` | **Score**: **B+ (84/100)**

Analyse du funnel de conversion par etape du pipeline.

**Fonctionnalites**: Selection du pipeline. Visualisation funnel avec taux de passage entre etapes. Filtres par date.

---

## Activity Reports
**URL**: `/admin/crm/activity-reports` | **Score**: **B (80/100)**

Rapports d'activite CRM. Page wrapper Suspense qui delegue a `ActivityReportsClient`.

---

## Recurring Revenue (MRR/ARR)
**URL**: `/admin/crm/recurring-revenue` | **Score**: **A- (87/100)**

Tableau de bord des revenus recurrents.

**Fonctionnalites**: MRR total, ARR total, new MRR, churned MRR, net new MRR, nombre de deals, MRR moyen par deal. Repartition par intervalle de facturation. Top deals par MRR.

---

## Attribution
**URL**: `/admin/crm/attribution` | **Score**: **B (80/100)**

Attribution marketing multi-touch. Page wrapper Suspense qui delegue a `AttributionClient`.

---

## Churn (Attrition)
**URL**: `/admin/crm/churn` | **Score**: **B (80/100)**

Analyse du churn/attrition clients. Page wrapper Suspense qui delegue a `ChurnClient`.

---

## CLV (Customer Lifetime Value)
**URL**: `/admin/crm/clv` | **Score**: **B (80/100)**

Calcul de la valeur vie client. Page wrapper Suspense qui delegue a `CLVClient`.

---

## Cohort Analysis
**URL**: `/admin/crm/cohort-analysis` | **Score**: **B+ (84/100)**

Analyse par cohortes avec tableau retention.

**Fonctionnalites**: Grille de retention par periode. Filtres par date et intervalle. Export. Rafraichissement.

---

## Heatmaps
**URL**: `/admin/crm/heatmaps` | **Score**: **B+ (84/100)**

Cartes de chaleur des appels par jour et heure.

**Fonctionnalites**: Grille 7x24 (jours x heures). Metriques: total appels, appels repondus, taux de succes. Filtres et rafraichissement.

---

## Deal Journey
**URL**: `/admin/crm/deal-journey` | **Score**: **A- (87/100)**

Visualisation du parcours d'un deal depuis sa creation jusqu'a la cloture.

**Fonctionnalites**: Timeline avec evenements (appels, emails, meetings, changements de statut, etc.). Recherche de deal. Filtres. Metriques de duree par etape. Icones differenciees par type d'evenement.

---

## Snapshots
**URL**: `/admin/crm/snapshots` | **Score**: **B+ (85/100)**

Captures d'etat du CRM a un instant T pour comparaison historique.

**Fonctionnalites**: Creation de snapshots. Comparaison entre deux snapshots. Delta avec fleches haut/bas. Auto-refresh.

**API**: GET/POST `/api/admin/crm/snapshots`

---

## Dashboard Builder
**URL**: `/admin/crm/dashboard-builder` | **Score**: **A- (87/100)**

Constructeur de tableaux de bord personnalises avec widgets.

**Fonctionnalites**: 6 types de widgets (kpi, bar, line, pie, table, metric). Drag & drop via GripVertical. Sauvegarde de layouts. CRUD widgets. Parametres par widget.

**API**: GET/POST `/api/admin/crm/dashboard-builder`, DELETE widget
