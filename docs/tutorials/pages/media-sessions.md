# Sessions Video

**Route**: `/admin/media/sessions`
**Fichier**: `src/app/admin/media/sessions/page.tsx`
**Score**: **A-** (89/100)

## Description
Gestion des sessions video programmees ou en cours. Permet de creer des sessions de visioconference avec un client, sur une plateforme connectee, avec type de contenu et planification.

## Fonctionnalites
- Tableau des sessions: date, plateforme, sujet, client, type contenu, statut, actions
- Filtres: plateforme, statut, recherche texte
- Statuts: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- Actions: rejoindre (host URL), copier lien client, voir enregistrement, annuler
- Modal de creation complete:
  - Selection plateforme (filtre par plateformes connectees)
  - Recherche client avec autocomplete (debounce 300ms)
  - Sujet, type de contenu, duree (minutes)
  - Planifier ou demarrer maintenant
  - Notes
- Focus trap dans la modal (Escape pour fermer, Tab pour naviguer)
- Pagination
- PageHeader composant partage

## Composants
- `PageHeader`, `addCSRFHeader`
- `CreateSessionModal` -- composant local

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/video-sessions` | Liste paginee |
| POST | `/api/admin/video-sessions` | Creer session |
| PUT | `/api/admin/video-sessions/{id}` | Modifier (annuler) |
| GET | `/api/admin/platform-connections` | Plateformes connectees |
| GET | `/api/admin/customers?search=...` | Recherche client |

## Notes Techniques
- `use client` -- 670 lignes
- Focus trap implementee manuellement dans la modal
- Recherche client avec debounce 300ms
