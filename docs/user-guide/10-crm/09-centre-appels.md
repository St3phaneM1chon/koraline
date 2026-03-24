# Centre d'Appels, SMS et WhatsApp

> **Section**: CRM > Centre d'appels
> **URL**: `/admin/crm/dialer`, `/admin/crm/wallboard`, `/admin/crm/agents/performance`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

Le **Centre d'appels** integre dans le CRM permet a votre equipe de passer et recevoir des appels telephoniques directement depuis l'interface Koraline, sans quitter le navigateur. Il integre aussi les campagnes SMS et les communications multicanal.

**En tant que gestionnaire, vous pouvez :**
- Passer des appels depuis le navigateur (softphone integre)
- Recevoir des appels entrants avec identification du contact
- Enregistrer les appels pour le controle qualite
- Suivre les performances des agents en temps reel (wallboard)
- Lancer des campagnes d'appels sortants (power dialer)
- Gerer les files d'attente et les horaires
- Analyser les metriques du centre d'appels (temps d'attente, duree, abandons)
- Envoyer des SMS et campagnes SMS depuis la plateforme
- Planifier les equipes et suivre l'adherence aux horaires

---

## Concepts de base pour les debutants

### Qu'est-ce qu'un softphone ?

Un **softphone** est un telephone logiciel qui fonctionne dans votre navigateur. Pas besoin d'un telephone physique : vous utilisez le micro et les haut-parleurs de votre ordinateur (ou un casque) pour passer et recevoir des appels.

### Comment ca marche techniquement ?

BioCycle Peptides utilise **Telnyx** comme fournisseur de telephonie VoIP. Les appels transitent par Internet, ce qui permet :
- Des couts d'appel reduits
- L'integration directe avec le CRM (identification du contact, historique)
- L'enregistrement des conversations
- Des numeros locaux canadiens

### Les differents modes d'appel

| Mode | Description | Usage |
|------|-------------|-------|
| **Click-to-call** | Cliquez sur un numero pour appeler | Appels individuels depuis une fiche contact |
| **Power dialer** | Le systeme appelle automatiquement une liste de contacts | Campagnes de prospection |
| **Preview dialer** | Affiche la fiche avant de lancer l'appel | Appels de suivi personnalises |
| **Appels entrants** | Les appels arrivent dans la file d'attente | Service client, support |

---

## Comment y acceder

Les pages du centre d'appels sont dans le groupe **Centre d'appels** du panneau CRM :

| Page | URL | Description |
|------|-----|-------------|
| **Dialeur** | `/admin/crm/dialer` | Interface de gestion des appels |
| **Wallboard** | `/admin/crm/wallboard` | Ecran de supervision en temps reel |
| **Performance agents** | `/admin/crm/agents/performance` | Metriques individuelles des agents |
| **Representants 360** | `/admin/crm/reps` | Vue complete d'un representant |
| **Analytique appels** | `/admin/crm/call-analytics` | Rapports detailles sur les appels |
| **KPIs centre d'appels** | `/admin/crm/call-center-kpis` | Indicateurs cles du centre |
| **Planification** | `/admin/crm/scheduling` | Gestion des horaires et quarts |
| **Adherence** | `/admin/crm/adherence` | Suivi du respect des horaires |

---

## Vue d'ensemble de l'interface

### Page Dialeur (`/admin/crm/dialer`)

L'interface principale du centre d'appels avec :

**Zone gauche** : Liste des contacts a appeler
- File d'attente des appels entrants
- Liste de campagne (pour le power dialer)
- Historique des appels recents

**Zone centrale** : Le softphone
- Pave numerique
- Boutons : appeler, raccrocher, mettre en attente, transferer, muet
- Timer de duree d'appel
- Indicateur de qualite audio

**Zone droite** : Fiche contact
- Informations du contact (identifie automatiquement pour les appels entrants)
- Historique des interactions
- Notes d'appel
- Deals et commandes associes

### Wallboard (`/admin/crm/wallboard`)

Ecran de supervision concu pour etre affiche sur un ecran TV ou moniteur :

| Metrique | Description |
|----------|-------------|
| **Appels en cours** | Nombre d'appels actifs en ce moment |
| **En attente** | Nombre d'appelants dans la file d'attente |
| **Temps attente moyen** | Combien de temps les appelants attendent |
| **Agents disponibles** | Nombre d'agents prets a prendre un appel |
| **Agents en appel** | Nombre d'agents actuellement en conversation |
| **Agents en pause** | Nombre d'agents en pause |
| **Appels traites aujourd'hui** | Compteur du jour |
| **Taux d'abandon** | Pourcentage d'appelants qui raccrochent avant d'etre servis |
| **SLA** | Pourcentage d'appels repondus dans le delai cible (ex: 80% en 20 sec) |

### Performance agents (`/admin/crm/agents/performance`)

Metriques individuelles :
- Nombre d'appels traites (entrants + sortants)
- Duree moyenne de conversation
- Temps moyen de traitement post-appel
- Taux de resolution au premier appel
- Score qualite (si evaluation QA activee)
- Adherence aux horaires (%)

---

## Fonctionnalites detaillees

### 1. Passer un appel

**Methode click-to-call** :
1. Ouvrez la fiche d'un contact
2. Cliquez sur le numero de telephone (lien cliquable)
3. Le softphone se lance automatiquement
4. Attendez que le contact decroche
5. Pendant l'appel, prenez des notes dans le champ prevu
6. Apres l'appel, ajoutez un resume et une disposition (resultat)

**Dispositions d'appel** :
| Disposition | Signification |
|-------------|---------------|
| **Repondu - Interesse** | Le contact est interesse, prochaine etape definie |
| **Repondu - Pas interesse** | Contact non interesse |
| **Repondu - Rappeler** | Demande d'etre rappele plus tard |
| **Messagerie vocale** | Tombe sur la boite vocale |
| **Pas de reponse** | Personne n'a decroche |
| **Numero invalide** | Numero hors service ou incorrect |
| **Occupe** | Ligne occupee |

### 2. Recevoir un appel entrant

1. Un appel arrive dans le systeme
2. Le systeme identifie le numero et affiche la fiche contact (si existant)
3. Une notification apparait avec le nom du contact
4. Cliquez sur **Accepter** pour repondre
5. La fiche contact s'ouvre automatiquement
6. Apres l'appel, ajoutez notes et disposition

### 3. Lancer une campagne d'appels (Power Dialer)

**Etapes** :
1. Preparez une liste de contacts a appeler (ou utilisez un segment)
2. Allez dans le dialeur
3. Cliquez sur **Campagne** et selectionnez votre liste
4. Configurez :
   - Nombre de lignes simultanees (1 a 3 par agent)
   - Script d'appel (texte que l'agent peut suivre)
   - Dispositions disponibles
5. Cliquez sur **Lancer la campagne**
6. Le systeme appelle automatiquement le prochain contact quand l'agent est disponible

### 4. Gerer les campagnes SMS

**URL** : `/admin/crm/sms-campaigns`

**Etapes** :
1. Cliquez sur **Nouvelle campagne SMS**
2. Selectionnez un modele SMS ou redigez le message
3. Personnalisez avec des variables ({prenom}, {nom_produit})
4. Selectionnez l'audience (liste ou segment)
5. Planifiez ou envoyez immediatement
6. Suivez les taux de livraison et les reponses

### 5. Planifier les equipes

**URL** : `/admin/crm/scheduling`

- Creez des quarts de travail (shifts)
- Assignez les agents aux quarts
- Gerez les pauses et les conges
- Le systeme optimise la couverture selon les volumes prevus

### 6. Suivi de l'adherence

**URL** : `/admin/crm/adherence`

- Comparez le planning prevu vs le temps reel
- Identifiez les agents en retard ou absents
- Mesurez le taux de conformite aux horaires
- Generez des rapports pour la gestion des ressources humaines

---

## Workflows courants

### Journee type d'un agent du centre d'appels
1. Connexion au systeme : passez en statut "Disponible"
2. Traitez les appels entrants de la file d'attente
3. Entre les appels, travaillez la campagne sortante
4. Prenez des pauses planifiees (passez en statut "Pause")
5. En fin de journee, passez en statut "Hors ligne"

### Mise en place d'une campagne de prospection B2B
1. Creez un segment "Cliniques Quebec sans commande"
2. Creez une campagne d'appels avec un script adapte
3. Assignez 2-3 agents a la campagne
4. Lancez le power dialer
5. Suivez les resultats sur le wallboard
6. Analysez les dispositions : combien d'interesses ?

---

## Questions frequentes (FAQ)

**Q : Ai-je besoin d'un casque ?**
R : Fortement recommande. Un casque avec microphone offre une bien meilleure qualite audio que les haut-parleurs de l'ordinateur, et evite les echos.

**Q : Les appels sont-ils enregistres ?**
R : Oui, si la fonctionnalite est activee dans les parametres. Au Canada, la loi exige d'informer l'interlocuteur qu'il est enregistre (un message automatique peut etre joue en debut d'appel).

**Q : Combien coute un appel ?**
R : Les tarifs dependent du plan Telnyx. En general : appels locaux canadiens ~0.01 $CA/min, interurbains ~0.02 $CA/min. Les appels entrants sont generalement gratuits.

**Q : Puis-je utiliser mon numero de telephone personnel ?**
R : Non. Le systeme utilise des numeros Telnyx dedies configures dans la section Telephonie. C'est necessaire pour l'identification, l'enregistrement et la conformite.

---

## Strategie expert : scripts d'appel adaptes au commerce de peptides

### Principes generaux

Un bon script d'appel n'est pas un texte rigide lu mot a mot. C'est un guide structurant qui assure la coherence et la qualite de chaque interaction, tout en laissant de la place a la conversation naturelle. Pour les peptides de recherche, le ton doit etre professionnel et technique -- vos interlocuteurs sont souvent des scientifiques.

### Script appel entrant : accueil et qualification

**Salutation bilingue** (OBLIGATOIRE pour le Quebec) :
> "BioCycle Peptides, bonjour! BioCycle Peptides, hello! Comment puis-je vous aider? How can I help you?"

*Continuer dans la langue choisie par l'appelant.*

**Phase 1 : Identification (30 secondes)**
> "Puis-je avoir votre nom et votre adresse email pour que je consulte votre dossier?"

*Rechercher le contact dans Koraline. Si existant, la fiche s'ouvre automatiquement.*

**Phase 2 : Qualification du besoin (1-2 minutes)**
> "D'accord [prenom]. Comment puis-je vous aider aujourd'hui?"

*Ecouter activement. Identifier si c'est :*
- Une question sur un produit → Transferer vers le guide produit
- Un probleme de commande → Ouvrir la commande dans le systeme
- Une question technique (reconstitution, dosage) → Fournir les informations ou proposer le guide PDF
- Une demande B2B (volume, COA, compte) → Transferer au representant B2B

**Phase 3 : Resolution et fermeture**
> "Y a-t-il autre chose que je puisse faire pour vous? Merci d'avoir appele BioCycle Peptides. Bonne journee!"

*Ajouter les notes dans la fiche contact. Selectionner la disposition d'appel.*

### Script relance panier abandonne

Ce script est utilise quand l'equipe appelle un client qui a abandonne un panier de valeur significative (> 150 $CA).

**Timing optimal** : 2 a 4 heures apres l'abandon. Au-dela de 24h, le taux de conversion chute drastiquement.

**Taux de conversion attendu** : 5 a 15% (nettement superieur aux emails de relance).

**Script** :
> "Bonjour [prenom], ici [votre nom] de BioCycle Peptides. Je vous appelle car j'ai vu que vous aviez commence une commande sur notre site plus tot aujourd'hui. Je voulais m'assurer que tout s'etait bien passe -- avez-vous rencontre un probleme technique ou avez-vous des questions sur les produits?"

*Scenarii de reponse :*

| Reponse client | Action |
|---------------|--------|
| "J'ai eu un probleme technique" | Aider a finaliser la commande par telephone ou renvoyer un lien de panier |
| "J'hesite sur le produit" | Repondre aux questions, proposer un COA, rassurer sur la qualite |
| "C'est trop cher" | Proposer le code promo abandon panier (10%) ou suggerer une quantite plus petite |
| "Je n'ai plus besoin" | Remercier, proposer de rester informe des promotions |
| "Je vais revenir plus tard" | Confirmer que le panier est sauvegarde, envoyer un rappel par email |

**Fermeture** :
> "Parfait! N'hesitez pas a nous appeler si vous avez d'autres questions. Vous pouvez aussi nous joindre par email a support@biocyclepeptides.com. Merci et bonne journee!"

### Script prospection B2B (appel sortant)

Pour les appels vers des laboratoires ou cliniques identifies comme prospects :

> "Bonjour, ici [votre nom] de BioCycle Peptides. Nous sommes un fournisseur canadien de peptides de recherche de haute purete. Je contacte votre laboratoire car nous avons vu que vous travaillez sur [domaine de recherche -- si connu]. Est-ce que [nom du PI] est disponible?"

*Si le PI est disponible :*
> "Docteur [nom], je serai bref. BioCycle Peptides fournit des peptides de recherche avec une purete de 98%+ et des COA complets. Nous offrons des prix competitifs pour les laboratoires canadiens, avec livraison en 2-3 jours. Puis-je vous envoyer notre catalogue et un COA d'echantillon?"

### Metriques de performance appels

| Metrique | Cible equipe | Cible agent individuel |
|----------|-------------|----------------------|
| Taux de reponse appels entrants | > 85% en < 20 secondes | -- |
| Duree moyenne appel entrant | 3-5 minutes | 3-5 minutes |
| Taux de resolution au premier appel | > 70% | > 70% |
| Appels sortants par jour (prospection) | -- | 20-30 appels |
| Taux de contact (sortant) | -- | 30-40% |
| Taux de conversion panier abandonne (appel) | 5-15% | > 8% |
| Score qualite (evaluation QA) | > 80/100 | > 80/100 |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Softphone** | Telephone logiciel fonctionnant dans le navigateur |
| **VoIP** | Voice over IP, appels telephoniques via Internet |
| **Wallboard** | Ecran de supervision en temps reel du centre d'appels |
| **Power dialer** | Systeme appelant automatiquement une liste de contacts |
| **Disposition** | Resultat d'un appel (repondu, messagerie, pas de reponse, etc.) |
| **SLA** | Service Level Agreement, objectif de temps de reponse |
| **Adherence** | Respect des horaires planifies par les agents |
| **File d'attente** | Queue dans laquelle les appels entrants attendent un agent |

---

## Pages reliees

- [Telephonie](/admin/telephonie) : Configuration des connexions VoIP et numeros
- [Contacts](/admin/crm/contacts) : Fiches des contacts appeles
- [Automatisations](/admin/crm/workflows) : Workflows incluant des appels
- [Campagnes SMS](/admin/crm/sms-campaigns) : Envoi de SMS marketing
- [Rapports](/admin/crm/call-analytics) : Analytique detaillee des appels
- [Leaderboard](/admin/crm/leaderboard) : Classement des performances
