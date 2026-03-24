# WhatsApp

> **Section**: Media > Plateformes > WhatsApp
> **URL**: `/admin/media/launch-whatsapp`
> **Niveau**: Debutant
> **Temps de lecture**: ~10 minutes

---

## A quoi sert cette page ?

La page **WhatsApp** permet de lancer directement l'application WhatsApp depuis l'interface Koraline, pour communiquer avec vos clients par messagerie instantanee ou appels video.

**En tant que gestionnaire, vous pouvez :**
- Ouvrir WhatsApp Desktop ou WhatsApp Web en un clic
- Envoyer un message a un client directement depuis Koraline
- Utiliser WhatsApp Business pour les communications professionnelles

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **WhatsApp Business** | Version professionnelle de WhatsApp avec des fonctionnalites avancees (profil d'entreprise, messages automatiques) |
| **WhatsApp Web** | Version navigateur de WhatsApp |

---

## Comment y acceder

1. Allez dans **Media > Tableau de Bord**
2. Cliquez sur la carte **WhatsApp** (verte) dans la section "Plateformes"
3. Ou naviguez vers `/admin/media/launch-whatsapp`

---

## Fonctionnalites

### Lancer WhatsApp
1. Cliquez sur le bouton de lancement
2. Si WhatsApp Desktop est installe, l'application s'ouvre
3. Sinon, WhatsApp Web s'ouvre dans le navigateur

### Prerequis
- Configurez la connexion dans [API WhatsApp](./16-api-whatsapp.md)
- Un numero de telephone professionnel doit etre associe a votre compte WhatsApp Business

---

## Cas d'utilisation pour BioCycle Peptides

- **Support client** : repondre aux questions sur les produits peptidiques
- **Suivi de commande** : informer un client de l'expedition de sa commande
- **Prise de rendez-vous** : coordonner une session de consultation video
- **Partage de documents** : envoyer un certificat d'analyse directement au client

---

## Questions frequentes

**Q : Puis-je envoyer des messages automatiques via WhatsApp ?**
R : Oui, via l'API WhatsApp Business configuree dans la page [API WhatsApp](./16-api-whatsapp.md). Cependant, les messages automatiques doivent utiliser des modeles pre-approuves par Meta.

---

## Pages associees

| Page | Description |
|------|-------------|
| [API WhatsApp](./16-api-whatsapp.md) | Configuration de la connexion WhatsApp |
| [Connexions](./29-connections.md) | Vue d'ensemble des plateformes |
