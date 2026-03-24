# Etat des Resultats (Income Statement / P&L)

> **Section**: Comptabilite > Etats financiers > Resultats
> **URL**: `/admin/comptabilite/etats-financiers`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~35 minutes

---

## Pourquoi cette page est importante

L'etat des resultats repond a la question la plus importante pour un proprietaire d'entreprise : **est-ce que BioCycle Peptides fait de l'argent ?** Contrairement au bilan qui est une photo a un instant, l'etat des resultats couvre une periode et montre le film de la performance : combien est entre, combien est sorti, et ce qui reste.

**Obligations legales** :
- L'etat des resultats est un composant obligatoire des etats financiers annuels exiges par la Loi canadienne sur les societes par actions.
- Il est requis pour les declarations T2 (ARC) et CO-17 (Revenu Quebec), rempli via les codes GIFI des comptes de revenus (8000-8299) et de charges (8300-9998).
- L'ARC utilise l'etat des resultats pour verifier que les revenus declares correspondent aux ventes reelles et que les deductions sont admissibles.

**Impact concret** :
- Un etat des resultats positif (benefice net) signifie que l'entreprise est rentable et genere des impots a payer.
- Un etat des resultats negatif (perte nette) peut etre reporte sur les annees futures pour reduire les impots (report de pertes).
- Les marges (brute, operationnelle, nette) sont les indicateurs cles pour evaluer la sante de l'entreprise et prendre des decisions strategiques.
- La comparaison mois par mois revele les tendances saisonnieres et les problemes emergents.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan (actifs, passifs, capitaux propres)
 ↓
[6. ETAT DES RESULTATS] ← VOUS ETES ICI (revenus - charges = benefice)
 ↓
 7-12. Factures, depenses, taxes, rapprochement, budget, rapports
```

L'etat des resultats est l'etape 6. Il est genere a partir des comptes de revenus (4000-4999) et de charges (5000-5999) du grand livre. Le resultat net (benefice ou perte) de l'etat des resultats est ensuite reporte dans les BNR du bilan.

**Lien fondamental avec le bilan** :
- Benefice net de l'etat des resultats = variation du BNR au bilan (si pas de dividendes)
- Les deux etats financiers doivent etre coherents

---

## Ordre des operations

1. **Toutes les ecritures de revenus et charges du mois sont publiees**
2. **Les ecritures d'ajustement sont passees** (amortissement, provisions, charges a payer)
3. **La balance de verification est equilibree**
4. **Generer l'etat des resultats** pour la periode souhaitee
5. **Analyser les marges** : brute, operationnelle, nette
6. **Comparer** avec la periode precedente et avec le budget
7. **Identifier les ecarts** significatifs et investiguer

---

## La structure de l'etat des resultats

```
Revenus
- Cout des marchandises vendues (CMV)
= BENEFICE BRUT (marge brute)
- Depenses d'exploitation
= BENEFICE D'EXPLOITATION (BAIIA avant amortissement et interets)
- Amortissement
- Interets
= BENEFICE AVANT IMPOTS (BAI)
- Impots
= BENEFICE NET (resultat final)
```

Chaque sous-total a une signification specifique :

| Sous-total | Ce qu'il mesure | Question qu'il pose |
|-----------|----------------|---------------------|
| **Benefice brut** | Rentabilite du produit lui-meme | "Gagnons-nous assez sur chaque vente de peptides ?" |
| **BAIIA** | Rentabilite des operations avant elements financiers | "Nos operations courantes sont-elles rentables ?" |
| **BAI** | Rentabilite apres cout du capital | "Apres avoir paye nos interets et l'usure de nos equipements, restons-nous rentables ?" |
| **Benefice net** | Rentabilite finale | "Combien reste-t-il vraiment dans la poche de l'entreprise ?" |

---

## Comment entrer les donnees

L'etat des resultats est **genere automatiquement** a partir du grand livre. Vous n'entrez rien directement dans ce rapport. Votre role est de vous assurer que les ecritures de revenus et de charges sous-jacentes sont correctes.

### Generer l'etat des resultats

1. Ouvrez Etats financiers > onglet **Resultats** (ou P&L)
2. Selectionnez la **periode** (ex: Mars 2026, Q1 2026, Annee 2026)
3. Le rapport se genere automatiquement
4. Chaque ligne est cliquable pour voir le detail dans le grand livre

### Comparer avec la periode precedente

1. Activez le mode **Comparaison**
2. Deux colonnes s'affichent avec l'ecart en valeur et en pourcentage

| Poste | Mars 2026 | Fevrier 2026 | Ecart | % |
|-------|-----------|-------------|-------|---|
| Revenus totaux | 128 200 $ | 115 800 $ | +12 400 $ | +10,7% |
| CMV | 42 300 $ | 38 500 $ | +3 800 $ | +9,9% |
| Benefice brut | 85 900 $ | 77 300 $ | +8 600 $ | +11,1% |
| Depenses exploitation | 50 795 $ | 48 200 $ | +2 595 $ | +5,4% |
| Benefice net | 26 640 $ | 21 800 $ | +4 840 $ | +22,2% |

**Analyse** : Les revenus augmentent de 10,7% tandis que les depenses n'augmentent que de 5,4%. L'effet de levier operationnel est positif -- chaque dollar supplementaire de vente genere plus de profit.

### Comparer avec le budget

1. En mode comparaison, selectionnez **Budget** au lieu d'une periode
2. Le rapport montre la realite vs le budget prevu
3. Les ecarts favorables (revenus plus hauts, depenses plus basses que prevu) sont en vert
4. Les ecarts defavorables sont en rouge

### Explorer le detail d'un poste

1. Cliquez sur n'importe quel montant (ex: "Google Ads : 5 200 $")
2. Le grand livre s'ouvre filtre sur les transactions de ce compte
3. Vous voyez exactement quelles depenses composent ce total

---

## Pourquoi entrer ces donnees (dans le grand livre)

### Les revenus (4000-4999)

| Poste | Pourquoi le suivre | Impact fiscal |
|-------|-------------------|---------------|
| **Ventes B2C** (4010) | Volume principal de revenus, indicateur de croissance | Revenu imposable -- TPS/TVQ collectee sur chaque vente |
| **Ventes B2B** (4020) | Revenus des distributeurs et cliniques, souvent a marge plus faible | Memes taxes, mais conditions de paiement differentes (Net 30/60) |
| **Abonnements** (4030) | Revenu recurrent previsible, tres valorise | Se reconnait mensuellement, pas a la signature |
| **Frais livraison** (4040) | Revenu accessoire qui couvre (ou non) les couts de livraison | Taxable au meme titre que les ventes |
| **Escomptes sur ventes** (4050) | Reductions accordees (ex: 2% si paiement en 10 jours) | Reduit le revenu imposable |

### Le cout des marchandises vendues (CMV)

| Poste | Pourquoi le suivre | Impact fiscal |
|-------|-------------------|---------------|
| **Matieres premieres** (5011) | Cout d'achat des peptides bruts -- le plus gros poste de CMV | Deductible. La variation de stock est un ajustement fiscal important. |
| **Emballage** (5012) | Flacons, etiquettes, boites -- cout par unite vendue | Deductible. Surveiller les hausses de prix des fournisseurs. |
| **Livraison sortante** (5013) | Cout d'expedition vers les clients | Deductible. Comparer avec le revenu 4040 pour voir si la livraison est rentable. |

**Marge brute** = (Revenus - CMV) / Revenus. Pour BioCycle, la marge brute devrait etre entre 55% et 70%. Si elle descend sous 50%, il y a un probleme de prix ou de couts.

### Les charges d'exploitation (5020-5600)

| Poste | Pourquoi le suivre | Specificite fiscale |
|-------|-------------------|---------------------|
| **Salaires** (5020) | Le plus gros poste de charges apres le CMV | Deductible. Inclut les cotisations employeur (RRQ, AE, RQAP, CNESST). |
| **Loyer** (5030) | Charge fixe mensuelle | Deductible a 100% si local commercial. |
| **Marketing** (5040) | Investissement en croissance | Deductible. Surveiller le retour sur investissement (ROI). |
| **Frais bancaires/Stripe** (5060) | Environ 2,9% + 0,30 $ par transaction | Deductible. Sur 128 200 $ de ventes, ca represente ~3 845 $. Poste significatif. |
| **Honoraires professionnels** (5090) | Comptable, avocat, consultant | Deductible. Conservez les factures -- l'ARC les verifie souvent. |
| **Repas et divertissements** (5095) | Repas d'affaires, receptions clients | Deductibles a **50% seulement** (regle canadienne speciale). |
| **Amortissement** (5200) | Depreciation de l'equipement | Calcule selon les taux de DPA de l'ARC. Pas une sortie d'argent reelle. |

---

## Lecture complete d'un etat des resultats -- Exemple BioCycle

```
ETAT DES RESULTATS
BioCycle Peptides Inc.
Pour la periode du 1er au 31 mars 2026

REVENUS
  Ventes de peptides (detail B2C)              65 000 $
  Ventes B2B (distributeurs/cliniques)         42 000 $
  Abonnements mensuels                         18 000 $
  Frais de livraison factures                   3 200 $
TOTAL REVENUS                                 128 200 $

COUT DES MARCHANDISES VENDUES (CMV)
  Achat de matieres premieres                  32 000 $
  Emballage et etiquetage                       4 500 $
  Frais de livraison (transporteurs)            5 800 $
TOTAL CMV                                      42 300 $

BENEFICE BRUT                                  85 900 $    Marge brute : 67,0%

CHARGES D'EXPLOITATION
  Salaires et avantages sociaux                28 000 $
  Loyer et services publics                     3 500 $
  Marketing et publicite                        8 200 $
  Logiciels et hebergement                      2 800 $
  Frais bancaires et Stripe                     3 845 $
  Assurances                                    1 200 $
  Fournitures de bureau                           350 $
  Honoraires professionnels                     1 500 $
  Divers                                          600 $
TOTAL CHARGES D'EXPLOITATION                   49 995 $

BAIIA                                          35 905 $    Marge BAIIA : 28,0%

  Amortissement                                   800 $
TOTAL CHARGES APRES AMORTISSEMENT              50 795 $

BENEFICE D'EXPLOITATION                        35 105 $    Marge operationnelle : 27,4%

AUTRES REVENUS (CHARGES)
  Interets sur emprunt bancaire                  (250 $)
  Gain de change                                    85 $
TOTAL AUTRES                                     (165 $)

BENEFICE AVANT IMPOTS                          34 940 $

IMPOTS ESTIMES
  Impot federal estime                          4 500 $
  Impot provincial estime                       3 800 $
TOTAL IMPOTS                                    8 300 $

BENEFICE NET                                   26 640 $    Marge nette : 20,8%
```

### Analyse des marges

| Marge | Formule | BioCycle Mars 2026 | Fourchette saine e-commerce | Interpretation |
|-------|---------|--------------------|-----------------------------|----------------|
| **Marge brute** | (Revenus - CMV) / Revenus | 67,0% | 50-70% | Excellent. Le produit degage une bonne marge. |
| **Marge BAIIA** | BAIIA / Revenus | 28,0% | 15-25% | Tres bon. Les operations sont efficaces. |
| **Marge operationnelle** | Benefice exploitation / Revenus | 27,4% | 15-25% | Tres bon. Faible amortissement. |
| **Marge nette** | Benefice net / Revenus | 20,8% | 10-20% | Excellent. Chaque dollar de vente genere 0,21 $ de profit net. |

### Indicateurs cles a surveiller

| Indicateur | Ce que BioCycle devrait surveiller | Alerte si... |
|-----------|-----------------------------------|-------------|
| **Marge brute** | Variation mensuelle | Baisse de plus de 3 points (indique hausse des couts fournisseurs ou baisses de prix) |
| **Ratio marketing/ventes** | 8 200 / 128 200 = 6,4% | Depasse 10% sans augmentation proportionnelle des ventes |
| **Frais Stripe/ventes** | 3 845 / 128 200 = 3,0% | Normal pour Stripe. Si > 3,5%, verifier les transactions refusees |
| **Salaires/ventes** | 28 000 / 128 200 = 21,8% | Depasse 30% (signal d'inefficacite) |
| **Benefice net mensuel** | 26 640 $ | Negatif pendant 2 mois consecutifs |

---

## Specificites BioCycle Peptides

### Saisonnalite du secteur peptides

| Periode | Tendance | Impact sur les resultats |
|---------|----------|--------------------------|
| Janvier-Mars | Forte demande (resolutions, sport) | Revenus plus eleves, marge brute stable |
| Avril-Juin | Demande stable | Periode de base pour les comparaisons |
| Juillet-Aout | Demande stable (athletes, cliniques) | Marketing peut etre reduit |
| Septembre | Pic de reprise | Investissement marketing accru |
| Decembre | Creux (fetes) | Revenus plus bas, mais charges fixes identiques |

**Important** : La comparaison mois par mois peut etre trompeuse a cause de la saisonnalite. Comparez aussi avec le meme mois de l'annee precedente (mars 2026 vs mars 2025).

### Cout des marchandises vendues -- Specificite e-commerce peptides

Le CMV pour BioCycle inclut :
- **Matieres premieres** : les peptides bruts achetes aux fabricants (Chine, Inde, USA). Cout variable avec le taux de change USD/CAD.
- **Emballage** : flacons pharmaceutiques, etiquettes conformes, boites d'expedition. Cout relativement fixe par unite.
- **Livraison** : Postes Canada, UPS, FedEx. Variable selon le volume et les destinations.

Un CMV en hausse sans hausse proportionnelle des ventes signale : augmentation des prix fournisseurs, depreciation du CAD vs USD, gaspillage ou peremption de stock, ou erreur de saisie comptable.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Oublier les ecritures d'ajustement avant de generer | Amortissement et provisions manquent, le benefice est surevalue | Checklist de fin de mois obligatoire |
| Confondre les revenus du dashboard Commerce et les revenus comptables | Ecart entre les ventes en temps reel et les revenus comptabilises | Le dashboard montre les commandes ; l'etat des resultats montre les factures publiees |
| Classer un achat d'equipement en charge | Le benefice est sous-evalue, la charge n'est pas etalee | Tout achat > 500 $ avec duree de vie > 1 an est une immobilisation, pas une charge |
| Ne pas separer les deductions limitees | Repas a 100% au lieu de 50%, deduction refusee par l'ARC | Utiliser un compte separe pour les repas et divertissements |
| Ignorer l'impact fiscal des stocks | La variation de stock affecte le CMV et donc le benefice imposable | Faire un decompte physique au moins en fin d'annee |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Mensuelle** | Generer l'etat des resultats. Analyser les marges. Comparer avec le mois precedent et le budget. Identifier les ecarts significatifs. |
| **Trimestrielle** | Vue trimestrielle pour les tendances. Comparaison Q-sur-Q et avec le meme trimestre de l'annee precedente. |
| **Annuelle** | Etat des resultats annuel definitif. Base pour la declaration T2/CO-17 et le calcul des impots. |

---

## Questions frequentes (FAQ)

**Q : Quelle est la difference entre le benefice brut et le benefice net ?**
R : Le benefice **brut** = revenus - cout des produits vendus. C'est la marge sur les produits eux-memes. Le benefice **net** = brut - TOUTES les charges (salaires, loyer, marketing, amortissement, interets, impots). C'est ce qui reste reellement dans la poche de l'entreprise.

**Q : Les impots affiches sont-ils definitifs ?**
R : Non, ce sont des estimations basees sur les taux d'imposition configures. Le montant exact sera determine lors de la declaration annuelle avec votre comptable. Les taux combines federal + provincial pour une PME au Quebec sont d'environ 26,5% sur les premiers 500 000 $ de benefice (deduction pour petite entreprise).

**Q : Qu'est-ce que le BAIIA (EBITDA) ?**
R : Benefice Avant Interets, Impots et Amortissement. C'est le benefice des operations pures, avant les elements financiers et comptables. C'est l'indicateur prefere des investisseurs car il mesure la performance operationnelle independamment de la structure de capital et des choix comptables.

**Q : Les revenus de l'etat des resultats ne correspondent pas aux ventes du dashboard Commerce -- pourquoi ?**
R : Le dashboard Commerce montre les ventes en temps reel (commandes). L'etat des resultats montre les revenus comptables (factures publiees). Il peut y avoir un decalage de 1 a 3 jours. De plus, les retours et escomptes reduisent les revenus comptables.

**Q : Comment sont calcules les impots estimes ?**
R : Koraline applique les taux d'imposition configures : environ 15% federal (9% avec la deduction pour petite entreprise) et 11,5% provincial (3,2% avec la DPE au Quebec) sur le benefice avant impots. Votre comptable ajustera lors de la declaration annuelle.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Etat des resultats** | Rapport financier montrant les revenus, les charges et le benefice (ou la perte) sur une periode. Aussi appele P&L (Profit and Loss) ou compte de resultat. |
| **CMV** | Cout des Marchandises Vendues (COGS en anglais). Cout direct des produits vendus : matieres premieres, emballage, livraison. |
| **Marge brute** | (Revenus - CMV) / Revenus. Mesure la rentabilite du produit avant les charges d'exploitation. |
| **BAIIA / EBITDA** | Benefice Avant Interets, Impots et Amortissement. Mesure la performance operationnelle pure. |
| **Benefice d'exploitation** | Benefice apres toutes les charges operationnelles mais avant les elements financiers et les impots. |
| **Benefice net** | Resultat final apres toutes les charges, y compris les impots. C'est le "vrai" profit de l'entreprise. |
| **Marge nette** | Benefice net / Revenus. Pourcentage de chaque dollar de vente qui reste en profit. |
| **DPE** | Deduction pour Petite Entreprise. Reduction du taux d'imposition federal et provincial sur les premiers 500 000 $ de benefice pour les societes privees controlees canadiennes (SPCC). |
| **Report de pertes** | Possibilite de reporter une perte nette sur les 3 annees precedentes ou les 20 annees suivantes pour reduire les impots. |
| **Charges fixes** | Charges qui ne varient pas avec le volume de ventes (loyer, salaires, assurances). |
| **Charges variables** | Charges qui augmentent proportionnellement aux ventes (CMV, commissions Stripe, livraison). |

---

## Pages reliees

- [Bilan](05-bilan.md) : L'autre etat financier principal (le benefice net alimente les BNR)
- [Budget](11-budget.md) : Previsions a comparer avec les resultats reels
- [Grand livre](04-grand-livre.md) : Detail des transactions de revenus et charges
- [Depenses](08-depenses.md) : Source des charges d'exploitation
- [Factures](07-factures.md) : Source des revenus
- [Rapports](12-rapports.md) : Analyses et ratios derives de l'etat des resultats
