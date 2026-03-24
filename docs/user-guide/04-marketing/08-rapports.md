# Rapports Marketing

> **Section**: Marketing > Rapports
> **URL**: `/admin/rapports`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Rapports** est votre tableau de bord d'analyse commerciale. Elle consolide les donnees de ventes en provenance de la comptabilite et les presente sous forme de graphiques et de classements. Vous pouvez suivre le revenu, le nombre de commandes, le panier moyen, les produits les plus vendus, et la repartition geographique des ventes.

**En tant que gestionnaire, vous pouvez :**
- Visualiser le revenu total, le nombre de commandes et le panier moyen
- Comparer la periode actuelle avec la periode precedente (tendance en pourcentage)
- Consulter un graphique du revenu quotidien
- Voir le classement des produits les plus vendus
- Analyser la repartition des ventes par region (province, territoire)
- Filtrer les donnees par periode (7 jours, 30 jours, 90 jours, 12 mois)
- Exporter les donnees en CSV ou en PDF
- Imprimer le rapport
- Generer un resume textuel des statistiques

---

## Concepts pour les debutants

### Pourquoi suivre les rapports marketing ?

Les rapports marketing repondent a des questions essentielles pour piloter votre activite :
- **Combien gagnons-nous ?** Le revenu total vous donne le chiffre d'affaires.
- **Combien de commandes recevons-nous ?** Le volume de commandes indique la demande.
- **Quel est le panier moyen ?** Le montant moyen par commande revele le comportement d'achat.
- **Quels produits se vendent le mieux ?** Le classement des top produits oriente votre strategie.
- **D'ou viennent les ventes ?** La repartition geographique aide a cibler vos efforts marketing.
- **La tendance est-elle a la hausse ou a la baisse ?** Les pourcentages de variation montrent l'evolution.

### Les periodes d'analyse

| Periode | Description |
|---------|-------------|
| **7 jours** | Derniere semaine -- utile pour un suivi quotidien |
| **30 jours** | Dernier mois -- la vue la plus courante |
| **90 jours** | Dernier trimestre -- pour les tendances moyennes |
| **12 mois** | Derniere annee -- pour la vue strategique |

### Comment sont calculees les donnees ?

Les donnees proviennent de la comptabilite reelle (factures clients). Le systeme interroge les API comptables en temps reel pour construire les rapports. Les montants sont calcules en cents pour eviter les erreurs d'arrondi, puis convertis en dollars pour l'affichage.

### Comparaison avec la periode precedente

Chaque metrique principale (revenu, commandes, panier moyen) est accompagnee d'un pourcentage de variation par rapport a la meme duree precedente. Par exemple, si vous regardez les 30 derniers jours, la comparaison se fait avec les 30 jours d'avant.

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche**, cliquez sur **Rapports**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Cliquez sur l'icone de la section **Marketing** dans le rail
2. Cliquez sur **Rapports**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche (ou tapez `/`)
2. Tapez "rapports" ou "reports"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Fonction |
|--------|----------|
| **Generer le rapport** | Recharger les donnees pour la periode selectionnee |
| **Resume** | Afficher un resume textuel des statistiques cles |
| **Comparer periodes** | Afficher la comparaison detaillee avec la periode precedente |
| **Exporter PDF** | Telecharger le rapport comptable en format PDF |
| **Exporter Excel** | Telecharger les donnees en fichier CSV |
| **Imprimer** | Ouvrir la fenetre d'impression du navigateur |

### 2. L'en-tete et le selecteur de periode

En haut de la page :
- Titre : "Rapports Marketing"
- Sous-titre descriptif
- **Selecteur de periode** : Menu deroulant pour choisir 7 jours, 30 jours, 90 jours ou 12 mois
- **Bouton Exporter PDF** : Acces rapide a l'export PDF

### 3. Les cartes de statistiques principales

4 cartes disposees en ligne :

| Carte | Description | Tendance |
|-------|-------------|----------|
| **Revenu total** | Chiffre d'affaires pour la periode | Variation en % vs periode precedente |
| **Commandes** | Nombre total de commandes | Variation en % |
| **Panier moyen** | Montant moyen par commande | Variation en % |
| **Factures en attente** | Nombre de factures non reglees | -- |

Les tendances sont affichees en vert (hausse) ou en rouge (baisse) avec un pourcentage.

### 4. Le graphique du revenu quotidien

Un graphique en barres verticales montrant le revenu pour chaque jour de la periode. Les 30 derniers jours sont affiches. Au survol de chaque barre, une infobulle affiche la date, le montant et le nombre de commandes.

### 5. Les produits les plus vendus

Un classement des 10 produits les plus vendus pour la periode, avec :
- Un numero de rang (1 a 10) dans un cercle
- Le nom du produit
- Une barre de progression proportionnelle aux ventes
- Le revenu genere
- Le nombre d'unites vendues

### 6. Les ventes par region

Un classement des regions (provinces/territoires canadiens) avec :
- Le nom de la region
- Une barre de progression proportionnelle au revenu
- Le revenu genere
- Le nombre de commandes

### 7. La repartition par region (pourcentage)

Un second panneau montrant la distribution en pourcentage du revenu par region, avec des barres de progression et le pourcentage exact.

---

## Fonctionnalites detaillees

### 1. Changer la periode d'analyse

1. Cliquez sur le selecteur de periode en haut a droite
2. Choisissez parmi : 7 jours, 30 jours, 90 jours, 12 mois
3. Les donnees se rechargent automatiquement
4. Toutes les cartes, graphiques et tableaux se mettent a jour

### 2. Consulter la comparaison avec la periode precedente

**Methode rapide** : Les cartes de statistiques affichent deja le pourcentage de variation.

**Methode detaillee** : Cliquez sur **Comparer periodes** dans le ruban. Un toast affiche un resume complet :
- Revenu : montant actuel vs precedent (et variation en %)
- Commandes : nombre actuel vs precedent (et variation en %)
- Panier moyen : montant actuel vs precedent (et variation en %)

### 3. Generer un resume textuel

Cliquez sur **Resume** dans le ruban. Un toast affiche :
- Revenu total de la periode
- Nombre de commandes
- Panier moyen
- Top 3 des produits les plus vendus

Utile pour obtenir rapidement les chiffres cles sans parcourir toute la page.

### 4. Exporter en PDF

1. Cliquez sur **Exporter PDF** dans le ruban ou le bouton en haut a droite
2. Un nouvel onglet s'ouvre avec le rapport PDF genere par le systeme comptable
3. Telechargez ou imprimez le PDF

Le PDF est genere par l'API comptable et contient un rapport de revenus formate pour la periode selectionnee.

### 5. Exporter en CSV

1. Cliquez sur **Exporter Excel** dans le ruban
2. Le fichier CSV se telecharge automatiquement
3. Il contient trois sections :
   - **Donnees quotidiennes** : date, revenu, commandes, panier moyen
   - **Produits les plus vendus** : nom, nombre de ventes, revenu
   - **Ventes par region** : region, commandes, revenu

### 6. Imprimer le rapport

Cliquez sur **Imprimer** dans le ruban. La fenetre d'impression du navigateur s'ouvre. Les styles d'impression sont optimises pour un rendu lisible sur papier.

---

## Scenarios concrets

### Scenario A : Bilan mensuel pour l'equipe de direction

1. Selectionnez la periode **30 jours**
2. Notez le revenu total et le nombre de commandes
3. Consultez la tendance vs le mois precedent
4. Cliquez sur **Resume** pour obtenir les chiffres cles
5. Exportez en PDF pour joindre au rapport de direction
6. Exportez en CSV pour une analyse plus poussee dans Excel

### Scenario B : Identifier les produits a promouvoir

1. Selectionnez la periode **90 jours** pour une vue trimestrielle
2. Consultez le classement des produits les plus vendus
3. Identifiez les produits qui se vendent bien naturellement : renforcez leurs promotions
4. Identifiez les produits absents du top 10 mais a fort potentiel : creez des codes promo ou des bannieres dedies
5. Croisez avec les donnees par region pour cibler vos campagnes geographiquement

### Scenario C : Analyser l'impact d'une campagne marketing

1. Notez le revenu et les commandes AVANT la campagne (selectionnez la periode precedente)
2. Lancez votre campagne (code promo, newsletter, banniere)
3. Apres la campagne, consultez les rapports pour la periode couvrant la campagne
4. Utilisez **Comparer periodes** pour voir la variation
5. Si le revenu a augmente significativement, la campagne est un succes

---

## FAQ

**Q: D'ou proviennent les donnees de revenus ?**
R: Les donnees proviennent du module de comptabilite (factures clients). Le systeme interroge les API comptables en temps reel, ce qui garantit que les chiffres sont toujours a jour.

**Q: Les taxes sont-elles incluses dans le revenu affiche ?**
R: Le revenu total correspond au total des factures (TTC -- toutes taxes comprises). Les rapports fiscaux detailles sont disponibles dans le module Comptabilite.

**Q: Pourquoi le graphique n'affiche-t-il que 30 jours meme si je selectionne 90 jours ?**
R: Le graphique en barres affiche les 30 derniers jours de la periode pour rester lisible. Les cartes de statistiques et les classements, eux, couvrent la totalite de la periode selectionnee.

**Q: Comment la tendance est-elle calculee ?**
R: La tendance compare la periode actuelle avec une periode de meme duree juste avant. Par exemple, si vous regardez les 30 derniers jours, le systeme compare avec les 30 jours precedents.

**Q: Le fichier PDF est-il le meme que celui de la comptabilite ?**
R: Oui. Le bouton Exporter PDF genere un rapport de revenus via l'API comptable, avec un format professionnel adapte a la transmission a un comptable ou a la direction.

---

## Strategie expert : interpretation des KPIs marketing

### Les 3 KPIs fondamentaux et leurs seuils de sante

**1. CAC (Cout d'acquisition client)**

Le CAC represente combien vous depensez en marketing pour acquerir un nouveau client.

**Formule** : `CAC = Total depenses marketing / Nombre de nouveaux clients acquis`

| CAC | Interpretation | Action |
|-----|---------------|--------|
| < CLV/3 | Sain | Investir davantage pour accelerer la croissance |
| CLV/3 a CLV/2 | Correct mais a surveiller | Optimiser les canaux les moins performants |
| > CLV/2 | Dangereux | Reduire les depenses ou ameliorer la conversion |
| > CLV | Perte nette | Stopper les campagnes non rentables immediatement |

**Exemple pour BioCycle Peptides** :
- CLV moyenne estimee : 600 $CA (4 commandes x 150 $CA sur 18 mois)
- CAC sain : < 200 $CA (600/3)
- Si votre CAC depasse 300 $CA, reduisez les depenses publicitaires et renforcez le SEO et le contenu organique

**2. ROAS (Return On Ad Spend)**

Le ROAS mesure le revenu genere pour chaque dollar depense en publicite.

**Formule** : `ROAS = Revenu genere par la campagne / Cout de la campagne`

| ROAS | Interpretation | Action |
|------|---------------|--------|
| > 5x | Excellent | Augmenter le budget de cette campagne |
| 3x a 5x | Rentable | Maintenir et optimiser |
| 2x a 3x | Correct | Optimiser le ciblage et les creations |
| 1x a 2x | Marginal | Revoir la strategie ou stopper |
| < 1x | Perte | Stopper immediatement |

**3. CLV (Customer Lifetime Value)**

La valeur a vie du client mesure le revenu total qu'un client genere pendant toute sa relation avec BioCycle Peptides.

**Formule simplifiee** : `CLV = Panier moyen x Frequence d'achat annuelle x Duree moyenne de la relation (en annees)`

### Attribution multi-canal

Un client interagit avec plusieurs canaux avant d'acheter. L'attribution permet de savoir quel canal a le plus contribue a la conversion.

| Modele | Principe | Quand l'utiliser |
|--------|----------|-----------------|
| **Dernier clic** | 100% du credit au dernier canal avant l'achat | Analyse simple, decisions rapides |
| **Premier clic** | 100% du credit au canal de decouverte | Evaluer l'efficacite d'acquisition |
| **Lineaire** | Credit reparti equitablement entre tous les canaux | Vue equilibree de l'entonnoir |
| **En U** | 40% premier clic, 40% dernier clic, 20% reparti | Le plus recommande pour l'e-commerce |

**Parcours d'achat typique BioCycle Peptides** :
1. Decouverte via Google ("buy peptides Canada") -- SEO/SEA
2. Visite du blog (article sur le BPC-157) -- Content marketing
3. Inscription newsletter (code BIENVENUE10 recu) -- Email marketing
4. Retargeting Facebook/Instagram -- Publicite payante
5. Achat avec le code BIENVENUE10 -- Conversion

Dans cet exemple, le modele "dernier clic" crediterait uniquement l'email. Le modele "en U" crediterait surtout le SEO (decouverte) et l'email (conversion), avec une part pour le blog et le retargeting.

### Analyse de cohortes

L'analyse de cohortes regroupe les clients par date d'acquisition et suit leur comportement dans le temps. C'est l'outil le plus puissant pour mesurer la retention.

**Comment lire un tableau de cohortes** :

| Cohorte | Mois 0 | Mois 1 | Mois 2 | Mois 3 | Mois 6 | Mois 12 |
|---------|--------|--------|--------|--------|--------|---------|
| Janvier 2026 | 100% | 25% | 20% | 18% | 12% | 8% |
| Fevrier 2026 | 100% | 30% | 25% | 22% | 15% | -- |
| Mars 2026 | 100% | 35% | 28% | -- | -- | -- |

- **Mois 0** = premiere commande (toujours 100%)
- **Mois 1** = pourcentage de clients qui ont commande a nouveau le mois suivant
- **Tendance saine** : les cohortes recentes ont de meilleurs taux de retention (signe que vos efforts marketing et produit s'ameliorent)

**Cibles de retention pour peptides (e-commerce de niche)** :
| Periode | Taux de retention cible |
|---------|----------------------|
| Mois 1 | 25-35% |
| Mois 3 | 15-25% |
| Mois 6 | 10-18% |
| Mois 12 | 8-15% |

Si vos taux sont inferieurs, concentrez-vous sur les emails post-achat, les rappels de reapprovisionnement et les programmes de fidelite avant d'investir davantage en acquisition.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Revenu total** | Le chiffre d'affaires cumule pour la periode selectionnee |
| **Panier moyen** | Le montant moyen depense par commande (revenu / nombre de commandes) |
| **Tendance** | Le pourcentage de variation par rapport a la meme duree de la periode precedente |
| **Top produits** | Les produits classes par revenu genere sur la periode |
| **Region** | Province ou territoire canadien d'ou provient la commande |
| **CSV** | Comma-Separated Values, format tabulaire compatible avec Excel et Google Sheets |
| **PDF** | Portable Document Format, format de document non modifiable pour les rapports |
| **TTC** | Toutes Taxes Comprises -- montant incluant la TPS/TVQ/TVH |

---

## Pages liees

- [Commandes](/admin/commandes) -- Voir le detail de chaque commande
- [Comptabilite](/admin/comptabilite) -- Ecritures comptables et rapports fiscaux
- [Codes Promo](/admin/promo-codes) -- Creer des promotions et mesurer leur impact
- [Promotions](/admin/promotions) -- Remises automatiques
- [Newsletter](/admin/newsletter) -- Campagnes email et leur impact sur les ventes
- [Blog Analytics](/admin/blog/analytics) -- Statistiques du blog
