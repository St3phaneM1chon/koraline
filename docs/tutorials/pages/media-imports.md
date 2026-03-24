# Import d'Enregistrements

**Route**: `/admin/media/imports`
**Fichier**: `src/app/admin/media/imports/page.tsx`
**Score**: **A-** (90/100)

## Description
Gestion des imports d'enregistrements depuis les plateformes connectees. Tableau paginé avec filtres, actions individuelles (import, skip, retry), import en masse, et synchronisation.

## Fonctionnalites
- Tableau paginé des imports avec colonnes: plateforme, reunion, date, duree, statut, consentement, actions
- Filtres: plateforme (Zoom, Teams, Meet, Webex, YouTube), statut (pending, downloading, processing, completed, failed, skipped)
- Checkbox selection multiple avec import en masse
- Actions par import: import, skip (pending), retry (failed), voir video (completed)
- Bouton sync global (cherche nouveaux enregistrements)
- Badges statut colores avec icones
- Statut consentement (GRANTED/PENDING)
- Formatage duree et taille fichier
- Pagination
- Lien vers connexions si aucun import

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/recording-imports` | Liste paginee |
| POST | `/api/admin/recording-imports/sync` | Synchroniser |
| POST | `/api/admin/recording-imports/{id}/import` | Importer un enregistrement |
| PATCH | `/api/admin/recording-imports/{id}` | Skip/retry |
| POST | `/api/admin/recording-imports/bulk-import` | Import en masse |

## Notes Techniques
- `use client` -- 493 lignes
- CSRF sur toutes les mutations
