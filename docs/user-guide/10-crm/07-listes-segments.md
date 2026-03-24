# Listes, Segments et Tags

> **Section**: CRM > Listes / Segments / Tags
> **URL**: `/admin/crm/lists`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Listes** permet d'organiser vos contacts en groupes pour des actions ciblees. Les **segments** sont des groupes dynamiques bases sur des criteres, les **listes** sont des groupes statiques geres manuellement, et les **tags** sont des etiquettes libres.

**En tant que gestionnaire, vous pouvez :**
- Creer des listes statiques de contacts (ex: invites au salon, VIP)
- Creer des segments dynamiques bases sur des criteres (ex: clients Quebec actifs)
- Ajouter et gerer des tags pour categoriser les contacts
- Utiliser les listes et segments pour des campagnes ciblees
- Exporter une liste ou un segment en CSV
- Combiner des criteres pour des ciblages precis

---

## Concepts de base pour les debutants

### La difference entre liste, segment et tag

| Outil | Type | Mise a jour | Usage principal |
|-------|------|-------------|-----------------|
| **Liste** | Statique | Manuelle (vous ajoutez/retirez des contacts) | Groupes ponctuels (invites evenement, VIP manuels) |
| **Segment** | Dynamique | Automatique (les contacts entrent/sortent selon les criteres) | Ciblage marketing, analyse comportementale |
| **Tag** | Etiquette | Manuelle | Classification rapide, filtrage transversal |

### Exemples concrets

**Liste statique** : "Invites salon Sante Montreal 2026"
- Vous ajoutez manuellement les 50 contacts invites
- Meme si un contact change de ville, il reste dans la liste

**Segment dynamique** : "Clients Quebec ayant achete dans les 30 derniers jours"
- Le segment se recalcule automatiquement
- Si un client quebecois achete aujourd'hui, il apparait demain dans le segment
- Si un client n'a pas achete depuis 31 jours, il sort du segment

**Tag** : "VIP"
- Vous marquez les contacts importants avec ce tag
- Utile pour filtrer rapidement dans n'importe quelle vue

---

## Comment y acceder

1. CRM > **Listes** dans le panneau lateral
2. URL directe : `/admin/crm/lists`

---

## Vue d'ensemble de l'interface

### 1. Les onglets principaux

| Onglet | Description |
|--------|-------------|
| **Listes** | Vos listes statiques |
| **Segments** | Vos segments dynamiques |
| **Tags** | Gestion de tous les tags |

### 2. La grille des listes/segments

Chaque ligne affiche :
- **Nom** de la liste ou du segment
- **Nombre de contacts** actuellement inclus
- **Type** : statique ou dynamique
- **Date de creation** et derniere mise a jour
- **Createur** : qui l'a cree
- **Actions** : modifier, dupliquer, exporter, supprimer

---

## Fonctionnalites detaillees

### 1. Creer une liste statique

**Etapes** :
1. Cliquez sur **Nouvelle liste**
2. Choisissez **Liste statique**
3. Donnez un nom (ex: "Prospects salon Bio 2026")
4. Ajoutez une description (optionnel)
5. Cliquez sur **Creer**
6. Pour ajouter des contacts :
   - Cliquez sur **Ajouter des contacts**
   - Recherchez et selectionnez les contacts souhaites
   - Ou importez une liste de noms/emails depuis un fichier CSV

### 2. Creer un segment dynamique

**Etapes** :
1. Cliquez sur **Nouveau segment**
2. Donnez un nom (ex: "Clients actifs Quebec")
3. Definissez les **criteres de filtrage** :

**Criteres disponibles** :

| Categorie | Criteres |
|-----------|----------|
| **Profil** | Province, ville, code postal, secteur, taille entreprise |
| **Comportement** | Date dernier achat, nombre de commandes, montant total depense |
| **Engagement** | Score CRM, emails ouverts, clics, visites site |
| **Statut** | Client actif, prospect, lead, inactif |
| **Tags** | Possede le tag X, ne possede pas le tag Y |
| **Source** | Canal d'acquisition (web, salon, referral) |
| **Temporel** | Cree il y a X jours, derniere activite il y a X jours |

4. Combinez les criteres avec **ET** / **OU** :
   - Province = Quebec **ET** Dernier achat < 30 jours **ET** Nombre commandes > 2
5. Cliquez sur **Previsualiser** pour voir les contacts correspondants
6. Cliquez sur **Sauvegarder**

> **Astuce** : Le segment se met a jour automatiquement. Vous n'avez pas a le maintenir manuellement.

### 3. Gerer les tags

**Creer un tag** :
1. Allez dans l'onglet **Tags**
2. Cliquez sur **Nouveau tag**
3. Entrez le nom et choisissez une couleur
4. Cliquez sur **Creer**

**Appliquer un tag** :
- Depuis la fiche contact : cliquez sur l'icone tag, selectionnez
- En masse : selectionnez plusieurs contacts dans la liste, cliquez sur **Tagger**

**Tags recommandes pour BioCycle Peptides** :
- `VIP` : clients a haute valeur
- `B2B` : clients professionnels
- `Athlete` : clients sportifs
- `Professionnel sante` : medecins, pharmaciens
- `Recherche` : laboratoires et chercheurs
- `International` : clients hors Canada

### 4. Utiliser les listes pour des campagnes

**Objectif** : Envoyer un email cible a un groupe specifique.

**Etapes** :
1. Creez ou selectionnez votre liste/segment
2. Allez dans CRM > Campagnes (voir page Automatisations)
3. Dans le champ **Destinataires**, selectionnez votre liste/segment
4. Redigez et envoyez votre campagne
5. Le segment se met a jour : seuls les contacts correspondant aux criteres recevront l'email

### 5. Segments imbriques

**Objectif** : Creer des segments complexes en combinant d'autres segments.

**Etapes** :
1. Creez un segment "Clients Quebec" (critere : province = QC)
2. Creez un segment "Gros acheteurs" (critere : total > 1000 $CA)
3. Creez un segment combine "Gros acheteurs Quebec" qui utilise les deux segments precedents avec un operateur ET

---

## Workflows courants

### Preparation d'une campagne email
1. Definissez votre cible (ex: clients inactifs depuis 60 jours)
2. Creez un segment dynamique avec les criteres
3. Previsualisez pour verifier le nombre de contacts
4. Utilisez ce segment comme audience dans votre campagne
5. Apres la campagne, le segment se met a jour automatiquement

### Etiquetage apres un salon professionnel
1. Creez un tag "Salon Bio Montreal 2026"
2. Creez une liste statique "Contacts salon Bio 2026"
3. Importez les contacts rencontres (CSV depuis le scanner de badges)
4. Appliquez le tag en masse a ces contacts
5. Creez une tache de suivi pour chaque contact

---

## Questions frequentes (FAQ)

**Q : Quelle est la limite de contacts dans un segment ?**
R : Il n'y a pas de limite technique. Un segment peut contenir tous les contacts de votre base.

**Q : Les segments affectent-ils les performances ?**
R : Non, les segments sont recalcules en arriere-plan. Meme avec des criteres complexes, ils ne ralentissent pas l'interface.

**Q : Puis-je combiner une liste et un segment ?**
R : Oui. Dans le generateur de segment, vous pouvez ajouter un critere "Fait partie de la liste X" pour combiner les deux approches.

**Q : Comment savoir combien de contacts sont dans un segment avant de l'utiliser ?**
R : Le bouton **Previsualiser** affiche le nombre exact de contacts correspondant aux criteres en temps reel.

**Q : Les tags sont-ils partages entre tous les utilisateurs ?**
R : Oui, les tags sont globaux. Tout le monde peut voir et utiliser les memes tags.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Liste statique** | Groupe de contacts gere manuellement |
| **Segment dynamique** | Groupe de contacts base sur des criteres, mis a jour automatiquement |
| **Tag** | Etiquette libre pour categoriser les contacts |
| **Critere** | Condition utilisee pour definir un segment (province, achat, etc.) |
| **Operateur** | ET / OU pour combiner les criteres d'un segment |
| **Audience** | Groupe de contacts cible pour une campagne |

---

## Pages reliees

- [Contacts](/admin/crm/contacts) : Les contacts a organiser
- [Campagnes](/admin/crm/campaigns) : Envoi d'emails aux listes/segments
- [Campagnes SMS](/admin/crm/sms-campaigns) : Envoi de SMS aux listes/segments
- [Automatisations](/admin/crm/workflows) : Workflows bases sur les segments
- [Rapports CRM](/admin/crm/analytics) : Analyse par segment
