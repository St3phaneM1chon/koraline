# Journal General

> **Section**: Comptabilite > Grand livre
> **URL**: `/admin/comptabilite/grand-livre`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~30 minutes

---

## Pourquoi cette page est importante

Le journal general est le **registre chronologique de toutes les transactions financieres** de BioCycle Peptides. C'est le livre de bord de votre entreprise. Chaque dollar qui entre ou sort y est inscrit, avec sa date, sa description, et les comptes affectes.

**Obligations legales** :
- L'article 230(1) de la Loi de l'impot sur le revenu du Canada oblige toute entreprise a tenir des registres et des livres de comptes adequats. Le journal general est le registre principal.
- L'ARC et Revenu Quebec peuvent exiger l'acces a votre journal general lors d'une verification fiscale. Vous devez conserver ces registres pendant **6 ans** apres la fin de l'annee d'imposition.
- En cas de litige commercial, le journal general est une preuve legale de vos transactions.

**Impact concret** : Sans journal general complet et a jour, vous ne pouvez pas produire de balance de verification, d'etats financiers, ni de declarations de taxes. Votre comptable ne peut pas faire son travail. L'ARC peut rejeter vos deductions si vous ne pouvez pas les justifier par des ecritures dans le journal.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable (structure des comptes)
 ↓
[2. JOURNAL GENERAL] ← VOUS ETES ICI
 ↓
 3. Ecritures de journal (debits et credits)
 ↓
 4. Grand livre et balance de verification
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
 7-8. Factures et depenses (sources de transactions)
 ↓
 9-10. Taxes et rapprochement bancaire
 ↓
 11-12. Budget et rapports
```

Le journal general est l'etape 2 du cycle. Une fois le plan comptable etabli, chaque transaction est d'abord enregistree dans le journal general en ordre chronologique. Ensuite, ces memes transactions sont reportees dans le grand livre, organisees par compte. Le journal est le point d'entree de toute information financiere.

---

## Ordre des operations

1. **Une transaction se produit** (vente, achat, paiement, etc.)
2. **La transaction est enregistree dans le journal** -- soit automatiquement par Koraline, soit manuellement par vous
3. **L'ecriture du journal est reportee dans le grand livre** par compte
4. **En fin de periode**, le grand livre sert a produire la balance de verification et les etats financiers

**Regles de temporalite** :
- Enregistrer les transactions **le jour meme** ou au plus tard dans les **48 heures**
- Ne jamais attendre la fin du mois pour saisir les transactions -- les erreurs s'accumulent et deviennent impossibles a corriger
- Les ecritures automatiques (ventes en ligne, paiements Stripe) sont enregistrees en temps reel

---

## Concepts fondamentaux

### Journal vs Grand livre -- La difference essentielle

| Concept | Journal general | Grand livre |
|---------|----------------|-------------|
| **Organisation** | Par date (chronologique) | Par compte |
| **Analogie** | Journal intime : tout est note dans l'ordre | Classeur : meme info, rangee par dossier |
| **Contenu** | Chaque transaction avec tous ses comptes | Toutes les transactions d'un seul compte |
| **Usage** | Voir ce qui s'est passe le 15 mars | Voir tous les mouvements du compte Banque |

Dans Koraline, la page Grand livre combine les deux vues. Vous pouvez voir les transactions dans l'ordre chronologique (vue journal) ou filtrees par compte (vue grand livre).

### Comment les transactions arrivent dans le journal

| Source | Exemple BioCycle | Automatique ? | Frequence |
|--------|-----------------|---------------|-----------|
| **Commande boutique** | Client achete 3 flacons BPC-157 | Oui | Plusieurs fois par jour |
| **Paiement Stripe** | Reglement de commande par carte | Oui | Plusieurs fois par jour |
| **Facture client B2B** | Facture pour Clinique Sante Plus | Oui (a la creation) | Hebdomadaire |
| **Facture fournisseur** | Achat de peptides bruts chez le fabricant | Oui (a la saisie) | Hebdomadaire |
| **Depense** | Paiement loyer, Google Ads, assurance | Oui (a la saisie) | Quotidien |
| **Ecriture recurrente** | Loyer mensuel, amortissement | Oui (programmee) | Mensuelle |
| **Ecriture manuelle** | Ajustement, correction, provision | Non (saisie manuelle) | Fin de mois |
| **Ecriture de cloture** | Fermeture des revenus/charges vers BNR | Non (saisie manuelle) | Annuelle |

### Les 4 types d'ecritures dans le journal

1. **Ecritures courantes** : transactions normales du quotidien (ventes, achats, paiements). Representent 95% des ecritures.
2. **Ecritures de correction** : pour corriger une erreur dans une ecriture precedente. On ne modifie jamais l'original -- on passe une ecriture inverse puis une nouvelle ecriture correcte.
3. **Ecritures d'ajustement** : en fin de periode pour enregistrer des elements non encore comptabilises (amortissement, provisions, charges a payer, revenus non factures).
4. **Ecritures de cloture** : en fin d'exercice pour fermer les comptes de revenus et de charges et transferer le resultat dans les Benefices Non Repartis (BNR).

---

## Comment entrer les donnees

### Acceder au journal

1. Comptabilite > groupe **Comptes** > **Grand livre**
2. URL directe : `/admin/comptabilite/grand-livre`

### Interface du journal

#### Les filtres

| Filtre | Description | Quand l'utiliser |
|--------|-------------|------------------|
| **Periode** | Date de debut et de fin | Pour voir un mois, un trimestre, une annee |
| **Compte** | Filtrer par un compte du plan comptable | Pour voir tous les mouvements d'un compte specifique |
| **Type** | Facture, depense, paiement, ecriture manuelle | Pour isoler un type de transaction |
| **Montant** | Minimum et/ou maximum | Pour trouver les transactions significatives |
| **Recherche** | Texte libre dans la description | Pour retrouver une transaction specifique |
| **Reference** | Numero de facture, de commande, etc. | Pour tracer une transaction precise |

#### Les colonnes du journal

| Colonne | Ce qu'elle affiche | Pourquoi c'est utile |
|---------|-------------------|---------------------|
| **Date** | Date de la transaction | Chronologie -- quand l'evenement s'est produit |
| **Reference** | Numero de piece (FACT-2026-0423) | Tracabilite -- lien vers le document original |
| **Description** | Libelle de la transaction | Comprehension -- nature de l'operation |
| **Compte(s)** | Comptes debites et credites | Destination comptable -- ou l'argent va |
| **Debit** | Montant debite | Flux entrant dans le compte |
| **Credit** | Montant credite | Flux sortant du compte |
| **Solde** | Solde cumulatif du compte | Position actuelle |
| **Source** | Origine de l'ecriture | Tracabilite -- facture, depense, manuelle |

### Lire une ecriture de journal -- Exemple complet

Voici ce que vous voyez quand vous cliquez sur une transaction :

```
Date : 2026-03-15
Reference : FACT-2026-0423
Description : Vente peptides - Clinique Sante Plus
Type : Facture client

Compte                          Debit         Credit
-----------------------------------------------------
1100 - Comptes clients       1 149,75 $
4010 - Ventes peptides                      1 000,00 $
2100 - TPS a remettre                          50,00 $
2110 - TVQ a remettre                          99,75 $
                             ---------      ---------
Total                        1 149,75 $     1 149,75 $
```

**Pourquoi ces comptes ?**
- **1100 debit** : Le client nous doit 1 149,75 $. Comptes clients est un actif, il augmente au debit.
- **4010 credit** : Nous avons gagne 1 000,00 $ de revenus. Les revenus augmentent au credit.
- **2100 credit** : Nous avons collecte 50,00 $ de TPS pour le gouvernement federal. C'est un passif (nous devons le remettre), il augmente au credit.
- **2110 credit** : Nous avons collecte 99,75 $ de TVQ pour le gouvernement provincial. Meme logique.

**Verification** : 1 000,00 + 50,00 + 99,75 = 1 149,75. Le total des debits egalise le total des credits. L'ecriture est equilibree.

---

## Pourquoi entrer ces donnees

### Chaque ecriture sert a quatre fins

1. **Fiscale** : L'ARC et Revenu Quebec utilisent ces ecritures pour verifier vos declarations. Chaque dollar de revenu et chaque dollar de deduction doit etre tracable dans le journal.

2. **Legale** : Le journal est un document legal. En cas de litige avec un fournisseur ou un client, les ecritures prouvent quand et combien vous avez facture ou paye.

3. **Manageriale** : Les ecritures alimentent les rapports qui vous permettent de prendre des decisions eclairees. Combien depensez-vous en marketing ? Quelle est votre marge sur les ventes B2B ? Pouvez-vous embaucher un nouvel employe ?

4. **Bancaire** : Si vous demandez un pret, la banque examinera vos etats financiers, qui sont directement derives du journal. Un journal bien tenu = des etats financiers fiables = un meilleur acces au financement.

### Pourquoi la chronologie est importante

Le journal enregistre les transactions dans l'ordre ou elles se produisent. Cette chronologie est cruciale :
- Pour le rapprochement bancaire : comparer les dates dans le journal avec les dates sur le releve bancaire
- Pour les declarations de taxes : les periodes de declaration (trimestrielles) sont basees sur les dates
- Pour les audits : l'ARC verifie que les revenus sont declares dans la bonne periode
- Pour l'analyse : les tendances mensuelles n'ont de sens que si les transactions sont datees correctement

---

## Comprendre les ecritures automatiques

### Vente sur la boutique en ligne (e-commerce)

Quand un client passe une commande et paie par carte :

| Etape | Ecriture automatique | Explication |
|-------|---------------------|-------------|
| **1. Commande confirmee** | Debit 1100 (Clients) / Credit 4010 (Ventes) + 2100 (TPS) + 2110 (TVQ) | Le client doit le montant total ; on reconnait le revenu et les taxes |
| **2. Paiement Stripe recu** | Debit 1010 (Banque) / Credit 1100 (Clients) | L'argent arrive en banque ; la dette du client est annulee |
| **3. Commission Stripe** | Debit 5060 (Frais bancaires) / Credit 1010 (Banque) | Stripe preleve sa commission ; c'est une charge et l'argent sort de la banque |

### Achat aupres d'un fournisseur

| Etape | Ecriture automatique | Explication |
|-------|---------------------|-------------|
| **1. Facture fournisseur saisie** | Debit 5011 (Achats) + 1150 (TPS intrants) + 1160 (TVQ intrants) / Credit 2010 (Fournisseurs) | On enregistre la charge, les taxes recuperables, et la dette fournisseur |
| **2. Paiement du fournisseur** | Debit 2010 (Fournisseurs) / Credit 1010 (Banque) | On paie le fournisseur ; la dette est annulee, l'argent sort de la banque |

### Paie des employes (mensuelle)

| Etape | Ecriture automatique | Explication |
|-------|---------------------|-------------|
| **1. Salaire brut** | Debit 5021 (Salaires) / Credit 1010 (Banque) + 2151 (Impot federal) + 2152 (Impot provincial) + 2153 (RRQ) + 2154 (AE) + 2155 (RQAP) | Le salaire est une charge ; le net va en banque ; les retenues sont des passifs |
| **2. Charges employeur** | Debit 5022-5025 (Cotisations employeur) / Credit 2153-2155 (Retenues a payer) | Les contributions de l'employeur sont des charges additionnelles |

---

## Naviguer dans le journal -- Operations courantes

### Consulter les transactions d'un compte

**Objectif** : Voir tous les mouvements du compte bancaire pour le mois de mars.

1. Dans le filtre **Compte**, selectionnez "1010 - Banque TD"
2. Definissez la periode : 1er mars au 31 mars 2026
3. Le journal affiche uniquement les transactions de ce compte
4. Le solde cumulatif se calcule ligne par ligne

### Rechercher une transaction

**Objectif** : Retrouver le paiement a Google pour la campagne de mars.

1. Tapez "Google" dans la barre de recherche
2. Les transactions contenant "Google" dans la description s'affichent
3. Cliquez sur la ligne pour voir le detail complet

### Naviguer vers la source

**Objectif** : Depuis le journal, ouvrir la facture originale.

1. Cliquez sur une ecriture pour voir le detail
2. Cliquez sur le lien **Source** (ex: "Facture FACT-2026-0423")
3. La facture originale s'ouvre dans un nouvel onglet

### Exporter le journal

1. Appliquez les filtres souhaites (periode, compte)
2. Cliquez sur **Exporter** dans le ruban
3. Choisissez le format : CSV, Excel, PDF
4. Le fichier est telecharge

**Astuce** : Votre comptable vous demandera le grand livre en format Excel pour la fin d'annee fiscale. Exportez toute l'annee sans filtre de compte pour un export complet.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Attendre la fin du mois pour saisir | Oublis, erreurs de date, impossibilite de rapprocher | Saisir quotidiennement ou au maximum dans les 48h |
| Ne pas verifier les ecritures automatiques | Une erreur de configuration Stripe peut fausser des centaines d'ecritures | Verifier un echantillon de 5 transactions automatiques par semaine |
| Saisir une transaction sans piece justificative | L'ARC peut rejeter la deduction lors d'une verification | Toujours joindre le recu, la facture ou le contrat |
| Saisir le mauvais montant (HT au lieu de TTC ou l'inverse) | Les taxes sont mal calculees, la declaration est fausse | Saisir le montant HT et laisser Koraline calculer les taxes |
| Ne pas distinguer les ecritures personnelles | Melange fiscal, risque de penalites | Utiliser le compte "Avance a l'actionnaire" pour toute depense personnelle |
| Modifier une ecriture publiee au lieu de la corriger | Perte de piste d'audit, impossible de retracer l'erreur | Passer une contre-passation puis une nouvelle ecriture correcte |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **Quotidien** | Verifier que les ventes en ligne sont enregistrees, saisir les depenses du jour |
| **Hebdomadaire** | Saisir les factures fournisseurs recues, verifier les paiements Stripe verses en banque |
| **Mensuel** | Verifier les ecritures recurrentes (loyer, amortissement), publier les brouillons, verifier les totaux |
| **Trimestriel** | Exporter le journal pour la declaration TPS/TVQ, verifier la coherence globale |
| **Annuel** | Exporter le journal complet pour le comptable, passer les ecritures de cloture |

---

## Questions frequentes (FAQ)

**Q : Pourquoi une meme transaction apparait-elle dans plusieurs comptes ?**
R : C'est le principe de la comptabilite en partie double. Chaque transaction touche au minimum deux comptes (un debit et un credit). Si vous vendez pour 100 $ plus taxes, le journal enregistre un debit dans Comptes clients ET un credit dans Ventes ET un credit dans TPS a remettre ET un credit dans TVQ a remettre. Quatre comptes pour une seule vente.

**Q : Puis-je modifier une ecriture dans le journal ?**
R : Si la periode n'est pas cloturee, oui, via la page Ecritures. Si la periode est cloturee, vous devez passer une ecriture de contre-passation dans la periode suivante. Ne modifiez jamais directement une ecriture publiee -- la piste d'audit serait perdue.

**Q : Les ventes de la boutique apparaissent-elles automatiquement ?**
R : Oui. Chaque commande payee genere automatiquement les ecritures de vente, taxes et paiement dans le journal. Vous n'avez rien a saisir pour les ventes en ligne.

**Q : A quelle frequence dois-je verifier le journal ?**
R : Au minimum chaque semaine. Un coup d'oeil de 5 minutes pour verifier que les ecritures automatiques sont logiques et que rien ne manque. Plus vous verifiez souvent, plus les erreurs sont faciles a trouver et a corriger.

**Q : Que signifie "Brouillon" sur une ecriture ?**
R : Une ecriture en brouillon existe dans le systeme mais n'est pas comptabilisee dans les rapports financiers. Tant qu'elle n'est pas publiee, elle n'affecte pas les soldes, les etats financiers ou les declarations de taxes. Publiez-la une fois validee.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Journal general** | Registre chronologique de toutes les transactions financieres. Premiere etape d'enregistrement en comptabilite. |
| **Grand livre** | Meme information que le journal, mais organisee par compte au lieu de par date. Le grand livre est derive du journal. |
| **Partie double** | Principe selon lequel chaque transaction a un debit et un credit egaux. Le total des debits doit toujours egaliser le total des credits. |
| **Ecriture de journal** | Enregistrement d'une transaction avec date, description, comptes debites, comptes credites et montants. |
| **Contre-passation** | Ecriture inverse qui annule une ecriture erronee. Les debits deviennent des credits et vice versa. |
| **Piece justificative** | Document original prouvant qu'une transaction a eu lieu : facture, recu, contrat, releve de carte. |
| **Solde cumulatif** | Total courant d'un compte a mesure que les transactions s'accumulent. |
| **Reference** | Numero unique identifiant une transaction (FACT-2026-0423, PAY-0451, DEP-0122). Permet la tracabilite. |
| **Brouillon** | Ecriture sauvegardee mais pas encore publiee dans les livres comptables. N'affecte pas les rapports. |
| **Piste d'audit** | Enchainement tracable de toutes les modifications apportees aux ecritures. Essentiel pour les verifications fiscales. |

---

## Pages reliees

- [Plan comptable](01-plan-comptable.md) : Structure des comptes utilises dans le journal
- [Ecritures](03-ecritures.md) : Saisie manuelle d'ecritures de journal
- [Grand livre et balance](04-grand-livre.md) : Transactions regroupees par compte
- [Factures](07-factures.md) : Source de transactions de vente
- [Depenses](08-depenses.md) : Source de transactions de charge
- [Rapprochement](10-rapprochement.md) : Verification du journal contre le releve bancaire
