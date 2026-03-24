# Emails envoyes

> **Section**: Emails > Emails envoyes

---

## Concepts pour debutants

Le dossier **Emails envoyes** contient l'historique complet de tous les emails expedies depuis
Koraline, que ce soit des reponses individuelles aux clients, des emails transactionnels
(confirmations de commande, notifications d'expedition), ou des emails marketing envoyes via
les campagnes.

Ce dossier est essentiel pour la tracabilite : il permet de verifier ce qui a ete communique
a un client, quand, et par quel agent.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Favoris**, cliquez sur **Envoyes**.
3. Vous pouvez aussi naviguer via **Compte** > **Envoyes**.
4. L'URL directe est : `/admin/emails?folder=sent`

---

## Apercu de l'interface

### Liste des emails envoyes
Chaque email envoye affiche :
- **Destinataire** : Nom ou adresse email du destinataire
- **Objet** : Ligne d'objet de l'email
- **Date d'envoi** : Horodatage de l'expedition
- **Statut de livraison** : Indicateur visuel (delivre, rebondi, echoue)
- **Apercu** : Premiers caracteres du contenu

### Barre de recherche
Recherchez un email envoye par destinataire, objet ou contenu.

### Filtres
- Par periode (date de debut / date de fin)
- Par statut de livraison (delivre, rebondi, echoue)
- Par type (reponse manuelle, transactionnel, campagne)

---

## Fonctions detaillees

### Consultation d'un email envoye
Cliquez sur un email pour voir :
- Le contenu HTML complet tel qu'il a ete envoye
- Les pieces jointes incluses
- Les informations de suivi (ouverture, clics)
- Le lien vers la conversation associee

### Statuts de livraison
| Statut | Description |
|--------|-------------|
| **Delivre** | L'email a ete accepte par le serveur destinataire |
| **Rebondi** | L'email a ete rejete (adresse invalide, boite pleine) |
| **Echoue** | L'envoi a echoue pour une raison technique |
| **En cours** | L'email est en file d'attente d'envoi |

### Suivi des ouvertures et clics
Pour les emails marketing et campagnes, Koraline integre un pixel de suivi permettant de savoir
si le destinataire a ouvert l'email et s'il a clique sur les liens.

---

## Workflows courants

### Workflow 1 : Verifier qu'un email a bien ete envoye
1. Ouvrez le dossier **Envoyes**.
2. Recherchez le destinataire dans la barre de recherche.
3. Verifiez le statut de livraison de l'email.
4. Cliquez sur l'email pour voir les details de suivi.

### Workflow 2 : Retrouver un email transactionnel
1. Filtrez par type **Transactionnel**.
2. Definissez la plage de dates correspondant a la commande.
3. Recherchez par numero de commande ou nom du client.

---

## FAQ

**Q : Puis-je renvoyer un email echoue ?**
R : Oui, depuis le detail de l'email, un bouton permet de retenter l'envoi.

**Q : Les emails envoyes depuis les campagnes apparaissent-ils ici ?**
R : Oui, tous les emails envoyes sont consolides dans ce dossier, quelle que soit leur origine.

**Q : Combien de temps les emails envoyes sont-ils conserves ?**
R : Les emails sont conserves indefiniment dans la base de donnees. Un archivage automatique
peut etre configure dans les parametres.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Email transactionnel** | Email automatique declenche par une action (commande, inscription) |
| **Email marketing** | Email promotionnel envoye via une campagne |
| **Rebond (bounce)** | Email rejete par le serveur destinataire |
| **Pixel de suivi** | Image invisible integree a l'email pour detecter les ouvertures |

---

## Pages associees

- [Boite de reception](./01-inbox.md) : Gerer les emails entrants
- [Brouillons](./03-brouillons.md) : Emails en cours de redaction
- [Analytics emails](./07-analytics.md) : Statistiques de delivrabilite detaillees
