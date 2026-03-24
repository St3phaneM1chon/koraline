# Brand Kit

**Route**: `/admin/media/brand-kit`
**Fichier**: `src/app/admin/media/brand-kit/page.tsx`
**Score**: **B+** (86/100)

## Description
Page de gestion de l'identite visuelle de la marque BioCycle Peptides. Affiche la palette de couleurs, la typographie, et les guidelines du logo. Mode edition pour modifier les couleurs et les guidelines via API.

## Fonctionnalites
- Palette de 10 couleurs avec copier en clic (primary, secondary, accent, background, text, muted, error, warning, success)
- 3 styles typographiques: headings, body, captions avec apercu en temps reel
- Guidelines logo: apercu fond clair et fond sombre
- Mode edition:
  - Nom de la marque
  - Couleur primaire (color picker + input hex)
  - Couleur accent (color picker + input hex)
  - Guidelines texte
  - Sauvegarde via API
- Chargement depuis API `/api/admin/brand-kit`

## Composants
- Composants locaux (pas de partage)
- `fetchWithCSRF`

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/brand-kit` | Charger le brand kit |
| PUT | `/api/admin/brand-kit` | Sauvegarder |

## Problemes Identifies
- Certaines couleurs sont hardcodees (primaryDark, background, text, muted, etc.) au lieu de venir de l'API
- Le fetch initial ne gere pas les erreurs (catch vide)

## Notes Techniques
- `use client` -- 265 lignes
- Chantier 4.3: edition connectee API
