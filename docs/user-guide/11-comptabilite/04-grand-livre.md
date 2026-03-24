# Grand Livre et Balance de Verification

> **Section**: Comptabilite > Grand livre
> **URL**: `/admin/comptabilite/grand-livre`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~30 minutes

---

## Pourquoi cette page est importante

Le grand livre est le **coeur de votre systeme comptable**. C'est le registre qui regroupe toutes les transactions par compte, permettant de voir l'historique complet et le solde de chaque compte a tout moment. La balance de verification, derivee du grand livre, est le controle de qualite ultime : elle prouve que vos livres sont equilibres et que les etats financiers seront corrects.

**Obligations legales** :
- L'ARC considere le grand livre comme un document fondamental lors des verifications fiscales. Il doit etre disponible, complet et exact pour les 6 dernieres annees.
- La balance de verification est le point de depart que votre comptable utilise pour preparer les etats financiers annuels et les declarations T2/CO-17.
- En cas de litige ou de verification, la capacite de produire un grand livre detaille par compte est une obligation legale.

**Impact concret** : Si votre grand livre est desordonne ou incomplet, votre comptable devra passer des heures supplementaires (et vous facturer) pour reconstituer les informations. Si la balance de verification ne s'equilibre pas, les etats financiers ne peuvent pas etre produits et la declaration d'impots est impossible.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable (structure des comptes)
 ↓
 2. Journal general (enregistrement chronologique)
 ↓
 3. Ecritures de journal (debits et credits)
 ↓
[4. GRAND LIVRE ET BALANCE DE VERIFICATION] ← VOUS ETES ICI
 ↓
 5. Bilan (derive des comptes d'actifs, passifs, capitaux propres)
 ↓
 6. Etat des resultats (derive des comptes de revenus et charges)
 ↓
 7-12. Factures, depenses, taxes, rapprochement, budget, rapports
```

Le grand livre est l'etape 4 du cycle. Les ecritures de journal (etape 3) sont automatiquement reportees dans le grand livre, organisees par compte. La balance de verification est ensuite generee a partir du grand livre pour verifier l'equilibre avant de produire les etats financiers (etapes 5 et 6).

**Sequence critique** :
1. Toutes les ecritures du mois sont publiees (etape 3)
2. Le grand livre est a jour (automatique)
3. La balance de verification est generee et verifiee (etape 4)
4. Si equilibree : produire le bilan et l'etat des resultats (etapes 5-6)
5. Si desequilibree : trouver et corriger l'erreur AVANT de produire les etats financiers

---

## Ordre des operations

| Etape | Action | Quand |
|-------|--------|-------|
| 1 | S'assurer que toutes les ecritures du mois sont publiees (pas de brouillons oublies) | Fin de mois |
| 2 | Passer les ecritures d'ajustement (amortissement, provisions) | Fin de mois |
| 3 | Verifier le grand livre compte par compte pour les anomalies | Fin de mois |
| 4 | Generer la balance de verification | Fin de mois |
| 5 | Verifier que Total Debits = Total Credits | Fin de mois |
| 6 | Si desequilibre : investiguer et corriger | Immediat |
| 7 | Comparer avec le mois precedent pour detecter les anomalies | Fin de mois |
| 8 | Archiver la balance de verification | Fin de mois |

---

## Concepts fondamentaux

### Grand livre -- Le detail par compte

Pour chaque compte du plan comptable, le grand livre affiche toutes les transactions avec un solde cumulatif :

```
Compte : 1010 - Banque TD Operations
Periode : Mars 2026

Date       Reference     Description                      Debit       Credit      Solde
------------------------------------------------------------------------------------------
01/03      Solde ouverture                                                       82 450,00
03/03      PAY-0451      Paiement Stripe (CMD-0891)     2 345,67                84 795,67
05/03      DEP-0122      Loyer bureau mars                           2 000,00   82 795,67
05/03      DEP-0122b     TPS sur loyer                                 100,00   82 695,67
05/03      DEP-0122c     TVQ sur loyer                                 199,50   82 496,17
08/03      PAY-0452      Paiement Stripe (CMD-0892)     1 149,75                83 645,92
12/03      DEP-0123      Google Ads mars                             1 724,63   81 921,29
15/03      PAY-0453      Virement B2B Clinique Sante     4 598,50                86 519,79
20/03      SAL-0026      Paie employes mars                          8 500,00   78 019,79
25/03      DEP-0124      Fournisseur peptides bruts                  5 748,75   72 271,04
28/03      PAY-0454      Paiements Stripe multiples      8 234,15                80 505,19
31/03      FRB-0003      Frais bancaires TD                             12,50   80 492,69
                                                       ---------    ---------
           Total du mois                                16 328,07   18 285,38
31/03      Solde final                                                          80 492,69
```

### Balance de verification -- Le controle de sante

La balance de verification liste tous les comptes du plan comptable avec leur solde. C'est le test ultime de l'integrite de vos livres.

**Regle absolue** : Le total des soldes debiteurs doit EGALISER le total des soldes crediteurs. Si ce n'est pas le cas, il y a une erreur.

```
BALANCE DE VERIFICATION
BioCycle Peptides Inc.
Au 31 mars 2026

Compte                              Debit          Credit
----------------------------------------------------------
1010 - Banque TD Operations        80 492,69 $
1020 - Banque BMO USD               8 500,00 $
1100 - Comptes clients             12 350,00 $
1109 - Provision creances dout.                       500,00 $
1150 - TPS intrants                 2 150,00 $
1160 - TVQ intrants                 4 278,75 $
1201 - Stock peptides              42 000,00 $
1202 - Stock emballage              3 000,00 $
1400 - Equipement labo             30 000,00 $
1450 - Amort. cumule equip.                        6 500,00 $
1410 - Mobilier bureau              5 000,00 $
1460 - Amort. cumule mobilier                       1 500,00 $
2010 - Comptes fournisseurs                         8 200,00 $
2100 - TPS a remettre                               6 410,00 $
2110 - TVQ a remettre                              12 764,00 $
2200 - Salaires a payer                             3 500,00 $
2500 - Emprunt bancaire                            25 000,00 $
3100 - Capital-actions                             50 000,00 $
3200 - BNR                                         70 223,00 $
4010 - Ventes peptides                            128 200,00 $
4040 - Frais livraison factures                     3 200,00 $
5011 - Achats matieres premieres   32 000,00 $
5012 - Emballage                    4 500,00 $
5013 - Frais livraison sortants     5 800,00 $
5021 - Salaires                    28 000,00 $
5030 - Loyer                        3 500,00 $
5041 - Google Ads                   5 200,00 $
5042 - Facebook Ads                 3 000,00 $
5060 - Frais bancaires Stripe       3 845,00 $
5070 - Assurances                   1 200,00 $
5076 - Azure hebergement              350,00 $
5090 - Honoraires comptable         1 500,00 $
5200 - Amortissement                   800,00 $
5300 - Interets                        250,00 $
                                  -----------    -----------
TOTAL                             277 716,44 $   315 997,00 $
ECART                                              38 280,56 $
```

**Attention** : L'exemple ci-dessus montre un desequilibre volontaire pour illustrer. Dans Koraline, un tel desequilibre est quasi impossible car le systeme force l'equilibre a chaque ecriture. Un desequilibre indiquerait un probleme technique grave.

---

## Comment entrer les donnees

### Acceder au grand livre

1. Comptabilite > **Grand livre** dans le panneau lateral
2. URL directe : `/admin/comptabilite/grand-livre`

### Naviguer dans le grand livre par compte

| Etape | Action | Detail |
|-------|--------|--------|
| 1 | Selectionnez un compte dans le filtre ou l'arborescence | Exemple : "1010 - Banque TD" |
| 2 | Definissez la periode | Exemple : 1er mars au 31 mars 2026 |
| 3 | Les transactions s'affichent avec le solde cumulatif | Chaque ligne est cliquable |
| 4 | Cliquez sur une transaction pour voir le detail du journal | Voir les lignes debit/credit completes |

### Generer la balance de verification

| Etape | Action | Detail |
|-------|--------|--------|
| 1 | Selectionnez la periode souhaitee | Exemple : Mars 2026 ou Q1 2026 |
| 2 | Cliquez sur le mode **Balance de verification** | Bascule de la vue Grand livre a la vue Balance |
| 3 | Le rapport s'affiche avec tous les comptes et leurs soldes | Debiteurs a gauche, crediteurs a droite |
| 4 | Verifiez que les totaux sont equilibres | Ligne "Total" en bas -- les deux colonnes doivent etre identiques |
| 5 | Si desequilibre : le systeme met en surbrillance le probleme | Cliquez pour investiguer |

### Comparer deux periodes

| Etape | Action | Detail |
|-------|--------|--------|
| 1 | Selectionnez la premiere periode | Exemple : Mars 2026 |
| 2 | Activez le mode **Comparaison** | Bouton dans la barre de ruban |
| 3 | Selectionnez la deuxieme periode | Exemple : Fevrier 2026 |
| 4 | Le tableau affiche deux colonnes avec l'ecart en valeur et en pourcentage | Les variations significatives sont surlignees |

**Exemple de comparaison** :

| Compte | Mars 2026 | Fevrier 2026 | Ecart | % |
|--------|-----------|-------------|-------|---|
| 1010 - Banque | 80 493 $ | 82 450 $ | -1 957 $ | -2,4% |
| 1201 - Stock | 42 000 $ | 48 000 $ | -6 000 $ | -12,5% |
| 4010 - Ventes | 128 200 $ | 115 800 $ | +12 400 $ | +10,7% |
| 5041 - Google Ads | 5 200 $ | 4 800 $ | +400 $ | +8,3% |

Cette comparaison revele que les ventes sont en hausse de 10,7% tandis que le stock a diminue de 12,5% -- signe que les ventes depassent les reapprovisionnements. Il faut verifier si une commande fournisseur est en cours.

### Analyser l'anciennete des comptes (Aging)

**URL** : `/admin/comptabilite/aging`

L'analyse d'anciennete montre les soldes clients et fournisseurs par tranche d'age :

| Tranche | Clients (a recevoir) | Fournisseurs (a payer) |
|---------|---------------------|----------------------|
| 0-30 jours | 8 500 $ | 5 200 $ |
| 31-60 jours | 2 800 $ | 2 500 $ |
| 61-90 jours | 700 $ | 500 $ |
| 90+ jours | 350 $ | 0 $ |
| **Total** | **12 350 $** | **8 200 $** |

**Utilite** :
- Les 350 $ a 90+ jours chez les clients signalent un risque de creance douteuse -- il faut peut-etre provisionner.
- Les fournisseurs sont payes dans les 90 jours -- c'est correct pour la plupart des conditions de paiement.

---

## Pourquoi entrer ces donnees

### La balance de verification sert a 5 fins essentielles

1. **Detecter les erreurs** : Si les totaux ne s'equilibrent pas, une erreur d'ecriture s'est glissee quelque part.
2. **Preparer les etats financiers** : Le bilan et l'etat des resultats sont directement derives de la balance de verification.
3. **Preparer les declarations fiscales** : Le comptable utilise la balance pour remplir le T2 et le CO-17.
4. **Audit** : Les verificateurs (internes ou externes) commencent toujours par la balance de verification.
5. **Suivi de gestion** : La comparaison mensuelle des balances revele les tendances et les anomalies.

### Le grand livre sert a tracer chaque montant

Quand votre comptable ou l'ARC questionne un montant dans les etats financiers, le grand livre fournit la reponse : "Le poste Marketing de 8 200 $ est compose de 5 200 $ Google Ads + 3 000 $ Facebook Ads, voici les ecritures detaillees avec les pieces justificatives."

### L'anciennete sert a gerer le risque

L'analyse d'anciennete vous aide a :
- **Relancer les clients** qui tardent a payer (avant que la creance ne devienne irrecuperable)
- **Prioriser les paiements** fournisseurs (payer d'abord ceux qui sont proches de l'echeance ou qui offrent des escomptes)
- **Provisionner les creances douteuses** selon une politique claire (ex: 25% a 60 jours, 50% a 90 jours, 100% a 120+ jours)

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Ne pas generer la balance avant les etats financiers | Produire des etats financiers a partir de donnees desequilibrees | Toujours generer et verifier la balance AVANT bilan et resultats |
| Ignorer un petit ecart dans la balance | Les petits ecarts s'accumulent et deviennent des gros problemes en fin d'annee | Traiter chaque ecart immediatement, meme de 0,01 $ |
| Ne pas comparer avec le mois precedent | Rater des anomalies (compte qui double subitement, transaction en double) | Comparer systematiquement chaque mois avec le precedent |
| Ne pas regarder l'anciennete des comptes clients | Des creances deviennent irrecuperables sans qu'on s'en rende compte | Verifier l'anciennete chaque mois et relancer a 30 jours |
| Publier les brouillons en retard | La balance du mois est incomplete, les rapports sont faux | Publier tous les brouillons avant de generer la balance |
| Oublier les ecritures d'ajustement avant la balance | L'amortissement, les provisions et les charges a payer manquent | Passer les ajustements AVANT de generer la balance |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Hebdomadaire** | Consulter le grand livre du compte bancaire pour verifier les transactions recentes |
| **Fin de mois** | 1) Publier tous les brouillons. 2) Passer les ecritures d'ajustement. 3) Generer la balance de verification. 4) Verifier l'equilibre. 5) Comparer avec le mois precedent. |
| **Fin de trimestre** | Generer la balance de verification trimestrielle pour la declaration TPS/TVQ. Verifier l'anciennete clients et fournisseurs. |
| **Fin d'annee** | Generer la balance de verification annuelle. La remettre au comptable pour la preparation des etats financiers et de la declaration T2/CO-17. |

---

## Pages connexes du module

### Notes de credit (`/admin/comptabilite/notes-credit`)
- Creez des notes de credit pour les remboursements ou ajustements clients
- Chaque note de credit genere une ecriture dans le grand livre (inverse de la facture originale)

### Immobilisations (`/admin/comptabilite/immobilisations`)
- Registre des actifs a long terme (equipement de laboratoire, mobilier, materiel informatique)
- Calcul automatique de l'amortissement selon les taux de la DPA (deduction pour amortissement)
- Les ecritures d'amortissement periodiques apparaissent dans le grand livre

### Inventaire comptable (`/admin/comptabilite/inventaire`)
- Suivi de la valeur comptable du stock de peptides et d'emballage
- Methode du cout moyen pondere (obligatoire pour BioCycle)
- Les ajustements d'inventaire (casse, peremption, differences de decompte) generent des ecritures dans le grand livre

---

## Questions frequentes (FAQ)

**Q : Que faire si la balance de verification ne s'equilibre pas ?**
R : Avec Koraline, c'est extremement rare car le systeme force l'equilibre a chaque ecriture. Si cela arrive, verifiez d'abord les ecritures importees (CSV) ou les modifications manuelles de la base de donnees. Le systeme indique les ecritures desequilibrees en les surlignant en rouge.

**Q : A quelle frequence generer la balance de verification ?**
R : Au minimum chaque mois, apres le rapprochement bancaire et avant de generer les etats financiers. Idealement, generez-la aussi apres chaque lot important d'ecritures.

**Q : Quelle est la difference entre le grand livre et le bilan ?**
R : Le grand livre contient TOUTES les transactions en detail. Le bilan est un RESUME a une date donnee, montrant uniquement les totaux des actifs, passifs et capitaux propres. Le bilan est derive du grand livre.

**Q : Comment savoir si un solde est "normal" ?**
R : Chaque type de compte a un solde normal : les actifs et charges sont normalement debiteurs, les passifs, revenus et capitaux propres sont normalement crediteurs. Un solde anormal (ex: compte bancaire avec solde crediteur) indique generalement une erreur ou un decouvert.

**Q : Puis-je exporter le grand livre pour mon comptable ?**
R : Oui. Utilisez le bouton Exporter et choisissez le format Excel. Votre comptable l'utilisera pour preparer les etats financiers de fin d'annee et les declarations fiscales.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Grand livre** | Registre detaille de toutes les transactions financieres, organise par compte. Chaque compte montre ses debits, credits et solde cumulatif. |
| **Balance de verification** | Rapport de controle listant tous les comptes avec leurs soldes debiteurs et crediteurs. Le total des deux colonnes doit etre identique. |
| **Solde debiteur** | Quand la somme des debits depasse la somme des credits dans un compte. Normal pour les actifs et les charges. |
| **Solde crediteur** | Quand la somme des credits depasse la somme des debits dans un compte. Normal pour les passifs, les revenus et les capitaux propres. |
| **Aging (anciennete)** | Analyse qui classe les soldes clients ou fournisseurs par tranche d'age (0-30 jours, 31-60, 61-90, 90+). Outil de gestion du risque de credit. |
| **Note de credit** | Document comptable qui reduit le montant du a un fournisseur ou par un client. Inverse d'une facture. |
| **Immobilisation** | Actif a long terme (equipement, mobilier, vehicule, logiciel) dont le cout est reparti sur sa duree de vie utile par l'amortissement. |
| **DPA** | Deduction pour amortissement. Taux fiscal fixe par l'ARC pour chaque categorie d'actif (ex: materiel informatique = 55%/an degressif). |
| **Cout moyen pondere** | Methode de valorisation de l'inventaire qui calcule le cout moyen de toutes les unites en stock apres chaque achat. |
| **Solde d'ouverture** | Solde d'un compte au debut d'une periode. C'est le solde de cloture de la periode precedente. |

---

## Pages reliees

- [Plan comptable](01-plan-comptable.md) : Structure des comptes qui composent le grand livre
- [Ecritures](03-ecritures.md) : Saisie des transactions qui alimentent le grand livre
- [Bilan](05-bilan.md) : Etat financier derive des comptes d'actifs, passifs et capitaux propres du grand livre
- [Etat des resultats](06-resultats.md) : Etat financier derive des comptes de revenus et charges du grand livre
- [Rapprochement](10-rapprochement.md) : Verification du grand livre contre le releve bancaire
- [Rapports](12-rapports.md) : Rapports financiers generes a partir du grand livre
