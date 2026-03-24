# API Zoom

**Route**: `/admin/media/api-zoom`
**Fichier**: `src/app/admin/media/api-zoom/page.tsx`
**Score**: **B+** (87/100)

## Description
Page de configuration de l'integration Zoom. Permet d'activer/desactiver l'integration, configurer les credentials (Account ID, Client ID, Client Secret), le lien public et le webhook. Inclut le test de connexion et le statut OAuth.

## Fonctionnalites
- Toggle activation de l'integration
- Champs: Account ID, Client ID, Client Secret (read-only, env), lien public
- Sauvegarde des parametres (PUT)
- Test de connexion (POST)
- Statut de connexion OAuth (`PlatformConnectionStatus`)
- Ribbon actions: configure, testConnection, refreshToken, viewLogs, documentation
- Lien vers la documentation Zoom API

## Composants
- `IntegrationCard` -- formulaire de configuration
- `PlatformConnectionStatus` -- statut connexion OAuth
- `useRibbonAction` -- 5 actions

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/zoom` | Charger la config |
| PUT | `/api/admin/integrations/zoom` | Sauvegarder |
| POST | `/api/admin/integrations/zoom` | Tester la connexion |

## Problemes Identifies
- `console.error` dans le catch du chargement initial (pas de toast utilisateur)
- Fix F20 applique pour le handleSave

## Notes Techniques
- `use client` -- 140 lignes
- CSRF sur PUT et POST
- Webhook URL affiche en lecture seule
