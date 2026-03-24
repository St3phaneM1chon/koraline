# Connexion API YouTube

> **Section**: Media > Connexions API > YouTube
> **URL**: `/admin/media/api-youtube`
> **Niveau**: Avance (technique)
> **Temps de lecture**: ~8 minutes

---

## A quoi sert cette page ?

La page **API YouTube** permet de configurer la connexion technique entre Koraline et YouTube. Une fois configuree, cette connexion permet a Koraline d'interagir avec YouTube pour : Gestion des videos YouTube et analytiques.

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **API** | Interface de programmation qui permet a deux systemes de communiquer |
| **OAuth** | Protocole d'authentification securise utilise pour autoriser Koraline |
| **Client ID** | Identifiant unique de votre application aupres du fournisseur |
| **Client Secret** | Mot de passe secret de votre application (ne jamais partager) |
| **Webhook URL** | Adresse que la plateforme utilise pour envoyer des notifications a Koraline |

---

## Comment y acceder

1. Allez dans **Media > Tableau de Bord**
2. Cliquez sur la carte **YouTube** dans la section integrations
3. Ou naviguez vers `/admin/media/api-youtube`

---

## Fournisseur et identifiants requis

| Champ | Description |
|-------|-------------|
| **Fournisseur** | Google Cloud |
| **Identifiants requis** | API Key, Client ID, Client Secret |
| **Documentation officielle** | [https://developers.google.com/youtube/v3/](https://developers.google.com/youtube/v3/) |

---

## Comment connecter YouTube

### Etape 1 : Obtenir les identifiants
Activez l'API YouTube Data v3 dans Google Cloud Console. Utilisez les memes identifiants que Google Ads si possible.

### Etape 2 : Configurer dans Koraline
1. Sur la page API YouTube, activez l'interrupteur **Activer**
2. Remplissez les champs requis avec vos identifiants
3. Cliquez sur **Sauvegarder**

### Etape 3 : Tester la connexion
1. Cliquez sur le bouton **Tester** a cote de "Sauvegarder"
2. Si le test reussit, un message vert confirme la connexion
3. Si le test echoue, verifiez vos identifiants et la documentation officielle

---

## Interface de la page

La page affiche une **carte d'integration** avec :
- Un interrupteur pour activer/desactiver l'integration
- Les champs de saisie pour chaque identifiant requis
- Le Client Secret est masque (affiches en etoiles) pour la securite -- il est stocke dans les variables d'environnement
- L'URL de webhook de Koraline (a copier dans la configuration de la plateforme)
- Un bouton **Sauvegarder** et un bouton **Tester**
- Le statut de connexion OAuth en haut de la page (connecte, non connecte, expiree)

---

## Actions du ruban

| Action | Effet |
|--------|-------|
| **Configurer** | Deplace le focus vers le premier champ de saisie |
| **Tester la connexion** | Execute un test de connexion |
| **Rafraichir le token** | Recharge les donnees de connexion |
| **Voir les logs** | Ouvre les journaux filtres pour cette plateforme |
| **Documentation** | Ouvre la documentation officielle dans un nouvel onglet |

---

## Depannage

### La connexion echoue apres la sauvegarde
1. Verifiez que les identifiants sont corrects (pas d'espaces en trop)
2. Verifiez que l'application est bien creee et active chez le fournisseur
3. Verifiez les scopes/permissions demandes

### Le token OAuth expire
Les tokens OAuth expirent regulierement. Koraline tente de les renouveler automatiquement. Si le renouvellement echoue, reconnectez-vous via le bouton OAuth.

### Note technique
L'API YouTube Data permet de lire les videos, playlists, commentaires et analytiques de votre chaine.

---

## Questions frequentes

**Q : Ou sont stockes mes identifiants ?**
R : Les Client Secrets sont stockes dans les variables d'environnement du serveur (fichier .env), jamais en base de donnees en clair. Les autres identifiants sont stockes de maniere chiffree.

**Q : Que se passe-t-il si je desactive l'integration ?**
R : Les donnees existantes sont conservees, mais Koraline ne communiquera plus avec YouTube. Vous pouvez reactiver a tout moment.

---

## Pages associees

| Page | Description |
|------|-------------|
| [Tableau de Bord Media](./01-dashboard.md) | Vue d'ensemble des integrations |
| [Connexions](./29-connections.md) | Gestion des plateformes connectees avec OAuth |
