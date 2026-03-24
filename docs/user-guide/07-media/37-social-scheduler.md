# Planificateur de Reseaux Sociaux

> **Section**: Media > Gestion de Contenu > Planificateur Social
> **URL**: `/admin/media/social-scheduler`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

Le **Planificateur de Reseaux Sociaux** permet de creer, planifier, publier et suivre vos publications sur les reseaux sociaux (Instagram, Facebook, X/Twitter, TikTok, LinkedIn) depuis une interface unique.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les publications planifiees, brouillons, publiees et echouees
- Creer une nouvelle publication avec choix de plateforme, contenu et image
- Planifier la publication pour une date et heure specifiques
- Basculer entre vue liste et vue calendrier
- Filtrer par plateforme et par statut
- Publier immediatement une publication planifiee ou un brouillon
- Generer des legendes avec l'aide de l'IA
- Supprimer des publications
- Voir le lien externe vers la publication sur la plateforme
- Naviguer entre les mois dans la vue calendrier

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Publication (Post)** | Contenu texte + image planifie pour un reseau social |
| **Brouillon (Draft)** | Publication sauvegardee mais pas encore planifiee |
| **Planifie (Scheduled)** | Publication programmee pour une date future |
| **Publie (Published)** | Publication envoyee sur le reseau social |
| **Echoue (Failed)** | Publication dont l'envoi a echoue (erreur API, token expire, etc.) |
| **Legende (Caption)** | Texte accompagnant la publication |
| **IA Caption** | Texte genere automatiquement par l'intelligence artificielle |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Planificateur Social** dans le panneau lateral
3. Ou naviguez vers `/admin/media/social-scheduler`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Planificateur Social** avec icone calendrier
- Description du planificateur
- Bouton de bascule **Vue calendrier / Vue liste**
- Bouton **Rafraichir** pour recharger les donnees
- Bouton **Nouveau post** pour creer une publication

### 2. Cartes de statistiques (4 indicateurs)

| Carte | Couleur | Description |
|-------|---------|-------------|
| **Planifies** | Indigo | Publications en attente d'envoi |
| **Brouillons** | Gris | Publications sauvegardees non planifiees |
| **Publies** | Vert | Publications envoyees avec succes |
| **Echoues** | Rouge | Publications dont l'envoi a echoue |

### 3. Pont Media-Marketing
Une carte de lien entre la section Media et la section Marketing, montrant la correlation entre publications sociales et campagnes marketing.

### 4. Filtres
- Filtre par **plateforme** : Toutes, Instagram, Facebook, X/Twitter, TikTok, LinkedIn
- Filtre par **statut** : Tous, Brouillon, Planifie, Publie, Echoue

### 5. Compositeur de publication
Quand vous cliquez sur **Nouveau post**, un panneau de composition s'ouvre :

#### Selecteur de plateforme
5 boutons avec icones et couleurs :

| Plateforme | Limite de caracteres |
|-----------|---------------------|
| **Instagram** | 2 200 caracteres |
| **Facebook** | 63 206 caracteres |
| **X/Twitter** | 280 caracteres |
| **TikTok** | 2 200 caracteres |
| **LinkedIn** | 3 000 caracteres |

#### Champs du compositeur

| Champ | Description |
|-------|-------------|
| **Texte** | Zone de texte avec compteur de caracteres et limite selon la plateforme |
| **URL d'image** | Lien vers l'image a joindre a la publication |
| **Date et heure** | Selecteur de date/heure pour la planification |
| **Statut** | Planifie ou Brouillon |
| **IA Caption** | Bouton pour generer une legende automatiquement |

#### Boutons d'action
- **IA Caption** (violet) : genere une legende BioCycle Peptides
- **Annuler** : ferme le compositeur
- **Planifier** : sauvegarde et planifie la publication

### 6. Vue Calendrier
Un calendrier mensuel montrant :
- Navigation mois precedent / mois suivant
- Jours de la semaine (Dim, Lun, Mar, etc.)
- Chaque jour affiche les publications prevues (3 max + compteur)
- Les publications sont codees par couleur selon la plateforme

### 7. Vue Liste
Chaque publication est une carte avec :
- **Icone de plateforme** (cercle colore)
- **Nom de la plateforme** et **badge de statut**
- **Contenu** du texte (3 lignes max)
- **URL d'image** si presente
- **Date planifiee**
- **Lien externe** vers la publication (si publiee)
- **Message d'erreur** (si echouee, en rouge)
- **Boutons d'action** : Publier maintenant, Supprimer

### 8. Pagination
Navigation par pages en bas de la liste.

---

## Fonctionnalites detaillees

### Creer et planifier une publication
1. Cliquez sur **Nouveau post**
2. Selectionnez la plateforme cible (ex: Instagram)
3. Redigez votre texte (attention a la limite de caracteres)
4. Optionnellement, ajoutez une URL d'image
5. Selectionnez la date et l'heure de publication
6. Choisissez le statut (Planifie = sera publie automatiquement, Brouillon = a valider)
7. Cliquez sur **Planifier**

### Generer une legende IA
1. Dans le compositeur, cliquez sur le bouton **IA Caption** (violet)
2. Une legende adaptee a BioCycle Peptides est generee automatiquement
3. La legende inclut des hashtags pertinents
4. Modifiez-la selon vos besoins avant de planifier

### Publier immediatement
1. Sur une publication planifiee, un brouillon ou un post echoue
2. Cliquez sur l'icone **Envoyer** (fleche)
3. La publication est envoyee immediatement a la plateforme
4. Le statut passe a "Publie" (ou "Echoue" si erreur)

### Supprimer une publication
1. Cliquez sur l'icone **Poubelle** sur la carte de la publication
2. La publication est supprimee definitivement
3. Si la publication etait deja publiee sur la plateforme, elle n'est PAS supprimee de la plateforme

### Naviguer dans le calendrier
1. Basculez en vue calendrier via le bouton en haut a droite
2. Utilisez les fleches gauche/droite pour changer de mois
3. Chaque jour montre les publications prevues sous forme de badges colores
4. Si un jour a plus de 3 publications, un compteur "+X" s'affiche

---

## Limites de caracteres par plateforme

| Plateforme | Limite | Recommandation |
|-----------|--------|----------------|
| **Instagram** | 2 200 | Les 125 premiers caracteres sont les plus importants (avant "voir plus") |
| **Facebook** | 63 206 | Posts courts (100-250 caracteres) performent mieux |
| **X/Twitter** | 280 | Utiliser les threads pour les contenus longs |
| **TikTok** | 2 200 | Les 100 premiers caracteres sont visibles en apercu |
| **LinkedIn** | 3 000 | Posts entre 1 300 et 2 000 caracteres sont optimaux |

---

## Flux de travail recommandes

### Planification hebdomadaire
1. Chaque lundi, ouvrez le planificateur social
2. Consultez les publications prevues cette semaine (vue calendrier)
3. Creez les publications manquantes pour un rythme regulier
4. Utilisez l'IA Caption comme point de depart
5. Ajustez le texte pour chaque plateforme
6. Planifiez aux heures optimales de publication

### Heures optimales de publication (Canada)

| Plateforme | Meilleurs moments |
|-----------|-------------------|
| **Instagram** | Mardi 11h, Mercredi 11h, Vendredi 10h |
| **Facebook** | Mardi-Jeudi 8h-12h |
| **X/Twitter** | Lundi-Vendredi 8h-10h |
| **LinkedIn** | Mardi-Jeudi 10h-12h |
| **TikTok** | Mardi 9h, Jeudi 12h, Vendredi 17h |

### Gestion des echecs
1. Filtrez par statut "Echoue"
2. Lisez le message d'erreur (en rouge sous la publication)
3. Causes courantes : token API expire, contenu bloque par la plateforme, image inaccessible
4. Corrigez le probleme et cliquez sur **Publier maintenant**

---

## Questions frequentes

**Q : Les publications sont-elles envoyees automatiquement a l'heure planifiee ?**
R : Oui, un processus de publication automatique envoie les publications a la plateforme a la date et heure definies. Le delai peut etre de quelques minutes.

**Q : L'IA Caption genere toujours le meme texte ?**
R : Non, le generateur produit des variantes aleatoires parmi un ensemble de modeles adaptes a BioCycle Peptides. Chaque clic genere un texte different.

**Q : Puis-je publier la meme chose sur plusieurs plateformes ?**
R : Pas en un seul clic. Creez une publication par plateforme et adaptez le texte aux specificites de chacune (longueur, hashtags, ton).

**Q : Que se passe-t-il si je supprime un post deja publie ?**
R : La publication est supprimee de Koraline, mais elle reste sur la plateforme (Instagram, Facebook, etc.). Vous devez la supprimer manuellement sur la plateforme si necessaire.

**Q : Puis-je voir les statistiques de mes publications ?**
R : Les statistiques d'engagement sont visibles dans la page [Analytique Media](./02-analytics.md) qui agrege les donnees de toutes les plateformes.

---

## Strategie expert : Frequence de publication et types de contenu pour un e-commerce de peptides

### Frequence de publication optimale par plateforme

La regularite prime sur le volume. Mieux vaut publier 3 fois par semaine avec du contenu de qualite que 7 fois avec du contenu mediocre. Voici les frequences recommandees specifiquement pour le marche des peptides de recherche :

| Plateforme | Frequence recommandee | Minimum acceptable | Maximum utile | Meilleurs jours |
|-----------|----------------------|-------------------|---------------|-----------------|
| **Instagram** | 3-5 publications/semaine | 2/semaine | 1/jour | Mardi, Mercredi, Vendredi |
| **LinkedIn** | 2-3 publications/semaine | 1/semaine | 5/semaine | Mardi, Mercredi, Jeudi |
| **X/Twitter** | 1-2 publications/jour | 3/semaine | 5/jour | Lundi a Vendredi |
| **TikTok** | 3-5 publications/semaine | 2/semaine | 2/jour | Mardi, Jeudi, Vendredi |
| **Facebook** | 2-3 publications/semaine | 1/semaine | 1/jour | Mardi, Jeudi |

**Pourquoi ces frequences ?** Les algorithmes de chaque plateforme favorisent les comptes qui publient regulierement. Mais publier trop souvent dilue l'engagement par post (le denominateur augmente plus vite que le numerateur). Pour un marche de niche comme les peptides, la qualite et la pertinence du contenu sont plus importantes que le volume.

### Repartition des types de contenu (regle 40/20/20/20)

Le contenu d'un e-commerce de peptides doit equilibrer education, transparence, preuve sociale et promotion. La repartition recommandee :

| Type de contenu | % | Exemples | Objectif |
|-----------------|---|----------|----------|
| **Educatif** | 40% | Explication des peptides, guide de reconstitution, comprendre un CoA, actualites scientifiques, differences entre peptides | Etablir l'autorite et la confiance |
| **Behind-the-scenes / Laboratoire** | 20% | Visite du labo, processus de controle qualite, equipe au travail, reception de matieres premieres, tests HPLC | Humaniser la marque et demontrer la qualite |
| **Temoignages et preuve sociale** | 20% | Avis clients, cas d'etude de laboratoires utilisant BioCycle, citations de chercheurs, nombre de commandes traitees | Creer la confiance par la preuve |
| **Promotions et produits** | 20% | Nouveau produit, promotion flash, livraison gratuite, programme de fidelite, code promo ambassadeur | Generer des ventes directes |

**Pourquoi seulement 20% de promotion ?** Les plateformes sociales penalisent les comptes qui ne publient que du contenu promotionnel. De plus, les acheteurs de peptides sont des professionnels informes qui reagissent mieux a l'education et a la transparence qu'aux promotions agressives.

### Idees de contenu par plateforme

**Instagram (visuel + education) :**

| Semaine | Lundi | Mercredi | Vendredi |
|---------|-------|----------|----------|
| S1 | Infographie : "Peptide du mois : BPC-157" | Photo labo : controle qualite en cours | Temoignage client (capture d'ecran avis) |
| S2 | Carrousel : "5 criteres pour choisir un fournisseur de peptides" | Reel : reconstitution d'un peptide (timelapse) | Annonce nouveau produit |
| S3 | Infographie : "Purete 95% vs 99% : la difference" | Story : journee type chez BioCycle | Promotion : code promo weekend |
| S4 | Carrousel : "Comment lire un certificat d'analyse" | Photo : equipe BioCycle | Recap mensuel : produits les plus populaires |

**LinkedIn (professionnel + B2B) :**

| Type | Frequence | Exemple |
|------|-----------|---------|
| Article long format | 1/mois | "L'importance de la traçabilite dans la chaine d'approvisionnement des peptides" |
| Post court + image | 2/semaine | Nouveau produit, actualite reglementaire, recrutement |
| Partage d'etude | 1/semaine | Lien vers une publication scientifique pertinente avec commentaire BioCycle |
| Temoignage B2B | 2/mois | "Le laboratoire X utilise BioCycle pour ses recherches depuis 2 ans" |

**X/Twitter (actualite + engagement rapide) :**

| Matin (8h-10h) | Midi (12h) | Apres-midi (15h) |
|-----------------|------------|-------------------|
| Actualite scientifique + commentaire | Question a la communaute | Astuce produit ou lien vers article |

**TikTok (video courte + education accessible) :**

| Type de video | Duree | Exemple |
|---------------|-------|---------|
| Education rapide | 15-30s | "En 15 secondes : pourquoi la purete du peptide compte" |
| Behind-the-scenes | 30-60s | "Une journee au labo BioCycle" |
| Tendance adaptee | 15-30s | Reprendre un format tendance avec un angle peptides/science |
| Reponse a commentaire | 15-30s | Repondre a une question frequente en video |

### Hashtags recommandes par plateforme

**Instagram :**
- Generaux : #peptides #researchpeptides #peptideresearch #lablife #science
- Specifiques : #BPC157 #TB500 #peptidequality #certificateofanalysis
- Marque : #BioCyclePeptides #BioCycleResearch #PeptidesMadeInCanada
- Limite : 10-15 hashtags par post (au-dela, l'algorithme penalise)

**LinkedIn :**
- #PeptideResearch #Biotechnology #LabSupply #QualityControl #ScienceCanada
- Limite : 3-5 hashtags par post

**TikTok :**
- #PeptideTok #ScienceTok #LabLife #Research #Biohacking #Peptides
- Limite : 5-8 hashtags

### Calendrier editorial mensuel type

| Semaine | Instagram (3x) | LinkedIn (2x) | X/Twitter (quotidien) | TikTok (3x) |
|---------|----------------|----------------|----------------------|--------------|
| **S1** | Educatif + Labo + Promo | Article + Post produit | Actu + Questions + Tips | Education + BTS + Tendance |
| **S2** | Educatif + Temoignage + Labo | Etude + Temoignage B2B | Actu + Engagement + Tips | Education + Reponse + BTS |
| **S3** | Educatif + Labo + Temoignage | Post produit + Actu reglementaire | Actu + Questions + Promo | Education + Tendance + BTS |
| **S4** | Educatif + Promo + Recap | Article + Recap mensuel | Actu + Engagement + Recap | Education + Recap + BTS |

### Metriques de performance des reseaux sociaux

| Indicateur | Instagram | LinkedIn | X/Twitter | TikTok |
|------------|-----------|----------|-----------|--------|
| **Taux d'engagement cible** | 2-5% | 2-4% | 0.5-2% | 3-8% |
| **Croissance abonnes/mois** | 3-5% | 5-10% | 2-5% | 5-15% |
| **Clics vers le site/mois** | 50-200 | 30-100 | 20-80 | 30-150 |
| **Meilleur indicateur** | Sauvegardes + partages | Clics + commentaires | Retweets + reponses | Partages + completions video |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Post** | Publication sur un reseau social |
| **Caption** | Legende textuelle accompagnant une image ou video |
| **Hashtag** | Mot-cle precede de # pour la categorisation sur les reseaux sociaux |
| **Scheduler** | Systeme de planification automatique des publications |
| **Thread** | Serie de publications liees (surtout utilise sur X/Twitter) |
| **Engagement** | Interactions des utilisateurs avec votre contenu (likes, commentaires, partages) |

---

## Pages associees

| Page | Description |
|------|-------------|
| [Analytique Media](./02-analytics.md) | Statistiques d'engagement |
| [Brand Kit](./36-brand-kit.md) | Couleurs et visuels de marque |
| [Images](./34-images.md) | Visuels pour les publications |
| [Publicites Meta](./13-ads-meta.md) | Campagnes payantes Facebook/Instagram |
| [Publicites LinkedIn](./12-ads-linkedin.md) | Campagnes payantes LinkedIn |
