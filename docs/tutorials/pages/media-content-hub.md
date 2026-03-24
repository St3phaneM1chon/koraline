# Content Hub

**Route**: `/admin/media/content-hub`
**Fichier**: `src/app/admin/media/content-hub/page.tsx`
**Score**: **A** (91/100)

## Description
Hub de contenu centralise pour la gestion editoriale des videos. Affiche 9 KPI (total, publies, brouillons, en revision, archives, vues totales, categories actives, placements actifs, consentements en attente), des graphiques de repartition par type de contenu et par source, ainsi que les videos recentes.

## Fonctionnalites
- 9 cartes KPI avec icones et couleurs distinctes
- Graphique horizontal de repartition par type de contenu (barres animees)
- Graphique horizontal de repartition par source (barres animees)
- Tableau des videos recentes (titre, statut, type, vues, date)
- Badges de statut: DRAFT, REVIEW, PUBLISHED, ARCHIVED
- Liens rapides: creer video, gerer categories, voir consentements
- Formatage nombre intelligent (k, M)

## Composants
- Composants locaux: KPI cards, bar charts CSS, table
- `STATUS_BADGES` -- mapping couleurs par statut

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/content-hub/stats` | Statistiques completes du hub |

## Problemes Identifies
- Aucun probleme majeur
- Les graphiques sont des barres CSS, pas Recharts (coherent avec le design)

## Notes Techniques
- `use client` -- 317 lignes
- Gestion erreur avec toast + loading state
