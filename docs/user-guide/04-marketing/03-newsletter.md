# Gestion de la Newsletter

> **Section**: Marketing > Newsletter
> **URL**: `/admin/newsletter`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~30 minutes

---

## A quoi sert cette page ?

La page **Newsletter** est votre centre de commande pour le marketing par email. Elle regroupe deux volets : la gestion des **abonnes** (les personnes inscrites a votre liste de diffusion) et la gestion des **campagnes** (les emails que vous envoyez).

**En tant que gestionnaire, vous pouvez :**
- Voir tous vos abonnes avec leur statut (actif, desabonne, rebondi)
- Filtrer et rechercher des abonnes
- Exporter la liste des abonnes en CSV
- Creer des campagnes email (brouillon, envoi immediat, planification)
- Configurer des tests A/B pour optimiser les taux d'ouverture
- Utiliser des segments predefinies pour cibler vos envois
- Consulter les statistiques detaillees de chaque campagne (taux d'ouverture, de clic, de rebond)
- Supprimer des campagnes ou desabonner des contacts
- Respecter automatiquement la conformite CASL (loi canadienne anti-pourriel)

---

## Concepts pour les debutants

### Qu'est-ce qu'un abonne ?

Un abonne est une personne qui a donne son consentement pour recevoir vos emails marketing. Les abonnes peuvent provenir de differentes sources :
- **Popup** : Via un formulaire popup sur le site web
- **Pied de page (Footer)** : Via le formulaire d'inscription dans le bas du site
- **Paiement (Checkout)** : Via une case a cocher au moment de la commande

### Les statuts d'un abonne

| Statut | Signification |
|--------|---------------|
| **Actif** | L'abonne recoit vos emails normalement |
| **Desabonne** | L'abonne a demande a ne plus recevoir d'emails |
| **Rebondi (Bounced)** | L'adresse email n'est plus valide (boite pleine, adresse inexistante) |

### Qu'est-ce qu'une campagne ?

Une campagne est un email que vous envoyez a vos abonnes. Elle peut etre un brouillon (en cours de redaction), planifiee (envoi programme a une date future), ou envoyee.

### Qu'est-ce qu'un test A/B ?

Le test A/B consiste a envoyer deux versions legerement differentes d'un email (par exemple, deux objets differents) a un petit echantillon de vos abonnes. Apres un certain temps, le systeme analyse laquelle des deux versions a obtenu les meilleurs resultats, puis envoie automatiquement la version gagnante au reste de la liste.

### Conformite CASL

La loi canadienne anti-pourriel (CASL) impose des regles strictes pour l'envoi d'emails commerciaux. Le systeme integre automatiquement les exigences CASL : consentement obligatoire, lien de desabonnement dans chaque email, identification de l'expediteur.

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche**, cliquez sur **Newsletter**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Cliquez sur l'icone de la section **Marketing** dans le rail
2. Cliquez sur **Newsletter**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche (ou tapez `/`)
2. Tapez "newsletter" ou "email"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Fonction |
|--------|----------|
| **Nouvelle campagne** | Ouvrir le compositeur d'email |
| **Envoyer** | Envoyer la campagne selectionnee (avec confirmation) |
| **Planifier** | Planifier l'envoi de la campagne selectionnee a une date future |
| **Statistiques campagne** | Afficher les statistiques detaillees de la campagne selectionnee |
| **Supprimer** | Supprimer la campagne selectionnee |
| **Exporter abonnes** | Telecharger la liste des abonnes en CSV |
| **Desabonner** | Desabonner manuellement un contact |
| **Rafraichir** | Recharger les donnees |

### 2. Les onglets principaux

Deux onglets principaux en haut de la zone de contenu :
- **Abonnes** : La liste des personnes inscrites a la newsletter
- **Campagnes** : La liste des emails envoyes ou en preparation

### 3. Les cartes de statistiques

Les statistiques changent selon l'onglet actif.

**Onglet Abonnes :**

| Carte | Description |
|-------|-------------|
| **Total abonnes** | Nombre total de personnes inscrites |
| **Actifs** | Nombre d'abonnes qui recoivent les emails |
| **Desabonnes** | Nombre de personnes qui se sont desabonnees |
| **Rebondis** | Nombre d'adresses email invalides |

**Onglet Campagnes :**

| Carte | Description |
|-------|-------------|
| **Total campagnes** | Nombre total de campagnes creees |
| **Envoyees** | Nombre de campagnes envoyees |
| **Planifiees** | Nombre de campagnes en attente d'envoi |
| **Brouillons** | Nombre de campagnes en cours de redaction |

### 4. La liste (panneau central)

- **Onglets de filtrage** : Selon l'onglet actif, differents filtres sont disponibles
- **Barre de recherche** : Recherchez par email (abonnes) ou par sujet (campagnes)
- **Chaque element affiche** : des badges de statut et les informations pertinentes

### 5. Le panneau de detail (panneau droit)

**Pour un abonne** : email, statut, source d'inscription, langue, dates d'inscription et de desabonnement

**Pour une campagne** : sujet, contenu, statut, dates d'envoi, nombre de destinataires, taux d'ouverture et de clic, resultats du test A/B le cas echeant, et statistiques email detaillees (pont Email)

---

## Fonctionnalites detaillees

### 1. Consulter les abonnes

1. Assurez-vous que l'onglet **Abonnes** est selectionne
2. Parcourez la liste ou utilisez la recherche
3. Cliquez sur un abonne pour voir son detail
4. Les informations affichees incluent l'email, le statut, la source d'inscription et la langue

### 2. Exporter les abonnes

1. Onglet Abonnes actif
2. Cliquez sur **Exporter abonnes** dans le ruban
3. Le fichier CSV se telecharge avec les colonnes : Email, Statut, Source, Langue, Date d'inscription

### 3. Desabonner un contact manuellement

1. Selectionnez l'abonne dans la liste
2. Cliquez sur **Desabonner** dans le ruban
3. Confirmez l'action

Cette action est conforme a la loi CASL et met a jour le statut de l'abonne immediatement.

### 4. Creer une campagne email

1. Cliquez sur **Nouvelle campagne** dans le ruban
2. Le compositeur d'email s'ouvre avec les champs :
   - **Objet** (obligatoire) : La ligne d'objet de l'email
   - **Contenu** (obligatoire) : Le corps du message en HTML
3. Optionnel -- configurez un **test A/B** :
   - Activez l'interrupteur "Test A/B"
   - Choisissez le type de test : **objet** ou **contenu**
   - Saisissez la variante B (objet alternatif ou contenu alternatif)
   - Definissez le pourcentage de l'echantillon test (par defaut 20%)
   - Definissez le delai d'attente avant de choisir le gagnant (par defaut 120 minutes)
   - Choisissez la metrique gagnante : taux d'ouverture ou taux de clic
4. Actions disponibles :
   - **Sauvegarder comme brouillon** : Enregistre sans envoyer
   - **Planifier** : Programme l'envoi a une date future
   - **Envoyer maintenant** : Envoie immediatement

**Validations** :
- L'objet ne peut pas etre vide
- Le contenu ne peut pas etre vide

### 5. Envoyer une campagne existante

1. Onglet Campagnes actif
2. Selectionnez un brouillon dans la liste
3. Cliquez sur **Envoyer** dans le ruban
4. Une fenetre de confirmation apparait (indiquant le nombre de destinataires)
5. Confirmez l'envoi

### 6. Consulter les statistiques d'une campagne

1. Selectionnez une campagne envoyee
2. Cliquez sur **Statistiques campagne** dans le ruban
3. Une fenetre modale affiche :
   - Nombre d'emails envoyes
   - Taux d'ouverture
   - Taux de clic
   - Taux de rebond
   - Taux de desabonnement
   - Nombre d'ouvertures, de clics, de rebonds et de desabonnements
   - Contexte des abonnes (total actifs, total desabonnes)
4. Pour les campagnes avec test A/B : les resultats par variante (A et B), le gagnant, et le nombre d'emails envoyes au reste de la liste

### 7. Supprimer une campagne

1. Selectionnez la campagne
2. Cliquez sur **Supprimer** dans le ruban
3. Confirmez la suppression

Seuls les brouillons et les campagnes planifiees peuvent etre supprimes. Les campagnes deja envoyees sont conservees pour l'historique.

---

## Scenarios concrets

### Scenario A : Envoyer une newsletter mensuelle

1. Cliquez sur **Nouvelle campagne**
2. Objet : "Nouveautes mars 2026 - BioCycle Peptides"
3. Contenu : Redigez le corps de l'email en HTML (nouveaux produits, offres speciales, actualites)
4. Cliquez sur **Envoyer maintenant**
5. Confirmez l'envoi
6. Apres quelques heures, revenez consulter les statistiques (taux d'ouverture, de clic)

### Scenario B : Tester deux lignes d'objet avec un test A/B

1. Cliquez sur **Nouvelle campagne**
2. Objet (variante A) : "Decouvrez nos nouveaux peptides"
3. Contenu : Votre email
4. Activez le **test A/B**
5. Type de test : **Objet**
6. Objet variante B : "25% de rabais sur nos nouveaux peptides !"
7. Pourcentage test : 20% (20% des abonnes recevront la variante A, 20% la B)
8. Delai : 120 minutes (2 heures pour analyser les resultats)
9. Metrique gagnante : Taux d'ouverture
10. Cliquez sur **Envoyer maintenant**
11. Apres 2 heures, le systeme determine automatiquement le gagnant et envoie cette version aux 60% restants

### Scenario C : Nettoyer la liste d'abonnes

1. Allez sur l'onglet **Abonnes**
2. Filtrez sur le statut **Rebondi** (Bounced)
3. Consultez les adresses invalides
4. Exportez la liste en CSV pour archivage
5. Utilisez ces informations pour mettre a jour vos bases de contacts

---

## FAQ

**Q: Comment les gens s'inscrivent-ils a la newsletter ?**
R: Les visiteurs du site peuvent s'inscrire via le popup d'inscription, le formulaire dans le pied de page du site, ou la case a cocher au moment du paiement. Chaque source est tracee dans le systeme.

**Q: Le systeme est-il conforme a la loi CASL ?**
R: Oui. Le systeme integre les exigences CASL automatiquement : consentement explicite a l'inscription, lien de desabonnement obligatoire dans chaque email, identification de l'expediteur, et gestion des desabonnements.

**Q: Combien de temps faut-il attendre pour obtenir les resultats d'un test A/B ?**
R: Le delai est configurable lors de la creation de la campagne (par defaut 120 minutes). Apres ce delai, le systeme compare les resultats et envoie la version gagnante au reste des abonnes.

**Q: Puis-je modifier une campagne deja envoyee ?**
R: Non. Une fois envoyee, la campagne ne peut plus etre modifiee. Vous pouvez en creer une nouvelle si necessaire.

**Q: Comment sont calculees les statistiques d'ouverture et de clic ?**
R: Le taux d'ouverture mesure le pourcentage d'emails ouverts par rapport au nombre d'emails envoyes. Le taux de clic mesure le pourcentage de destinataires ayant clique sur un lien dans l'email. Ces donnees sont collectees via des pixels de suivi et des liens traces.

---

## Strategie expert : conformite CASL detaillee

### Qu'est-ce que la CASL exactement ?

La Loi canadienne anti-pourriel (CASL, en vigueur depuis 2014) est l'une des legislations anti-spam les plus strictes au monde. Elle s'applique a tout message electronique commercial (MEC) envoye depuis le Canada ou recu au Canada, y compris les emails, SMS et messages sur les reseaux sociaux.

### Les 3 exigences obligatoires pour chaque envoi

**1. Consentement** (le plus important)
- **Consentement explicite (opt-in)** : Le destinataire a activement coche une case ou rempli un formulaire pour s'inscrire. La case ne doit PAS etre pre-cochee.
- **Consentement implicite** : Existe pour les clients ayant achete dans les 2 derniers ans, ou les personnes ayant fait une demande dans les 6 derniers mois. ATTENTION : le consentement implicite expire. Apres expiration, il faut obtenir un consentement explicite.
- **Preuve** : Conservez la date, la methode et le texte exact qui accompagnait la demande de consentement. Koraline enregistre automatiquement ces informations.

**2. Identification de l'expediteur**
- Nom de l'entreprise : BioCycle Peptides Inc.
- Adresse postale physique (OBLIGATOIRE dans chaque email)
- Coordonnees valides (email, telephone ou URL)

**3. Mecanisme de desabonnement**
- Lien de desabonnement dans chaque email, visible et fonctionnel
- Traitement de la demande en maximum 10 jours ouvrables (Koraline le fait instantanement)
- Le desabonnement doit etre gratuit et sans condition

### Penalites en cas de non-conformite

| Type | Montant maximum |
|------|----------------|
| **Entreprise** | Jusqu'a 10 000 000 $CA par infraction |
| **Individu** | Jusqu'a 1 000 000 $CA par infraction |
| **Droit d'action prive** | Les destinataires peuvent poursuivre directement |

Le CRTC (Conseil de la radiodiffusion et des telecommunications canadiennes) applique activement cette loi. Des amendes de plusieurs millions ont ete imposees a des entreprises canadiennes.

### Ce que Koraline fait automatiquement pour vous

- Enregistre la preuve de consentement (date, source, methode)
- Insere le lien de desabonnement dans chaque email
- Traite les desabonnements instantanement
- Bloque l'envoi vers les adresses desabonnees ou rebondies
- Ajoute l'adresse physique dans le pied de page

### Ce que vous devez faire vous-meme

- Ne JAMAIS importer une liste d'emails achetee -- c'est illegal sous la CASL
- Verifier que vos formulaires d'inscription ont un texte de consentement clair
- Ne pas pre-cocher la case d'inscription a la newsletter au checkout
- Documenter la source de chaque abonne (popup, footer, checkout)

## Strategie expert : segmentation avancee pour peptides

### Pourquoi segmenter ?

Envoyer le meme email a toute votre base est inefficace. Un chercheur en biologie moleculaire n'a pas les memes besoins qu'un athlete qui decouvre les peptides. La segmentation augmente les taux d'ouverture de 40 a 60% et les taux de clic de 50 a 100%.

### Segments recommandes pour BioCycle Peptides

| Segment | Criteres | Contenu adapte |
|---------|----------|----------------|
| **Chercheurs academiques** | Email .edu ou .ca universitaire, achats reguliers, panier moyen > 200 $CA | Nouvelles publications, certificats d'analyse, promotions sur volumes |
| **Acheteurs peptides reparation** | A achete BPC-157, TB-500, ou GHK-Cu | Cross-sell eau bacteriostatique, seringues, autres peptides reparation |
| **Acheteurs peptides performance** | A achete CJC-1295, Ipamorelin, ou GHRP-6 | Cross-sell stacks, guides de reconstitution, nouveaux peptides performance |
| **Acheteurs supplements** | Achats uniquement dans la categorie "Supplements" | Education sur les peptides, offre decouverte premier peptide |
| **Gros acheteurs (VIP)** | CLV > 1000 $CA ou > 5 commandes | Offres exclusives, acces anticipe aux nouveaux produits, service prioritaire |
| **Inactifs 60+ jours** | Derniere commande > 60 jours | Email de reactivation avec code promo 15% |
| **Nouveaux inscrits** | Inscription < 7 jours, pas encore achete | Sequence de bienvenue, guide du debutant, code premiere commande |
| **B2B (labos, cliniques)** | Tag "B2B" ou entreprise associee | Grilles de prix volume, COA en lot, compte dedie |

### Benchmarks industrie sante / supplements au Canada

| Metrique | Moyenne industrie | Bon | Excellent |
|----------|------------------|-----|-----------|
| **Taux d'ouverture** | 20-25% | 25-30% | > 30% |
| **Taux de clic** | 2-4% | 4-6% | > 6% |
| **Taux de desabonnement** | 0.2-0.5% | < 0.2% | < 0.1% |
| **Taux de rebond** | 1-3% | < 1% | < 0.5% |
| **Revenu par email** | 0.10-0.25 $CA | 0.25-0.50 $CA | > 0.50 $CA |

**Frequence d'envoi optimale** : 1 a 2 emails par semaine pour les segments actifs, 1 par mois pour les segments froids. Au-dela de 3 par semaine, le taux de desabonnement augmente significativement.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Abonne** | Une personne inscrite a la liste de diffusion de la newsletter |
| **Campagne** | Un email envoye a un groupe d'abonnes dans un but marketing |
| **Brouillon** | Une campagne en cours de redaction, pas encore envoyee |
| **Planifiee** | Une campagne programmee pour etre envoyee a une date future |
| **Test A/B** | Technique consistant a tester deux versions d'un email sur un echantillon avant d'envoyer la meilleure au reste |
| **Taux d'ouverture** | Pourcentage d'emails ouverts par les destinataires |
| **Taux de clic** | Pourcentage de destinataires ayant clique sur un lien |
| **Rebond (Bounce)** | Email non delivre car l'adresse est invalide ou la boite est pleine |
| **CASL** | Loi canadienne anti-pourriel (Canadian Anti-Spam Legislation) |
| **Segment** | Un sous-groupe d'abonnes defini par des criteres (langue, source, comportement) |
| **Variante** | L'une des versions d'un test A/B (variante A ou variante B) |

---

## Pages liees

- [Codes Promo](/admin/promo-codes) -- Creer des codes de reduction a partager dans les newsletters
- [Blog](/admin/blog) -- Publier du contenu a relayer dans les newsletters
- [Rapports marketing](/admin/rapports) -- Analyser l'impact des campagnes sur les ventes
- [Bannieres](/admin/bannieres) -- Gerer les visuels promotionnels a inclure dans les emails
