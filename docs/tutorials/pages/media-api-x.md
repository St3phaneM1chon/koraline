# API X (Twitter)

**Route**: `/admin/media/api-x`
**Fichier**: `src/app/admin/media/api-x/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration X/Twitter API v2. Champs: Username, API Key (Consumer Key), API Key Secret (env), Access Token (env), lien public.

## Fonctionnalites
- Toggle activation
- Champs: X Username, API Key, API Key Secret (env), Access Token (env), lien public
- Sauvegarde, test de connexion
- Export config JSON
- Ribbon actions: configure, testConnection, syncData, viewLogs, documentation, export
- Ribbon actions ads: newAdCampaign, delete, pause, resume, modifyBudget, performanceStats

## Composants
- `IntegrationCard`, `useRibbonAction`
- Pas de PlatformConnectionStatus

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/x` | Config |
| PUT | `/api/admin/integrations/x` | Sauvegarder |
| POST | `/api/admin/integrations/x` | Tester |

## Problemes Identifies
- Hints hardcodes en anglais

## Notes Techniques
- `use client` -- 191 lignes
