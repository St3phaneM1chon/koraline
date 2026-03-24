# Content Hub

> **Section**: Media > Gestion de Contenu > Content Hub
> **URL**: `/admin/media/content-hub`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Le **Content Hub** est le centre de commande de tout votre contenu video et multimedia. Il offre une vue synthetique de l'etat de votre bibliotheque de contenu avec des indicateurs de performance, des graphiques de repartition et des liens rapides vers les actions les plus courantes.

**En tant que gestionnaire, vous pouvez :**
- Voir le nombre total de videos par statut (brouillon, en revision, publie, archive)
- Consulter le nombre total de vues accumulees par vos videos
- Voir la repartition du contenu par type (podcast, formation, demo, temoignage, etc.)
- Voir la repartition du contenu par source (enregistrement, import, envoi manuel)
- Consulter les videos recemment ajoutees avec leur statut et leurs vues
- Acceder rapidement a la creation de video, gestion des categories et consentements

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Brouillon (Draft)** | Video ajoutee mais pas encore validee pour publication |
| **En revision (Review)** | Video soumise pour validation avant publication |
| **Publie (Published)** | Video visible sur le site public |
| **Archive** | Video retiree de la publication mais conservee dans le systeme |
| **Type de contenu** | Categorie fonctionnelle de la video (podcast, formation, demo, etc.) |
| **Source** | Provenance du contenu (enregistrement plateforme, import URL, envoi manuel) |
| **Placement** | Endroit ou la video est affichee sur le site (page produit, blog, accueil) |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Content Hub** dans le panneau lateral
3. Ou naviguez vers `/admin/media/content-hub`

---

## Vue d'ensemble de l'interface

### 1. En-tete
Le titre **Content Hub** avec l'icone de mise en page.

### 2. Cartes KPI (9 indicateurs)

| KPI | Description | Couleur |
|-----|-------------|---------|
| **Total videos** | Nombre total de videos dans le systeme | Indigo |
| **Publiees** | Videos actuellement visibles publiquement | Vert |
| **Brouillons** | Videos en cours de preparation | Gris |
| **En revision** | Videos en attente de validation | Jaune |
| **Archivees** | Videos retirees de la publication | Rouge |
| **Vues totales** | Nombre cumule de vues sur toutes les videos | Violet |
| **Categories actives** | Nombre de categories contenant des videos | Ambre |
| **Placements actifs** | Nombre d'emplacements ou des videos sont affichees | Indigo |
| **Consentements en attente** | Nombre de demandes de consentement non encore signees | Rose |

### 3. Graphiques de repartition

#### Par type de contenu
Un graphique en barres horizontales montrant la proportion de chaque type :
- Podcast
- Formation (Training)
- Session personnelle
- Demo produit
- Temoignage
- FAQ Video
- Enregistrement webinaire
- Tutoriel
- Histoire de marque
- Diffusion en direct

#### Par source
Un graphique en barres horizontales montrant l'origine du contenu :
- Enregistrement (Zoom, Teams, etc.)
- Import URL (YouTube, Vimeo)
- Envoi manuel

### 4. Videos recentes
Un tableau listant les 10 dernieres videos ajoutees avec :

| Colonne | Description |
|---------|-------------|
| **Titre** | Nom de la video |
| **Statut** | Badge colore (brouillon, en revision, publie, archive) |
| **Type** | Type de contenu (badge indigo) |
| **Vues** | Nombre de vues |
| **Date** | Date de creation |

### 5. Actions rapides (3 cartes)

| Carte | Description | Destination |
|-------|-------------|-------------|
| **Creer une video** | Ajouter une nouvelle video | `/admin/media/videos` |
| **Gerer les categories** | Organiser les categories | `/admin/media/video-categories` |
| **Voir les consentements** | Gerer les demandes de consentement | `/admin/media/consents` |

---

## Fonctionnalites detaillees

### Lire les statistiques
Les cartes KPI se chargent automatiquement depuis l'API `/api/admin/content-hub/stats`. Si les donnees ne se chargent pas, un message d'erreur s'affiche.

### Naviguer vers le detail
- Cliquez sur le titre d'une video recente pour aller a sa fiche detaillee
- Cliquez sur les cartes d'actions rapides pour acceder aux pages de gestion

---

## Flux de travail recommandes

### Routine de gestion de contenu
1. Ouvrez le Content Hub pour une vue d'ensemble
2. Verifiez les **consentements en attente** (badge rose) -- traitez-les en priorite
3. Verifiez les videos **en revision** -- validez-les ou demandez des modifications
4. Consultez les **brouillons** -- completez ou publiez les videos pretes
5. Analysez les types de contenu -- assurez-vous d'avoir un mix equilibre

### Planification de contenu
1. Notez la repartition actuelle par type (le graphique montre les lacunes)
2. Si un type est sous-represente (ex: temoignages), planifiez des sessions d'enregistrement
3. Verifiez les categories actives et creez-en de nouvelles si necessaire

---

## Questions frequentes

**Q : Le Content Hub affiche 0 partout**
R : Aucune video n'a encore ete ajoutee. Commencez par creer des videos dans la page [Videos](./27-videos.md) ou importez des enregistrements depuis [Importations](./30-imports.md).

**Q : Comment changer le statut d'une video ?**
R : Allez dans la page [Videos](./27-videos.md), selectionnez la video et modifiez son statut dans la fiche de detail.

**Q : Les "consentements en attente" bloquent-ils la publication ?**
R : Non, mais il est fortement recommande d'obtenir le consentement avant de publier une video ou un temoignage client.

**Q : Les vues incluent-elles les vues YouTube ?**
R : Les vues comptabilisees ici sont les vues internes (site BioCycle Peptides). Les vues YouTube sont visibles dans la page [Analytique](./02-analytics.md).

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **KPI** | Key Performance Indicator, indicateur cle de performance |
| **Webinaire** | Seminaire en ligne, souvent enregistre pour etre rejoue |
| **Temoignage** | Video d'un client partageant son experience |
| **Consentement** | Autorisation ecrite du client pour utiliser son image/temoignage |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Videos](./27-videos.md) | Gestion complete des videos |
| [Categories Video](./28-video-categories.md) | Organiser les categories |
| [Consentements](./32-consents.md) | Gerer les autorisations |
| [Analytique Media](./02-analytics.md) | Statistiques detaillees |
| [Importations](./30-imports.md) | Importer des enregistrements |
