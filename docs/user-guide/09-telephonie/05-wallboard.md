# Wallboard du centre d'appels

> **Section**: Telephonie > Wallboard

---

## Concepts pour debutants

Le **wallboard** est un tableau de bord temps reel concu pour etre affiche en permanence
sur un ecran dans le centre d'appels. Il montre instantanement les metriques critiques :
appels actifs, agents en ligne, file d'attente, SLA, et taux d'abandon.

Le wallboard se rafraichit automatiquement toutes les **10 secondes** et peut aussi etre
actualise manuellement. Il est optimise pour la lisibilite a distance avec de grands
chiffres et des codes couleur intuitifs.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, cliquez sur **Wallboard**.
3. L'URL directe est : `/admin/telephonie/wallboard`

---

## Apercu de l'interface

### Grille de KPI (9 cartes)

| KPI | Description | Code couleur |
|-----|-------------|--------------|
| **Appels actifs** | Nombre d'appels en cours | Bleu |
| **Agents en ligne** | Agents avec statut Online ou Busy | Vert |
| **En file d'attente** | Appels en attente de prise en charge | Violet |
| **Temps d'attente moyen** | Duree moyenne d'attente en file | Ambre |
| **SLA %** | Pourcentage d'appels repondus dans le delai cible | Vert/Ambre/Rouge |
| **Taux d'abandon** | Pourcentage d'appels raccroches avant reponse | Vert/Ambre/Rouge |
| **Appels du jour** | Total des appels de la journee | Bleu |
| **Appels repondus** | Appels decroches avec succes | Vert |
| **Appels manques** | Appels non repondus | Rouge |

Le SLA est colore selon le seuil : vert (>= 90%), ambre (70-89%), rouge (< 70%).
Le taux d'abandon est colore : vert (<= 5%), ambre (6-15%), rouge (> 15%).

### Liste des agents
Un panneau liste tous les agents avec :
- **Avatar** : Initiale du nom
- **Indicateur de presence** : Pastille coloree (vert=en ligne, rouge=occupe, orange=ne pas deranger, ambre=absent, gris=hors ligne)
- **Nom** de l'agent
- **Extension** : Numero de poste
- **Statut** : Badge avec le statut actuel

### Liste des files d'attente
Un second panneau liste les files (queues) configurees :
- **Nom** de la file
- **Nombre de membres** et strategie de distribution
- **Appels en attente** : Badge si des appels attendent
- **Temps d'attente moyen** de la file

### Horodatage du dernier rafraichissement
En haut a droite, l'heure du dernier rafraichissement est affichee avec un bouton de
rafraichissement manuel.

---

## Fonctions detaillees

### Rafraichissement automatique
Le wallboard interroge deux API toutes les 10 secondes :
- **Presence de l'equipe** : Statut de chaque agent
- **Statistiques du tableau de bord** : Compteurs d'appels du jour

### Statuts des agents

| Statut | Couleur | Signification |
|--------|---------|---------------|
| **ONLINE** | Vert | Agent disponible pour recevoir des appels |
| **BUSY** | Rouge | Agent en conversation |
| **DND** | Orange | Ne pas deranger |
| **AWAY** | Ambre | Agent temporairement absent |
| **OFFLINE** | Gris | Agent deconnecte |

### Indicateurs de performance SLA
Le SLA (Service Level Agreement) mesure le pourcentage d'appels repondus dans un delai
donne (typiquement 20 secondes). Un SLA en dessous de 70% indique un sous-effectif.

---

## Workflows courants

### Workflow 1 : Surveillance en temps reel
1. Ouvrez le wallboard sur un ecran dedie dans le centre d'appels.
2. Surveillez le nombre d'appels en file d'attente.
3. Si la file depasse 5 appels, demandez a des agents supplementaires de se connecter.
4. Gardez un oeil sur le taux d'abandon (cible : < 5%).

### Workflow 2 : Diagnostiquer une baisse de SLA
1. Verifiez le nombre d'agents en ligne vs. le volume d'appels.
2. Consultez les statuts individuels des agents.
3. Identifiez les agents en statut DND ou AWAY qui pourraient etre rappeles.
4. Si le temps d'attente moyen depasse 2 minutes, ajustez l'affectation.

---

## FAQ

**Q : Puis-je afficher le wallboard en plein ecran ?**
R : Oui, utilisez la touche F11 de votre navigateur pour passer en mode plein ecran.

**Q : Le wallboard fonctionne-t-il sur une tablette ?**
R : Oui, l'interface est responsive et s'adapte aux differentes tailles d'ecran.

**Q : Comment changer la frequence de rafraichissement ?**
R : La frequence est fixee a 10 secondes dans le code. Contactez l'administrateur
pour la modifier.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Wallboard** | Tableau de bord temps reel pour centre d'appels |
| **SLA** | Service Level Agreement, objectif de temps de reponse |
| **Taux d'abandon** | Pourcentage d'appels raccroches par l'appelant avant reponse |
| **File d'attente** | Queue ou les appels attendent d'etre pris par un agent |
| **DND** | Do Not Disturb, mode ne pas deranger |

---

## Pages associees

- [Tableau de bord](./01-dashboard.md) : Vue d'ensemble non temps reel
- [Groupes de sonnerie](./10-groupes.md) : Configurer les files d'attente
- [Analytics files](./17-analytics-queues.md) : Statistiques historiques des files
- [Analytics agents](./16-analytics-agents.md) : Performance individuelle des agents
