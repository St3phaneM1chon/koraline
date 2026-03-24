# Media Dashboard

**Route**: `/admin/media`
**Fichier**: `src/app/admin/media/page.tsx`
**Score**: **A** (93/100)

## Description
Tableau de bord central de la section Media. Affiche les statistiques globales (medias, videos, images, integrations connectees), les plateformes de communication (lancement rapide), les integrations API/Ads, et les liens rapides vers la gestion du contenu.

## Fonctionnalites
- Statistiques en temps reel: total medias, videos, images, integrations connectees
- Upload de fichiers directement depuis le dashboard (multi-fichiers)
- Grille de lancement rapide des plateformes de communication (Teams, Zoom, Webex, Google Meet, WhatsApp)
- Grille des integrations API et Ads avec statut connexion (connecte/non configure/erreur)
- Liens rapides vers Videos, Images, Bibliotheque
- Ribbon actions: upload, delete, play, export

## Composants
- `StatCard` (local) -- carte KPI
- `QuickLink` (local) -- lien rapide avec icone
- `TeamsIcon`, `ZoomIcon`, `WebexIcon`, `GoogleMeetIcon`, `WhatsAppIcon` -- icones plateformes
- `useRibbonAction` -- hook pour actions ruban

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/integrations/{platform}` | Statut de chaque plateforme (x10) |
| GET | `/api/admin/medias?stats=true` | Statistiques medias agrégées |
| GET | `/api/admin/videos?limit=1` | Compte total videos |
| POST | `/api/admin/medias` | Upload fichiers |

## Problemes Identifies
- Variable shadow: import `platforms` (config) + useState `platforms` -- risque de confusion
- 2 requetes separees pour stats (medias + videos) au lieu d'un endpoint unique
- Commentaires F52, F60, F84, F85 indiquent des fixes appliques et TODO restants

## Notes Techniques
- `use client` -- composant client
- Chargement parallele de toutes les integrations via `Promise.all`
- Protection CSRF sur upload via `addCSRFHeader()`
- 270 lignes de code
