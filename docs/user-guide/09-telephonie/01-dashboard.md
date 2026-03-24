# Tableau de bord VoIP

> **Section**: Telephonie > Tableau de bord

---

## Concepts pour debutants

Le **tableau de bord VoIP** est la page d'accueil du module de telephonie de Koraline. Il offre
une vue d'ensemble en temps reel de l'activite telephonique de BioCycle Peptides : appels du jour,
agents connectes, messagerie vocale, et etat des connexions avec le fournisseur VoIP (Telnyx).

Ce tableau de bord est concu pour etre consulte en debut de journee ou a tout moment pour evaluer
rapidement la charge de travail et identifier les points d'attention (appels manques, messagerie
vocale non lue, problemes de connexion).

La telephonie de Koraline repose sur le protocole **VoIP** (Voice over Internet Protocol), qui
permet de passer et recevoir des appels via Internet plutot que par des lignes telephoniques
traditionnelles. Le fournisseur principal est **Telnyx**, un operateur VoIP canadien.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. La premiere page affichee est le tableau de bord.
3. L'URL directe est : `/admin/telephonie`

---

## Apercu de l'interface

### En-tete
Titre "Tableau de bord telephonie" avec sous-titre descriptif.

### Cartes KPI
Le composant **CallStats** affiche les indicateurs cles du jour :

| KPI | Description |
|-----|-------------|
| **Appels aujourd'hui** | Nombre total d'appels (entrants + sortants) |
| **Appels repondus** | Nombre d'appels decroches avec succes |
| **Appels manques** | Nombre d'appels non repondus |
| **Duree moyenne** | Duree moyenne des appels du jour |
| **Satisfaction** | Score de satisfaction moyen (sondages post-appel) |
| **Agents actifs** | Nombre d'agents actuellement connectes |
| **Messagerie non lue** | Nombre de messages vocaux non ecoutes |

### Etat des connexions
Section affichant les connexions VoIP configurees :
- **Telnyx** : Icone de verification verte si active, rouge si desactivee
- **Statut de synchronisation** : Derniere mise a jour
- Chaque fournisseur affiche son etat (connecte/deconnecte)

### Appels recents
Tableau des 10 derniers appels avec :
- **Direction** : Icone fleche entrante (bleu) ou sortante (vert)
- **Appelant** : Nom ou numero de l'appelant, avec lien CRM si le client est identifie
- **Appele** : Numero compose
- **Agent** : Nom et extension de l'agent
- **Statut** : Badge colore (Complete, Manque, Messagerie, En cours, Echoue, Transfere, Sonne)
- **Duree** : Temps de conversation
- **Date** : Horodatage de l'appel
- **Satisfaction** : Badge de score si un sondage a ete complete

Un lien **Voir tout** redirige vers le journal d'appels complet.

---

## Fonctions detaillees

### Indicateurs de statut des appels

| Statut | Couleur | Signification |
|--------|---------|---------------|
| **COMPLETED** | Vert | Appel termine normalement |
| **MISSED** | Rouge | Appel non repondu |
| **VOICEMAIL** | Orange | Appel redirige vers la messagerie vocale |
| **IN_PROGRESS** | Bleu | Appel en cours |
| **FAILED** | Gris | Echec technique de l'appel |
| **TRANSFERRED** | Violet | Appel transfere a un autre agent |
| **RINGING** | Jaune | Appel en train de sonner |

### Badge de satisfaction
Le composant **SatisfactionBadge** affiche le score du sondage post-appel :
- Score >= 4/5 : Badge vert
- Score 3/5 : Badge jaune
- Score <= 2/5 : Badge rouge
- Pas de sondage : Aucun badge

---

## Workflows courants

### Workflow 1 : Evaluation matinale de l'activite
1. Ouvrez le tableau de bord telephonie en debut de journee.
2. Verifiez le nombre de **messageries non lues** et traitez-les en priorite.
3. Consultez les **appels manques** de la veille et rappelez les clients si necessaire.
4. Verifiez que les connexions VoIP sont actives (icone verte).

### Workflow 2 : Identifier un probleme de connexion
1. Consultez la section **Etat des connexions**.
2. Si une connexion affiche une icone rouge, allez dans **Connexions** pour diagnostiquer.
3. Testez la connexion et verifiez les identifiants API.

---

## FAQ

**Q : Les donnees sont-elles en temps reel ?**
R : Les KPI sont calcules a partir des donnees du jour et se mettent a jour a chaque
rechargement de la page.

**Q : Pourquoi la satisfaction affiche "N/A" ?**
R : Les sondages post-appel doivent etre configures et actives. Sans sondage, aucun score
n'est collecte.

**Q : Que faire si la connexion Telnyx est desactivee ?**
R : Allez dans **Connexions** pour verifier les cles API et reactiver la connexion.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **VoIP** | Voice over Internet Protocol, technologie de telephonie par Internet |
| **Telnyx** | Fournisseur de services VoIP utilise par BioCycle Peptides |
| **KPI** | Key Performance Indicator, indicateur cle de performance |
| **SIP** | Session Initiation Protocol, protocole utilise pour les appels VoIP |
| **Extension** | Numero interne attribue a un agent pour recevoir des appels |

---

## Pages associees

- [Journal d'appels](./02-journal.md) : Historique complet de tous les appels
- [Wallboard](./05-wallboard.md) : Vue temps reel du centre d'appels
- [Connexions](./19-connexions.md) : Configurer les fournisseurs VoIP
- [Parametres](./22-parametres.md) : Configuration globale de la telephonie
