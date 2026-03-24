# Scraper Web pour Generation de Leads

> **Section**: CRM > Scraper
> **URL**: `/admin/scraper`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

Le **Scraper** est un outil de prospection automatisee qui explore le web pour identifier des leads potentiels pour BioCycle Peptides. Il collecte des informations publiques sur des entreprises et professionnels susceptibles d'etre interesses par vos produits.

**En tant que gestionnaire, vous pouvez :**
- Configurer des recherches automatisees par secteur et region
- Extraire des informations de contact depuis des sources publiques
- Importer automatiquement les resultats dans le CRM comme leads
- Programmer des scans reguliers (quotidien, hebdomadaire)
- Filtrer et enrichir les donnees extraites
- Creer des listes ciblees a partir des resultats
- Suivre les sources qui generent les meilleurs leads

---

## Concepts de base pour les debutants

### Qu'est-ce que le scraping web ?

Le **scraping** (ou "web scraping") consiste a extraire automatiquement des informations publiees sur des sites web. C'est comme avoir un assistant qui visite des centaines de sites pour noter les coordonnees de prospects potentiels.

### Est-ce legal ?

Le scraping d'informations **publiquement accessibles** est generalement permis au Canada, sous certaines conditions :
- Les donnees doivent etre publiques (pas derriere un login)
- Le site ne doit pas l'interdire explicitement dans ses conditions d'utilisation
- Les donnees personnelles doivent etre traitees conformement a la LPRPDE/Loi 25
- L'usage doit etre commercial legitime (prospection, pas de spam)

> **Important** : BioCycle Peptides utilise le scraper de maniere ethique, en se limitant aux annuaires professionnels publics et aux sites d'entreprises.

### Sources typiques

| Source | Type de donnees |
|--------|----------------|
| **Annuaires professionnels** | Cliniques, pharmacies, medecins |
| **LinkedIn** (via API) | Profils professionnels, entreprises |
| **Google Maps** | Commerces locaux, coordonnees, avis |
| **Registres publics** | Entreprises enregistrees au Quebec |
| **Sites d'associations** | Membres d'ordres professionnels |

---

## Comment y acceder

1. CRM > **Scraper** dans le panneau lateral
2. Ou Systeme > Outils > **Scraper**
3. URL directe : `/admin/scraper`

---

## Vue d'ensemble de l'interface

### 1. La barre de ruban

| Bouton | Fonction |
|--------|----------|
| **Nouveau scan** | Lancer une nouvelle recherche |
| **Historique** | Voir les scans precedents |
| **Importer** | Envoyer les resultats dans le CRM |
| **Parametres** | Configurer les sources et filtres |

### 2. Le formulaire de recherche

Champs de configuration d'un scan :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Mots-cles** | Termes de recherche | "clinique peptides", "medecin sport" |
| **Localisation** | Region geographique | Quebec, Montreal, Canada |
| **Secteur** | Domaine d'activite | Sante, pharmaceutique, sport |
| **Source** | Quel site/annuaire explorer | Google Maps, Pages Jaunes |
| **Limite** | Nombre max de resultats | 50, 100, 500 |

### 3. Les resultats

Tableau des prospects trouves :
- Nom de l'entreprise/personne
- Adresse email (si trouvee)
- Telephone
- Site web
- Adresse
- Score de pertinence (note automatique)
- Statut : nouveau, importe, ignore

---

## Fonctionnalites detaillees

### 1. Lancer un scan

**Etapes** :
1. Cliquez sur **Nouveau scan**
2. Remplissez les criteres de recherche :
   - Mots-cles : "clinique sante naturopathe Montreal"
   - Localisation : "Montreal, QC"
   - Source : Google Maps
   - Limite : 100 resultats
3. Cliquez sur **Lancer le scan**
4. Le systeme explore la source et collecte les resultats
5. Attendez la fin du scan (barre de progression)

> **Note** : Un scan peut prendre de quelques secondes a plusieurs minutes selon la source et le nombre de resultats demandes.

### 2. Examiner et filtrer les resultats

**Etapes** :
1. Une fois le scan termine, les resultats s'affichent en tableau
2. Verifiez la pertinence de chaque resultat :
   - Score de pertinence (calcule automatiquement)
   - Completude des donnees (email present ? telephone ?)
3. Cochez les resultats pertinents
4. Marquez les non-pertinents comme "ignores"
5. Filtrez par score, secteur, ou completude des donnees

### 3. Importer les resultats dans le CRM

**Etapes** :
1. Selectionnez les resultats a importer (ou "tous les pertinents")
2. Cliquez sur **Importer dans le CRM**
3. Configurez l'import :
   - **Type** : lead, contact, ou entreprise
   - **Source** : sera taguee automatiquement ("Scraper - Google Maps")
   - **Assignation** : representant par defaut ou round-robin
   - **Tags** : tags a appliquer automatiquement
4. Cliquez sur **Importer**
5. Les resultats deviennent des leads dans le CRM

### 4. Programmer des scans recurrents

**Etapes** :
1. Creez un scan avec vos criteres habituels
2. Activez l'option **Recurrence**
3. Choisissez la frequence : quotidien, hebdomadaire, mensuel
4. Le systeme lancera le scan automatiquement et vous notifiera des nouveaux resultats
5. Les doublons sont detectes automatiquement (un meme contact n'est pas importe deux fois)

### 5. Enrichissement des donnees

Le scraper peut enrichir les fiches existantes :
- Trouver l'email d'un contact dont vous n'avez que le nom
- Ajouter le site web d'une entreprise
- Completer l'adresse a partir du nom
- Verifier si un numero de telephone est encore actif

---

## Workflows courants

### Campagne de prospection regionale
1. Lancez un scan : "cliniques sante" dans "Laval, QC"
2. Examinez les resultats et filtrez les plus pertinents
3. Importez comme leads dans le CRM
4. Creez un segment "Prospects Laval cliniques"
5. Lancez une sequence d'emails d'introduction
6. Apres 5 jours, lancez une campagne d'appels sur les non-repondants

### Veille concurrentielle
1. Programmez un scan hebdomadaire sur vos mots-cles
2. Identifiez les nouveaux acteurs du marche
3. Ajoutez les contacts pertinents dans une liste de veille
4. Analysez les tendances (nouveaux types de cliniques, nouvelles regions)

---

## Questions frequentes (FAQ)

**Q : Le scraper peut-il trouver des emails avec certitude ?**
R : Pas toujours. Les emails sont extraits des sites publics ou devines par des patterns (prenom.nom@entreprise.com). Le systeme indique un taux de confiance pour chaque email trouve.

**Q : Combien de scans puis-je lancer par jour ?**
R : Cela depend du plan d'abonnement et des limites des sources (API). En general, 5-10 scans par jour sont raisonnables.

**Q : Les resultats sont-ils toujours a jour ?**
R : Les donnees sont aussi recentes que la source. Les annuaires sont generalement mis a jour regulierement. Pour des donnees critiques, verifiez manuellement avant de contacter.

**Q : Comment eviter d'importer des doublons ?**
R : Le systeme compare automatiquement les emails et numeros de telephone avec votre base existante. Les doublons potentiels sont signales avant l'import.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Scraping** | Extraction automatisee de donnees depuis des sites web |
| **Scan** | Une session de scraping avec des criteres definis |
| **Enrichissement** | Ajout d'informations complementaires a une fiche existante |
| **Score de pertinence** | Note automatique evaluant la qualite d'un resultat |
| **Recurrence** | Programmation d'un scan a intervalle regulier |

---

## Pages reliees

- [Leads](/admin/crm/leads) : Ou sont importes les resultats du scraper
- [Contacts](/admin/crm/contacts) : Enrichissement des fiches existantes
- [Listes et Segments](/admin/crm/lists) : Organisation des leads scrapes
- [Automatisations](/admin/crm/workflows) : Workflows post-import
- [Import/Export](/admin/crm/import-export) : Autres methodes d'importation
