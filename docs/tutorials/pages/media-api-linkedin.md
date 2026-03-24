# API LinkedIn

**Route**: `/admin/media/api-linkedin`
**Fichier**: `src/app/admin/media/api-linkedin/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration LinkedIn Marketing API. Champs: Company Page ID, App Client ID, Client Secret (env), Access Token (env), lien public.

## Fonctionnalites
- Toggle activation
- Champs: Company Page ID, App Client ID, Client Secret (env), Access Token (env), lien public
- Sauvegarde, test de connexion
- Export config JSON
- Ribbon actions ads: newAdCampaign, delete, pause, resume, modifyBudget, performanceStats

## Composants
- `IntegrationCard`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/linkedin` | Config |
| PUT | `/api/admin/integrations/linkedin` | Sauvegarder |
| POST | `/api/admin/integrations/linkedin` | Tester |

## Notes Techniques
- `use client` -- 191 lignes
- Documentation: Microsoft Learn LinkedIn Marketing API
