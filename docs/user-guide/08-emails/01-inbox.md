# Boite de reception (Inbox)

> **Section**: Emails > Boite de reception

---

## Concepts pour debutants

La boite de reception de Koraline fonctionne comme un client email de type Outlook integre directement dans
le panneau d'administration. Elle centralise toutes les conversations entrantes des clients de BioCycle
Peptides en un seul endroit. Chaque email entrant cree automatiquement une **conversation** qui regroupe
l'ensemble des echanges avec un meme client sur un meme sujet.

Contrairement a un client email classique, cette boite de reception est enrichie avec les donnees CRM :
vous voyez immediatement le nom du client, son niveau de fidelite, et l'agent assigne a la conversation.
Cela permet de repondre plus rapidement et avec un meilleur contexte.

Les conversations ont un cycle de vie defini par des **statuts** : Nouveau, Ouvert, En attente, Resolu
et Ferme. Ces statuts permettent a toute l'equipe de savoir ou en est chaque demande client.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche (icone enveloppe).
2. Dans le panneau de navigation, sous **Favoris**, cliquez sur **Boite de reception**.
3. L'URL directe est : `/admin/emails?folder=inbox`

---

## Apercu de l'interface

### Barre de recherche
En haut de la boite de reception se trouve un champ de recherche. Tapez un nom, une adresse email ou
un mot-cle pour filtrer les conversations en temps reel.

### Filtres de statut
Sous la barre de recherche, une rangee de boutons-filtres permet de trier par statut :

| Filtre | Description |
|--------|-------------|
| **Tous** | Affiche toutes les conversations |
| **Nouveau** | Conversations jamais ouvertes (icone cercle bleu) |
| **Ouvert** | Conversations en cours de traitement (icone alerte orange) |
| **En attente** | Conversations en attente d'une reponse du client (icone pause jaune) |
| **Resolu** | Conversations resolues (icone coche vert) |

Chaque filtre affiche un compteur indiquant le nombre de conversations dans cette categorie.

### Liste des conversations
Chaque conversation affiche :
- **Avatar du client** : Photo de profil ou initiale
- **Nom de l'expediteur** : Nom du client ou adresse email
- **Objet** : Ligne d'objet du dernier email
- **Apercu** : Les 100 premiers caracteres du dernier message
- **Horodatage relatif** : "il y a 5m", "il y a 2h", "il y a 3j", etc.
- **Indicateur de priorite** : Bordure gauche coloree (rouge = urgent, orange = haute)
- **Agent assigne** : Nom de l'agent s'occupant de la conversation
- **Tags** : Etiquettes de classification (maximum 2 affiches)
- **Compteur de messages** : Nombre total de messages dans le fil

### Panneau de detail
Lorsque vous cliquez sur une conversation, le panneau de droite affiche le **fil de conversation**
complet avec l'historique des echanges, les pieces jointes, et la barre latérale client (CRM).

### Ruban d'actions
Depuis le detail d'une conversation, vous pouvez :
- **Repondre** : Envoyer une reponse au client
- **Ajouter une note interne** : Note visible uniquement par l'equipe
- **Changer le statut** : Marquer comme resolu, en attente, etc.
- **Assigner** : Attribuer la conversation a un autre agent
- **Archiver** : Deplacer vers les archives

---

## Fonctions detaillees

### Actualisation automatique
La boite de reception se rafraichit automatiquement toutes les **30 secondes** pour afficher les
nouveaux messages sans recharger la page.

### Priorites des conversations
Les conversations sont classees par priorite, signalee par la bordure gauche :
- **Rouge** : Priorite urgente - a traiter immediatement
- **Orange** : Priorite haute - a traiter dans l'heure
- **Transparent** : Priorite normale
- **Gris** : Priorite basse

### Sidebar client (CRM)
A droite du fil de conversation, la sidebar affiche les informations CRM du client :
- Nom, email, photo de profil
- Niveau de fidelite (tier)
- Historique des commandes recentes
- Liens rapides vers la fiche client

### Reponses et notes
- **Repondre** : Composez votre reponse dans l'editeur integre. Les variables dynamiques
  (prenom, nom) sont disponibles.
- **Note interne** : Ajoutez des notes visibles uniquement par l'equipe interne. Utile pour
  documenter le contexte avant un transfert de conversation.

---

## Workflows courants

### Workflow 1 : Traiter un nouvel email client
1. Cliquez sur le filtre **Nouveau** pour voir les conversations non traitees.
2. Selectionnez une conversation pour lire le message.
3. Consultez la sidebar CRM pour comprendre le contexte client.
4. Redigez votre reponse dans l'editeur.
5. Cliquez sur **Envoyer**.
6. Changez le statut a **Resolu** si la demande est traitee, ou **En attente** si vous attendez
   une reponse du client.

### Workflow 2 : Escalader une conversation a un collegue
1. Ouvrez la conversation concernee.
2. Ajoutez une **note interne** expliquant le contexte et la raison du transfert.
3. Cliquez sur **Assigner** et selectionnez le collegue.
4. Le collegue verra la conversation apparaitre dans sa boite avec la note.

### Workflow 3 : Rechercher un echange passe
1. Tapez le nom du client ou un mot-cle dans la **barre de recherche**.
2. Les resultats s'affichent instantanement dans la liste.
3. Cliquez sur la conversation pour consulter l'historique complet.

---

## FAQ

**Q : Les emails sont-ils synchronises avec un serveur email externe ?**
R : Oui, les emails entrants sont recus via un webhook d'email entrant et stockes dans la base
de donnees Koraline. Les reponses sont envoyees via le service d'envoi configure (SendGrid, SMTP).

**Q : Puis-je voir les pieces jointes ?**
R : Oui, les pieces jointes sont accessibles dans le fil de conversation via l'API des pieces jointes.

**Q : Comment savoir si un email a ete lu ?**
R : Les conversations non lues apparaissent avec le statut **Nouveau**. Des qu'un agent ouvre la
conversation, elle passe automatiquement a **Ouvert**.

**Q : Combien de conversations peuvent s'afficher ?**
R : La liste affiche toutes les conversations correspondant au filtre actif, sans pagination.
Le rafraichissement automatique garantit que les nouvelles conversations apparaissent en temps reel.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Conversation** | Fil de messages regroupant tous les echanges avec un client sur un meme sujet |
| **Statut** | Etat d'avancement de la conversation (Nouveau, Ouvert, En attente, Resolu, Ferme) |
| **Priorite** | Niveau d'urgence de la conversation (Urgent, Haute, Normale, Basse) |
| **Note interne** | Message visible uniquement par les agents, pas envoye au client |
| **Tag** | Etiquette de classification appliquee a une conversation |
| **Assignation** | Action d'attribuer une conversation a un agent specifique |

---

## Pages associees

- [Emails envoyes](./02-envois.md) : Consulter les emails envoyes
- [Brouillons](./03-brouillons.md) : Gerer les emails en cours de redaction
- [Templates](./04-templates.md) : Creer des modeles d'email reutilisables
- [Campagnes](./05-campagnes.md) : Envoyer des emails en masse
- [Analytics emails](./07-analytics.md) : Statistiques de delivrabilite
