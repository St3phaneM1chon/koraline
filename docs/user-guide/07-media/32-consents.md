# Consentements

> **Section**: Media > Gestion de Contenu > Consentements
> **URL**: `/admin/media/consents`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Consentements** centralise le suivi de toutes les autorisations obtenues (ou en attente) aupres de vos clients pour l'utilisation de leur image, temoignage ou participation dans du contenu multimedia. Cette page est essentielle pour la conformite legale.

**En tant que gestionnaire, vous pouvez :**
- Voir tous les consentements classes par client, date, type et statut
- Filtrer par statut (en attente, accorde, revoque, expire) et par type
- Rechercher un consentement par nom ou email de client
- Consulter le detail d'un consentement individuel
- Telecharger le PDF du consentement signe
- Renvoyer une demande de consentement en attente
- Exporter la liste complete en CSV pour conformite

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Consentement** | Autorisation ecrite d'un client pour utiliser son image ou contenu |
| **En attente (Pending)** | Demande envoyee mais pas encore signee par le client |
| **Accorde (Granted)** | Client a signe et accorde l'autorisation |
| **Revoque (Revoked)** | Client a retire son autorisation apres l'avoir accordee |
| **Expire (Expired)** | Consentement dont la duree de validite est depassee |
| **Formulaire de consentement** | Document standard utilise pour la demande (voir Modeles) |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Consentements** dans le panneau lateral
3. Ou depuis le [Content Hub](./26-content-hub.md), cliquez sur **Voir les consentements**

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Consentements** avec icone
- Bouton **Exporter CSV** pour telecharger la liste

### 2. Cartes de statistiques (4 indicateurs)

| Carte | Description |
|-------|-------------|
| **Total** | Nombre total de consentements dans le systeme |
| **En attente** | Nombre de demandes non encore signees (jaune) |
| **Accordes** | Nombre d'autorisations valides (vert) |
| **Revoques** | Nombre d'autorisations retirees (rouge) |

### 3. Filtres
- **Recherche** par nom ou email de client
- **Statut** : Tous, En attente, Accorde, Revoque, Expire
- **Type** : Apparition video, Temoignage, Photo, Etude de cas, Marketing, Autre
- Bouton **Effacer** pour reinitialiser les filtres

### 4. Tableau des consentements

| Colonne | Description |
|---------|-------------|
| **Client** | Nom et email du client |
| **Type** | Badge indiquant le type de consentement |
| **Sujet** | Video ou contenu associe (cliquable) |
| **Statut** | Badge colore (en attente, accorde, revoque, expire) |
| **Date** | Date de creation, d'accord ou de revocation |
| **Demande par** | Nom de l'administrateur qui a envoye la demande |
| **Actions** | Voir le detail, telecharger le PDF, renvoyer la demande |

### 5. Pagination
Navigation par pages en bas du tableau.

---

## Types de consentement

| Type | Cle | Description |
|------|-----|-------------|
| **Apparition video** | VIDEO_APPEARANCE | Le client apparait dans une video |
| **Temoignage** | TESTIMONIAL | Le client donne un temoignage sur votre service |
| **Photo** | PHOTO | Utilisation de la photo du client |
| **Etude de cas** | CASE_STUDY | Le client participe a une etude de cas publiee |
| **Marketing** | MARKETING | Utilisation du nom/image dans du materiel marketing |
| **Autre** | OTHER | Tout autre type de consentement |

---

## Fonctionnalites detaillees

### Voir le detail d'un consentement
1. Cliquez sur l'icone oeil dans la colonne Actions
2. Vous etes redirige vers la page de detail `/admin/media/consents/[id]`
3. Le detail montre toutes les informations, l'historique et le formulaire signe

### Telecharger le PDF
1. Si un PDF est disponible (consentement signe), l'icone de telechargement est visible
2. Cliquez dessus pour telecharger le document au format PDF
3. Conservez ce document pour vos archives de conformite

### Renvoyer une demande
1. Pour un consentement en statut "En attente", l'icone d'envoi est disponible
2. Cliquez dessus pour renvoyer le formulaire au client par email
3. Un message confirme l'envoi

### Exporter en CSV
1. Cliquez sur **Exporter CSV** en haut a droite
2. Un fichier CSV est telecharge avec toutes les colonnes du tableau
3. Utilisez ce fichier pour vos audits de conformite ou rapports internes

---

## Flux de travail recommandes

### Apres un enregistrement avec un client
1. La demande de consentement est automatiquement creee lors de l'import de l'enregistrement
2. Verifiez le consentement dans cette page (statut "En attente")
3. Le client recoit un email avec le formulaire a signer
4. Une fois signe, le statut passe a "Accorde"
5. Vous pouvez maintenant publier la video en toute legalite

### Audit mensuel de conformite
1. Filtrez par statut "En attente" -- relancez les demandes en suspens
2. Filtrez par statut "Expire" -- renouvelez les consentements expires
3. Exportez la liste en CSV pour votre dossier de conformite
4. Verifiez que toutes les videos publiees ont un consentement valide

---

## Questions frequentes

**Q : Un client peut-il revoquer son consentement ?**
R : Oui, le client peut demander la revocation a tout moment. Le statut passe a "Revoque" et la video associee devrait etre depubliee.

**Q : Les consentements sont-ils necessaires au Canada ?**
R : Oui, la Loi 25 du Quebec et les lois federales sur la protection de la vie privee exigent un consentement explicite pour utiliser l'image d'une personne a des fins commerciales.

**Q : Comment creer un nouveau formulaire de consentement ?**
R : Utilisez la page [Modeles de Consentement](./33-consent-templates.md) pour creer ou modifier les formulaires.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Loi 25** | Loi quebecoise sur la protection des renseignements personnels |
| **RGPD** | Reglement general sur la protection des donnees (Europe) |
| **PDF signe** | Document contenant la signature electronique du client |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Modeles de Consentement](./33-consent-templates.md) | Creer et gerer les formulaires |
| [Videos](./27-videos.md) | Voir les videos associees aux consentements |
| [Importations](./30-imports.md) | Consentements auto-crees lors des imports |
| [Content Hub](./26-content-hub.md) | Indicateur de consentements en attente |
