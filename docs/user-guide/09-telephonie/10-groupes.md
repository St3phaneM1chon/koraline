# Groupes de sonnerie

> **Section**: Telephonie > Groupes de sonnerie

---

## Concepts pour debutants

Un **groupe de sonnerie** (Ring Group ou Call Queue) est un ensemble d'agents qui recoivent
les appels selon une strategie de distribution definie. Au lieu de diriger un appel vers un
seul poste, le systeme fait sonner plusieurs agents selon la strategie choisie.

Par exemple, l'equipe de support client peut avoir un groupe "Support" qui distribue les
appels entrants a tous les agents disponibles simultanement. Si personne ne repond dans
le delai imparti, l'appel est redirige vers la messagerie vocale.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Operations**, cliquez sur **Groupes**.
3. L'URL directe est : `/admin/telephonie/groupes`

---

## Apercu de l'interface

### Liste des groupes
Chaque groupe affiche :
- **Nom** du groupe (ex: "Support Client", "Ventes")
- **Strategie** de distribution
- **Membres** : Nombre et liste des agents
- **Delais** : Ring timeout, temps d'attente max, wrap-up time
- **Actif** : Toggle on/off

### Bouton "Nouveau groupe"
Ouvre le formulaire de creation avec tous les parametres.

---

## Fonctions detaillees

### Strategies de distribution

| Strategie | Description | Cas d'usage |
|-----------|-------------|-------------|
| **RING_ALL** | Tous les agents sonnent simultanement | Petites equipes, urgences |
| **ROUND_ROBIN** | Distribution a tour de role | Repartition equitable |
| **HUNT** | Appels sequentiels par ordre de priorite | Hierarchie de competences |
| **RANDOM** | Distribution aleatoire | Equipes homogenes |
| **LEAST_RECENT** | L'agent ayant le plus ancien dernier appel | Repartition par charge |

### Parametres temporels
- **Ring Timeout** : Duree de sonnerie avant de passer au prochain agent ou a la messagerie
- **Temps d'attente max** : Duree maximale qu'un appelant peut rester en file
- **Wrap-up Time** : Pause entre deux appels pour permettre a l'agent de prendre des notes

### Gestion des membres
- **Ajouter un membre** : Selectionnez un utilisateur dans la liste des employes
- **Priorite** : Definissez l'ordre de priorite pour la strategie HUNT
- **Retirer un membre** : Supprimez un agent du groupe

---

## Workflows courants

### Workflow 1 : Creer un groupe de support
1. Cliquez sur **Nouveau groupe**.
2. Nommez-le "Support Client".
3. Selectionnez la strategie **RING_ALL** pour maximiser les chances de reponse.
4. Definissez le ring timeout a 20 secondes.
5. Ajoutez les agents de l'equipe support.
6. Activez le groupe.

### Workflow 2 : Configurer une file d'attente commerciale
1. Creez un groupe "Equipe Ventes" avec la strategie **ROUND_ROBIN**.
2. Definissez un wrap-up time de 30 secondes entre les appels.
3. Configurez le temps d'attente max a 5 minutes.
4. Ajoutez les commerciaux avec des priorites egales.

---

## FAQ

**Q : Un agent peut-il appartenir a plusieurs groupes ?**
R : Oui, un agent peut etre membre de plusieurs groupes simultanement.

**Q : Que se passe-t-il si aucun agent ne repond ?**
R : Apres le temps d'attente maximum, l'appel est redirige vers la messagerie vocale ou raccroche selon la configuration.

**Q : Le wrap-up time est-il obligatoire ?**
R : Non, mais il est recommande pour permettre aux agents de finaliser leurs notes apres chaque appel.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Groupe de sonnerie** | Ensemble d'agents recevant les appels selon une strategie |
| **Ring Timeout** | Duree de sonnerie avant escalade |
| **Wrap-up Time** | Pause entre deux appels pour prise de notes |
| **Round Robin** | Distribution a tour de role equitable |
| **Hunt** | Distribution sequentielle par ordre de priorite |

---

## Pages associees

- [Wallboard](./05-wallboard.md) : Voir l'etat des files en temps reel
- [Transferts](./09-transferts.md) : Renvoi d'appel individuel
- [IVR Builder](./12-ivr-builder.md) : Diriger les appels vers les groupes via le menu vocal
- [Analytics files](./17-analytics-queues.md) : Performance des files d'attente
