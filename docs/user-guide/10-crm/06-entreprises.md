# Gestion des Entreprises

> **Section**: CRM > Entreprises
> **URL**: `/admin/crm/companies`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Entreprises** gere les fiches des organisations (cliniques, pharmacies, laboratoires, distributeurs) avec lesquelles BioCycle Peptides fait affaire en B2B. Chaque entreprise peut avoir plusieurs contacts associes.

**En tant que gestionnaire, vous pouvez :**
- Voir la liste de toutes les entreprises dans votre CRM
- Creer et modifier des fiches entreprises
- Associer des contacts a une entreprise (employes, decideurs)
- Suivre les deals et revenus generes par entreprise
- Categoriser par secteur d'activite, taille, region
- Hierarchiser les entreprises (siege vs succursales)
- Consulter l'historique complet des interactions avec l'entreprise
- Calculer la valeur d'un compte (revenu total genere)

---

## Concepts de base pour les debutants

### Pourquoi gerer les entreprises separement ?

En B2B (Business-to-Business), vous ne vendez pas a une personne isolee mais a une organisation. Une meme entreprise peut avoir :
- **Plusieurs contacts** : le decideur, l'acheteur, l'utilisateur final
- **Plusieurs deals** : une premiere commande, un renouvellement, un upsell
- **Un historique riche** : negociations, contrats, reclamations

La fiche entreprise centralise tout cela en un seul endroit.

### Organisation typique pour BioCycle Peptides

| Type d'entreprise | Exemples | Particularites |
|-------------------|----------|----------------|
| **Clinique medicale** | Clinique Sante Plus, Centre de medecine sportive | Commandent des peptides therapeutiques |
| **Pharmacie** | Pharmacie Jean-Coutu, Uniprix | Distribution au detail |
| **Laboratoire** | Labo recherche UdeM | Commandent pour la recherche |
| **Distributeur** | DistribPharma QC | Volumes importants, prix negocies |
| **Centre de conditionnement** | CrossFit Montreal | Produits de performance |

---

## Comment y acceder

1. CRM > panneau lateral, cherchez dans le groupe principal
2. URL directe : `/admin/crm/companies` (si le lien existe dans le CRM)
3. Ou via la recherche globale en tapant "entreprises"

---

## Vue d'ensemble de l'interface

### 1. La liste des entreprises

Chaque fiche affiche :
- **Nom de l'entreprise** et logo (si disponible)
- **Secteur d'activite** (sante, pharmaceutique, sport, etc.)
- **Nombre de contacts** associes
- **Nombre de deals** ouverts
- **Revenu total** genere par ce compte
- **Representant** en charge du compte
- **Region** ou adresse

### 2. Le panneau de detail

Au clic sur une entreprise :

**Informations generales** :
- Raison sociale, NEQ (numero d'entreprise du Quebec)
- Adresse, telephone, site web
- Secteur, taille (nombre d'employes), chiffre d'affaires estime
- Date de creation du compte

**Onglets** :
- **Contacts** : liste des personnes associees a cette entreprise
- **Deals** : opportunites de vente en cours et passees
- **Timeline** : historique de toutes les interactions
- **Commandes** : achats effectues sur la boutique
- **Documents** : contrats, devis, fichiers joints
- **Notes** : commentaires internes de l'equipe

---

## Fonctionnalites detaillees

### 1. Creer une entreprise

**Etapes** :
1. Cliquez sur **Nouvelle entreprise**
2. Remplissez les champs :
   - **Nom** (obligatoire)
   - **Secteur d'activite** (sante, sport, recherche, distribution)
   - **Adresse** complete
   - **Telephone** et **site web**
   - **NEQ** : Numero d'entreprise du Quebec (optionnel mais recommande pour B2B)
   - **Taille** : micro, petite, moyenne, grande
   - **Representant** : le responsable de ce compte
3. Cliquez sur **Sauvegarder**

### 2. Associer des contacts a une entreprise

**Etapes** :
1. Ouvrez la fiche de l'entreprise
2. Allez a l'onglet **Contacts**
3. Cliquez sur **Ajouter un contact**
4. Recherchez le contact existant, ou creez-en un nouveau
5. Definissez le role du contact dans l'entreprise (decideur, acheteur, technique)

> **Astuce** : Quand vous creez un contact et indiquez son entreprise, l'association se fait automatiquement.

### 3. Hierarchie d'entreprises

**Objectif** : Gerer les groupes avec siege et succursales.

**Etapes** :
1. Ouvrez la fiche de la succursale
2. Dans le champ **Entreprise parente**, selectionnez le siege
3. La hierarchie apparait visuellement dans la fiche du siege

### 4. Consulter la valeur d'un compte

Dans le panneau de detail, la section **Resume financier** affiche :
- **Revenu total** : somme de toutes les commandes passees
- **Revenu annuel** : revenus des 12 derniers mois
- **Panier moyen** : montant moyen par commande
- **Frequence d'achat** : nombre de commandes par an
- **CLV estimee** : valeur a vie estimee du client

---

## Workflows courants

### Onboarding d'un nouveau compte B2B
1. Creez la fiche entreprise avec toutes les informations
2. Ajoutez les contacts cles (decideur, acheteur, comptabilite)
3. Creez un deal dans le pipeline B2B
4. Assignez un representant dedie
5. Preparez une proposition commerciale personnalisee

### Revue trimestrielle des comptes
1. Filtrez les entreprises par revenu decroissant
2. Pour les 10 premiers comptes (vos meilleurs clients) :
   - Verifiez la satisfaction (derniers tickets, avis)
   - Identifiez les opportunites de upsell
   - Planifiez un appel de suivi
3. Pour les comptes inactifs depuis 3 mois :
   - Contactez pour comprendre la raison
   - Proposez une offre de reactivation

---

## Questions frequentes (FAQ)

**Q : Quelle est la difference entre une entreprise dans le CRM et un distributeur dans Commerce ?**
R : Un distributeur dans Commerce est un client B2B avec des prix negocies et des conditions speciales de vente. Une entreprise dans le CRM est plus large : elle represente toute organisation, qu'elle soit cliente ou non. Les deux sont lies : un distributeur est aussi une entreprise dans le CRM.

**Q : Puis-je supprimer une entreprise qui a des commandes ?**
R : Non, pour des raisons de tracabilite. Vous pouvez l'archiver pour qu'elle n'apparaisse plus dans les listes actives.

**Q : Comment gerer les fusions d'entreprises ?**
R : Contactez l'administrateur. La fusion de fiches entreprises regroupe les contacts, deals et historique sur une seule fiche, similaire a la fusion de contacts.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Compte** | Terme generique pour une fiche entreprise dans le CRM |
| **NEQ** | Numero d'entreprise du Quebec, identifiant legal |
| **Hierarchie** | Relation siege-succursales entre entreprises |
| **CLV** | Customer Lifetime Value, valeur totale generee par le client |
| **Upsell** | Vendre un produit superieur ou complementaire a un client existant |
| **Compte cle** | Entreprise strategique generant un revenu important |

---

## Pages reliees

- [Contacts](/admin/crm/contacts) : Personnes associees aux entreprises
- [Pipeline](/admin/crm/pipeline) : Deals des comptes B2B
- [Distributeurs](/admin/customers) : Clients B2B avec conditions speciales
- [Rapports CRM](/admin/crm/analytics) : Analyse par compte
- [Contrats](/admin/crm/contracts) : Contrats lies aux entreprises
