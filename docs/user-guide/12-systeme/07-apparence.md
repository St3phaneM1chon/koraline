# Apparence et Contenu

> **Section**: Systeme > Configuration > Contenu / SEO / Navigateur
> **URL**: `/admin/contenu`, `/admin/seo`, `/admin/navigateur`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Les pages de gestion de l'**Apparence** et du **Contenu** permettent de personnaliser le site web public de BioCycle Peptides : pages d'information, meta-donnees SEO, et navigation.

**En tant qu'administrateur, vous pouvez :**
- Creer et modifier des pages de contenu (A propos, FAQ, Politique de confidentialite)
- Configurer les meta-donnees SEO (titres, descriptions, mots-cles)
- Gerer la structure de navigation du site
- Configurer les redirections d'URL
- Optimiser le referencement naturel

---

## Les 3 pages principales

### 1. Pages de contenu (`/admin/contenu`)

Gerez les pages statiques du site :

| Page | Description | Obligatoire |
|------|-------------|-------------|
| **A propos** | Presentation de BioCycle Peptides | Recommande |
| **FAQ** | Questions frequemment posees | Recommande |
| **Politique de confidentialite** | Conformite Loi 25 | Obligatoire |
| **Conditions d'utilisation** | Terms of service | Obligatoire |
| **Politique de retour** | Conditions de retour et remboursement | Recommande |
| **Livraison** | Informations sur les delais et frais | Recommande |
| **Contact** | Formulaire de contact | Recommande |

**Fonctionnalites** :
- Editeur visuel riche (gras, italique, titres, listes, images, liens)
- Support multilingue (chaque page peut etre traduite)
- Publication et depublication
- URL personnalisable (slug)

### 2. SEO (`/admin/seo`)

Optimisez le referencement naturel de chaque page :

| Parametre | Description | Exemple |
|-----------|-------------|---------|
| **Meta title** | Titre dans les resultats Google | "BioCycle Peptides - Peptides de qualite au Canada" |
| **Meta description** | Description sous le titre dans Google | "Achetez des peptides de recherche de haute qualite..." |
| **Keywords** | Mots-cles principaux | peptides, BPC-157, TB-500, Canada |
| **Canonical URL** | URL de reference pour eviter le contenu duplique | https://biocyclepeptides.com/ |
| **Open Graph** | Apercu pour les reseaux sociaux (titre, image) | Image et titre pour partage Facebook/LinkedIn |
| **Sitemap** | Plan du site pour Google | Genere automatiquement |
| **Robots.txt** | Instructions pour les moteurs de recherche | Pages a indexer ou exclure |

### 3. Navigateur web (`/admin/navigateur`)

Navigateur integre pour visualiser et tester le site public directement depuis l'interface d'administration.

---

## Fonctionnalites detaillees

### 1. Creer une page de contenu

**Etapes** :
1. Allez sur `/admin/contenu`
2. Cliquez sur **Nouvelle page**
3. Remplissez :
   - **Titre** : le titre de la page
   - **URL** (slug) : l'adresse (ex: `/a-propos`)
   - **Contenu** : utilisez l'editeur visuel
   - **Meta SEO** : titre et description pour Google
4. Cliquez sur **Publier**

### 2. Optimiser le SEO d'un produit

**Etapes** :
1. Allez sur `/admin/seo`
2. Selectionnez la page ou le produit
3. Remplissez les meta-donnees :
   - Titre optimise (60 caracteres max)
   - Description accrocheuse (155 caracteres max)
   - Mots-cles pertinents
4. Verifiez l'apercu Google (genere automatiquement)
5. Sauvegardez

### 3. Gerer les redirections

Si vous changez l'URL d'une page, configurez une redirection 301 pour ne pas perdre le referencement :
1. Ancienne URL → Nouvelle URL
2. Le systeme redirige automatiquement les visiteurs et les moteurs de recherche

---

## Questions frequentes (FAQ)

**Q : Le SEO est-il important pour un site de peptides ?**
R : Absolument. Une bonne optimisation SEO permet d'attirer des clients organiquement (sans payer de publicite). Les recherches comme "acheter peptides Canada" ou "BPC-157 Quebec" peuvent generer beaucoup de trafic qualifie.

**Q : Les pages de contenu sont-elles traduisibles ?**
R : Oui. Chaque page peut avoir une version dans chacune des 22 langues supportees.

**Q : Comment savoir si mon SEO fonctionne ?**
R : Consultez les analytics (`/admin/analytics`) pour voir le trafic organique (visiteurs venant de Google). Le SEO prend generalement 3-6 mois pour montrer des resultats.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **SEO** | Search Engine Optimization, optimisation pour les moteurs de recherche |
| **Meta title** | Titre de la page dans les resultats de recherche |
| **Meta description** | Description sous le titre dans les resultats Google |
| **Slug** | Partie de l'URL apres le nom de domaine (/a-propos) |
| **Redirection 301** | Redirection permanente d'une ancienne URL vers une nouvelle |
| **Sitemap** | Fichier XML listant toutes les pages pour les moteurs de recherche |

---

## Pages reliees

- [Traductions](/admin/traductions) : Textes multilingues
- [Parametres](/admin/parametres) : Configuration generale
- [Analytics](/admin/analytics) : Suivi du trafic et du SEO
- [Blog](/admin/blog) : Articles (si module active)
