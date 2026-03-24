# Zoom

> **Section**: Media > Plateformes > Zoom
> **URL**: `/admin/media/launch-zoom`
> **Niveau**: Debutant
> **Temps de lecture**: ~10 minutes

---

## A quoi sert cette page ?

La page **Zoom** permet de lancer directement une reunion Zoom depuis l'interface Koraline. Elle detecte automatiquement si l'application bureau est installee.

**En tant que gestionnaire, vous pouvez :**
- Demarrer une reunion Zoom en un clic
- Ouvrir l'application bureau ou la version web
- Voir le statut de connexion de votre compte Zoom

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Lanceur de plateforme** | Page qui vous redirige vers l'application de visioconference |
| **Lien public** | URL de reunion partageable avec vos clients |

---

## Comment y acceder

1. Allez dans **Media > Tableau de Bord**
2. Cliquez sur la carte **Zoom** (bleue) dans la section "Plateformes"
3. Ou naviguez directement vers `/admin/media/launch-zoom`

---

## Vue d'ensemble de l'interface

La page affiche un composant de lancement avec :
- L'icone et le nom de la plateforme (Zoom)
- Le statut de connexion
- Un bouton principal pour rejoindre ou demarrer une reunion
- Un lien alternatif vers la version web

---

## Fonctionnalites

### Demarrer une reunion
1. Cliquez sur le bouton **Rejoindre** ou **Demarrer**
2. Si Zoom est installe, l'application s'ouvre automatiquement
3. Sinon, la version web s'ouvre dans un nouvel onglet

### Prerequis
- Votre compte Zoom doit etre configure dans [API Zoom](./14-api-zoom.md)
- L'Account ID, Client ID et Client Secret doivent etre renseignes

---

## Questions frequentes

**Q : Comment partager un lien de reunion avec un client ?**
R : Configurez le "Lien public" dans la page API Zoom. Ce lien peut etre partage par email ou integre dans les emails automatiques de Koraline.

**Q : Zoom me demande un mot de passe de reunion**
R : Le mot de passe est gere automatiquement par l'integration. Si vous avez configure un lien public personnalise, il inclut deja le mot de passe.

---

## Pages associees

| Page | Description |
|------|-------------|
| [API Zoom](./14-api-zoom.md) | Configuration de la connexion Zoom |
| [Sessions Video](./31-sessions.md) | Planifier des sessions via Zoom |
| [Importations](./30-imports.md) | Importer les enregistrements Zoom |
