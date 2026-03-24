# Modeles de Consentement

> **Section**: Media > Gestion de Contenu > Modeles de Consentement
> **URL**: `/admin/media/consent-templates`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Modeles de Consentement** permet de creer, modifier et gerer les formulaires de consentement envoyes a vos clients. Chaque modele definit les questions posees, le texte legal et le type de consentement.

**En tant que gestionnaire, vous pouvez :**
- Voir tous les modeles de consentement existants avec leur statut
- Creer un nouveau modele avec un constructeur de questions visuel
- Modifier un modele existant (nom, description, questions, texte legal)
- Activer ou desactiver un modele
- Supprimer un modele inutilise (sans consentements associes)
- Gerer les versions des modeles

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Modele (Template)** | Formulaire pre-configure reutilisable pour les demandes de consentement |
| **Question** | Element du formulaire (case a cocher, champ texte ou signature) |
| **Texte legal** | Clause juridique affichee au client avant la signature |
| **Version** | Numero de version du modele (incremente a chaque modification) |
| **Actif/Inactif** | Un modele actif est disponible pour de nouvelles demandes |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Modeles de Consentement** dans le panneau lateral
3. Ou naviguez vers `/admin/media/consent-templates`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Modeles de Consentement** avec icone
- Bouton **Creer un modele** pour en ajouter un nouveau

### 2. Formulaire de creation/modification
Quand vous creez ou modifiez un modele, un formulaire detaille apparait :

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| **Nom** | Nom du modele (ex: "Consentement video standard") | Oui |
| **Type** | Apparition video, Temoignage, Photo, Etude de cas, Marketing, Autre | Oui |
| **Description** | Description interne du modele | Non |
| **Questions** | Liste de questions configurables (voir ci-dessous) | Oui (min. 1) |
| **Texte legal** | Clause juridique en format libre | Non |
| **Actif** | Case a cocher pour rendre le modele disponible | Oui |

### 3. Constructeur de questions
Chaque question comprend :

| Element | Description |
|---------|-------------|
| **Texte de la question** | Le libelle affiche au client |
| **Type** | Case a cocher (checkbox), Champ texte (text) ou Signature (signature) |
| **Obligatoire** | Si le client doit obligatoirement repondre |
| **Poignee de deplacement** | Pour reorganiser l'ordre des questions |
| **Bouton supprimer** | Pour retirer une question |

### 4. Liste des modeles existants
Chaque modele affiche :
- Nom et badge de type
- Badge actif/inactif
- Numero de version
- Description (si definie)
- Nombre de questions et de consentements utilisant ce modele
- Date de creation
- Boutons modifier et supprimer

---

## Fonctionnalites detaillees

### Creer un modele
1. Cliquez sur **Creer un modele**
2. Remplissez le nom (ex: "Consentement temoignage BioCycle")
3. Selectionnez le type (ex: "Temoignage")
4. Ajoutez les questions une par une :
   - Cliquez sur **Ajouter une question**
   - Tapez le texte (ex: "J'autorise BioCycle Peptides a utiliser mon temoignage video")
   - Choisissez le type (case a cocher pour les autorisations, signature pour la fin)
   - Cochez "Obligatoire" si necessaire
5. Redigez le texte legal
6. Cochez "Actif" pour rendre le modele disponible
7. Cliquez sur **Creer**

### Modifier un modele
1. Cliquez sur l'icone crayon a cote du modele
2. Le formulaire se remplit avec les valeurs actuelles
3. Modifiez les champs souhaites
4. Cliquez sur **Mettre a jour**
5. La version est automatiquement incrementee

### Supprimer un modele
1. Cliquez sur l'icone poubelle
2. Confirmez la suppression
3. **Attention** : un modele avec des consentements associes ne peut pas etre supprime (le bouton est desactive)

---

## Types de questions

| Type | Utilisation | Exemple |
|------|-------------|---------|
| **Checkbox** | Autorisation explicite par case a cocher | "J'accepte que mon image soit utilisee" |
| **Text** | Reponse libre du client | "Precisions sur le contexte d'utilisation" |
| **Signature** | Signature electronique du client | "Signature du client" |

---

## Flux de travail recommandes

### Configuration initiale
Creez au minimum ces 3 modeles :

1. **Consentement video standard**
   - Type : VIDEO_APPEARANCE
   - Questions : autorisation d'enregistrement + autorisation de diffusion + signature
   - Texte legal : clauses de droit a l'image

2. **Consentement temoignage**
   - Type : TESTIMONIAL
   - Questions : autorisation d'utilisation + autorisation de publication + precisions + signature
   - Texte legal : clauses de temoignage commercial

3. **Consentement marketing**
   - Type : MARKETING
   - Questions : autorisation nom/image + duree + canaux + signature
   - Texte legal : clauses de marketing et publicite

---

## Questions frequentes

**Q : Puis-je modifier un modele deja utilise par des consentements ?**
R : Oui, les modifications s'appliquent aux futurs consentements. Les consentements existants conservent la version du modele au moment de la demande.

**Q : Le texte legal est-il obligatoire ?**
R : Non techniquement, mais fortement recommande pour la validite juridique du consentement. Consultez un avocat pour le contenu.

**Q : Comment associer un modele a une demande de consentement ?**
R : Les modeles sont utilises automatiquement lors de la creation d'un consentement. Le type du modele correspond au type de consentement demande.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Signature electronique** | Validation numerique ayant valeur juridique |
| **Clause** | Article juridique d'un contrat ou formulaire |
| **Formulaire** | Document structure avec des champs a remplir |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Consentements](./32-consents.md) | Suivi des consentements individuels |
| [Videos](./27-videos.md) | Videos associees aux consentements |
