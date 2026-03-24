# Ecritures de Journal

> **Section**: Comptabilite > Ecritures
> **URL**: `/admin/comptabilite/ecritures`, `/admin/comptabilite/saisie-rapide`, `/admin/comptabilite/recurrentes`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~35 minutes

---

## Pourquoi cette page est importante

Les ecritures de journal sont le **mecanisme concret** par lequel les transactions financieres entrent dans votre systeme comptable. Chaque ecriture est composee d'au moins une ligne de debit et une ligne de credit, dont les totaux doivent s'equilibrer parfaitement.

**Obligations legales** :
- La Loi de l'impot sur le revenu (article 230) exige que chaque transaction soit documentee par une ecriture comptable avec piece justificative.
- L'ARC exige que les ecritures soient suffisamment detaillees pour permettre la verification de la declaration fiscale.
- Les ecritures d'ajustement de fin de periode sont requises par les NCECF pour refleter fidelement la situation financiere.

**Impact concret** : Les ecritures de journal sont les "atomes" de la comptabilite. Chaque rapport, chaque etat financier, chaque declaration de taxes est derive des ecritures. Une ecriture erronee se propage partout : balance de verification fausse, bilan incorrect, impots mal calcules.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable (structure des comptes)
 ↓
 2. Journal general (registre chronologique)
 ↓
[3. ECRITURES DE JOURNAL] ← VOUS ETES ICI (mecanisme debit/credit)
 ↓
 4. Grand livre et balance de verification
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7-12. Factures, depenses, taxes, rapprochement, budget, rapports
```

Les ecritures sont l'etape 3 du cycle. Le plan comptable definit les comptes, le journal les organise chronologiquement, et les ecritures sont le detail technique de chaque transaction : quels comptes sont debites, quels comptes sont credites, pour quels montants.

---

## Ordre des operations

### Quand saisir une ecriture manuelle

La majorite des transactions sont automatisees dans Koraline (ventes, paiements, depenses). Vous ne saisissez manuellement que dans ces situations :

| Situation | Exemple BioCycle | Frequence |
|-----------|-----------------|-----------|
| **Correction d'erreur** | Depense enregistree dans le mauvais compte | Occasionnelle |
| **Ajustement fin de mois** | Amortissement de l'equipement de laboratoire | Mensuelle |
| **Provision** | Provision pour creances douteuses (client B2B qui ne paie pas) | Mensuelle |
| **Reclassement** | Deplacement d'un montant d'un compte a un autre | Occasionnelle |
| **Transaction non standard** | Investissement de l'actionnaire, pret interne | Rare |
| **Ecriture de cloture** | Fermeture des revenus/charges vers BNR en fin d'exercice | Annuelle |
| **Charges a payer** | Salaires gagnes mais pas encore payes au 31 du mois | Mensuelle |
| **Revenus non factures** | Services rendus mais pas encore factures | Mensuelle |

### Sequence pour une ecriture manuelle

1. Identifier la transaction a enregistrer
2. Determiner quels comptes sont affectes
3. Appliquer la regle debit/credit (actifs et charges augmentent au debit, passifs et revenus augmentent au credit)
4. Verifier que le total des debits egalise le total des credits
5. Saisir l'ecriture dans Koraline
6. Joindre la piece justificative
7. Publier (ou sauvegarder en brouillon si verification necessaire)

---

## Les mecaniques debit/credit en detail

### La regle d'or

Pour chaque transaction, demandez-vous :
1. **Quels comptes sont affectes ?** (minimum 2)
2. **Chaque compte augmente-t-il ou diminue-t-il ?**
3. **Selon le type de compte, est-ce un debit ou un credit ?**

| Type de compte | Pour augmenter | Pour diminuer |
|---------------|----------------|---------------|
| **Actif** (banque, clients, stock) | DEBIT | Credit |
| **Charge** (salaires, loyer, marketing) | DEBIT | Credit |
| **Passif** (fournisseurs, emprunts, taxes) | Credit | DEBIT |
| **Revenu** (ventes, abonnements) | Credit | DEBIT |
| **Capitaux propres** (capital, BNR) | Credit | DEBIT |

### Exemples concrets pour BioCycle Peptides

**Exemple 1 : Vente de peptides a un client B2B (1 000 $ + taxes)**

Raisonnement :
- Le client nous doit 1 149,75 $ --> Comptes clients (actif) augmente --> DEBIT
- Nous gagnons 1 000 $ de revenus --> Ventes (revenu) augmente --> CREDIT
- Nous collectons 50 $ de TPS pour le gouvernement --> TPS a remettre (passif) augmente --> CREDIT
- Nous collectons 99,75 $ de TVQ pour le gouvernement --> TVQ a remettre (passif) augmente --> CREDIT

```
Debit  1100 - Comptes clients        1 149,75 $
Credit 4010 - Ventes peptides                      1 000,00 $
Credit 2100 - TPS a remettre                          50,00 $
Credit 2110 - TVQ a remettre                          99,75 $
                                     ---------      ---------
Total                                1 149,75 $     1 149,75 $
```

**Exemple 2 : Amortissement mensuel de l'equipement de laboratoire (500 $)**

Raisonnement :
- L'equipement perd 500 $ de valeur ce mois --> Charge d'amortissement (charge) augmente --> DEBIT
- La valeur accumulee de l'amortissement augmente --> Amortissement cumule (contre-actif) augmente --> CREDIT

```
Debit  5200 - Amortissement              500,00 $
Credit 1450 - Amort. cumule equip.                    500,00 $
```

**Exemple 3 : Paiement du loyer avec TPS/TVQ (2 000 $ + taxes)**

Raisonnement :
- Le loyer est une charge --> Loyer (charge) augmente --> DEBIT
- La TPS payee est recuperable --> TPS intrants (actif) augmente --> DEBIT
- La TVQ payee est recuperable --> TVQ intrants (actif) augmente --> DEBIT
- L'argent sort de la banque --> Banque (actif) diminue --> CREDIT

```
Debit  5030 - Loyer                    2 000,00 $
Debit  1150 - TPS intrants              100,00 $
Debit  1160 - TVQ intrants              199,50 $
Credit 1010 - Banque TD                              2 299,50 $
```

**Exemple 4 : Provision pour creance douteuse (client B2B qui ne paie pas, 500 $)**

Raisonnement :
- On estime perdre 500 $ --> Mauvaises creances (charge) augmente --> DEBIT
- La provision reduit la valeur des comptes clients --> Provision creances douteuses (contre-actif) augmente --> CREDIT

```
Debit  5400 - Mauvaises creances         500,00 $
Credit 1109 - Provision creances dout.                500,00 $
```

---

## Comment entrer les donnees

### 1. Saisir une ecriture manuelle complete

**URL** : `/admin/comptabilite/ecritures`

**Etapes detaillees** :

1. Cliquez sur **Nouvelle ecriture**
2. Remplissez l'en-tete :

| Champ | Quoi mettre | Exemple |
|-------|------------|---------|
| **Date** | Date de la transaction (pas la date de saisie) | 2026-03-31 |
| **Description** | Libelle clair et descriptif | Amortissement equipement labo - Mars 2026 |
| **Reference** | Numero interne ou externe | ADJ-2026-03-001 |

3. Ajoutez les lignes (minimum 2) :

| Ligne | Compte | Debit | Credit |
|-------|--------|-------|--------|
| 1 | 5200 - Amortissement | 500,00 $ | |
| 2 | 1450 - Amort. cumule equip. | | 500,00 $ |

4. Verifiez l'equilibre : le total des debits (500 $) doit egaliser le total des credits (500 $). Koraline affiche une alerte rouge si l'ecriture n'est pas equilibree.

5. Joignez la piece justificative si applicable (fichier PDF ou image)

6. Choisissez :
   - **Sauvegarder** : cree un brouillon (n'affecte pas les rapports)
   - **Publier** : enregistre definitivement l'ecriture dans les livres

### 2. Utiliser la saisie rapide

**URL** : `/admin/comptabilite/saisie-rapide`

La saisie rapide simplifie le processus pour les operations courantes. Vous n'avez pas besoin de connaitre les mecaniques debit/credit.

**Etapes** :
1. Selectionnez le **type d'operation** :
   - Depense simple
   - Virement entre comptes
   - Remboursement
   - Ajustement de stock
2. Le formulaire s'adapte au type selectionne
3. Remplissez les champs en langage naturel

**Exemple : Saisie rapide d'une depense marketing**
1. Type : Depense
2. Compte de depense : 5041 - Google Ads
3. Compte de paiement : 1010 - Banque TD
4. Montant HT : 1 500 $
5. Description : "Campagne Google Ads BPC-157 mars 2026"
6. TPS/TVQ : calcul automatique (cochee par defaut)

Le systeme genere automatiquement :
```
Debit  5041 - Google Ads            1 500,00 $
Debit  1150 - TPS intrants            75,00 $
Debit  1160 - TVQ intrants           149,63 $
Credit 1010 - Banque TD                           1 724,63 $
```

Vous n'avez pas eu besoin de connaitre les comptes de taxes ni les mecaniques debit/credit.

### 3. Configurer les ecritures recurrentes

**URL** : `/admin/comptabilite/recurrentes`

**Quand** : Pour les charges qui reviennent de maniere identique chaque mois.

**Etapes** :
1. Cliquez sur **Nouvelle recurrence**
2. Creez l'ecriture modele (comme une ecriture manuelle)
3. Configurez la recurrence :

| Champ | Options | Exemple |
|-------|---------|---------|
| **Frequence** | Mensuelle, trimestrielle, annuelle | Mensuelle |
| **Jour du mois** | 1 a 28 (eviter 29-31 pour les mois courts) | 1er |
| **Date de debut** | Premiere occurrence | 2026-01-01 |
| **Date de fin** | Derniere occurrence (optionnel) | 2026-12-31 |

**Ecritures recurrentes typiques pour BioCycle** :

| Ecriture | Montant mensuel | Frequence |
|----------|----------------|-----------|
| Loyer bureau | 2 000 $ + taxes | Mensuelle, le 1er |
| Amortissement equipement labo | 500 $ | Mensuelle, le 31 |
| Amortissement materiel informatique | 200 $ | Mensuelle, le 31 |
| Assurance responsabilite civile | 400 $ + taxes | Mensuelle, le 15 |
| Abonnement Azure | ~350 $ + taxes | Mensuelle, le 1er |

### 4. Scanner des documents par OCR

**URL** : `/admin/comptabilite/ocr`

1. Cliquez sur **Scanner un document**
2. Deposez l'image ou le PDF de la facture/recu
3. Le systeme OCR extrait automatiquement :
   - Nom du fournisseur
   - Montant total et sous-total
   - TPS et TVQ separees
   - Date du document
   - Numero de facture
4. **Verifiez les donnees extraites** -- l'OCR n'est pas parfait a 100%, surtout sur les recus thermiques decolores
5. Selectionnez le compte de depense
6. Cliquez sur **Creer l'ecriture**

### 5. Modifier ou annuler une ecriture

**Modifier** (periode non cloturee uniquement) :
1. Trouvez l'ecriture dans la liste
2. Cliquez dessus, puis sur **Modifier**
3. Apportez les corrections
4. Sauvegardez

**Annuler** (methode recommandee -- contre-passation) :
1. Trouvez l'ecriture a annuler
2. Cliquez sur **Annuler**
3. Le systeme cree automatiquement une ecriture inverse : les debits deviennent des credits et vice versa
4. Les deux ecritures se neutralisent et la piste d'audit est conservee

---

## Pourquoi entrer ces donnees

### Les ecritures d'ajustement de fin de mois

Sans ecritures d'ajustement, vos etats financiers ne refletent pas la realite :

| Ajustement | Pourquoi | Exemple |
|-----------|----------|---------|
| **Amortissement** | Repartir le cout de l'equipement sur sa duree de vie utile | Equipement labo a 30 000 $ amorti sur 5 ans = 500 $/mois |
| **Provision creances douteuses** | Refleter le risque que certains clients ne paient pas | Client B2B avec facture de 90+ jours = provision de 50% |
| **Charges a payer** | Enregistrer les charges encourues mais pas encore payees | Salaires du 16 au 31 mars, payes en avril |
| **Revenus non factures** | Enregistrer les revenus gagnes mais pas encore factures | Services de consulting rendus en mars, factures en avril |
| **Charges payees d'avance** | Reporter la portion non consommee d'une charge prepayee | Assurance annuelle de 4 800 $ payee en janvier = 400 $/mois |

### Les ecritures de cloture annuelle

En fin d'exercice, les comptes de revenus et de charges doivent etre "fermes" (mis a zero). Leur solde est vire dans les Benefices Non Repartis (BNR). C'est l'ecriture de cloture.

**Pourquoi** : Les revenus et les charges sont des comptes "temporaires" qui mesurent la performance d'une periode specifique. Au debut du nouvel exercice, ils doivent repartir a zero. Le BNR est un compte "permanent" qui accumule les profits d'annee en annee.

**Exemple simplifie** :
```
Ecritures de cloture au 31 decembre 2026

Fermer les revenus (solde crediteur de 1 440 000 $) :
Debit  4010 - Ventes peptides        1 440 000 $
Credit 3200 - BNR                                  1 440 000 $

Fermer les charges (solde debiteur de 980 000 $) :
Debit  3200 - BNR                      980 000 $
Credit 5000 - Charges (total)                        980 000 $

Resultat net : BNR augmente de 460 000 $ (profit de l'annee)
```

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Ecriture desequilibree | Impossible de publier (Koraline bloque) | Toujours verifier debits = credits avant de publier |
| Mauvais compte debite/credite | Etats financiers faux, declaration fiscale erronee | Se referer au plan comptable, utiliser la saisie rapide en cas de doute |
| Oublier les ecritures d'ajustement en fin de mois | Bilan et resultats ne refletent pas la realite | Creer une checklist mensuelle des ajustements |
| Publier sans piece justificative | Deduction refusee par l'ARC lors d'une verification | Joindre systematiquement le recu/facture |
| Modifier une ecriture publiee au lieu de la contre-passer | Perte de la piste d'audit | Toujours utiliser la contre-passation |
| Oublier les taxes sur une depense | Les CTI/RTI ne sont pas reclames, vous perdez 14,975% | Toujours cocher la case TPS/TVQ dans la saisie rapide |
| Enregistrer une immobilisation comme charge | Le bilan est faux, l'amortissement manque, deduction fiscale sous-optimale | Un achat de plus de 500 $ avec duree de vie > 1 an est une immobilisation, pas une charge |

---

## Quand faire cette operation

| Frequence | Type d'ecriture | Detail |
|-----------|----------------|--------|
| **Quotidien** | Ecritures courantes | Depenses, factures, paiements (surtout automatiques) |
| **Hebdomadaire** | Corrections et reclassements | Corriger les erreurs detectees dans la semaine |
| **Fin de mois** | Ecritures d'ajustement | Amortissement, provisions, charges a payer, revenus non factures |
| **Fin de trimestre** | Verification complete | S'assurer que toutes les ecritures du trimestre sont publiees avant la declaration TPS/TVQ |
| **Fin d'exercice** | Ecritures de cloture | Fermer revenus et charges vers BNR, ajustements fiscaux |

---

## Questions frequentes (FAQ)

**Q : Quelle est la difference entre "Sauvegarder" et "Publier" ?**
R : **Sauvegarder** cree un brouillon qui n'affecte pas les rapports financiers ni les soldes des comptes. **Publier** enregistre definitivement l'ecriture dans les livres comptables. Les brouillons sont utiles quand vous voulez qu'un collegue ou votre comptable verifie avant l'enregistrement final.

**Q : Puis-je modifier une ecriture publiee ?**
R : Si la periode n'est pas cloturee, oui. Mais la methode recommandee est la contre-passation : annuler l'ecriture originale puis saisir une nouvelle ecriture correcte. Cela conserve la piste d'audit complete.

**Q : Les ecritures recurrentes s'ajustent-elles automatiquement si un montant change ?**
R : Non, elles repetent le meme montant a chaque occurrence. Si un montant change (augmentation de loyer, par exemple), mettez a jour le modele de recurrence. L'ancien montant reste dans l'historique.

**Q : L'OCR fonctionne-t-il avec les factures en anglais ?**
R : Oui, l'OCR detecte les deux langues officielles (francais et anglais). Il fonctionne aussi avec les factures bilingues courantes au Quebec.

**Q : Combien de lignes peut avoir une ecriture ?**
R : Autant que necessaire, mais minimum 2 (un debit, un credit). Une ecriture de paie peut avoir 10+ lignes (salaire brut, impots federal et provincial, RRQ, AE, RQAP, assurance, net). L'important est que le total des debits egalise le total des credits.

**Q : Que signifie "contre-actif" ?**
R : Un contre-actif est un compte qui reduit la valeur d'un actif. Exemples : l'amortissement cumule (reduit la valeur de l'equipement), la provision pour creances douteuses (reduit la valeur des comptes clients). Le contre-actif a un solde crediteur, a l'inverse des actifs normaux.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Ecriture de journal** | Enregistrement formel d'une transaction avec date, description, comptes, debits et credits. Minimum 2 lignes, toujours equilibree. |
| **Brouillon** | Ecriture sauvegardee mais pas encore publiee. N'affecte pas les rapports. Utile pour validation avant publication. |
| **Contre-passation** | Ecriture inverse qui annule exactement une ecriture precedente. Methode standard pour corriger les erreurs sans perdre la piste d'audit. |
| **Ecriture recurrente** | Modele d'ecriture repetee automatiquement a intervalle regulier (mensuel, trimestriel, annuel). |
| **Ecriture d'ajustement** | Ecriture de fin de periode pour refleter des elements non encore comptabilises (amortissement, provisions, charges a payer). |
| **Ecriture de cloture** | Ecriture de fin d'exercice qui ferme les comptes temporaires (revenus, charges) vers le BNR. |
| **Contre-actif** | Compte a solde crediteur qui reduit la valeur d'un actif (ex : amortissement cumule, provision creances douteuses). |
| **OCR** | Optical Character Recognition. Technologie qui numerise automatiquement le texte d'un document scanne. |
| **Piece justificative** | Document original prouvant la transaction : facture, recu, contrat, releve de carte, capture d'ecran Stripe. |
| **Piste d'audit** | Ensemble des enregistrements qui permettent de retracer l'historique complet d'une transaction, y compris les modifications et corrections. |
| **Charge a payer** | Charge encourue dans la periode en cours mais qui ne sera payee que dans la periode suivante (ex: salaires du 16 au 31 decembre payes en janvier). |
| **Charge payee d'avance** | Montant paye d'avance pour un service futur (ex: assurance annuelle). La portion non consommee est un actif, pas une charge. |

---

## Pages reliees

- [Journal general](02-journal.md) : Ou les ecritures apparaissent chronologiquement
- [Plan comptable](01-plan-comptable.md) : Comptes utilises dans les ecritures
- [Grand livre et balance](04-grand-livre.md) : Ecritures regroupees par compte, verification de l'equilibre
- [Factures](07-factures.md) : Ecritures automatiques de vente
- [Depenses](08-depenses.md) : Saisie simplifiee (genere les ecritures automatiquement)
- [Rapprochement](10-rapprochement.md) : Verification que les ecritures correspondent au releve bancaire
