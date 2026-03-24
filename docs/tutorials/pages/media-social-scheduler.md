# Planificateur Social Media

**Route**: `/admin/media/social-scheduler`
**Fichier**: `src/app/admin/media/social-scheduler/page.tsx`
**Score**: **A-** (90/100)

## Description
Planificateur de publications sur les reseaux sociaux. Supporte 5 plateformes (Instagram, Facebook, X/Twitter, TikTok, LinkedIn) avec vue liste et calendrier, compositeur de posts, generation IA de captions, et publication immediate ou programmee.

## Fonctionnalites
- 4 cartes statistiques: programmes, brouillons, publies, echoues
- Double vue: liste et calendrier mensuel
- Filtres: plateforme, statut
- Compositeur de post:
  - Selection plateforme visuelle
  - Textarea avec compteur de caracteres (limite par plateforme)
  - URL d'image
  - Date/heure de programmation
  - Statut: brouillon ou programme
  - Generation IA de caption (predefinies)
- Actions par post: publier maintenant, supprimer
- Vue calendrier: grille 7 colonnes, posts par jour avec couleur plateforme
- Bridge #41: Media -> Marketing (composant MediaMarketingBridgeCard)
- Pagination (vue liste)

## Composants
- `MediaMarketingBridgeCard` (bridge)
- `fetchWithCSRF`
- Icones: Instagram, Facebook, Twitter (Lucide)

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/social-posts` | Posts pagines |
| POST | `/api/admin/social-posts` | Creer post |
| DELETE | `/api/admin/social-posts/{id}` | Supprimer |
| POST | `/api/admin/social-posts/{id}/publish` | Publier maintenant |

## Problemes Identifies
- Les stats chargent via 4 requetes separees (1 par statut) -- inefficace
- Formatage date hardcode en fr-CA

## Notes Techniques
- `use client` -- 583 lignes
- Limites caracteres: Instagram (2200), Facebook (63206), X (280), TikTok (2200), LinkedIn (3000)
