# Tableau de Bord Media

> **Section**: Media > Tableau de Bord
> **URL**: `/admin/media`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Le **Tableau de Bord Media** est la page centrale de toute la section Media de Koraline. Elle offre une vue d'ensemble en temps reel de vos ressources mediatiques, des plateformes connectees et des raccourcis vers les outils de gestion de contenu.

**En tant que gestionnaire, vous pouvez :**
- Voir les statistiques globales : nombre de fichiers, videos, images et plateformes connectees
- Lancer directement une reunion sur une plateforme (Teams, Zoom, Webex, Google Meet, WhatsApp)
- Verifier l'etat de connexion de chaque integration (Zoom, YouTube, Meta, X, TikTok, Google Ads, LinkedIn)
- Envoyer des fichiers media depuis le tableau de bord en un clic
- Acceder rapidement aux sous-pages de gestion (Videos, Images, Mediatheque)

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Plateforme de communication** | Un outil de visioconference (Zoom, Teams, Webex, Google Meet, WhatsApp) integre a Koraline |
| **Integration API** | Connexion technique entre Koraline et un service externe (YouTube, Meta, etc.) via leurs cles API |
| **Mediatheque** | L'ensemble des fichiers (images, videos, PDF) stockes dans votre administration |
| **Ruban (Ribbon)** | La barre d'outils contextuelle en haut de la page qui change selon la page affichee |

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la barre de navigation horizontale, cliquez sur **Media**
3. La premiere page qui s'affiche est le tableau de bord

### Methode 2 : Via le rail de navigation
1. Dans la colonne d'icones a gauche, cliquez sur l'icone **Media** (camera/video)
2. Le panneau Media s'ouvre, cliquez sur **Tableau de bord**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche (ou tapez `/`)
2. Tapez "media" ou "tableau de bord media"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

L'interface est organisee en **5 zones principales** :

### 1. En-tete et bouton d'envoi
En haut de la page, vous trouvez :
- Le titre **Tableau de bord Media**
- Un bouton **Envoyer** (Upload) qui permet d'envoyer des fichiers directement depuis cette page

### 2. Cartes de statistiques
Quatre cartes affichent les compteurs principaux :

| Carte | Donnee |
|-------|--------|
| **Mediatheque** | Nombre total de fichiers dans la mediatheque |
| **Videos** | Nombre total de videos enregistrees |
| **Images** | Nombre d'images dans la bibliotheque |
| **Connectees** | Nombre de plateformes actives / total configure (ex: 5/10) |

### 3. Plateformes de communication
Une grille de cartes colorees, une par plateforme :

| Plateforme | Couleur | Description |
|-----------|---------|-------------|
| **Microsoft Teams** | Violet | Reunions et collaboration |
| **Zoom** | Bleu | Visioconference |
| **Webex** | Vert | Reunions Cisco |
| **Google Meet** | Sarcelle | Visioconference Google |
| **WhatsApp** | Vert | Messagerie directe |

Cliquer sur une carte ouvre la page de lancement de la plateforme correspondante.

> **Astuce** : L'icone moniteur a droite d'une carte indique que l'application bureau est disponible.

### 4. Integrations API et Publicites
Une grille de cartes montrant chaque service connecte :
- Un indicateur vert avec coche = connecte et actif
- Un indicateur gris avec croix = non connecte
- Un indicateur gris "Bientot" = pas encore configure

Chaque carte renvoie vers la page de configuration API ou la page de publicite correspondante.

### 5. Gestion media (liens rapides)
Trois cartes de raccourcis vers :
- **Videos** : gerer toutes les videos
- **Images** : gerer la bibliotheque d'images
- **Mediatheque** : tous les fichiers (images, videos, PDF, documents)

---

## Fonctionnalites detaillees

### Envoyer un fichier depuis le tableau de bord
1. Cliquez sur le bouton **Envoyer** en haut a droite
2. La boite de dialogue de votre systeme d'exploitation s'ouvre
3. Selectionnez un ou plusieurs fichiers
4. Les fichiers sont envoyes dans le dossier "general" de la mediatheque
5. Un message de confirmation s'affiche avec le nombre de fichiers envoyes
6. Les statistiques se mettent a jour automatiquement

### Actions du ruban
La barre de ruban offre des actions contextuelles :

| Action | Effet |
|--------|-------|
| **Upload** | Ouvre la boite de selection de fichiers |
| **Delete** | Affiche un message d'aide pour la suppression |
| **Play** | Affiche un message d'aide pour la lecture |
| **Export** | Affiche un message d'aide pour l'export |

---

## Flux de travail recommandes

### Configuration initiale des medias
1. **Connectez vos plateformes** : Allez dans chaque page API (Zoom, Teams, etc.) et configurez les identifiants
2. **Envoyez vos images** : Utilisez la page Images pour envoyer vos visuels produits et marketing
3. **Configurez vos categories** : Creez des categories video pour organiser votre contenu
4. **Testez une reunion** : Lancez une reunion de test via une plateforme pour verifier la connexion

### Routine quotidienne
1. Ouvrez le tableau de bord media
2. Verifiez que toutes les plateformes sont connectees (vert)
3. Consultez les statistiques pour suivre la croissance de votre mediatheque
4. Si une plateforme est deconnectee (rouge), allez reconfigurer la connexion

---

## Questions frequentes

**Q : Le compteur de plateformes connectees affiche "0/10", est-ce normal ?**
R : Oui, a la premiere utilisation. Chaque plateforme doit etre configuree individuellement dans sa page API. Consultez les pages 14 a 25 de ce guide.

**Q : Puis-je envoyer n'importe quel type de fichier ?**
R : Oui, la mediatheque accepte les images (JPG, PNG, WebP, GIF), les videos (MP4, WebM), les PDF et d'autres formats. La limite par fichier est de 10 Mo.

**Q : Une plateforme affiche "Bientot" au lieu de "Connecte" ou "Non connecte"**
R : Cela signifie que l'API de cette plateforme n'a pas repondu ou n'est pas encore configuree dans votre environnement. Contactez votre administrateur technique.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Upload** | Action d'envoyer un fichier depuis votre ordinateur vers le serveur |
| **API** | Interface de programmation permettant a deux systemes de communiquer |
| **OAuth** | Protocole d'authentification securise utilise par les plateformes pour autoriser Koraline |
| **Webhook** | URL de rappel que la plateforme utilise pour notifier Koraline des evenements |
| **CSRF** | Protection de securite qui empeche les requetes non autorisees |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Analytique Media](./02-analytics.md) | Statistiques detaillees de vos medias |
| [Videos](./27-videos.md) | Gestion complete des videos |
| [Images](./34-images.md) | Gestion de la bibliotheque d'images |
| [Mediatheque](./35-library.md) | Tous les fichiers media |
| [Connexions](./29-connections.md) | Configuration des plateformes connectees |
