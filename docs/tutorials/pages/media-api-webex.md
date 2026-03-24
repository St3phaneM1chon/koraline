# API Webex

**Route**: `/admin/media/api-webex`
**Fichier**: `src/app/admin/media/api-webex/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration Cisco Webex. Champs: Client ID, Client Secret (env), lien public.

## Fonctionnalites
- Toggle activation
- Champs: Client ID, Client Secret (read-only), lien public
- Sauvegarde, test de connexion
- Webhook URL en lecture seule
- Ribbon actions: configure, testConnection, viewLogs, documentation

## Composants
- `IntegrationCard`, `useRibbonAction`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/webex` | Charger config |
| PUT | `/api/admin/integrations/webex` | Sauvegarder |
| POST | `/api/admin/integrations/webex` | Tester |

## Notes Techniques
- `use client` -- 100 lignes
- Pas de PlatformConnectionStatus (utilise useRouter)
