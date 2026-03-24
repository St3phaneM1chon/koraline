# Programme de Fidelite

> **Section**: Fidelite > Programme
> **URL**: `/admin/fidelite`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~30 minutes

---

## A quoi sert cette page ?

La page **Fidelite** est le centre de gestion de votre programme de recompenses. Elle permet de configurer les regles d'accumulation de points, de definir les paliers de fidelite, de gerer les defis (challenges) et les recompenses, et de suivre les transactions de points en temps reel. Un programme de fidelite bien configure encourage les achats repetitifs et augmente la valeur a vie de chaque client.

**En tant que gestionnaire, vous pouvez :**
- Configurer les regles de gain de points (points par dollar depense)
- Definir la valeur de rachat des points (combien vaut un point en dollars)
- Fixer le seuil minimum de rachat
- Configurer les bonus speciaux (premier achat, anniversaire, referral, inscription, avis)
- Creer, modifier et supprimer des paliers de fidelite (avec multiplicateur de points et avantages)
- Voir les defis actifs (challenges de gamification)
- Consulter le catalogue de recompenses
- Voir les points en voie d'expiration
- Suivre les transactions de points recentes (gains et echanges)
- Consulter les statistiques globales (membres par palier, points distribues, points echanges)
- Sauvegarder la configuration et la synchroniser en temps reel
- Exporter les donnees pour analyse

---

## Concepts cles pour les debutants

### Qu'est-ce qu'un programme de fidelite a points ?
C'est un systeme ou chaque achat genere des points. Ces points peuvent ensuite etre echanges contre des recompenses : reductions, livraison gratuite, acces VIP, produits gratuits, etc.

### Comment les points sont-ils gagnes ?
Les clients accumulent des points de plusieurs facons :
- **Achat** : par defaut, 1 point par dollar depense (configurable)
- **Referral** : bonus quand un client parraine un ami (par defaut 100 points)
- **Anniversaire** : bonus annuel le jour de l'anniversaire du client (par defaut 200 points)
- **Premier achat** : bonus unique a la premiere commande
- **Avis produit** : bonus pour chaque avis publie
- **Inscription** : bonus a la creation de compte

### Qu'est-ce qu'un palier de fidelite (tier) ?
Les paliers sont des niveaux de statut qui offrent des avantages croissants. Plus un client accumule de points, plus son palier est eleve. Chaque palier offre un **multiplicateur de points** (un client Or gagne plus de points par dollar qu'un client Bronze) et des avantages exclusifs.

### Qu'est-ce qu'un defi (challenge) ?
Un defi est une mission temporaire proposee aux clients : par exemple "Passez 3 commandes ce mois-ci" ou "Redigez 5 avis". Completer un defi donne des points bonus. C'est un element de gamification qui stimule l'engagement.

### Que sont les points en expiration ?
Pour encourager les clients a utiliser leurs points, ceux-ci ont une duree de validite. Les points non utilises expirent apres un certain delai. Le systeme affiche le nombre de points expirant dans 7, 30 et 90 jours.

### Qu'est-ce que le catalogue de recompenses ?
C'est la liste des recompenses disponibles contre des points. Chaque recompense a un cout en points et un type (reduction, livraison gratuite, produit gratuit, acces VIP, etc.).

---

## Comment y acceder

### Methode 1 : Via le rail de navigation
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la colonne d'icones a gauche, cliquez sur l'icone **Fidelite** (cadeau)
3. Dans le panneau lateral, cliquez sur **Programme de fidelite**

### Methode 2 : Via la barre de recherche
1. Tapez "fidelite" ou "loyalty" dans la barre de recherche
2. Selectionnez le resultat correspondant

### Methode 3 : Acces direct par URL
1. Rendez-vous a l'adresse `/admin/fidelite` dans votre navigateur

---

## Vue d'ensemble de l'interface

L'interface de fidelite est organisee en plusieurs sections verticales scrollables :

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Icone | Fonction |
|--------|-------|----------|
| **Nouveau palier** | + vert | Ajouter un nouveau palier de fidelite |
| **Supprimer** | Poubelle rouge | Supprimer le palier selectionne |
| **Ajuster les points** | Crayon | Ajuster manuellement les points d'un membre |
| **Regles de gain** | Livre | Consulter et modifier les regles d'accumulation |
| **Historique des echanges** | Horloge | Voir l'historique des echanges de points |
| **Statistiques membres** | Graphique | Afficher la repartition des membres par palier |
| **Exporter** | Telecharger | Exporter les donnees du programme |

### 2. L'en-tete de la page

Titre "Programme de fidelite" avec un bouton **Sauvegarder la configuration** en haut a droite. Ce bouton enregistre toutes les modifications apportees aux regles et paliers.

### 3. La section de configuration des regles

Un formulaire avec les parametres cles du programme :
- **Points par dollar** : combien de points le client gagne pour chaque dollar depense
- **Valeur du point** : combien vaut un point en dollars lors du rachat
- **Minimum de rachat** : nombre minimum de points pour effectuer un echange
- **Bonus referral** : points gagnes quand un client parraine quelqu'un
- **Bonus anniversaire** : points offerts le jour de l'anniversaire
- **Bonus premier achat** : points pour la premiere commande
- **Bonus avis** : points pour chaque avis publie
- **Bonus inscription** : points a la creation de compte

### 4. La section des paliers de fidelite

Un tableau de cartes affichant chaque palier :
- Nom du palier et couleur
- Seuil de points minimum pour atteindre ce palier
- Multiplicateur de points (ex: x1.5 signifie que chaque dollar donne 1.5 fois plus de points)
- Liste des avantages exclusifs
- Boutons **Modifier** et **Supprimer** (avec confirmation)

### 5. Le simulateur de gains

Un outil de simulation permettant de calculer combien de points un client gagnerait pour un montant d'achat donne, selon son palier. Selectionnez un palier et un montant pour voir le resultat en temps reel.

### 6. Les defis actifs (gamification)

Liste des challenges en cours avec :
- Nom du defi et description
- Objectif (ex: 3 commandes, 5 avis, 2 referrals)
- Recompense en points
- Dates de debut et fin
- Statut (actif / inactif)

### 7. Le catalogue de recompenses

Tableau des recompenses echangeables :
- Nom de la recompense
- Cout en points
- Type (reduction, livraison, produit gratuit, acces VIP)

### 8. Les points en expiration

Trois indicateurs d'alerte :
- Points expirant dans **7 jours**
- Points expirant dans **30 jours**
- Points expirant dans **90 jours**

### 9. Les transactions recentes

Tableau des 10 dernieres transactions de points :
- Nom et email du client
- Type de transaction (gain ou echange)
- Nombre de points
- Description (achat, bonus, rachat)
- Date

### 10. Les statistiques membres

Repartition des membres par palier avec le nombre total de membres inscrits au programme.

### 11. Les cartes de pont (bridges)

Liens contextuels vers les sections connexes :
- **Fidelite vers Marketing** : lien vers les promotions qui peuvent integrer les points de fidelite
- **Fidelite vers Communaute** : lien vers les avis et le programme ambassadeur

---

## Fonctions detaillees

### Modifier les regles de gain de points

1. Dans la section de configuration, modifiez les champs souhaites :
   - Augmentez les **Points par dollar** pour recompenser davantage les achats
   - Augmentez les bonus pour encourager les comportements cibles
2. Cliquez sur **Sauvegarder la configuration** en haut de la page
3. Un message de confirmation apparait
4. Les nouvelles regles s'appliquent immediatement aux futurs achats

### Ajouter un nouveau palier

1. Cliquez sur **Nouveau palier** dans le ruban ou sur le bouton "Ajouter un palier" dans la section des paliers
2. Un nouveau palier est cree avec des valeurs par defaut
3. L'editeur s'ouvre automatiquement avec les champs :
   - **Nom** : le nom du palier (ex: "Diamant")
   - **Points minimum** : le seuil pour atteindre ce palier
   - **Multiplicateur** : le multiplicateur de points (entre 0.1 et 10)
   - **Avantages** : un avantage par ligne
   - **Couleur** : la couleur d'affichage du badge
4. Renseignez les valeurs
5. Cliquez sur **Sauvegarder le palier**
6. N'oubliez pas de cliquer sur **Sauvegarder la configuration** en haut de la page pour persister le changement

> **Important** : le nom du palier doit etre unique. Si vous tentez de creer un palier avec un nom existant, un message d'erreur s'affiche.

### Modifier un palier existant

1. Cliquez sur le bouton **Modifier** du palier souhaite
2. L'editeur s'ouvre avec les valeurs actuelles
3. Modifiez les champs necessaires
4. Cliquez sur **Sauvegarder le palier**
5. Un message "Palier mis a jour -- cliquez Sauvegarder pour persister" vous rappelle de sauvegarder la configuration globale

### Supprimer un palier

1. Cliquez sur le bouton **Supprimer** du palier
2. Une boite de confirmation s'affiche, indiquant le nombre de membres qui seront affectes
3. Confirmez la suppression
4. Le palier est retire de la configuration
5. Sauvegardez la configuration globale

### Utiliser le simulateur

1. Dans la section simulateur, entrez un **montant d'achat** (ex: 100 $)
2. Selectionnez un **palier** dans le menu deroulant
3. Le systeme calcule automatiquement :
   - Les points de base (montant x points par dollar)
   - Le bonus du multiplicateur du palier
   - Le total de points gagnes

### Consulter les transactions

1. La section "Transactions recentes" affiche les 10 dernieres operations
2. Chaque ligne montre le client, le type (EARNED/REDEEMED), le nombre de points, la description et la date
3. Les statistiques globales sont affichees : total gagne, total echange, solde net, nombre de transactions

---

## Scenarios courants

### Scenario 1 : Lancement du programme de fidelite

1. Ouvrez la page Fidelite
2. Configurez les regles de base :
   - Points par dollar : 1 (standard) ou 2 (genereux)
   - Valeur du point : 0.01 $ (1 point = 1 cent)
   - Minimum de rachat : 100 points (1 $ minimum de reduction)
3. Configurez les bonus :
   - Bonus inscription : 50 points (inciter les creations de compte)
   - Bonus premier achat : 100 points
   - Bonus anniversaire : 200 points
   - Bonus referral : 100 points
4. Verifiez les paliers par defaut (Bronze, Argent, Or, Platine) et ajustez si necessaire
5. Cliquez sur **Sauvegarder la configuration**
6. Le programme est actif immediatement

### Scenario 2 : Ajuster les paliers apres 6 mois d'exploitation

1. Consultez les **Statistiques membres** pour voir la repartition par palier
2. Si 90 % des membres sont Bronze et seulement 1 % sont Or, les seuils sont peut-etre trop eleves
3. Modifiez les paliers :
   - Baissez le seuil de l'Argent de 5 000 a 2 000 points
   - Baissez le seuil de l'Or de 15 000 a 8 000 points
4. Augmentez les multiplicateurs pour rendre les paliers superieurs plus attractifs
5. Ajoutez de nouveaux avantages aux paliers eleves
6. Sauvegardez et communiquez les changements aux clients par newsletter

### Scenario 3 : Analyser l'efficacite du programme

1. Consultez les statistiques : total de points gagnes vs. echanges
2. Si peu de points sont echanges, le seuil minimum est peut-etre trop eleve -- reduisez-le
3. Si beaucoup de points expirent (section expiration), les clients ne voient pas assez de valeur -- ajoutez des recompenses attrayantes au catalogue
4. Consultez les transactions recentes pour identifier les comportements dominants (achats vs. referrals vs. avis)
5. Ajustez les bonus en consequence

---

## Foire aux questions (FAQ)

**Q : Les points sont-ils retires si un client retourne un produit ?**
R : Cela depend de la configuration de vos regles de remboursement. Le systeme peut etre configure pour annuler les points associes a une commande remboursee.

**Q : Les paliers peuvent-ils retrograder ?**
R : Par defaut, les paliers ne retrogradent pas. Une fois qu'un client atteint un palier, il le conserve. Cette logique peut etre modifiee dans les regles avancees du programme.

**Q : Puis-je offrir des points manuellement a un client ?**
R : Oui. Utilisez le bouton **Ajuster les points** dans le ruban pour crediter ou debiter des points sur le compte d'un client specifique.

**Q : Comment les defis interagissent-ils avec les points ?**
R : Les defis offrent des points bonus supplementaires quand le client complete l'objectif. Ces points s'ajoutent aux points gagnes normalement par les achats. Les defis ont une date de debut et de fin.

**Q : Le catalogue de recompenses est-il modifiable ?**
R : Le catalogue est defini dans la configuration centrale du systeme (fichier constants). Pour modifier les recompenses disponibles, contactez l'equipe technique ou modifiez le fichier source.

---

## Strategie expert : Conception d'un programme de fidelite pour un e-commerce de peptides

### Architecture des paliers optimisee pour BioCycle Peptides

Un programme de fidelite efficace dans le marche des peptides doit tenir compte de la valeur moyenne des commandes (generalement 150-400$ CAD) et de la frequence d'achat (4-8 commandes par an pour un client regulier).

**Structure de paliers recommandee :**

| Palier | Seuil (points) | Equivalent depenses | Multiplicateur | Population cible |
|--------|----------------|---------------------|----------------|------------------|
| **Bronze** | 0 - 499 pts | 0 - 499$ depenses | x1.0 | Nouveaux clients, acheteurs ponctuels |
| **Argent (Silver)** | 500 - 1 499 pts | 500 - 1 499$ depenses | x1.25 | Clients reguliers (2-3 commandes) |
| **Or (Gold)** | 1 500 - 4 999 pts | 1 500 - 4 999$ depenses | x1.5 | Clients fideles (4-8 commandes/an) |
| **Platine (Platinum)** | 5 000+ pts | 5 000$+ depenses | x2.0 | Clients VIP, laboratoires, institutions |

**Regle de base :** 1 point par dollar depense (avant taxes). Cela rend le systeme intuitif et facile a communiquer.

**Valeur du point :** 1 point = 0.02$ en rachat (2 cents). Cela signifie qu'un client Bronze recupere 2% de ses achats en recompenses, un client Argent 2.5%, un client Or 3%, et un client Platine 4%. Ce taux est competitif dans le marche e-commerce B2B.

### Recompenses motivantes par palier

Les recompenses doivent etre adaptees au profil d'un acheteur de peptides. Les remises generiques ne suffisent pas -- il faut proposer des avantages a forte valeur percue.

| Palier | Recompenses disponibles |
|--------|------------------------|
| **Bronze** | Livraison gratuite a partir de 200$ (au lieu de 300$), 5% de remise sur la prochaine commande (100 pts), acces aux promotions flash en avant-premiere |
| **Argent** | Livraison gratuite sans minimum, 10% de remise (250 pts), acces anticipe aux nouveaux produits (48h avant le public), support prioritaire par chat |
| **Or** | 15% de remise (400 pts), consultation gratuite avec un expert produits (1x/trimestre), echantillons gratuits de nouveaux peptides, invitation aux webinaires prives |
| **Platine** | 20% de remise (500 pts), gestionnaire de compte dedie, prix de gros sur les commandes de 10+ unites, acces beta aux nouveaux produits, invitation aux evenements BioCycle |

**Recompenses experientielles (haute valeur percue, faible cout) :**
- Consultation gratuite avec un expert BioCycle (cout reel : 0$, valeur percue : 150$+)
- Acces anticipe aux nouveaux produits (cout : 0$, cree un sentiment d'exclusivite)
- Invitation aux webinaires prives (cout : 0$, renforce la communaute et l'education)
- Certificat d'analyse personnalise avec le nom du labo du client (cout : 0$, valeur professionnelle)

### Budget et retour sur investissement du programme

**Cout du programme en pourcentage du chiffre d'affaires :**

| Composante | Cout estime | % du CA |
|------------|-------------|---------|
| Points distribues (valeur de rachat) | 2-4% du CA | 2-4% |
| Bonus speciaux (inscription, anniversaire, referral, avis) | 0.3-0.5% du CA | 0.3-0.5% |
| Livraison gratuite (paliers Silver+) | Variable selon volume | ~0.5-1% |
| Administration et technologie | Inclus dans Koraline | 0% supplementaire |
| **Total programme** | | **2.8-5.5% du CA** |

**Retour mesurable :**

| Indicateur | Sans programme | Avec programme | Amelioration |
|------------|---------------|----------------|--------------|
| Taux de retention a 12 mois | 30-35% | 55-60% | +25 points |
| Frequence d'achat annuelle | 2.5 commandes | 4.5 commandes | +80% |
| Valeur a vie du client (LTV) | 750$ | 1 800$ | +140% |
| Panier moyen | 200$ | 230$ | +15% |
| Cout d'acquisition equivalent | Publicite : 45-80$/client | Referral fidelite : 15-25$/client | -60% |

**Seuil de rentabilite :** Un programme de fidelite commence a etre rentable des que le taux de retention augmente de 5% ou plus (Frederick Reichheld, Bain & Company). Avec une augmentation cible de 25%, le ROI est largement positif.

### Strategies d'engagement specifiques aux peptides

**Bonus d'achat recurrent :** Les clients de peptides achevent souvent les memes produits cycliquement. Offrir un bonus de 2x les points pour les commandes passees dans les 45 jours suivant la precedente encourage la regularite.

**Bonus de panier eleve :** Pour les commandes depassant 500$, offrir un bonus de 50 points supplementaires. Cela motive les clients a consolider leurs achats plutot que de passer plusieurs petites commandes (ce qui reduit aussi les couts de logistique).

**Defis trimestriels adaptes :**

| Defi | Objectif | Recompense | Duree |
|------|----------|------------|-------|
| "Explorateur" | Commander 3 produits differents | 200 points bonus | 3 mois |
| "Fidele" | Passer 3 commandes consecutives | 150 points bonus | 3 mois |
| "Ambassadeur" | Parrainer 2 nouveaux clients | 300 points bonus | 3 mois |
| "Expert" | Laisser 3 avis detailles (50+ mots) | 100 points bonus | 3 mois |
| "Volume" | Depasser 1 000$ d'achats dans le trimestre | 250 points bonus | 3 mois |

### Communication du programme

La communication est aussi importante que la mecanique. Les clients doivent comprendre et percevoir la valeur du programme.

**Points de contact obligatoires :**
1. **Email de bienvenue** : A l'inscription, detailler les paliers et les premieres recompenses accessibles
2. **Widget sur le site** : Afficher le solde de points et le prochain palier sur chaque page du compte client
3. **Email transactionnel** : Apres chaque achat, indiquer les points gagnes et le solde total
4. **Alerte de palier** : Notifier le client quand il est a 80% d'un nouveau palier ("Plus que 120 points pour atteindre le palier Or !")
5. **Rappel d'expiration** : 30 jours avant l'expiration des points, envoyer un email avec les recompenses disponibles
6. **Rapport mensuel** : Resume des points gagnes, depenses et disponibles

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Points** | Unite de recompense accumulee par les clients a chaque action (achat, referral, avis, etc.) |
| **Palier (tier)** | Niveau de statut du client (Bronze, Argent, Or, Platine) offrant des avantages croissants |
| **Multiplicateur** | Facteur applique aux points gagnes selon le palier (ex: x1.5 = 50 % de points en plus) |
| **Rachat (redemption)** | Action d'echanger des points contre une recompense |
| **Seuil minimum** | Nombre minimum de points requis pour effectuer un rachat |
| **Defi (challenge)** | Mission temporaire offrant des points bonus a la completion |
| **Gamification** | Utilisation de mecaniques de jeu (defis, badges, paliers) pour stimuler l'engagement |
| **Expiration** | Perte automatique des points non utilises apres un delai defini |
| **Bridge** | Lien contextuel vers une section connexe de l'administration |

---

## Pages liees

- [Webinaires](/admin/webinaires) -- les webinaires educatifs pour les clients fideles
- [Promotions](/admin/promotions) -- les promotions qui peuvent integrer les points de fidelite
- [Ambassadeurs](/admin/ambassadeurs) -- le programme de referral qui genere des bonus de points
- [Avis clients](/admin/avis) -- les avis qui generent des bonus de points
- [Clients](/admin/customers) -- les profils clients avec leur solde de points et palier
- [Codes promo](/admin/promo-codes) -- les codes de reduction lies aux recompenses
