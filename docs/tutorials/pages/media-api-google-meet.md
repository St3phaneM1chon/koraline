# API Google Meet

**Route**: `/admin/media/api-google-meet`
**Fichier**: `src/app/admin/media/api-google-meet/page.tsx`
**Score**: **B+** (87/100)

## Description
Configuration de l'integration Google Meet via Google Meet API. Champs: OAuth Client ID, Client Secret (env), lien public.

## Fonctionnalites
- Toggle activation
- Champs: OAuth Client ID, OAuth Client Secret (env), lien public
- Sauvegarde, test de connexion
- Statut OAuth
- Ribbon actions: configure, testConnection, viewLogs, documentation

## Composants
- `IntegrationCard`, `PlatformConnectionStatus`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/google-meet` | Config |
| PUT | `/api/admin/integrations/google-meet` | Sauvegarder |
| POST | `/api/admin/integrations/google-meet` | Tester |

## Notes Techniques
- `use client` -- 102 lignes
