# Sessions Video

> **Section**: Media > Gestion de Contenu > Sessions Video
> **URL**: `/admin/media/sessions`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~18 minutes

---

## A quoi sert cette page ?

La page **Sessions Video** permet de planifier, gerer et suivre des sessions de visioconference avec vos clients. Chaque session est liee a une plateforme (Zoom, Teams, Google Meet, Webex) et peut etre associee a un client specifique.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les sessions planifiees, en cours, terminees et annulees
- Creer une nouvelle session avec choix de la plateforme, du client, du sujet et de la duree
- Demarrer une session immediatement ou la planifier pour plus tard
- Rejoindre une session en cours via le lien hote
- Copier le lien client pour l'envoyer par email
- Voir l'enregistrement une fois la session terminee
- Annuler une session planifiee
- Filtrer et rechercher les sessions

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Session** | Reunion video planifiee ou demarree via Koraline |
| **Lien hote (Host Join URL)** | URL pour rejoindre la reunion en tant qu'organisateur |
| **Lien client (Client Join URL)** | URL a envoyer au client pour qu'il rejoigne |
| **Type de contenu** | Classification de la session (formation, consultation, demo, etc.) |
| **Statut** | Etat de la session (planifiee, en cours, terminee, annulee) |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Sessions** dans le panneau lateral
3. Ou naviguez vers `/admin/media/sessions`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Sessions Video** avec description
- Bouton **Rafraichir** pour recharger la liste
- Bouton **Nouvelle session** pour en creer une

### 2. Filtres
- Filtre par **plateforme** (Zoom, Teams, Google Meet, Webex)
- Filtre par **statut** (Planifiee, En cours, Terminee, Annulee)
- Champ de **recherche** par sujet ou nom de client
- Compteur total de sessions

### 3. Tableau des sessions

| Colonne | Description |
|---------|-------------|
| **Date** | Date et heure planifiees |
| **Plateforme** | Badge colore (Zoom bleu, Teams violet, etc.) |
| **Sujet** | Titre de la session |
| **Client** | Nom et email du client associe |
| **Type** | Type de contenu |
| **Statut** | Badge colore |
| **Actions** | Rejoindre, copier le lien, voir l'enregistrement, annuler |

### 4. Statuts des sessions

| Statut | Badge | Description |
|--------|-------|-------------|
| **SCHEDULED** | Ambre | Session planifiee pour le futur |
| **IN_PROGRESS** | Indigo | Session en cours |
| **COMPLETED** | Vert | Session terminee |
| **CANCELLED** | Gris | Session annulee |

---

## Fonctionnalites detaillees

### Creer une nouvelle session
1. Cliquez sur **Nouvelle session**
2. Un formulaire modal s'ouvre avec les champs suivants :

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| **Plateforme** | Zoom, Teams, Google Meet ou Webex | Oui |
| **Client** | Recherche par nom/email dans la base clients | Non |
| **Sujet** | Titre de la session | Oui |
| **Type de contenu** | Formation, consultation, demo, etc. | Non |
| **Duree** | En minutes (5 a 480 min) | Non (30 min par defaut) |
| **Demarrer maintenant** | Case a cocher pour demarrage immediat | Non |
| **Date planifiee** | Date et heure si pas de demarrage immediat | Si pas "maintenant" |
| **Notes** | Notes internes pour l'equipe | Non |

3. La recherche client est **en temps reel** : tapez au moins 2 caracteres
4. Cliquez sur **Creer** pour planifier ou demarrer la session

### Rejoindre une session
1. Sur la ligne de la session, cliquez sur l'icone **lien externe** (bleue)
2. La plateforme s'ouvre dans un nouvel onglet avec votre lien hote

### Copier le lien client
1. Cliquez sur l'icone **copier** sur la ligne de la session
2. Le lien client est copie dans votre presse-papiers
3. Envoyez-le par email, WhatsApp ou tout autre canal

### Voir l'enregistrement
1. Apres la fin de la session, si un enregistrement est disponible, l'icone video verte apparait
2. Cliquez dessus pour acceder directement a la video dans la bibliotheque

### Annuler une session
1. Sur une session en statut "Planifiee", cliquez sur l'icone **X rouge**
2. La session passe en statut "Annulee"
3. **Note** : cela n'annule pas la reunion sur la plateforme elle-meme

---

## Flux de travail recommandes

### Session de consultation client
1. Creez une session avec la plateforme Zoom
2. Associez le client par recherche
3. Definissez le type sur "PERSONAL_SESSION"
4. Choisissez une duree de 30 minutes
5. Planifiez pour la date convenue
6. Copiez le lien client et envoyez-le par email
7. Le jour J, rejoignez via le lien hote
8. Apres la session, importez l'enregistrement si necessaire

### Webinaire produit
1. Creez une session avec un sujet descriptif (ex: "Webinaire BPC-157")
2. Type de contenu : "WEBINAR_RECORDING"
3. Duree : 60 minutes
4. Pas de client specifique (session ouverte)
5. Partagez le lien client sur vos canaux marketing

---

## Questions frequentes

**Q : Aucune plateforme n'apparait dans le selecteur**
R : Connectez au moins une plateforme dans la page [Connexions](./29-connections.md). Seules les plateformes connectees et activees sont disponibles.

**Q : La session ne demarre pas immediatement quand je coche "Demarrer maintenant"**
R : La creation de la reunion sur la plateforme peut prendre quelques secondes. Attendez la confirmation avant de cliquer sur "Rejoindre".

**Q : L'enregistrement n'apparait pas apres la session**
R : Verifiez que l'enregistrement est active dans les parametres de votre plateforme (ex: Zoom > Settings > Recording). Synchronisez ensuite dans [Importations](./30-imports.md).

---

## Pages associees

| Page | Description |
|------|-------------|
| [Connexions](./29-connections.md) | Configurer les plateformes |
| [Importations](./30-imports.md) | Importer les enregistrements |
| [Videos](./27-videos.md) | Gerer les videos issues des sessions |
| [Consentements](./32-consents.md) | Obtenir les autorisations des participants |
