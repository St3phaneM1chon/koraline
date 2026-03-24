# Factures Clients et Fournisseurs

> **Section**: Comptabilite > Factures
> **URL**: `/admin/comptabilite/factures-clients`, `/admin/comptabilite/factures-fournisseurs`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~35 minutes

---

## Pourquoi cette page est importante

Les factures sont les **documents fondamentaux de toute transaction commerciale**. La facture client prouve qu'un client vous doit de l'argent. La facture fournisseur prouve que vous devez de l'argent a un fournisseur. Sans factures correctes, impossible de declarer les taxes, impossible de reclamer les credits d'intrants, et impossible de prouver vos revenus ou deductions a l'ARC.

**Obligations legales** :
- Au Quebec, toute facture de plus de 30 $ doit inclure le nom et l'adresse de l'emetteur, les numeros de TPS et TVQ, un numero de facture unique, la date, la description des biens/services, le montant avant taxes, la TPS et la TVQ separees, et le total TTC.
- L'ARC exige des factures conformes pour accorder les CTI (credits de taxe sur intrants). Sans facture valide du fournisseur, vous ne pouvez pas recuperer la TPS/TVQ payee.
- Les factures doivent etre conservees pendant **6 ans** apres la fin de l'annee d'imposition.
- Les numeros de TPS et TVQ de l'emetteur doivent etre reels et verifiables.

**Impact concret** :
- Une facture mal redigee peut entrainer le refus des CTI/RTI lors d'une verification -- vous perdez 14,975% du montant.
- Des factures clients non suivies = de l'argent non collecte = problemes de tresorerie.
- Des factures fournisseurs non saisies = des charges manquantes = impots trop eleves.

---

## Cycle comptable complet -- Ou se situe cette page

```
 1. Plan comptable → 2. Journal → 3. Ecritures → 4. Grand livre/Balance
 ↓
 5. Bilan → 6. Etat des resultats
 ↓
[7. FACTURES] ← VOUS ETES ICI (source des revenus et des achats)
 ↓
 8. Depenses → 9. Taxes TPS/TVQ → 10. Rapprochement
 ↓
 11. Budget → 12. Rapports
```

Les factures sont une source majeure de transactions dans le journal. Chaque facture client genere automatiquement une ecriture de vente (revenu + taxes collectees). Chaque facture fournisseur genere une ecriture d'achat (charge + taxes recuperables). Ces ecritures alimentent le grand livre, le bilan (comptes clients/fournisseurs) et l'etat des resultats (revenus/charges).

---

## Ordre des operations

### Pour une facture client

1. Le service ou le produit est livre au client
2. **Creer la facture** dans Koraline (ou elle est generee automatiquement par une commande en ligne)
3. **Envoyer la facture** au client (par email avec lien de paiement Stripe)
4. **Suivre le paiement** -- la facture reste "en attente" jusqu'au reglement
5. **Enregistrer le paiement** quand il arrive (automatique pour Stripe, manuel pour virement/cheque)
6. **Relancer** si le paiement est en retard (a 30, 60, 90 jours)
7. **Provisionner** si le paiement semble compromis (creance douteuse)

### Pour une facture fournisseur

1. Vous recevez la marchandise ou le service du fournisseur
2. Vous recevez la facture du fournisseur
3. **Saisir la facture** dans Koraline (manuellement ou par OCR)
4. **Verifier** que les montants et les taxes sont corrects
5. **Joindre** la facture originale (PDF ou photo)
6. **Payer** a l'echeance prevue
7. **Enregistrer le paiement** dans Koraline

---

## Comment entrer les donnees

### Creer une facture client

**URL** : `/admin/comptabilite/factures-clients`

1. Cliquez sur **Nouvelle facture**
2. Remplissez l'en-tete :

| Champ | Quoi mettre | Exemple | Pourquoi |
|-------|------------|---------|----------|
| **Client** | Selectionnez ou creez le client | Clinique Sante Plus | Lien avec le CRM, adresse de facturation |
| **Date de facture** | Date d'emission | 2026-03-15 | Date a laquelle le revenu est reconnu |
| **Date d'echeance** | Date limite de paiement | 2026-04-14 (Net 30) | Determine quand la facture est en retard |
| **Numero** | Genere automatiquement | FACT-2026-0423 | Identifiant unique, obligatoire au Quebec |
| **Devise** | CAD par defaut | CAD | USD possible pour les clients hors Canada |

3. Ajoutez les lignes de facture :

| Ligne | Description | Quantite | Prix unitaire | Total |
|-------|-------------|----------|--------------|-------|
| 1 | BPC-157 Oral 60 capsules | 10 | 89,95 $ | 899,50 $ |
| 2 | TB-500 Injectable 5mg | 5 | 79,95 $ | 399,75 $ |
| 3 | Frais de livraison | 1 | 25,00 $ | 25,00 $ |

4. Les taxes sont calculees automatiquement :
   - Sous-total : 1 324,25 $
   - TPS (5%) : 66,21 $
   - TVQ (9,975%) : 132,04 $
   - **Total TTC : 1 522,50 $**

5. Ajoutez des notes ou conditions (optionnel)
6. Choisissez : **Sauvegarder** (brouillon) ou **Envoyer** (envoi par email au client)

### Ecriture comptable generee automatiquement (facture client)

```
Debit  1100 - Comptes clients        1 522,50 $
Credit 4010 - Ventes peptides                      1 324,25 $
Credit 2100 - TPS a remettre                          66,21 $
Credit 2110 - TVQ a remettre                         132,04 $
```

**Logique** : Le client nous doit le montant TTC (actif augmente au debit). Nous reconnaissons le revenu HT (revenu augmente au credit). Nous devons remettre les taxes aux gouvernements (passif augmente au credit).

### Enregistrer le paiement d'un client

1. Ouvrez la facture concernee
2. Cliquez sur **Enregistrer paiement**
3. Remplissez :

| Champ | Quoi mettre | Pourquoi |
|-------|------------|---------|
| **Montant** | Montant recu | Peut etre partiel |
| **Date** | Date du paiement | Date du virement ou du depot |
| **Mode** | Carte (Stripe), virement, cheque | Tracabilite |
| **Reference** | Numero de transaction | Pour le rapprochement bancaire |

4. Cliquez sur **Confirmer**

**Note** : Les paiements Stripe sont enregistres automatiquement. Vous ne saisissez manuellement que les virements et cheques.

### Ecriture comptable generee (paiement recu)

```
Debit  1010 - Banque TD               1 522,50 $
Credit 1100 - Comptes clients                      1 522,50 $
```

**Logique** : L'argent arrive en banque (actif augmente au debit). Le client ne nous doit plus rien (actif diminue au credit).

### Saisir une facture fournisseur

**URL** : `/admin/comptabilite/factures-fournisseurs`

1. Cliquez sur **Nouvelle facture**
2. Remplissez :

| Champ | Quoi mettre | Exemple | Pourquoi |
|-------|------------|---------|----------|
| **Fournisseur** | Selectionnez ou creez | PeptideLab Inc. | Lien avec le registre fournisseurs |
| **Numero de facture** | Celui du fournisseur | PL-2026-1158 | Pour tracer la facture originale |
| **Date de facture** | Date sur la facture | 2026-03-10 | Date de reconnaissance de la charge |
| **Date d'echeance** | Echeance de paiement | 2026-04-09 | Pour la gestion de tresorerie |

3. Ajoutez les lignes (description, montant HT)
4. Les taxes sont separees automatiquement : TPS recuperable et TVQ recuperable
5. **Joignez la facture originale** (PDF ou photo) -- obligatoire pour reclamer les CTI/RTI
6. Cliquez sur **Sauvegarder**

### Ecriture comptable generee (facture fournisseur)

```
Debit  5011 - Achats matieres         5 000,00 $
Debit  1150 - TPS intrants              250,00 $
Debit  1160 - TVQ intrants              498,75 $
Credit 2010 - Comptes fournisseurs                  5 748,75 $
```

**Logique** : Nous avons une charge de 5 000 $ (charge augmente au debit). Les taxes payees sont recuperables (actif augmente au debit). Nous devons 5 748,75 $ au fournisseur (passif augmente au credit).

---

## Pourquoi entrer ces donnees

### Factures clients

| Raison | Explication |
|--------|-------------|
| **Reconnaissance du revenu** | Le revenu est reconnu a la date de la facture, pas a la date du paiement. C'est la norme comptable (comptabilite d'exercice). |
| **Suivi des comptes clients** | Savoir exactement combien les clients doivent et depuis quand. |
| **Declaration TPS/TVQ** | Les taxes collectees doivent etre declarees dans la bonne periode. |
| **Tresorerie** | Prevoir les entrees d'argent basees sur les echeances des factures. |

### Factures fournisseurs

| Raison | Explication |
|--------|-------------|
| **Reconnaissance de la charge** | La charge est reconnue a la date de la facture, pas a la date du paiement. |
| **Credits d'intrants (CTI/RTI)** | Sans la facture fournisseur avec le bon numero de TPS/TVQ, vous ne pouvez pas reclamer les credits. |
| **Suivi des comptes fournisseurs** | Savoir exactement combien vous devez et a quelle echeance. |
| **Deductions fiscales** | Chaque facture fournisseur est une deduction potentielle de vos impots. Sans piece justificative, pas de deduction. |

---

## Gerer les cas particuliers

### Factures en retard -- Relance client

Le systeme identifie automatiquement les factures dont l'echeance est depassee.

| Anciennete | Action recommandee |
|-----------|-------------------|
| 30 jours | Envoyer un rappel amical par email |
| 60 jours | Appeler le client, envoyer un rappel formel |
| 90 jours | Lettre de mise en demeure, provisionner 50% |
| 120+ jours | Envisager l'agence de recouvrement, provisionner 100% |

### Notes de credit

**URL** : `/admin/comptabilite/notes-credit`

**Quand** : Retour de marchandise, erreur de facturation, remise accordee apres coup.

1. Cliquez sur **Nouvelle note de credit**
2. Selectionnez la facture originale
3. Indiquez le montant a crediter et la raison
4. La note de credit genere l'ecriture inverse :

```
Debit  4010 - Ventes peptides            200,00 $
Debit  2100 - TPS a remettre              10,00 $
Debit  2110 - TVQ a remettre              19,95 $
Credit 1100 - Comptes clients                        229,95 $
```

### Paiements partiels

Un client peut payer en plusieurs fois. Enregistrez chaque paiement separement. Le solde restant est calcule automatiquement. La facture passe en statut "Partiellement payee".

### Factures en devises etrangeres (USD)

Si un fournisseur facture en USD :
1. Saisissez le montant en USD
2. Koraline convertit au taux du jour en CAD
3. Le gain ou la perte de change est comptabilise automatiquement au moment du paiement si le taux a change

---

## La cloture mensuelle des comptes a recevoir et a payer

### Processus mensuel pour les comptes clients

| Etape | Action | Pourquoi |
|-------|--------|---------|
| 1 | Verifier que toutes les factures du mois sont creees | Revenu complet pour l'etat des resultats |
| 2 | Verifier que tous les paiements recus sont enregistres | Comptes clients a jour |
| 3 | Generer le rapport d'anciennete (Aging) | Identifier les retards |
| 4 | Relancer les factures a 30+ jours | Accelerer les encaissements |
| 5 | Provisionner les creances a 90+ jours | Refleter le risque dans les etats financiers |

### Processus mensuel pour les comptes fournisseurs

| Etape | Action | Pourquoi |
|-------|--------|---------|
| 1 | Verifier que toutes les factures recues sont saisies | Charges completes, CTI/RTI complets |
| 2 | Verifier les echeances de paiement | Eviter les penalites de retard |
| 3 | Payer les factures a echeance | Maintenir la relation fournisseur |
| 4 | Enregistrer les paiements | Comptes fournisseurs a jour |

### Politique d'escompte -- Quand payer en avance

Certains fournisseurs offrent un escompte pour paiement rapide (ex: "2/10 Net 30" = 2% d'escompte si paye en 10 jours au lieu de 30). Pour BioCycle :

```
Facture fournisseur : 5 000 $ HT
Conditions : 2/10 Net 30

Option A : Payer en 10 jours
  Montant : 5 000 $ x (1 - 2%) = 4 900 $
  Economie : 100 $

Option B : Payer en 30 jours
  Montant : 5 000 $
  Cout de l'attente de 20 jours : 100 $

Taux annualise de l'escompte : (2% / 98%) x (365 / 20) = 37,2% par an
```

Un taux de 37,2% est bien superieur au cout d'emprunt bancaire (~6-8%). Il est presque toujours avantageux de prendre l'escompte si la tresorerie le permet.

---

## Erreurs courantes a eviter

| Erreur | Consequence | Comment eviter |
|--------|-------------|----------------|
| Facture client sans numeros TPS/TVQ | Le client ne peut pas reclamer ses CTI/RTI | Configurer les numeros TPS/TVQ dans les parametres |
| Facture fournisseur sans piece jointe | CTI/RTI refuses lors d'une verification ARC | Toujours joindre le PDF original de la facture fournisseur |
| Ne pas verifier le numero de TPS/TVQ du fournisseur | Si le numero est invalide, vos CTI/RTI sont refuses | Verifier les numeros sur le site de l'ARC avant la premiere facture |
| Saisir le montant TTC au lieu de HT | Les taxes sont calculees en double | Toujours saisir le montant HT, Koraline calcule les taxes |
| Ne pas relancer les factures en retard | L'argent ne rentre jamais, la creance devient irrecuperable | Mettre en place le processus de relance automatique |
| Modifier une facture envoyee au lieu d'emettre une note de credit | Le client a deja un exemplaire different, conflit | Toujours emettre une note de credit puis une nouvelle facture |

---

## Quand faire cette operation

| Frequence | Action |
|-----------|--------|
| **A chaque vente B2B** | Creer et envoyer la facture client |
| **A chaque reception de facture** | Saisir la facture fournisseur (meme jour si possible) |
| **Hebdomadaire** | Verifier les factures clients en attente, relancer si necessaire |
| **Fin de mois** | Verifier que toutes les factures du mois sont saisies, verifier l'anciennete |
| **Fin de trimestre** | Exporter la liste des factures pour la declaration TPS/TVQ |

---

## Questions frequentes (FAQ)

**Q : Les commandes de la boutique en ligne generent-elles des factures automatiquement ?**
R : Oui. Chaque commande payee genere une facture client dans le module comptabilite avec les ecritures correspondantes. Vous n'avez rien a saisir pour les ventes en ligne.

**Q : Puis-je modifier une facture envoyee ?**
R : Non directement. La facture envoyee est un document legal. Pour corriger, emettez une note de credit pour annuler l'originale, puis creez une nouvelle facture corrigee.

**Q : Comment gerer les paiements partiels ?**
R : Enregistrez le montant recu. Le solde restant est automatiquement calcule. La facture passe en statut "Partiellement payee" et reste dans la liste des comptes a recevoir.

**Q : Les taxes sont-elles calculees automatiquement ?**
R : Oui. La TPS (5%) et la TVQ (9,975%) sont appliquees automatiquement. Certains produits ou services peuvent etre exemptes ou detaxes -- configurez le statut fiscal dans les parametres produit.

**Q : Comment savoir si un fournisseur a un numero de TPS/TVQ valide ?**
R : Utilisez le service de verification en ligne de l'ARC (Registre des entreprises GST/HST) et de Revenu Quebec. Koraline peut stocker les numeros verifies dans la fiche fournisseur.

---

## Glossaire

| Terme | Definition comptable |
|-------|---------------------|
| **Comptes a recevoir** | Montants que les clients doivent a l'entreprise. Aussi appeles "debiteurs". Poste d'actif au bilan. |
| **Comptes a payer** | Montants que l'entreprise doit a ses fournisseurs. Aussi appeles "crediteurs". Poste de passif au bilan. |
| **Net 30** | Conditions de paiement : la facture est payable dans les 30 jours suivant son emission. |
| **2/10 Net 30** | Escompte de 2% si paye en 10 jours, sinon plein prix en 30 jours. Encourager le paiement rapide. |
| **Note de credit** | Document comptable qui reduit le montant d'une facture. Inverse d'une facture. Genere une ecriture de contre-passation. |
| **TTC** | Toutes Taxes Comprises. Montant final incluant TPS et TVQ. |
| **HT** | Hors Taxes. Montant avant ajout de la TPS et TVQ. Base de calcul des taxes. |
| **Aging** | Analyse d'anciennete qui classe les factures impayees par tranche d'age (0-30, 31-60, 61-90, 90+ jours). |
| **Comptabilite d'exercice** | Methode comptable qui reconnait les revenus et charges a la date de la transaction (facture), pas du paiement. |

---

## Pages reliees

- [Grand livre](04-grand-livre.md) : Ecritures generees par les factures
- [Depenses](08-depenses.md) : Saisie simplifiee des charges (alternative aux factures fournisseurs)
- [Taxes TPS/TVQ](09-taxes.md) : Declarations basees sur les taxes des factures
- [Rapprochement](10-rapprochement.md) : Verification des paiements recus en banque
- [Ecritures](03-ecritures.md) : Detail technique des ecritures generees par les factures
