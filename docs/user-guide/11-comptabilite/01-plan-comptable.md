# Plan Comptable (Chart of Accounts)

> **Section**: Comptabilite > Plan comptable
> **URL**: `/admin/comptabilite/plan-comptable`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~35 minutes

---

## Pourquoi cette page est importante

Le plan comptable est le **fondement de toute votre comptabilite**. Chaque transaction financiere de BioCycle Peptides -- chaque vente, chaque achat, chaque paiement de taxe, chaque cheque de paie -- est enregistree dans un compte specifique de ce plan. Sans un plan comptable bien structure, il est impossible de produire des etats financiers fiables, de declarer correctement vos impots ou de comprendre la sante financiere de votre entreprise.

**Obligations legales** :
- L'Agence du Revenu du Canada (ARC) exige que toute societe par actions produise une declaration T2 utilisant les codes GIFI (General Index of Financial Information). Votre plan comptable doit etre mappable a ces codes.
- Revenu Quebec exige la declaration CO-17 pour les societes incorporees au Quebec.
- Les Normes Comptables pour les Entreprises a Capital Ferme (NCECF) dictent la structure minimale des etats financiers, et donc des comptes necessaires.

**Impact concret** : Si votre plan comptable est mal structure, vous risquez de declarer des montants errones aux gouvernements, de ne pas reclamer tous vos credits de taxes (CTI/RTI), de ne pas deduire toutes vos depenses admissibles, et de ne pas voir les vrais problemes financiers de votre entreprise.

---

## Cycle comptable complet -- Ou se situe cette page

```
[1. PLAN COMPTABLE] ← VOUS ETES ICI (etape fondatrice)
 ↓
 2. Journal general (enregistrer les transactions)
 ↓
 3. Ecritures de journal (debits et credits)
 ↓
 4. Grand livre et balance de verification
 ↓
 5. Bilan (photo a une date)
 ↓
 6. Etat des resultats (film d'une periode)
 ↓
 7. Factures (ventes aux clients)
 ↓
 8. Depenses (achats et charges)
 ↓
 9. Taxes TPS/TVQ (declarations fiscales)
 ↓
10. Rapprochement bancaire (verification)
 ↓
11. Budget (planification)
 ↓
12. Rapports financiers (analyse et export)
```

Le plan comptable est l'etape 1 parce que **tout commence ici**. Vous ne pouvez pas enregistrer une seule transaction sans que les comptes existent d'abord. C'est comme construire une maison : le plan comptable est la fondation. Si elle est solide, tout le reste tient. Si elle est bancale, tout est problematique.

---

## Ordre des operations

1. **Avant de commencer toute comptabilite** : Definir ou valider votre plan comptable
2. **Avant de saisir des ecritures** : S'assurer que tous les comptes necessaires existent
3. **En debut d'exercice** : Revoir le plan comptable, ajouter les comptes necessaires, desactiver les obsoletes
4. **En cours d'annee** : Ajouter un compte seulement quand une nouvelle categorie de transaction apparait
5. **En fin d'exercice** : Verifier que tous les comptes sont correctement codes GIFI pour la declaration T2/CO-17
6. **Ne jamais supprimer** un compte qui contient des ecritures -- le desactiver plutot

---

## Les 5 types de comptes fondamentaux

La comptabilite en partie double repose sur 5 categories de comptes. Chaque transaction touche au minimum 2 comptes : un debit et un credit. Le total des debits doit toujours egaliser le total des credits.

### L'equation comptable fondamentale

```
ACTIFS = PASSIFS + CAPITAUX PROPRES
```

Cette equation est toujours equilibree. Chaque transaction maintient cet equilibre. Si votre bilan n'est pas equilibre, c'est qu'il y a une erreur quelque part.

### Les 5 categories et leur logique

| # | Categorie | Codes GIFI | Plage Koraline | Ce qu'elle represente | Solde normal |
|---|-----------|------------|----------------|----------------------|--------------|
| 1 | **Actifs** | 1000-2999 | 1000-1999 | Ce que l'entreprise possede | Debiteur |
| 2 | **Passifs** | 3000-3499 | 2000-2999 | Ce que l'entreprise doit | Crediteur |
| 3 | **Capitaux propres** | 3500-3999 | 3000-3999 | La valeur nette (actifs - passifs) | Crediteur |
| 4 | **Revenus** | 8000-8299 | 4000-4999 | L'argent gagne par les operations | Crediteur |
| 5 | **Charges (depenses)** | 8300-9998 | 5000-5999 | L'argent depense pour operer | Debiteur |

### Comprendre les debits et credits

C'est souvent le point le plus confus pour les non-comptables. Voici la regle simple :

| Type de compte | Un DEBIT... | Un CREDIT... |
|---------------|-------------|--------------|
| **Actif** | Augmente le solde | Diminue le solde |
| **Charge** | Augmente le solde | Diminue le solde |
| **Passif** | Diminue le solde | Augmente le solde |
| **Revenu** | Diminue le solde | Augmente le solde |
| **Capitaux propres** | Diminue le solde | Augmente le solde |

**Pour simplifier** : Si vous etes debutant, Koraline gere automatiquement les debits et credits quand vous saisissez des factures, des depenses ou des ventes. Vous ne touchez aux debits/credits directement que dans les ecritures de journal manuelles.

---

## Comment entrer les donnees

### Acceder au plan comptable

1. Cliquez sur **Comptabilite** dans la navigation horizontale
2. Dans le panneau lateral, groupe **Comptes**, cliquez sur **Plan comptable**
3. URL directe : `/admin/comptabilite/plan-comptable`

### Creer un nouveau compte

**Quand** : Quand une nouvelle categorie de transaction apparait et qu'aucun compte existant ne convient.

**Etapes detaillees** :

1. Cliquez sur **Nouveau compte** dans la barre de ruban
2. Remplissez chaque champ :

| Champ | Quoi mettre | Exemple | Pourquoi |
|-------|------------|---------|----------|
| **Numero** | Code unique dans la plage de la categorie | 5095 | Identifie le compte dans les rapports et les declarations fiscales |
| **Nom** | Libelle clair et descriptif | Frais de conference et salons | Permet d'identifier rapidement la nature des transactions |
| **Type** | Categorie comptable | Charge | Determine le comportement du compte (debit/credit) et son emplacement dans les etats financiers |
| **Compte parent** | Le compte de niveau superieur | 5000 - Charges d'exploitation | Structure la hierarchie pour les sous-totaux dans les rapports |
| **Code GIFI** | Code a 4 chiffres pour la declaration T2 | 8764 | Obligatoire pour la declaration annuelle d'impot federal |
| **Description** | Explication detaillee du contenu | Frais d'inscription, kiosques, deplacement pour salons professionnels peptides | Aide les utilisateurs futurs a classer correctement les transactions |
| **Devise** | Monnaie du compte | CAD | CAD par defaut, USD si compte specifiquement en devises etrangeres |
| **Actif** | Statut du compte | Oui | Un compte inactif n'apparait plus dans les listes de saisie |

3. Cliquez sur **Creer**

### Modifier un compte existant

1. Trouvez le compte dans l'arborescence (utilisez la recherche si necessaire)
2. Cliquez dessus pour ouvrir le detail
3. Cliquez sur **Modifier**
4. Changez le nom, la description ou le compte parent
5. Cliquez sur **Sauvegarder**

**Attention critique** : Ne changez JAMAIS le numero d'un compte qui contient des ecritures. Les rapports historiques referencent le numero du compte. Changer le numero rompt les liens avec les ecritures passees et peut fausser les comparaisons d'une annee a l'autre.

### Desactiver un compte

**Quand** : Un compte n'est plus utilise mais il contient des ecritures historiques.

1. Ouvrez le compte
2. Basculez le commutateur **Actif** a **Inactif**
3. Le compte disparait des listes de saisie mais ses ecritures restent accessibles dans les rapports historiques

---

## Pourquoi entrer ces donnees

### Le numero de compte

Le numero de compte n'est pas arbitraire. Il determine :
- **Ou le montant apparait dans les etats financiers** (bilan ou etat des resultats)
- **Comment il est reporte dans la declaration T2/CO-17** via le code GIFI
- **Comment les sous-totaux sont calcules** dans les rapports

### Le code GIFI

Le code GIFI (General Index of Financial Information) est un systeme de codes a 4 chiffres que l'ARC utilise pour la declaration d'impot des societes (formulaire T2). Chaque compte de votre plan comptable doit etre associe au bon code GIFI. Si vous vous trompez, votre declaration sera incorrecte.

**Plages GIFI principales** :
| Plage | Categorie |
|-------|-----------|
| 1000-2999 | Actifs |
| 3000-3499 | Passifs |
| 3500-3999 | Capitaux propres |
| 8000-8299 | Revenus |
| 8300-9998 | Charges |

### Le type de compte

Le type determine le comportement comptable : les actifs et charges augmentent au debit, les passifs, revenus et capitaux propres augmentent au credit. Mettre un compte de depense dans la categorie "Revenu" par erreur produirait des etats financiers completement faux.

### La hierarchie (compte parent)

La hierarchie permet de produire des rapports avec des sous-totaux. Par exemple, le total de toutes les charges de marketing (Google Ads, Facebook, salons, impression) se calcule automatiquement si ces comptes sont tous sous le meme parent.

---

## Plan comptable recommande pour BioCycle Peptides

### Actifs (1000-1999)

```
1000 - ACTIFS
  1010 - Banque TD Operations (CAD) ............... GIFI 1001
  1020 - Banque BMO Operations (USD) .............. GIFI 1001
  1030 - Petite caisse ............................. GIFI 1001
  1050 - Placements a court terme .................. GIFI 1180
  1100 - Comptes clients ........................... GIFI 1060
    1101 - Clients detail (B2C)
    1102 - Clients B2B (distributeurs/cliniques)
    1109 - Provision pour creances douteuses ........ GIFI 1061
  1150 - TPS payee sur achats (CTI a recevoir) ..... GIFI 1300
  1160 - TVQ payee sur achats (RTI a recevoir) ..... GIFI 1300
  1200 - Inventaire
    1201 - Stock de peptides (produits finis) ....... GIFI 1320
    1202 - Stock d'emballage ....................... GIFI 1320
    1203 - Stock en transit ........................ GIFI 1320
  1300 - Charges payees d'avance ................... GIFI 1480
  1400 - Equipement de laboratoire ................. GIFI 1740
  1410 - Mobilier et equipement de bureau .......... GIFI 1740
  1420 - Materiel informatique ..................... GIFI 1740
  1450 - Amortissement cumule - Equipement ......... GIFI 1744
  1460 - Amortissement cumule - Mobilier ........... GIFI 1744
  1470 - Amortissement cumule - Informatique ....... GIFI 1744
```

### Passifs (2000-2999)

```
2000 - PASSIFS
  2010 - Comptes fournisseurs ...................... GIFI 3100
  2100 - TPS a remettre (collectee) ................ GIFI 3480
  2110 - TVQ a remettre (collectee) ................ GIFI 3480
  2150 - Retenues salariales a payer
    2151 - Impot federal retenu .................... GIFI 3480
    2152 - Impot provincial retenu ................. GIFI 3480
    2153 - Cotisations RRQ a payer ................. GIFI 3480
    2154 - Cotisations AE a payer .................. GIFI 3480
    2155 - Cotisations RQAP a payer ................ GIFI 3480
  2200 - Salaires et vacances a payer .............. GIFI 3480
  2300 - Portion courante de la dette a long terme . GIFI 3140
  2500 - Emprunt bancaire a long terme ............. GIFI 3450
  2600 - Avances d'actionnaires .................... GIFI 3470
```

### Capitaux propres (3000-3999)

```
3000 - CAPITAUX PROPRES
  3100 - Capital-actions ........................... GIFI 3500
  3200 - Benefices non repartis (BNR) .............. GIFI 3600
  3300 - Dividendes declares ....................... GIFI 3701
```

### Revenus (4000-4999)

```
4000 - REVENUS
  4010 - Ventes de peptides (detail B2C) ........... GIFI 8000
  4020 - Ventes B2B (distributeurs/cliniques) ...... GIFI 8000
  4030 - Revenus d'abonnements ..................... GIFI 8000
  4040 - Frais de livraison factures ............... GIFI 8000
  4050 - Escomptes sur ventes (debiteur) ........... GIFI 8141
  4060 - Retours et remises (debiteur) ............. GIFI 8142
  4500 - Autres revenus
    4510 - Interets gagnes ......................... GIFI 8090
    4520 - Gains de change ......................... GIFI 8230
```

### Charges (5000-5999)

```
5000 - CHARGES
  5010 - Cout des marchandises vendues (CMV)
    5011 - Achat de matieres premieres ............. GIFI 8300
    5012 - Emballage et etiquetage ................. GIFI 8300
    5013 - Frais de livraison sortants ............. GIFI 8300
  5020 - Salaires et avantages sociaux
    5021 - Salaires bruts .......................... GIFI 9060
    5022 - Cotisations employeur RRQ ............... GIFI 9060
    5023 - Cotisations employeur AE ................ GIFI 9060
    5024 - Cotisations employeur RQAP .............. GIFI 9060
    5025 - Cotisations CNESST ...................... GIFI 9060
    5026 - Avantages sociaux (assurance collective) . GIFI 9060
  5030 - Loyer et services publics ................. GIFI 8710
  5040 - Marketing et publicite
    5041 - Google Ads .............................. GIFI 8520
    5042 - Facebook/Meta Ads ....................... GIFI 8520
    5043 - Marketing de contenu .................... GIFI 8520
    5044 - Frais de conference et salons ........... GIFI 8520
  5050 - Frais de livraison (transporteurs) ........ GIFI 8406
  5060 - Frais bancaires et commissions Stripe ..... GIFI 8710
  5070 - Assurances ................................ GIFI 8690
  5075 - Logiciels et hebergement
    5076 - Azure (hebergement) ..................... GIFI 8710
    5077 - Licences logicielles .................... GIFI 8710
  5080 - Fournitures de bureau ..................... GIFI 8811
  5090 - Honoraires professionnels
    5091 - Comptable ............................... GIFI 8860
    5092 - Avocat .................................. GIFI 8860
    5093 - Consultant .............................. GIFI 8860
  5095 - Deplacements et representation ............ GIFI 8523
  5200 - Amortissement ............................. GIFI 8670
  5300 - Interets et frais financiers .............. GIFI 8710
  5400 - Mauvaises creances ........................ GIFI 8590
  5500 - Pertes de change .......................... GIFI 9000
  5600 - Impots sur le revenu
    5610 - Impot federal ........................... GIFI 9990
    5620 - Impot provincial ........................ GIFI 9990
```

---

## Specificites canadiennes et quebecoises

### Codes GIFI -- Pourquoi ils sont obligatoires

Le systeme GIFI permet a l'ARC de recevoir les etats financiers dans un format standardise. Chaque societe par actions doit remplir les annexes 100, 125 et 141 du formulaire T2 en utilisant les codes GIFI. Koraline mappe automatiquement vos comptes aux codes GIFI si vous les avez configures correctement.

### Comptes de taxes -- Structure critique

La structure des comptes de taxes est fondamentale au Quebec :

| Compte | Role | Type | Utilite |
|--------|------|------|---------|
| 1150 - TPS payee sur achats | CTI a recevoir | Actif | Taxes payees que vous recuperez |
| 1160 - TVQ payee sur achats | RTI a recevoir | Actif | Taxes payees que vous recuperez |
| 2100 - TPS a remettre | TPS collectee | Passif | Taxes collectees pour le gouvernement |
| 2110 - TVQ a remettre | TVQ collectee | Passif | Taxes collectees pour le gouvernement |

**Le calcul net** :
- TPS nette = 2100 (collectee) - 1150 (payee). Si positif, vous devez de l'argent a l'ARC. Si negatif, l'ARC vous doit un remboursement.
- TVQ nette = 2110 (collectee) - 1160 (payee). Meme principe avec Revenu Quebec.

### Benefices non repartis (BNR) -- Compte 3200

Le BNR est le compte ou s'accumulent les profits nets d'annee en annee. En fin d'exercice, lors de la cloture annuelle, tous les comptes de revenus et de charges sont fermes (mis a zero) et la difference est viree dans le BNR. C'est un compte crucial car il represente la richesse accumulee de l'entreprise.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Mettre une depense dans un compte d'actif | La depense n'apparait pas dans l'etat des resultats, les profits sont surevalues, les impots a payer sont trop eleves | Verifier le type de compte avant de saisir |
| Ne pas separer les comptes de taxes (actif vs passif) | Impossible de calculer correctement le montant net a remettre | Utiliser 4 comptes de taxes distincts (1150, 1160, 2100, 2110) |
| Creer trop de comptes | Les rapports deviennent illisibles, difficile de voir les tendances | 40 a 60 comptes suffisent pour une PME comme BioCycle |
| Creer trop peu de comptes | Impossible de distinguer les types de depenses, perte d'information pour la prise de decision | Minimum 30 comptes pour avoir une visibilite utile |
| Oublier les codes GIFI | La declaration T2 ne peut pas etre produite correctement | Associer le code GIFI a la creation de chaque compte |
| Changer le numero d'un compte avec des ecritures | Les rapports historiques referencent l'ancien numero, perte de continuite | Desactiver l'ancien compte et en creer un nouveau |
| Ne pas provisionner les creances douteuses | Les comptes clients affichent un montant irrealiste, les profits sont surevalues | Creer le compte 1109 et y inscrire les creances a risque |
| Melanger personnel et professionnel | L'ARC peut desavouer des deductions, risque de penalites | Utiliser un compte "Avance a l'actionnaire" (2600) pour isoler les depenses personnelles |

---

## Quand faire cette operation

| Quand | Action | Frequence |
|-------|--------|-----------|
| **Lancement de l'entreprise** | Creer le plan comptable initial complet | Une fois |
| **Debut d'exercice (1er janvier)** | Revoir le plan, ajouter/desactiver des comptes | Annuelle |
| **Nouvelle categorie de depense** | Ajouter un compte specifique | Au besoin |
| **Nouveau fournisseur ou produit** | Verifier si un compte existe, en creer un si non | Au besoin |
| **Avant la declaration T2/CO-17** | Verifier les codes GIFI de tous les comptes | Annuelle |
| **Changement de comptable** | Exporter le plan comptable et le valider ensemble | Au besoin |

---

## Questions frequentes (FAQ)

**Q : Dois-je creer le plan comptable moi-meme ?**
R : Non, Koraline inclut un plan comptable pre-configure adapte aux PME canadiennes. Il couvre les cas les plus courants. Vous pouvez le personnaliser en ajoutant des comptes specifiques a votre activite.

**Q : Puis-je supprimer un compte ?**
R : Pas s'il contient des ecritures. Vous pouvez le desactiver pour qu'il n'apparaisse plus dans les listes de saisie. Un compte vide (sans aucune ecriture) peut etre supprime.

**Q : Combien de niveaux de sous-comptes puis-je creer ?**
R : Jusqu'a 5 niveaux. Mais 2 a 3 niveaux suffisent pour la majorite des entreprises. Trop de niveaux rend le plan comptable difficile a naviguer.

**Q : Le plan comptable de Koraline est-il conforme aux normes canadiennes ?**
R : Oui, il suit les Normes Comptables pour les Entreprises a Capital Ferme (NCECF) et est compatible avec les exigences de l'ARC (codes GIFI) et de Revenu Quebec.

**Q : Que se passe-t-il si je me trompe de compte en saisissant une ecriture ?**
R : Si la periode n'est pas cloturee, vous pouvez modifier l'ecriture directement. Si la periode est cloturee, vous devez passer une ecriture de correction (contre-passation) dans la periode suivante.

**Q : Quelle est la difference entre la numerotation GIFI et la numerotation Koraline ?**
R : Koraline utilise sa propre numerotation (1000-5999) pour organiser vos comptes dans l'application. Les codes GIFI (1000-9998) sont un systeme parallele exige par l'ARC pour la declaration T2. Chaque compte Koraline est associe a un code GIFI correspondant. Les deux systemes coexistent.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Plan comptable** | Liste structuree et hierarchisee de tous les comptes utilises pour enregistrer les transactions d'une entreprise. C'est la colonne vertebrale de la comptabilite. |
| **Partie double** | Principe fondamental : chaque transaction affecte au minimum 2 comptes. Le total des debits egalise toujours le total des credits. Invente en 1494 par Luca Pacioli. |
| **Debit** | Ecriture inscrite a gauche du journal. Augmente les actifs et les charges, diminue les passifs, les revenus et les capitaux propres. |
| **Credit** | Ecriture inscrite a droite du journal. Augmente les passifs, les revenus et les capitaux propres, diminue les actifs et les charges. |
| **Solde** | Difference entre la somme des debits et la somme des credits d'un compte. Un actif a normalement un solde debiteur. |
| **GIFI** | General Index of Financial Information. Systeme de codes a 4 chiffres utilise par l'ARC pour standardiser les declarations fiscales des societes. |
| **NCECF** | Normes Comptables pour les Entreprises a Capital Ferme. Cadre comptable canadien pour les entreprises privees. |
| **TPS** | Taxe sur les Produits et Services. Taxe federale de 5% percue par l'ARC. |
| **TVQ** | Taxe de Vente du Quebec. Taxe provinciale de 9,975% percue par Revenu Quebec. |
| **CTI** | Credit de Taxe sur les Intrants. Montant de TPS paye sur les achats commerciaux que l'entreprise peut recuperer. |
| **RTI** | Remboursement de Taxe de Vente du Quebec sur les Intrants. Equivalent provincial du CTI. |
| **BNR** | Benefices Non Repartis. Profits accumules de l'entreprise depuis sa creation, moins les dividendes verses. |
| **T2** | Declaration de revenus des societes federale. Doit etre produite annuellement avec les codes GIFI. |
| **CO-17** | Declaration de revenus des societes du Quebec. Equivalent provincial du T2. |
| **Compte parent** | Compte de niveau superieur dans la hierarchie. Permet de regrouper les sous-comptes pour calculer des sous-totaux dans les rapports. |
| **Immobilisation** | Actif a long terme (equipement, mobilier, vehicule) dont le cout est reparti sur sa duree de vie utile par l'amortissement. |

---

## Pages reliees

- [Journal general](02-journal.md) : Ou les transactions sont enregistrees chronologiquement
- [Ecritures](03-ecritures.md) : Saisie des ecritures de journal (debits/credits)
- [Grand livre et balance](04-grand-livre.md) : Transactions regroupees par compte
- [Bilan](05-bilan.md) : Etat financier utilisant les comptes d'actifs, passifs et capitaux propres
- [Etat des resultats](06-resultats.md) : Etat financier utilisant les comptes de revenus et charges
- [Taxes TPS/TVQ](09-taxes.md) : Gestion des comptes de taxes
