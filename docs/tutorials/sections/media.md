# Section Media -- Audit Mega Playwright (Analyse Code)

**Date**: 2026-03-17
**Pages auditees**: 37 (+ 2 sous-pages detail)
**Methode**: Analyse statique du code source (Playwright MCP indisponible)

---

## Resume Executif

La section Media de l'admin peptide-plus couvre l'ensemble de la gestion multimedia et des integrations de plateformes sociales/communication. Elle comprend 37 pages organisees en 6 sous-categories :

1. **Dashboard & Analytics** (2 pages) -- Tableau de bord central + metriques Recharts
2. **Plateformes de communication** (5 pages) -- Lancement Teams, Zoom, Webex, Google Meet, WhatsApp
3. **Publicite (Ads)** (6 pages) -- YouTube, X, TikTok, Google Ads, LinkedIn, Meta
4. **APIs / Integrations** (12 pages) -- Configuration des APIs pour chaque plateforme
5. **Gestion du contenu** (12 pages) -- Videos, images, librairie, brand kit, scheduler, etc.

---

## Scores Globaux par Sous-Categorie

| Sous-categorie | Pages | Score moyen | Remarques |
|---|---|---|---|
| Dashboard & Analytics | 2 | **A** (92) | Dashboard riche, analytics avec Recharts |
| Plateformes (Launch) | 5 | **B+** (85) | Code duplique mais propre, composant PlatformLauncher |
| Ads | 6 | **A-** (90) | Composant AdsPlatformDashboard reutilisable, minimal |
| APIs | 12 | **B+** (86) | IntegrationCard reutilisable, CSRF, gestion erreurs |
| Management | 12 | **A-** (89) | Pages complexes, bien i18n, features avancees |

**Score global section**: **B+** (88/100)

---

## Points Forts

- **Composants reutilisables**: `PlatformLauncher`, `AdsPlatformDashboard`, `IntegrationCard`, `PlatformConnectionStatus` evitent la duplication massive
- **i18n systematique**: Quasi-toutes les pages utilisent `useI18n()` et `t()` pour les textes
- **Securite CSRF**: Toutes les mutations utilisent `addCSRFHeader()` ou `fetchWithCSRF()`
- **Gestion d'erreurs**: `try/catch` + `toast.error()` sur la majorite des appels API (fix F20)
- **Ribbon actions**: Integration coherente avec le systeme de ruban admin
- **Features avancees**: AI tagging (images), smart crop, bulk upload, drag & drop, calendar view (scheduler)
- **Accessibilite**: Focus trap dans les modales, aria-labels, keyboard navigation (Escape, fleches)
- **Breadcrumbs**: Navigation contextuelle sur les pages profondes (images, library, video-categories)

---

## Points Faibles / Problemes Identifies

### Critiques (P0)
- **Aucun** probleme critique bloquant

### Importants (P1)
1. **Textes hardcodes restants**: Certains hints/labels dans les pages API (YouTube, X, TikTok, Google Ads, LinkedIn, Vimeo) sont en anglais hardcode au lieu d'utiliser `t()`
2. **Code duplique dans les launchers**: Les 5 pages launch-* ont un pattern identique de ribbon actions dupliquees
3. **`console.error` sans toast**: Certaines pages API (api-zoom, api-teams) font `console.error` dans le `catch` sans toast utilisateur sur le chargement initial
4. **Hardcoded French dans images.tsx**: Textes comme "Glissez-deposez vos images" et "Envoie groupe termine" non i18n

### Mineurs (P2)
5. **Stats loading en 2 requetes (dashboard)**: Le dashboard fait 2 requetes separees (medias + videos) au lieu d'un endpoint agrege
6. **Variable shadow (dashboard)**: Import `platforms` de config + `const [platforms, setPlatforms]` useState -- shadow potentiel
7. **Social scheduler: confirm() natif**: `handleDisconnect` dans connections.tsx utilise `confirm()` natif au lieu de ConfirmDialog
8. **TODO non resolus**: 25+ IMP-xxx TODO comments dans le code pour des features futures

---

## Architecture des Composants

```
MediaDashboardPage (page.tsx)
  |-- StatCard (local)
  |-- QuickLink (local)
  |-- PLATFORM_LAUNCHERS -> Link -> /admin/media/launch-*
  |-- PLATFORM_DEFS -> Link -> /admin/media/api-* et ads-*

Launch Pages (5x)
  |-- PlatformLauncher (composant partage)
  |-- useRibbonAction (hook)

Ads Pages (6x)
  |-- AdsPlatformDashboard (composant partage)

API Pages (12x)
  |-- IntegrationCard (composant partage)
  |-- PlatformConnectionStatus (certaines pages)
  |-- useRibbonAction

Management Pages
  |-- videos/page.tsx (1100+ lignes, le plus gros)
  |-- images/page.tsx (~810 lignes, AI tagger + smart crop)
  |-- library/page.tsx (~650 lignes, grid/list view)
  |-- social-scheduler/page.tsx (~580 lignes, calendar + composer)
  |-- sessions/page.tsx (~670 lignes, modal creation)
  |-- connections/page.tsx (~500 lignes, OAuth flow)
  |-- imports/page.tsx (~490 lignes, bulk import)
  |-- video-categories/page.tsx (~650 lignes, tree view)
  |-- consents/page.tsx (~370 lignes, CSV export)
  |-- consent-templates/page.tsx (~400 lignes, question builder)
  |-- content-hub/page.tsx (~315 lignes, KPI + charts)
  |-- brand-kit/page.tsx (~265 lignes, color/typo editor)
  |-- analytics/ (server page + client component, Recharts)
```

---

## APIs Utilisees

| Endpoint | Methodes | Pages |
|---|---|---|
| `/api/admin/integrations/{platform}` | GET, PUT, POST | api-zoom, api-teams, api-whatsapp, api-webex, api-google-meet, api-youtube, api-vimeo, api-x, api-tiktok, api-google-ads, api-linkedin, api-meta |
| `/api/admin/medias` | GET, POST, PATCH, DELETE | dashboard, images, library |
| `/api/admin/medias/usage` | GET | images |
| `/api/admin/videos` | GET, POST, PATCH, DELETE | videos, content-hub |
| `/api/admin/video-categories` | GET, POST, PATCH, DELETE | video-categories, connections |
| `/api/admin/platform-connections` | GET, PUT, DELETE | connections, sessions |
| `/api/admin/platform-connections/{platform}/oauth` | GET | connections |
| `/api/admin/platform-connections/{platform}/test` | POST | connections |
| `/api/admin/recording-imports` | GET, POST, PATCH | imports |
| `/api/admin/recording-imports/sync` | POST | imports |
| `/api/admin/recording-imports/bulk-import` | POST | imports |
| `/api/admin/video-sessions` | GET, POST, PUT | sessions |
| `/api/admin/consents` | GET, PATCH | consents |
| `/api/admin/consent-templates` | GET, POST, PATCH, DELETE | consent-templates |
| `/api/admin/content-hub/stats` | GET | content-hub |
| `/api/admin/brand-kit` | GET, PUT | brand-kit |
| `/api/admin/social-posts` | GET, POST, DELETE | social-scheduler |
| `/api/admin/social-posts/{id}/publish` | POST | social-scheduler |
| `/api/admin/media/analytics` | GET | analytics |
| `/api/admin/customers` | GET | sessions (recherche client) |

---

## Recommandations Prioritaires

1. **Extraire les ribbon actions dupliquees** des 5 pages launch-* dans un hook partage `usePlatformLauncherRibbon()`
2. **Remplacer les textes hardcodes** par des cles i18n dans toutes les pages API
3. **Ajouter toast.error sur chargement initial** dans les pages API qui utilisent `console.error` seulement
4. **Remplacer confirm() natif** par `ConfirmDialog` dans connections.tsx
5. **Creer un endpoint agrege** `/api/admin/media/dashboard-stats` pour eviter les requetes multiples
