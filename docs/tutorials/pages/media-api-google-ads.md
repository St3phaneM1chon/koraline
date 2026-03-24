# API Google Ads

**Route**: `/admin/media/api-google-ads`
**Fichier**: `src/app/admin/media/api-google-ads/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration Google Ads API. Page la plus riche en champs secrets avec: Customer ID, Merchant Center ID, Developer Token, OAuth Client Secret, Refresh Token.

## Fonctionnalites
- Toggle activation
- Champs: Customer ID, Merchant Center ID, Developer Token (env), OAuth Client Secret (env), Refresh Token (env), lien public
- Sauvegarde, test de connexion
- Export config JSON
- Ribbon actions: configure, testConnection, syncData, viewLogs, documentation, export
- Ribbon actions ads: newAdCampaign, delete, pause, resume, modifyBudget, performanceStats

## Composants
- `IntegrationCard`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/google` | Config |
| PUT | `/api/admin/integrations/google` | Sauvegarder |
| POST | `/api/admin/integrations/google` | Tester |

## Notes Techniques
- `use client` -- 203 lignes
- 6 champs dont 3 read-only (secrets en .env)
