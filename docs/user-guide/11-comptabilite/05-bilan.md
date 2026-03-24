# Bilan (Balance Sheet)

> **Section**: Comptabilite > Etats financiers > Bilan
> **URL**: `/admin/comptabilite/etats-financiers`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~35 minutes

---

## Pourquoi cette page est importante

Le bilan est une **photographie de la sante financiere** de BioCycle Peptides a un moment precis. Il repond a trois questions fondamentales : que possede l'entreprise, que doit-elle, et combien vaut-elle nette ? C'est le document que les banques, les investisseurs et les gouvernements examinent en premier.

**Obligations legales** :
- Toute societe par actions au Canada doit produire un bilan annuel conforme aux NCECF (Normes Comptables pour les Entreprises a Capital Ferme) ou aux IFRS.
- Le bilan est un composant obligatoire de la declaration T2 (federal) et CO-17 (Quebec), rempli via les codes GIFI.
- La banque exige un bilan a jour pour tout renouvellement de marge de credit ou demande de pret.
- Les actionnaires ont un droit legal de recevoir les etats financiers annuels, dont le bilan.

**Impact concret** :
- Un bilan solide (actifs elevees, dettes faibles) facilite l'acces au financement bancaire.
- Un bilan faible (trop de dettes, pas assez de liquidites) peut entrainer le refus d'un pret ou le rappel d'une marge de credit.
- Les ratios calcules a partir du bilan (liquidite, endettement) sont utilises par les banques dans leurs decisions de credit.
- Le bilan d'ouverture de chaque annee est le bilan de cloture de l'annee precedente -- une erreur se propage d'annee en annee.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
[5. BILAN] ← VOUS ETES ICI (etat financier #1)
 ↓
 6. Etat des resultats (etat financier #2)
 ↓
 7-12. Factures, depenses, taxes, rapprochement, budget, rapports
```

Le bilan est l'etape 5 du cycle comptable. Il est genere automatiquement a partir du grand livre : les comptes d'actifs, de passifs et de capitaux propres sont regroupes et totalises. Le bilan ne peut etre produit que si la balance de verification (etape 4) est equilibree.

**Lien avec l'etat des resultats** : Le benefice net de l'etat des resultats (etape 6) se retrouve dans les Benefices Non Repartis (BNR) du bilan. Les deux etats financiers sont indissociables.

---

## Ordre des operations

1. **Toutes les ecritures du mois sont publiees** (pas de brouillons en attente)
2. **Les ecritures d'ajustement sont passees** (amortissement, provisions, charges a payer)
3. **Le rapprochement bancaire est termine** (le solde bancaire correspond au grand livre)
4. **La balance de verification est equilibree** (total debits = total credits)
5. **Generer le bilan** a la date souhaitee
6. **Verifier l'equation fondamentale** : Actifs = Passifs + Capitaux propres
7. **Comparer avec la periode precedente** pour detecter les anomalies
8. **Exporter** si necessaire (pour la banque, le comptable, les actionnaires)

---

## L'equation du bilan

```
ACTIFS = PASSIFS + CAPITAUX PROPRES
```

Cette equation est **toujours equilibree**. Si votre entreprise possede 200 000 $ d'actifs et doit 80 000 $, alors les capitaux propres sont de 120 000 $. C'est mathematique : tout ce que l'entreprise possede provient soit de la dette (passifs) soit des fonds propres (capitaux propres).

---

## Comment entrer les donnees

Le bilan est **genere automatiquement** -- vous n'entrez rien directement. Toutes les donnees proviennent du grand livre. Votre role est de vous assurer que les ecritures sous-jacentes sont correctes et completes.

### Generer le bilan

1. Ouvrez la page **Etats financiers** > onglet **Bilan**
2. Choisissez la **date** (ex: 31 mars 2026)
3. Le bilan se genere instantanement
4. Chaque montant est cliquable : cliquez pour voir le detail des transactions dans le grand livre

### Les controles disponibles

| Controle | Description | Quand l'utiliser |
|----------|-------------|------------------|
| **Date** | A quelle date generer le bilan | Par defaut aujourd'hui ; choisir la fin du mois ou de l'annee |
| **Comparaison** | Ajouter une deuxieme date | Pour voir l'evolution (mars vs decembre, par ex.) |
| **Format** | Detaille (tous les comptes) ou resume (sous-totaux) | Detaille pour l'analyse interne, resume pour la banque |
| **Exporter** | PDF, Excel, CSV | PDF pour la banque, Excel pour le comptable |

### Comparer deux periodes

1. Activez le mode **Comparaison**
2. Selectionnez la date de reference (31 mars 2026) et la date de comparaison (31 decembre 2025)
3. Le bilan affiche deux colonnes avec l'ecart en valeur et en pourcentage

### Explorer un poste

1. Cliquez sur n'importe quel montant du bilan (ex: "Comptes clients : 12 350 $")
2. Le grand livre s'ouvre filtre sur ce compte
3. Vous voyez toutes les transactions qui composent ce solde
4. Utile pour verifier un montant qui semble anormal

---

## Pourquoi entrer ces donnees (dans le grand livre)

Chaque poste du bilan a une raison d'etre et un impact fiscal ou managerial :

### Actifs courants (realises en moins de 12 mois)

| Poste | Ce que ca represente | Pourquoi c'est important |
|-------|---------------------|--------------------------|
| **Tresorerie** (1010, 1020) | Argent en banque en CAD et USD | Mesure la capacite a payer les obligations immediates. La banque le surveille pour la marge de credit. |
| **Comptes clients** (1100) | Factures B2B impayees | Argent gagne mais pas encore encaisse. Si trop eleve : clients lents a payer. Si negatif : erreur. |
| **Stock** (1200) | Peptides en inventaire + emballage | Argent immobilise dans l'inventaire. Trop eleve = capital bloque. Trop bas = risque de rupture. |
| **TPS/TVQ a recuperer** (1150, 1160) | Credits d'intrants non encore reclames | Argent que les gouvernements vous doivent. Se reclame a chaque declaration trimestrielle. |
| **Charges payees d'avance** (1300) | Assurance, abonnements payes en avance | Portion non consommee = actif. Se transforme en charge mois par mois. |

### Actifs non courants (a long terme)

| Poste | Ce que ca represente | Pourquoi c'est important |
|-------|---------------------|--------------------------|
| **Equipement** (1400) | Materiel de laboratoire (cout d'acquisition) | Immobilisation amortie sur sa duree de vie. Deductible fiscalement via la DPA. |
| **Mobilier** (1410) | Mobilier du bureau | Meme principe que l'equipement. |
| **Amortissement cumule** (1450, 1460) | Depreciation totale accumulee | Montant negatif qui reduit la valeur des actifs. Reflete l'usure des equipements. |

### Passifs courants (payables en moins de 12 mois)

| Poste | Ce que ca represente | Pourquoi c'est important |
|-------|---------------------|--------------------------|
| **Comptes fournisseurs** (2010) | Factures fournisseurs impayees | Dettes commerciales courantes. Si trop eleve : on retarde les paiements. |
| **TPS/TVQ a remettre** (2100, 2110) | Taxes collectees pour le gouvernement | Pas votre argent -- vous le gardez temporairement. A remettre a chaque declaration. |
| **Salaires a payer** (2200) | Paie du mois en cours pas encore versee | Se regle en debut du mois suivant. |
| **Retenues salariales** (2150) | Impots et cotisations retenus sur les paies | A remettre aux gouvernements dans les 15 jours. |

### Passifs non courants (a long terme)

| Poste | Ce que ca represente | Pourquoi c'est important |
|-------|---------------------|--------------------------|
| **Emprunt bancaire** (2500) | Dette a long terme envers la banque | La portion payable dans les 12 prochains mois va dans les passifs courants (2300). |

### Capitaux propres

| Poste | Ce que ca represente | Pourquoi c'est important |
|-------|---------------------|--------------------------|
| **Capital-actions** (3100) | Montant investi par les actionnaires | Ne change que si de nouvelles actions sont emises ou rachetees. |
| **BNR** (3200) | Profits accumules depuis la creation | Augmente chaque annee si l'entreprise est rentable. Diminue si dividendes verses ou pertes. |

---

## Lecture complete d'un bilan -- Exemple BioCycle

```
BILAN
BioCycle Peptides Inc.
Au 31 mars 2026

ACTIFS
  Actifs courants
    Tresorerie (banques)                         88 993 $
    Comptes clients                              12 350 $
    Provision pour creances douteuses              (500 $)
    Stocks                                       45 000 $
    TPS/TVQ a recuperer                           6 429 $
    Charges payees d'avance                       1 200 $
  Total actifs courants                         153 472 $

  Actifs non courants
    Equipement de laboratoire                    30 000 $
    Mobilier et equipement de bureau              5 000 $
    Materiel informatique                         3 000 $
    Amortissement cumule                        (8 000 $)
  Total actifs non courants                      30 000 $

TOTAL ACTIFS                                    183 472 $

PASSIFS
  Passifs courants
    Comptes fournisseurs                          8 200 $
    TPS a remettre                                6 410 $
    TVQ a remettre                               12 764 $
    Salaires et retenues a payer                  7 000 $
    Portion courante emprunt                      5 000 $
  Total passifs courants                         39 374 $

  Passifs non courants
    Emprunt bancaire (net de portion courante)   20 000 $
  Total passifs non courants                     20 000 $

TOTAL PASSIFS                                    59 374 $

CAPITAUX PROPRES
    Capital-actions                              50 000 $
    Benefices non repartis                       74 098 $
TOTAL CAPITAUX PROPRES                          124 098 $

TOTAL PASSIFS + CAPITAUX PROPRES                183 472 $
                                                ========
Verification : 183 472 $ = 183 472 $            EQUILIBRE
```

### Ce que revelent les ratios

| Ratio | Formule | Valeur BioCycle | Interpretation |
|-------|---------|-----------------|----------------|
| **Ratio de liquidite generale** | Actifs courants / Passifs courants | 153 472 / 39 374 = **3,90** | Excellent. L'entreprise peut payer ses dettes a court terme presque 4 fois. Sain si > 1,5 |
| **Ratio de liquidite rapide** | (Actifs courants - Stocks) / Passifs courants | 108 472 / 39 374 = **2,75** | Tres bon. Meme sans vendre de stock, l'entreprise peut payer ses dettes. Sain si > 1 |
| **Ratio d'endettement** | Total passifs / Total actifs | 59 374 / 183 472 = **32%** | Sain. Moins d'un tiers de l'entreprise est finance par la dette. Sain si < 50% |
| **Valeur comptable par action** | Capitaux propres / Nombre d'actions | Selon le capital emis | Mesure la valeur theorique d'une action de l'entreprise |

---

## Comprendre l'evolution du bilan dans le temps

### Comment le bilan evolue d'un mois a l'autre

Le bilan change chaque jour avec chaque transaction. Voici les mouvements typiques pour BioCycle :

| Transaction | Impact sur les actifs | Impact sur les passifs | Impact sur les capitaux propres |
|------------|----------------------|----------------------|-------------------------------|
| Vente de peptides (credit) | +Comptes clients | +TPS/TVQ a remettre | +BNR (via revenu) |
| Encaissement client | +Banque, -Clients | Aucun | Aucun |
| Achat fournisseur | +Stock, +TPS intrants | +Fournisseurs | Aucun |
| Paiement fournisseur | -Banque | -Fournisseurs | Aucun |
| Paiement salaires | -Banque | -Salaires a payer | -BNR (via charge) |
| Amortissement | -Amort. cumule (actif net baisse) | Aucun | -BNR (via charge) |
| Versement dividende | -Banque | Aucun | -BNR |
| Remboursement emprunt | -Banque | -Emprunt | Aucun |
| Provision creance douteuse | -Provision (actif net baisse) | Aucun | -BNR (via charge) |

### Le lien bilan -- etat des resultats

Le benefice net de l'etat des resultats se retrouve dans le BNR du bilan. Voici comment :

```
BNR au 1er janvier 2026 :                    47 458 $
+ Benefice net de l'annee 2026 :             460 000 $
- Dividendes verses en 2026 :              (100 000 $)
= BNR au 31 decembre 2026 :                 407 458 $
```

Si le BNR au bilan ne correspond pas au BNR d'ouverture + benefice net - dividendes, il y a une erreur.

### Les categories DPA pour BioCycle

Pour bien calculer l'amortissement au bilan, il faut connaitre les taux de DPA (Deduction pour Amortissement) par categorie :

| Categorie DPA | Description | Taux | Exemples BioCycle | Methode |
|---------------|-------------|------|-------------------|---------|
| Categorie 8 | Mobilier et equipement | 20% | Bureau, etageres, comptoirs | Degressif |
| Categorie 10 | Vehicules | 30% | Vehicule de livraison | Degressif |
| Categorie 12 | Logiciels | 100% | Licences logicielles | Immediat |
| Categorie 50 | Materiel informatique | 55% | Ordinateurs, serveurs | Degressif |
| Categorie 43 | Equipement de fabrication | 30% | Equipement de laboratoire | Degressif |

**Regle du demi-taux** : L'annee d'acquisition, vous ne pouvez deduire que la moitie du taux normal. Pour un ordinateur de 3 000 $ (categorie 50, taux 55%), la DPA de la premiere annee est : 3 000 x 55% x 50% = 825 $.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Generer le bilan sans avoir termine les ajustements | Amortissement manquant, provisions absentes, bilan incomplet | Suivre la checklist de cloture de mois AVANT de generer le bilan |
| Ne pas verifier l'equilibre | Si Actifs =/= Passifs + Capitaux propres, tout est faux | Toujours verifier la ligne d'equilibre en bas du bilan |
| Oublier de reclasser la portion courante de la dette | L'emprunt entier apparait dans les passifs non courants, faussant le ratio de liquidite | Chaque annee, reclasser la portion payable dans les 12 mois en passif courant |
| Ne pas provisionner les creances douteuses | Les comptes clients affichent un montant irrealiste | Revoir l'anciennete des comptes clients chaque mois et provisionner selon la politique |
| Comparer des bilans a des dates non comparables | Conclusions erronees (ex: comparer le 15 mars au 31 decembre) | Toujours comparer des dates de fin de mois ou de fin d'annee |
| Ne pas inclure les charges a payer | Le passif est sous-evalue, les capitaux propres sont surevalues | Passer les ecritures de charges a payer avant de generer le bilan |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Mensuelle** | Generer le bilan a la fin de chaque mois. Comparer avec le mois precedent. Verifier les ratios. |
| **Trimestrielle** | Bilan trimestriel pour la direction. Analyse approfondie des tendances. |
| **Annuelle** | Bilan de cloture au 31 decembre. Document officiel pour le comptable, la banque, l'ARC. |
| **Sur demande** | Quand la banque le demande, quand un investisseur le demande, quand un partenaire B2B le demande. |

---

## Questions frequentes (FAQ)

**Q : Le bilan est-il genere automatiquement ?**
R : Oui, a 100%. Il est calcule en temps reel a partir des ecritures du grand livre. Vous n'avez rien a saisir manuellement dans le bilan lui-meme. Votre travail est de vous assurer que les ecritures sous-jacentes sont correctes.

**Q : A quelle frequence dois-je regarder le bilan ?**
R : Au minimum chaque mois pour une entreprise en croissance comme BioCycle. Chaque trimestre au strict minimum.

**Q : Que signifie un bilan "non equilibre" ?**
R : C'est une erreur grave qui indique un probleme dans les ecritures. En pratique, avec Koraline, c'est quasi impossible car le systeme force l'equilibre a chaque ecriture. Si cela arrive, c'est probablement un probleme technique -- contactez le support.

**Q : Mon comptable me demande le "bilan d'ouverture" -- qu'est-ce que c'est ?**
R : C'est le bilan au tout premier jour de l'exercice comptable. Pour 2026, c'est le bilan au 1er janvier 2026, qui est identique au bilan de cloture du 31 decembre 2025.

**Q : Le bilan inclut-il les commandes en cours (non livrees) ?**
R : Non. Seules les transactions enregistrees dans les livres comptables apparaissent au bilan. Une commande non encore facturee n'y figure pas.

**Q : Que se passe-t-il si je verse des dividendes ?**
R : Les dividendes reduisent les BNR. L'ecriture est : Debit 3300 (Dividendes) / Credit 1010 (Banque). Les dividendes ne sont PAS une charge -- ils ne passent pas par l'etat des resultats.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Bilan** | Etat financier presentant les actifs, passifs et capitaux propres de l'entreprise a une date precise. Photographie de la situation financiere. |
| **Actifs courants** | Biens et droits convertibles en argent dans les 12 prochains mois (tresorerie, clients, stock, taxes recuperables). |
| **Actifs non courants** | Biens a long terme utilises dans les operations (equipement, mobilier, vehicules). Aussi appeles immobilisations. |
| **Passifs courants** | Dettes payables dans les 12 prochains mois (fournisseurs, taxes, salaires, portion courante emprunt). |
| **Passifs non courants** | Dettes a long terme (emprunt bancaire, hypotheque). |
| **Capitaux propres** | Valeur nette de l'entreprise = Actifs - Passifs. Comprend le capital investi et les profits accumules. |
| **BNR** | Benefices Non Repartis. Profits accumules depuis la creation de l'entreprise, moins les dividendes verses. |
| **Ratio de liquidite** | Actifs courants / Passifs courants. Mesure la capacite a payer les obligations a court terme. > 1,5 est sain. |
| **Ratio d'endettement** | Passifs / Actifs. Proportion de l'entreprise financee par la dette. < 50% est sain. |
| **Amortissement cumule** | Montant total de depreciation enregistre depuis l'acquisition d'un actif. C'est un contre-actif (solde crediteur) qui reduit la valeur brute. |
| **DPA** | Deduction Pour Amortissement. Taux fiscal etabli par l'ARC pour chaque categorie d'immobilisation. Determine le montant deductible annuellement. |

---

## Pages reliees

- [Etat des resultats](06-resultats.md) : L'autre etat financier principal (profits/pertes sur une periode)
- [Grand livre](04-grand-livre.md) : Detail des transactions qui composent chaque poste du bilan
- [Plan comptable](01-plan-comptable.md) : Structure des comptes d'actifs, passifs et capitaux propres
- [Budget](11-budget.md) : Previsions vs realite financiere
- [Rapports](12-rapports.md) : Ratios financiers et analyses derivees du bilan
