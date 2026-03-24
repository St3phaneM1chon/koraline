# Section Fidelite — Vue d'ensemble

**Pages**: 2 | **Score moyen**: 85/100 | **Date**: 2026-03-17

## Resume

La section Fidelite est la plus riche en fonctionnalites de toute l'admin. La page Programme Fidelite seule contient plus de 12 sous-sections configurables. Les webinaires completent l'offre de fidelisation.

## Scores par page

| Page | URL | Score | Grade | Problemes |
|------|-----|-------|-------|-----------|
| Programme Fidelite | `/admin/fidelite` | 80 | B | i18n partiel: "Program Statistics", "Total Earned/Redeemed/Members", reward descriptions en anglais |
| Webinaires | `/admin/webinaires` | 90 | A | "Draft" non traduit |

## Fonctionnalites Programme Fidelite

### Configuration
- Points par dollar (configurable), valeur du point, minimum echange, bonus parrainage
- Bonus speciaux: anniversaire, 1ere commande, avis produit, inscription

### 5 Niveaux
| Niveau | Seuil | Multiplicateur |
|--------|-------|----------------|
| Bronze | 0+ pts | 1x |
| Silver | 500+ pts | 1.25x |
| Gold | 2 000+ pts | 1.5x |
| Platinum | 5 000+ pts | 2x |
| Diamond | 10 000+ pts | 3x |

### Gamification
- **10 badges**: Premier achat, Client fidele, Super fidele, Grand acheteur, Evaluateur, Ambassadeur, Serie hebdo, Serie mensuelle, Pionnier, Heros anniversaire
- **3 defis actifs**: Sprint du printemps (3 commandes, +300 pts), Maitre des avis (5 reviews, +250 pts), Trouveur d'amis (2 parrainages, +400 pts)
- **Suivi des series**: Serie actuelle + record

### Regles d'attribution (9 regles)
Achat (1pt/$), Avis (50pts), Avis photo (75pts), Parrainage (1000pts), Partage social (25pts), Anniversaire (200pts), Newsletter (50pts), Profil complet (100pts), 1ere commande (100pts)

### Catalogue de recompenses (7)
$5/$10/$25/$50/$100 de reduction, Livraison gratuite (300pts), Points doubles (1000pts)

### Expiration des points
Validite 12 mois, rappels a 90/30/7 jours, periode de grace 14 jours

## Problemes i18n Fidelite
- "Program Statistics", "Total Earned", "Total Redeemed", "Total Members", "members" — anglais
- "Members par Tier" — mix francais/anglais
- "Non transactions yet" — anglais + typo ("Non" au lieu de "No")
- Descriptions recompenses en anglais: "$5 off your next order", etc.
- Avantages niveaux en anglais: "Earn 1x points", "Free shipping over $75"

## Webinaires
- Stats: A venir, Completes, Inscrits, Taux presence moyen
- Filtres: Webinaires, A venir, Completes, Draft (non traduit)
- Actions ribbon: Nouveau, Planifier, Lancer maintenant, Enregistrement, Stats participants, Export
