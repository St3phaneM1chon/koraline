# Categories de Videos

**Route**: `/admin/media/video-categories`
**Fichier**: `src/app/admin/media/video-categories/page.tsx`
**Score**: **A** (91/100)

## Description
Gestion hierarchique des categories de videos avec arbre expansible, edition inline, drag handle visuel, toggle actif/inactif, et formulaire de creation avec selection de parent.

## Fonctionnalites
- Arbre hierarchique expansible/repliable (recursive rendering)
- Edition inline du nom et de l'ordre de tri
- Formulaire de creation: nom, parent, icone, ordre de tri, description, actif
- Toggle actif/inactif par categorie
- Compteur de videos par categorie (recursif incluant enfants)
- Drag handle visuel (GripVertical) -- pas de drag & drop reel
- Suppression avec dialogue de confirmation
- Breadcrumbs
- Icones dynamiques via `resolveIcon()`
- Auto-expansion des categories avec enfants au chargement

## Composants
- `ConfirmDialog`, `resolveIcon`, `fetchWithCSRF`
- `useRibbonAction` -- action "create"

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/video-categories` | Arbre des categories |
| POST | `/api/admin/video-categories` | Creer |
| PATCH | `/api/admin/video-categories/{id}` | Modifier |
| DELETE | `/api/admin/video-categories/{id}` | Supprimer |

## Notes Techniques
- `use client` -- 657 lignes
- `flatCategories` via useMemo pour le dropdown parent
- Keyboard: Enter pour sauvegarder, Escape pour annuler en edition inline
