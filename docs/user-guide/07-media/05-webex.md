# Webex

> **Section**: Media > Plateformes > Webex
> **URL**: `/admin/media/launch-webex`
> **Niveau**: Debutant
> **Temps de lecture**: ~10 minutes

---

## A quoi sert cette page ?

La page **Webex** permet de lancer directement une reunion Cisco Webex depuis l'interface Koraline.

**En tant que gestionnaire, vous pouvez :**
- Demarrer une reunion Webex en un clic
- Ouvrir l'application bureau ou la version web
- Voir le statut de connexion de votre compte Webex

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Webex** | Plateforme de visioconference de Cisco, populaire en entreprise |
| **Lanceur** | Composant Koraline qui redirige vers l'application de reunion |

---

## Comment y acceder

1. Allez dans **Media > Tableau de Bord**
2. Cliquez sur la carte **Webex** (verte) dans la section "Plateformes"
3. Ou naviguez vers `/admin/media/launch-webex`

---

## Fonctionnalites

### Demarrer une reunion
1. Cliquez sur le bouton de lancement
2. L'application Webex s'ouvre (bureau ou web)

### Prerequis
- Configurez la connexion dans [API Webex](./17-api-webex.md)
- Les scopes OAuth doivent etre correctement configures dans le portail developpeur Webex

---

## Questions frequentes

**Q : J'obtiens une erreur "invalid_scope" lors de la connexion**
R : Les scopes demandes ne correspondent pas a ceux configures dans le portail developpeur Webex. Verifiez sur https://developer.webex.com/my-apps que les scopes sont coches.

---

## Pages associees

| Page | Description |
|------|-------------|
| [API Webex](./17-api-webex.md) | Configuration de la connexion Webex |
| [Sessions Video](./31-sessions.md) | Planifier des sessions via Webex |
| [Connexions](./29-connections.md) | Vue d'ensemble des plateformes |
