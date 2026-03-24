# Rapprochement Bancaire

> **Section**: Comptabilite > Banque > Rapprochement
> **URL**: `/admin/comptabilite/rapprochement`, `/admin/comptabilite/banques`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~30 minutes

---

## Pourquoi cette page est importante

Le rapprochement bancaire est votre **filet de securite comptable**. C'est le processus de verification que les transactions enregistrees dans Koraline correspondent exactement aux transactions sur votre releve bancaire. Sans rapprochement, vous naviguez a l'aveugle : des erreurs, des fraudes ou des oublis peuvent passer inapercus pendant des mois.

**Obligations legales** :
- Les NCECF et les bonnes pratiques comptables exigent un rapprochement bancaire periodique. C'est une exigence de base du controle interne.
- Lors d'une verification de l'ARC, les verificateurs comparent systematiquement le grand livre avec les releves bancaires. Des ecarts non expliques declenchent des questions et peuvent mener a des ajustements.
- Les auditeurs externes (si votre entreprise est auditee) exigent le rapprochement bancaire de chaque mois comme piece justificative.

**Impact concret** :
- **Detection de fraude** : Un employe qui detourne des fonds serait decouvert au rapprochement.
- **Correction d'erreurs** : Une depense enregistree deux fois, un paiement oublie, un montant mal saisi -- tout est detecte.
- **Completude** : Les frais bancaires, les interets crediteurs, les virements automatiques que vous n'avez pas saisis sont identifies.
- **Precision** : Le solde dans Koraline correspond exactement au solde a la banque. Vos etats financiers sont fiables.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7. Factures → 8. Depenses → 9. Taxes TPS/TVQ
 ↓
[10. RAPPROCHEMENT BANCAIRE] ← VOUS ETES ICI (verification)
 ↓
 11. Budget → 12. Rapports
```

Le rapprochement bancaire est l'etape 10 du cycle. Il se fait **apres** que toutes les transactions du mois sont saisies (factures, depenses, ecritures) et **avant** de generer les etats financiers definitifs (bilan, resultats). C'est la derniere verification avant la production des rapports.

---

## Ordre des operations

### Le processus complet de rapprochement mensuel

| Etape | Action | Duree estimee |
|-------|--------|---------------|
| 1 | Telecharger le releve bancaire du mois depuis votre banque en ligne | 2 min |
| 2 | Importer le releve dans Koraline (CSV, OFX ou QIF) | 2 min |
| 3 | Lancer le rapprochement automatique (les regles traitent la majorite) | 1 min |
| 4 | Traiter les transactions non rapprochees cote banque (frais bancaires, interets) | 5-10 min |
| 5 | Traiter les ecritures non rapprochees cote Koraline (cheques en circulation) | 5-10 min |
| 6 | Verifier que le solde ajuste correspond | 2 min |
| 7 | Marquer le rapprochement comme termine | 1 min |
| **Total** | | **15-30 min par compte** |

### Sequence dans la cloture mensuelle

1. Publier tous les brouillons d'ecritures
2. Passer les ecritures d'ajustement (amortissement, provisions)
3. **Faire le rapprochement bancaire** ← vous etes ici
4. Generer la balance de verification
5. Generer le bilan et l'etat des resultats

---

## Concepts fondamentaux

### Pourquoi le solde bancaire et le solde comptable different

Meme quand tout est correct, le solde dans Koraline et le solde sur le releve bancaire different presque toujours. Voici pourquoi :

| Element en circulation | Explication | Impact |
|----------------------|-------------|--------|
| **Cheques en circulation** | Cheques emis par BioCycle mais pas encore encaisses par les beneficiaires | Dans Koraline mais PAS sur le releve |
| **Depots en transit** | Depots effectues mais pas encore credites par la banque (delai 1-2 jours) | Dans Koraline mais PAS sur le releve |
| **Frais bancaires** | Frais preleves par la banque (frais mensuels, commissions) | Sur le releve mais PAS dans Koraline |
| **Interets crediteurs** | Interets gagnes sur le compte | Sur le releve mais PAS dans Koraline |
| **Virements automatiques** | Prelevements automatiques non encore saisis | Sur le releve mais PAS dans Koraline |
| **Erreurs de saisie** | Montant ou date incorrects dans Koraline | Ecart entre les deux |

### Le rapprochement ajuste les deux soldes

```
RAPPROCHEMENT BANCAIRE
BioCycle Peptides Inc. - Compte TD Operations
Au 31 mars 2026

SOLDE SELON RELEVE BANCAIRE :              82 450,00 $
  Ajouter : Depots en transit                2 345,67 $
  Deduire : Cheques en circulation          (1 200,00 $)
SOLDE BANCAIRE AJUSTE :                    83 595,67 $

SOLDE SELON KORALINE :                     83 645,67 $
  Ajouter : Interets crediteurs                  5,00 $
  Deduire : Frais bancaires mensuels           (42,50 $)
  Deduire : Frais de cheque rejete             (12,50 $)
SOLDE COMPTABLE AJUSTE :                   83 595,67 $

ECART :                                         0,00 $  ← RAPPROCHEMENT REUSSI
```

Quand les deux soldes ajustes sont identiques, le rapprochement est reussi.

---

## Comment entrer les donnees

### 1. Configurer vos comptes bancaires

**URL** : `/admin/comptabilite/banques`

| Champ | Quoi mettre | Exemple | Pourquoi |
|-------|------------|---------|----------|
| **Nom** | Nom descriptif du compte | TD Operations CAD | Identification rapide |
| **Numero** | 4 derniers chiffres | xxxx-1234 | Securite + identification |
| **Institution** | Nom de la banque | TD | Pour le format d'import |
| **Devise** | CAD ou USD | CAD | Conversion de change si USD |
| **Compte comptable** | Compte du plan comptable | 1010 | Lien avec le grand livre |
| **Solde d'ouverture** | Solde a la date de debut | 50 000,00 $ | Point de depart du rapprochement |

### 2. Importer un releve bancaire

**URL** : `/admin/comptabilite/import-bancaire`

**Formats acceptes** :

| Format | Extension | Provenance | Qualite |
|--------|-----------|------------|---------|
| **CSV** | .csv | Exporte depuis la banque en ligne | Bon, mais format variable selon les banques |
| **OFX** | .ofx | Standard bancaire Open Financial Exchange | Excellent, format normalise |
| **QIF** | .qif | Quicken Interchange Format (ancien) | Correct |

**Etapes** :
1. Telechargez le releve depuis votre banque en ligne (TD EasyWeb, Desjardins AccesD, etc.)
2. Dans Koraline, cliquez sur **Importer**
3. Selectionnez le **compte bancaire** cible (ex: 1010 - Banque TD)
4. Deposez le fichier
5. Koraline affiche un apercu des transactions importees
6. Verifiez la correspondance des colonnes (date, description, montant)
7. Cliquez sur **Importer**

### 3. Rapprocher les transactions

**URL** : `/admin/comptabilite/rapprochement`

L'interface affiche deux colonnes cote a cote :

| Releve bancaire | Ecritures Koraline |
|----------------|--------------------|
| 03/03 STRIPE DEP +2 345,67 | 03/03 PAY-0451 Paiement Stripe 2 345,67 |
| 05/03 LOYER DEBIT -2 299,50 | 05/03 DEP-0122 Loyer mars 2 299,50 |
| 07/03 FRAIS BANCAIRES -42,50 | ??? (manquant) |
| 12/03 GOOGLE ADS -1 724,63 | 12/03 DEP-0123 Google Ads 1 724,63 |

**Traitement** :
1. **Transactions auto-rapprochees (vert)** : le systeme a trouve la correspondance par montant et date. Confirmez.
2. **Transactions bancaires sans ecriture** : cliquez sur **Creer ecriture** pour les frais bancaires, interets, etc.
3. **Ecritures sans transaction bancaire** : le cheque n'est peut-etre pas encore encaisse (normal) -- notez comme "en circulation".
4. **Ecarts de montant** : une erreur de saisie a corriger dans Koraline.

### 4. Configurer des regles de rapprochement automatique

**URL** : `/admin/comptabilite/regles-bancaires`

Les regles automatisent le traitement des transactions recurrentes :

| Critere | Action | Exemple |
|---------|--------|---------|
| Description contient "STRIPE" | Creer ecriture dans 5060 - Frais bancaires | Les versements Stripe sont auto-rapproches |
| Description contient "LOYER" | Creer ecriture dans 5030 - Loyer | Le loyer mensuel est auto-rapproche |
| Montant exact -42,50 $ + description "FRAIS" | Creer ecriture dans 5060 - Frais bancaires | Les frais mensuels TD sont auto-rapproches |
| Description contient "INTERETS" | Creer ecriture dans 4510 - Interets gagnes | Les interets crediteurs sont auto-rapproches |

**Astuce** : Apres 3 a 6 mois, les regles traitent 80-90% des transactions automatiquement. Vous ne gerez plus que les exceptions.

### 5. Gerer les devises

**URL** : `/admin/comptabilite/devises`

Si BioCycle a un compte en USD (1020 - Banque BMO USD) :
- Importez le releve USD separement
- Koraline convertit les transactions au taux de la Banque du Canada du jour
- Le gain ou la perte de change est comptabilise automatiquement dans le compte 4520/5500

---

## Pourquoi entrer ces donnees

### Le rapprochement repond a 5 questions essentielles

1. **Est-ce que tout l'argent recu est dans les livres ?** Un depot Stripe oublie = revenu non comptabilise = impots sous-declares.
2. **Est-ce que tout l'argent depense est dans les livres ?** Un prelevement automatique oublie = charge manquante = benefice surevalue.
3. **Y a-t-il des erreurs de montant ?** Un 1 500 $ saisi comme 15 000 $ = balance de verification correcte mais comptes faux.
4. **Y a-t-il des transactions frauduleuses ?** Une transaction inconnue sur le releve = potentielle fraude a investiguer immediatement.
5. **Le solde bancaire est-il correct ?** Si le rapprochement n'aboutit pas, quelque chose ne va pas et il faut investiguer.

### Consequences de ne pas rapprocher

| Risque | Exemple | Consequence |
|--------|---------|-------------|
| Revenu non comptabilise | Un virement client de 5 000 $ non saisi | 5 000 $ de revenu manquant dans la declaration = probleme avec l'ARC |
| Charge manquante | Frais bancaires de 42,50 $/mois x 12 = 510 $ | 510 $ de deductions perdues + CTI non reclame |
| Fraude non detectee | Transaction de 2 000 $ non autorisee | Perte financiere directe |
| Etats financiers inexacts | Bilan avec solde bancaire faux | Banque perd confiance, financement compromis |
| Erreur propagee | Une erreur non detectee en janvier se repercute sur toute l'annee | 12 mois de corrections a faire |

---

## Cas pratiques de rapprochement pour BioCycle

### Cas 1 : Versement Stripe avec commission

Le releve bancaire montre un depot de 2 276,54 $. Koraline a enregistre une vente de 2 345,67 $.

**Explication** : Stripe verse le montant net (vente - commission). La commission est de 2 345,67 x 2,9% + 0,30 $ = 68,32 $ + 0,30 $ = 68,62 $. Montant verse : 2 345,67 - 68,62 = 2 277,05 $.

L'ecart de 0,51 $ provient de l'arrondi de la commission sur les transactions individuelles (Stripe calcule la commission par transaction, pas par versement global).

**Action** : Creer une ecriture pour la commission Stripe (Debit 5060 / Credit 1010) et rapprocher.

### Cas 2 : Frais bancaires mensuels

Le releve montre un debit de 42,50 $ avec la description "FRAIS MENSUELS TD".

**Action** : Pas d'ecriture dans Koraline pour ce montant. Cliquez sur **Creer ecriture** :
```
Debit  5060 - Frais bancaires           42,50 $
Credit 1010 - Banque TD                              42,50 $
```

Avec une regle de rapprochement configuree pour "FRAIS MENSUELS TD", cette ecriture sera creee automatiquement le mois suivant.

### Cas 3 : Cheque en circulation

Koraline montre un paiement de 1 200 $ au fournisseur PeptideLab (cheque #1045 du 28 mars). Le releve bancaire ne montre pas ce debit.

**Explication** : Le cheque n'a pas encore ete encaisse par le fournisseur. C'est un "cheque en circulation".

**Action** : Le noter comme element de rapprochement. Il apparaitra sur le releve du mois suivant. Verifier que le cheque est bien encaisse le mois prochain -- un cheque non encaisse apres 6 mois doit etre investigue.

### Cas 4 : Transaction inconnue (potentielle fraude)

Le releve montre un debit de 895,00 $ a "AMZN MARKETPLACE" que personne dans l'equipe ne reconnait.

**Action critique** :
1. Verifier aupres de tous les detenteurs de carte si l'achat est legitimate
2. Si non : contester immediatement avec la banque (delai de 90 jours)
3. Ne PAS creer d'ecriture tant que la contestation n'est pas resolue
4. Si l'achat est confirme frauduleux : la banque credit le montant et le rapprochement s'equilibre

### Cas 5 : Virement interac recu d'un client B2B

Le releve montre un credit de 4 598,50 $ avec la description "VIREMENT INTERAC CLINIQUE SP".

**Action** : Trouver la facture client correspondante (FACT-2026-0XX pour Clinique Sante Plus, montant 4 598,50 $). Enregistrer le paiement dans la facture, ce qui genere l'ecriture :
```
Debit  1010 - Banque TD              4 598,50 $
Credit 1100 - Comptes clients                      4 598,50 $
```

Rapprocher avec la transaction bancaire.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Ne pas rapprocher chaque mois | Les ecarts s'accumulent et deviennent impossibles a resoudre | Inscrire le rapprochement dans la routine de cloture mensuelle |
| Ignorer les petits ecarts | Un ecart de 0,50 $ peut cacher un probleme systematique | Resoudre chaque ecart, meme le plus petit |
| Rapprocher uniquement par montant, pas par date | Deux transactions du meme montant peuvent etre confondues | Verifier le montant ET la date ET la description |
| Ne pas creer les ecritures pour les frais bancaires | Le solde comptable ne correspondra jamais au releve | Creer les ecritures pour chaque element bancaire non saisi |
| Oublier les cheques en circulation du mois precedent | Ils seront encaisses ce mois-ci et apparaitront sur le releve | Suivre la liste des cheques en circulation d'un mois a l'autre |
| Rapprocher sans avoir saisi toutes les transactions du mois | Le rapprochement aura trop d'elements non correspondants | Finir la saisie du mois AVANT de commencer le rapprochement |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Hebdomadaire** (recommande) | Rapprochement rapide : verifier les transactions de la semaine, surtout les paiements Stripe |
| **Mensuel** (obligatoire) | Rapprochement complet : importer le releve, rapprocher toutes les transactions, resoudre les ecarts |
| **A la reception du releve** | Immediatement pour le compte principal (TD Operations) |
| **Trimestriel** | Rapprocher le compte USD et le compte Stripe |

---

## Questions frequentes (FAQ)

**Q : A quelle frequence faire le rapprochement ?**
R : Au minimum mensuellement. Les entreprises avec beaucoup de transactions (comme BioCycle avec les ventes en ligne quotidiennes) beneficient d'un rapprochement hebdomadaire. Plus c'est frequent, plus les ecarts sont faciles a trouver.

**Q : Que faire si je trouve un ecart que je ne peux pas expliquer ?**
R : 1) Verifiez les cheques en circulation et les depots en transit. 2) Verifiez les virements automatiques non saisis. 3) Cherchez une erreur de montant (chiffres inverses : 1 234 vs 1 324). 4) Si l'ecart persiste, contactez votre banque. 5) Documentez l'ecart et consultez votre comptable.

**Q : Les paiements Stripe sont-ils rapproches automatiquement ?**
R : Si vous avez configure la regle "STRIPE", la majorite des versements Stripe sont rapproches automatiquement. Attention : Stripe verse le montant net (vente moins commission), pas le montant brut. Le rapprochement doit tenir compte de la commission.

**Q : Dois-je rapprocher le compte Stripe aussi ?**
R : Idealement oui. Stripe verse les fonds sur votre compte bancaire avec un delai de 2 a 3 jours ouvrables. Rapprocher le compte Stripe intermediaire vous assure que tous les versements arrivent bien en banque.

**Q : Combien de temps prend un rapprochement ?**
R : Avec des regles bien configurees, 15 a 30 minutes par compte et par mois. Les premiers mois prennent plus longtemps car vous configurez les regles. Apres 3 mois, 80-90% des transactions sont auto-rapprochees.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Rapprochement bancaire** | Processus de verification qui compare les ecritures comptables avec le releve bancaire pour s'assurer de leur concordance. |
| **Pointer** | Marquer une transaction comme rapprochee (correspondance trouvee entre le releve et le grand livre). |
| **Cheque en circulation** | Cheque emis par l'entreprise mais pas encore encaisse par le beneficiaire. Apparait dans Koraline mais pas sur le releve bancaire. |
| **Depot en transit** | Argent depose a la banque mais pas encore credite sur le compte (delai de compensation). Apparait dans Koraline mais pas sur le releve. |
| **Solde ajuste** | Solde apres correction des elements en circulation. Le solde bancaire ajuste doit egaliser le solde comptable ajuste. |
| **OFX** | Open Financial Exchange. Format standard d'echange de donnees bancaires. Preferable au CSV pour l'import. |
| **Regle de rapprochement** | Critere automatique qui associe une transaction bancaire a une ecriture comptable sans intervention manuelle. |
| **Element de rapprochement** | Transaction qui explique un ecart entre le solde bancaire et le solde comptable. |

---

## Pages reliees

- [Grand livre](04-grand-livre.md) : Les ecritures a rapprocher avec le releve bancaire
- [Depenses](08-depenses.md) : Les depenses qui doivent correspondre aux debits bancaires
- [Ecritures](03-ecritures.md) : Saisie des ecritures manquantes decouvertes au rapprochement
- [Rapports](12-rapports.md) : Rapport de rapprochement bancaire pour l'audit
- [Bilan](05-bilan.md) : Le poste Tresorerie du bilan doit correspondre au solde rapproche
