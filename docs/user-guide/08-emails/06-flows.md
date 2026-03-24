# Flows email (Sequences automatisees)

> **Section**: Emails > Flows

---

## Concepts pour debutants

Les **flows email** (ou sequences automatisees) sont des enchainements d'actions declenchees
automatiquement par un evenement. Par exemple : quand un client s'inscrit, Koraline envoie
automatiquement un email de bienvenue, attend 3 jours, puis envoie un email avec les produits
recommandes.

Un flow se compose de **noeuds** relies entre eux dans un editeur visuel :
- **Declencheur (Trigger)** : L'evenement qui demarre le flow
- **Email** : Un email a envoyer
- **Delai** : Une periode d'attente entre deux actions
- **Condition** : Un branchement selon les donnees du client
- **SMS** : Un message texte a envoyer

Les flows sont l'outil le plus puissant du module email car ils fonctionnent 24/7 sans
intervention humaine. Ils sont essentiels pour le cycle de vie client : accueil, relance
panier abandonne, reactivation, anniversaire, etc.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Gestion**, cliquez sur **Flows**.
3. L'URL directe est : `/admin/emails?tab=flows`

---

## Apercu de l'interface

### Liste des flows
L'ecran principal affiche tous les flows sous forme de cartes en grille (2 colonnes). Chaque flow
montre :
- **Nom** du flow
- **Declencheur** : L'evenement qui active le flow
- **Statut** : Actif (vert) ou Inactif (gris)
- **Composition** : Nombre d'emails, de delais et de conditions dans le flow
- **Statistiques** : Declenchements, envoyes, ouverts, revenus generes
- **Date de modification**

### Bouton "Nouveau workflow"
Lance l'editeur de flow pour creer un nouveau workflow.

### Actions par flow
- **Activer/Desactiver** (icone play/pause) : Basculer l'etat du flow
- **Modifier** (icone crayon) : Ouvrir l'editeur visuel
- **Supprimer** (icone corbeille) : Supprimer le flow (avec confirmation)

---

## Fonctions detaillees

### Declencheurs disponibles

| Declencheur | Description | Cas d'usage |
|-------------|-------------|-------------|
| **Commande creee** | Un client passe une commande | Email de confirmation |
| **Commande expediee** | La commande est en transit | Notification de suivi |
| **Commande livree** | La commande est arrivee | Demande d'avis |
| **Panier abandonne** | Un panier n'a pas ete finalise | Relance avec incitatif |
| **Inscription** | Un nouveau compte est cree | Sequence de bienvenue |
| **Anniversaire** | Date d'anniversaire du client | Email promotionnel personnalise |
| **Reactivation** | Client inactif depuis longtemps | Offre de retour |
| **Reapprovisionnement** | Delai estime avant renouvellement | Rappel de rachat |
| **Avis recu** | Un client laisse un avis produit | Remerciement |
| **Stock bas** | Alerte de stock faible | Notification interne |
| **Stock retour** | Produit de nouveau disponible | Notification aux interesses |

### Editeur visuel de flow
L'editeur utilise la bibliotheque **ReactFlow** pour offrir un canevas interactif :

- **Palette de noeuds** (gauche) : Cliquez pour ajouter un noeud au canevas
- **Canevas** (centre) : Glissez, connectez et organisez les noeuds
- **Inspecteur** (droite) : Configurez le noeud selectionne
- **Minimap** : Vue d'ensemble du flow en bas a droite
- **Controles** : Zoom, centrage, plein ecran

### Types de noeuds

| Noeud | Description | Configuration |
|-------|-------------|---------------|
| **Trigger** | Declencheur du flow | Evenement declencheur |
| **Email** | Envoi d'un email | Objet, contenu HTML |
| **Delay** | Periode d'attente | Duree (minutes, heures, jours, semaines) |
| **Condition** | Branchement conditionnel | Champ, operateur, valeur |
| **SMS** | Envoi d'un SMS | Message (160 caracteres max) |

### Connexion des noeuds
Reliez les noeuds en cliquant sur le point de sortie d'un noeud et en le glissant vers le
point d'entree d'un autre. Les connexions sont animees pour indiquer le flux.

### Conditions et branchements
Le noeud **Condition** permet de creer deux branches :
- **Vrai** : Le flow continue si la condition est remplie
- **Faux** : Le flow prend un chemin alternatif

Operateurs disponibles : egal, different, superieur, inferieur, contient.

Exemples de conditions :
- `hasOrdered equals true` : Le client a deja commande
- `totalSpent greater_than 500` : Le client a depense plus de 500$
- `tier equals GOLD` : Le client est au niveau Gold du programme fidelite

---

## Workflows courants

### Workflow 1 : Creer une sequence de bienvenue
1. Cliquez sur **Nouveau workflow**.
2. Nommez le flow "Sequence de bienvenue".
3. Selectionnez le declencheur **Inscription**.
4. Ajoutez un noeud **Email** "Bienvenue chez BioCycle Peptides!".
5. Ajoutez un noeud **Delay** de 3 jours.
6. Ajoutez un noeud **Email** "Decouvrez nos best-sellers".
7. Ajoutez un noeud **Delay** de 7 jours.
8. Ajoutez un noeud **Condition** : `hasOrdered equals false`.
9. Si vrai : ajoutez un noeud **Email** avec un code promo de premiere commande.
10. Activez le flow et cliquez sur **Sauvegarder**.

### Workflow 2 : Relance de panier abandonne
1. Creez un flow avec le declencheur **Panier abandonne**.
2. Ajoutez un **Delay** de 1 heure.
3. Ajoutez un **Email** "Vous avez oublie quelque chose!".
4. Ajoutez un **Delay** de 24 heures.
5. Ajoutez une **Condition** : le panier est-il toujours actif ?
6. Si oui : envoyez un **Email** avec un code de reduction de 10%.
7. Sauvegardez et activez.

---

## FAQ

**Q : Un flow peut-il etre modifie alors qu'il est actif ?**
R : Oui, vous pouvez modifier et sauvegarder un flow actif. Les modifications s'appliqueront
aux nouveaux declenchements, pas aux sequences deja en cours.

**Q : Combien de noeuds un flow peut-il contenir ?**
R : Il n'y a pas de limite technique. Neanmoins, un flow trop complexe peut etre difficile
a maintenir. Privilegiez la clarte.

**Q : Les SMS sont-ils envoyes via le meme fournisseur que les emails ?**
R : Non, les SMS sont envoyes via le fournisseur VoIP configure (Telnyx). L'envoi de SMS
necessite un numero de telephone actif.

**Q : Comment tester un flow ?**
R : Un bouton de test permet d'executer le flow avec des donnees fictives pour verifier
le bon fonctionnement avant l'activation.

---

## Strategie expert : les 5 flows essentiels pour un e-commerce de peptides

### Pourquoi ces 5 flows sont non negociables

Ces 5 sequences automatisees couvrent les moments critiques du cycle de vie client. Ensemble, elles peuvent generer 20 a 40% du revenu email total d'un e-commerce, sans intervention humaine une fois configurees.

### Flow 1 : Sequence de bienvenue (3 emails sur 7 jours)

C'est le flow le plus important. Un nouvel inscrit est au pic de son interet. Le taux d'ouverture des emails de bienvenue atteint 50 a 60%, contre 20-25% pour une newsletter classique.

**Declencheur** : Inscription (nouveau compte ou newsletter)

| Etape | Delai | Objet email | Contenu |
|-------|-------|-------------|---------|
| Email 1 | J0 (immediat) | "Bienvenue chez BioCycle Peptides!" | Merci pour l'inscription + guide de reconstitution PDF en piece jointe + presentation de BioCycle (qui sommes-nous, pourquoi nous choisir) |
| Email 2 | J+3 | "5 questions frequentes sur les peptides de recherche" | FAQ : conservation, reconstitution, purete, certificats d'analyse, expedition au Canada. Liens vers les articles de blog correspondants |
| Email 3 | J+7 | "Votre code de bienvenue : BIENVENUE10" | Code promo 10% premiere commande, valide 14 jours, min 50 $CA. Mise en avant des 3 peptides les plus populaires avec liens directs |

**Condition apres Email 3** : Si le client a commande entre-temps, arreter le flow et basculer vers le flow post-achat.

### Flow 2 : Abandon de panier (3 emails avec escalade)

Un panier abandonne represente un client qui etait pret a acheter. Le taux de recuperation moyen est de 5 a 15%, ce qui en fait le flow au meilleur ROI.

**Declencheur** : Panier abandonne (produit ajoute mais checkout non complete)

| Etape | Delai | Objet email | Contenu |
|-------|-------|-------------|---------|
| Email 1 | H+1 | "Votre panier vous attend" | Rappel simple avec image du produit, prix, bouton "Completer ma commande". Pas de remise a cette etape. |
| Email 2 | H+24 | "Avez-vous des questions sur [produit] ?" | Contenu educatif sur le produit abandonne (purete, COA, avis). FAQ rapide. Lien vers le service client. |
| Email 3 | H+72 | "Derniere chance : 10% sur votre panier" | Code promo 10% valide 48h, applique uniquement aux produits du panier abandonne. Mention "stock limite" si applicable. |

**Important** : Si le client achete a n'importe quelle etape, arreter le flow immediatement.

### Flow 3 : Post-achat (3 emails sur 30 jours)

Le flow post-achat transforme un acheteur unique en client recurrent. C'est aussi le moment ideal pour le cross-sell.

**Declencheur** : Commande creee (paiement confirme)

| Etape | Delai | Objet email | Contenu |
|-------|-------|-------------|---------|
| Email 1 | J+1 | "Merci pour votre commande!" | Confirmation avec resume de commande, numero de suivi si disponible, delai de livraison estime, coordonnees du support. |
| Email 2 | J+7 | "Guide : bien utiliser vos peptides de recherche" | Guide pratique adapte aux produits commandes : reconstitution, dosage, stockage, duree de vie apres reconstitution. Cross-sell accessoires si non commandes (eau bacteriostatique, seringues). |
| Email 3 | J+30 | "Temps de reapprovisionner ?" | Rappel de reachat base sur la duree estimee d'utilisation. Bouton "Recommander" direct. Suggestion de produits complementaires (stacks). Code 5% fidelite si > 2e commande. |

### Flow 4 : Reactivation (2 emails pour clients inactifs)

Un client qui n'a pas commande depuis 60 jours risque de vous oublier. Ce flow le ramene.

**Declencheur** : Derniere commande > 60 jours ET client a deja commande au moins 1 fois

| Etape | Delai | Objet email | Contenu |
|-------|-------|-------------|---------|
| Email 1 | J+60 inactif | "Vous nous manquez! Voici 15% pour revenir" | Message personnalise avec rappel des derniers produits achetes. Code RETOUR15, 15% valide 14 jours. Nouveaux produits depuis la derniere visite. |
| Email 2 | J+75 inactif | "Derniere chance : votre code expire dans 48h" | Rappel d'urgence. Le code expire bientot. Temoignage client ou etude recente sur le peptide qu'il achetait. |

**Si aucune reaction apres 90 jours** : Passer le contact en segment "Dormant". Reduire la frequence a 1 email/mois maximum. Ne pas supprimer -- un client dormant peut revenir des mois plus tard.

### Flow 5 : Anniversaire (1 email festif)

Le flow d'anniversaire est simple mais tres efficace : taux d'ouverture de 40-50% et taux de conversion de 10-15%.

**Declencheur** : Date d'anniversaire du client (si renseignee)

| Etape | Delai | Objet email | Contenu |
|-------|-------|-------------|---------|
| Email 1 | Jour J | "Joyeux anniversaire! Un cadeau pour vous" | Message personnalise avec prenom. Code ANNIV20, 20% valide 7 jours, usage unique, min 75 $CA. Suggestions basees sur l'historique d'achat. |

### Performance attendue des 5 flows

| Flow | Taux d'ouverture | Taux de clic | Taux de conversion | Revenu estime/mois |
|------|-----------------|-------------|-------------------|-------------------|
| Bienvenue | 50-60% | 8-12% | 10-15% | Variable selon nouveaux inscrits |
| Abandon panier | 40-50% | 10-15% | 5-15% | 5-10% du revenu perdu |
| Post-achat | 45-55% | 6-10% | 3-8% cross-sell | 2-5% revenu additionnel |
| Reactivation | 25-35% | 4-8% | 3-8% | Recuperation clients dormants |
| Anniversaire | 40-50% | 8-12% | 10-15% | Faible volume, fort taux |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Flow** | Sequence automatisee d'actions declenchees par un evenement |
| **Trigger** | Evenement declencheur qui demarre le flow |
| **Noeud** | Element du flow (email, delai, condition, SMS) |
| **Branchement** | Division du flow en deux chemins selon une condition |
| **ReactFlow** | Bibliotheque de visualisation de flux utilisee par l'editeur |
| **Cron** | Tache planifiee qui execute les flows a intervalles reguliers |

---

## Pages associees

- [Templates](./04-templates.md) : Creer le contenu des emails utilises dans les flows
- [Campagnes](./05-campagnes.md) : Envoi ponctuel en masse (vs. flows automatises)
- [Analytics emails](./07-analytics.md) : Mesurer la performance des flows
- [Boite de reception](./01-inbox.md) : Gerer les reponses generees par les flows
