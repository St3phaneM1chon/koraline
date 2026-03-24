# Microsoft Teams

> **Section**: Media > Plateformes > Microsoft Teams
> **URL**: `/admin/media/launch-teams`
> **Niveau**: Debutant
> **Temps de lecture**: ~10 minutes

---

## A quoi sert cette page ?

La page **Microsoft Teams** permet de lancer directement une reunion Teams depuis l'interface Koraline. Elle sert de pont entre votre administration et l'application Teams (bureau ou web).

**En tant que gestionnaire, vous pouvez :**
- Demarrer une reunion Teams en un clic
- Ouvrir l'application de bureau Teams si elle est installee
- Acceder a la version web de Teams si l'application n'est pas installee
- Voir le statut de connexion de votre compte Teams

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Lanceur de plateforme** | Page intermediaire qui vous redirige vers l'application de visioconference |
| **Application bureau** | La version installee sur votre ordinateur (plus performante) |
| **Version web** | La version accessible depuis votre navigateur (sans installation) |

---

## Comment y acceder

1. Allez dans **Media > Tableau de Bord**
2. Cliquez sur la carte **Microsoft Teams** (violette) dans la section "Plateformes"
3. Ou naviguez directement vers `/admin/media/launch-teams`

---

## Vue d'ensemble de l'interface

La page affiche un **composant de lancement** avec :
- L'icone et le nom de la plateforme (Microsoft Teams)
- Le statut de connexion (connecte / non connecte)
- Un bouton principal pour rejoindre ou demarrer une reunion
- Un lien alternatif vers la version web

---

## Fonctionnalites

### Demarrer une reunion
1. Cliquez sur le bouton **Rejoindre** ou **Demarrer**
2. Si Teams est installe sur votre ordinateur, l'application s'ouvre automatiquement
3. Sinon, la version web s'ouvre dans un nouvel onglet

### Prerequis
- Votre compte Teams doit etre configure dans la page [API Teams](./15-api-teams.md)
- L'integration doit etre activee (statut vert dans le tableau de bord)

---

## Questions frequentes

**Q : Le bouton ne fait rien quand je clique dessus**
R : Verifiez que l'integration Teams est configuree dans Media > API > Teams. Le Tenant ID, Client ID et Client Secret doivent etre renseignes.

**Q : Puis-je programmer une reunion pour plus tard ?**
R : Oui, utilisez la page [Sessions Video](./31-sessions.md) pour planifier des sessions avec vos clients via Teams.

---

## Pages associees

| Page | Description |
|------|-------------|
| [API Teams](./15-api-teams.md) | Configuration de la connexion Microsoft Teams |
| [Sessions Video](./31-sessions.md) | Planifier des sessions de visioconference |
| [Connexions](./29-connections.md) | Vue d'ensemble des plateformes connectees |
