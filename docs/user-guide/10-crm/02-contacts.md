# Gestion des Contacts

> **Section**: CRM > Contacts
> **URL**: `/admin/crm/contacts`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La page **Contacts** est le registre central de toutes les personnes avec lesquelles votre entreprise interagit. Chaque client, prospect, fournisseur ou partenaire de BioCycle Peptides est un contact dans le CRM.

**En tant que gestionnaire, vous pouvez :**
- Consulter la liste complete de tous vos contacts
- Ajouter de nouveaux contacts manuellement ou par import
- Modifier les informations d'un contact existant
- Consulter l'historique complet d'un contact (achats, emails, appels, notes)
- Associer un contact a une entreprise (compte B2B)
- Attribuer un contact a un representant commercial
- Ajouter des tags et des segments pour organiser votre base
- Fusionner des contacts en double
- Envoyer un email ou passer un appel directement depuis la fiche
- Exporter les contacts en CSV

---

## Concepts de base pour les debutants

### Qu'est-ce qu'un contact ?

Un contact est une **fiche individuelle** representant une personne. Contrairement a un simple carnet d'adresses, la fiche contact dans le CRM contient non seulement les coordonnees, mais aussi tout l'historique de la relation : emails echanges, appels passes, commandes effectuees, tickets de support, etc.

### Contact vs Lead vs Client

| Type | Description |
|------|-----------|
| **Contact** | Toute personne enregistree dans le systeme, quel que soit son statut |
| **Lead** | Un contact qui a montre de l'interet mais n'a pas encore achete |
| **Client** | Un contact qui a effectue au moins un achat |
| **Prospect** | Un contact identifie comme potentiel acheteur, en cours de qualification |

Un meme contact peut etre a la fois un lead et devenir ensuite un client. Son statut evolue au fil de la relation.

---

## Comment y acceder

### Methode 1 : Via le menu CRM
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Cliquez sur **CRM** dans la navigation horizontale
3. Dans le panneau lateral, cliquez sur **Contacts**

### Methode 2 : Via le rail de navigation
1. Cliquez sur l'icone CRM dans le rail d'icones a gauche
2. Selectionnez **Contacts** dans le panneau qui s'ouvre

### Methode 3 : Via la barre de recherche
1. Tapez `/` pour ouvrir la recherche rapide
2. Tapez "contacts"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

L'interface est organisee en **3 zones** :

### 1. La barre de ruban (Ribbon)

| Bouton | Fonction |
|--------|----------|
| **Nouveau contact** | Creer une fiche contact vide a remplir |
| **Importer** | Importer des contacts depuis un fichier CSV/Excel |
| **Exporter** | Exporter les contacts filtres au format CSV |
| **Fusionner** | Fusionner deux contacts en double |
| **Supprimer** | Supprimer le contact selectionne |
| **Envoyer email** | Ouvrir la fenetre d'envoi d'email |
| **Appeler** | Lancer un appel via le centre d'appels integre |

### 2. La liste des contacts (panneau central)

- **Barre de recherche** : Recherchez par nom, email, telephone ou entreprise
- **Filtres avances** : Filtrez par tag, segment, statut, representant assigne, date de creation
- **Tri** : Triez par nom, date de creation, derniere activite, score
- **Vue en liste** : Affichage tabulaire avec colonnes personnalisables
- **Vue en cartes** : Affichage en fiches visuelles (utile pour un survol rapide)
- **Pagination** : Navigation entre les pages de resultats

### 3. Le panneau de detail (panneau droit)

Quand vous selectionnez un contact, ses informations apparaissent a droite :

**Informations generales** :
- Nom complet, email, telephone
- Entreprise associee
- Adresse postale
- Source d'acquisition (comment ce contact est arrive)
- Representant assigne

**Onglets du detail** :
- **Timeline** : Chronologie de toutes les interactions
- **Deals** : Opportunites de vente associees
- **Activites** : Taches, appels, emails planifies
- **Commandes** : Historique des achats sur la boutique
- **Notes** : Notes internes de l'equipe
- **Fichiers** : Documents joints a la fiche

---

## Fonctionnalites detaillees

### 1. Creer un nouveau contact

**Objectif** : Ajouter manuellement un contact dans le CRM.

**Etapes** :
1. Cliquez sur **Nouveau contact** dans le ruban
2. Remplissez les champs obligatoires :
   - **Prenom** et **Nom** (au minimum l'un des deux)
   - **Email** (recommande)
3. Remplissez les champs facultatifs :
   - Telephone, adresse, entreprise, poste, source
4. Ajoutez des **tags** si necessaire (ex: "VIP", "B2B", "Quebec")
5. Assignez un **representant** (ou laissez vide pour l'attribution automatique)
6. Cliquez sur **Sauvegarder**

> **Astuce** : Le systeme detecte automatiquement les doublons. Si un contact avec le meme email existe deja, vous serez averti avant la creation.

### 2. Modifier un contact

**Etapes** :
1. Recherchez le contact dans la liste ou utilisez la barre de recherche
2. Cliquez sur le contact pour ouvrir le panneau de detail
3. Cliquez sur le bouton **Modifier** (icone crayon)
4. Apportez vos modifications
5. Cliquez sur **Sauvegarder**

### 3. Consulter l'historique d'un contact

**Objectif** : Voir toutes les interactions passees avec un contact.

**Etapes** :
1. Selectionnez le contact
2. Dans le panneau de detail, cliquez sur l'onglet **Timeline**
3. Parcourez la chronologie qui affiche :
   - Emails envoyes et recus
   - Appels effectues (avec duree et notes)
   - Commandes passees
   - Changements de statut des deals
   - Notes ajoutees par l'equipe
   - Actions automatisees (ex: email de sequence envoye)

### 4. Fusionner des contacts en double

**Objectif** : Quand un meme client a ete enregistre deux fois.

**Etapes** :
1. Identifiez les doublons (utilisez la page **Doublons** dans Automatisation)
2. Selectionnez le premier contact
3. Cliquez sur **Fusionner** dans le ruban
4. Recherchez le second contact (le doublon)
5. Le systeme vous montre les deux fiches cote a cote
6. Pour chaque champ, choisissez quelle valeur conserver
7. Cliquez sur **Fusionner**

> **Important** : La fusion est irreversible. L'historique des deux contacts sera combine sur la fiche resultante. Le contact "doublon" sera supprime.

### 5. Segmenter et tagger les contacts

**Objectif** : Organiser votre base pour cibler des groupes specifiques.

**Tags** :
- Ce sont des etiquettes libres que vous attachez aux contacts
- Exemples : "VIP", "B2B", "Athlete", "Professionnel sante"
- Pour ajouter un tag : ouvrez la fiche, cliquez sur l'icone tag, tapez ou selectionnez

**Segments** :
- Ce sont des groupes dynamiques bases sur des criteres (voir page Listes & Segments)
- Exemple : "Clients actifs du Quebec ayant achete plus de 3 fois"

### 6. Envoyer un email depuis la fiche contact

**Etapes** :
1. Selectionnez le contact
2. Cliquez sur **Envoyer email** dans le ruban (ou l'icone email dans le detail)
3. Redigez votre email ou selectionnez un modele
4. Cliquez sur **Envoyer**
5. L'email apparait automatiquement dans la timeline du contact

### 7. Passer un appel depuis la fiche contact

**Etapes** :
1. Selectionnez le contact
2. Cliquez sur **Appeler** dans le ruban (ou l'icone telephone dans le detail)
3. Le systeme d'appels integre se lance (voir page Centre d'appels)
4. Apres l'appel, ajoutez des notes de conversation
5. L'appel est automatiquement enregistre dans la timeline

---

## Workflows courants

### Qualification d'un nouveau lead
1. Le lead arrive dans les contacts (import, formulaire web, scraper)
2. Ouvrez sa fiche et consultez les informations disponibles
3. Ajoutez des tags pertinents ("secteur pharma", "Quebec", etc.)
4. Assignez-le a un representant
5. Creez une tache de premier appel
6. Ajoutez-le a une sequence d'emails automatisee

### Nettoyage periodique de la base
1. Filtrez les contacts sans activite depuis 12 mois
2. Exportez cette liste pour reference
3. Archivez ou supprimez les contacts obsoletes
4. Verifiez les doublons et fusionnez si necessaire
5. Mettez a jour les tags et segments

---

## Questions frequentes (FAQ)

**Q : Quelle est la difference entre un contact et un client dans Koraline ?**
R : Un contact est toute personne enregistree dans le CRM. Un client est un contact qui a un historique d'achats sur la boutique. Tous les clients sont des contacts, mais tous les contacts ne sont pas des clients.

**Q : Comment importer mes contacts depuis un autre systeme ?**
R : Utilisez la fonction Import (voir page Import/Export). Koraline accepte les fichiers CSV et Excel. Un assistant de mappage vous aidera a associer les colonnes de votre fichier aux champs du CRM.

**Q : Puis-je supprimer un contact qui a des commandes ?**
R : Non, un contact lie a des commandes ne peut pas etre supprime pour des raisons de tracabilite comptable. Vous pouvez l'archiver pour qu'il n'apparaisse plus dans les listes actives.

**Q : Les contacts sont-ils synchronises avec la boutique ?**
R : Oui. Quand un client cree un compte sur la boutique en ligne, un contact est automatiquement cree dans le CRM. Et inversement, les modifications dans le CRM se refletent dans la boutique.

**Q : Comment attribuer automatiquement les leads aux representants ?**
R : Configurez les regles d'attribution dans Automatisation > Workflows. Vous pouvez distribuer par rotation (round-robin), par territoire ou par expertise.

---

## Strategie expert : gestion relation client pour un e-commerce de peptides

### Cycle de vie client BioCycle Peptides

Chaque contact traverse un cycle de vie previsible. Comprendre ce cycle permet d'appliquer les bonnes actions au bon moment.

```
Visiteur → Inscrit → Prospect → Premier achat → Client recurrent → Ambassadeur
                                     ↘                    ↘
                                   Client inactif     Client perdu
```

| Etape | Definition | Actions CRM |
|-------|-----------|-------------|
| **Visiteur** | Navigue sur le site, non identifie | Popup newsletter, pixel retargeting |
| **Inscrit** | A cree un compte ou s'est inscrit a la newsletter | Flow bienvenue, nurturing educatif |
| **Prospect** | A montre un interet concret (panier, demande info, formulaire) | Lead scoring, assignation representant |
| **Premier achat** | A passe sa premiere commande | Flow post-achat, cross-sell, demande d'avis |
| **Client recurrent** | 2+ commandes, achete regulierement | Programme fidelite, offres VIP, suggestions personnalisees |
| **Ambassadeur** | Recommande activement BioCycle (referrals, avis publics) | Programme ambassadeur, recompenses, acces anticipe nouveaux produits |
| **Client inactif** | Pas de commande depuis 60+ jours | Flow reactivation, code promo personnalise |
| **Client perdu** | Pas de commande depuis 180+ jours malgre reactivation | Archivage, 1 email par trimestre maximum |

### Champs personnalises recommandes pour peptides

En plus des champs standards (nom, email, telephone, adresse), ajoutez ces champs personnalises pour exploiter pleinement le CRM dans le contexte peptides :

| Champ | Type | Utilite |
|-------|------|---------|
| **Type de recherche** | Liste deroulante (academique, clinique, personnelle, industrielle) | Segmenter par profil et adapter le discours |
| **Peptides preferes** | Tags multiples (BPC-157, CJC-1295, TB-500, etc.) | Cross-sell cible, alertes stock, recommandations |
| **Volume mensuel estime** | Nombre ($CA) | Identifier les clients a fort potentiel pour le programme B2B |
| **Institution/Universite** | Texte libre | Regrouper les contacts par institution, offres B2B |
| **Source de decouverte** | Liste (Google, Reddit, PubMed, referral, salon, autre) | Mesurer l'efficacite des canaux d'acquisition |
| **Niveau d'experience peptides** | Liste (debutant, intermediaire, avance) | Adapter le contenu educatif |
| **Langue preferee** | Liste (FR, EN) | Envoyer les communications dans la bonne langue |
| **Consentement CASL** | Date + methode | Conformite legale (preuve de consentement) |

### Valeur client et priorisation

Tous les clients n'ont pas la meme valeur. Utilisez ces criteres pour prioriser vos efforts :

| Segment | Criteres | Valeur estimee | Priorite |
|---------|----------|---------------|----------|
| **Platinum** | CLV > 2000 $CA ou > 10 commandes | Tres haute | Service white-glove, representant dedie |
| **Gold** | CLV 500-2000 $CA ou 4-10 commandes | Haute | Offres VIP, acces anticipe |
| **Silver** | CLV 150-500 $CA ou 2-3 commandes | Moyenne | Nurturing fidelite, cross-sell |
| **Bronze** | 1 commande, CLV < 150 $CA | Standard | Flow post-achat, incitation 2e commande |
| **Prospect** | 0 commande | A qualifier | Nurturing educatif, code bienvenue |

### Bonnes pratiques de gestion des contacts pour peptides

1. **Nettoyer la base regulierement** : Tous les 3 mois, archivez les contacts sans activite depuis 12 mois et fusionnez les doublons
2. **Enrichir progressivement** : A chaque interaction (appel, email, commande), ajoutez des informations aux champs personnalises
3. **Respecter la vie privee** : Conformement a la Loi 25 du Quebec, documentez chaque consentement et offrez un acces facile aux preferences de confidentialite
4. **Segmenter avant de communiquer** : Ne jamais envoyer un email generique a toute la base. Minimum 2-3 segments distincts
5. **Historiser les interactions** : Chaque appel, email, note doit etre enregistre dans la timeline. Un representant qui reprend un dossier doit pouvoir comprendre toute la relation en 2 minutes

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Fiche contact** | L'ensemble des informations et de l'historique d'une personne |
| **Source d'acquisition** | Canal par lequel le contact est arrive (site web, salon, referral, etc.) |
| **Tag** | Etiquette libre pour categoriser un contact |
| **Segment** | Groupe dynamique de contacts repondant a des criteres definis |
| **Attribution** | Assignation d'un contact a un representant commercial |
| **Doublon** | Deux fiches representant la meme personne dans le systeme |
| **Timeline** | Chronologie de toutes les interactions avec un contact |

---

## Pages reliees

- [Pipeline](/admin/crm/pipeline) : Vue des deals associes aux contacts
- [Leads](/admin/crm/leads) : Gestion specifique des prospects
- [Entreprises](/admin/crm/companies) : Fiches des entreprises associees
- [Listes et Segments](/admin/crm/lists) : Groupement et segmentation
- [Import/Export](/admin/crm/import-export) : Outils d'importation et exportation
- [Doublons](/admin/crm/duplicates) : Detection et fusion des doublons
