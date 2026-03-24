# API WhatsApp Business

**Route**: `/admin/media/api-whatsapp`
**Fichier**: `src/app/admin/media/api-whatsapp/page.tsx`
**Score**: **B+** (86/100)

## Description
Configuration de l'integration WhatsApp Cloud API. Champs specifiques: Phone Number ID, Business Account ID, Access Token, lien public.

## Fonctionnalites
- Toggle activation
- Champs: Phone Number ID, Business Account ID, Access Token (env), lien public
- Sauvegarde, test de connexion
- Webhook URL en lecture seule
- Ribbon actions: configure, testConnection, refreshToken, viewLogs, documentation

## Composants
- `IntegrationCard`, `useRibbonAction`
- Pas de `PlatformConnectionStatus` (pas d'OAuth standard)

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/whatsapp` | Charger config |
| PUT | `/api/admin/integrations/whatsapp` | Sauvegarder |
| POST | `/api/admin/integrations/whatsapp` | Tester |

## Notes Techniques
- `use client` -- 138 lignes
- Documentation: Facebook WhatsApp Cloud API
