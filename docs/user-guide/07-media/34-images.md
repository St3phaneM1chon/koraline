# Bibliotheque d'Images

> **Section**: Media > Gestion de Contenu > Images
> **URL**: `/admin/media/images`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Images** est le gestionnaire dedie a toutes vos images : photos de produits, visuels marketing, bannieres, logos. Elle offre des fonctionnalites avancees d'envoi, de recherche, de balisage IA et de recadrage intelligent.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les images dans une grille visuelle avec miniatures
- Envoyer des images (individuellement ou en lot par glisser-deposer)
- Rechercher des images par mot-cle (nom de fichier, texte alternatif)
- Selectionner et supprimer des images en lot
- Copier l'URL d'une image pour l'utiliser dans le site
- Voir l'apercu d'une image en taille reelle dans un modal
- Modifier le texte alternatif (alt) d'une image
- Deplacer des images entre dossiers
- Exporter la liste en CSV
- Voir les tags generes automatiquement par l'IA
- Voir ou chaque image est utilisee (suivi d'utilisation)
- Utiliser le recadrage intelligent avec des presets (produit, banniere, vignette, etc.)

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Texte alternatif (alt)** | Description textuelle de l'image pour l'accessibilite et le referencement |
| **Miniature (Thumbnail)** | Version reduite de l'image pour l'affichage en grille |
| **Glisser-deposer (Drag & Drop)** | Action de faire glisser des fichiers depuis votre bureau vers la page |
| **Tags IA** | Mots-cles generes automatiquement par l'intelligence artificielle |
| **Suivi d'utilisation** | Indication des endroits du site ou l'image est utilisee (produit, article, etc.) |
| **Recadrage intelligent** | Fonctionnalite de recadrage selon des formats pre-definis |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Images** dans le panneau lateral
3. Ou depuis le tableau de bord media, cliquez sur le raccourci **Images**

---

## Vue d'ensemble de l'interface

### 1. Fil d'Ariane (Breadcrumb)
Navigation contextuelle : Accueil > Media > Images

### 2. En-tete
- Titre **Images**
- Bouton **Envoyer** pour ajouter des images

### 3. Barre de selection
Quand des images sont selectionnees :
- Compteur d'images selectionnees
- Bouton **Supprimer** (rouge)
- Bouton **Deplacer dans un dossier**
- Lien **Tout deselectionner**

### 4. Barre de recherche
Champ de recherche avec icone loupe. La recherche se declenche automatiquement apres 300 ms.

### 5. Zone de glisser-deposer
Zone en pointilles ou vous pouvez :
- Faire glisser des images depuis votre bureau
- Cliquer pour ouvrir le selecteur de fichiers
- Formats acceptes : JPG, PNG, WebP, GIF
- Envoi en lot avec barres de progression individuelles

### 6. Grille d'images
Chaque image affiche :
- Miniature avec leger zoom au survol
- Case a cocher de selection (apparait au survol)
- Badge "Nouveau" pour les images de moins de 24 heures
- Nom du fichier (tronque)
- Taille du fichier et date d'envoi
- Tags IA auto-generes (badges violets, max 3 visibles + compteur)
- Indicateur d'utilisation (lien vert si utilisee, "Non utilisee" en gris)
- Boutons au survol : recadrage et copier l'URL

### 7. Pagination
Navigation par pages en bas de la grille (24 images par page).

---

## Fonctionnalites detaillees

### Envoyer des images (methode simple)
1. Cliquez sur le bouton **Envoyer** en haut a droite
2. Selectionnez un ou plusieurs fichiers image
3. Les fichiers sont envoyes dans le dossier "images"
4. Un message confirme le succes
5. La limite est de 10 Mo par fichier

### Envoyer des images (glisser-deposer en lot)
1. Faites glisser des images depuis votre bureau vers la zone en pointilles
2. La zone devient bleue pour indiquer qu'elle est prete a recevoir
3. Relacher les fichiers
4. La barre de progression apparait pour chaque fichier
5. Chaque fichier montre son statut : En attente, En cours, Termine, Erreur
6. Cliquez sur **Demarrer l'envoi** si le transfert ne demarre pas automatiquement
7. Un texte alternatif est genere automatiquement a partir du nom de fichier

### Apercu d'une image
1. Cliquez sur la miniature d'une image
2. Un modal s'ouvre avec l'image en taille reelle
3. Informations affichees : nom, taille, type MIME, date
4. URL copiable en un clic
5. Tags IA auto-generes
6. Suivi d'utilisation (ou l'image est utilisee dans le site)
7. Presets de recadrage intelligent
8. Navigation : utilisez les fleches gauche/droite pour passer d'une image a l'autre
9. Fermez avec Echap ou le bouton X

### Copier l'URL
1. Au survol d'une image, cliquez sur l'icone copier (en haut a droite)
2. L'URL complete est copiee dans votre presse-papiers
3. Collez-la dans un article, une fiche produit ou un email

### Selectionner et supprimer en lot
1. Cochez les images a supprimer (cases a cocher au survol)
2. Ou utilisez "Tout selectionner" en haut de la grille
3. Cliquez sur **Supprimer** dans la barre de selection
4. Confirmez dans la boite de dialogue
5. **Attention** : la suppression est irreversible

### Modifier le texte alternatif
1. Selectionnez une seule image (cochez-la)
2. Utilisez l'action **Renommer** dans le ruban
3. Une boite de dialogue apparait avec le texte actuel
4. Modifiez et validez

### Deplacer dans un dossier
1. Selectionnez les images a deplacer
2. Cliquez sur **Deplacer dans un dossier** dans la barre de selection
3. Tapez le nom du dossier de destination
4. Les images sont deplacees

### Recadrage intelligent
1. Au survol d'une image, cliquez sur l'icone recadrage (ciseaux)
2. Un menu de presets apparait :
   - Produit (1:1) -- 800x800
   - Banniere (16:9) -- 1920x1080
   - Vignette (4:3) -- 640x480
   - Portrait (3:4) -- 768x1024
   - Story (9:16) -- 1080x1920
   - Carre social (1:1) -- 1080x1080
3. Cliquez sur le preset souhaite
4. Le recadrage est applique cote serveur

### Exporter en CSV
1. Utilisez l'action **Exporter** dans le ruban
2. Un fichier CSV est telecharge avec toutes les informations de chaque image

---

## Actions du ruban

| Action | Effet |
|--------|-------|
| **Upload** | Ouvre le selecteur de fichiers |
| **Delete** | Supprime les images selectionnees |
| **Rename** | Modifie le texte alternatif de l'image selectionnee |
| **Organize** | Deplace les images selectionnees dans un dossier |
| **Optimize** | Affiche un conseil d'optimisation |
| **Export** | Exporte la liste en CSV |

---

## Flux de travail recommandes

### Ajouter des photos de produits
1. Preparez vos photos au format carre (1:1) ou horizontal (4:3)
2. Nommez chaque fichier de maniere descriptive (ex: "bpc-157-5mg-fiole.jpg")
3. Glissez-deposez les fichiers dans la zone d'envoi
4. Lancez l'envoi en lot
5. Verifiez les tags IA generes automatiquement
6. Copiez l'URL de chaque image pour l'utiliser dans les fiches produits

---

## Questions frequentes

**Q : Quelle taille maximale par fichier ?**
R : La limite est de 10 Mo par fichier. Pour les images de produits, 1-3 Mo en JPG haute qualite est generalement suffisant.

**Q : Les tags IA sont-ils modifiables ?**
R : Les tags sont generes automatiquement a partir du nom de fichier et du texte alternatif. Modifiez le texte alternatif pour ameliorer les tags.

**Q : Comment savoir si une image est utilisee avant de la supprimer ?**
R : L'indicateur d'utilisation (lien vert ou "Non utilisee") est affiche sous chaque image. Dans l'apercu, le detail complet montre ou l'image est utilisee (produit, article, categorie, etc.).

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **WebP** | Format d'image moderne offrant une bonne compression |
| **MIME Type** | Type de fichier technique (ex: image/jpeg, image/png) |
| **Alt text** | Texte alternatif decrivant l'image pour les lecteurs d'ecran |
| **Crop** | Recadrage d'une image selon un ratio specifique |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Mediatheque](./35-library.md) | Tous les types de fichiers (images, videos, PDF) |
| [Brand Kit](./36-brand-kit.md) | Couleurs et typographies de marque |
| [Tableau de Bord Media](./01-dashboard.md) | Statistiques de la mediatheque |
