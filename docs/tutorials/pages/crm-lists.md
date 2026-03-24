# CRM Prospect Lists

**URL**: `/admin/crm/lists`
**Fichier**: `src/app/admin/crm/lists/page.tsx`
**Score**: **A (91/100)**

## Description
Gestion des listes de prospects. Permet de creer des listes, importer des CSV, suivre la validation/deduplication/integration des prospects.

## Fonctionnalites
- **Tableau**: Nom, source (avec icone), total, valides, doublons, integres, statut, actions
- **Filtres**: Recherche, statut (DRAFT/ACTIVE/INTEGRATED/ARCHIVED), source (MANUAL/CSV_IMPORT/GOOGLE_MAPS/WEB_SCRAPER/API)
- **Creation**: Modal avec nom, description, source
- **Import CSV**: Modal avec selection de liste existante + upload fichier
- **Actions par ligne**: Voir, archiver, supprimer
- **Pagination**: 20 par page avec navigation
- **Parseur CSV integre**: Mapping automatique de 15+ noms de colonnes (name/contact/company/email/phone/website/address/city/province/country/industry/notes)

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/crm/lists` | GET | Liste paginee |
| `/api/admin/crm/lists` | POST | Creer une liste |
| `/api/admin/crm/lists/{id}` | PUT | Archiver |
| `/api/admin/crm/lists/{id}` | DELETE | Supprimer |
| `/api/admin/crm/lists/{id}/import` | POST | Import CSV dans une liste |

## Notes techniques
- 527 lignes avec parseur CSV inline
- Mapping intelligent: supporte francais (ville, pays, secteur, courriel) et anglais
- Bonne gestion des tags avec affichage limite (3 max)
