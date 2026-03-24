# API Microsoft Teams

**Route**: `/admin/media/api-teams`
**Fichier**: `src/app/admin/media/api-teams/page.tsx`
**Score**: **B+** (87/100)

## Description
Configuration de l'integration Microsoft Teams / Graph API. Champs specifiques: Webhook URL, Tenant ID, Client ID, Client Secret, lien public Teams.

## Fonctionnalites
- Toggle activation
- Champs: Webhook URL, Tenant ID (Graph API), Client ID (Graph API), Client Secret (env), lien public
- Sauvegarde, test de connexion
- Statut OAuth
- Ribbon actions: configure, testConnection, refreshToken, viewLogs, documentation
- Documentation: Microsoft Graph API Online Meeting

## Composants
- `IntegrationCard`, `PlatformConnectionStatus`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/teams` | Charger config |
| PUT | `/api/admin/integrations/teams` | Sauvegarder |
| POST | `/api/admin/integrations/teams` | Tester |

## Notes Techniques
- `use client` -- 148 lignes
- CSRF sur mutations
