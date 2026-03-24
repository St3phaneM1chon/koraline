# Gestion des Bannieres

> **Section**: Marketing > Bannieres
> **URL**: `/admin/bannieres`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Bannieres** permet de gerer le **carrousel hero** affiche sur la page d'accueil de votre boutique. Ce sont les grandes images (ou videos) qui occupent toute la largeur en haut du site et qui servent a mettre en avant vos promotions, nouveaux produits ou messages importants.

**En tant que gestionnaire, vous pouvez :**
- Creer de nouvelles bannieres (images, videos ou animations)
- Definir le titre, sous-titre, badge et boutons d'action (CTA) pour chaque banniere
- Uploader des images desktop et mobile distinctes
- Configurer l'opacite du voile sombre superpose a l'image
- Personnaliser les boutons d'appel a l'action (texte, URL, style)
- Reordonner les bannieres par glisser-monter/descendre
- Planifier l'affichage avec des dates de debut et de fin
- Activer ou desactiver chaque banniere individuellement
- Dupliquer une banniere existante
- Gerer les traductions dans toutes les langues supportees (22 langues)
- Afficher des statistiques (chiffres cles) directement sur la banniere
- Previsualiser le resultat sur le site en un clic

---

## Concepts pour les debutants

### Qu'est-ce qu'un carrousel hero ?

Le carrousel hero est la section la plus visible de votre page d'accueil. Il affiche une succession de bannieres (slides) en grand format. Chaque banniere contient generalement une image de fond, un titre accrocheur, un sous-titre, et un ou deux boutons qui dirigent vers une page specifique (par exemple "Voir les promotions").

### Structure d'une banniere

| Element | Description |
|---------|-------------|
| **Slug** | Identifiant unique de la banniere (utilise en interne, ex: "soldes-ete-2026") |
| **Image de fond** | L'image principale affichee (format desktop) |
| **Image mobile** | Version optimisee pour les ecrans de telephone (optionnel) |
| **Voile (overlay)** | Un filtre sombre semi-transparent par-dessus l'image pour que le texte soit lisible |
| **Badge** | Un petit texte en surbrillance (ex: "Nouveau", "Promotion") |
| **Titre** | Le texte principal de la banniere (limite recommandee : 60 caracteres) |
| **Sous-titre** | Un texte complementaire (limite recommandee : 120 caracteres) |
| **CTA primaire** | Le bouton principal (texte, URL, style) |
| **CTA secondaire** | Un second bouton optionnel |
| **Statistiques** | Des chiffres cles affiches sur la banniere (ex: "99%+ Purete", "500+ Produits") |

### Ordre d'affichage

Les bannieres s'affichent dans l'ordre defini par le champ "Ordre de tri". Vous pouvez reorganiser les bannieres en utilisant les fleches haut/bas.

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche**, cliquez sur **Bannieres**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Cliquez sur l'icone de la section **Marketing** dans le rail
2. Cliquez sur **Bannieres**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche (ou tapez `/`)
2. Tapez "bannieres" ou "hero"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

Contrairement aux autres pages marketing qui utilisent le layout master/detail, la page Bannieres utilise un layout en **liste verticale** avec des cartes pour chaque banniere.

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Fonction |
|--------|----------|
| **Nouvelle banniere** | Ouvrir le formulaire de creation |
| **Supprimer** | Indication pour utiliser le bouton de suppression de chaque banniere |
| **Upload image** | Ouvrir le formulaire de creation avec l'onglet Media actif |
| **Activer** | Activer la premiere banniere inactive |
| **Desactiver** | Desactiver la derniere banniere active |
| **Reorganiser** | Indication pour utiliser les fleches de reordonnancement |
| **Previsualiser** | Ouvrir la page d'accueil du site dans un nouvel onglet |

### 2. Les cartes de statistiques

3 cartes en haut :

| Carte | Description |
|-------|-------------|
| **Total** | Nombre total de bannieres |
| **Actives** | Nombre de bannieres actuellement visibles sur le site |
| **Traductions** | Nombre total de traductions sur l'ensemble des bannieres |

### 3. La liste des bannieres

Chaque banniere est affichee sous forme d'une ligne horizontale contenant :
- **Fleches de reordonnancement** (haut/bas) a gauche
- **Miniature** de l'image de fond (128x80 pixels) avec l'indication du type de media
- **Informations** : titre, slug, nombre de traductions, URL du CTA, ordre de tri, et indicateurs de planification (planifiee, expiree)
- **Actions** a droite : interrupteur actif/inactif, boutons Modifier, Dupliquer, Supprimer

### 4. Le formulaire de creation/edition (fenetre modale)

Le formulaire est organise en onglets :
- **General** : Slug, ordre de tri, titre, sous-titre, badge, activation
- **Media** : Type de media, image desktop, image mobile, opacite du voile, gradient
- **CTA** : Bouton principal (texte, URL, style), bouton secondaire (texte, URL, style), statistiques JSON
- **Planification** : Date de debut, date de fin
- **Langues** : Un onglet par langue supportee pour les traductions (badge, titre, sous-titre, texte des CTA, statistiques)

---

## Fonctionnalites detaillees

### 1. Creer une nouvelle banniere

1. Cliquez sur **Nouvelle banniere** en haut a droite ou dans le ruban
2. **Onglet General** :
   - Slug (obligatoire) : identifiant unique, format URL (ex: "promo-printemps-2026")
   - Titre (obligatoire) : texte principal. Un compteur indique le nombre de caracteres (recommande : moins de 60)
   - Sous-titre : texte secondaire. Compteur de caracteres (recommande : moins de 120)
   - Badge : texte court mis en evidence (ex: "Nouveau")
   - Ordre de tri : position dans le carrousel
   - Case a cocher Active
3. **Onglet Media** :
   - Type de media : Image, Video ou Animation
   - Image de fond (obligatoire) : uploadez votre image via le composant MediaUploader
   - Image mobile : version optimisee pour mobile (optionnel)
   - Opacite du voile : curseur de 0% (transparent) a 100% (opaque). Valeur par defaut : 70%
   - Gradient : classe CSS personnalisee pour le degrade (optionnel)
4. **Onglet CTA** :
   - CTA primaire : texte du bouton, URL de destination, style (Primary, Secondary, Outline)
   - CTA secondaire : memes champs (optionnel)
   - Statistiques JSON : un tableau JSON pour afficher des chiffres sur la banniere
5. **Onglet Planification** :
   - Date de debut : la banniere devient visible a cette date
   - Date de fin : la banniere disparait a cette date
6. Cliquez sur **Creer**

**Validations** :
- Le slug ne peut pas etre vide et doit etre unique (verification en temps reel)
- Le titre ne peut pas etre vide
- L'image de fond ne peut pas etre vide
- Les statistiques JSON doivent etre du JSON valide

### 2. Gerer les traductions

1. Ouvrez le formulaire d'edition d'une banniere
2. Apres les 4 onglets principaux, vous voyez un separateur puis un onglet par langue (EN, FR, ES, DE, etc.)
3. Cliquez sur l'onglet de la langue souhaitee
4. Remplissez : Badge, Titre, Sous-titre, texte du CTA primaire, texte du CTA secondaire, Statistiques JSON
5. Les onglets avec du contenu existant sont affiches en vert

Les traductions sont optionnelles. Si une langue n'a pas de traduction, le texte par defaut (onglet General) est utilise.

### 3. Reordonner les bannieres

1. Pour monter une banniere : cliquez sur la fleche vers le haut a gauche de la banniere
2. Pour descendre une banniere : cliquez sur la fleche vers le bas
3. Les modifications sont sauvegardees automatiquement

### 4. Dupliquer une banniere

1. Cliquez sur le bouton **Dupliquer** (icone de copie) a droite de la banniere
2. Le formulaire de creation s'ouvre avec tous les champs pre-remplis
3. Le slug est suffixe par "-copy" et le titre par "(copy)"
4. La copie est desactivee par defaut
5. Modifiez les champs necessaires et sauvegardez

### 5. Planifier une banniere

1. Ouvrez le formulaire d'edition
2. Allez a l'onglet **Planification**
3. Definissez la date de debut (la banniere apparaitra a cette date)
4. Definissez la date de fin (la banniere disparaitra a cette date)
5. Sauvegardez

Les bannieres planifiees affichent un indicateur orange avec la date de publication prevue. Les bannieres expirees affichent un indicateur rouge.

### 6. Previsualiser le resultat

Cliquez sur **Previsualiser** dans le ruban. La page d'accueil du site s'ouvre dans un nouvel onglet, ou vous pouvez voir le carrousel avec vos bannieres actives.

---

## Scenarios concrets

### Scenario A : Creer une banniere promotionnelle pour le Black Friday

1. Cliquez sur **Nouvelle banniere**
2. Slug : "black-friday-2026"
3. Titre : "Black Friday - Jusqu'a 50% de rabais"
4. Sous-titre : "Offre valable du 27 au 30 novembre"
5. Badge : "BLACK FRIDAY"
6. Uploadez une image thematique sombre
7. Opacite du voile : 60%
8. CTA primaire : Texte "Voir les offres", URL "/shop?promo=blackfriday", Style "Primary"
9. Planification : debut 27 novembre 00:00, fin 30 novembre 23:59
10. Cochez "Active"
11. Sauvegardez

### Scenario B : Traduire une banniere existante en francais et espagnol

1. Ouvrez la banniere a traduire (bouton Modifier)
2. Cliquez sur l'onglet **FR**
3. Titre : "Peptides de recherche de haute purete"
4. Sous-titre : "Livraison gratuite au Canada"
5. CTA : "Magasiner"
6. Cliquez sur l'onglet **ES**
7. Titre : "Peptidos de investigacion de alta pureza"
8. Sous-titre : "Envio gratis en Canada"
9. CTA : "Comprar"
10. Sauvegardez

---

## FAQ

**Q: Quelle taille d'image recommandez-vous pour les bannieres ?**
R: Utilisez des images d'au moins 1920x800 pixels pour le desktop et 750x1000 pixels pour le mobile. Preferez le format WebP ou JPEG compresse pour des temps de chargement rapides.

**Q: Combien de bannieres actives recommandez-vous ?**
R: Entre 3 et 5 bannieres actives est ideal. Trop de bannieres dilue le message et augmente le temps de chargement.

**Q: Que signifie le champ "Statistiques JSON" ?**
R: C'est un tableau JSON qui permet d'afficher des chiffres cles directement sur la banniere. Exemple : `[{"value":"99%+","label":"Purete"},{"value":"500+","label":"Produits"}]`. Ces statistiques apparaissent sous forme de badges visuels.

**Q: Puis-je utiliser une video au lieu d'une image ?**
R: Oui. Dans l'onglet Media, changez le type de media sur "Video" et fournissez l'URL de la video. Les formats supportes incluent MP4 et WebM.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Carrousel hero** | La section de diaporama en haut de la page d'accueil |
| **Slide** | Une banniere individuelle dans le carrousel |
| **Slug** | Identifiant textuel unique utilise dans les URL et le code |
| **CTA** | Call To Action (Appel a l'action) -- un bouton qui invite le visiteur a cliquer |
| **Overlay** | Voile semi-transparent superpose a l'image pour ameliorer la lisibilite du texte |
| **MediaUploader** | Le composant d'upload qui permet de telecharger et recadrer des images |
| **Ordre de tri** | Numero qui determine la position de la banniere dans le carrousel |

---

## Pages liees

- [Promotions](/admin/promotions) -- Creer les offres mises en avant dans les bannieres
- [Codes Promo](/admin/promo-codes) -- Les codes de reduction a promouvoir dans les bannieres
- [Blog](/admin/blog) -- Publier des articles a relayer via les bannieres
- [Produits](/admin/produits) -- Les produits mis en avant dans les CTA des bannieres
