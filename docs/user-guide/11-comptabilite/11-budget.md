# Budget et Previsions

> **Section**: Comptabilite > Rapports > Budget
> **URL**: `/admin/comptabilite/budget`, `/admin/comptabilite/previsions`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~30 minutes

---

## Pourquoi cette page est importante

Le budget est votre **plan de vol financier**. C'est l'outil qui transforme les intentions strategiques en chiffres concrets. Sans budget, vous reagissez aux problemes financiers au lieu de les anticiper. Avec un budget, vous savez a l'avance combien vous pouvez investir en marketing, combien vous devez vendre pour couvrir vos charges, et quand la tresorerie risque d'etre tendue.

**Obligations legales** :
- Le budget n'est pas une obligation legale comme les etats financiers. Aucune loi n'oblige une PME a produire un budget.
- Cependant, les banques exigent souvent des previsions budgetaires pour accorder un pret ou une marge de credit.
- Si BioCycle recherche des investisseurs ou du financement, un budget detaille est un prerequis.
- Les programmes gouvernementaux de subventions (RS&DE, CDAE, BDC) demandent frequemment des projections financieres.

**Impact concret** :
- Un budget permet d'identifier **avant** qu'ils ne se produisent : les mois ou la tresorerie sera insuffisante, les depassements de depenses, les objectifs de vente irralistes.
- La comparaison budget vs reel est le meilleur outil de gestion pour un proprietaire d'entreprise. Un ecart de +20% sur le marketing sans hausse proportionnelle des ventes signale un probleme immediatement.
- Sans budget, vous ne savez pas si vous depassez vos moyens jusqu'a ce que le releve bancaire vous le montre -- souvent trop tard.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7. Factures → 8. Depenses → 9. Taxes → 10. Rapprochement
 ↓
[11. BUDGET] ← VOUS ETES ICI (planification et controle)
 ↓
 12. Rapports financiers
```

Le budget est l'etape 11 du cycle. Il n'est pas lie a une obligation d'enregistrement comptable, mais il est essentiel pour l'analyse. Le budget est compare a l'etat des resultats reel (etape 6) pour mesurer la performance. Les ecarts sont analyses dans les rapports (etape 12).

---

## Ordre des operations

### Creation du budget annuel

| Etape | Action | Quand |
|-------|--------|-------|
| 1 | Analyser les resultats reels de l'annee precedente | Octobre-novembre |
| 2 | Definir les objectifs de l'annee suivante (croissance, investissements) | Novembre |
| 3 | Estimer les revenus mois par mois (saisonnalite) | Novembre-decembre |
| 4 | Estimer les charges fixes (loyer, salaires, assurances) | Novembre-decembre |
| 5 | Estimer les charges variables (CMV, marketing, livraison) | Novembre-decembre |
| 6 | Calculer le benefice previsionnel et la tresorerie | Decembre |
| 7 | Valider avec le comptable ou le directeur financier | Decembre |
| 8 | Saisir dans Koraline et activer | Janvier |

### Suivi du budget en cours d'annee

| Etape | Action | Frequence |
|-------|--------|-----------|
| 1 | Generer le rapport Budget vs Reel | Mensuel |
| 2 | Analyser les ecarts significatifs (> 10%) | Mensuel |
| 3 | Identifier les causes des ecarts | Mensuel |
| 4 | Ajuster les previsions pour les mois restants si necessaire | Trimestriel |
| 5 | Reviser formellement le budget si les conditions changent | Trimestriel |

---

## Comment entrer les donnees

### Creer un budget annuel

**URL** : `/admin/comptabilite/budget`

1. Cliquez sur **Nouveau budget**
2. Donnez un nom descriptif (ex: "Budget 2026 - Approuve")
3. Selectionnez la periode (annee fiscale 2026)
4. Choisissez la methode de creation :

| Methode | Description | Quand l'utiliser |
|---------|-------------|------------------|
| **A partir de zero** | Tout remplir manuellement | Premiere annee ou changement majeur de strategie |
| **Basee sur l'annee precedente** | Pre-remplie avec les chiffres reels + % d'ajustement | Annees subsequentes avec croissance previsible |

5. Remplissez les montants par categorie et par mois :

```
BUDGET 2026 - BioCycle Peptides
                     Jan       Fev       Mar       Avr      ...    Total
REVENUS
 Ventes B2C       55 000    58 000    65 000    60 000           750 000
 Ventes B2B       35 000    38 000    42 000    40 000           480 000
 Abonnements      15 000    16 000    18 000    17 000           210 000
 Livraison fact.   2 500     2 700     3 200     2 800            35 000
TOTAL REVENUS    107 500   114 700   128 200   119 800         1 475 000

CMV
 Matieres prem.   28 000    30 000    32 000    30 000           370 000
 Emballage         3 800     4 000     4 500     4 200            50 000
 Livraison sort.   4 500     5 000     5 800     5 200            62 000
TOTAL CMV         36 300    39 000    42 300    39 400           482 000

BENEFICE BRUT     71 200    75 700    85 900    80 400           993 000
 Marge brute %     66,2%     66,0%     67,0%     67,1%            67,3%

CHARGES EXPLOIT.
 Salaires         25 000    25 000    28 000    28 000           324 000
 Loyer             3 500     3 500     3 500     3 500            42 000
 Marketing         6 000     7 000     8 200     7 500            90 000
 Logiciels         2 800     2 800     2 800     2 800            33 600
 Frais Stripe      3 200     3 400     3 845     3 600            44 000
 Assurances        1 200     1 200     1 200     1 200            14 400
 Honoraires prof.  1 500     1 500     1 500     1 500            18 000
 Divers              800       800       800       800             9 600
TOTAL CHARGES     44 000    45 200    49 845    48 900           575 600

BENEFICE PREVU    27 200    30 500    36 055    31 500           417 400
 Marge nette %     25,3%     26,6%     28,1%     26,3%            28,3%
```

6. Cliquez sur **Sauvegarder**

### Ajuster le budget en cours d'annee

1. Ouvrez le budget existant
2. Cliquez sur **Reviser**
3. Le systeme cree une **nouvelle version** (l'ancienne est conservee pour comparaison)
4. Modifiez les montants pour les mois restants
5. Sauvegardez

**Bonne pratique** : Revisez le budget chaque trimestre. Gardez le budget original comme reference et creez des versions revisees. Cela permet de comparer "Budget initial vs Reel" et "Budget revise vs Reel".

### Comparer budget vs reel

1. Ouvrez le budget
2. Activez le mode **Comparaison avec reel**
3. Le rapport affiche :

| Categorie | Budget Mars | Reel Mars | Ecart $ | Ecart % | Analyse |
|-----------|------------|-----------|---------|---------|---------|
| Ventes B2C | 65 000 $ | 65 000 $ | 0 | 0% | Sur cible |
| Ventes B2B | 42 000 $ | 42 000 $ | 0 | 0% | Sur cible |
| Marketing | 8 200 $ | 9 500 $ | +1 300 | +15,9% | Depassement -- investiguer |
| Salaires | 28 000 $ | 28 000 $ | 0 | 0% | Sur cible |
| Frais Stripe | 3 845 $ | 3 845 $ | 0 | 0% | Sur cible |

**Code couleur** :
- **Vert** : ecart favorable (revenus plus hauts ou depenses plus basses que prevu)
- **Rouge** : ecart defavorable (revenus plus bas ou depenses plus hautes que prevu)
- **Jaune** : ecart entre 5% et 10% (a surveiller)

---

## Pourquoi entrer ces donnees

### Le budget comme outil de decision

| Situation | Sans budget | Avec budget |
|-----------|------------|-------------|
| Embauche d'un nouvel employe | "On verra si on peut se le permettre" | "Le budget montre 30 000 $ de marge -- on peut embaucher a 4 000 $/mois" |
| Investissement en marketing | "Combien depenser ?" | "Le budget alloue 90 000 $ annuels, soit 7 500 $/mois" |
| Negociation fournisseur | "C'est cher ou pas ?" | "Le budget CMV est de 482 000 $, cette hausse de 5% represente 24 100 $ -- acceptable ou non" |
| Demande de pret | "Combien emprunter ?" | "Les previsions montrent un besoin de 50 000 $ en Q3 pour le stock pre-noel" |
| Fin de mois difficile | Panique | "Le budget prevoyait un mois faible. Le cash flow est conforme aux previsions." |

### Le budget comme outil de controle

L'ecart budgetaire est le signal d'alarme le plus puissant :

| Type d'ecart | Signification | Action |
|-------------|--------------|--------|
| Revenus > Budget | Les ventes depassent les attentes | Verifier si c'est durable, ajuster les commandes fournisseurs |
| Revenus < Budget | Les ventes sont en dessous des objectifs | Analyser pourquoi (saisonnalite ? concurrence ? marketing insuffisant ?) |
| Depenses > Budget | Depassement de couts | Identifier la cause, couper ou reporter les depenses non essentielles |
| Depenses < Budget | Economies realisees | Verifier que ce n'est pas un oubli de saisie. Si reel : reaffecter les economies. |
| CMV > Budget sans hausse ventes | Couts unitaires en hausse | Negocier avec les fournisseurs, ajuster les prix de vente |

---

## Les previsions de tresorerie

### Pourquoi la tresorerie est differente du benefice

Une entreprise peut etre **rentable et en faillite** si elle n'a pas assez de liquidites pour payer ses obligations. Le benefice est un concept comptable. La tresorerie est l'argent reel en banque.

Exemple :
- BioCycle fait 26 640 $ de benefice en mars (selon l'etat des resultats)
- Mais un client B2B de 15 000 $ n'a pas encore paye
- Et BioCycle a du payer un fournisseur de 20 000 $ d'avance
- Resultat : benefice de +26 640 $ mais tresorerie de -8 360 $ pour le mois

### Prevision de tresorerie dans Koraline

**URL** : `/admin/comptabilite/previsions`

Le systeme projette jour par jour :
- **Encaissements prevus** : ventes en ligne (immediat), paiements B2B (selon echeances), remboursement TPS/TVQ
- **Decaissements prevus** : fournisseurs (selon echeances), salaires (fin de mois), loyer (debut de mois), taxes (dates limites)
- **Solde bancaire prevu** : argent disponible chaque jour

**Alerte** : Si le solde prevu descend sous un seuil defini (ex: 20 000 $), Koraline envoie une alerte. C'est vital pour eviter les decouvertes bancaires.

### Creer des scenarios

| Scenario | Hypothese | Utilite |
|----------|-----------|---------|
| **Optimiste** | Croissance de 25%, maintien des marges | Planifier les investissements si tout va bien |
| **Realiste** | Croissance de 15%, legere pression sur les marges | Base de travail pour les decisions courantes |
| **Pessimiste** | Croissance de 5%, hausse des couts | Se preparer au pire : quelles depenses couper ? |

---

## Construire un budget realiste -- Methode pas a pas

### Etape 1 : Estimer les revenus

Basez-vous sur les donnees historiques et vos objectifs de croissance :

| Source de revenu | Reel 2025 | Croissance visee | Budget 2026 | Methode d'estimation |
|-----------------|-----------|-------------------|-------------|---------------------|
| Ventes B2C | 620 000 $ | +21% | 750 000 $ | Tendance + investissement marketing accru |
| Ventes B2B | 380 000 $ | +26% | 480 000 $ | 5 nouveaux clients cliniques identifies |
| Abonnements | 160 000 $ | +31% | 210 000 $ | Taux de retention 85% + nouveaux |
| Livraison | 28 000 $ | +25% | 35 000 $ | Proportionnel aux ventes |
| **Total** | **1 188 000 $** | **+24%** | **1 475 000 $** | |

**Repartition mensuelle** : Ne repartissez PAS de maniere egale (1/12 par mois). Utilisez la saisonnalite historique :
- Janvier : 7,3% du total (faible, debut d'annee)
- Mars : 8,7% (forte demande)
- Septembre : 9,2% (pic de reprise)
- Decembre : 6,5% (creux des fetes)

### Etape 2 : Estimer le CMV

Le CMV est proportionnel aux ventes. Utilisez le ratio historique :

| Element | Ratio historique | Budget 2026 |
|---------|-----------------|-------------|
| Matieres premieres | 25% des ventes | 369 000 $ |
| Emballage | 3,4% des ventes | 50 000 $ |
| Livraison sortante | 4,2% des ventes | 62 000 $ |
| **Total CMV** | **32,7% des ventes** | **481 000 $** |

**Marge brute budgetee** : 67,3%. Comparez avec le reel chaque mois.

### Etape 3 : Estimer les charges fixes

Les charges fixes sont previsibles car elles ne varient pas avec les ventes :

| Charge | Mensuel | Annuel | Commentaire |
|--------|---------|--------|------------|
| Salaires | 27 000 $ | 324 000 $ | 6 employes, augmentation en avril |
| Loyer | 3 500 $ | 42 000 $ | Bail fixe |
| Assurances | 1 200 $ | 14 400 $ | Prime annuelle / 12 |
| Logiciels | 2 800 $ | 33 600 $ | Azure, licences, SaaS |
| Honoraires | 1 500 $ | 18 000 $ | Comptable CPA |

### Etape 4 : Estimer les charges variables

Les charges variables fluctuent avec les ventes :

| Charge | Ratio | Budget 2026 |
|--------|-------|-------------|
| Frais Stripe | 3,0% des ventes | 44 000 $ |
| Marketing Google | Variable | 48 000 $ (objectif) |
| Marketing Meta | Variable | 36 000 $ (objectif) |
| Marketing autre | Variable | 6 000 $ |
| Fournitures | 0,07% des ventes | 1 000 $ |
| Divers | Forfait | 9 600 $ |

### Etape 5 : Calculer le point mort

Le point mort est le niveau de ventes ou BioCycle couvre exactement ses charges :

```
Charges fixes annuelles :                        432 000 $
Marge sur couts variables : 67,3% - 3,0% (Stripe) = 64,3%

Point mort = Charges fixes / Marge sur couts variables
Point mort = 432 000 / 0,643 = 671 850 $ de ventes annuelles

Soit environ 56 000 $ de ventes par mois pour etre a l'equilibre.
```

Avec un budget de 1 475 000 $ de ventes, BioCycle est **largement au-dessus du point mort**. La marge de securite est de 803 150 $ (54%).

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Budget trop optimiste | Deception, surinvestissement, problemes de tresorerie | Utiliser les chiffres reels de l'annee precedente comme base |
| Budget trop detaille | Impossible a suivre, personne ne le consulte | 15-20 categories suffisent, pas 100 |
| Ne jamais regarder le budget apres sa creation | Perte totale de l'utilite du budget | Inscrire la revue budget dans la routine mensuelle |
| Ignorer la saisonnalite | Budget lineaire alors que les ventes sont saisonnieres | Repartir les revenus selon les patterns historiques |
| Ne pas inclure les taxes dans les previsions de tresorerie | Le paiement trimestriel de TPS/TVQ (12 000 $+) est une surprise | Inclure les acomptes de taxes et les paiements trimestriels |
| Ne pas budgeter les impots | Le paiement annuel d'impots est une surprise massive | Estimer les acomptes provisionnels trimestriels |
| Confondre depense et sortie de tresorerie | Le budget montre un benefice mais le compte est vide | Separer le budget d'exploitation (P&L) du budget de tresorerie (cash flow) |

---

## Quand faire cette operation

| Quand | Action |
|-------|--------|
| **Octobre-decembre** | Preparer le budget de l'annee suivante |
| **Janvier** | Saisir et activer le budget dans Koraline |
| **Mensuel** | Generer le rapport Budget vs Reel, analyser les ecarts |
| **Trimestriel** | Reviser le budget si les conditions ont change significativement |
| **Sur demande** | Mettre a jour les previsions pour les demandes de financement |

---

## Questions frequentes (FAQ)

**Q : Suis-je oblige de faire un budget ?**
R : Non, ce n'est pas une obligation legale. Mais c'est l'outil de gestion le plus puissant pour une entreprise en croissance. Toute banque ou investisseur vous en demandera un. Et sans budget, vous ne savez pas si vos depenses sont raisonnables jusqu'a ce qu'il soit trop tard.

**Q : Que faire si je depasse mon budget ?**
R : Analysez pourquoi. Un depassement de marketing qui genere plus de ventes est peut-etre bon. Un depassement de loyer sans raison est mauvais. L'important est de comprendre l'ecart, pas de le respecter a tout prix. Un budget est un guide, pas une loi.

**Q : Les previsions sont-elles fiables ?**
R : Plus vous avez d'historique, plus elles sont precises. Avec 12+ mois de donnees, les previsions de revenus sont generalement fiables a +/- 15%. Les depenses fixes sont tres previsibles. Les depenses variables et les ventes sont plus incertaines.

**Q : Puis-je avoir plusieurs budgets pour la meme annee ?**
R : Oui. Vous pouvez avoir un budget "Initial" (approuve en janvier), un budget "Revise Q2" (ajuste en juillet) et un budget "Direction" (objectifs ambitieux). Koraline conserve toutes les versions.

**Q : Comment calculer le CMV previsionnel ?**
R : Utilisez le ratio CMV/Ventes de l'annee precedente. Si le CMV etait de 33% des ventes en 2025 et que vous prevoyez 1 475 000 $ de ventes en 2026, le CMV previsionnel est d'environ 487 000 $. Ajustez si vous anticipez des changements de prix fournisseurs.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Budget** | Plan financier previsionnel detaillant les revenus et depenses attendus pour une periode. Outil de planification et de controle de gestion. |
| **Ecart budgetaire** | Difference entre le montant budgete et le montant reel. Favorable si les revenus reels sont superieurs ou les depenses inferieures au budget. |
| **Prevision (forecast)** | Projection des resultats futurs basee sur les tendances historiques et les conditions actuelles. Se met a jour en continu, contrairement au budget qui est fixe. |
| **Scenario** | Version alternative d'une prevision basee sur differentes hypotheses (optimiste, realiste, pessimiste). |
| **Tresorerie (cash flow)** | Argent reellement disponible en banque, par opposition au benefice comptable. Une entreprise peut etre rentable mais manquer de tresorerie. |
| **Budget de tresorerie** | Prevision des encaissements et decaissements reels, jour par jour ou mois par mois. Distingue du budget d'exploitation (P&L). |
| **Budget base zero** | Methode ou chaque poste est justifie a partir de zero, sans se baser sur l'annee precedente. Rigoureux mais long. |
| **Charges fixes** | Depenses qui ne varient pas avec le volume de ventes (loyer, salaires, assurances). Previsibles et budgetables avec precision. |
| **Charges variables** | Depenses proportionnelles aux ventes (CMV, commissions Stripe, livraison). Budgetees en pourcentage du revenu prevu. |
| **Point mort (break-even)** | Niveau de ventes ou les revenus couvrent exactement les charges. En dessous : perte. Au-dessus : profit. |

---

## Pages reliees

- [Etat des resultats](06-resultats.md) : Les resultats reels a comparer avec le budget
- [Grand livre](04-grand-livre.md) : Detail des transactions reelles
- [Depenses](08-depenses.md) : Depenses a controler contre le budget
- [Rapports](12-rapports.md) : Rapports Budget vs Reel et analyses d'ecarts
- [Bilan](05-bilan.md) : Impact des decisions budgetaires sur la situation financiere
