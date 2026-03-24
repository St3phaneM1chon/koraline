# Gestion des Consentements

**Route**: `/admin/media/consents`
**Fichier**: `src/app/admin/media/consents/page.tsx`
**Score**: **A-** (90/100)

## Description
Suivi centralise de tous les consentements du site. Filtre par client, date, type, statut. Inclut export CSV et renvoi de demande pour les consentements en attente.

## Fonctionnalites
- 4 cartes statistiques: total, pending, granted, revoked
- Tableau avec colonnes: client, type, sujet (video), statut, dates, demande par, actions
- Filtres: recherche texte, statut (PENDING/GRANTED/REVOKED/EXPIRED), type de consentement
- Types: VIDEO_APPEARANCE, TESTIMONIAL, PHOTO, CASE_STUDY, MARKETING, OTHER
- Actions par consentement: voir detail, telecharger PDF, renvoyer demande (PENDING)
- Export CSV avec BOM UTF-8
- Pagination
- Lien vers page detail `/admin/media/consents/{id}`

## Composants
- Composants locaux (pas de composant partage specifique)
- `fetchWithCSRF` pour le renvoi de demande

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/consents` | Liste paginee avec stats |
| PATCH | `/api/admin/consents/{id}` | Renvoyer demande |

## Notes Techniques
- `use client` -- 371 lignes
- Export CSV client-side avec BOM pour compatibilite Excel
