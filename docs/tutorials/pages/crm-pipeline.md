# CRM Pipeline (Kanban)

**URL**: `/admin/crm/pipeline`
**Fichier**: `src/app/admin/crm/pipeline/page.tsx`
**Score**: **A (90/100)**

## Description
Vue Kanban drag & drop du pipeline de vente. Permet de visualiser et deplacer les deals entre les etapes du pipeline, et de creer de nouveaux deals directement dans une etape.

## Fonctionnalites
- Vue Kanban via composant `PipelineKanban`
- Toggle vue Liste/Kanban (lien vers /admin/crm/deals pour la vue liste)
- Modal de creation de deal avec: titre, valeur, agent assigne, date de cloture prevue
- Recherche automatique du pipeline correspondant a l'etape selectionnee
- CSRF protection sur la creation de deal

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/users?role=EMPLOYEE` | GET | Liste agents pour assignation |
| `/api/admin/crm/pipelines` | GET | Trouver le pipeline de l'etape |
| `/api/admin/crm/deals` | POST | Creer un deal |

## Composants utilises
- `PipelineKanban` (composant externe)
- `addCSRFHeader()` pour la securite
- toast (sonner) pour les notifications

## Problemes identifies
- Textes hardcodes: "Title is required", "Please assign an agent", "Network error", "Deal created"
- Le refresh apres creation utilise `router.refresh()` ce qui peut ne pas recharger le composant PipelineKanban

## Notes techniques
- Layout full-height: `h-[calc(100vh-64px)]`
- Modale avec aria-modal et aria-labelledby
