# Gestion du Blog

> **Section**: Marketing > Blog
> **URL**: `/admin/blog`
> **Niveau**: Debutant a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Blog** permet de gerer les articles publies sur la section blog de votre boutique BioCycle Peptides. Le blog est un outil essentiel pour le referencement (SEO) et l'engagement des clients : il attire du trafic organique via les moteurs de recherche et positionne votre marque comme une reference dans le domaine des peptides de recherche.

**En tant que gestionnaire, vous pouvez :**
- Voir la liste de tous les articles (publies et brouillons)
- Rechercher un article par titre ou extrait
- Filtrer les articles par statut (tous, publies, brouillons)
- Creer un nouvel article
- Modifier un article existant
- Previsualiser un article sur le site public
- Consulter l'auteur et la date de publication de chaque article

---

## Concepts pour les debutants

### Pourquoi tenir un blog ?

Un blog professionnel sur un site e-commerce sert plusieurs objectifs :
- **SEO** (Search Engine Optimization) : Les articles contenant des mots-cles pertinents aident votre site a apparaitre plus haut dans Google
- **Credibilite** : Des articles informatifs sur les peptides renforcent la confiance des clients
- **Engagement** : Le contenu interessant incite les visiteurs a revenir et a s'inscrire a la newsletter
- **Conversion** : Des articles bien rediges peuvent orienter les lecteurs vers vos produits

### Statuts d'un article

| Statut | Signification |
|--------|---------------|
| **Publie** | L'article est visible sur le site public |
| **Brouillon** | L'article est en cours de redaction, invisible pour les visiteurs |

### Anatomie d'un article

- **Titre** : Le titre principal de l'article
- **Slug** : L'identifiant URL de l'article (genere automatiquement a partir du titre)
- **Extrait** : Un court resume qui apparait dans les listes d'articles
- **Contenu** : Le corps de l'article en format riche
- **Auteur** : La personne qui a ecrit l'article
- **Date de publication** : La date a laquelle l'article a ete rendu public

---

## Comment y acceder

### Methode 1 : Via le menu principal
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la **barre de navigation horizontale** en haut, cliquez sur **Marketing**
3. Dans le **panneau lateral gauche**, cliquez sur **Blog**

### Methode 2 : Via le rail de navigation (icones a gauche)
1. Cliquez sur l'icone de la section **Marketing** dans le rail
2. Cliquez sur **Blog**

### Methode 3 : Via la barre de recherche
1. Cliquez sur la barre de recherche (ou tapez `/`)
2. Tapez "blog" ou "articles"
3. Selectionnez le resultat

---

## Vue d'ensemble de l'interface

La page Blog utilise un layout en **tableau** plutot que le layout master/detail Outlook.

### 1. L'en-tete de page

En haut, vous trouvez :
- Le titre "Blog" et le sous-titre
- Le bouton **Nouvel article** qui ouvre l'editeur de creation

### 2. Les filtres et la recherche

Sous l'en-tete :
- **Barre de recherche** : Tapez un mot pour filtrer les articles par titre
- **Boutons de filtre** : Trois options
  - **Tous** : Affiche tous les articles
  - **Publies** : Affiche uniquement les articles publies
  - **Brouillons** : Affiche uniquement les brouillons

### 3. Le tableau des articles

Un tableau avec quatre colonnes :

| Colonne | Description |
|---------|-------------|
| **Article** | Titre de l'article et extrait (premiere ligne tronquee) |
| **Statut** | Badge "Publie" (vert) ou "Brouillon" (gris) |
| **Date** | Date de publication ou de creation |
| **Actions** | Boutons pour voir l'article sur le site (oeil) ou le modifier (crayon) |

---

## Fonctionnalites detaillees

### 1. Creer un nouvel article

1. Cliquez sur **Nouvel article** en haut a droite
2. Vous etes redirige vers la page d'edition `/admin/blog/new`
3. Remplissez les champs :
   - Titre
   - Contenu (editeur riche)
   - Extrait (resume)
   - Categorie
   - Mots-cles SEO
4. Choisissez de publier immediatement ou de sauvegarder comme brouillon
5. Sauvegardez

### 2. Modifier un article existant

1. Dans le tableau, trouvez l'article a modifier
2. Cliquez sur l'icone **crayon** dans la colonne Actions
3. Vous etes redirige vers la page d'edition `/admin/blog/[id]/edit`
4. Modifiez les champs souhaites
5. Sauvegardez

### 3. Previsualiser un article sur le site public

1. Dans le tableau, trouvez l'article
2. Cliquez sur l'icone **oeil** dans la colonne Actions
3. L'article s'ouvre dans un nouvel onglet a l'adresse `/blog/[slug]`

### 4. Rechercher un article

Tapez un mot ou une expression dans la barre de recherche. La liste se filtre instantanement. La recherche porte sur le titre de l'article.

### 5. Filtrer par statut

Cliquez sur **Tous**, **Publies** ou **Brouillons** pour afficher uniquement les articles correspondants. Le filtre actif est mis en evidence.

---

## Scenarios concrets

### Scenario A : Publier un article sur un nouveau peptide

1. Cliquez sur **Nouvel article**
2. Titre : "BPC-157 : Guide complet pour la recherche"
3. Redigez un contenu detaille avec les proprietes, les protocoles de recherche, et les references scientifiques
4. Ajoutez un extrait : "Tout ce que les chercheurs doivent savoir sur le BPC-157, du mecanisme d'action aux protocoles de dosage."
5. Publiez l'article
6. Partagez le lien dans votre prochaine newsletter

### Scenario B : Gerer les brouillons en attente de relecture

1. Filtrez sur **Brouillons**
2. Parcourez la liste des articles en attente
3. Ouvrez chaque brouillon pour le relire et le corriger
4. Quand un article est pret, changez son statut en "Publie"

### Scenario C : Verifier le contenu publie sur le site

1. Filtrez sur **Publies**
2. Pour chaque article, cliquez sur l'icone oeil pour le visualiser tel qu'il apparait aux visiteurs
3. Verifiez la mise en forme, les liens, et les images
4. Si une correction est necessaire, cliquez sur le crayon pour editer

---

## FAQ

**Q: Le blog est-il disponible dans plusieurs langues ?**
R: Les articles sont rediges dans la langue de votre choix. Le systeme de traduction du site gere les elements d'interface (menus, boutons) dans les 22 langues supportees.

**Q: Comment les articles apparaissent-ils sur le site public ?**
R: Les articles publies sont visibles sur la page `/blog` du site. Chaque article a sa propre URL basee sur son slug (par exemple `/blog/bpc-157-guide-complet`).

**Q: Puis-je programmer la publication d'un article a une date future ?**
R: Le champ "date de publication" permet de definir quand l'article sera considere comme publie. Sauvegardez-le comme brouillon et changez son statut a la date souhaitee, ou utilisez le champ de date de publication.

**Q: Comment optimiser mes articles pour le SEO ?**
R: Utilisez des titres descriptifs avec des mots-cles pertinents, redigez un extrait accrocheur, structurez le contenu avec des sous-titres, et incluez des liens vers vos pages produit.

---

## Strategie expert : contenu blog pour un e-commerce de peptides

### ATTENTION CONFORMITE SANTE CANADA

**REGLE ABSOLUE** : Ne JAMAIS faire de claims medicaux dans les articles de blog. Sante Canada classe les peptides comme des produits de recherche, pas comme des medicaments ou des supplements de sante. Toute affirmation therapeutique ("le BPC-157 guerit les blessures", "l'Ipamorelin fait perdre du poids") peut entrainer des poursuites, des amendes et le retrait de vos produits.

**Formulations a utiliser SYSTEMATIQUEMENT** :
- "Pour usage en recherche uniquement" (a inclure dans chaque article)
- "Les etudes suggerent que..." (jamais "le BPC-157 fait...")
- "Dans un contexte de recherche scientifique..." (pas "pour votre sante...")
- "Les chercheurs ont observe que..." (pas "vous constaterez que...")
- "Ce contenu est a titre informatif et ne constitue pas un avis medical"

**Avertissement a inserer dans chaque article** :
> AVERTISSEMENT : Les peptides vendus par BioCycle Peptides sont destines exclusivement a la recherche scientifique. Ce contenu est fourni a titre educatif et ne constitue pas un avis medical. Consultez un professionnel de la sante pour toute question medicale.

### Types de contenu recommandes

| Type | Objectif SEO | Frequence | Exemple |
|------|-------------|-----------|---------|
| **Guide produit** | Mots-cles transactionnels | 2/mois | "Guide du BPC-157 pour la recherche : proprietes, reconstitution, stockage" |
| **Tutoriel pratique** | Mots-cles informationnels | 2/mois | "Comment reconstituer un peptide lyophilise : guide etape par etape" |
| **Revue scientifique** | Autorite et credibilite | 1/mois | "Etudes recentes sur le GHK-Cu : revue de la litterature 2025-2026" |
| **Comparatif** | Mots-cles de decision | 1/mois | "BPC-157 vs TB-500 : differences, usages en recherche, combinaison" |
| **FAQ approfondie** | Featured snippets Google | 1/mois | "Questions frequentes sur l'eau bacteriostatique" |
| **Actualite** | Trafic de tendance | Au besoin | "Nouvelle reglementation Sante Canada 2026 : ce que les chercheurs doivent savoir" |

### Calendrier editorial mensuel type

| Semaine | Type | Sujet | Mots-cles cibles |
|---------|------|-------|-------------------|
| Semaine 1 | Guide produit | Focus sur un peptide phare | "acheter [peptide] Canada", "[peptide] recherche" |
| Semaine 2 | Tutoriel pratique | Manipulation, stockage, reconstitution | "comment reconstituer peptide", "stockage peptide" |
| Semaine 3 | Revue scientifique ou comparatif | Synthese d'etudes recentes | "[peptide] etudes", "[peptide A] vs [peptide B]" |
| Semaine 4 | FAQ ou actualite | Reponses aux questions courantes | "peptides Canada legal", "eau bacteriostatique utilisation" |

### Strategie SEO longue traine

Les mots-cles de longue traine (3 a 6 mots) ont moins de volume mais un taux de conversion beaucoup plus eleve pour un e-commerce de niche :

| Mot-cle longue traine | Volume estime | Intention | Article cible |
|----------------------|--------------|-----------|---------------|
| "buy bpc-157 Canada" | 500-1000/mois | Transactionnelle | Page produit + guide BPC-157 |
| "how to reconstitute peptides" | 2000-5000/mois | Informationnelle | Tutoriel reconstitution |
| "bpc-157 vs tb-500 research" | 300-800/mois | Comparaison | Article comparatif |
| "bacteriostatic water for peptides" | 1000-3000/mois | Informationnelle | Guide eau bacteriostatique |
| "peptide storage temperature" | 500-1500/mois | Informationnelle | Guide stockage |
| "peptides for research Canada legal" | 200-500/mois | Informationnelle | Article legalite |

**Objectif** : Chaque article cible 1 mot-cle principal et 3 a 5 mots-cles secondaires. Incluez le mot-cle principal dans le titre, l'extrait, le premier paragraphe et au moins 2 sous-titres.

### Metriques de performance du blog

| Metrique | Cible mensuelle | Mesure dans |
|----------|----------------|-------------|
| Trafic organique blog | +10% mois/mois | Blog Analytics |
| Temps moyen sur page | > 3 minutes | Blog Analytics |
| Taux de rebond articles | < 60% | Blog Analytics |
| Clics vers pages produit depuis articles | > 5% des lecteurs | Blog Analytics |
| Inscriptions newsletter depuis blog | > 2% des lecteurs | Newsletter |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Blog** | Section du site dediee aux articles informatifs et marketing |
| **Article** | Un contenu textuel publie sur le blog |
| **Brouillon** | Un article en cours de redaction, non visible sur le site public |
| **Slug** | L'identifiant textuel utilise dans l'URL de l'article |
| **Extrait** | Un court resume de l'article affiche dans les listes |
| **SEO** | Search Engine Optimization -- techniques pour ameliorer le classement dans les moteurs de recherche |
| **Editeur riche** | Interface de redaction qui permet de formater le texte (gras, italique, titres, images, liens) |

---

## Pages liees

- [Blog Analytics](/admin/blog/analytics) -- Statistiques detaillees du blog
- [Newsletter](/admin/newsletter) -- Relayer les articles par email
- [Bannieres](/admin/bannieres) -- Mettre en avant un article dans le carrousel hero
- [Rapports marketing](/admin/rapports) -- Analyser le trafic genere par le blog
