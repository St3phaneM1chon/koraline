# Bibliotheque Media

**Route**: `/admin/media/library`
**Fichier**: `src/app/admin/media/library/page.tsx`
**Score**: **A** (91/100)

## Description
Bibliotheque complete de tous les medias (images, videos, PDFs, documents). Offre une vue grille et liste, des filtres par type MIME et dossier, tri flexible, deep linking, et actions en masse.

## Fonctionnalites
- Double vue: grille (6 colonnes) et liste
- Filtres: recherche texte, type MIME (image, video, PDF), dossier (general, images, products, blog)
- Tri: par date, nom, taille, type -- ascendant/descendant
- Upload multi-fichiers avec validation taille (10MB max)
- Preview modal avec:
  - Images: NextImage
  - Videos: lecteur natif
  - PDFs: iframe inline
  - Autres: icone par type
  - Navigation clavier (fleches), Delete pour supprimer
  - Focus trap
  - Copier URL
- Icones detaillees par type: image, video, audio, PDF, spreadsheet, word, archive, code
- Actions en masse: supprimer, deplacer dans dossier
- Renommer (modifier alt text)
- Export CSV
- Deep linking: `/admin/media/library?id=xxx` ouvre directement la preview
- Badge "New" pour fichiers < 24h
- Breadcrumbs
- Skeleton loading
- Ribbon actions: upload, delete, rename, organize, optimize, export

## Composants
- `ConfirmDialog`, `fetchWithCSRF`, `addCSRFHeader`
- `NextImage`
- `formatFileSize` (partage)
- `getFileIcon()` -- local, icones detaillees

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/medias` | Medias pagines avec filtres |
| POST | `/api/admin/medias` | Upload |
| PATCH | `/api/admin/medias/{id}` | Modifier |
| DELETE | `/api/admin/medias/{id}` | Supprimer |

## Notes Techniques
- `use client` -- ~648 lignes
- useSearchParams pour deep linking
- IMP-026 TODO: charger dossiers dynamiquement depuis DB
- IMP-031: parametres de tri passes a l'API
