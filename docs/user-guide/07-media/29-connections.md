# Connexions aux Plateformes

> **Section**: Media > Gestion de Contenu > Connexions
> **URL**: `/admin/media/connections`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Connexions aux Plateformes** centralise la gestion des connexions OAuth vers les plateformes de visioconference et de video. Contrairement aux pages API individuelles qui configurent les identifiants techniques, cette page gere les **connexions actives** et les parametres d'importation automatique.

**En tant que gestionnaire, vous pouvez :**
- Voir d'un coup d'oeil quelles plateformes sont connectees (Zoom, Teams, Google Meet, Webex, YouTube)
- Connecter une nouvelle plateforme via OAuth (un clic)
- Deconnecter une plateforme
- Tester une connexion existante
- Configurer l'importation automatique des enregistrements
- Definir la categorie, la visibilite et le type de contenu par defaut pour les imports
- Voir l'historique de synchronisation et les erreurs eventuelles

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Connexion OAuth** | Autorisation donnee par votre compte de plateforme a Koraline pour acceder a vos donnees |
| **Auto-import** | Importation automatique des nouveaux enregistrements sans intervention manuelle |
| **Categorie par defaut** | Categorie automatiquement assignee aux videos importees |
| **Visibilite par defaut** | Niveau d'acces automatiquement assigne aux videos importees |
| **Type de contenu par defaut** | Classification automatiquement assignee (podcast, formation, etc.) |
| **Synchronisation** | Processus de recuperation des donnees depuis la plateforme |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Connexions** dans le panneau lateral
3. Ou naviguez vers `/admin/media/connections`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Connexions aux plateformes** avec description
- Bouton **Rafraichir** pour recharger les donnees

### 2. Grille de cartes de plateforme
Chaque plateforme est representee par une carte avec bordure coloree :

| Plateforme | Couleur de bordure |
|-----------|-------------------|
| **Zoom** | Indigo |
| **Teams** | Violet |
| **Google Meet** | Vert |
| **Webex** | Cyan |
| **YouTube** | Rouge |

Chaque carte contient :
- **Logo** de la plateforme (SVG)
- **Nom** et description
- **Badge de statut** : "Connecte" (vert) ou "Non connecte" (gris)
- **Boutons d'action** : Connecter, Tester, Deconnecter

### 3. Parametres de connexion (visible si connecte)
Quand une plateforme est connectee, des options supplementaires apparaissent :

| Parametre | Description |
|-----------|-------------|
| **Auto-import** | Interrupteur pour activer/desactiver l'importation automatique |
| **Categorie par defaut** | Selecteur de la categorie video pour les imports |
| **Visibilite par defaut** | Public, Clients uniquement, Employes uniquement, Prive |
| **Type de contenu par defaut** | Podcast, Formation, Session, Demo, etc. |

### 4. Statistiques de la connexion
- Nombre d'enregistrements importes
- Date de derniere synchronisation
- Nom de l'utilisateur qui a connecte la plateforme

### 5. Erreurs de synchronisation
Si une erreur est survenue lors de la derniere synchronisation, une alerte rouge s'affiche avec le message d'erreur.

---

## Fonctionnalites detaillees

### Connecter une plateforme
1. Cliquez sur le bouton **Connecter** (bleu) sur la carte de la plateforme
2. Vous etes redirige vers la page de connexion de la plateforme (Zoom, Google, etc.)
3. Autorisez Koraline a acceder a votre compte
4. Vous etes redirige vers Koraline avec un message de confirmation
5. La carte passe en mode "Connecte" avec les parametres

### Deconnecter une plateforme
1. Cliquez sur **Deconnecter** (rouge) sur la carte connectee
2. Confirmez la deconnexion dans la boite de dialogue
3. **Attention** : les videos deja importees sont conservees, mais les futures synchronisations s'arretent

### Tester une connexion
1. Cliquez sur **Tester** sur la carte connectee
2. Koraline envoie une requete de test a la plateforme
3. Un message vert confirme le succes, ou rouge indique un probleme

### Configurer l'auto-import
1. Activez l'interrupteur **Auto-import** sur la carte de la plateforme
2. Selectionnez la categorie par defaut dans le menu deroulant
3. Choisissez la visibilite par defaut
4. Choisissez le type de contenu par defaut
5. Les modifications sont sauvegardees automatiquement

### Gestion du callback OAuth
Si vous arrivez sur cette page apres une connexion OAuth reussie, un message de confirmation apparait automatiquement. Si une erreur s'est produite, le message d'erreur s'affiche avec le nom de la plateforme concernee.

---

## Options de visibilite

| Valeur | Description |
|--------|-------------|
| **PUBLIC** | Visible par tous les visiteurs du site |
| **CUSTOMERS_ONLY** | Visible uniquement par les clients connectes |
| **CLIENTS_ONLY** | Visible uniquement par les clients B2B |
| **EMPLOYEES_ONLY** | Visible uniquement par les employes |
| **PRIVATE** | Visible uniquement par les administrateurs |

---

## Options de type de contenu

| Valeur | Description |
|--------|-------------|
| **PODCAST** | Emission audio/video recurrente |
| **TRAINING** | Session de formation |
| **PERSONAL_SESSION** | Consultation individuelle |
| **PRODUCT_DEMO** | Demonstration de produit |
| **TESTIMONIAL** | Temoignage client |
| **FAQ_VIDEO** | Video de questions-reponses |
| **WEBINAR_RECORDING** | Enregistrement de webinaire |
| **TUTORIAL** | Guide pas-a-pas |
| **BRAND_STORY** | Histoire de marque |
| **LIVE_STREAM** | Diffusion en direct |
| **OTHER** | Autre |

---

## Flux de travail recommandes

### Premiere configuration
1. Connectez Zoom (plateforme la plus utilisee pour BioCycle)
2. Activez l'auto-import
3. Definissez la categorie par defaut sur "Formations"
4. Definissez la visibilite sur "PRIVATE" (pour reviser avant de publier)
5. Testez la connexion
6. Repetez pour les autres plateformes utilisees

---

## Questions frequentes

**Q : Que se passe-t-il si mon token OAuth expire ?**
R : Koraline tente de renouveler automatiquement les tokens. Si le renouvellement echoue, le badge de la plateforme passe en erreur. Reconnectez la plateforme via le bouton "Connecter".

**Q : L'auto-import cree-t-il les videos automatiquement ?**
R : Non, l'auto-import detecte les nouveaux enregistrements et les ajoute a la file d'attente d'importation (page [Importations](./30-imports.md)). Vous devez ensuite valider l'importation.

**Q : Puis-je connecter plusieurs comptes de la meme plateforme ?**
R : Non, une seule connexion par plateforme est supportee.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **OAuth** | Protocole d'autorisation permettant a Koraline d'acceder a vos comptes tiers |
| **Token** | Jeton d'acces delivre apres authentification OAuth |
| **Callback** | URL de retour apres l'authentification OAuth |
| **Synchronisation** | Mise a jour des donnees entre Koraline et la plateforme |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Importations](./30-imports.md) | Gerer la file d'importation des enregistrements |
| [Sessions Video](./31-sessions.md) | Planifier des sessions de visioconference |
| [API Zoom](./14-api-zoom.md) | Configuration technique Zoom |
| [API Teams](./15-api-teams.md) | Configuration technique Teams |
