# API Vimeo

**Route**: `/admin/media/api-vimeo`
**Fichier**: `src/app/admin/media/api-vimeo/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration Vimeo API. Champs: Client ID, Client Secret (env), User ID, lien public.

## Fonctionnalites
- Toggle activation
- Champs: Client ID, Client Secret (env), User ID, lien public
- Sauvegarde, test de connexion
- Statut OAuth
- Export config JSON
- Ribbon actions: configure, testConnection, syncData, viewLogs, documentation, export

## Composants
- `IntegrationCard`, `PlatformConnectionStatus`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/vimeo` | Config |
| PUT | `/api/admin/integrations/vimeo` | Sauvegarder |
| POST | `/api/admin/integrations/vimeo` | Tester |

## Problemes Identifies
- Hints hardcodes en anglais: "Found in Vimeo Developer Portal..."
- accessToken stocke en state mais pas affiche (commentaire dans le code)

## Notes Techniques
- `use client` -- 175 lignes
