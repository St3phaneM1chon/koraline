# API Meta (Facebook/Instagram)

**Route**: `/admin/media/api-meta`
**Fichier**: `src/app/admin/media/api-meta/page.tsx`
**Score**: **B+** (87/100)

## Description
Configuration de l'integration Meta Marketing APIs (Facebook + Instagram). Page la plus riche en champs de configuration avec: App ID, Pixel ID, Page ID, IG Account ID, Access Token, App Secret.

## Fonctionnalites
- Toggle activation
- Champs: App ID, Meta Pixel ID, Facebook Page ID, Instagram Business Account ID, Access Token (env), App Secret (env), lien public
- Sauvegarde, test de connexion
- Statut connexion (usesOAuth=false)
- Export config JSON
- Ribbon actions ads: newAdCampaign, delete, pause, resume, modifyBudget, performanceStats

## Composants
- `IntegrationCard`, `PlatformConnectionStatus`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/meta` | Config |
| PUT | `/api/admin/integrations/meta` | Sauvegarder |
| POST | `/api/admin/integrations/meta` | Tester |

## Notes Techniques
- `use client` -- 215 lignes
- 7 champs de configuration (le maximum de toutes les pages API)
