# Categories Video

> **Section**: Media > Gestion de Contenu > Categories Video
> **URL**: `/admin/media/video-categories`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~12 minutes

---

## A quoi sert cette page ?

La page **Categories Video** permet d'organiser vos videos en categories hierarchiques (categories parentes et sous-categories). Une bonne organisation facilite la navigation pour vos visiteurs et ameliore le referencement.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les categories existantes avec leur arborescence
- Creer une nouvelle categorie (racine ou sous-categorie)
- Modifier le nom, la description, l'icone et l'ordre d'affichage
- Activer ou desactiver une categorie
- Reorganiser l'ordre d'affichage par glisser-deposer
- Supprimer une categorie vide

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Categorie parente** | Categorie de premier niveau (ex: "Formations") |
| **Sous-categorie** | Categorie enfant d'une parente (ex: "Formations > Peptides BPC") |
| **Slug** | Identifiant URL de la categorie (genere automatiquement a partir du nom) |
| **Ordre d'affichage** | Numero definissant l'ordre dans lequel les categories apparaissent |
| **Icone** | Symbole visuel associe a la categorie |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Categories Video** dans le panneau lateral
3. Ou depuis le [Content Hub](./26-content-hub.md), cliquez sur **Gerer les categories**

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Categories Video** avec icone dossier
- Bouton **Nouvelle Categorie** pour en creer une

### 2. Arborescence des categories
Les categories sont affichees en arborescence :
- Les categories parentes sont au premier niveau avec une fleche depliable
- Cliquez sur la fleche pour voir les sous-categories
- Chaque ligne affiche :
  - L'icone de la categorie (si definie)
  - Le nom
  - Le nombre de videos associees
  - Le nombre de sous-categories
  - Le badge actif/inactif
  - Les boutons modifier et supprimer

### 3. Formulaire de creation/modification
Quand vous creez ou modifiez une categorie, un formulaire inline apparait :

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| **Nom** | Nom affiche de la categorie | Oui |
| **Description** | Texte descriptif | Non |
| **Icone** | Nom de l'icone (ex: "flask", "book", "video") | Non |
| **Categorie parente** | Selecteur de la categorie parente | Non (racine si vide) |
| **Ordre d'affichage** | Numero pour trier l'affichage | Non (0 par defaut) |
| **Active** | Case a cocher pour activer/desactiver | Oui |

---

## Fonctionnalites detaillees

### Creer une categorie
1. Cliquez sur **Nouvelle Categorie**
2. Remplissez le nom (obligatoire)
3. Optionnellement, selectionnez une categorie parente pour creer une sous-categorie
4. Definissez l'ordre d'affichage (les numeros plus petits apparaissent en premier)
5. Cliquez sur **Sauvegarder**

### Modifier une categorie
1. Cliquez sur l'icone crayon a cote de la categorie
2. Le formulaire se remplit avec les valeurs actuelles
3. Modifiez les champs souhaites
4. Cliquez sur **Sauvegarder**

### Supprimer une categorie
1. Cliquez sur l'icone poubelle a cote de la categorie
2. Confirmez la suppression
3. **Attention** : une categorie contenant des videos ne peut pas etre supprimee. Deplacez d'abord les videos vers une autre categorie.

---

## Flux de travail recommandes

### Organisation suggeree pour BioCycle Peptides
```
Formations
  - Peptides BPC
  - Peptides TB-500
  - Peptides GHK-Cu
  - Securite et manipulation
Temoignages
  - Clients chercheurs
  - Laboratoires partenaires
Demonstrations produit
  - Certificats d'analyse
  - Processus de commande
Webinaires
  - Archives 2025
  - Archives 2026
FAQ
```

---

## Questions frequentes

**Q : Combien de niveaux de sous-categories puis-je creer ?**
R : Le systeme supporte une hierarchie a deux niveaux (parent > enfant). Les sous-sous-categories ne sont pas supportees.

**Q : Une categorie desactivee est-elle visible sur le site ?**
R : Non, les categories inactives sont masquees cote public. Les videos qu'elles contiennent restent accessibles via d'autres chemins si elles sont publiees.

---

## Pages associees

| Page | Description |
|------|-------------|
| [Videos](./27-videos.md) | Assigner des categories aux videos |
| [Content Hub](./26-content-hub.md) | Vue d'ensemble du contenu |
