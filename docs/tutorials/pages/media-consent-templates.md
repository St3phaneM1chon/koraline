# Modeles de Consentement

**Route**: `/admin/media/consent-templates`
**Fichier**: `src/app/admin/media/consent-templates/page.tsx`
**Score**: **A-** (89/100)

## Description
Constructeur de modeles de formulaires de consentement. Permet de creer des templates avec questions personnalisees (checkbox, texte, signature), texte legal, et gestion active/inactive.

## Fonctionnalites
- Liste des templates avec: nom, type, statut actif/inactif, version, nombre questions, nombre consentements
- Formulaire de creation/edition:
  - Nom, type (VIDEO_APPEARANCE, TESTIMONIAL, etc.)
  - Description
  - Constructeur de questions (ajout/suppression/reordonnement)
  - Types de question: checkbox, text, signature
  - Option "requis" par question
  - Texte legal (textarea monospace)
  - Toggle actif
- Edition inline depuis la liste
- Suppression avec dialogue de confirmation (bloquee si consentements existants)
- GripVertical pour indication de drag (visuel seulement)

## Composants
- `ConfirmDialog`, `fetchWithCSRF`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/consent-templates` | Liste |
| POST | `/api/admin/consent-templates` | Creer |
| PATCH | `/api/admin/consent-templates/{id}` | Modifier |
| DELETE | `/api/admin/consent-templates/{id}` | Supprimer |

## Problemes Identifies
- Certains toasts en anglais hardcode ("Template updated", "Name is required")

## Notes Techniques
- `use client` -- 400 lignes
- Questions stockees en JSON (type Question[])
