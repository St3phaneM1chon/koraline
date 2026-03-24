# Pipeline des Ventes et Deals

> **Section**: CRM > Pipeline / Deals
> **URL**: `/admin/crm/pipeline`, `/admin/crm/pipelines`, `/admin/crm/deals`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

Le **Pipeline des ventes** est la representation visuelle du parcours de vos opportunites commerciales, de la premiere prise de contact jusqu'a la conclusion de la vente. Les **Deals** sont les opportunites individuelles qui progressent dans ce pipeline.

**En tant que gestionnaire, vous pouvez :**
- Visualiser toutes vos opportunites de vente sous forme de colonnes (kanban)
- Creer de nouvelles opportunites (deals) et les faire progresser
- Configurer plusieurs pipelines pour differents processus de vente
- Suivre la valeur monetaire a chaque etape
- Identifier les deals bloques ou en retard
- Prevoir les revenus futurs grace aux probabilites par etape
- Glisser-deposer les deals entre les etapes
- Filtrer par representant, montant, date de cloture prevue
- Consulter les soumissions et contrats associes a un deal

---

## Concepts de base pour les debutants

### Qu'est-ce qu'un pipeline ?

Imaginez un entonnoir (ou un parcours) avec plusieurs etapes. Chaque nouveau prospect entre en haut, et a mesure qu'il progresse (il montre de l'interet, recoit une proposition, negocie), il descend dans les etapes. A la fin, il sort soit comme un **deal gagne** (il achete), soit comme un **deal perdu** (il renonce).

### Les etapes typiques d'un pipeline

```
Prospection → Qualification → Proposition → Negociation → Conclusion
   (100)         (60)           (30)          (15)          (5)
```

Les chiffres representent un exemple : sur 100 prospects, environ 5 deviendront clients. C'est normal. Le but du CRM est d'optimiser chaque etape pour augmenter ce chiffre.

### Qu'est-ce qu'un deal ?

Un **deal** (ou opportunite) est une vente potentielle avec un montant estime et une date de cloture prevue. Exemples :
- "Clinique Sante Plus - Commande initiale peptides collagene - 3 500 $CA"
- "Dr. Martin - Abonnement annuel BPC-157 - 8 400 $CA"

---

## Comment y acceder

### Page Pipeline (vue kanban)
1. CRM > **Pipeline** dans le panneau lateral
2. URL directe : `/admin/crm/pipeline`

### Page Pipelines (configuration des pipelines)
1. CRM > **Pipelines** dans le panneau lateral
2. URL directe : `/admin/crm/pipelines`

### Page Deals (vue liste)
1. CRM > **Deals** dans le panneau lateral
2. URL directe : `/admin/crm/deals`

---

## Vue d'ensemble de l'interface

### Vue Pipeline (Kanban)

L'interface affiche les deals sous forme de **colonnes** correspondant aux etapes :

| Colonne | Description | Probabilite |
|---------|-------------|-------------|
| **Prospection** | Premier contact etabli | 10% |
| **Qualification** | Besoin confirme, budget identifie | 25% |
| **Proposition** | Offre envoyee au prospect | 50% |
| **Negociation** | Discussion sur les termes, prix, conditions | 75% |
| **Gagne** | Vente conclue avec succes | 100% |
| **Perdu** | Opportunite abandonee ou refusee | 0% |

Chaque **carte de deal** dans une colonne affiche :
- Nom du deal et contact associe
- Montant estime
- Date de cloture prevue
- Representant assigne
- Tags et indicateurs de priorite

### En-tete du pipeline

En haut de chaque colonne :
- **Nombre de deals** dans l'etape
- **Valeur totale** de l'etape (somme des montants)
- **Valeur ponderee** (montant x probabilite de l'etape)

### Vue Deals (Liste)

Une vue tabulaire avec colonnes :
- Nom du deal
- Contact et entreprise
- Montant
- Etape actuelle
- Date de cloture prevue
- Representant
- Derniere activite

---

## Fonctionnalites detaillees

### 1. Creer un nouveau deal

**Etapes** :
1. Cliquez sur **Nouveau deal** dans le ruban
2. Remplissez les champs :
   - **Nom du deal** : description courte (ex: "Commande initiale - Clinique Sante Plus")
   - **Contact** : la personne associee (recherche par nom ou email)
   - **Entreprise** : l'entreprise associee (si B2B)
   - **Montant** : valeur estimee en $CA
   - **Pipeline** : quel pipeline utiliser (si vous en avez plusieurs)
   - **Etape** : l'etape initiale (generalement "Prospection")
   - **Date de cloture prevue** : quand vous esperez conclure
   - **Representant** : qui est en charge
3. Cliquez sur **Creer**

### 2. Faire progresser un deal

**Methode glisser-deposer** :
1. Cliquez sur la carte du deal dans le kanban
2. Maintenez le clic et faites-la glisser vers la colonne suivante
3. Relacher : le deal est maintenant a la nouvelle etape

**Methode manuelle** :
1. Cliquez sur le deal pour ouvrir son detail
2. Dans le champ **Etape**, selectionnez la nouvelle etape
3. Cliquez sur **Sauvegarder**

> **Note** : Chaque changement d'etape est enregistre dans l'historique du deal et peut declencher des automatisations (email au client, notification a l'equipe, etc.).

### 3. Marquer un deal comme gagne ou perdu

**Deal gagne** :
1. Glissez le deal dans la colonne **Gagne**, ou changez l'etape
2. Le systeme vous demandera de confirmer et d'indiquer le montant final
3. Le deal est archive et le revenu est comptabilise

**Deal perdu** :
1. Glissez le deal dans la colonne **Perdu**
2. Selectionnez une raison de perte (prix, timing, concurrent, pas de besoin, etc.)
3. Ajoutez un commentaire optionnel
4. Le deal est archive avec la raison de perte pour analyse future

### 4. Configurer un pipeline personnalise

**URL** : `/admin/crm/pipelines`

**Etapes** :
1. Cliquez sur **Nouveau pipeline**
2. Donnez-lui un nom (ex: "Pipeline B2B Cliniques", "Pipeline Abonnements")
3. Ajoutez les etapes avec leur nom et probabilite
4. Ordonnez les etapes par glisser-deposer
5. Cliquez sur **Sauvegarder**

> **Astuce** : Vous pouvez avoir un pipeline different pour la vente directe (individus) et la vente B2B (cliniques, pharmacies). Chaque pipeline a ses propres etapes et probabilites.

### 5. Soumissions et contrats

**Soumissions** (`/admin/crm/quotes`) :
- Creez des devis professionnels lies a un deal
- Envoyez-les directement par email
- Suivez si le client les a ouverts et acceptes

**Contrats** (`/admin/crm/contracts`) :
- Generez des contrats a partir de modeles
- Suivi des signatures et dates d'echeance
- Association automatique au deal

### 6. Previsions de vente

**URL** : `/admin/crm/forecast`

La page Forecast calcule automatiquement :
- **Revenu prevu** : somme des montants x probabilite par etape
- **Revenu pondere par mois** : projection temporelle
- **Objectifs vs realisation** : progression vers vos cibles

---

## Workflows courants

### Traitement d'un nouveau lead entrant
1. Un lead est cree (formulaire web, import, scraper)
2. Creez un deal associe dans le pipeline, etape "Prospection"
3. Effectuez un premier appel ou envoyez un email d'introduction
4. Si le besoin est confirme, passez a "Qualification"
5. Envoyez une proposition → etape "Proposition"
6. Negociez les termes → etape "Negociation"
7. Concluez la vente → etape "Gagne"

### Revue hebdomadaire du pipeline
1. Ouvrez la vue pipeline
2. Filtrez par representant (votre equipe)
3. Identifiez les deals bloques (meme etape depuis longtemps)
4. Pour chaque deal bloque, verifiez la derniere activite
5. Reassignez ou fermez les deals sans espoir

---

## Questions frequentes (FAQ)

**Q : Combien de pipelines puis-je creer ?**
R : Autant que necessaire. Il est recommande d'avoir au moins un pipeline par type de vente (B2C, B2B, abonnements).

**Q : Que se passe-t-il quand je marque un deal comme gagne ?**
R : Le montant est comptabilise dans vos rapports de revenu, le contact est marque comme client actif, et les automatisations associees se declenchent (email de bienvenue, creation de commande, etc.).

**Q : Puis-je modifier les etapes d'un pipeline existant ?**
R : Oui, mais avec precaution. Si des deals sont dans une etape que vous supprimez, ils seront deplaces vers l'etape precedente. Il est recommande de vider l'etape avant de la supprimer.

**Q : Comment suivre les raisons de perte ?**
R : Les raisons sont collectees quand un deal est marque comme perdu. Consultez les rapports d'analyse de l'entonnoir (Funnel Analysis) pour une vue d'ensemble des raisons les plus frequentes.

---

## Strategie expert : pipeline B2B adapte aux peptides de recherche

### Pourquoi un pipeline B2B specifique ?

Le cycle de vente B2B pour les peptides de recherche est fondamentalement different du B2C. Les clients B2B (universites, laboratoires de recherche, cliniques) ont des processus d'achat plus longs, necessitent des certificats d'analyse (COA), et commandent des volumes significatifs. Un pipeline B2B dedie permet de suivre ces ventes complexes.

### Etapes du pipeline B2B peptides

| Etape | Description | Duree moyenne | Probabilite | Actions cles |
|-------|-------------|---------------|-------------|-------------|
| **Premier contact** | Le laboratoire ou la clinique a ete identifie et un premier echange a eu lieu (email, formulaire, salon) | 1-2 semaines | 10% | Qualifier le besoin, identifier le decideur, envoyer la presentation BioCycle |
| **Echantillon/COA envoye** | Un echantillon gratuit ou un certificat d'analyse a ete envoye pour evaluation | 2-4 semaines | 25% | Envoyer COA, echantillon si politique le permet, repondre aux questions techniques |
| **Commande test (500 $CA+)** | Le client passe une premiere commande de test pour valider la qualite | 1-3 semaines | 50% | Livraison prioritaire, suivi qualite, appel de satisfaction a J+7 |
| **Compte regulier** | Le client commande regulierement (mensuel ou trimestriel) | Continu | 75% | Grille de prix volume, representant dedie, relance automatique de reapprovisionnement |
| **Contrat annuel** | Engagement formel avec volumes et prix negocies sur 12 mois | 2-4 semaines de negociation | 90% | Contrat signe, conditions de paiement net 30, prix bloque, livraison planifiee |
| **Gagne** | Contrat signe et premiere livraison effectuee | -- | 100% | Transition vers gestion de compte, onboarding B2B |
| **Perdu** | Le prospect a choisi un concurrent ou n'a plus besoin | -- | 0% | Documenter la raison, planifier un suivi dans 6 mois |

### Duree totale du cycle de vente B2B

| Type de client | Cycle court | Cycle moyen | Cycle long |
|---------------|-------------|-------------|------------|
| Clinique privee | 2 semaines | 4-6 semaines | 3 mois |
| Laboratoire universitaire | 4 semaines | 8-12 semaines | 6 mois (subventions) |
| Entreprise pharmaceutique | 8 semaines | 16-24 semaines | 12 mois |

Les laboratoires universitaires ont souvent des cycles longs car ils dependent de l'approbation de subventions de recherche (CRSNG, IRSC, FRQNT au Quebec).

### Taux de conversion par etape (benchmarks)

| Transition | Taux attendu | Signe d'alerte si < |
|-----------|-------------|---------------------|
| Premier contact → Echantillon/COA | 40-50% | 25% (mauvais ciblage) |
| Echantillon/COA → Commande test | 30-40% | 20% (probleme de qualite ou de prix) |
| Commande test → Compte regulier | 50-60% | 35% (experience client deficiente) |
| Compte regulier → Contrat annuel | 25-35% | 15% (offre de contrat mal presentee) |

### Metriques pipeline a surveiller

| Metrique | Calcul | Cible |
|----------|--------|-------|
| **Valeur totale pipeline** | Somme de tous les deals ouverts | > 3x votre objectif de revenu mensuel |
| **Valeur ponderee** | Somme (montant x probabilite) par deal | > 1.5x votre objectif mensuel |
| **Velocity** | Jours moyens pour passer de Premier contact a Gagne | < 60 jours (cliniques), < 120 jours (labos) |
| **Deals bloques** | Deals sans activite depuis > 14 jours | < 20% du pipeline total |
| **Win rate** | Deals gagnes / (Deals gagnes + Deals perdus) | > 25% |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Deal** | Opportunite de vente avec un montant et une date de cloture estimee |
| **Pipeline** | Succession d'etapes representant le processus de vente |
| **Etape** | Phase specifique dans le pipeline (ex: Qualification) |
| **Kanban** | Mode d'affichage en colonnes, chaque colonne etant une etape |
| **Probabilite** | Chance estimee de conclure le deal a cette etape |
| **Forecast** | Prevision des revenus bases sur le pipeline et les probabilites |
| **Soumission** | Devis formel envoye au prospect |
| **Deal gagne** | Opportunite conclue avec succes, vente realisee |
| **Deal perdu** | Opportunite qui n'a pas abouti |

---

## Pages reliees

- [Contacts](/admin/crm/contacts) : Fiches des contacts associes aux deals
- [Leads](/admin/crm/leads) : Prospects a convertir en deals
- [Previsions](/admin/crm/forecast) : Projections de revenus
- [Soumissions](/admin/crm/quotes) : Creation de devis
- [Contrats](/admin/crm/contracts) : Gestion des contrats
- [Leaderboard](/admin/crm/leaderboard) : Performance des representants
- [Analyse d'entonnoir](/admin/crm/funnel-analysis) : Rapports sur le pipeline
