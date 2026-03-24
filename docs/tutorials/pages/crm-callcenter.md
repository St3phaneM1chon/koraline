# CRM Call Center (Dialer, Wallboard, Agents, Reps, Analytics, KPIs, Scheduling, Adherence)

Ce fichier couvre les 8 pages de la sous-section Call Center du CRM.

---

## Dialer (Composeur)
**URL**: `/admin/crm/dialer` | **Score**: **B+ (85/100)**

Interface de composition d'appels pour les agents avec file de leads a contacter.

**Fonctionnalites**: File de leads avec score, temperature, statut DNC. Boutons appel/skip. Statistiques de session en temps reel. Icones temperature (Flame, Thermometer, Snowflake).

**API**: Utilise `fetchWithCSRF` (variante de addCSRFHeader).

---

## Wallboard
**URL**: `/admin/crm/wallboard` | **Score**: **B+ (84/100)**

Tableau de bord temps reel pour superviseurs avec metriques du centre d'appels.

**Fonctionnalites**: Agents en ligne, agents en appel, appels du jour, temps moyen de parole. Stats jour: total appels, repondus, manques, duree moyenne, duree totale. Stats files d'attente (queues) avec appels en attente.

**API**: GET `/api/admin/crm/wallboard` (suppose)

**Note**: Concu pour affichage sur grand ecran en temps reel (auto-refresh probable via le composant).

---

## Agents Performance
**URL**: `/admin/crm/agents/performance` | **Score**: **B+ (83/100)**

Tableau de performance detaillee par agent.

**Fonctionnalites**: Appels effectues, appels repondus, temps de parole total, temps moyen de traitement, conversions, revenu, temps de pause. Taux de contact. Tendances (ArrowUp/ArrowDown/Minus).

**API**: GET `/api/admin/crm/agents/performance`

---

## Reps (360)
**URL**: `/admin/crm/reps` | **Score**: **B+ (84/100)**

Vue 360 des representants commerciaux avec avatar et compteurs d'activite.

**Fonctionnalites**: Liste des reps avec avatar, role, compteurs (leads assignes, deals assignes, activites CRM, stats quotidiennes). Navigation vers la fiche detaillee /admin/crm/reps/{id}. Recherche par nom/email.

**API**: Utilise les compteurs Prisma (_count).

---

## Call Analytics
**URL**: `/admin/crm/call-analytics` | **Score**: **B (80/100)**

Analytique detaillee des appels.

**Structure**: Page wrapper Suspense qui delegue a `CallAnalyticsClient`. Le composant client est dans un fichier separe.

---

## Call Center KPIs
**URL**: `/admin/crm/call-center-kpis` | **Score**: **B (80/100)**

Indicateurs cles de performance du centre d'appels.

**Structure**: Page wrapper Suspense qui delegue a `CallCenterKPIsClient`.

---

## Scheduling (Planification)
**URL**: `/admin/crm/scheduling` | **Score**: **A- (88/100)**

Planification des horaires des agents avec vue calendrier hebdomadaire.

**Fonctionnalites**: Vue semaine avec navigation prev/next. 6 types de quarts: MORNING, AFTERNOON, EVENING, NIGHT, SPLIT, CUSTOM. Assignation d'agents avec avatar. Creation de plannings.

**API**: GET/POST via `/api/admin/crm/scheduling`

---

## Adherence
**URL**: `/admin/crm/adherence` | **Score**: **B (80/100)**

Suivi de l'adherence aux horaires planifies.

**Structure**: Page wrapper Suspense qui delegue a `AdherenceClient`.
