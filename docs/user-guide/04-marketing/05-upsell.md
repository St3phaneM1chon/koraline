# Configuration Upsell / Cross-Sell

> **Section**: Marketing > Upsell
> **URL**: `/admin/upsell`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Upsell** permet de configurer les regles de vente additionnelle qui s'affichent sur les pages produit de votre boutique. L'objectif est d'inciter le client a augmenter la valeur de son panier, soit en achetant une plus grande quantite (remise volume), soit en souscrivant a un abonnement recurrent.

**En tant que gestionnaire, vous pouvez :**
- Definir une configuration globale qui s'applique a tous les produits
- Creer des configurations specifiques par produit (qui remplacent la configuration globale)
- Activer ou desactiver l'affichage des remises volume
- Activer ou desactiver l'affichage des offres d'abonnement
- Choisir la regle d'affichage (toujours, une fois par session, une fois par produit)
- Personnaliser les titres et sous-titres des sections upsell
- Definir la quantite et la frequence d'abonnement suggerees
- Dupliquer une configuration pour l'appliquer a un autre produit
- Exporter les configurations en CSV
- Consulter les statistiques de conversion

---

## Concepts pour les debutants

### Qu'est-ce que l'upsell ?

L'upsell (ou "vente incitative") consiste a proposer au client un achat de valeur superieure a ce qu'il envisageait. Par exemple, quand un client regarde un produit a l'unite, lui suggerer d'en acheter 3 avec une remise volume.

### Qu'est-ce que le cross-sell ?

Le cross-sell (ou "vente croisee") consiste a proposer des produits complementaires. Par exemple, suggerer un peptide de reparation a quelqu'un qui achete un peptide de performance.

### Configuration globale vs par produit

Le systeme fonctionne avec deux niveaux de configuration :
- **Configuration globale** : S'applique a TOUS les produits de la boutique. Il ne peut y en avoir qu'une seule.
- **Configuration par produit** : Remplace la configuration globale pour un produit specifique. Utile si un produit necessite des parametres differents.

### Les deux sections upsell

Sur chaque page produit, deux sections upsell peuvent s'afficher :
1. **Remise volume (Quantity Discount)** : Propose d'acheter plus d'unites avec un rabais progressif
2. **Abonnement (Subscription)** : Propose de souscrire a un envoi recurrent a prix reduit

### Regles d'affichage

| Regle | Comportement |
|-------|-------------|
| **Toujours** | L'upsell s'affiche a chaque visite de la page produit |
| **Une fois par session** | L'upsell s'affiche une seule fois par session de navigation |
| **Une fois par produit** | L'upsell s'affiche une seule fois pour chaque produit visite |

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche**, cliquez sur **Upsell**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Cliquez sur l'icone de la section **Marketing** dans le rail
2. Cliquez sur **Upsell**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche (ou tapez `/`)
2. Tapez "upsell" ou "vente additionnelle"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

L'interface utilise le layout master/detail Outlook standard.

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Fonction |
|--------|----------|
| **Nouvelle regle** | Creer une nouvelle configuration upsell |
| **Supprimer** | Supprimer la configuration selectionnee |
| **Activer** | Activer la configuration selectionnee |
| **Desactiver** | Desactiver la configuration selectionnee |
| **Dupliquer** | Creer une copie de la configuration selectionnee |
| **Statistiques conversion** | Afficher un resume des configurations actives |
| **Exporter** | Telecharger les configurations en CSV |

### 2. Les cartes de statistiques

3 cartes en haut :

| Carte | Description |
|-------|-------------|
| **Configs actives** | Nombre de configurations upsell actuellement actives |
| **Surcharges produit** | Nombre de configurations specifiques a un produit |
| **Statut global** | Indique si la configuration globale est active ou non |

### 3. La liste des configurations (panneau central)

- **Onglets de filtrage** : Toutes, Actives, Configuration globale, Surcharges produit
- **Barre de recherche** : Recherchez par nom de produit
- **Chaque configuration affiche** : nom du produit (ou "Global"), regle d'affichage, sections activees (remise volume, abonnement), badge de statut (active en vert, desactivee en rouge), badge "Global" pour la configuration par defaut

### 4. Le panneau de detail (panneau droit)

Quand vous selectionnez une configuration :
- **Statut** : badge actif/desactive
- **Sections activees** : remise volume (on/off), abonnement (on/off)
- **Regle d'affichage** : la regle actuellement en vigueur
- **Titres personnalises** : titre et sous-titre de la section remise volume, titre et sous-titre de la section abonnement
- **Valeurs suggerees** : quantite suggeree, frequence d'abonnement suggeree
- **Image du produit** : si la configuration est liee a un produit specifique
- **Metadonnees** : identifiant, slug, dates de creation et de mise a jour

---

## Fonctionnalites detaillees

### 1. Creer une configuration globale

**Objectif** : Definir le comportement upsell par defaut pour tous les produits.

1. Cliquez sur **Nouvelle regle**
2. **Produit** : Laissez le selecteur sur "Global" (ne selectionnez aucun produit)
3. **Active** : Activez l'interrupteur
4. **Remise volume** : Activez pour afficher la section de remise volume
5. **Abonnement** : Activez pour afficher la section d'abonnement
6. **Regle d'affichage** : Choisissez quand l'upsell s'affiche
7. **Titres personnalises** (optionnel) :
   - Titre remise volume : ex: "Achetez plus, economisez plus"
   - Sous-titre remise volume : ex: "Remise progressive sur les quantites"
   - Titre abonnement : ex: "Souscrivez et economisez 15%"
   - Sous-titre abonnement : ex: "Livraison automatique, annulable a tout moment"
8. **Valeurs suggerees** (optionnel) :
   - Quantite suggeree : ex: 3
   - Frequence suggeree : ex: Tous les 2 mois
9. Cliquez sur **Sauvegarder**

Il ne peut y avoir qu'une seule configuration globale. Si une existe deja, modifiez-la plutot que d'en creer une nouvelle.

### 2. Creer une surcharge produit

**Objectif** : Definir un comportement upsell different pour un produit specifique.

1. Cliquez sur **Nouvelle regle**
2. **Produit** : Utilisez le champ de recherche pour trouver le produit, puis selectionnez-le dans la liste deroulante
3. Remplissez les parametres comme pour la configuration globale
4. Les parametres de cette surcharge remplaceront la configuration globale pour ce produit uniquement

### 3. Modifier une configuration

1. Selectionnez la configuration dans la liste
2. Cliquez sur **Modifier** (icone crayon) dans le panneau de detail
3. Le formulaire s'ouvre pre-rempli
4. Modifiez les parametres souhaites
5. Sauvegardez

### 4. Dupliquer une configuration

1. Selectionnez la configuration source
2. Cliquez sur **Dupliquer** dans le ruban
3. Le formulaire s'ouvre avec tous les parametres copies
4. Le champ produit est remis a vide pour que vous puissiez choisir un autre produit
5. Sauvegardez

### 5. Consulter les statistiques

Cliquez sur **Statistiques conversion** dans le ruban. Un toast affiche un resume : nombre de configs actives/desactivees, nombre avec remise volume, nombre avec abonnement, nombre de configs globales et de surcharges produit.

### 6. Exporter en CSV

1. Appliquez vos filtres
2. Cliquez sur **Exporter** dans le ruban
3. Le fichier CSV se telecharge avec les colonnes : Produit, Active, Remise volume, Abonnement, Regle d'affichage, Quantite suggeree, Frequence suggeree, Derniere mise a jour

---

## Scenarios concrets

### Scenario A : Configurer l'upsell global pour tout le site

1. Cliquez sur **Nouvelle regle**
2. Laissez le produit sur "Global"
3. Activez la remise volume et l'abonnement
4. Regle d'affichage : Toujours
5. Titre remise volume : "Economisez en achetant plus"
6. Titre abonnement : "Abonnez-vous et economisez 15%"
7. Quantite suggeree : 3
8. Frequence suggeree : Tous les 2 mois
9. Sauvegardez

### Scenario B : Desactiver l'abonnement pour un produit specifique

1. Cliquez sur **Nouvelle regle**
2. Selectionnez le produit concerne
3. Activez la remise volume
4. Desactivez l'abonnement
5. Gardez les autres parametres identiques au global
6. Sauvegardez

Le produit affichera la remise volume mais pas l'option d'abonnement, meme si la configuration globale propose les deux.

### Scenario C : Tester l'impact de l'upsell sur un produit phare

1. Creez une surcharge pour votre produit phare
2. Activez l'upsell avec un titre personnalise accrocheur
3. Definissez la regle sur "Toujours"
4. Apres quelques semaines, consultez les rapports marketing pour voir si le panier moyen a augmente
5. Comparez avec les produits qui n'ont que la configuration globale

---

## FAQ

**Q: Que se passe-t-il si je n'ai pas de configuration globale ?**
R: Sans configuration globale, aucun upsell ne s'affiche sur les pages produit (sauf ceux qui ont une surcharge specifique). Il est recommande de toujours avoir une configuration globale active.

**Q: Puis-je avoir plusieurs configurations pour le meme produit ?**
R: Non. Chaque produit ne peut avoir qu'une seule surcharge. Le systeme empeche la creation de doublons.

**Q: Les titres personnalises sont-ils obligatoires ?**
R: Non. Si vous laissez les titres vides, le systeme utilise des titres par defaut.

**Q: Comment sont affichees les remises volume sur le site ?**
R: Un tableau de prix degressifs s'affiche sous le selecteur de quantite sur la page produit, montrant le prix unitaire pour differentes quantites.

**Q: Que signifie "Frequence suggeree" ?**
R: C'est la frequence d'abonnement qui sera pre-selectionnee par defaut pour le client (par exemple "Tous les 2 mois"). Le client peut toujours choisir une autre frequence.

---

## Strategie expert : regles de cross-sell specifiques aux peptides

### Principe fondamental

Les peptides ne s'utilisent pas seuls. Chaque peptide necessite des accessoires (eau bacteriostatique, seringues) et se combine naturellement avec d'autres peptides pour des "stacks" de recherche. Le cross-sell est donc particulierement pertinent et naturel dans ce domaine -- il s'agit de guider le client vers les produits dont il aura reellement besoin.

### Matrice de cross-sell recommandee

| Produit principal | Cross-sell prioritaire | Cross-sell secondaire | Logique |
|-------------------|----------------------|----------------------|---------|
| **BPC-157** | Eau bacteriostatique, seringues insuline | TB-500 (stack reparation), GHK-Cu | Accessoires essentiels + stack complementaire |
| **TB-500** | Eau bacteriostatique, seringues | BPC-157 (stack reparation) | Le stack BPC+TB est le plus populaire |
| **CJC-1295** | Ipamorelin (stack GH), eau bacteriostatique | GHRP-6, seringues insuline | Stack synergique hormone de croissance |
| **Ipamorelin** | CJC-1295 (stack GH), eau bacteriostatique | MOD-GRF, seringues | Stack classique GH release |
| **GHK-Cu** | Seringues, eau bacteriostatique | BPC-157, collagene | Reparation cutanee et tissulaire |
| **Thymosin Alpha-1** | Eau bacteriostatique, seringues | BPC-157 | Complementarite immunitaire et reparation |
| **Eau bacteriostatique** | Seringues insuline, alcool tampons | Peptide le plus vendu du moment | Accessoire appele accessoire |
| **Seringues insuline** | Eau bacteriostatique, alcool tampons | Pack de peptides populaires | Accessoire appele accessoire |

### Moment optimal de l'upsell

| Moment | Type | Taux de conversion moyen | Usage recommande |
|--------|------|-------------------------|-----------------|
| **Page produit** | Cross-sell lateral ("Souvent achete avec") | 3-5% | Accessoires indispensables |
| **Ajout au panier** | Popup upsell ("Completez votre commande") | 5-8% | Stacks et bundles |
| **Checkout** | Derniere chance ("N'oubliez pas") | 2-4% | Petits accessoires (tampons, seringues) |
| **Post-achat** | Email J+1 ("Pour completer votre recherche") | 8-12% | Produits complementaires non urgents |

Le post-achat est le moment le plus efficace car le client a deja fait confiance a votre marque. L'email post-achat bien segmente surpasse tous les autres canaux de cross-sell.

### Objectif panier moyen

| Segment | Panier moyen actuel (estimation) | Panier moyen cible | Levier principal |
|---------|--------------------------------|--------------------|--------------------|
| Nouveau client B2C | 80-120 $CA | 140-180 $CA | Cross-sell accessoires + code bundle |
| Client recurrent B2C | 120-180 $CA | 200-250 $CA | Stack suggestions + remise volume |
| Client B2B (labo) | 300-600 $CA | 500-1000 $CA | Grille de prix volume + abonnement |

### Regles d'affichage recommandees par produit

- **Peptides a unite (BPC-157, TB-500, etc.)** : Afficher remise volume + cross-sell accessoires. Regle "Toujours".
- **Accessoires (eau bact., seringues)** : Afficher cross-sell peptides populaires uniquement. Regle "Une fois par session" pour ne pas surcharger.
- **Stacks/Bundles pre-configures** : Desactiver l'upsell (le client achete deja le lot). Regle "Desactive".

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Upsell** | Technique de vente incitative qui propose au client un achat de valeur superieure |
| **Cross-sell** | Technique de vente croisee qui propose des produits complementaires |
| **Configuration globale** | Les parametres upsell par defaut appliques a tous les produits |
| **Surcharge produit** | Configuration specifique a un produit qui remplace la globale |
| **Remise volume** | Remise progressive accordee en fonction de la quantite achetee |
| **Abonnement** | Envoi recurrent automatique d'un produit a intervalles reguliers |
| **Regle d'affichage** | Condition qui determine quand l'upsell est visible pour le client |
| **Frequence** | L'intervalle entre chaque livraison d'un abonnement |

---

## Pages liees

- [Produits](/admin/produits) -- Les produits concernes par les regles upsell
- [Abonnements](/admin/abonnements) -- Gerer les abonnements souscrits par les clients
- [Commandes](/admin/commandes) -- Voir les commandes avec upsell
- [Rapports marketing](/admin/rapports) -- Analyser l'impact de l'upsell sur le panier moyen
- [Promotions](/admin/promotions) -- Remises automatiques complementaires a l'upsell
