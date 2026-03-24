# Gestion des Categories

> **Section**: Catalogue > Categories
> **URL**: `/admin/categories`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Categories** organise vos produits en groupes logiques. Les categories apparaissent dans le menu de la boutique et permettent aux clients de trouver facilement les produits qui les interessent.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les categories avec leur nombre de produits, ordre d'affichage et statut
- Creer une nouvelle categorie (avec nom, slug, description, image)
- Creer des sous-categories (hierarchie parent-enfant)
- Modifier une categorie existante
- Supprimer une categorie (si elle n'a pas de produits)
- Reorganiser l'ordre d'affichage (monter/descendre)
- Activer/desactiver une categorie
- Exporter la liste au format CSV
- Voir les statistiques de visites par categorie

---

## Concepts cles pour les debutants

### Qu'est-ce qu'une categorie ?
Une categorie, c'est un dossier qui regroupe des produits similaires. Par exemple :
- **Peptides** — Tous les peptides synthetiques
- **Recuperation & Reparation** — Peptides pour la guerison (BPC-157, TB-500)
- **Croissance Musculaire** — Peptides anabolisants
- **Supplements** — Supplements nutritionnels
- **Accessoires** — Materiel de laboratoire

### Hierarchie parent/enfant
Les categories peuvent avoir des **sous-categories**. Par exemple :
- **Peptides** (categorie parente)
  - Recuperation & Reparation (sous-categorie)
  - Croissance Musculaire (sous-categorie)
  - Sante Cognitive (sous-categorie)

### Le slug
Le slug est la partie de l'URL qui identifie la categorie. Par exemple :
- Categorie "Recuperation & Reparation" → slug: `recovery-repair`
- URL complete: `biocyclepeptides.com/categorie/recovery-repair`

---

## Vue d'ensemble de l'interface

![Page Categories](../assets/screenshots/catalogue-categories-overview.png)

### La barre de ruban

| Bouton | Fonction |
|--------|----------|
| **Nouvelle categorie** | Creer une categorie de premier niveau |
| **Nouvelle sous-categorie** | Creer une sous-categorie de la categorie selectionnee |
| **Supprimer** | Supprimer la categorie selectionnee |
| **Stats visites** | Voir combien de fois chaque categorie est visitee |
| **Reorganiser** | Activer le mode reorganisation (deplacer les categories) |
| **Exporter** | Telecharger la liste en CSV |

### Le tableau des categories

| Colonne | Description |
|---------|-------------|
| **Categorie** | Nom + slug + image (miniature) |
| **Produits** | Nombre de produits dans cette categorie |
| **Ordre** | Position d'affichage (1 = premier) |
| **Actif** | Coche verte si la categorie est visible |
| **Actions** | + Sous, Modifier, Supprimer |

---

## Fonctions detaillees

### 1. Creer une categorie

1. Cliquez sur **Nouvelle categorie** (ruban ou bouton en haut a droite)
2. Un formulaire modal s'ouvre :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Nom** | Oui | Nom affiche sur la boutique (ex: "Sante Cognitive") |
| **Slug** | Auto-genere | URL de la categorie (se genere a partir du nom) |
| **Description** | Non | Texte affiche sur la page de la categorie |
| **Image** | Non | Image de couverture (via upload ou URL) |
| **Ordre** | Oui | Position dans le menu (defaut: apres la derniere) |
| **Categorie parente** | Non | Si rempli, devient une sous-categorie |

3. Cliquez sur **Enregistrer**

### 2. Creer une sous-categorie

1. Sur la ligne de la categorie parente, cliquez sur **+ Sous**
2. Le formulaire s'ouvre avec la categorie parente pre-selectionnee
3. Renseignez nom, description, image
4. Enregistrez

### 3. Modifier une categorie

1. Sur la ligne de la categorie, cliquez sur **Modifier** (icone crayon)
2. Le formulaire s'ouvre pre-rempli
3. Modifiez les champs souhaites
4. Enregistrez

### 4. Reorganiser l'ordre

1. Cliquez sur **Reorganiser** dans le ruban (ou le bouton en haut a droite)
2. Le mode reorganisation s'active — des fleches haut/bas apparaissent
3. Cliquez sur les fleches pour monter ou descendre une categorie
4. Le nouvel ordre est sauvegarde automatiquement

### 5. Supprimer une categorie

1. Cliquez sur l'icone **Poubelle** sur la ligne de la categorie
2. Confirmez la suppression

> **Attention** : Vous ne pouvez pas supprimer une categorie qui contient des produits. Deplacez d'abord les produits vers une autre categorie.

---

## Workflows complets

### Scenario : Ajouter une nouvelle gamme de produits

1. Allez dans **Catalogue > Categories**
2. Cliquez sur **Nouvelle categorie**
3. Nom: "Sante Hormonale", Description: "Peptides pour l'equilibre hormonal"
4. Uploadez une image representative
5. Enregistrez
6. Allez dans **Catalogue > Produits** et assignez les produits concernes a cette categorie

---

## FAQ

### Q : Combien de niveaux de sous-categories puis-je creer ?
**R** : Le systeme supporte 2 niveaux : categorie parente et sous-categorie. Pas de sous-sous-categorie.

### Q : Si je desactive une categorie, ses produits disparaissent-ils ?
**R** : Oui, la categorie et ses produits sont caches de la boutique. Mais les produits restent accessibles dans l'admin.

### Q : Les images de categories sont-elles obligatoires ?
**R** : Non, mais recommandees. Les categories sans image affichent une icone de dossier par defaut.

---

## Strategie expert : Architecture d'information optimale pour la conversion

### Principes fondamentaux

L'architecture de vos categories est l'equivalent de l'organisation des rayons dans un magasin physique. Une bonne architecture aide le client a trouver rapidement ce qu'il cherche, reduit le taux de rebond et augmente le taux de conversion.

### Regles d'or de la categorisation e-commerce

| Regle | Explication |
|-------|-------------|
| **Maximum 7 a 9 categories principales** | Au-dela de 9, le client est submerge de choix (paradoxe du choix). En dessous de 5, les categories sont trop larges et peu utiles. |
| **Noms clairs et descriptifs** | "Recuperation et Reparation" est meilleur que "Categorie 1" ou "Divers". Le client doit comprendre en une seconde ce qu'il trouvera dans la categorie. |
| **Ordre par popularite** | Les categories les plus visitees et les plus vendues doivent apparaitre en premier dans le menu. Utilisez le bouton **Stats visites** pour identifier les categories populaires. |
| **Maximum 2 niveaux** | Categories parentes et sous-categories. Ne pas creer de sous-sous-categories (Koraline ne le supporte pas, et c'est une bonne pratique). |
| **Pas de categories vides** | Une categorie avec 0 produit desoriente le client. Desactivez les categories sans produit ou ajoutez un produit "bientot disponible". |
| **Pas de doublons** | Un produit ne devrait idealement appartenir qu'a une seule categorie. Si un peptide est pertinent pour deux categories, choisir la plus specifique. |

### Taxonomie recommandee pour BioCycle Peptides

Voici une architecture de categories optimisee pour un e-commerce de peptides de recherche au Canada, classee par usage de recherche.

**Niveau 1 : Categories principales (7 categories)**

| Ordre | Categorie | Description | Produits typiques |
|-------|-----------|-------------|-------------------|
| 1 | **Recuperation et Reparation** | Peptides etudies pour la regeneration tissulaire | BPC-157, TB-500, TB4-FRAG |
| 2 | **Croissance et Performance** | Peptides de recherche sur la croissance des tissus | CJC-1295, Ipamorelin, GHRP-6, MK-677 |
| 3 | **Sante Cognitive** | Peptides etudies pour les fonctions neurologiques | Semax, Selank, Dihexa, BPC-157 |
| 4 | **Metabolisme et Composition** | Recherche sur le metabolisme et la composition corporelle | AOD-9604, Fragment 176-191, Tesamorelin |
| 5 | **Anti-Age et Longevite** | Recherche sur le vieillissement cellulaire | Epitalon, GHK-Cu, Thymosin Alpha-1 |
| 6 | **Supplements** | Supplements nutritionnels complementaires | Vitamines, mineraux, cofacteurs |
| 7 | **Accessoires** | Materiel de laboratoire et accessoires | Eau bacteriostatique, seringues, fioles vides |

**Niveau 2 : Sous-categories (exemples)**

Sous "Croissance et Performance" :
- Secretagogues de GH (CJC-1295, Ipamorelin, GHRP-2, GHRP-6)
- Modulateurs selectifs (MK-677, LGD-4033)
- Peptides de croissance (IGF-1 LR3, MGF)

### Erreurs courantes a eviter

| Erreur | Probleme | Solution |
|--------|----------|---------|
| Trop de categories principales (15+) | Navigation confuse, client perd ses reperes | Fusionner les categories similaires |
| Categories par format ("5mg", "10mg") | Melange la classification par usage et par format | Les formats sont des variantes de produit, pas des categories |
| Noms trop techniques | "Secretagogues de GH" est incomprehensible pour un debutant | Utiliser "Croissance et Performance" avec les termes techniques en sous-description |
| Categories alphabetiques | L'ordre alphabetique ne reflete pas la popularite | Ordonner par popularite (utiliser les stats) |

### Impact sur le SEO

Chaque categorie genere une page indexable par Google. Optimiser les categories pour le SEO :
- **Slug** : court et descriptif (ex: `recovery-repair`, `growth-performance`)
- **Description** : 150-300 mots uniques, incluant les mots-cles pertinents
- **Image** : image representative de haute qualite avec attribut alt descriptif

---

## Pages liees

- [Produits](01-produits.md) — Les produits organises dans ces categories
- [Bundles](03-bundles.md) — Lots de produits multi-categories
