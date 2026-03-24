# Section CRM - Audit Mega Playwright (Code Review)

**Date**: 2026-03-17
**Pages auditees**: 54 (dont 1 hors CRM: /admin/scraper)
**Methode**: Analyse statique du code source (page.tsx)
**Score global**: **B+ (84/100)**

---

## 1. Resume executif

La section CRM de peptide-plus est la plus large section de l'admin avec 54 pages couvrant la gestion des leads, deals, pipelines, campagnes, centre d'appels, automatisation et reporting avance. Le code est globalement bien structure avec une utilisation coherente de l'i18n, CSRF protection et patterns React modernes. Les principales faiblesses sont des textes hardcodes en anglais dans certaines pages (surtout SMS Campaigns et Pipelines), l'absence de pagination sur certaines listes, et quelques pages qui delegent toute la logique a un composant client externe sans fallback Suspense.

## 2. Architecture de la section

### 2.1 Sous-sections (6 groupes)
| Groupe | Pages | Score |
|--------|-------|-------|
| **Core** (Dashboard, Pipeline, Leads, Lists, Deals, Scraper) | 7 | A |
| **Sales** (Quotes, Forecast, Leaderboard, Quotas, Approvals, Contracts, Exchange Rates) | 7 | A- |
| **Communications** (Inbox, Campaigns, SMS Campaigns, SMS Templates, Snippets, Knowledge Base, Tickets) | 7 | B+ |
| **Call Center** (Dialer, Wallboard, Agent Performance, Reps, Call Analytics, Call Center KPIs, Scheduling, Adherence) | 8 | B |
| **Automation** (Workflows, Compliance, QA, Qualification, Duplicates, Forms, Playbooks, Workflow Analytics) | 8 | B+ |
| **Reports** (Analytics, Report Builder, Funnel Analysis, Activity Reports, Recurring Revenue, Attribution, Churn, CLV, Cohort Analysis, Heatmaps, Deal Journey, Snapshots, Dashboard Builder) | 13 | B |

### 2.2 Stack technique
- **Framework**: Next.js 15 App Router, `'use client'` sur toutes les pages
- **State management**: useState/useEffect/useCallback (pas de store global)
- **UI**: Tailwind CSS, lucide-react icons, sonner pour les toasts
- **i18n**: `useI18n()` de `@/i18n/client` (majoritaire), `useTranslations()` (scraper)
- **Securite**: `addCSRFHeader()` de `@/lib/csrf` sur toutes les mutations POST/PUT/DELETE
- **API**: Fetch natif vers `/api/admin/crm/*`

### 2.3 Patterns recurrents
- Pagination client-side avec `page` et `limit` states
- Filtres par recherche, status, source, type
- Modales de creation/edition inline (pas de routes separees)
- Selection multiple + actions bulk (leads, deals)
- Loading skeleton / empty states avec icones

## 3. Problemes identifies

### 3.1 Critiques (0)
Aucun probleme critique detecte.

### 3.2 Importants (4)
| # | Page | Probleme | Impact |
|---|------|----------|--------|
| 1 | Pipelines | Texte hardcode en francais "Nouveau pipeline", "Aucun pipeline configure", etc. | i18n incomplete |
| 2 | SMS Campaigns | Texte hardcode en anglais "New Campaign", "Campaign Name *", etc. | i18n incomplete |
| 3 | CRM Dashboard | 6 appels API en cascade (3 + 3 pour temperatures) au chargement | Performance |
| 4 | Leaderboard | Texte hardcode "calls", "rate" dans PodiumCard | i18n incomplete |

### 3.3 Mineurs (8)
| # | Page | Probleme |
|---|------|----------|
| 1 | Pipeline | Hardcode "Title is required", "Please assign an agent" |
| 2 | Leads | Boutons pagination "Prev"/"Next" hardcodes |
| 3 | Forecast | Page wrapper minimal, toute la logique dans ForecastDashboard composant |
| 4 | Call Analytics | Delegation complete a CallAnalyticsClient |
| 5 | Call Center KPIs | Delegation complete a CallCenterKPIsClient |
| 6 | Adherence | Delegation complete a AdherenceClient |
| 7 | QA | Delegation complete a QAClient |
| 8 | Workflow Analytics | Delegation complete a WorkflowAnalyticsClient |

## 4. Points forts

1. **CSRF systématique**: Toutes les mutations utilisent `addCSRFHeader()` - excellent
2. **Accessibilite**: Les modales ont `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
3. **Focus trap**: Approvals et Contracts implementent un focus trap complet avec gestion Escape
4. **Empty states**: Chaque page a un etat vide soigne avec icone + message
5. **Inbox 3-panel**: Layout Outlook-like tres professionnel (liste + messages + contact panel)
6. **Scraper Google Maps**: Page tres avancee avec carte interactive, dessin de zones, export CSV/Excel, integration CRM directe
7. **SMS Templates**: Preview en temps reel avec variables, compteur de segments SMS
8. **Campaigns**: Stats expansibles par campagne avec timeline quotidienne
9. **Workflows**: Builder dynamique avec import dynamique (SSR false)
10. **Dashboard Builder**: Systeme de widgets drag & drop

## 5. Statistiques

| Metrique | Valeur |
|----------|--------|
| Pages totales | 54 |
| Pages 'use client' | 41 |
| Pages Suspense wrapper | 7 |
| Pages delegation composant | 6 |
| API endpoints utilises | ~45 |
| Modales de creation | 18 |
| Pages avec pagination | 12 |
| Pages avec bulk actions | 3 |
| Pages avec export | 2 (Scraper CSV/Excel, Report Builder) |

## 6. Recommandations prioritaires

1. **i18n**: Passer les textes hardcodes restants en cles de traduction (Pipelines, SMS Campaigns, Leaderboard, Pipeline)
2. **Performance Dashboard**: Regrouper les 6 appels API en un seul endpoint `/api/admin/crm/dashboard-stats`
3. **Coherence**: Unifier l'utilisation de `useI18n()` partout (actuellement le Scraper utilise `useTranslations()`)
4. **Tests**: Ajouter des tests E2E pour le pipeline Kanban et l'Inbox (pages les plus complexes)
5. **Accessibility**: Ajouter des `aria-label` sur les boutons icone-only (surtout dans les tables)
