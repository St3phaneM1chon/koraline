# Sondages post-appel

> **Section**: Telephonie > Sondages

---

## Concepts pour debutants

Les **sondages post-appel** mesurent la satisfaction des clients immediatement apres un appel
telephonique. A la fin de l'appel, le client est invite a repondre a quelques questions
(par clavier DTMF, par message vocal, ou par SMS).

Les resultats alimentent le score de satisfaction visible dans le journal d'appels, le wallboard,
et les analytics. Ils sont essentiels pour evaluer la qualite du service client.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Operations**, cliquez sur **Sondages**.
3. L'URL directe est : `/admin/telephonie/sondages`

---

## Apercu de l'interface

### Liste des sondages
Chaque sondage affiche :
- **Nom** : Identifiant du sondage
- **Cle** : Identifiant technique unique
- **Questions** : Nombre de questions configurees
- **Methode** : DTMF, SMS, ou appel vocal
- **Actif** : Toggle on/off
- **Resultats** : Nombre de reponses et score moyen

### Bouton "Nouveau sondage"
Ouvre le formulaire de creation d'un sondage.

---

## Fonctions detaillees

### Types de questions

| Type | Description | Reponse attendue |
|------|-------------|-----------------|
| **Rating (1-5)** | Evaluation numerique | Le client appuie sur 1 a 5 |
| **Yes/No** | Question fermee | Le client appuie sur 1 (oui) ou 2 (non) |
| **Open Text** | Reponse libre | Le client laisse un message vocal |
| **DTMF** | Selection par touches | Le client appuie sur la touche correspondante |

### Methodes de collecte
- **DTMF** : A la fin de l'appel, un message demande au client d'evaluer sur le clavier
- **SMS** : Un SMS est envoye apres l'appel avec un lien vers un formulaire
- **Vocal** : Le client enregistre sa reponse vocalement

### Statistiques
La page affiche les statistiques globales par methode :
- Nombre de reponses collectees
- Score moyen global

---

## Workflows courants

### Workflow 1 : Creer un sondage CSAT simple
1. Cliquez sur **Nouveau sondage**.
2. Nommez-le "Satisfaction client".
3. Ajoutez une question de type **Rating (1-5)** : "Comment evaluez-vous notre service?"
4. Activez la methode **DTMF**.
5. Sauvegardez et activez le sondage.

### Workflow 2 : Analyser les resultats
1. Consultez le score moyen dans la liste des sondages.
2. Croisez avec les donnees du journal d'appels pour identifier les agents ou les sujets
   generant les meilleurs/pires scores.

---

## FAQ

**Q : Le sondage est-il presente automatiquement a chaque appel ?**
R : Oui, quand un sondage est actif, il est propose a la fin de chaque appel.

**Q : Le client peut-il refuser de repondre ?**
R : Oui, le client peut raccrocher sans repondre. Cela n'impacte pas les statistiques.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **CSAT** | Customer Satisfaction Score, indicateur de satisfaction client |
| **DTMF** | Dual-Tone Multi-Frequency, signaux emis par les touches du telephone |
| **NPS** | Net Promoter Score, mesure de la propension a recommander |

---

## Pages associees

- [Journal d'appels](./02-journal.md) : Voir les scores de satisfaction par appel
- [Wallboard](./05-wallboard.md) : Score de satisfaction en temps reel
- [Analytics agents](./16-analytics-agents.md) : Satisfaction par agent
