# CRM Pipelines (Configuration)

**URL**: `/admin/crm/pipelines`
**Fichier**: `src/app/admin/crm/pipelines/page.tsx`
**Score**: **B (80/100)**

## Description
Page de configuration des pipelines de vente. Affiche la liste des pipelines avec leurs etapes, probabilites et nombre de deals.

## Fonctionnalites
- Liste des pipelines avec indicateur "Par defaut"
- Affichage horizontal des etapes avec couleur, probabilite et nombre de deals
- Bouton de creation (stub - affiche un toast "Creation de pipeline a venir")
- Bouton settings par pipeline (non connecte)
- Compteur de deals et etapes par pipeline

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/crm/pipelines` | GET | Liste des pipelines avec etapes |

## Problemes identifies
- **i18n**: Plusieurs textes hardcodes en francais: "Nouveau pipeline", "Aucun pipeline configure", "Les pipelines permettent de suivre...", "Par defaut", "deal(s)", "etape(s)"
- **Fonctionnalite incomplete**: Le bouton "Nouveau pipeline" affiche seulement un toast
- **Settings non connecte**: Le bouton Settings ne fait rien
- Pas de CRUD complet (pas de modification/suppression)

## Notes techniques
- Utilise `PageHeader` composant partage
- Spinner de chargement centre
- Etapes triees par `sortOrder`
