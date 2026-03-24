# Connexion API X (Twitter)

> **Section**: Media > Connexions API > X (Twitter)
> **URL**: `/admin/media/api-x`
> **Niveau**: Avance (technique)
> **Temps de lecture**: ~8 minutes

---

## A quoi sert cette page ?

La page **API X (Twitter)** permet de configurer la connexion technique entre Koraline et X (Twitter). Une fois configuree, cette connexion permet a Koraline d'interagir avec X (Twitter) pour : Publication et analytique sur X.

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
2. Cliquez sur la carte **X (Twitter)** dans la section integrations
3. Ou naviguez vers `/admin/media/api-x`

---

## Fournisseur et identifiants requis

| Champ | Description |
|-------|-------------|
| **Fournisseur** | X Developer Platform |
| **Identifiants requis** | API Key, API Secret, Bearer Token |
| **Documentation officielle** | [https://developer.x.com/en/docs](https://developer.x.com/en/docs) |

---

## Comment connecter X (Twitter)

### Etape 1 : Obtenir les identifiants
Creez un projet dans le portail developpeur X. Le Bearer Token permet l'acces en lecture. Pour publier, vous avez besoin des cles OAuth 1.0a.

### Etape 2 : Configurer dans Koraline
1. Sur la page API X (Twitter), activez l'interrupteur **Activer**
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
X utilise OAuth 1.0a pour les actions d'ecriture et OAuth 2.0 Bearer Token pour la lecture.

---

## Questions frequentes

**Q : Ou sont stockes mes identifiants ?**
R : Les Client Secrets sont stockes dans les variables d'environnement du serveur (fichier .env), jamais en base de donnees en clair. Les autres identifiants sont stockes de maniere chiffree.

**Q : Que se passe-t-il si je desactive l'integration ?**
R : Les donnees existantes sont conservees, mais Koraline ne communiquera plus avec X (Twitter). Vous pouvez reactiver a tout moment.

---

## Pages associees

| Page | Description |
|------|-------------|
| [Tableau de Bord Media](./01-dashboard.md) | Vue d'ensemble des integrations |
| [Connexions](./29-connections.md) | Gestion des plateformes connectees avec OAuth |
