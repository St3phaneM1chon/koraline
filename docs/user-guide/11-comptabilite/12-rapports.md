# Rapports Financiers et Exports

> **Section**: Comptabilite > Rapports
> **URL**: `/admin/comptabilite/rapports`, `/admin/comptabilite/rapports-personnalises`, `/admin/comptabilite/exports`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~30 minutes

---

## Pourquoi cette page est importante

Les rapports financiers transforment les donnees brutes de la comptabilite en **informations utiles pour la prise de decision**. Chaque rapport repond a une question specifique : "Suis-je rentable ?", "Puis-je payer mes dettes ?", "Ou va mon argent ?", "Est-ce que je respecte mon budget ?". Sans rapports, les milliers d'ecritures dans le grand livre sont une masse de donnees indigerables.

**Obligations legales** :
- Les etats financiers annuels (bilan + etat des resultats) sont obligatoires pour toute societe par actions. Ils doivent etre produits dans les 6 mois suivant la fin de l'exercice.
- La balance de verification est exigee par les verificateurs et les comptables pour la preparation de la declaration T2/CO-17.
- L'ARC et Revenu Quebec peuvent exiger n'importe quel rapport detaille lors d'une verification fiscale.
- Les banques exigent des rapports periodiques (mensuels ou trimestriels) pour le suivi des covenants de pret.

**Impact concret** :
- Un rapport de rentabilite par produit revele que les ventes B2C de BPC-157 ont une marge de 72% tandis que les ventes B2B de TB-500 n'ont qu'une marge de 45%. Cette information oriente les investissements marketing.
- Un rapport d'anciennete des comptes clients montre 12 350 $ a recevoir dont 350 $ a plus de 90 jours -- il faut relancer ou provisionner.
- L'export annuel complet pour le comptable lui fait gagner des heures, ce qui reduit votre facture comptable.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7. Factures → 8. Depenses → 9. Taxes → 10. Rapprochement → 11. Budget
 ↓
[12. RAPPORTS FINANCIERS] ← VOUS ETES ICI (analyse et export)
```

Les rapports sont l'etape finale du cycle comptable. Toutes les etapes precedentes alimentent les rapports. Si les ecritures (etape 3) sont correctes, le rapprochement (etape 10) est termine, et les ajustements (etape 3) sont passes, alors les rapports (etape 12) sont fiables et exploitables.

---

## Ordre des operations

### Avant de generer des rapports

1. **Toutes les ecritures du mois sont publiees** (pas de brouillons)
2. **Les ecritures d'ajustement sont passees** (amortissement, provisions)
3. **Le rapprochement bancaire est termine** (soldes verifies)
4. **La balance de verification est equilibree** (debits = credits)

### Quels rapports generer et quand

| Rapport | Frequence | Pour qui | Question cle |
|---------|-----------|----------|-------------|
| Etat des resultats | Mensuel | Proprietaire, direction | "Suis-je rentable ce mois ?" |
| Bilan | Mensuel | Proprietaire, banque | "Quelle est ma situation financiere ?" |
| Balance de verification | Mensuel | Comptable | "Mes livres sont-ils equilibres ?" |
| Budget vs reel | Mensuel | Direction | "Est-ce que je respecte mes plans ?" |
| Anciennete clients | Mensuel | Credit, recouvrement | "Qui me doit de l'argent et depuis quand ?" |
| Rapport de TPS/TVQ | Trimestriel | Comptable, ARC | "Combien de taxes dois-je remettre ?" |
| Flux de tresorerie | Trimestriel | Direction, banque | "D'ou vient et ou va mon argent ?" |
| Ratios financiers | Trimestriel | Banque, investisseurs | "L'entreprise est-elle en bonne sante ?" |
| Export annuel complet | Annuel | Comptable externe | "Voici toutes les donnees pour la declaration" |

---

## Comment entrer les donnees

Les rapports sont **generes automatiquement** a partir des donnees existantes. Vous n'entrez rien de nouveau. Votre role est de les configurer, les generer, les analyser et les distribuer.

### Generer un rapport standard

**URL** : `/admin/comptabilite/rapports`

1. Selectionnez le type de rapport dans la liste
2. Configurez les parametres :

| Parametre | Options | Exemple |
|-----------|---------|---------|
| **Periode** | Mois, trimestre, annee, personnalisee | Mars 2026 |
| **Format** | Detaille (tous les comptes) ou resume (sous-totaux) | Detaille pour analyse, resume pour direction |
| **Comparaison** | Periode precedente, meme periode annee precedente, budget | vs fevrier 2026 |
| **Filtre** | Par departement, par produit, par canal | Ventes B2C seulement |

3. Cliquez sur **Generer**
4. Le rapport s'affiche a l'ecran
5. Exportez si necessaire : PDF (presentation), Excel (analyse), CSV (import)

### Creer un rapport personnalise

**URL** : `/admin/comptabilite/rapports-personnalises`

1. Cliquez sur **Nouveau rapport**
2. Selectionnez les **sources de donnees** :
   - Comptes du plan comptable (selectionner les comptes specifiques)
   - Factures (clients ou fournisseurs)
   - Depenses (par categorie)
   - Transactions bancaires
3. Definissez les **colonnes** :
   - Periodes (mois par mois, trimestre par trimestre)
   - Montants (debit, credit, solde net)
   - Comparaisons (% variation, ecart vs budget)
4. Ajoutez des **filtres** :
   - Par categorie de produit, par client, par fournisseur, par canal
5. Choisissez la **visualisation** : tableau, graphique en barres, courbe de tendance, camembert
6. **Sauvegardez** le rapport (reutilisable chaque mois)

### Exporter pour le comptable externe

**URL** : `/admin/comptabilite/exports`

| Format | Usage | Description |
|--------|-------|-------------|
| **CSV** | Universel | Compatible avec tout logiciel comptable |
| **Excel (.xlsx)** | Comptable | Fichier avec mise en forme et formules |
| **PDF** | Presentation | Version imprimable professionnelle |
| **Sage 50** | Logiciel Sage | Format IIF compatible Sage 50 |
| **QuickBooks** | Logiciel QuickBooks | Format IIF pour QuickBooks |

**Export annuel complet** :
1. Selectionnez **Export annuel complet**
2. Choisissez l'annee fiscale (2026)
3. Koraline genere un package contenant :
   - Grand livre complet de l'annee
   - Balance de verification au 31 decembre
   - Bilan de cloture
   - Etat des resultats annuel
   - Sommaire des taxes (TPS/TVQ collectees et payees)
   - Liste des immobilisations et amortissements
   - Anciennete des comptes clients et fournisseurs
4. Telechargez le package ZIP
5. Envoyez a votre comptable

### Planifier des rapports automatiques

1. Generez le rapport souhaite avec les bons parametres
2. Cliquez sur **Planifier l'envoi**
3. Configurez :
   - **Frequence** : hebdomadaire, mensuelle, trimestrielle
   - **Destinataires** : votre email, celui du comptable, de la direction
   - **Format** : PDF ou Excel
4. Le rapport sera genere et envoye automatiquement a la date prevue

---

## Pourquoi entrer ces donnees

### Chaque rapport a un public et un usage specifique

| Public | Rapport | Ce qu'il en fait |
|--------|---------|-----------------|
| **Proprietaire (Stephane)** | Etat des resultats mensuel, Budget vs reel | Prendre des decisions operationnelles |
| **Comptable externe** | Balance de verification, Grand livre, Export annuel | Preparer les etats financiers officiels et les declarations T2/CO-17 |
| **Banque** | Bilan, Ratios financiers | Evaluer la solvabilite pour le renouvellement de la marge de credit |
| **ARC / Revenu Quebec** | Sommaire des ventes taxables, Detail des intrants | Verifier la conformite des declarations TPS/TVQ |
| **Investisseurs** | Etat des resultats, Flux de tresorerie, Previsions | Evaluer le potentiel de retour sur investissement |
| **Direction interne** | Rentabilite par produit, Analyse des couts | Optimiser le mix produits et les depenses marketing |

### Les ratios financiers -- Ce qu'ils revelent

Koraline calcule automatiquement les ratios financiers cles :

#### Ratios de liquidite (payer les dettes a court terme)

| Ratio | Formule | BioCycle | Seuil sain | Ce que ca signifie |
|-------|---------|----------|-----------|-------------------|
| **Ratio courant** | Actifs courants / Passifs courants | 3,90 | > 1,5 | BioCycle peut payer ses dettes CT presque 4 fois. Excellent. |
| **Ratio rapide** | (Actifs courants - Stock) / Passifs courants | 2,75 | > 1,0 | Meme sans vendre le stock, BioCycle couvre ses dettes. Tres bon. |
| **Ratio de tresorerie** | Tresorerie / Passifs courants | 2,26 | > 0,5 | L'argent en banque seul couvre plus de 2 fois les dettes CT. |

#### Ratios de rentabilite (generer des profits)

| Ratio | Formule | BioCycle | Seuil sain | Ce que ca signifie |
|-------|---------|----------|-----------|-------------------|
| **Marge brute** | Benefice brut / Revenus | 67% | 50-70% e-com | Les peptides degagent une bonne marge. |
| **Marge nette** | Benefice net / Revenus | 20,8% | 10-20% | Chaque dollar de vente genere 0,21 $ de profit net. Excellent. |
| **ROE** | Benefice net / Capitaux propres | 21,5% | > 15% | Bon rendement pour les actionnaires. |
| **ROA** | Benefice net / Total actifs | 14,5% | > 10% | Les actifs sont utilises efficacement. |

#### Ratios d'endettement (structure financiere)

| Ratio | Formule | BioCycle | Seuil sain | Ce que ca signifie |
|-------|---------|----------|-----------|-------------------|
| **Endettement** | Passifs / Actifs | 32% | < 50% | Structure saine, peu de dette. |
| **Couverture interets** | Benefice exploitation / Interets | 140x | > 3x | Les profits couvrent largement les interets. |
| **Levier financier** | Actifs / Capitaux propres | 1,48 | < 2,5 | Faible recours a la dette. |

#### Ratios d'efficacite (gestion des operations)

| Ratio | Formule | BioCycle | Seuil sain | Ce que ca signifie |
|-------|---------|----------|-----------|-------------------|
| **Rotation des stocks** | CMV / Stock moyen | 11,3x/an | > 6x | Le stock se renouvelle environ chaque mois. Bon. |
| **Delai de recouvrement** | Comptes clients / (Revenus/365) | 35 jours | < 45j | Les clients paient en moyenne en 35 jours. Correct pour B2B. |
| **Delai de paiement** | Comptes fournisseurs / (CMV/365) | 40 jours | 30-45j | BioCycle paie ses fournisseurs en 40 jours. Normal. |

---

## Les rapports essentiels pour BioCycle

### 1. Rapport de cloture mensuelle (checklist)

Le rapport mensuel devrait inclure :
- Balance de verification (livres equilibres ?)
- Rapprochement bancaire (soldes concordent ?)
- Etat des resultats du mois (rentabilite ?)
- Comparaison avec le budget (ecarts ?)
- Anciennete des comptes clients (creances a risque ?)
- Anciennete des comptes fournisseurs (paiements a faire ?)

### 2. Rapport de preparation annuelle (pour le comptable)

Le package annuel devrait contenir :
- Grand livre complet (12 mois)
- Balance de verification au 31 decembre
- Bilan d'ouverture et de cloture
- Etat des resultats annuel
- Sommaire des taxes TPS/TVQ (4 trimestres)
- Liste des immobilisations avec amortissement
- Rapprochements bancaires des 12 mois
- Anciennete des comptes clients au 31 decembre
- Detail des provisions (creances douteuses, etc.)
- Releve des transactions intercompagnies ou actionnaires

### 3. Rapport pour la banque

La banque demande typiquement :
- Bilan date de moins de 3 mois
- Etat des resultats des 12 derniers mois
- Prevision de tresorerie sur 12 mois
- Ratios de liquidite et d'endettement
- Confirmation que les covenants sont respectes

---

## Workflows de cloture

### Cloture de fin de mois (checklist complete)

| # | Etape | Verification | Page Koraline |
|---|-------|-------------|---------------|
| 1 | Publier tous les brouillons | Aucun brouillon en attente | Ecritures |
| 2 | Saisir les ecritures recurrentes | Loyer, amortissement, assurance | Ecritures recurrentes |
| 3 | Saisir les ecritures d'ajustement | Provisions, charges a payer | Ecritures |
| 4 | Rapprocher les comptes bancaires | Soldes correspondent | Rapprochement |
| 5 | Verifier l'anciennete des comptes clients | Relancer les retards | Grand livre > Aging |
| 6 | Generer la balance de verification | Equilibree (debits = credits) | Grand livre |
| 7 | Generer le bilan | Actifs = Passifs + CP | Etats financiers |
| 8 | Generer l'etat des resultats | Analyser les marges | Etats financiers |
| 9 | Comparer avec le budget | Identifier les ecarts > 10% | Budget |
| 10 | Archiver les rapports | PDF + Excel dans le dossier du mois | Rapports > Exporter |

### Cloture de fin d'annee (etapes supplementaires)

| # | Etape | Detail |
|---|-------|--------|
| 1 | Completer la cloture de chaque mois (1-10 ci-dessus) | Les 12 mois doivent etre clos |
| 2 | Faire le decompte physique de l'inventaire | Comparer avec le stock comptable, passer les ajustements |
| 3 | Passer les ecritures de cloture | Fermer revenus et charges vers BNR |
| 4 | Generer l'export annuel complet | Package ZIP pour le comptable |
| 5 | Envoyer au comptable externe | Avec les pieces justificatives |
| 6 | Preparer les feuillets T4 et Releve 1 | Avant le 28 fevrier |
| 7 | Preparer les declarations T2 et CO-17 | Avant le 30 juin (si fin d'exercice dec.) |
| 8 | Ouvrir le nouvel exercice | Le bilan de cloture devient le bilan d'ouverture |

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Generer des rapports sans avoir termine le rapprochement | Les soldes bancaires sont faux, le bilan est inexact | Toujours rapprocher AVANT de generer les etats financiers |
| Ne pas comparer avec les periodes precedentes | Rater des anomalies et des tendances | Toujours activer le mode comparaison |
| Envoyer des rapports non verifies a la banque | Perte de credibilite, questions embarrassantes | Verifier la balance de verification et le rapprochement d'abord |
| Ne pas archiver les rapports mensuels | Impossible de retracer l'historique en cas de verification | Exporter en PDF chaque mois et archiver dans un dossier dedie |
| Ignorer les ratios financiers | Rater les signaux d'alerte (liquidite en baisse, endettement en hausse) | Consulter les ratios chaque trimestre, comparer avec les seuils |
| Exporter le mauvais format pour le comptable | Perte de temps, re-travail | Demander a votre comptable quel format il prefere |

---

## Quand faire cette operation

| Frequence | Rapports a generer |
|-----------|-------------------|
| **Mensuel** | Etat des resultats, bilan, balance de verification, budget vs reel, anciennete clients |
| **Trimestriel** | Rapport TPS/TVQ, flux de tresorerie, ratios financiers, rapport pour la banque |
| **Annuel** | Export annuel complet, rapports pour T2/CO-17, bilan d'ouverture du nouvel exercice |
| **Sur demande** | Rapports personnalises selon les besoins (rentabilite par produit, analyse de couts) |

---

## Questions frequentes (FAQ)

**Q : Quel rapport dois-je regarder en priorite ?**
R : L'etat des resultats mensuel. Il repond a la question la plus importante : "Est-ce que je fais de l'argent ce mois-ci ?" Ensuite, le rapport Budget vs Reel pour voir si vous etes sur la bonne voie.

**Q : Mon comptable utilise Sage -- peut-il importer mes donnees ?**
R : Oui. Utilisez l'export au format Sage dans la section Exports. Si votre comptable utilise un autre logiciel, l'export CSV est universel et peut etre importe dans n'importe quel systeme.

**Q : Puis-je generer des rapports pour une partie de l'entreprise ?**
R : Oui, avec les rapports personnalises. Filtrez par categorie de produit (peptides vs abonnements), par canal de vente (B2C vs B2B), ou par type de depense.

**Q : Les rapports sont-ils en temps reel ?**
R : Oui, ils refletent les dernieres ecritures publiees. Les brouillons ne sont pas inclus. Si vous publiez une ecriture et regenerez le rapport immediatement, le nouveau montant apparait.

**Q : Combien coute un comptable externe pour une entreprise comme BioCycle ?**
R : En moyenne au Quebec, un comptable CPA facture entre 5 000 $ et 15 000 $ par an pour la tenue de livres, les etats financiers et les declarations T2/CO-17. Avec Koraline qui automatise la saisie et genere les exports, la facture devrait etre vers le bas de cette fourchette.

**Q : L'etat des flux de tresorerie est-il genere automatiquement ?**
R : Oui. Koraline utilise la methode indirecte : il part du benefice net et ajuste pour les elements non monetaires (amortissement, variation des comptes clients/fournisseurs/stock) pour arriver aux flux de tresorerie reels.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Balance de verification** | Liste de tous les comptes avec leurs soldes pour verifier que le total des debits egalise le total des credits. Premier controle de qualite des livres. |
| **Flux de tresorerie** | Rapport montrant les mouvements reels d'argent, divise en trois sections : exploitation (operations), investissement (achats d'actifs) et financement (emprunts, remboursements). |
| **Methode indirecte** | Methode de presentation des flux de tresorerie qui part du benefice net et ajuste pour les elements non monetaires. Methode la plus courante. |
| **Ratio financier** | Indicateur calcule a partir des chiffres comptables pour evaluer la sante financiere. Exemples : liquidite, rentabilite, endettement. |
| **Covenant** | Clause dans un contrat de pret qui exige le maintien de certains ratios financiers (ex: ratio courant > 1,5). Le non-respect peut entrainer le rappel du pret. |
| **ROE** | Return on Equity. Rendement des capitaux propres. Benefice net / Capitaux propres. Mesure la rentabilite pour les actionnaires. |
| **ROA** | Return on Assets. Rendement des actifs. Benefice net / Total actifs. Mesure l'efficacite d'utilisation des actifs. |
| **Rotation des stocks** | Nombre de fois que le stock est renouvele dans l'annee. CMV / Stock moyen. Plus eleve = meilleure gestion. |
| **Delai de recouvrement** | Nombre moyen de jours pour encaisser une facture client. Comptes clients / (Revenus / 365). Plus bas = meilleure collecte. |
| **Export** | Extraction des donnees comptables dans un format externe (CSV, Excel, PDF, Sage, QuickBooks) pour utilisation par un comptable ou un logiciel tiers. |
| **Cloture** | Processus de finalisation d'une periode comptable. Inclut les ajustements, la verification et le verrouillage. Apres cloture, aucune modification n'est possible. |
| **NCECF** | Normes Comptables pour les Entreprises a Capital Ferme. Cadre comptable canadien pour les entreprises privees. Determine la presentation des etats financiers. |

---

## Pages reliees

- [Bilan](05-bilan.md) : Etat financier principal -- actifs, passifs, capitaux propres
- [Etat des resultats](06-resultats.md) : Etat financier principal -- revenus, charges, benefice
- [Grand livre](04-grand-livre.md) : Donnees source de tous les rapports
- [Budget](11-budget.md) : Previsions a comparer avec les resultats reels
- [Taxes TPS/TVQ](09-taxes.md) : Rapports fiscaux pour les declarations
- [Rapprochement](10-rapprochement.md) : Verification bancaire prealable aux rapports
