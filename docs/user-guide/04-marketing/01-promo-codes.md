# Gestion des Codes Promo

> **Section**: Marketing > Codes Promo
> **URL**: `/admin/promo-codes`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Codes Promo** permet de creer et gerer des codes de reduction que vos clients peuvent saisir au moment du paiement. Un code promo est une chaine de caracteres (par exemple `BIENVENUE10` ou `BLACKFRIDAY`) qui accorde une remise sur la commande.

**En tant que gestionnaire, vous pouvez :**
- Creer de nouveaux codes promo avec un pourcentage ou un montant fixe de remise
- Generer automatiquement des codes aleatoires securises
- Definir des conditions d'utilisation (montant minimum, limite d'usage, premiere commande uniquement)
- Planifier la validite dans le temps (date de debut et de fin)
- Activer ou desactiver un code en un clic
- Dupliquer un code existant pour en creer un similaire rapidement
- Suivre les statistiques d'utilisation de chaque code
- Consulter l'impact commercial (revenus generes, commandes associees, produits les plus vendus avec le code)
- Voir les liens CRM (clients uniques, deals associes)
- Voir les produits et categories cibles par un code
- Exporter la liste des codes en CSV
- Supprimer les codes obsoletes

---

## Concepts pour les debutants

### Qu'est-ce qu'un code promo ?

Un code promo est un mot ou une combinaison de lettres et chiffres que le client tape dans un champ dedie au moment de passer sa commande. Si le code est valide, une remise est automatiquement appliquee au panier.

### Types de remise

Il existe deux types de remise :
- **Pourcentage** : Le client obtient X% de reduction sur sa commande. Par exemple, `BIENVENUE10` donne 10% de rabais.
- **Montant fixe** : Le client obtient un montant precis de reduction. Par exemple, un code de 15 $CA retire 15 dollars du total.

### Conditions courantes

- **Montant minimum de commande** : Le code ne s'applique que si le panier depasse un certain montant (par exemple, minimum 50 $CA).
- **Remise maximale** : Pour les codes en pourcentage, vous pouvez plafonner la remise (par exemple, 10% mais maximum 25 $CA de rabais).
- **Limite d'utilisation globale** : Le nombre total de fois que le code peut etre utilise (par tous les clients combines).
- **Limite par client** : Le nombre de fois qu'un meme client peut utiliser le code (souvent 1).
- **Premiere commande uniquement** : Le code ne fonctionne que pour les nouveaux clients qui n'ont jamais commande.

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche** qui apparait, cliquez sur **Codes Promo**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Dans la colonne d'icones tout a gauche de l'ecran, cliquez sur l'icone de la section **Marketing**
2. Le panneau "Marketing" s'ouvre avec la liste des sous-pages
3. Cliquez sur **Codes Promo**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche en haut au centre (ou tapez `/`)
2. Tapez "codes promo" ou "promo"
3. Selectionnez le resultat correspondant

---

## Vue d'ensemble de l'interface

L'interface est divisee en **4 zones principales** :

### 1. La barre de ruban (Ribbon) -- en haut

C'est la barre d'outils contextuelle. Pour les codes promo, elle contient :

| Bouton | Fonction |
|--------|----------|
| **Nouveau code** | Ouvrir le formulaire de creation d'un code promo |
| **Supprimer** | Supprimer le code selectionne (avec confirmation) |
| **Dupliquer** | Creer une copie du code selectionne pour le personnaliser |
| **Activer** | Activer le code selectionne (s'il etait desactive) |
| **Desactiver** | Desactiver le code selectionne (sans le supprimer) |
| **Statistiques** | Afficher un resume des statistiques d'utilisation de tous les codes |
| **Exporter** | Telecharger la liste des codes filtres en fichier CSV |

### 2. Les cartes de statistiques

3 cartes resumant l'etat de vos codes :

| Carte | Description |
|-------|-------------|
| **Total des codes** | Nombre total de codes promo dans le systeme |
| **Actifs** | Nombre de codes actuellement actifs et utilisables |
| **Utilisation totale** | Nombre total de fois que tous les codes ont ete utilises |

### 3. La liste des codes (panneau central)

La zone principale affiche les codes sous forme de liste avec :
- **Onglets de filtrage** : Tous, Actifs, Inactifs, Expires
- **Barre de recherche** : Recherchez par code ou description
- **Chaque code affiche** : les 2 premieres lettres du code en avatar, le code complet, le type et la valeur de la remise, un badge de statut (actif en vert, inactif en gris, expire en rouge, utilisation complete en jaune), et un badge "Premiere commande" si applicable

### 4. Le panneau de detail (panneau droit)

Quand vous selectionnez un code dans la liste, le panneau de detail affiche :
- **Statut** avec interrupteur pour activer/desactiver
- **Information de remise** : valeur de la remise, type (pourcentage ou montant fixe), remise maximale si definie
- **Utilisation** : nombre d'utilisations / limite (ou illimite), limite par client
- **Conditions** : montant minimum de commande, premiere commande uniquement
- **Impact commercial** : revenus generes, nombre de commandes, produits les plus vendus avec ce code (donnees du pont Commerce)
- **Lien CRM** : clients uniques et deals associes (donnees du pont CRM)
- **Produits cibles** : liste des produits et categories concernes si le code n'est pas global (donnees du pont Catalogue)
- **Validite** : dates de debut et de fin
- **Metadonnees** : identifiant technique, date de creation

---

## Fonctionnalites detaillees

### 1. Creer un nouveau code promo

**Objectif** : Creer un code que les clients pourront utiliser pour obtenir une reduction.

**Etapes** :
1. Cliquez sur **Nouveau code** dans le ruban ou sur le bouton en haut a droite
2. Le formulaire de creation s'ouvre dans une fenetre modale
3. Remplissez les champs :
   - **Code** (obligatoire) : Le texte du code. Il est automatiquement converti en majuscules. Vous pouvez aussi cliquer sur **Generer** pour creer un code aleatoire de 8 caracteres.
   - **Description** : Un texte libre pour decrire l'objectif du code (visible uniquement dans l'admin, pas par le client).
   - **Type** (obligatoire) : Pourcentage ou Montant fixe.
   - **Valeur** (obligatoire) : Le chiffre de la remise (par exemple 10 pour 10%, ou 15 pour 15 $CA).
   - **Montant minimum de commande** : Le panier doit atteindre ce montant pour que le code fonctionne.
   - **Remise maximale** : Plafond de la remise (utile pour les pourcentages).
   - **Limite totale d'utilisation** : Nombre maximum de fois que le code peut etre utilise globalement.
   - **Limite par client** : Nombre de fois qu'un meme client peut l'utiliser (par defaut 1).
   - **Date de debut** : Quand le code devient valide.
   - **Date de fin** : Quand le code expire automatiquement.
   - **Premiere commande uniquement** : Cochez si le code ne doit fonctionner que pour les nouveaux clients.
4. Cliquez sur **Creer**

**Validations automatiques** :
- Le code ne peut pas etre vide
- La valeur doit etre superieure a 0
- Un pourcentage ne peut pas depasser 100%
- La date de fin doit etre posterieure a la date de debut

### 2. Activer ou desactiver un code

**Objectif** : Controler la disponibilite d'un code sans le supprimer.

**Etapes** :
1. Selectionnez le code dans la liste
2. Dans le panneau de detail, utilisez l'interrupteur a bascule dans la section **Statut**
3. Le changement est immediat (mise a jour optimiste)

Un code desactive ne peut plus etre utilise par les clients, mais reste dans le systeme pour consultation.

### 3. Modifier un code existant

**Objectif** : Changer les parametres d'un code (valeur, conditions, dates).

**Etapes** :
1. Selectionnez le code dans la liste
2. Cliquez sur **Modifier** (icone crayon) dans le panneau de detail
3. Le formulaire s'ouvre pre-rempli avec les valeurs actuelles
4. Modifiez les champs souhaites
5. Cliquez sur **Sauvegarder**

### 4. Dupliquer un code

**Objectif** : Creer un nouveau code base sur les parametres d'un code existant.

**Etapes** :
1. Selectionnez le code a dupliquer
2. Cliquez sur **Dupliquer** dans le ruban
3. Le formulaire de creation s'ouvre avec tous les champs pre-remplis (sauf le code lui-meme, qui sera vide)
4. Saisissez un nouveau code et ajustez les parametres si necessaire
5. Cliquez sur **Creer**

### 5. Consulter les statistiques d'utilisation

**Objectif** : Voir combien de fois les codes ont ete utilises.

**Methode rapide** : Cliquez sur **Statistiques** dans le ruban. Un toast affiche un resume global (total d'utilisations, nombre de codes actifs et expires, codes reserves a la premiere commande, top 3 des codes les plus utilises).

**Methode detaillee** : Selectionnez un code dans la liste. Le panneau de detail affiche le nombre d'utilisations, la limite, et si les donnees sont disponibles, le revenu total genere, le nombre de commandes, et les produits les plus vendus avec ce code.

### 6. Exporter les codes en CSV

**Objectif** : Telecharger un fichier tabulaire pour l'analyse ou l'archivage.

**Etapes** :
1. Appliquez vos filtres si necessaire (onglets ou barre de recherche)
2. Cliquez sur **Exporter** dans le ruban
3. Le fichier CSV se telecharge automatiquement

**Colonnes exportees** : Code, Description, Type, Valeur, Utilisation, Limite, Statut, Date de debut, Date de fin, Premiere commande uniquement.

### 7. Supprimer un code

**Objectif** : Retirer definitivement un code du systeme.

**Etapes** :
1. Selectionnez le code a supprimer
2. Cliquez sur l'icone de suppression (poubelle rouge) dans le panneau de detail, ou sur **Supprimer** dans le ruban
3. Une fenetre de confirmation apparait. Confirmez la suppression.

La suppression est irreversible. Les commandes passees avec ce code conservent la remise appliquee.

---

## Scenarios concrets

### Scenario A : Creer un code de bienvenue pour les nouveaux clients

1. Cliquez sur **Nouveau code**
2. Saisissez le code : `BIENVENUE10`
3. Description : "10% de remise pour les nouveaux clients"
4. Type : Pourcentage
5. Valeur : 10
6. Montant minimum : 50 (pour un minimum de 50 $CA)
7. Remise maximale : 25 (plafond de 25 $CA de rabais)
8. Limite par client : 1
9. Cochez **Premiere commande uniquement**
10. Laissez les dates vides (valide indefiniment)
11. Cliquez sur **Creer**

### Scenario B : Preparer un code Black Friday a duree limitee

1. Cliquez sur **Nouveau code**
2. Saisissez le code : `BLACKFRIDAY25`
3. Description : "Vente Black Friday 2026 - 25% de reduction"
4. Type : Pourcentage
5. Valeur : 25
6. Remise maximale : 100 (plafond de 100 $CA)
7. Limite totale : 500 (maximum 500 utilisations)
8. Limite par client : 1
9. Date de debut : 2026-11-27 00:00
10. Date de fin : 2026-11-30 23:59
11. Ne cochez PAS "Premiere commande uniquement"
12. Cliquez sur **Creer**

### Scenario C : Analyser la performance d'un code promo apres une campagne

1. Ouvrez la page Codes Promo
2. Recherchez le code utilise dans votre campagne
3. Selectionnez-le dans la liste
4. Dans le panneau de detail, consultez :
   - Le nombre d'utilisations (section Utilisation)
   - Le revenu genere (section Impact commercial)
   - Les produits les plus achetes avec ce code (section Impact commercial)
5. Pour un rapport complet, exportez les codes en CSV et croisez avec vos donnees de campagne

---

## FAQ

**Q: Puis-je modifier le texte d'un code apres sa creation ?**
R: Oui, vous pouvez modifier le code via le formulaire d'edition. Cependant, si des clients ont deja recu l'ancien code (par email, par exemple), ils ne pourront plus l'utiliser. Creez plutot un nouveau code dans ce cas.

**Q: Que se passe-t-il quand un code expire ?**
R: Le code passe automatiquement en statut "Expire" (badge rouge). Les clients qui tentent de l'utiliser recoivent un message d'erreur au moment du paiement. Le code reste visible dans la liste admin pour consultation.

**Q: Comment savoir quels codes sont les plus utilises ?**
R: Cliquez sur **Statistiques** dans le ruban pour voir un resume rapide incluant le top 3 des codes les plus utilises. Pour plus de detail, selectionnez chaque code individuellement.

**Q: Peut-on cumuler plusieurs codes promo sur une meme commande ?**
R: Non, en general un seul code promo peut etre applique par commande. Cette restriction est geree au niveau du panier.

**Q: Quelle est la difference entre "desactiver" et "supprimer" un code ?**
R: Desactiver rend le code temporairement inutilisable mais le conserve dans le systeme (vous pouvez le reactiver plus tard). Supprimer le retire definitivement.

---

## Strategie expert : codes promo par objectif marketing

### Codes d'acquisition (attirer de nouveaux clients)

Les codes d'acquisition ciblent les visiteurs qui n'ont jamais achete. Ils reduisent la barriere a l'entree pour un premier achat de peptides, un produit a forte valeur unitaire ou le panier d'un nouveau client peut sembler intimidant.

| Code | Remise | Condition | Objectif |
|------|--------|-----------|----------|
| `BIENVENUE10` | 10% | Premiere commande, min 50 $CA | Convertir les visiteurs en acheteurs |
| `PREMIER15` | 15 $CA fixe | Premiere commande, min 75 $CA | Inciter un premier panier plus eleve |
| `ESSAI20` | 20% | Premiere commande, max 30 $CA de remise | Offrir un incitatif fort mais plafonne |

**Limites anti-abus recommandees** : 1 usage par client, expiration 30 jours apres creation, premiere commande uniquement cochee. Surveillez le taux de conversion de ces codes -- un bon code d'acquisition convertit entre 8% et 15% des visiteurs qui le recoivent.

### Codes de retention (fideliser les clients existants)

Les clients recurrents representent 60 a 70% du revenu d'un e-commerce de peptides. Recompensez-les pour maintenir leur loyaute.

| Code | Remise | Condition | Objectif |
|------|--------|-----------|----------|
| `FIDELE15` | 15% | Min 2 commandes precedentes, min 100 $CA | Recompenser les clients reguliers |
| `VIP25` | 25 $CA fixe | Min 5 commandes, min 150 $CA | Offre exclusive pour les meilleurs clients |
| `RETOUR10` | 10% | Client inactif 60+ jours | Reactiver un client dormant |

### Codes de panier moyen (augmenter la valeur par commande)

L'objectif est de pousser le client a ajouter un produit supplementaire ou a passer a une quantite superieure.

| Code | Remise | Condition | Objectif |
|------|--------|-----------|----------|
| `BUNDLE20` | 20% | Min 3 produits differents, min 200 $CA | Encourager les lots |
| `PLUS50` | 50 $CA fixe | Min 300 $CA de panier | Inciter les grosses commandes |
| `STACK15` | 15% | Categorie "Stacks peptides" uniquement | Promouvoir les combinaisons |

### Calcul du ROI d'un code promo

Pour chaque code promo, calculez le retour sur investissement :

**Formule** : `ROI = (Revenu incremental - Remise totale accordee) / Remise totale accordee x 100`

- **Revenu incremental** : le revenu genere par les commandes utilisant le code, MOINS le revenu que ces clients auraient probablement depense sans le code (estimez 30 a 50% pour les clients existants, 0% pour les nouveaux)
- **Remise totale** : somme de toutes les remises accordees par le code
- **Cible** : un ROI superieur a 200% signifie que le code est rentable (chaque dollar de remise genere 2 $CA de revenu net supplementaire)

**Exemple concret** :
- Code `BIENVENUE10` utilise 45 fois en mars
- Revenu total des commandes avec ce code : 6 750 $CA
- Remise totale accordee : 675 $CA
- Ces clients etaient tous nouveaux (revenu incremental = 100%) : 6 750 $CA
- ROI = (6 750 - 675) / 675 x 100 = **900%** -- excellent resultat

**Seuils d'interpretation** :
| ROI | Interpretation | Action |
|-----|---------------|--------|
| < 100% | Perte nette | Suspendre ou revoir les conditions |
| 100-200% | Neutre a faible | Ajuster la remise ou le ciblage |
| 200-500% | Bon | Maintenir |
| > 500% | Excellent | Augmenter la visibilite du code |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Code promo** | Une chaine de caracteres que le client saisit au paiement pour obtenir une reduction |
| **Pourcentage** | Type de remise ou la reduction est un pourcentage du montant de la commande |
| **Montant fixe** | Type de remise ou la reduction est un montant precis en dollars canadiens |
| **Montant minimum** | Le seuil minimum du panier pour que le code soit applicable |
| **Remise maximale** | Le plafond de la reduction en dollars, utile pour les codes en pourcentage |
| **Limite d'utilisation** | Le nombre total de fois que le code peut etre utilise par tous les clients |
| **Limite par client** | Le nombre de fois qu'un meme client peut utiliser le code |
| **Premiere commande** | Restriction qui limite l'usage du code aux clients n'ayant jamais passe de commande |
| **CSV** | Comma-Separated Values, un format de fichier tabulaire compatible avec Excel |
| **Impact commercial** | Les donnees de revenus et commandes generes par un code (pont vers le module Commerce) |

---

## Pages liees

- [Promotions](/admin/promotions) -- Remises automatiques sans code a saisir
- [Newsletter](/admin/newsletter) -- Envoyer les codes promo par email a vos abonnes
- [Commandes](/admin/commandes) -- Voir les commandes ayant utilise un code promo
- [Rapports marketing](/admin/rapports) -- Analyser l'impact des codes sur les ventes
- [Clients](/admin/customers) -- Consulter les fiches clients ayant utilise un code
