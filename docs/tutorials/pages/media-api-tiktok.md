# API TikTok

**Route**: `/admin/media/api-tiktok`
**Fichier**: `src/app/admin/media/api-tiktok/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration TikTok Business API. Champs: Advertiser ID, App ID, App Secret (env), Access Token (env), lien public.

## Fonctionnalites
- Toggle activation
- Champs: Advertiser ID, App ID, App Secret (env), Access Token (env), lien public
- Sauvegarde, test de connexion
- Statut connexion (pas OAuth standard)
- Export config JSON
- Ribbon actions: configure, testConnection, syncData, viewLogs, documentation, export
- Ribbon actions ads: newAdCampaign, delete, pause, resume, modifyBudget, performanceStats

## Composants
- `IntegrationCard`, `PlatformConnectionStatus` (usesOAuth=false), `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/tiktok` | Config |
| PUT | `/api/admin/integrations/tiktok` | Sauvegarder |
| POST | `/api/admin/integrations/tiktok` | Tester |

## Notes Techniques
- `use client` -- 193 lignes
