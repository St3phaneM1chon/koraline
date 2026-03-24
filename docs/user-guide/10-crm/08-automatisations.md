# Automatisations, Workflows et Sequences

> **Section**: CRM > Automatisation
> **URL**: `/admin/crm/workflows`, `/admin/crm/campaigns`, `/admin/crm/sms-campaigns`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~30 minutes

---

## A quoi sert cette page ?

La section **Automatisation** regroupe tous les outils pour automatiser vos processus commerciaux : envoi d'emails, creation de taches, attribution de leads, sequences de nurturing, campagnes marketing, et controle qualite.

**En tant que gestionnaire, vous pouvez :**
- Creer des workflows automatises (si X alors Y)
- Configurer des sequences d'emails pour les leads et clients
- Lancer des campagnes email et SMS ciblees
- Automatiser l'attribution des leads aux representants
- Definir des regles de conformite et de controle qualite
- Creer des formulaires web capturant des leads
- Gerer des playbooks (guides de vente standardises)
- Suivre les performances des workflows et campagnes

---

## Concepts de base pour les debutants

### Qu'est-ce qu'un workflow ?

Un **workflow** est une serie d'actions automatiques declenchees par un evenement. C'est comme un assistant invisible qui execute des taches a votre place.

**Exemple concret** :
```
EVENEMENT: Un nouveau lead est cree
  → ACTION 1: Attribuer au representant de garde
  → ACTION 2: Envoyer un email de bienvenue
  → ATTENDRE: 2 jours
  → CONDITION: Le lead a-t-il ouvert l'email ?
    → OUI: Creer une tache "Appeler le lead"
    → NON: Envoyer un deuxieme email
```

### Qu'est-ce qu'une sequence ?

Une **sequence** est une serie d'emails envoyes automatiquement a intervalle regulier. C'est un workflow simplifie, specialise dans l'email.

**Exemple** :
- Jour 0 : Email de bienvenue + presentation BioCycle
- Jour 3 : Email educatif sur les peptides
- Jour 7 : Temoignages de clients satisfaits
- Jour 14 : Offre speciale premiere commande

### Qu'est-ce qu'une campagne ?

Une **campagne** est un envoi ponctuel d'un email ou SMS a un groupe de contacts. Contrairement a une sequence (automatique et continue), une campagne est un envoi unique, a une date precise.

---

## Comment y acceder

Les sous-pages de la section Automatisation sont dans le groupe **Automatisation** du panneau CRM :

| Page | URL | Description |
|------|-----|-------------|
| **Workflows** | `/admin/crm/workflows` | Generateur de workflows |
| **Campagnes email** | `/admin/crm/campaigns` | Campagnes d'email marketing |
| **Campagnes SMS** | `/admin/crm/sms-campaigns` | Campagnes SMS |
| **Modeles SMS** | `/admin/crm/sms-templates` | Modeles de messages SMS |
| **Snippets** | `/admin/crm/snippets` | Blocs de texte reutilisables |
| **Base de connaissances** | `/admin/crm/knowledge-base` | Articles d'aide pour l'equipe |
| **Tickets** | `/admin/crm/tickets` | Support client integre |
| **Conformite** | `/admin/crm/compliance` | Regles de conformite (Loi 25, LPRPDE) |
| **Controle qualite** | `/admin/crm/qa` | Evaluation de la qualite des interactions |
| **Formulaires** | `/admin/crm/forms` | Formulaires web capturant des leads |
| **Playbooks** | `/admin/crm/playbooks` | Guides de vente standardises |
| **Analyse workflows** | `/admin/crm/workflow-analytics` | Performances des automatisations |

---

## Fonctionnalites detaillees

### 1. Creer un workflow

**URL** : `/admin/crm/workflows`

**Etapes** :
1. Cliquez sur **Nouveau workflow**
2. Choisissez un **declencheur** (trigger) :

| Declencheur | Description |
|-------------|-------------|
| **Nouveau lead** | Quand un lead est cree |
| **Deal change d'etape** | Quand un deal passe a une nouvelle etape |
| **Contact modifie** | Quand les informations d'un contact changent |
| **Tag ajoute** | Quand un tag specifique est ajoute a un contact |
| **Formulaire soumis** | Quand un formulaire web est rempli |
| **Commande passee** | Quand un client passe une commande |
| **Inactivite** | Quand un contact est inactif depuis X jours |
| **Score atteint** | Quand le lead scoring atteint un seuil |

3. Ajoutez des **actions** en sequence :

| Action | Description |
|--------|-------------|
| **Envoyer email** | Envoyer un email automatique (choisir un modele) |
| **Envoyer SMS** | Envoyer un SMS (necessite un modele SMS) |
| **Creer tache** | Creer une tache pour un representant |
| **Modifier contact** | Mettre a jour un champ du contact |
| **Ajouter tag** | Ajouter un tag au contact |
| **Assigner** | Attribuer le contact a un representant |
| **Notifier** | Envoyer une notification a un membre de l'equipe |
| **Attendre** | Pause de X minutes/heures/jours avant l'action suivante |
| **Condition** | Branchement si/sinon selon un critere |
| **Webhook** | Appeler un service externe |

4. Connectez les actions entre elles en glissant-deposant les connecteurs
5. Cliquez sur **Sauvegarder** puis **Activer**

> **Attention** : Testez toujours un workflow avec un contact de test avant de l'activer pour tous.

### 2. Creer une campagne email

**URL** : `/admin/crm/campaigns`

**Etapes** :
1. Cliquez sur **Nouvelle campagne**
2. Definissez les parametres :
   - **Nom** de la campagne
   - **Expediteur** : nom et email de l'expediteur
   - **Objet** : la ligne d'objet de l'email
   - **Audience** : selectionnez une liste ou un segment
3. Redigez le contenu :
   - Utilisez l'editeur visuel (drag & drop)
   - Ou collez du HTML pour les utilisateurs avances
   - Inserez des variables de personnalisation ({prenom}, {entreprise}, etc.)
4. **Previsualiser** : verifiez le rendu sur desktop et mobile
5. **Tester** : envoyez-vous un email de test
6. **Planifier** ou **Envoyer maintenant**

**Metriques suivies apres l'envoi** :
- Taux d'ouverture (%)
- Taux de clic (%)
- Taux de desabonnement (%)
- Taux de rebond (emails invalides)
- Conversions (si lien vers la boutique)

### 3. Creer une campagne SMS

**URL** : `/admin/crm/sms-campaigns`

**Etapes** :
1. Cliquez sur **Nouvelle campagne SMS**
2. Selectionnez un **modele SMS** ou redigez le message (max 160 caracteres)
3. Choisissez l'**audience** (liste ou segment)
4. Planifiez l'envoi
5. Le systeme verifie que les contacts ont un numero de telephone valide

> **Important** : Les SMS sont soumis a la legislation canadienne (LPRPDE/Loi 25). Le consentement du contact est obligatoire avant l'envoi.

### 4. Conformite et consentement

**URL** : `/admin/crm/compliance`

Cette page gere :
- **Consentements** : quels contacts ont accepte de recevoir des communications
- **Loi 25 (Quebec)** : gestion des preferences de confidentialite
- **LPRPDE (federal)** : conformite a la loi canadienne sur la protection des renseignements
- **Desabonnements** : traitement automatique des demandes de retrait
- **Journal d'audit** : tracabilite de tous les consentements (quand, comment, par qui)

### 5. Playbooks de vente

**URL** : `/admin/crm/playbooks`

Un **playbook** est un guide standardise que vos representants suivent pour un processus specifique :
- **Playbook premier appel** : quoi dire, quelles questions poser
- **Playbook objections prix** : reponses aux objections courantes
- **Playbook upsell** : comment proposer des produits complementaires
- **Playbook reactivation** : comment recuperer un client inactif

### 6. Boite de reception unifiee

**URL** : `/admin/crm/inbox`

La boite de reception centralise :
- Emails recus des contacts
- Messages de formulaires web
- Conversations chat en direct
- Reponses aux campagnes

Chaque message est automatiquement associe a la fiche contact correspondante.

---

## Workflows courants

### Sequence de bienvenue nouveau client
1. **Declencheur** : Premiere commande passee
2. **Jour 0** : Email de remerciement + confirmation commande
3. **Jour 3** : Email "Comment utiliser vos peptides" (guide)
4. **Jour 7** : Email demandant un avis sur le produit
5. **Jour 30** : Email avec offre de reabonnement

### Workflow d'attribution automatique des leads
1. **Declencheur** : Nouveau lead cree
2. **Condition** : Source du lead ?
   - Si formulaire B2B → assigner au representant B2B
   - Si boutique en ligne → assigner en round-robin
   - Si salon professionnel → assigner au representant terrain
3. **Action** : Creer une tache "Premier contact" echeance 24h
4. **Action** : Envoyer un email de confirmation au lead

---

## Questions frequentes (FAQ)

**Q : Combien de workflows puis-je avoir actifs en meme temps ?**
R : Il n'y a pas de limite technique. Cependant, il est recommande de garder vos workflows organises et de desactiver ceux qui ne sont plus pertinents.

**Q : Comment savoir si mes campagnes sont efficaces ?**
R : Consultez la page Analyse workflows (`/admin/crm/workflow-analytics`) pour les workflows, et les statistiques de chaque campagne (taux d'ouverture, clics, conversions).

**Q : Les emails sont-ils envoyes immediatement ?**
R : Les campagnes planifiees sont envoyees a l'heure prevue. Les emails de workflow sont envoyes en temps reel quand le declencheur se produit. L'action "Attendre" permet de retarder l'envoi.

**Q : Comment eviter de spammer mes contacts ?**
R : Le systeme inclut des protections : un meme contact ne recevra pas plus d'un email automatique par jour (configurable). Les contacts desabonnes sont automatiquement exclus.

---

## Strategie expert : les 10 automatisations essentielles pour une PME e-commerce

### Vue d'ensemble

Ces 10 automatisations couvrent les besoins fondamentaux d'une PME e-commerce de peptides au Quebec. Implementez-les dans cet ordre de priorite (les premieres generent le plus de valeur le plus rapidement).

### 1. Bienvenue nouveau inscrit

- **Declencheur** : Inscription newsletter ou creation de compte
- **Actions** : Email bienvenue (immediat) → Delai 3j → Email educatif → Delai 4j → Email code promo premiere commande
- **Impact** : Conversion inscrit → acheteur de 10-15%

### 2. Abandon de panier

- **Declencheur** : Produit en panier, pas de checkout en 1 heure
- **Actions** : Email rappel (H+1) → Delai 23h → Email avec FAQ produit (H+24) → Delai 48h → Email avec 10% (H+72)
- **Impact** : Recuperation de 5-15% des paniers abandonnes

### 3. Post-achat et cross-sell

- **Declencheur** : Commande confirmee
- **Actions** : Email merci (J+1) → Delai 6j → Email guide utilisation + cross-sell (J+7) → Delai 23j → Email rappel reachat (J+30)
- **Impact** : Augmentation du taux de reachat de 20-30%

### 4. Rappel de reapprovisionnement

- **Declencheur** : Delai estime depuis le dernier achat (30, 60, 90 jours selon le produit)
- **Actions** : Email "Il est temps de reapprovisionner votre [peptide]" avec bouton de recommande rapide
- **Impact** : 8-12% de taux de conversion, revenu recurrent previsible

### 5. Reactivation client inactif

- **Declencheur** : Pas de commande depuis 60 jours ET au moins 1 commande passee
- **Actions** : Email "Vous nous manquez" + 15% (J+60) → Delai 15j → Email derniere chance (J+75)
- **Impact** : Reactivation de 3-8% des clients dormants

### 6. Attribution automatique des leads

- **Declencheur** : Nouveau lead cree (formulaire, import, scraper)
- **Actions** : Condition source → Si B2B : assigner au representant B2B. Si B2C : round-robin entre representants. Creer tache "Premier contact" echeance 24h
- **Impact** : Reduction du temps de premier contact de 72h a < 24h

### 7. Demande d'avis apres livraison

- **Declencheur** : Commande livree (statut = delivered)
- **Actions** : Delai 5j → Email demande d'avis avec lien direct. Si pas d'avis apres 7j → Rappel avec incitatif (5% prochaine commande)
- **Impact** : Social proof, amelioration du taux de conversion page produit

### 8. Alerte stock bas pour clients interesses

- **Declencheur** : Stock d'un produit < seuil defini
- **Actions** : Notifier l'equipe interne → Si "Alerte stock" activee sur la fiche contact, envoyer un email "Stock limite : commandez maintenant"
- **Impact** : Urgence naturelle, acceleration des achats

### 9. Notification interne pour commandes VIP

- **Declencheur** : Commande > 500 $CA OU client tag "VIP" commande
- **Actions** : Notification Slack/email a l'equipe → Creer tache "Suivi personnalise" pour le representant
- **Impact** : Service client haut de gamme pour les meilleurs clients

### 10. Anniversaire et dates cles

- **Declencheur** : Date d'anniversaire du client OU anniversaire de premiere commande
- **Actions** : Email personnalise + code promo exclusif 20% valide 7 jours
- **Impact** : Taux de conversion de 10-15%, renforcement de la relation

## Strategie expert : conformite Loi 25 du Quebec

### Qu'est-ce que la Loi 25 ?

La Loi 25 (anciennement Projet de loi 64) est la loi quebecoise modernisant la protection des renseignements personnels. Entree en vigueur par etapes depuis 2022, elle impose des obligations strictes aux entreprises qui collectent, utilisent ou communiquent des renseignements personnels de residants du Quebec.

### Obligations principales pour BioCycle Peptides

**1. Responsable de la protection des renseignements personnels**
- Designez une personne responsable (par defaut : le dirigeant de l'entreprise)
- Publiez son titre et ses coordonnees sur le site web
- Cette personne supervise la conformite et repond aux demandes des individus

**2. Consentement clair et eclaire**
- Le consentement doit etre donne pour chaque finalite separement (marketing, newsletter, profil client)
- Le consentement doit etre explicite (pas de cases pre-cochees)
- L'individu peut retirer son consentement a tout moment
- Conservez la preuve du consentement (date, methode, texte presente)

**3. Politique de confidentialite obligatoire**
- Accessible en langage clair sur votre site
- Doit decrire : quels renseignements sont collectes, pourquoi, comment, combien de temps, avec qui ils sont partages
- Mise a jour obligatoire a chaque changement

**4. Droit d'acces et de rectification**
- Tout individu peut demander : quels renseignements vous detenez sur lui, les corriger, ou les faire supprimer
- Delai de reponse : 30 jours
- Ce droit s'exerce via un formulaire ou un email a la personne responsable

**5. Droit a l'oubli (desindexation)**
- Un individu peut demander que ses renseignements soient desindexes ou anonymises
- Si les renseignements ne sont plus necessaires a la finalite initiale, vous devez les supprimer

**6. Registre des incidents de confidentialite**
- OBLIGATOIRE : tenir un registre de tout incident impliquant un acces non autorise a des renseignements personnels
- Un "incident" inclut : fuite de donnees, acces non autorise, perte de donnees, envoi d'email au mauvais destinataire
- Notification obligatoire a la Commission d'acces a l'information du Quebec (CAI) et aux personnes concernees si l'incident presente un "risque serieux de prejudice"

### Actions dans Koraline pour la conformite

| Obligation | Fonctionnalite Koraline | Emplacement |
|-----------|----------------------|-------------|
| Consentement | Champ "Consentement CASL/Loi 25" sur chaque contact avec date et methode | CRM > Contacts > Fiche contact |
| Droit d'acces | Exporter les donnees d'un contact en CSV | CRM > Contacts > Exporter |
| Droit a l'oubli | Anonymiser un contact (remplacer les donnees par des placeholders) | CRM > Contacts > Menu actions |
| Desabonnement | Traitement automatique et instantane | Automatique via lien desabonnement |
| Registre des incidents | Page dediee dans la section Conformite | CRM > Automatisation > Conformite |
| Audit trail | Journal de tous les consentements et modifications | CRM > Automatisation > Conformite |

### Penalites Loi 25

| Type | Montant maximum |
|------|----------------|
| **Personne physique** | 50 000 $CA |
| **Entreprise (sanction administrative)** | 10 000 000 $CA ou 2% du chiffre d'affaires mondial |
| **Entreprise (sanction penale)** | 25 000 000 $CA ou 4% du chiffre d'affaires mondial |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Workflow** | Serie d'actions automatiques declenchees par un evenement |
| **Declencheur** | L'evenement qui lance un workflow (trigger) |
| **Sequence** | Serie d'emails automatiques envoyes a intervalle regulier |
| **Campagne** | Envoi ponctuel d'un email/SMS a un groupe de contacts |
| **Playbook** | Guide standardise pour un processus de vente |
| **Nurturing** | Processus de "nourrissage" d'un lead par du contenu regulier |
| **A/B testing** | Tester deux versions d'un email pour voir laquelle performe mieux |
| **Snippet** | Bloc de texte reutilisable dans les emails |
| **Conformite** | Respect des lois sur la protection des donnees (Loi 25, LPRPDE) |

---

## Pages reliees

- [Listes et Segments](/admin/crm/lists) : Audiences pour les campagnes
- [Contacts](/admin/crm/contacts) : Destinataires des communications
- [Leads](/admin/crm/leads) : Prospects a nourrir par sequences
- [Centre d'appels](/admin/crm/dialer) : Appels integres aux workflows
- [Rapports](/admin/crm/analytics) : Performances des campagnes et workflows
