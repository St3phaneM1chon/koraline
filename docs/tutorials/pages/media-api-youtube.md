# API YouTube

**Route**: `/admin/media/api-youtube`
**Fichier**: `src/app/admin/media/api-youtube/page.tsx`
**Score**: **B+** (87/100)

## Description
Configuration de l'integration YouTube Data API v3. Champs: Channel ID, API Key, OAuth Client Secret (env), lien public. Inclut des ribbon actions pour les campagnes ads.

## Fonctionnalites
- Toggle activation
- Champs: Channel ID, API Key (Data API v3), OAuth Client Secret (env), lien public
- Sauvegarde, test de connexion
- Statut OAuth
- Export de la config en JSON
- Ribbon actions: configure, testConnection, syncData, viewLogs, documentation, export
- Ribbon actions ads: newAdCampaign, delete, pause, resume, modifyBudget, performanceStats

## Composants
- `IntegrationCard`, `PlatformConnectionStatus`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/youtube` | Config |
| PUT | `/api/admin/integrations/youtube` | Sauvegarder |
| POST | `/api/admin/integrations/youtube` | Tester |

## Problemes Identifies
- Hints hardcodes en anglais: "Found in YouTube Studio > Settings..." (pas i18n)

## Notes Techniques
- `use client` -- 181 lignes
- Page la plus riche des APIs avec 12 ribbon actions
