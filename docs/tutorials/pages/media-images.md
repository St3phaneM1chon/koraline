# Gestion des Images

**Route**: `/admin/media/images`
**Fichier**: `src/app/admin/media/images/page.tsx`
**Score**: **A** (92/100)

## Description
Gestionnaire d'images avance avec grille responsive, upload multi-fichiers, drag & drop bulk upload, AI tagging automatique, recadrage intelligent (smart crop), suivi d'utilisation, et actions en masse.

## Fonctionnalites
- Grille d'images responsive (6 colonnes max) avec skeleton loading
- Upload multi-fichiers avec validation taille (10MB max)
- Zone drag & drop pour envoi groupe avec barres de progression
- Preview modal avec:
  - Navigation clavier (fleches gauche/droite)
  - Tags IA auto-generes
  - Suivi d'utilisation (ou l'image est utilisee)
  - Presets de recadrage intelligent
  - Copier URL
  - Focus trap
- AI Auto-Tags: `generateTags()` depuis `ai-tagger.ts`
- Smart Crop: presets (Instagram, Facebook, Twitter, etc.)
- Suivi utilisation: quelles entites utilisent chaque image
- Actions en masse: supprimer, deplacer dans dossier
- Renommer (modifier alt text)
- Export CSV
- Breadcrumbs
- Badge "New" pour images < 24h
- Zoom au hover
- Recherche avec debounce (300ms)
- Ribbon actions: upload, delete, rename, organize, optimize, export

## Composants
- `ConfirmDialog`, `fetchWithCSRF`, `addCSRFHeader`
- `NextImage` -- optimisation images Next.js
- `generateTags`, `generateAltText` -- AI tagger
- `formatUsageSummary` -- suivi utilisation
- `CROP_PRESETS` -- presets de recadrage

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/medias?mimeType=image` | Images paginées |
| POST | `/api/admin/medias` | Upload |
| PATCH | `/api/admin/medias/{id}` | Modifier alt/folder |
| DELETE | `/api/admin/medias/{id}` | Supprimer |
| GET | `/api/admin/medias/usage?ids=...` | Suivi utilisation |

## Problemes Identifies
- Textes hardcodes en francais: "Glissez-deposez vos images", "Envoie groupe termine", etc.
- Smart crop: handler affiche un toast informatif seulement (traitement serveur requis)
- TODO: IMP-019 a IMP-028 pour crop client, AI Azure, watermark, etc.

## Notes Techniques
- `use client` -- ~812 lignes
- Features avancees: AI tagging, usage tracking, smart crop, bulk upload
