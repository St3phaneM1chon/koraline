# Taxes TPS/TVQ et Declarations Fiscales

> **Section**: Comptabilite > Conformite > Declaration TPS/TVQ
> **URL**: `/admin/comptabilite/declaration-tps-tvq`, `/admin/fiscal`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~45 minutes

---

## Pourquoi cette page est importante

La conformite fiscale en matiere de TPS/TVQ est **l'obligation legale la plus critique** pour BioCycle Peptides. Vous agissez comme agent de perception pour les gouvernements : vous collectez les taxes sur vos ventes et vous les remettez. En contrepartie, vous pouvez recuperer les taxes payees sur vos achats. Un seul trimestre de retard ou une erreur de calcul peut entrainer des penalites, des interets et meme une verification fiscale.

**Obligations legales** :
- Toute entreprise dont le chiffre d'affaires depasse 30 000 $ sur 4 trimestres consecutifs DOIT s'inscrire aux fichiers de la TPS et de la TVQ et percevoir les taxes.
- Les taxes percues sur les ventes ne vous appartiennent PAS -- vous les gardez en fiducie pour les gouvernements.
- Les declarations doivent etre produites et les montants remis aux dates limites, sous peine de penalites de 1% par mois de retard + interets composes.
- L'ARC et Revenu Quebec peuvent effectuer des verifications a tout moment. Vous devez pouvoir justifier chaque montant declare avec des pieces justificatives pendant 6 ans.
- Le defaut de percevoir les taxes est une infraction qui peut entrainer des penalites egales au montant de la taxe non percue.

**Impact financier concret** :
- Sur 128 200 $ de ventes mensuelles, BioCycle collecte environ 19 188 $ de taxes (6 410 $ TPS + 12 778 $ TVQ). C'est de l'argent que vous gardez temporairement mais que vous devez absolument remettre.
- En contrepartie, sur environ 42 000 $ d'achats mensuels, BioCycle recupere environ 6 289 $ de credits (2 100 $ CTI + 4 189 $ RTI).
- Le montant net a remettre chaque trimestre est d'environ 38 697 $ (TPS nette + TVQ nette). Un retard genere des penalites et interets significatifs.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7. Factures (source des taxes collectees)
 ↓
 8. Depenses (source des credits d'intrants)
 ↓
[9. TAXES TPS/TVQ] ← VOUS ETES ICI (declaration et remise)
 ↓
10. Rapprochement bancaire
 ↓
11. Budget → 12. Rapports
```

Les taxes sont alimentees par deux sources :
1. **Les factures clients** (etape 7) generent les taxes collectees (TPS et TVQ a remettre)
2. **Les depenses et factures fournisseurs** (etape 8) generent les credits d'intrants (CTI et RTI)

La declaration de taxes est le calcul net : taxes collectees - credits d'intrants = montant a remettre (ou remboursement si les credits depassent la collecte).

---

## Ordre des operations

### Avant chaque declaration (mensuelle ou trimestrielle)

| Etape | Action | Pourquoi |
|-------|--------|---------|
| 1 | Verifier que toutes les factures clients de la periode sont publiees | Sinon, les taxes collectees seront sous-declarees |
| 2 | Verifier que toutes les factures fournisseurs et depenses sont saisies | Sinon, les CTI/RTI seront sous-reclames (vous payez trop) |
| 3 | Verifier que les pieces justificatives sont jointes a chaque depense | Sans piece, le CTI/RTI peut etre refuse |
| 4 | Generer le rapport de declaration dans Koraline | Calcul automatique du montant net |
| 5 | Verifier les chiffres (comparer avec le trimestre precedent) | Detecter les anomalies |
| 6 | Exporter le rapport pour votre comptable (si applicable) | Validation professionnelle |
| 7 | Soumettre la declaration en ligne (ARC + Revenu Quebec) | Obligation legale |
| 8 | Effectuer le paiement du montant du | Avant la date limite |
| 9 | Enregistrer le paiement dans Koraline | Pour que les comptes de taxes soient a jour |

---

## Le systeme de taxes au Quebec -- Explication complete

### Les deux taxes

| Taxe | Nom complet | Taux | Percepteur | Formulaire |
|------|-------------|------|------------|------------|
| **TPS** | Taxe sur les Produits et Services | **5%** | ARC (federal) | GST34 / FP-500 |
| **TVQ** | Taxe de Vente du Quebec | **9,975%** | Revenu Quebec | VD-400 |

**Total combine** : 14,975% (pas 15% -- c'est une erreur courante)

### Calcul detaille sur une transaction

Prenons une vente de peptides a 1 000 $ :

```
Prix de vente HT :                     1 000,00 $
TPS (5% x 1 000,00) :                     50,00 $
TVQ (9,975% x 1 000,00) :                 99,75 $
                                       ---------
Total TTC :                            1 149,75 $
```

**Point critique** : La TVQ se calcule sur le montant avant TPS (1 000 $), PAS sur le montant incluant la TPS. C'est une erreur extremement courante. Depuis 2013, la TVQ ne se calcule plus sur le montant incluant la TPS.

### Les 4 comptes de taxes dans le plan comptable

| Compte | Nom | Type | Solde normal | Role |
|--------|-----|------|-------------|------|
| **1150** | TPS payee sur achats | Actif | Debiteur | Taxes federales recuperables (CTI) |
| **1160** | TVQ payee sur achats | Actif | Debiteur | Taxes provinciales recuperables (RTI) |
| **2100** | TPS a remettre | Passif | Crediteur | Taxes federales collectees sur les ventes |
| **2110** | TVQ a remettre | Passif | Crediteur | Taxes provinciales collectees sur les ventes |

### Comment ca fonctionne -- Le cycle complet

**1. Vous VENDEZ un produit (100 $ + taxes)**

```
Le client vous paie 114,975 $
Dont 5 $ de TPS → va dans le compte 2100 (TPS a remettre) -- passif
Dont 9,975 $ de TVQ → va dans le compte 2110 (TVQ a remettre) -- passif
```

**2. Vous ACHETEZ un service (200 $ + taxes)**

```
Vous payez 229,95 $
Dont 10 $ de TPS → va dans le compte 1150 (TPS intrants) -- actif
Dont 19,95 $ de TVQ → va dans le compte 1160 (TVQ intrants) -- actif
```

**3. A la DECLARATION, vous faites le calcul net**

```
TPS a remettre :    5,00 $  (compte 2100)
- TPS recuperable : 10,00 $  (compte 1150)
= TPS nette :      (5,00 $) ← L'ARC vous doit 5 $ (remboursement)

TVQ a remettre :    9,975 $  (compte 2110)
- TVQ recuperable : 19,95 $  (compte 1160)
= TVQ nette :      (9,975 $) ← Revenu Quebec vous doit 9,975 $ (remboursement)
```

**4. Vous RECEVEZ un remboursement ou PAYEZ le montant du**

Si le montant net est positif : vous devez de l'argent au gouvernement → payez avant l'echeance.
Si le montant net est negatif : le gouvernement vous doit un remboursement → il sera verse dans 4 a 8 semaines.

---

## Comment entrer les donnees

### Acceder a la page des declarations

| Page | URL | Description |
|------|-----|-------------|
| **Declaration TPS/TVQ** | `/admin/comptabilite/declaration-tps-tvq` | Calcul et preparation |
| **Gestion fiscale** | `/admin/fiscal` | Vue d'ensemble fiscale |
| **Rapports fiscaux** | `/admin/fiscal/reports` | Rapports detailles |
| **Calendrier fiscal** | `/admin/comptabilite/calendrier-fiscal` | Dates limites |

### Calculer la declaration

1. Selectionnez la **periode de declaration** (trimestre ou mois)
2. Le systeme calcule automatiquement :

| Element | Source | Trimestre Q1 2026 |
|---------|--------|-------------------|
| TPS collectee sur ventes | Factures clients publiees | 6 410,00 $ |
| TPS sur credits d'intrants | Factures fournisseurs + depenses | (2 150,00 $) |
| **TPS nette a remettre** | | **4 260,00 $** |
| TVQ collectee sur ventes | Factures clients publiees | 12 764,00 $ |
| TVQ sur credits d'intrants | Factures fournisseurs + depenses | (4 278,75 $) |
| **TVQ nette a remettre** | | **8 485,25 $** |
| **TOTAL a remettre** | | **12 745,25 $** |

3. Verifiez les chiffres en cliquant sur chaque montant pour voir le detail
4. Cliquez sur **Preparer la declaration**

### Verifier les details -- Etape critique

**Avant de soumettre, verifiez** :

| Verification | Comment | Quoi chercher |
|-------------|---------|--------------|
| Toutes les ventes sont incluses | Cliquez sur "TPS collectee" → voir la liste | Aucune facture du trimestre ne doit manquer |
| Tous les credits sont reclames | Cliquez sur "TPS intrants" → voir la liste | Chaque depense taxable doit avoir un CTI/RTI |
| Pas de doublons | Comparer avec le trimestre precedent | Un montant inhabituellement eleve peut indiquer un doublon |
| Les montants sont logiques | Comparer TPS collectee / TVQ collectee (ratio ~1:2) | Le ratio TPS:TVQ devrait etre constant (5:9,975) |
| Les exclusions sont correctes | Verifier que les ventes detaxees (export) sont bien a 0% | Les ventes a l'etranger ne doivent pas avoir de TPS/TVQ |

### Exporter pour le comptable

1. Cliquez sur **Exporter**
2. Choisissez le format :
   - **PDF resume** : tableau de synthese (pour votre dossier)
   - **Excel detaille** : toutes les transactions avec taxes (pour le comptable)
   - **Format ARC** : compatible avec les systemes de l'ARC (Mon dossier d'entreprise)
3. Envoyez a votre comptable pour validation

### Soumettre la declaration

Koraline **prepare** les chiffres mais ne soumet pas directement aux gouvernements. La soumission se fait sur :

| Gouvernement | Portail | URL |
|-------------|---------|-----|
| **ARC (federal)** | Mon dossier d'entreprise | `https://www.canada.ca/fr/agence-revenu/services/services-electroniques/services-electroniques-entreprises/mon-dossier-entreprise.html` |
| **Revenu Quebec** | Mon dossier pour les entreprises | `https://www.revenuquebec.ca/fr/services-en-ligne/mon-dossier/` |

### Enregistrer le paiement de la declaration

Apres avoir soumis et paye, enregistrez dans Koraline :

```
Ecriture pour le paiement de la TPS nette (4 260 $) :
Debit  2100 - TPS a remettre         6 410,00 $
Credit 1150 - TPS intrants                         2 150,00 $
Credit 1010 - Banque TD                             4 260,00 $

Ecriture pour le paiement de la TVQ nette (8 485,25 $) :
Debit  2110 - TVQ a remettre        12 764,00 $
Credit 1160 - TVQ intrants                         4 278,75 $
Credit 1010 - Banque TD                             8 485,25 $
```

Ces ecritures remettent les comptes de taxes a zero pour la nouvelle periode.

---

## Pourquoi entrer ces donnees

### Chaque chiffre de la declaration a des consequences legales

| Chiffre | Si trop haut (surdeclare) | Si trop bas (sous-declare) |
|---------|--------------------------|---------------------------|
| **TPS/TVQ collectee** | Vous payez plus que du | L'ARC peut imposer des penalites + interets + verif |
| **Credits d'intrants (CTI/RTI)** | L'ARC peut refuser les credits excessifs et imposer des penalites | Vous payez plus de taxes que necessaire |
| **Total a remettre** | Paiement en trop (remboursable mais immobilise votre tresorerie) | Retard de paiement = 1%/mois de penalite + interets |

### Les credits d'intrants -- Ne laissez pas d'argent sur la table

Les CTI/RTI sont un droit, pas un privilege. Voici les erreurs qui font perdre des credits :

| Erreur | Argent perdu | Solution |
|--------|-------------|---------|
| Depense sans recu | 14,975% du montant HT | Scanner tous les recus immediatement |
| Depense sans numero TPS/TVQ du fournisseur | Tout le CTI/RTI de cette facture | Verifier que chaque fournisseur a un numero valide |
| Depense classee comme exempte par erreur | Le CTI/RTI n'est pas calcule | Verifier la categorie de chaque depense |
| Credit d'intrant non reclame | Le credit est perdu apres 4 ans (TPS) ou 4 ans (TVQ) | Reclamer systematiquement a chaque declaration |
| Repas a 100% au lieu de 50% | L'ARC desavoue 50% du credit | Utiliser la categorie "Repas d'affaires" (automatiquement limite a 50%) |

---

## Frequence de declaration

### Comment determiner votre frequence

L'ARC et Revenu Quebec assignent la frequence selon le chiffre d'affaires annuel de l'entreprise :

| Chiffre d'affaires annuel | Frequence TPS | Frequence TVQ |
|---------------------------|--------------|--------------|
| Moins de 1 500 000 $ | Annuelle (option trimestrielle) | Annuelle (option trimestrielle) |
| 1 500 000 $ a 6 000 000 $ | Trimestrielle | Trimestrielle |
| Plus de 6 000 000 $ | Mensuelle | Mensuelle |

**BioCycle Peptides** avec un CA projete d'environ 1 440 000 $ est en declaration **trimestrielle** (ou peut choisir cette option meme si le CA est sous 1,5M$). La declaration trimestrielle est recommandee car elle :
- Regularise les paiements (pas de gros montant en une fois)
- Accelere les remboursements si les credits depassent la collecte
- Simplifie le suivi (4 declarations au lieu de 12)

### Dates limites des declarations trimestrielles

| Trimestre | Periode | Date limite declaration | Date limite paiement |
|-----------|---------|------------------------|----------------------|
| **Q1** | Janvier - Mars | 30 avril | 30 avril |
| **Q2** | Avril - Juin | 31 juillet | 31 juillet |
| **Q3** | Juillet - Septembre | 31 octobre | 31 octobre |
| **Q4** | Octobre - Decembre | 31 janvier | 31 janvier |

**Attention** : La date limite de la declaration ET du paiement est la meme. Un paiement recu apres cette date genere des penalites et interets.

### Penalites de retard

| Situation | Penalite |
|-----------|---------|
| Declaration en retard | 1% du montant du + 0,25% par mois de retard supplementaire (max 12 mois) |
| Paiement en retard | Interets composes quotidiens au taux prescrit (actuellement ~6-8% annuel) |
| Non-inscription aux fichiers TPS/TVQ | Penalite egale au montant de la taxe non percue |
| Declaration fausse ou trompeuse | Penalite de 50% du montant sous-declare + interets |

---

## Cas particuliers

### Ventes interprovinciales (hors Quebec)

Si BioCycle vend a un client en Ontario ou dans une autre province :

| Province du client | TPS | TVQ | TVH |
|-------------------|-----|-----|-----|
| Quebec | 5% | 9,975% | N/A |
| Ontario | N/A | N/A | 13% (TVH) |
| Colombie-Britannique | 5% (TPS) | N/A | + 7% PST (par le client) |
| Alberta | 5% (TPS) | N/A | Pas de taxe provinciale |
| Nouveau-Brunswick | N/A | N/A | 15% (TVH) |

Koraline gere automatiquement le taux applicable selon l'adresse de livraison du client.

### Ventes internationales (hors Canada)

Les ventes a l'etranger (USA, Europe, etc.) sont **detaxees** (taux de 0%) :
- Pas de TPS, pas de TVQ
- Le client ne paie que le prix HT
- **Les credits d'intrants restent reclamables** -- c'est un avantage majeur de l'exportation

### Fournitures detaxees vs exemptes -- Distinction critique

| Categorie | Taux de taxe | CTI/RTI reclamables ? | Exemples |
|-----------|-------------|----------------------|----------|
| **Taxable** | 5% TPS + 9,975% TVQ | Oui | La plupart des biens et services, peptides |
| **Detaxe** | 0% | **Oui** | Exportations, produits alimentaires de base, medicaments sur ordonnance |
| **Exempte** | 0% | **Non** | Services financiers, assurances, services de sante, loyer residentiel |

**La difference est cruciale** : Si un produit est detaxe, vous ne facturez pas de taxes MAIS vous pouvez quand meme reclamer les CTI/RTI sur vos achats. Si un produit est exempte, vous ne facturez pas de taxes ET vous ne pouvez PAS reclamer les CTI/RTI proportionnels.

### Classification des peptides

Le statut fiscal des peptides depends de leur classification :
- **Supplements alimentaires** : Taxable (TPS + TVQ)
- **Produits de sante naturels (NPN)** : Detaxe si homologue par Sante Canada
- **Medicaments sur ordonnance** : Detaxe

**Consultez votre comptable** pour confirmer la classification exacte de chaque produit. Une mauvaise classification peut entrainer des penalites retroactives.

### Methode rapide (optionnelle pour les PME)

L'ARC offre une methode simplifiee pour les entreprises dont le CA est inferieur a 400 000 $ :
- Vous remettez un pourcentage fixe de vos ventes TTC au lieu du calcul detaille
- Le taux fixe est inferieur au taux reel, ce qui peut generer des economies
- Vous ne calculez pas les CTI/RTI individuellement

**Pour BioCycle** (CA > 400 000 $) : La methode rapide n'est probablement pas applicable. Mais consultez votre comptable si le CA est pres du seuil.

---

## Cloture de periode fiscale

**URL** : `/admin/comptabilite/cloture`

Apres avoir soumis la declaration et paye le montant du :

1. Verifiez que toutes les ecritures de la periode sont publiees
2. Verifiez que le rapprochement bancaire est termine
3. Cliquez sur **Cloturer la periode**
4. La periode est verrouilllee : plus aucune ecriture ne peut etre ajoutee ou modifiee

**Attention** : La cloture est irreversible. En cas d'erreur decouverte apres la cloture, vous devrez passer une ecriture de correction dans la periode suivante ET produire une declaration modifiee.

---

## Le calendrier fiscal complet de BioCycle

### Declarations TPS/TVQ (trimestrielles)

| Date | Action |
|------|--------|
| 30 avril | Declaration et paiement Q1 (jan-mar) |
| 31 juillet | Declaration et paiement Q2 (avr-jun) |
| 31 octobre | Declaration et paiement Q3 (jul-sep) |
| 31 janvier | Declaration et paiement Q4 (oct-dec) |

### Declarations annuelles

| Date | Action |
|------|--------|
| 30 juin (annee+1) | Declaration T2 (impot federal societes) si fin d'exercice le 31 decembre |
| 30 juin (annee+1) | Declaration CO-17 (impot provincial societes) |
| Dernier jour de fevrier | T4 (feuillets d'emploi) et Releve 1 (Quebec) pour les employes |
| 28 fevrier | Sommaire des retenues a la source |

### Acomptes provisionnels (si applicable)

Si BioCycle doit plus de 3 000 $ d'impots federal ou plus de 1 800 $ d'impots provincial, des acomptes trimestriels sont exiges :

| Date | Acompte |
|------|---------|
| 15 mars | 1er acompte |
| 15 juin | 2e acompte |
| 15 septembre | 3e acompte |
| 15 decembre | 4e acompte |

---

## Credits et programmes speciaux

### RS&DE (Recherche Scientifique et Developpement Experimental)

**URL** : `/admin/comptabilite/rsde`

Si BioCycle fait de la recherche sur les peptides, les depenses de R&D peuvent etre admissibles au programme RS&DE :

| Element | Detail |
|---------|--------|
| **Credit federal** | 35% des depenses admissibles (SPCC, premiers 3M$) |
| **Credit provincial (Quebec)** | 14% a 30% selon la taille de l'entreprise |
| **Depenses admissibles** | Salaires chercheurs, matieres consommees en R&D, contrats de recherche |
| **Non admissible** | Marketing, ventes, administration, acquisition de technologies existantes |

Ce credit peut representer un montant significatif. Consultez un specialiste RS&DE.

### CDAE (Credit d'impot pour le developpement des affaires electroniques)

Si BioCycle developpe des logiciels (Koraline est un logiciel), certains salaires peuvent etre admissibles au CDAE du Quebec :
- 24% des salaires admissibles (devs, designers, analystes)
- Maximum de 25 000 $ par employe admissible
- Combine avec le RS&DE si applicable

---

## Verification avant soumission -- Checklist complete

Avant de soumettre votre declaration TPS/TVQ, passez en revue cette checklist :

| # | Verification | Comment | Fait ? |
|---|-------------|---------|--------|
| 1 | Toutes les factures clients du trimestre sont publiees | Ecritures > filtre "Brouillon" = 0 | [ ] |
| 2 | Toutes les factures fournisseurs sont saisies | Comparer avec le releve bancaire | [ ] |
| 3 | Toutes les depenses sont saisies avec pieces jointes | Depenses > filtre "Sans recu" = 0 | [ ] |
| 4 | Les ventes detaxees sont bien a 0% | Verifier les ventes a l'etranger | [ ] |
| 5 | Les services exemptes n'ont pas de CTI/RTI | Frais bancaires, assurances = 0% | [ ] |
| 6 | Les repas sont a 50% | Categorie "Repas d'affaires" correcte | [ ] |
| 7 | Le ratio TPS:TVQ est coherent (~1:2) | TPS / TVQ devrait etre ~0,501 | [ ] |
| 8 | Les montants sont logiques vs trimestre precedent | Pas de variation > 30% inexpliquee | [ ] |
| 9 | Les numeros TPS/TVQ des fournisseurs sont valides | Verifier sur le site de l'ARC si nouveau fournisseur | [ ] |
| 10 | Le rapprochement bancaire du trimestre est fait | Les montants correspondent au releve | [ ] |

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Calculer la TVQ sur le montant incluant la TPS | TVQ surevaluee, vous collectez trop, le client paie trop | Depuis 2013 : TVQ = 9,975% x montant HT (pas x montant avec TPS) |
| Oublier de saisir une facture fournisseur | CTI/RTI non reclames, vous payez 14,975% de trop | Saisir les factures fournisseurs des leur reception |
| Declarer en retard | 1% penalite + 0,25%/mois + interets composes | Mettre les dates limites dans le calendrier avec rappels |
| Ne pas conserver les pieces justificatives | CTI/RTI refuses lors de verification | Scanner et joindre tous les recus dans Koraline |
| Reclamer des CTI sur des services exemptes | Credits refuses + penalites | Les frais bancaires et l'assurance sont exemptes : pas de CTI/RTI |
| Ne pas distinguer detaxe et exempte | Perte de CTI/RTI sur les produits exemptes vs conservation des CTI/RTI sur les produits detaxes | Utiliser les bonnes categories dans Koraline |
| Oublier de declarer les ventes interprovinciales | Sous-declaration, penalites | Configurer les taux par province dans Koraline |
| Reclamer les repas a 100% | CTI/RTI excessifs, 50% sera refuse par l'ARC | Utiliser la categorie "Repas d'affaires" (limite auto a 50%) |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Quotidien** | Saisir les depenses avec les taxes correctes |
| **Hebdomadaire** | Verifier que les factures fournisseurs sont saisies avec les CTI/RTI |
| **Mensuel** | Verifier les comptes de taxes (2100, 2110, 1150, 1160) dans le grand livre |
| **Trimestriel** | Preparer la declaration, verifier les details, soumettre et payer |
| **Annuel** | Revue annuelle avec le comptable, verifier les credits speciaux (RS&DE, CDAE) |

---

## Questions frequentes (FAQ)

**Q : Koraline fait-il la declaration TPS/TVQ directement avec l'ARC et Revenu Quebec ?**
R : Non. Koraline prepare les chiffres et genere les rapports. La soumission se fait sur les portails en ligne de l'ARC (Mon dossier d'entreprise) et de Revenu Quebec (Mon dossier pour les entreprises). Votre comptable peut aussi la soumettre pour vous.

**Q : Que se passe-t-il si je declare en retard ?**
R : Des penalites et des interets s'appliquent immediatement. La penalite de base est de 1% du montant du, plus 0,25% par mois de retard supplementaire, jusqu'a un maximum de 12 mois. Les interets composes s'ajoutent au taux prescrit par l'ARC.

**Q : Les ventes Stripe sont-elles automatiquement incluses dans la declaration ?**
R : Oui. Chaque vente en ligne qui genere une facture avec TPS/TVQ est automatiquement incluse dans le calcul de la declaration. Verifiez quand meme le total pour vous assurer que rien ne manque.

**Q : Comment recuperer les credits d'intrants si je n'ai pas de recu ?**
R : Vous ne pouvez pas. L'ARC exige des pieces justificatives conformes pour tout CTI/RTI. Sans recu avec le numero de TPS/TVQ du fournisseur, le credit sera refuse lors d'une verification. Conservez toujours vos recus -- la version numerique est acceptee.

**Q : Puis-je reclamer des CTI/RTI sur des achats personnels ?**
R : Non. Seules les depenses engagees pour gagner un revenu d'entreprise sont admissibles. Les achats personnels payes avec la carte d'entreprise doivent etre enregistres comme "Avance a l'actionnaire" et ne generent aucun credit.

**Q : Que se passe-t-il si mes credits depassent mes taxes collectees ?**
R : Vous avez droit a un remboursement. C'est courant en periode d'investissement (beaucoup d'achats, peu de ventes). Le remboursement est generalement verse en 4 a 8 semaines. La declaration trimestrielle accelere ce processus.

**Q : Le RS&DE (credit de recherche et developpement) est-il gere dans Koraline ?**
R : Oui, la page `/admin/comptabilite/rsde` aide a identifier les depenses admissibles au programme RS&DE. Cependant, la preparation de la demande RS&DE est complexe et devrait etre confiee a un specialiste.

**Q : Dois-je facturer des taxes sur les ventes aux USA ?**
R : Non. Les ventes a l'etranger sont detaxees (0%). Vous ne facturez ni TPS ni TVQ. Mais vous conservez le droit de reclamer les CTI/RTI sur vos achats.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **TPS** | Taxe sur les Produits et Services. Taxe federale de 5% percue par l'ARC sur la plupart des biens et services au Canada. |
| **TVQ** | Taxe de Vente du Quebec. Taxe provinciale de 9,975% percue par Revenu Quebec. Se calcule sur le montant HT (pas sur le montant incluant la TPS). |
| **TVH** | Taxe de Vente Harmonisee. Combine la TPS et la composante provinciale en un seul taux dans certaines provinces (Ontario 13%, NB 15%, etc.). Ne s'applique pas au Quebec. |
| **CTI** | Credit de Taxe sur les Intrants. Montant de TPS paye sur les achats commerciaux que l'entreprise recupere dans sa declaration. Droit, pas privilege. |
| **RTI** | Remboursement de Taxe de Vente du Quebec sur les Intrants. Equivalent provincial du CTI pour la TVQ. |
| **ARC** | Agence du Revenu du Canada. Administration fiscale federale qui administre la TPS, l'impot sur le revenu et les cotisations sociales. |
| **Revenu Quebec** | Administration fiscale provinciale du Quebec. Administre la TVQ, l'impot provincial et les cotisations sociales quebecoises. |
| **Taxable** | Bien ou service sur lequel la TPS et la TVQ doivent etre percues. La majorite des biens et services, incluant les peptides. |
| **Detaxe** | Bien ou service taxe a 0%. Pas de taxes facturees, MAIS le vendeur conserve le droit aux CTI/RTI. Exemples : exportations, medicaments sur ordonnance. |
| **Exempte** | Bien ou service non assujetti aux taxes. Pas de taxes facturees ET pas de CTI/RTI reclamables. Exemples : services financiers, assurances. |
| **RS&DE** | Recherche Scientifique et Developpement Experimental. Programme de credits d'impot pour les depenses de R&D. Peut representer 35-50% des depenses admissibles. |
| **CDAE** | Credit d'impot pour le Developpement des Affaires Electroniques. Credit quebecois de 24% sur les salaires de developpeurs et designers. |
| **Methode rapide** | Methode simplifiee de calcul de la TPS/TVQ pour les PME (CA < 400 000 $). Taux fixe au lieu du calcul detaille. |
| **Acompte provisionnel** | Paiement anticipe d'impots exige trimestriellement si les impots annuels depassent 3 000 $ (federal) ou 1 800 $ (provincial). |
| **T2** | Declaration de revenus des societes federale. Doit etre produite dans les 6 mois suivant la fin de l'exercice. |
| **CO-17** | Declaration de revenus des societes du Quebec. Equivalent provincial du T2. |

---

## Pages reliees

- [Factures clients](07-factures.md) : Source des taxes collectees (TPS/TVQ a remettre)
- [Depenses](08-depenses.md) : Source des credits d'intrants (CTI/RTI)
- [Plan comptable](01-plan-comptable.md) : Structure des comptes de taxes (1150, 1160, 2100, 2110)
- [Rapprochement](10-rapprochement.md) : Verification des paiements de taxes
- [Rapports](12-rapports.md) : Rapports fiscaux detailles
- [Etat des resultats](06-resultats.md) : Impact des taxes sur la rentabilite
