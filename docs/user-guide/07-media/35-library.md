# Mediatheque

> **Section**: Media > Gestion de Contenu > Mediatheque
> **URL**: `/admin/media/library`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La **Mediatheque** est le gestionnaire universel de TOUS vos fichiers multimedia : images, videos, PDF, documents, tableurs, archives. Contrairement a la page Images qui est specialisee, la Mediatheque couvre tous les types de fichiers.

**En tant que gestionnaire, vous pouvez :**
- Voir tous les fichiers media dans une grille ou une liste
- Basculer entre vue grille et vue liste
- Envoyer des fichiers de tous types
- Rechercher par mot-cle avec recherche instantanee
- Filtrer par type de fichier (images, videos, PDF)
- Filtrer par dossier (general, images, produits, blog)
- Trier par date, nom, taille ou type
- Selectionner et supprimer en lot
- Deplacer des fichiers entre dossiers
- Modifier le texte alternatif d'un fichier
- Copier l'URL d'un fichier
- Telecharger un fichier
- Exporter la liste en CSV
- Apercu inline des images, videos et PDF
- Navigation par lien profond (URL directe vers un fichier)

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Mediatheque** | Bibliotheque centralisant tous les fichiers multimedia du site |
| **Dossier** | Regroupement logique de fichiers (general, images, produits, blog) |
| **Type MIME** | Classification technique du type de fichier (image/jpeg, application/pdf, etc.) |
| **Vue grille** | Affichage en miniatures, ideal pour les images |
| **Vue liste** | Affichage en lignes avec details, ideal pour les documents |
| **Lien profond** | URL permettant d'acceder directement a un fichier specifique |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Mediatheque** dans le panneau lateral
3. Ou depuis le tableau de bord media, cliquez sur le raccourci **Mediatheque**
4. Lien profond : `/admin/media/library?id=xxx` ouvre directement l'apercu d'un fichier

---

## Vue d'ensemble de l'interface

### 1. Fil d'Ariane
Navigation contextuelle : Accueil > Media > Mediatheque

### 2. En-tete
- Titre **Mediatheque**
- Bouton de bascule vue **Grille/Liste**
- Bouton **Envoyer** pour ajouter des fichiers

### 3. Barre de selection
Apparait quand des fichiers sont selectionnes :
- Compteur de fichiers selectionnes
- Bouton **Supprimer** (rouge)
- Bouton **Deplacer dans un dossier**
- Lien **Tout deselectionner**

### 4. Barre de filtres

| Filtre | Options |
|--------|---------|
| **Recherche** | Champ texte avec recherche instantanee |
| **Type** | Tous, Images, Videos, PDF |
| **Dossier** | Tous, General, Images, Produits, Blog |
| **Tri** | Date, Nom, Taille, Type |
| **Ordre** | Croissant / Decroissant (bouton fleche) |

### 5. Vue Grille
Chaque fichier affiche :
- Miniature (image reelle pour les images, icone pour les autres types)
- Badge "Nouveau" pour les fichiers de moins de 24h
- Case a cocher de selection (au survol)
- Nom du fichier (tronque)
- Taille et date d'envoi
- Bouton copier l'URL (au survol)

### Icones par type de fichier

| Type | Icone | Couleur |
|------|-------|---------|
| **Image** | Photo | Vert emeraude |
| **Video** | Film | Rouge |
| **Audio** | Musique | Violet |
| **PDF** | Document | Orange |
| **Tableur** | Grille | Vert fonce |
| **Document Word** | Texte | Indigo |
| **Archive (ZIP)** | Dossier compresse | Ambre |
| **Code (JSON, HTML)** | Accolades | Cyan |

### 6. Vue Liste
Chaque fichier est une ligne avec :
- Case a cocher de selection
- Miniature (40x40 px)
- Nom du fichier
- Dossier, taille et date
- Boutons copier l'URL et telecharger

### 7. Apercu modal
Cliquez sur un fichier pour ouvrir l'apercu :
- **Images** : affichage en taille reelle avec zoom
- **Videos** : lecteur video avec controles
- **PDF** : lecteur PDF inline dans un iframe
- **Autres** : icone du type avec nom du fichier
- Informations : nom, taille, type MIME, dossier, date
- URL copiable en un clic
- Navigation par fleches gauche/droite entre fichiers
- Touche Echap pour fermer
- Touche Suppr pour supprimer le fichier affiche

### 8. Pagination
Navigation par pages avec compteur total (30 fichiers par page).

---

## Fonctionnalites detaillees

### Envoyer des fichiers
1. Cliquez sur **Envoyer**
2. Selectionnez un ou plusieurs fichiers (tous types acceptes)
3. Les fichiers sont envoyes dans le dossier actuellement filtre (ou "general" par defaut)
4. Limite de 10 Mo par fichier

### Recherche instantanee
1. Tapez dans le champ de recherche
2. La recherche se declenche automatiquement apres 300 ms
3. Les resultats se mettent a jour sans recharger la page

### Basculer entre grille et liste
1. Cliquez sur l'icone **Grille** ou **Liste** dans l'en-tete
2. L'animation de transition rend le changement fluide
3. La vue choisie persiste pendant la session

### Trier les fichiers
1. Selectionnez le critere de tri (Date, Nom, Taille, Type)
2. Cliquez sur la fleche pour inverser l'ordre (croissant/decroissant)
3. Les fichiers se rechargent automatiquement

### Telecharger un fichier
1. En vue liste, cliquez sur l'icone de telechargement a droite
2. Le fichier se telecharge avec son nom original

### Lien profond vers un fichier
- L'URL `/admin/media/library?id=xxx` ouvre automatiquement l'apercu du fichier
- Utile pour partager un lien direct avec un collegue

---

## Actions du ruban

| Action | Effet |
|--------|-------|
| **Upload** | Ouvre le selecteur de fichiers |
| **Delete** | Supprime les fichiers selectionnes |
| **Rename** | Modifie le texte alternatif du fichier selectionne |
| **Organize** | Deplace les fichiers selectionnes dans un dossier |
| **Optimize** | Affiche un conseil d'optimisation |
| **Export** | Exporte la liste en CSV |

---

## Flux de travail recommandes

### Organisation des fichiers
Utilisez les dossiers pour categoriser vos fichiers :
- **general** : fichiers divers
- **images** : photos et visuels
- **produits** : images de produits specifiques (certificates, fioles, etc.)
- **blog** : visuels pour les articles de blog

### Nettoyage mensuel
1. Filtrez par "Date" croissant pour voir les fichiers les plus anciens
2. Verifiez les images non utilisees (page Images pour le suivi d'utilisation)
3. Supprimez les fichiers obsoletes
4. Exportez la liste en CSV pour archivage

---

## Questions frequentes

**Q : Quelle est la difference entre Images et Mediatheque ?**
R : La page **Images** est specialisee pour les images avec des fonctionnalites avancees (tags IA, recadrage, suivi d'utilisation). La **Mediatheque** gere tous les types de fichiers (images, videos, PDF, documents) avec une interface polyvalente.

**Q : Puis-je envoyer des fichiers volumineux (> 10 Mo) ?**
R : Non, la limite actuelle est de 10 Mo par fichier. Pour les videos, utilisez YouTube ou Vimeo comme hebergeur et ajoutez l'URL dans la page [Videos](./27-videos.md).

**Q : Les dossiers sont-ils visibles sur le site public ?**
R : Non, les dossiers sont une organisation interne de l'administration. Les fichiers sont accessibles via leur URL directe.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **MIME** | Multipurpose Internet Mail Extensions, standard de type de fichier |
| **Inline preview** | Apercu affiche directement dans la page sans telechargement |
| **Deep link** | URL directe vers un element specifique de l'interface |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Images](./34-images.md) | Gestion specialisee des images avec IA |
| [Brand Kit](./36-brand-kit.md) | Visuels et identite de marque |
| [Tableau de Bord Media](./01-dashboard.md) | Statistiques de la mediatheque |
