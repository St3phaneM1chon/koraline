# Connexions Plateformes

**Route**: `/admin/media/connections`
**Fichier**: `src/app/admin/media/connections/page.tsx`
**Score**: **A-** (89/100)

## Description
Page centrale de gestion des connexions OAuth aux plateformes video (Zoom, Teams, Google Meet, Webex, YouTube). Affiche des cartes par plateforme avec statut connexion, actions (connect/disconnect/test), et parametres d'import automatique.

## Fonctionnalites
- Cartes par plateforme avec logos SVG inline (Zoom, Teams, Google Meet, Webex, YouTube)
- Connexion OAuth: redirection vers l'URL d'autorisation
- Deconnexion avec confirmation
- Test de connexion
- Parametres par plateforme connectee:
  - Toggle auto-import
  - Categorie par defaut (dropdown)
  - Visibilite par defaut (PUBLIC, CUSTOMERS_ONLY, etc.)
  - Type de contenu par defaut (PODCAST, TRAINING, etc.)
- Statistiques: nombre d'imports, derniere sync, connecte par
- Gestion callback OAuth via URL params
- Bouton rafraichir global

## Composants
- Logos SVG inline: ZoomLogo, TeamsLogo, GoogleMeetLogo, WebexLogo, YouTubeLogo
- `addCSRFHeader`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/platform-connections` | Liste des plateformes |
| GET | `/api/admin/video-categories` | Categories pour dropdown |
| GET | `/api/admin/platform-connections/{platform}/oauth` | URL OAuth |
| POST | `/api/admin/platform-connections/{platform}/test` | Test connexion |
| PUT | `/api/admin/platform-connections/{platform}` | Modifier parametres |
| DELETE | `/api/admin/platform-connections/{platform}` | Deconnecter |

## Problemes Identifies
- Utilise `confirm()` natif au lieu de ConfirmDialog pour la deconnexion
- Logos SVG inline (496 lignes) -- pourraient etre dans des composants separes

## Notes Techniques
- `use client` -- 496 lignes
- useSearchParams pour gerer les callbacks OAuth
