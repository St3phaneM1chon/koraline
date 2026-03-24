# Gestion des Promotions

> **Section**: Marketing > Promotions
> **URL**: `/admin/promotions`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Promotions** permet de creer et gerer des remises automatiques qui s'appliquent sans que le client ait besoin de saisir un code. Contrairement aux codes promo, les promotions sont appliquees automatiquement selon des regles que vous definissez.

**En tant que gestionnaire, vous pouvez :**
- Creer des promotions de 5 types differents (reduction produit, reduction categorie, lot, achetez X obtenez Y, vente eclair)
- Definir une reduction en pourcentage ou en montant fixe
- Planifier les dates de debut et de fin
- Activer ou desactiver une promotion instantanement
- Definir une priorite pour gerer les conflits entre promotions
- Dupliquer une promotion existante pour la modifier
- Filtrer les promotions par type ou par statut
- Consulter les produits et categories cibles
- Exporter la liste des promotions en CSV
- Supprimer les promotions obsoletes

---

## Concepts pour les debutants

### Quelle difference entre un code promo et une promotion ?

Un **code promo** necessite que le client saisisse un code dans un champ au moment du paiement. Une **promotion** s'applique automatiquement : le client voit la remise directement sur la page produit ou dans son panier, sans rien faire.

### Les 5 types de promotions

| Type | Description | Exemple |
|------|-------------|---------|
| **Reduction produit** | Remise sur un ou plusieurs produits specifiques | -15% sur le BPC-157 |
| **Reduction categorie** | Remise sur tous les produits d'une categorie | -10% sur toute la categorie "Peptides de reparation" |
| **Lot (Bundle)** | Remise quand le client achete un groupe de produits ensemble | Pack de 3 peptides a -20% |
| **Achetez X obtenez Y** | Le client achete un certain nombre de produits et en recoit d'autres en bonus ou a prix reduit | Achetez 2, obtenez 1 gratuit |
| **Vente eclair (Flash Sale)** | Remise temporaire qui s'applique a tout le catalogue | -25% sur tout le site pendant 48h |

### Priorite des promotions

Quand plusieurs promotions pourraient s'appliquer au meme produit, c'est la **priorite** qui determine laquelle est utilisee. La promotion avec le numero de priorite le plus eleve l'emporte.

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche**, cliquez sur **Promotions**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Dans la colonne d'icones tout a gauche, cliquez sur l'icone de la section **Marketing**
2. Le panneau "Marketing" s'ouvre
3. Cliquez sur **Promotions**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche en haut (ou tapez `/`)
2. Tapez "promotions"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

L'interface est divisee en **4 zones principales** :

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Fonction |
|--------|----------|
| **Nouvelle promotion** | Ouvrir le formulaire de creation |
| **Supprimer** | Supprimer la promotion selectionnee |
| **Planifier** | Ouvrir le formulaire d'edition avec les champs de dates pre-remplis |
| **Activer** | Activer la promotion selectionnee |
| **Desactiver** | Desactiver la promotion selectionnee |
| **Dupliquer** | Creer une copie de la promotion selectionnee |
| **Performance** | Afficher un resume statistique de toutes les promotions |
| **Exporter** | Telecharger la liste des promotions en CSV |

### 2. Les cartes de statistiques

4 cartes en haut de la page :

| Carte | Description |
|-------|-------------|
| **Total** | Nombre total de promotions |
| **Actives** | Nombre de promotions actuellement actives |
| **Ventes eclair** | Nombre de promotions de type Flash Sale |
| **Lots** | Nombre de promotions de type Bundle |

### 3. La liste des promotions (panneau central)

- **Onglets de filtrage** : Toutes, Actives, Reduction produit, Reduction categorie, Ventes eclair, Lots, Achetez X obtenez Y
- **Barre de recherche** : Recherchez par nom de promotion
- **Chaque promotion affiche** : nom, valeur de la remise, type de promotion (badge colore), statut (actif, inactif, expire), et priorite

### 4. Le panneau de detail (panneau droit)

Quand vous selectionnez une promotion :
- **Statut** avec interrupteur pour activer/desactiver
- **Remise** : valeur et type (pourcentage ou montant fixe)
- **Priorite** : numero de priorite
- **Details specifiques au type** : pour "Achetez X obtenez Y", les quantites a acheter et a recevoir ; pour "Lot", le nombre de produits inclus ; pour les types avec quantite minimum, le seuil
- **Validite** : dates de debut et de fin
- **Cibles** : produits et categories concernes
- **Metadonnees** : identifiant, date de creation

---

## Fonctionnalites detaillees

### 1. Creer une nouvelle promotion

**Etapes** :
1. Cliquez sur **Nouvelle promotion** dans le ruban ou sur le bouton en haut a droite
2. Remplissez le formulaire :
   - **Nom** (obligatoire) : Un nom descriptif (par exemple "Soldes d'ete 2026")
   - **Type de promotion** : Choisissez parmi les 5 types disponibles
   - **Type de remise** : Pourcentage ou Montant fixe
   - **Valeur** (obligatoire) : Le chiffre de la remise
   - Pour **Achetez X obtenez Y** : Saisissez la quantite a acheter et la quantite offerte
   - Pour **Lot** ou **Achetez X obtenez Y** : Saisissez la quantite minimum
   - **Date de debut** : Quand la promotion commence
   - **Date de fin** : Quand la promotion expire
   - **S'applique a tous les produits** : Cochez pour une promotion globale (automatiquement coche pour les ventes eclair)
3. Cliquez sur **Creer**

**Validations** :
- Le nom ne peut pas etre vide
- La valeur doit etre superieure a 0
- Un pourcentage ne peut pas depasser 100%
- La date de fin doit etre posterieure a la date de debut

### 2. Activer ou desactiver une promotion

1. Selectionnez la promotion dans la liste
2. Utilisez l'interrupteur dans le panneau de detail
3. Le changement est immediat

### 3. Planifier une promotion

**Objectif** : Definir ou modifier les dates de debut et de fin.

1. Selectionnez la promotion
2. Cliquez sur **Planifier** dans le ruban
3. Le formulaire d'edition s'ouvre avec les champs de dates en focus
4. Modifiez les dates
5. Sauvegardez

### 4. Dupliquer une promotion

1. Selectionnez la promotion a copier
2. Cliquez sur **Dupliquer** dans le ruban
3. Le formulaire de creation s'ouvre avec tous les champs pre-remplis et le nom suffixe par "(copy)"
4. Les dates sont remises a zero pour que vous puissiez en definir de nouvelles
5. Modifiez les parametres et cliquez sur **Creer**

### 5. Consulter les statistiques de performance

Cliquez sur **Performance** dans le ruban. Un toast affiche le total de promotions, le nombre d'actives, le nombre d'expirees, et la repartition par type.

### 6. Exporter en CSV

1. Appliquez vos filtres
2. Cliquez sur **Exporter** dans le ruban
3. Le fichier se telecharge avec les colonnes : Nom, Type, Remise, Valeur, Active, Date debut, Date fin, Priorite

---

## Scenarios concrets

### Scenario A : Creer une vente eclair de 48 heures

1. Cliquez sur **Nouvelle promotion**
2. Nom : "Flash Sale Weekend"
3. Type de promotion : **Vente eclair**
4. Type de remise : Pourcentage
5. Valeur : 20
6. Date de debut : vendredi 18:00
7. Date de fin : dimanche 18:00
8. La case "S'applique a tous" est automatiquement cochee
9. Cliquez sur **Creer**

### Scenario B : Configurer une offre "Achetez 2, obtenez 1 gratuit"

1. Cliquez sur **Nouvelle promotion**
2. Nom : "Buy 2 Get 1 Free - BPC-157"
3. Type de promotion : **Achetez X obtenez Y**
4. Quantite a acheter : 2
5. Quantite offerte : 1
6. Type de remise : Pourcentage
7. Valeur : 100 (100% = gratuit pour le produit offert)
8. Quantite minimum : 2
9. Cliquez sur **Creer**

### Scenario C : Comparer la performance de differents types de promotions

1. Ouvrez la page Promotions
2. Cliquez sur **Performance** dans le ruban pour un resume global
3. Utilisez les onglets de filtrage pour voir separement les ventes eclair, les lots, etc.
4. Exportez en CSV pour une analyse detaillee dans Excel

---

## FAQ

**Q: Peut-on avoir une promotion et un code promo qui s'appliquent en meme temps ?**
R: Oui, une promotion automatique et un code promo peuvent se cumuler sur la meme commande, a condition que vos regles le permettent. Verifiez les montants resultants pour eviter des remises excessives.

**Q: Comment gerer les conflits quand deux promotions s'appliquent au meme produit ?**
R: Le systeme utilise le champ **Priorite**. La promotion avec la priorite la plus elevee l'emporte. Assurez-vous de definir des priorites differentes pour eviter les ambiguites.

**Q: Que se passe-t-il quand une promotion expire ?**
R: Le statut passe automatiquement a "Expire" (affiche en rouge). La promotion n'est plus appliquee aux nouvelles commandes. Elle reste visible dans l'admin pour consultation.

**Q: Une vente eclair s'applique-t-elle automatiquement a tout le catalogue ?**
R: Oui, quand vous choisissez le type "Vente eclair", la case "S'applique a tous les produits" est automatiquement cochee et ne peut pas etre decochee.

**Q: Puis-je creer une promotion sans date de fin ?**
R: Oui, si vous laissez la date de fin vide, la promotion reste active indefiniment (jusqu'a ce que vous la desactiviez manuellement).

---

## Strategie expert : calendrier promotionnel annuel pour peptides

### Pourquoi planifier un calendrier annuel ?

Un calendrier promotionnel structure evite les promotions improvisees (qui diluent vos marges) et aligne vos offres avec les cycles d'achat naturels de votre clientele. Pour un e-commerce de peptides au Canada, ces cycles suivent les saisons de sante, de recherche universitaire et les evenements commerciaux majeurs.

### Calendrier recommande

| Mois | Evenement | Type de promotion | Exemple |
|------|-----------|-------------------|---------|
| **Janvier** | Resolutions sante / Nouveau depart | Reduction categorie "Reparation" + "Longevite" | -15% sur BPC-157, TB-500, Epitalon pendant 2 semaines |
| **Fevrier** | Saint-Valentin (sante en duo) | Bundle : achete 2 produits = 10% sur le 2e | Pack "Research Duo" |
| **Mars** | Printemps / Detox / Renouveau | Vente eclair 48h sur peptides "Detox & Recovery" | Flash Sale -20% GHK-Cu, Thymosin Alpha-1 |
| **Avril** | Paques / Fin trimestre universitaire | Code promo newsletter | `SPRING15` 15% min 100 $CA |
| **Mai** | Fete des meres / Bien-etre | Reduction produit sur peptides collagene | -10% sur tous les peptides de la categorie "Peau & Collagene" |
| **Juin** | Ete fitness / Pre-vacances | Bundle "Summer Stack" | Pack BPC-157 + TB-500 + eau bacteriostatique a -20% |
| **Juillet** | Soldes mi-annee | Vente eclair tout le catalogue 72h | Flash Sale -15% sur tout |
| **Aout** | Rentree recherche (universites reprennent) | Code B2B pour les labos | `LABRENTREE` 20% premiere commande B2B |
| **Septembre** | Rentree generale / Boost immunitaire | Reduction categorie "Immunitaire" | -15% Thymosin Alpha-1, BPC-157 |
| **Octobre** | Halloween (ludique) / Pre-Black Friday teaser | Loterie code surprise | Code mystere entre 5% et 25% |
| **Novembre** | Black Friday + Cyber Monday | La plus grosse promo de l'annee | -25% tout le site 4 jours, max 500 usages |
| **Decembre** | Noel / Coffrets cadeaux | Bundles cadeaux + cartes-cadeaux | Coffret "Starter Research Kit" a prix reduit |

### Flash Sale : bonnes pratiques

Les ventes eclair sont les promotions les plus efficaces pour generer un pic de revenu rapide, mais elles doivent etre executees correctement :

**Duree optimale** : 24 a 48 heures. Au-dela de 72h, l'effet d'urgence disparait.

**Elements d'urgence a activer** :
- Banniere avec compte a rebours en page d'accueil
- Email d'annonce 2h avant le debut
- Email de rappel "Derniere chance" 6h avant la fin
- Mention "Stock limite" sur les produits concernes (si applicable)

**Frequence recommandee** : Maximum 1 flash sale par mois. Au-dela, vos clients apprendront a attendre les promotions plutot que d'acheter au prix normal.

**Mesure de succes** :
- Revenu pendant la flash sale vs meme periode le mois precedent
- Nombre de nouveaux clients acquis
- Impact sur le panier moyen (il baisse generalement de 10-15% pendant une flash sale, c'est normal)
- Revenus la semaine suivante (attention a l'effet de cannibalisation : les clients qui auraient achete la semaine suivante ont accelere leur achat)

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Promotion** | Une remise automatique appliquee sans saisie de code par le client |
| **Vente eclair** | Une promotion de courte duree qui s'applique a tout le catalogue (Flash Sale) |
| **Lot (Bundle)** | Un groupe de produits vendus ensemble avec une remise |
| **Achetez X obtenez Y** | Offre ou l'achat d'une certaine quantite donne droit a des produits supplementaires |
| **Priorite** | Numero qui determine quelle promotion s'applique en cas de conflit |
| **Reduction produit** | Remise ciblee sur un ou plusieurs produits specifiques |
| **Reduction categorie** | Remise sur tous les produits d'une categorie donnee |

---

## Pages liees

- [Codes Promo](/admin/promo-codes) -- Codes de reduction a saisir par le client
- [Produits](/admin/produits) -- Les produits concernes par les promotions
- [Categories](/admin/categories) -- Les categories de produits
- [Rapports marketing](/admin/rapports) -- Analyser l'impact des promotions sur les ventes
- [Commandes](/admin/commandes) -- Voir les commandes ayant beneficie d'une promotion
