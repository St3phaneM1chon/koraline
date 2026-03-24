# Gestion des Videos

> **Section**: Media > Gestion de Contenu > Videos
> **URL**: `/admin/media/videos`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Videos** est le gestionnaire central de toutes vos videos. Elle permet d'ajouter, modifier, publier, archiver et supprimer des videos. Chaque video peut etre categorisee, taguee, et associee a un client ou un produit.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les videos avec leurs miniatures, titres, statuts et vues
- Rechercher des videos par mot-cle
- Filtrer par categorie, statut, type de contenu, visibilite et source
- Ajouter une nouvelle video (par URL YouTube, Vimeo ou envoi direct)
- Modifier les details d'une video (titre, description, tags, categorie, statut)
- Mettre une video en vedette sur le site
- Publier ou depublier une video
- Archiver les videos obsoletes
- Supprimer les videos inutiles
- Lire une video directement dans l'interface (lecteur integre)
- Naviguer avec pagination

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Video** | Contenu multimedia associe a une URL (YouTube, Vimeo ou fichier direct) |
| **Miniature (Thumbnail)** | Image d'apercu de la video |
| **Slug** | Identifiant URL-friendly de la video (ex: "formation-peptides-bpc") |
| **Tags** | Mots-cles associes a la video pour le classement et la recherche |
| **En vedette (Featured)** | Video mise en avant sur le site (etoile jaune) |
| **Visibilite** | Qui peut voir la video : public, clients, employes, prive |
| **Type de contenu** | Classification fonctionnelle (podcast, formation, demo, etc.) |
| **Source** | Provenance (YouTube, Vimeo, URL directe, enregistrement) |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Videos** dans le panneau lateral
3. Ou naviguez vers `/admin/media/videos`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Le titre **Videos** avec le compteur total
- Un bouton **Nouvelle Video** pour en ajouter une

### 2. Barre de recherche et filtres
- Champ de recherche par mot-cle (titre, description, tags)
- Filtres deroulants :
  - **Categorie** : toutes, ou une categorie specifique
  - **Statut** : brouillon, en revision, publie, archive
  - **Type** : podcast, formation, demo, temoignage, etc.
  - **Visibilite** : public, clients uniquement, employes uniquement, prive
  - **Source** : YouTube, Vimeo, enregistrement, envoi

### 3. Grille de videos
Chaque video est representee par une carte avec :
- Miniature de la video (avec badge de statut)
- Titre (tronque si trop long)
- Categorie et tags
- Nombre de vues
- Date de creation
- Icone etoile si en vedette
- Boutons d'action au survol (modifier, lire, supprimer)

### 4. Pagination
Navigation par pages en bas de la grille.

---

## Fonctionnalites detaillees

### Ajouter une nouvelle video
1. Cliquez sur **Nouvelle Video** en haut a droite
2. Un formulaire s'ouvre avec les champs suivants :

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| **Titre** | Nom de la video | Oui |
| **URL de la video** | Lien YouTube, Vimeo ou URL directe | Oui |
| **Description** | Texte descriptif de la video | Non |
| **Miniature** | URL d'image d'apercu | Non (auto-generee pour YouTube) |
| **Categorie** | Categorie de classement | Non |
| **Tags** | Mots-cles separes par des virgules | Non |
| **Type de contenu** | Podcast, formation, demo, etc. | Oui |
| **Visibilite** | Public, clients, employes, prive | Oui |
| **Instructeur** | Nom du presentateur/formateur | Non |
| **Statut** | Brouillon, en revision, publie | Oui |

3. Cliquez sur **Sauvegarder**

### Modifier une video
1. Cliquez sur la carte d'une video dans la grille
2. Ou cliquez sur l'icone crayon au survol
3. La page de detail s'ouvre avec tous les champs editables
4. Modifiez les champs souhaites
5. Cliquez sur **Sauvegarder**

### Lire une video dans l'interface
1. Cliquez sur l'icone **Lire** (triangle) au survol d'une carte
2. Un lecteur video s'ouvre en modal (overlay)
3. Le lecteur supporte YouTube, Vimeo et les fichiers video natifs
4. Fermez le lecteur en cliquant sur le X ou en appuyant sur Echap

### Mettre une video en vedette
1. Cliquez sur l'icone etoile sur la carte de la video
2. L'etoile devient jaune pour indiquer que la video est en vedette
3. La video apparaitra dans les sections "en vedette" du site

### Supprimer une video
1. Selectionnez la video (coche)
2. Cliquez sur l'icone poubelle ou utilisez le ruban **Supprimer**
3. Confirmez la suppression dans la boite de dialogue

### Changer le statut
- **Publier** : passe la video en statut "publie" et la rend visible
- **Depublier** : remet la video en brouillon
- **Archiver** : retire la video sans la supprimer

---

## Actions du ruban

| Action | Effet |
|--------|-------|
| **Upload** | Ouvre le selecteur de fichiers pour envoyer une video |
| **Delete** | Supprime les videos selectionnees |
| **Play** | Lit la video selectionnee |
| **Export** | Exporte la liste des videos en CSV |

---

## Flux de travail recommandes

### Ajouter une video YouTube
1. Cliquez sur **Nouvelle Video**
2. Collez l'URL YouTube (ex: `https://youtube.com/watch?v=xxx`)
3. Le titre et la miniature sont recuperes automatiquement
4. Ajoutez une categorie et des tags
5. Definissez la visibilite (public pour le site, prive pour l'interne)
6. Sauvegardez en statut **Brouillon**
7. Revisez le contenu puis passez en **Publie**

### Importer un enregistrement de reunion
1. L'enregistrement est automatiquement detecte dans [Importations](./30-imports.md)
2. Importez-le dans la bibliotheque video
3. Editez le titre, la description et les tags
4. Verifiez le [consentement](./32-consents.md) des participants
5. Publiez la video

---

## Questions frequentes

**Q : Quels formats video sont supportes ?**
R : YouTube (URL), Vimeo (URL), et fichiers directs (MP4, WebM). L'envoi direct de fichiers volumineux n'est pas encore supporte -- utilisez YouTube ou Vimeo comme hebergeur.

**Q : La miniature ne se charge pas**
R : Verifiez que l'URL de la miniature est accessible. Pour YouTube, la miniature est generee automatiquement a partir de l'URL de la video.

**Q : Comment organiser mes videos en categories ?**
R : Creez des categories dans [Categories Video](./28-video-categories.md), puis assignez-les lors de la creation ou modification de chaque video.

**Q : Les videos privees sont visibles par qui ?**
R : Une video "prive" n'est visible que par les administrateurs dans le back-office. Les autres niveaux de visibilite controle l'acces cote site public.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Embed** | Integration d'une video hebergee ailleurs dans votre page |
| **Transcoding** | Conversion d'un format video en un autre |
| **Featured** | Mis en vedette, affiche en priorite |
| **Pagination** | Division du contenu en pages pour eviter les listes trop longues |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Content Hub](./26-content-hub.md) | Vue d'ensemble du contenu |
| [Categories Video](./28-video-categories.md) | Organiser les categories |
| [Importations](./30-imports.md) | Importer des enregistrements |
| [Consentements](./32-consents.md) | Gerer les autorisations |
| [Sessions Video](./31-sessions.md) | Planifier des sessions d'enregistrement |
