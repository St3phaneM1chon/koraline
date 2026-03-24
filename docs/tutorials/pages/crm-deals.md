# CRM Deals

**URL**: `/admin/crm/deals`
**Fichier**: `src/app/admin/crm/deals/page.tsx`
**Score**: **A (90/100)**

## Description
Liste des opportunites/deals avec statistiques, filtres par pipeline et etape, et selection multiple pour actions bulk.

## Fonctionnalites
- **Stats bar**: 4 KPI (valeur totale, valeur ponderee, win rate avec W/L, deals ouverts)
- **Tableau**: Titre, valeur avec devise + valeur ponderee, etape (badge colore), contact, agent assigne, date cloture prevue
- **Filtres**: Recherche, pipeline, etape (dynamique selon pipeline selectionne)
- **Toggle vue**: Liste (active) / Kanban (lien vers /admin/crm/pipeline)
- **Selection multiple**: Suppression bulk
- **Pagination**: 20 par page

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/crm/deals` | GET | Liste paginee |
| `/api/admin/crm/deals/stats` | GET | Statistiques |
| `/api/admin/crm/pipelines` | GET | Pipelines pour filtre |
| `/api/admin/crm/deals/{id}` | DELETE | Suppression |

## Notes techniques
- La valeur du deal peut etre string ou number (gere avec parseFloat)
- Formatage devise dynamique selon la devise du deal
- Les actions bulk font N appels paralleles (1 par deal)
