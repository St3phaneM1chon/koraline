# Programme Ambassadeurs

> **Section**: Communaute > Ambassadeurs
> **URL**: `/admin/ambassadeurs`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~30 minutes

---

## A quoi sert cette page ?

La page **Ambassadeurs** gere votre programme de referral B2B. Les ambassadeurs sont des partenaires (professionnels, influenceurs, experts) qui recommandent vos produits BioCycle Peptides a leur reseau via un lien de parrainage unique. En echange, ils reculent une commission sur chaque vente generee par leur lien.

**En tant que gestionnaire, vous pouvez :**
- Voir tous les ambassadeurs et leurs performances (ventes, commissions, referrals)
- Approuver ou rejeter les candidatures d'ambassadeurs
- Modifier le taux de commission individuel de chaque ambassadeur
- Voir l'historique des commissions d'un ambassadeur
- Traiter les paiements de commissions
- Suspendre ou reactiver un ambassadeur
- Configurer les parametres globaux du programme (commission par defaut, seuil de paiement, duree du cookie)
- Filtrer par statut (actif, en attente, suspendu, inactif)
- Suivre les paliers (Bronze, Argent, Or, Platine) bases sur les ventes cumulees
- Exporter la liste des ambassadeurs et leurs statistiques en CSV

---

## Concepts cles pour les debutants

### Qu'est-ce qu'un ambassadeur ?
Un ambassadeur est un partenaire qui dispose d'un code de referral unique. Quand un client achete un produit via le lien de l'ambassadeur, ce dernier recoit automatiquement une commission sur la vente.

### Comment fonctionnent les paliers (tiers) ?
Les ambassadeurs progressent automatiquement a travers 4 paliers en fonction de leurs ventes cumulees :

| Palier | Ventes cumulees | Commission par defaut |
|--------|----------------|----------------------|
| **Bronze** | 0 $ et plus | 5 % |
| **Argent** | 1 000 $ et plus | 8 % |
| **Or** | 5 000 $ et plus | 10 % |
| **Platine** | 15 000 $ et plus | 15 % |

### Qu'est-ce que le "cookie days" ?
C'est la duree pendant laquelle le lien de parrainage reste actif apres le clic d'un visiteur. Par exemple, si le cookie est de 30 jours et qu'un visiteur clique sur le lien le 1er mars, tout achat effectue avant le 31 mars sera attribue a l'ambassadeur.

### Qu'est-ce qu'un payout (versement) ?
Quand les commissions accumulees d'un ambassadeur depassent le seuil minimum de paiement, vous pouvez traiter un versement. Le systeme calcule le montant total des commissions impayees et genere un paiement.

---

## Comment y acceder

### Methode 1 : Via le rail de navigation
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la colonne d'icones a gauche, cliquez sur l'icone **Communaute**
3. Dans le panneau lateral, cliquez sur **Ambassadeurs**

### Methode 2 : Via la barre de recherche
1. Tapez "ambassadeurs" ou "referral" dans la barre de recherche
2. Selectionnez le resultat correspondant

### Methode 3 : Acces direct par URL
1. Rendez-vous a l'adresse `/admin/ambassadeurs` dans votre navigateur

---

## Vue d'ensemble de l'interface

L'interface suit la disposition maitresse/detail (Outlook-style) avec 4 zones :

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Icone | Fonction |
|--------|-------|----------|
| **Nouvel ambassadeur** | Personne + | Inviter un nouvel ambassadeur au programme |
| **Approuver candidature** | Coche verte | Approuver la candidature selectionnee |
| **Supprimer** | Poubelle rouge | Retirer l'ambassadeur du programme |
| **Gerer commission** | Dollar | Modifier le taux de commission de l'ambassadeur selectionne |
| **Statistiques ventes** | Graphique | Afficher les statistiques de ventes de l'ambassadeur |
| **Exporter** | Telecharger | Exporter la liste complete au format CSV |

### 2. Les cartes statistiques -- sous le ruban

Quatre indicateurs cles :
- **Total ambassadeurs** : nombre d'ambassadeurs dans le programme (tous statuts confondus)
- **Ventes totales** : montant total des ventes generees par les ambassadeurs
- **Commissions versees** : total des commissions deja payees
- **En attente paiement** : montant des commissions en attente de versement

### 3. Le panneau de liste (gauche) -- liste maitre

La colonne de gauche affiche la liste des ambassadeurs. Chaque entree montre :
- L'avatar ou les initiales de l'ambassadeur
- Le nom et l'email
- Le code de referral
- Le montant total des ventes generees
- Des badges : palier (Bronze/Argent/Or/Platine) et statut (Actif/En attente/Suspendu/Inactif)

**Au-dessus de la liste :**
- Des **onglets de filtre** : Tous / Actifs / En attente / Suspendus / Inactifs (avec compteur)
- Une **barre de recherche** pour filtrer par nom, email ou code de referral

### 4. Le panneau de detail (droite)

Quand vous selectionnez un ambassadeur, le panneau droit affiche :
- Le nom, l'email et le palier
- Le code de referral personnel
- Le taux de commission actuel
- Les statistiques detaillees :
  - Nombre total de referrals
  - Montant total des ventes
  - Total des gains cumules
  - Montant en attente de paiement
- L'**historique des commissions** : liste de chaque commission avec le numero de commande, le montant de la commande, la commission calculee, le statut du paiement et la date
- Les boutons d'action : **Modifier la commission**, **Traiter le paiement**, **Suspendre** ou **Activer**
- Les informations du palier (seuil de vente minimum, commission par defaut)

---

## Fonctions detaillees

### Approuver une candidature

1. Quand un utilisateur demande a devenir ambassadeur, son statut est **En attente**
2. Un bandeau de notification apparait si des candidatures sont en attente
3. Cliquez sur le bouton **Candidatures** ou filtrez par l'onglet **En attente**
4. Selectionnez le candidat pour voir son profil
5. Cliquez sur **Approuver** pour accepter la candidature
6. L'ambassadeur passe au statut **Actif** et recoit son code de referral

### Modifier le taux de commission

1. Selectionnez l'ambassadeur dans la liste
2. Cliquez sur **Modifier la commission** (icone pourcentage)
3. La fenetre modale s'ouvre avec le taux actuel
4. Saisissez le nouveau taux (entre 0 et 100 %)
5. Cliquez sur **Sauvegarder**
6. Le nouveau taux s'applique immediatement aux futures ventes

### Traiter un paiement

1. Selectionnez l'ambassadeur dont le montant "En attente de paiement" est superieur au seuil
2. Cliquez sur le bouton **Traiter le paiement**
3. Le systeme calcule le total des commissions impayees
4. Un message de confirmation s'affiche avec le montant et le nombre de commissions concernees
5. Le solde "En attente" retombe a zero apres le traitement

> **Important** : le bouton est desactive pendant le traitement pour eviter les doubles clics.

### Suspendre un ambassadeur

1. Selectionnez l'ambassadeur
2. Cliquez sur **Suspendre**
3. Une boite de confirmation apparait
4. Confirmez la suspension
5. L'ambassadeur ne peut plus generer de commissions tant qu'il est suspendu
6. Pour le reactiver, cliquez sur **Activer** dans le panneau de detail

### Configurer les parametres du programme

1. Cliquez sur l'icone **Parametres** (engrenage) dans les cartes statistiques ou dans le ruban
2. La fenetre de configuration s'ouvre avec les parametres actuels (charges depuis les reglages sauvegards) :
   - **Commission par defaut** : le taux applique aux nouveaux ambassadeurs
   - **Seuil minimum de paiement** : montant minimum avant de pouvoir traiter un versement
   - **Duree du cookie** : nombre de jours pendant lesquels le referral est valide (1 a 365)
   - **Approbation automatique** : activer/desactiver l'approbation automatique des candidatures
   - **Programme actif** : activer/desactiver le programme entier
3. Modifiez les parametres souhaites
4. Cliquez sur **Sauvegarder**

### Exporter en CSV

1. Cliquez sur **Exporter** dans le ruban
2. Un fichier CSV contenant tous les ambassadeurs est telecharge
3. Colonnes : Nom, Email, Code, Palier, Statut, Commission, Ventes, Gains, En attente, Date d'inscription

---

## Scenarios courants

### Scenario 1 : Gestion hebdomadaire des candidatures et paiements

1. Ouvrez la page Ambassadeurs
2. Verifiez si des candidatures sont **En attente** (onglet ou bandeau)
3. Pour chaque candidature : examinez le profil, approuvez ou refusez
4. Filtrez sur **Actifs** et triez par montant "En attente"
5. Pour chaque ambassadeur ayant atteint le seuil de paiement : cliquez **Traiter le paiement**
6. Verifiez que les soldes sont remis a zero

### Scenario 2 : Promouvoir un ambassadeur performant

1. Consultez les cartes statistiques pour identifier les meilleurs vendeurs
2. Selectionnez l'ambassadeur le plus performant
3. Observez son palier et son taux de commission actuels
4. Si ses performances le justifient, modifiez son taux de commission a la hausse
5. Envoyez-lui un email de felicitations via la page CRM ou Emails

### Scenario 3 : Suspendre un ambassadeur inactif

1. Filtrez par statut **Actifs**
2. Identifiez les ambassadeurs avec 0 referral ou 0 vente depuis plusieurs mois
3. Selectionnez l'ambassadeur concerne
4. Cliquez sur **Suspendre** pour geler son compte
5. Contactez-le par email pour comprendre la situation et proposer un plan de relance

---

## Foire aux questions (FAQ)

**Q : Un ambassadeur peut-il voir ses propres statistiques ?**
R : Oui. Les ambassadeurs disposent d'un espace personnel accessible depuis le site principal ou ils peuvent consulter leurs ventes, commissions et leur code de referral.

**Q : Que se passe-t-il si un ambassadeur est suspendu pendant qu'un cookie est actif ?**
R : Les ventes generees pendant la suspension ne generent pas de commission. Le cookie reste actif cote visiteur, mais la commission n'est pas attribuee.

**Q : Puis-je creer un ambassadeur manuellement ?**
R : Oui. Cliquez sur **Nouvel ambassadeur** dans le ruban. Vous pourrez renseigner les informations du partenaire et definir son taux de commission initial.

**Q : Les paliers se mettent a jour automatiquement ?**
R : Oui. Le systeme recalcule le palier de chaque ambassadeur en fonction de ses ventes cumulees. La progression est automatique et irreversible (pas de retrogradation).

**Q : Comment fonctionne la validation Zod des parametres ?**
R : Quand vous sauvegardez la configuration du programme, le systeme valide les valeurs via un schema strict : la commission doit etre entre 0 et 100, le seuil de paiement doit etre positif, et la duree du cookie doit etre entre 1 et 365 jours. Toute valeur invalide est rejetee avec un message d'erreur.

---

## Strategie expert : Programme ambassadeur B2B pour un e-commerce de peptides

### Structure de commission optimale pour le marche des peptides

Le marche des peptides de recherche est un marche B2B de niche ou les ambassadeurs sont typiquement des laboratoires, des chercheurs, des institutions academiques et des professionnels de la sante integrative. La structure de commission doit refleter cette realite.

**Grille de commission recommandee :**

| Type de commission | Taux | Conditions | Justification |
|-------------------|------|------------|---------------|
| **Premier achat du referral** | 10-15% | Commission unique sur la premiere commande du client parraine | Incite a l'acquisition de nouveaux clients |
| **Commissions recurrentes** | 5% | Sur toutes les commandes suivantes du client, pendant 12 mois | Recompense la relation durable et l'accompagnement |
| **Bonus volume mensuel** | +2% | Si les ventes generees depassent 5 000$/mois | Motive les gros volumes |
| **Bonus premier parrainage** | 50$ fixe | Quand l'ambassadeur genere sa premiere vente | Encourage les nouveaux ambassadeurs a demarrer rapidement |

**Paliers de volume avec benefices supplementaires :**

| Palier | Ventes cumulees annuelles | Commission de base | Avantages supplementaires |
|--------|--------------------------|-------------------|---------------------------|
| **Bronze** | 0 - 4 999$ | 10% premier / 5% recurrent | Acces au catalogue complet |
| **Argent** | 5 000 - 19 999$ | 12% premier / 5% recurrent | + Echantillons gratuits pour demonstrations |
| **Or** | 20 000 - 49 999$ | 15% premier / 7% recurrent | + Exclusivite territoriale partielle + Prix preferentiel personnel |
| **Platine** | 50 000$+ | 15% premier / 8% recurrent | + Exclusivite territoriale complete + Co-branding + Ligne directe support |

### Exclusivite territoriale

L'exclusivite territoriale est un levier puissant pour les ambassadeurs B2B dans le marche des peptides. Elle garantit a l'ambassadeur qu'aucun autre ambassadeur ne sera nomme dans sa region, en echange d'un engagement de volume minimum.

**Structure recommandee :**

| Zone | Engagement minimum annuel | Protection |
|------|--------------------------|------------|
| **Region metropolitaine** (ex: Grand Montreal, Grand Quebec) | 25 000$/an | Aucun autre ambassadeur dans la region |
| **Province** (ex: Quebec entier) | 75 000$/an | Aucun autre ambassadeur dans la province |
| **Specialite** (ex: peptides cosmetiques) | 15 000$/an | Exclusivite sur la categorie, pas la geographie |

**Clause de performance :** L'exclusivite est revisee annuellement. Si l'ambassadeur n'atteint pas 70% de son engagement minimum, l'exclusivite est retiree avec un preavis de 90 jours.

### Strategie de recrutement des ambassadeurs

Le recrutement d'ambassadeurs dans le secteur des peptides necessite une approche ciblee et professionnelle, differente du recrutement d'influenceurs grand public.

**Canaux de recrutement par ordre d'efficacite :**

| Canal | Cible | Approche | Taux de conversion moyen |
|-------|-------|----------|--------------------------|
| **LinkedIn** | Chercheurs, directeurs de labo, professionnels sante integrative | Message personnalise citant leurs publications ou leur expertise | 5-8% |
| **Conferences scientifiques** | Presentateurs et participants (ISPS, ICPS, conferences peptides) | Stand BioCycle + presentation du programme sur place | 10-15% (contact direct) |
| **Publications scientifiques** | Auteurs publiant sur les peptides (PubMed, Google Scholar) | Email professionnel citant leur article et proposant un partenariat | 3-5% |
| **Associations professionnelles** | Membres d'ordres professionnels (chimistes, biochimistes) | Partenariat avec l'association + offre aux membres | 2-3% |
| **Clients existants performants** | Clients avec 5+ commandes et panier moyen > 300$ | Invitation personnalisee par le responsable commercial | 15-25% |
| **Distributeurs de fournitures de labo** | Entreprises complementaires (non concurrentes) | Proposition de co-distribution avec commission croisee | 8-12% |

**Template de message de recrutement LinkedIn :**

> "Bonjour [Prenom], je suis [Nom], responsable des partenariats chez BioCycle Peptides. J'ai remarque vos travaux sur [sujet/publication]. Notre programme ambassadeur offre des commissions de 10-15% aux professionnels recommandant nos peptides de recherche (purete >98%, certifies par analyse independante). Seriez-vous interesse par une conversation de 15 minutes pour en discuter ?"

### Outils et materiels pour les ambassadeurs

Chaque ambassadeur doit recevoir un kit complet pour maximiser son efficacite :

| Materiel | Description | Fourni au palier |
|----------|-------------|------------------|
| **Lien de referral personnalise** | URL unique avec tracking automatique | Tous |
| **Codes promo dedies** | Code de reduction 5-10% pour les clients de l'ambassadeur | Tous |
| **Fiches produits PDF** | Documentation technique complete avec CoA types | Tous |
| **Echantillons** | Flacons echantillons pour demonstrations (usage recherche uniquement) | Argent+ |
| **Materiel marketing co-brande** | Brochures, presentations avec logo de l'ambassadeur | Or+ |
| **Page partenaire sur le site** | Page dediee sur biocyclepeptides.com | Or+ |
| **Acces API catalogue** | Integration directe dans le systeme de l'ambassadeur | Platine |

### Budget et rentabilite du programme

**Estimation budgetaire annuelle pour un programme de 20 ambassadeurs :**

| Poste | Cout annuel estime |
|-------|-------------------|
| Commissions (moy. 8% sur 500 000$ de ventes generees) | 40 000$ |
| Echantillons et materiels | 5 000$ |
| Gestion du programme (temps interne) | 10 000$ |
| Evenements et conferences | 8 000$ |
| **Total** | **63 000$** |
| **Revenus generes** | **500 000$** |
| **Cout du programme en % des revenus** | **12.6%** |

Le cout d'acquisition client via le programme ambassadeur est generalement 40-60% inferieur au cout d'acquisition via la publicite payante (Google Ads, Meta Ads). De plus, les clients acquis par referral ont un taux de retention 37% plus eleve (Wharton School of Business).

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Ambassadeur** | Partenaire recommandant vos produits en echange d'une commission sur les ventes |
| **Code de referral** | Code unique attribue a chaque ambassadeur pour tracer les ventes qu'il genere |
| **Cookie (duree)** | Periode pendant laquelle un clic sur un lien de referral reste actif pour attribuer une vente |
| **Palier (tier)** | Niveau de l'ambassadeur (Bronze, Argent, Or, Platine) base sur les ventes cumulees |
| **Commission** | Pourcentage du montant de la vente reverse a l'ambassadeur |
| **Payout (versement)** | Paiement des commissions accumulees a un ambassadeur |
| **Candidature** | Demande d'un utilisateur pour rejoindre le programme ambassadeur |
| **Optimistic update** | Technique ou l'interface se met a jour immediatement avant la confirmation du serveur |

---

## Pages liees

- [Programme de fidelite](/admin/fidelite) -- les points de fidelite (bonus referral pour les clients)
- [Avis clients](/admin/avis) -- les avis produits qui renforcent la credibilite
- [CRM](/admin/crm) -- le suivi des contacts et relations commerciales
- [Clients](/admin/customers) -- les acheteurs individuels du site
- [Distributeurs](/admin/clients) -- les clients B2B (entreprises)
- [Statistiques](/admin/rapports) -- les rapports de ventes et de performance
