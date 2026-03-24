# Gestion des Videos

**Route**: `/admin/media/videos`
**Fichier**: `src/app/admin/media/videos/page.tsx`
**Score**: **A-** (89/100)

## Description
Page principale de gestion des videos. La plus grosse page de la section Media (~1100 lignes). Offre une liste paginee avec recherche, filtres multiples, actions en masse, lecteur video inline, et un formulaire complet de creation/edition.

## Fonctionnalites
- Liste paginee des videos avec recherche
- Filtres: categorie, statut (DRAFT/REVIEW/PUBLISHED/ARCHIVED), visibilite, type de contenu
- Actions par video: editer, voir, supprimer, toggle featured, toggle published
- Actions en masse: selection multiple, suppression groupee
- Lecteur video inline (YouTube, Vimeo, video native)
- Formulaire de creation complet (titre, URL, description, thumbnail, categorie, tags, instructeur, etc.)
- Breadcrumbs navigation
- Pagination avec prev/next
- Ribbon actions: create, delete, export, filter, play

## Composants
- `ConfirmDialog` -- confirmation suppression
- `fetchWithCSRF` -- mutations protegees
- `useRibbonAction` -- 5 actions

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/videos` | Liste paginee |
| POST | `/api/admin/videos` | Creer video |
| PATCH | `/api/admin/videos/{id}` | Modifier video |
| DELETE | `/api/admin/videos/{id}` | Supprimer |
| GET | `/api/admin/video-categories` | Categories pour filtres |

## Problemes Identifies
- Fichier tres long (1100+ lignes) -- pourrait etre split en composants
- TODO IMP-022 a IMP-037: upload fichier direct, analytics tracking, OAuth flow, post scheduling

## Notes Techniques
- `use client` -- ~1100 lignes (plus gros fichier de la section)
- Lecteur video avec detection automatique YouTube/Vimeo/native
