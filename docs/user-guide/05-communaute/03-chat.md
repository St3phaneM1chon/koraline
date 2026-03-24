# Chat Support en Direct

> **Section**: Communaute > Chat
> **URL**: `/admin/chat`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Chat** est le centre de messagerie en direct de votre boutique BioCycle Peptides. Elle permet de communiquer en temps reel avec les visiteurs du site qui utilisent le widget de chat integre. C'est l'outil ideal pour repondre instantanement aux questions de pre-achat, resoudre des problemes et offrir un service client reactif.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les conversations actives, en attente et archivees
- Repondre en temps reel aux visiteurs du site
- Recevoir des notifications quand un visiteur attend une reponse
- Voir la langue du visiteur et beneficier de la traduction automatique
- Envoyer des images et des pieces jointes
- Utiliser des emojis dans vos reponses
- Voir l'indicateur de frappe du visiteur ("est en train d'ecrire...")
- Basculer votre statut entre en ligne et hors ligne
- Fermer, resoudre ou archiver une conversation
- Exporter l'historique d'une conversation en CSV
- Voir la page que le visiteur consulte actuellement

---

## Concepts cles pour les debutants

### Qu'est-ce que le chat en direct ?
C'est un systeme de messagerie instantanee integre au site web. Les visiteurs voient une petite bulle de chat en bas de leur ecran. En cliquant dessus, ils ouvrent une fenetre de conversation ou ils peuvent poser des questions en temps reel.

### Que signifient les statuts de conversation ?
- **Active** : la conversation est en cours, les deux parties echangent des messages
- **En attente admin** : le visiteur a envoye un message et attend votre reponse (prioritaire)
- **Resolue** : le probleme du visiteur a ete traite
- **Fermee** : la conversation est terminee
- **Archivee** : la conversation est archivee pour reference

### Comment fonctionne la traduction automatique ?
Le systeme detecte automatiquement la langue du visiteur. Quand vous repondez en francais, votre message est traduit dans la langue du visiteur. Vous pouvez voir le message original via le menu "Voir l'original" sous chaque message traduit.

### Que fait le chatbot automatique ?
Quand vous etes hors ligne, un chatbot peut prendre le relais pour repondre aux questions simples. Les messages du bot sont identifies par un badge violet "Bot". Quand vous revenez en ligne, vous prenez la suite de la conversation.

### Que signifie le statut "En ligne / Hors ligne" ?
- **En ligne** : les visiteurs voient que vous etes disponible et peuvent initier une conversation
- **Hors ligne** : les visiteurs voient que vous n'etes pas disponible ; le chatbot prend le relais si active

---

## Comment y acceder

### Methode 1 : Via le rail de navigation
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la colonne d'icones a gauche, cliquez sur l'icone **Communaute**
3. Dans le panneau lateral, cliquez sur **Chat Support**
4. Un badge rouge apparait sur l'icone si des conversations sont en attente

### Methode 2 : Via la barre de recherche
1. Tapez "chat" dans la barre de recherche
2. Selectionnez le resultat correspondant

### Methode 3 : Acces direct par URL
1. Rendez-vous a l'adresse `/admin/chat` dans votre navigateur

---

## Vue d'ensemble de l'interface

L'interface de chat est divisee en **3 zones principales** (disposition specifique au chat) :

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Icone | Fonction |
|--------|-------|----------|
| **Nouveau message** | Enveloppe | Mettre le focus sur le champ de saisie pour repondre rapidement |
| **Fermer la conversation** | Cercle X | Fermer la conversation selectionnee |
| **Transferer** | Fleche de transfert | Transferer la conversation a un autre agent (fonctionnalite a venir) |
| **Marquer resolue** | Coche verte | Marquer la conversation comme resolue |
| **Archiver** | Boite d'archive | Archiver la conversation selectionnee |
| **Exporter historique** | Telecharger | Exporter les messages de la conversation en CSV |

### 2. L'en-tete avec statistiques et statut

En haut a droite de la page :
- **Badges de statut** : nombre de conversations actives (vert), en attente (orange clignotant), non lues (rouge)
- **Bouton En ligne / Hors ligne** : basculer votre disponibilite d'un clic

### 3. La zone de travail a deux panneaux

**Panneau gauche (liste des conversations) :**
- Chaque conversation affiche :
  - Le nom ou l'email du visiteur (ou un identifiant anonyme)
  - Un point vert si le visiteur est actuellement en ligne, gris sinon
  - Un apercu du dernier message
  - La langue du visiteur (code ISO : FR, EN, DE, etc.)
  - Le temps ecoule depuis le dernier message
  - Un triangle jaune si la conversation est en attente admin
  - Un badge rouge avec le nombre de messages non lus

**Panneau droit (fenetre de conversation) :**
- **En-tete** : nom du visiteur, langue, email, page en cours de consultation, statut en ligne
- **Zone de messages** : bulles de conversation (bleu pour l'admin, blanc pour le visiteur, violet pour le bot)
  - Chaque message affiche l'expediteur, l'heure, et les coches de lecture (une coche = envoye, double coche = lu)
  - Les images envoyees s'affichent directement dans la conversation
  - Le lien "Voir l'original" permet de consulter le message avant traduction
- **Indicateur de frappe** : "X est en train d'ecrire..." avec animation
- **Barre de saisie** : champ de texte, bouton d'envoi d'image, selecteur d'emojis, bouton Envoyer
- **Indice de traduction** : rappel que les messages sont traduits automatiquement

---

## Fonctions detaillees

### Repondre a un visiteur

1. Selectionnez la conversation dans la liste de gauche
2. Les messages s'affichent dans le panneau droit
3. Tapez votre reponse dans le champ de saisie en bas
4. Appuyez sur **Entree** pour envoyer (ou cliquez le bouton Envoyer)
5. Votre message apparait immediatement dans la conversation
6. Le visiteur recoit la traduction dans sa langue si elle differe de la votre

> **Astuce** : utilisez Shift+Entree pour sauter une ligne sans envoyer le message.

### Envoyer une image

1. Dans la barre de saisie, cliquez sur l'icone **Image** (a gauche du champ de texte)
2. Selectionnez un fichier image depuis votre ordinateur (JPEG, PNG, WebP, GIF)
3. L'image est telechargee puis envoyee dans la conversation
4. Le visiteur voit l'image directement dans son widget de chat

### Utiliser les emojis

1. Cliquez sur l'icone **Smiley** a cote du champ de texte
2. Un panneau de 32 emojis courants apparait
3. Cliquez sur un emoji pour l'inserer dans votre message
4. Le panneau se ferme automatiquement

### Basculer en ligne / hors ligne

1. Cliquez sur le bouton **En ligne** (vert) ou **Hors ligne** (gris) en haut a droite
2. Le statut est mis a jour immediatement
3. Quand vous passez hors ligne, les visiteurs voient un message indiquant que le support n'est pas disponible

### Fermer ou archiver une conversation

1. Selectionnez la conversation
2. Cliquez sur **Fermer la conversation** (le visiteur voit un message de cloture) ou **Archiver** (la conversation disparait de la liste active)
3. Vous pouvez aussi utiliser **Marquer resolue** si le probleme est traite

### Exporter l'historique d'une conversation

1. Selectionnez la conversation dont vous souhaitez garder une trace
2. Cliquez sur **Exporter historique** dans le ruban
3. Un fichier CSV est telecharge avec les colonnes : Date, Expediteur, Langue, Message

---

## Scenarios courants

### Scenario 1 : Traiter les conversations en attente

1. Ouvrez la page Chat
2. Passez votre statut sur **En ligne** si vous ne l'etes pas deja
3. Identifiez les conversations avec le badge orange "En attente" ou le triangle jaune
4. Cliquez sur la premiere conversation en attente
5. Lisez le dernier message du visiteur
6. Redigez et envoyez votre reponse
7. Passez a la conversation suivante
8. Une fois toutes les conversations traitees, verifiez que le badge rouge "non lus" a disparu

### Scenario 2 : Aider un client etranger avec la traduction automatique

1. Un visiteur envoie un message en allemand (le badge "DE" apparait)
2. Selectionnez la conversation
3. Le message du visiteur est affiche traduit dans votre langue
4. Redigez votre reponse normalement en francais
5. Le systeme traduit automatiquement votre reponse en allemand pour le visiteur
6. Si la traduction semble imprecise, cliquez sur "Voir l'original" pour verifier le message source

### Scenario 3 : Fin de journee -- cloturer les conversations ouvertes

1. Parcourez la liste des conversations actives
2. Pour chaque conversation terminee :
   - Si le probleme est resolu : cliquez **Marquer resolue**
   - Si la conversation est inactive depuis longtemps : cliquez **Fermer la conversation**
3. Passez votre statut sur **Hors ligne**
4. Le chatbot automatique prendra le relais si il est active

---

## Foire aux questions (FAQ)

**Q : Les conversations sont-elles mises a jour en temps reel ?**
R : Oui. Le systeme utilise le streaming SSE (Server-Sent Events) pour recevoir les nouveaux messages instantanement. Un rafraichissement de secours s'effectue toutes les 30 secondes au cas ou une connexion SSE serait perdue.

**Q : Que se passe-t-il si je suis hors ligne et qu'un visiteur envoie un message ?**
R : Si le chatbot est active, il tente de repondre. Sinon, le visiteur voit un message indiquant que le support n'est pas disponible. Les messages sont conserves et vous les retrouverez a votre retour.

**Q : La traduction automatique est-elle fiable ?**
R : Elle est suffisante pour des echanges courants. Pour des sujets techniques complexes, verifiez le message original en cliquant sur "Voir l'original" et adaptez votre reponse si necessaire.

**Q : Puis-je voir quelle page le visiteur consulte ?**
R : Oui. L'en-tete de la conversation affiche la page en cours de consultation du visiteur (icone de localisation), ce qui vous aide a comprendre le contexte de sa question.

**Q : Combien de conversations puis-je gerer simultanement ?**
R : Il n'y a pas de limite technique. Le systeme charge jusqu'a 100 conversations. En pratique, gerer 3 a 5 conversations simultanees est confortable pour maintenir un temps de reponse rapide.

---

## Strategie expert : Scripts de reponse et conversion par chat pour un e-commerce de peptides

### Temps de reponse cible et impact sur la conversion

Le chat en direct est le canal de support avec le plus fort taux de conversion en e-commerce. Respecter des temps de reponse stricts est essentiel.

**Objectifs de temps de reponse :**

| Periode | Temps cible | Temps maximum acceptable |
|---------|-------------|--------------------------|
| **Heures ouvrables** (9h-17h EST) | < 2 minutes | 5 minutes |
| **Heures etendues** (17h-21h EST) | < 5 minutes | 15 minutes |
| **Hors heures** | Chatbot immediat + reponse humaine le matin suivant | Avant 10h le jour ouvrable suivant |

**Impact mesure sur la conversion :**
- Taux de conversion chat vers vente : 10-15% en moyenne (contre 2-3% pour un visiteur sans interaction)
- Valeur moyenne du panier apres interaction chat : +20% par rapport a la moyenne du site
- Taux de satisfaction client avec chat en direct : 73% (le plus eleve de tous les canaux, LiveChat Inc.)

### Scripts de reponse par situation

#### Situation 1 : Question sur un produit peptide

> **Client** : "Bonjour, je cherche du BPC-157, est-ce que votre produit est de qualite recherche ?"
>
> **Script recommande** : "Bonjour ! Oui, tous nos peptides sont de qualite recherche, synthetises en conditions GMP et accompagnes d'un certificat d'analyse (CoA) par lot. Pour le BPC-157, nous proposons des flacons de 5mg et 10mg avec une purete superieure a 98%. Souhaitez-vous que je vous envoie le CoA du lot actuellement en stock ?"

**Points cles :** Toujours mentionner la purete, le certificat d'analyse et la qualite recherche. Ne jamais faire de claims medicaux ou therapeutiques (conformite Sante Canada et FDA).

#### Situation 2 : Probleme de livraison

> **Client** : "Ma commande #12345 aurait du arriver il y a 3 jours, je n'ai rien recu."
>
> **Script recommande** : "Je comprends votre inquietude et je m'en occupe immediatement. Laissez-moi verifier le suivi de votre commande #12345. [Verification] Votre colis a ete expedie le [date] via [transporteur] avec le numero de suivi [numero]. Le dernier scan indique [statut]. Je vais contacter le transporteur pour accelerer la resolution. En attendant, souhaitez-vous que je vous envoie les details de suivi par email ?"

**Points cles :** Toujours verifier le suivi avant de repondre. Ne jamais blamer le transporteur devant le client. Proposer une action concrete et un suivi proactif.

#### Situation 3 : Demande de remboursement

> **Client** : "Le produit que j'ai recu ne correspond pas a ma commande, je veux un remboursement."
>
> **Script recommande** : "Je suis desole pour cette erreur. C'est tout a fait inacceptable et je comprends votre frustration. Pouvez-vous me preciser quel produit vous avez recu et quel produit etait attendu ? Je vais lancer immediatement la procedure de correction. Vous aurez le choix entre un remplacement en expedition prioritaire ou un remboursement complet. Quelle option preferez-vous ?"

**Points cles :** S'excuser sincerement sans justification excessive. Donner le choix au client (remplacement ou remboursement). Resoudre en un seul contact si possible.

#### Situation 4 : Question technique sur les peptides

> **Client** : "Comment reconstituer le TB-500 ? Quelle quantite d'eau bacteriostatique utiliser ?"
>
> **Script recommande** : "Excellente question ! Pour les peptides lyophilises comme le TB-500, nous recommandons d'utiliser de l'eau bacteriostatique. Vous trouverez un guide de reconstitution detaille dans la section documentation de votre espace client, ainsi que sur la fiche produit. Pour des dosages specifiques a votre protocole de recherche, je vous recommande de consulter la litterature scientifique pertinente. Avez-vous besoin du lien vers le guide ?"

**Points cles :** Fournir des informations factuelles sur la manipulation. Rediriger vers la documentation officielle. Ne jamais donner de conseils de dosage a usage humain (conformite reglementaire).

### Regles d'escalade vers le telephone

Certaines situations ne se pretent pas au chat et doivent etre escaladees vers un appel telephonique :

| Declencheur d'escalade | Raison | Action |
|------------------------|--------|--------|
| Client visiblement frustre apres 3+ echanges | Le chat amplifie la frustration | "Puis-je vous appeler directement pour resoudre cela plus efficacement ?" |
| Commande superieure a 500$ avec probleme | Enjeu financier important | Proposer un rappel dans les 15 minutes |
| Question technique complexe necesitant discussion | Le chat n'est pas adapte aux echanges longs | Proposer un rendez-vous telephonique |
| Plainte potentiellement publique (menace d'avis negatif) | Desamorcer avant publication | Appel immediat avec superviseur |
| Client B2B / distributeur / institution | Relation commerciale strategique | Transfert vers le responsable commercial |

### Metriques de performance du chat

Suivre ces indicateurs chaque semaine pour optimiser le canal :

| Indicateur | Cible | Calcul |
|------------|-------|--------|
| Temps de premiere reponse | < 2 min | Moyenne du delai entre le premier message client et la premiere reponse agent |
| Taux de resolution au premier contact | > 80% | Conversations resolues sans escalade ni suivi |
| Taux de conversion chat vers vente | 10-15% | Commandes passees dans les 24h suivant une session chat |
| Score de satisfaction (CSAT) | > 4.5/5 | Sondage post-conversation |
| Conversations par agent par heure | 3-5 simultanees | Charge de travail optimale sans degradation de qualite |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **SSE** | Server-Sent Events, technologie de communication en temps reel du serveur vers le navigateur |
| **Widget de chat** | Bulle de conversation visible par les visiteurs en bas a droite du site |
| **Chatbot** | Agent automatise qui repond aux visiteurs quand l'administrateur est hors ligne |
| **Traduction automatique** | Traduction instantanee des messages entre la langue de l'admin et celle du visiteur |
| **Indicateur de frappe** | Animation montrant que l'autre personne est en train d'ecrire |
| **Coches de lecture** | Une coche = message envoye, double coche = message lu par le destinataire |

---

## Pages liees

- [Avis clients](/admin/avis) -- pour les retours post-achat (publics)
- [Questions produits](/admin/questions) -- pour les questions posees sur les fiches produits
- [Emails](/admin/emails) -- pour la communication email avec les clients
- [CRM](/admin/crm) -- pour le suivi des contacts et opportunites commerciales
