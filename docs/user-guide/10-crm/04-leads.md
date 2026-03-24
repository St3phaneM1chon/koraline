# Gestion des Leads et Lead Scoring

> **Section**: CRM > Leads
> **URL**: `/admin/crm/leads`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Leads** centralise tous vos prospects - les personnes ou entreprises qui ont manifeste un interet pour BioCycle Peptides mais qui n'ont pas encore achete. Le **Lead Scoring** attribue automatiquement un score a chaque lead pour vous aider a prioriser vos efforts.

**En tant que gestionnaire, vous pouvez :**
- Voir la liste de tous les leads entrants
- Filtrer par source (site web, salon, referral, scraper, etc.)
- Trier par score de qualification (les plus "chauds" en premier)
- Assigner les leads aux representants commerciaux
- Qualifier ou disqualifier un lead
- Convertir un lead en contact + deal dans le pipeline
- Suivre la progression de chaque lead
- Configurer les regles de scoring automatique
- Definir des criteres de qualification (BANT, MEDDIC, etc.)

---

## Concepts de base pour les debutants

### Qu'est-ce qu'un lead ?

Un **lead** est un prospect qui a montre un premier signe d'interet : il a visite votre site, rempli un formulaire, demande des informations, ou a ete identifie par vos equipes. Ce n'est pas encore un client, c'est un potentiel.

### Qu'est-ce que le lead scoring ?

Le **lead scoring** est un systeme de points automatique. Chaque action d'un lead augmente (ou diminue) son score :

| Action | Points |
|--------|--------|
| Visite du site web | +2 |
| Telechargement d'un document | +10 |
| Ouverture d'un email | +3 |
| Clic dans un email | +5 |
| Visite de la page prix | +15 |
| Formulaire de contact rempli | +20 |
| Demande de devis | +30 |
| Inactivite 30 jours | -10 |
| Desabonnement newsletter | -20 |

Plus le score est eleve, plus le lead est "chaud" (pret a acheter).

### Classification des leads

| Score | Classification | Signification |
|-------|---------------|---------------|
| 0-20 | **Froid** | Interet minimal, a nourrir |
| 21-50 | **Tiede** | Interet modere, en phase d'information |
| 51-80 | **Chaud** | Interet fort, pret pour un contact commercial |
| 81-100 | **Brulant** | Besoin immediat, contacter d'urgence |

---

## Comment y acceder

1. Cliquez sur **CRM** dans la navigation horizontale
2. Dans le panneau lateral, cliquez sur **Leads**
3. URL directe : `/admin/crm/leads`

---

## Vue d'ensemble de l'interface

### 1. La barre de ruban

| Bouton | Fonction |
|--------|----------|
| **Nouveau lead** | Creer manuellement un lead |
| **Importer** | Importer des leads depuis CSV/Excel |
| **Convertir** | Convertir le lead en contact + deal |
| **Assigner** | Attribuer a un representant |
| **Disqualifier** | Marquer comme non pertinent |
| **Exporter** | Exporter les leads filtres |

### 2. Les onglets de statut

| Onglet | Description |
|--------|-------------|
| **Tous** | Tous les leads, quel que soit le statut |
| **Nouveaux** | Leads recemment arrives, pas encore traites |
| **En cours** | Leads en phase de qualification |
| **Qualifies** | Leads prets a etre convertis en deals |
| **Disqualifies** | Leads rejetes (pas de budget, hors cible, etc.) |

### 3. La liste des leads

Chaque ligne affiche :
- **Score** (barre coloree ou chiffre)
- Nom et entreprise
- Email et telephone
- Source d'acquisition
- Date d'arrivee
- Representant assigne
- Dernier contact

### 4. Le panneau de detail

Au clic sur un lead :
- Informations de profil completes
- Score detaille (quels criteres ont ete remplis)
- Timeline des interactions
- Notes de qualification
- Bouton de conversion rapide

---

## Fonctionnalites detaillees

### 1. Creer un lead manuellement

**Etapes** :
1. Cliquez sur **Nouveau lead**
2. Remplissez le formulaire :
   - Nom, prenom, email, telephone
   - Entreprise (si B2B)
   - Source : comment ce lead est arrive (salon, referral, appel entrant, etc.)
   - Notes initiales
3. Le systeme attribue un score initial base sur les informations fournies
4. Cliquez sur **Creer**

### 2. Qualifier un lead

**Objectif** : Determiner si un lead est un bon prospect.

**Methode BANT** (utilisee par defaut dans Koraline) :

| Critere | Question a poser | Poids |
|---------|------------------|-------|
| **B**udget | A-t-il les moyens d'acheter ? | 25% |
| **A**uthority | Est-il le decideur ? | 25% |
| **N**eed | A-t-il un besoin reel ? | 25% |
| **T**iming | Quand prevoit-il d'acheter ? | 25% |

**Etapes** :
1. Selectionnez le lead
2. Dans le detail, allez a l'onglet **Qualification**
3. Remplissez les criteres BANT
4. Le score de qualification se calcule automatiquement
5. Si le score est suffisant, le bouton **Convertir** devient actif

> **Page dediee** : `/admin/crm/qualification` pour configurer les criteres de qualification.

### 3. Convertir un lead en deal

**Objectif** : Transformer un prospect qualifie en opportunite de vente.

**Etapes** :
1. Selectionnez le lead qualifie
2. Cliquez sur **Convertir** dans le ruban
3. Le systeme cree automatiquement :
   - Un **contact** (si le lead n'etait pas deja un contact)
   - Un **deal** dans le pipeline, a l'etape "Qualification"
4. Confirmez les informations pre-remplies
5. Cliquez sur **Convertir**

> **Important** : Le lead est archive apres conversion. Son historique est conserve sur la fiche contact.

### 4. Configurer le scoring automatique

**URL** : `/admin/crm/qualification`

**Etapes** :
1. Allez dans CRM > Automatisation > Qualification
2. Definissez les criteres demographiques (secteur, taille entreprise, poste)
3. Definissez les criteres comportementaux (actions sur le site, emails)
4. Attribuez des points a chaque critere
5. Definissez le seuil de qualification (ex: 60 points = lead qualifie)
6. Sauvegardez

### 5. Distribution automatique des leads

**URL** : `/admin/crm/workflows`

Configurez des regles pour assigner automatiquement les leads :
- **Round-robin** : distribution equitable entre les representants
- **Par territoire** : Quebec → Rep A, Ontario → Rep B
- **Par specialite** : Cliniques → Rep senior, Individus → Rep junior
- **Par score** : Leads chauds → meilleur vendeur

---

## Workflows courants

### Traitement quotidien des leads
1. Filtrez les leads **Nouveaux** (non traites)
2. Pour chaque lead, evaluez rapidement la qualite :
   - Source fiable ? Email professionnel ?
   - Score automatique eleve ?
3. Les bons leads : assignez a un representant, ajoutez une tache de premier contact
4. Les mauvais leads : disqualifiez avec une raison
5. Les leads trop froids : ajoutez a une sequence de nurturing automatisee

### Nurturing des leads tiedes
1. Identifiez les leads avec un score de 20-50
2. Ajoutez-les a une liste de nurturing
3. Lancez une sequence d'emails automatisee (voir Automatisations)
4. Quand le score augmente au-dessus de 50, le lead est notifie comme "chaud"

---

## Questions frequentes (FAQ)

**Q : D'ou viennent les leads automatiquement ?**
R : Depuis plusieurs sources : formulaire de contact du site web, inscription a la newsletter, scraper web (voir page Scraper), importation CSV, et referencement par d'autres clients.

**Q : Que se passe-t-il si je disqualifie un lead ?**
R : Il est deplace dans la liste "Disqualifies" mais n'est pas supprime. Vous pouvez le requalifier plus tard si la situation change.

**Q : Le scoring fonctionne-t-il automatiquement ?**
R : Oui. Une fois les regles configurees, le score se met a jour en temps reel a chaque action du lead (visite web, ouverture email, etc.).

**Q : Combien de temps faut-il garder les leads non convertis ?**
R : En general, 6 a 12 mois. Passee cette periode, les leads inactifs sont automatiquement archives (si vous activez cette option dans les workflows).

---

## Strategie expert : scoring BANT adapte au marche des peptides

### BANT classique vs BANT peptides

La methode BANT (Budget, Authority, Need, Timing) est le standard de qualification des leads. Pour BioCycle Peptides, chaque critere doit etre adapte au contexte specifique des peptides de recherche au Canada.

### Budget : evaluer la capacite financiere

| Signal | Points | Interpretation |
|--------|--------|---------------|
| Institutions financees (universite, hopital, pharma) | +25 | Budget recherche disponible |
| Clinique privee ou labo independant | +15 | Budget discreionnaire, decision rapide |
| Individu avec historique d'achats > 500 $CA | +15 | Acheteur recurrent confirme |
| Demande de grille de prix volume | +20 | Intention d'achat significatif |
| Etudiant ou demande "d'echantillon gratuit" | +5 | Budget limite, potentiel a long terme |
| Aucune information budget | +0 | A qualifier en priorite |

**Question cle a poser** : "Quel est le budget recherche alloue pour les reactifs et peptides cette annee ?"

### Authority : identifier le decideur

| Signal | Points | Interpretation |
|--------|--------|---------------|
| Titre : PI (Principal Investigator), Directeur labo, Chef de recherche | +25 | Decideur direct |
| Titre : Responsable achats, Procurement | +20 | Decideur achat |
| Titre : Post-doc, Chercheur associe | +15 | Influenceur, recommande au PI |
| Titre : Etudiant MSc/PhD | +10 | Utilisateur, influence indirecte |
| Aucun titre ou titre generique | +5 | A qualifier |

**Question cle a poser** : "Qui valide les commandes de reactifs dans votre laboratoire ?"

### Need : identifier le besoin specifique

| Signal | Points | Interpretation |
|--------|--------|---------------|
| Demande un peptide specifique par nom (BPC-157, CJC-1295) | +25 | Besoin precis et immediat |
| Demande un COA ou une fiche technique | +20 | En phase d'evaluation serieuse |
| Recherche sur le site : pages produit visitees | +15 | Interet actif |
| Question generique "que sont les peptides" | +5 | Phase de decouverte, besoin a developper |
| Interet pour categorie specifique (reparation, GH, immunitaire) | +15 | Besoin identifie par domaine |

**Question cle a poser** : "Sur quel projet de recherche travaillez-vous et quels peptides envisagez-vous ?"

### Timing : evaluer l'urgence

| Signal | Points | Interpretation |
|--------|--------|---------------|
| "Nous avons besoin pour cette semaine/ce mois" | +25 | Urgence elevee, priorite maximale |
| "Projet demarre au prochain trimestre" | +15 | Pipeline planifie |
| "Nous evaluons les fournisseurs" | +10 | Phase de comparaison |
| "Subvention en attente d'approbation" | +10 | Potentiel mais conditionnel |
| "Pas de timeline precise" | +5 | A nourrir |

**Question cle a poser** : "Quand prevoyez-vous de passer votre premiere commande ?"

### Grille de scoring totale

| Score total BANT | Classification | Action |
|-----------------|---------------|--------|
| 80-100 | **Brulant** | Appeler dans l'heure, proposer une offre immediate |
| 60-79 | **Chaud** | Appeler dans les 24h, envoyer une proposition |
| 40-59 | **Tiede** | Sequence email nurturing, suivi dans 1-2 semaines |
| 20-39 | **Froid** | Ajouter au nurturing automatise, contenu educatif |
| 0-19 | **Non qualifie** | Surveiller passivement, pas d'effort commercial direct |

### Sources de leads specifiques aux peptides

| Source | Volume | Qualite | Cout | Strategie |
|--------|--------|---------|------|-----------|
| **Google Ads "buy peptides Canada"** | Moyen | Haute (intention transactionnelle) | 2-5 $CA/clic | Mots-cles exacts, landing pages dediees |
| **Google Ads "peptides for research"** | Moyen | Haute | 1-3 $CA/clic | Contenu educatif + conversion |
| **SEO / Blog organique** | Eleve (long terme) | Moyenne | Cout de redaction | Articles longue traine, guides |
| **PubMed / Google Scholar** | Faible mais premium | Tres haute (chercheurs) | Temps de prospection | Identifier les labos publiant sur les peptides |
| **Conferences scientifiques** | Faible | Tres haute | Frais de participation | Kiosque, networking, collecte de cartes |
| **LinkedIn (recherche ciblee)** | Moyen | Haute si bien cible | Temps + LinkedIn Sales Navigator | Cibler PI, directeurs de labo, responsables achats |
| **Reddit (r/peptides, r/Nootropics)** | Moyen | Basse a moyenne | Gratuit | Veille, identification de tendances, pas de prospection directe |
| **Referral (bouche a oreille)** | Faible | Tres haute (confiance) | Programme ambassadeur | Recompenser les recommandations |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Lead** | Prospect ayant manifeste un interet initial |
| **Lead scoring** | Attribution automatique d'un score base sur le profil et le comportement |
| **Qualification** | Processus de verification qu'un lead est un bon prospect |
| **BANT** | Methode de qualification : Budget, Authority, Need, Timing |
| **Conversion** | Transformation d'un lead en contact + deal |
| **Nurturing** | Actions de "nourrissage" pour faire murir un lead pas encore pret |
| **MQL** | Marketing Qualified Lead : lead qualifie par le marketing |
| **SQL** | Sales Qualified Lead : lead qualifie par les ventes |

---

## Pages reliees

- [Contacts](/admin/crm/contacts) : Fiches des contacts (apres conversion)
- [Pipeline](/admin/crm/pipeline) : Ou arrivent les deals apres conversion
- [Scraper](/admin/scraper) : Outil de generation de leads web
- [Listes et Segments](/admin/crm/lists) : Organisation des leads par groupes
- [Automatisations](/admin/crm/workflows) : Regles de scoring et distribution
- [Formulaires](/admin/crm/forms) : Formulaires web capturant des leads
