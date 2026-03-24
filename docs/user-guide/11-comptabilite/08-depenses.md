# Gestion des Depenses

> **Section**: Comptabilite > Depenses
> **URL**: `/admin/comptabilite/depenses`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~30 minutes

---

## Pourquoi cette page est importante

Les depenses representent **tout l'argent qui sort** de BioCycle Peptides pour faire fonctionner l'entreprise. Chaque depense correctement enregistree est une deduction fiscale potentielle qui reduit vos impots. Chaque depense oubliee ou mal categorisee est de l'argent perdu en impots payes en trop ou en credits de taxes non reclames.

**Obligations legales** :
- L'ARC exige des pieces justificatives (recus, factures) pour **toute** deduction fiscale. Pas de recu = pas de deduction = vous payez plus d'impots.
- Les pieces justificatives doivent etre conservees pendant **6 ans** apres la fin de l'annee d'imposition.
- Certaines categories de depenses ont des regles speciales : les repas d'affaires ne sont deductibles qu'a **50%**, les vehicules sont limites a la proportion d'utilisation professionnelle, les equipements de plus de 500 $ doivent etre amortis (pas depenses immediatement).
- Les TPS/TVQ payees sur les depenses d'affaires sont recuperables comme CTI/RTI -- mais seulement si la piece justificative inclut le numero de TPS/TVQ du fournisseur.

**Impact concret** : Pour BioCycle avec un taux d'imposition combine d'environ 26,5%, chaque 1 000 $ de depense admissible bien documentee represente une economie d'impots de 265 $. De plus, les 149,75 $ de TPS/TVQ sur cette depense sont recuperables via les CTI/RTI. Total : 414,75 $ de recuperation par 1 000 $ de depense.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7. Factures (revenus)
 ↓
[8. DEPENSES] ← VOUS ETES ICI (charges d'exploitation)
 ↓
 9. Taxes TPS/TVQ → 10. Rapprochement
 ↓
 11. Budget → 12. Rapports
```

Les depenses alimentent directement l'etat des resultats (etape 6) comme charges d'exploitation. Elles alimentent aussi la declaration TPS/TVQ (etape 9) via les credits d'intrants. Au bilan (etape 5), les depenses non encore payees apparaissent dans les comptes fournisseurs.

---

## Ordre des operations

1. **La depense se produit** (achat, abonnement, service)
2. **Obtenir la piece justificative** (recu, facture, releve de carte)
3. **Saisir la depense dans Koraline** le jour meme ou dans les 48h
4. **Joindre la piece justificative** (scanner ou photographier le recu)
5. **Verifier la categorisation** (bon compte de charge, taxes correctes)
6. **Publier** l'ecriture
7. En fin de mois : **verifier que rien ne manque** en comparant avec le releve bancaire

---

## Comment entrer les donnees

### Enregistrer une depense

**URL** : `/admin/comptabilite/depenses`

1. Cliquez sur **Nouvelle depense**
2. Remplissez chaque champ :

| Champ | Quoi mettre | Exemple | Pourquoi |
|-------|------------|---------|----------|
| **Date** | Date de la depense (sur le recu) | 2026-03-12 | Determine la periode comptable |
| **Description** | Ce qui a ete paye | Campagne Google Ads BPC-157 mars | Pour identifier la transaction dans les rapports |
| **Categorie** | Type de depense | Marketing | Determine le compte de charge et la categorie GIFI |
| **Fournisseur** | Le beneficiaire | Google Ireland Ltd | Pour le suivi fournisseur et l'aging |
| **Montant HT** | Montant avant taxes | 1 500,00 $ | Base de calcul des taxes et de la deduction fiscale |
| **TPS** | Taxe federale | 75,00 $ (auto) | CTI recuperable |
| **TVQ** | Taxe provinciale | 149,63 $ (auto) | RTI recuperable |
| **Compte bancaire** | D'ou provient le paiement | 1010 - Banque TD | Pour le rapprochement bancaire |
| **Mode de paiement** | Comment vous avez paye | Carte de credit | Pour la tracabilite |

3. **Joignez le recu ou la facture** (photo, PDF)
4. Cliquez sur **Enregistrer**

### Ecriture comptable generee automatiquement

```
Debit  5041 - Google Ads             1 500,00 $
Debit  1150 - TPS intrants             75,00 $
Debit  1160 - TVQ intrants            149,63 $
Credit 1010 - Banque TD                            1 724,63 $
```

**Logique** : La depense marketing est une charge (augmente au debit). Les taxes payees sont des credits a recuperer (actif augmente au debit). L'argent sort de la banque (actif diminue au credit).

### Scanner un recu par OCR

1. Cliquez sur **Scanner** (ou deposez l'image directement)
2. Le systeme OCR analyse le document et extrait :
   - Nom du fournisseur
   - Montant total
   - TPS et TVQ separees
   - Date du document
3. **Verifiez toujours les donnees extraites** -- l'OCR peut confondre des chiffres, surtout sur les recus thermiques decolores
4. Completez la categorie de depense
5. Cliquez sur **Enregistrer**

### Configurer les depenses recurrentes

**Quand** : Pour les charges identiques chaque mois (loyer, assurance, abonnements).

1. Cliquez sur **Recurrentes** > **Nouvelle**
2. Remplissez comme une depense normale
3. Configurez la frequence (mensuelle, trimestrielle)
4. Le systeme cree automatiquement la depense et l'ecriture chaque mois

**Depenses recurrentes typiques pour BioCycle** :

| Depense | Montant HT | Frequence | Compte |
|---------|-----------|-----------|--------|
| Loyer bureau | 2 000 $ | Mensuel, le 1er | 5030 |
| Assurance responsabilite | 400 $ | Mensuel, le 15 | 5070 |
| Azure (hebergement) | ~350 $ | Mensuel, le 1er | 5076 |
| Stripe (frais fixes) | 0 $ + variable | Automatique | 5060 |
| Abonnement logiciels | 200 $ | Mensuel, le 1er | 5077 |

### Approuver les depenses des employes

Si le workflow d'approbation est active :
1. Un employe soumet une depense (via l'interface ou l'application mobile)
2. Elle apparait dans l'onglet **A approuver**
3. Verifiez : description, montant, recu joint, categorie
4. **Approuvez** ou **Rejetez** avec un commentaire
5. Les depenses approuvees sont publiees dans les livres

---

## Pourquoi entrer ces donnees

### Chaque depense a un impact fiscal triple

1. **Deduction de l'impot sur le revenu** : La depense reduit le benefice imposable. A 26,5% d'imposition, chaque 1 000 $ de depense admissible economise 265 $ d'impots.

2. **Credit de TPS (CTI)** : Les 5% de TPS payes sur la depense sont recuperables. Pour 1 000 $ HT, vous recuperez 50 $.

3. **Remboursement de TVQ (RTI)** : Les 9,975% de TVQ payes sur la depense sont recuperables. Pour 1 000 $ HT, vous recuperez 99,75 $.

**Total recupere pour 1 000 $ HT de depense** : 265 $ (impot) + 50 $ (CTI) + 99,75 $ (RTI) = **414,75 $**. C'est pourquoi il est crucial de ne rien oublier.

### Categories de depenses et leur traitement fiscal

| Categorie | Compte | Deductible | CTI/RTI | Regle speciale |
|-----------|--------|-----------|---------|---------------|
| **Matieres premieres** | 5011 | 100% | Oui | Variation de stock en fin d'annee |
| **Salaires** | 5021 | 100% | N/A | Pas de TPS/TVQ sur les salaires |
| **Loyer** | 5030 | 100% | Oui | Si loyer commercial |
| **Marketing** | 5040 | 100% | Oui | |
| **Livraison** | 5050 | 100% | Oui | |
| **Frais bancaires** | 5060 | 100% | Non | Les services financiers sont exemptes de TPS/TVQ |
| **Assurances** | 5070 | 100% | Non | L'assurance est exempte de TPS/TVQ au Quebec |
| **Logiciels** | 5075 | 100% | Oui | Meme si le fournisseur est etranger (TPS auto-cotisation) |
| **Honoraires professionnels** | 5090 | 100% | Oui | Comptable, avocat, consultant |
| **Repas d'affaires** | 5095 | **50%** | **50%** | Regle speciale : seulement la moitie est deductible |
| **Divertissement** | 5095 | **50%** | **50%** | Meme regle que les repas |
| **Equipement > 500 $** | 1400 | Amortissement | Oui | Immobilisation, pas depense immediate |
| **Dons de charite** | N/A | Credit d'impot | Non | Pas une depense mais un credit d'impot a part |

---

## Specificites fiscales canadiennes

### Depenses non admissibles

Certaines depenses ne sont **jamais** deductibles :
- Depenses personnelles (meme payees avec la carte d'entreprise)
- Amendes et penalites gouvernementales
- Cotisations a un club de golf (depuis 2019)
- Depenses en capital (doivent etre amorties)

### Depenses a restriction

| Depense | Restriction | Detail |
|---------|------------|--------|
| Repas et divertissement | 50% deductible | Vous pouvez deduire seulement la moitie du montant paye |
| Vehicule a moteur | Proportion professionnelle | Tenez un registre de kilometres. Si 80% pro : deduisez 80% des frais |
| Bureau a domicile | Proportion de la surface | Si le bureau occupe 15% de la maison : deduisez 15% du loyer/hypotheque, electricite, etc. |
| Convention/conference | Maximum 2 par an | Au-dela de 2 conferences par an, la depense peut etre refusee |

### Depense personnelle payee par erreur avec la carte d'entreprise

Ne la classez PAS en charge. Enregistrez-la comme "Avance a l'actionnaire" (compte 2600 au bilan). Remboursez l'entreprise ensuite. Si l'avance n'est pas remboursee dans l'annee, l'ARC peut la traiter comme un revenu imposable pour l'actionnaire.

---

## Analyse des depenses -- Outils dans Koraline

### Vue par categorie

La page Depenses offre une vue analytique qui montre :
- **Graphique en camembert** : repartition des depenses par categorie. Identifiez immediatement les postes les plus lourds.
- **Top 5 des categories** : les 5 categories les plus couteuses du mois.
- **Courbe de tendance** : evolution mois par mois de chaque categorie.
- **Comparaison avec le budget** : ecart entre la depense reelle et la depense budgetee.

### Exemple d'analyse pour BioCycle (mars 2026)

| Categorie | Montant | % du total | Budget | Ecart |
|-----------|---------|-----------|--------|-------|
| Salaires et charges | 28 000 $ | 39,2% | 28 000 $ | 0% |
| Marketing | 8 200 $ | 11,5% | 8 200 $ | 0% |
| Livraison | 5 800 $ | 8,1% | 5 800 $ | 0% |
| Loyer | 3 500 $ | 4,9% | 3 500 $ | 0% |
| Frais bancaires | 3 845 $ | 5,4% | 3 845 $ | 0% |
| Logiciels | 2 800 $ | 3,9% | 2 800 $ | 0% |
| Honoraires | 1 500 $ | 2,1% | 1 500 $ | 0% |
| Assurances | 1 200 $ | 1,7% | 1 200 $ | 0% |
| Autres | 950 $ | 1,3% | 800 $ | +18,8% |

**Lecture** : Les salaires representent presque 40% des charges d'exploitation. C'est le poste le plus important apres le CMV. Le marketing est a 11,5% -- un ratio sain pour une entreprise e-commerce en croissance.

### Indicateurs d'alerte

Surveillez ces signaux :

| Signal | Seuil d'alerte | Action |
|--------|---------------|--------|
| Frais Stripe > 3,5% des ventes | Les transactions refusees augmentent les frais | Verifier le taux de refus des cartes |
| Marketing > 10% des ventes sans croissance | L'investissement marketing n'est pas rentable | Analyser le ROI par canal |
| Salaires > 30% des ventes | L'equipe est surdimensionnee par rapport aux ventes | Optimiser ou augmenter les ventes |
| Honoraires > 2% des ventes | Les frais professionnels sont excessifs | Negocier ou internaliser |
| "Divers" > 5% du total | Trop de depenses ne sont pas categorisees | Mieux categoriser a la saisie |

### Depenses par fournisseur

Koraline montre aussi les depenses groupees par fournisseur :

| Fournisseur | Montant YTD | Nombre factures | Delai paiement moyen |
|-------------|-------------|-----------------|---------------------|
| PeptideLab Inc. | 96 000 $ | 12 | 35 jours |
| Google Ireland | 15 600 $ | 3 | Immediat (carte) |
| Proprietaire bureau | 6 000 $ | 3 | 1er du mois |
| Meta Platforms | 9 000 $ | 3 | Immediat (carte) |
| Azure Microsoft | 1 050 $ | 3 | Immediat (carte) |

**Utilite** : Identifier les fournisseurs strategiques (PeptideLab = 65% des achats), negocier les conditions, diversifier si necessaire.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Depense sans recu joint | L'ARC refuse la deduction, vous payez plus d'impots | Scanner systematiquement tous les recus le jour meme |
| Categorie incorrecte | La depense apparait au mauvais endroit dans les rapports, les comparaisons sont faussees | Se referer a la liste des categories et au plan comptable |
| Oublier de cocher les taxes | Les CTI/RTI ne sont pas reclames, vous perdez 14,975% | Par defaut, les taxes sont cochees. Ne decochez que pour les depenses exemptes (frais bancaires, assurances) |
| Saisir le montant TTC au lieu de HT | Les taxes sont calculees en double, le montant total est faux | Toujours saisir le montant HT |
| Enregistrer un equipement comme depense | Le benefice est sous-evalue, pas d'amortissement sur les annees suivantes | Tout achat > 500 $ avec duree de vie > 1 an = immobilisation (compte 1400+) |
| Repas a 100% au lieu de 50% | L'ARC desavoue la portion non admissible lors d'une verification | Utiliser une categorie separee "Repas et divertissement" qui est automatiquement limitee a 50% |
| Depenses personnelles dans les charges | Melange fiscal, risque de penalites, avantage imposable pour l'actionnaire | Toujours separer. Utiliser le compte "Avance a l'actionnaire" (2600) |
| Ne pas enregistrer les depenses en USD avec le bon taux | Gain/perte de change non comptabilise, charge inexacte | Laisser Koraline convertir au taux du jour automatiquement |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Quotidien** | Enregistrer les depenses du jour, scanner les recus |
| **Hebdomadaire** | Verifier les depenses automatiques (Stripe, abonnements), approuver les depenses des employes |
| **Fin de mois** | Verifier que toutes les depenses du mois sont saisies en comparant avec le releve bancaire. Verifier les depenses recurrentes. |
| **Fin de trimestre** | Exporter la liste des depenses pour la declaration TPS/TVQ (credits d'intrants) |
| **Fin d'annee** | Revue annuelle avec le comptable. Identifier les depenses manquantes. Verifier les categories. |

---

## Questions frequentes (FAQ)

**Q : Dois-je scanner TOUS mes recus ?**
R : Oui. L'ARC et Revenu Quebec exigent des pieces justificatives pour 6 ans. Scanner et joindre les recus dans Koraline est la methode la plus sure. Un recu thermique non scanne deviendra illisible en quelques mois.

**Q : Les frais Stripe sont-ils enregistres automatiquement ?**
R : Oui. Les commissions Stripe (2,9% + 0,30 $ par transaction) sont extraites automatiquement des paiements recus et enregistrees comme depenses dans le compte 5060. Note : les frais de services financiers sont exemptes de TPS/TVQ -- pas de CTI/RTI sur ce poste.

**Q : Comment gerer les depenses en devises etrangeres (USD) ?**
R : Saisissez le montant en USD. Koraline convertit automatiquement en CAD au taux de la Banque du Canada du jour. La devise d'origine est conservee pour reference. Si le taux change entre la saisie et le paiement, le gain ou la perte de change est comptabilise automatiquement.

**Q : Un achat d'ordinateur a 2 500 $ est-il une depense ?**
R : Non, c'est une **immobilisation**. Tout achat de plus de 500 $ avec une duree de vie superieure a 1 an doit etre enregistre comme actif (compte 1420) et amorti sur sa duree de vie utile (categorie 50 de la DPA, taux de 55% degressif). Ne l'enregistrez pas comme depense.

**Q : Mon employe a paye un repas d'affaires a 120 $ -- combien puis-je deduire ?**
R : 60 $ (50% de 120 $). Les repas et divertissements ne sont deductibles qu'a 50% au Canada. Les CTI/RTI sur les taxes sont aussi limites a 50%.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Depense** | Sortie d'argent pour les operations courantes de l'entreprise. Enregistree comme charge dans l'etat des resultats. |
| **Charge** | Terme comptable pour une depense. Reduit le benefice et donc les impots a payer. |
| **HT** | Hors Taxes. Montant avant l'ajout de la TPS et de la TVQ. C'est le montant de la charge reelle. |
| **TTC** | Toutes Taxes Comprises. Montant final incluant TPS et TVQ. C'est ce que vous payez reellement. |
| **CTI** | Credit de Taxe sur les Intrants. Montant de TPS paye sur une depense d'affaires que vous recuperez dans la declaration. |
| **RTI** | Remboursement de Taxe de Vente du Quebec sur les Intrants. Equivalent provincial du CTI. |
| **Piece justificative** | Document prouvant la depense : recu, facture, releve de carte, contrat. Exige par l'ARC pour toute deduction. |
| **Immobilisation** | Achat d'un actif a long terme (> 500 $, > 1 an de vie utile) qui n'est pas une depense immediate mais est amorti sur plusieurs annees. |
| **DPA** | Deduction pour Amortissement. Pourcentage maximal deductible chaque annee pour chaque categorie d'immobilisation. |
| **Depense admissible** | Depense engagee pour gagner un revenu d'entreprise et reconnue par l'ARC comme deductible du revenu imposable. |

---

## Pages reliees

- [Factures fournisseurs](07-factures.md) : Facturation formelle des achats importants
- [Ecritures](03-ecritures.md) : Detail des ecritures generees par les depenses
- [Taxes TPS/TVQ](09-taxes.md) : Credits d'intrants (CTI/RTI) generes par les depenses
- [Budget](11-budget.md) : Suivi budget vs depenses reelles
- [Rapprochement](10-rapprochement.md) : Verification des depenses contre le releve bancaire
- [Etat des resultats](06-resultats.md) : Ou les depenses apparaissent comme charges
