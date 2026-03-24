# Publicites YouTube

> **Section**: Media > Publicites > YouTube Ads
> **URL**: `/admin/media/ads-youtube`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~12 minutes

---

## A quoi sert cette page ?

La page **YouTube Ads** affiche le tableau de bord de vos campagnes publicitaires YouTube. Elle centralise les metriques de performance et vous permet de suivre vos investissements publicitaires video.

**En tant que gestionnaire, vous pouvez :**
- Voir les metriques globales : impressions, clics, depenses, conversions, CTR et CPA
- Suivre l'evolution quotidienne des performances sur 7, 30, 90 ou 365 jours
- Consulter la liste de vos campagnes actives avec leurs statistiques individuelles
- Synchroniser manuellement les donnees depuis YouTube Ads
- Acceder directement au portail Google Ads pour gerer vos campagnes

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Impressions** | Nombre de fois que votre annonce video a ete affichee |
| **CTR** | Click-Through Rate, pourcentage de clics par rapport aux impressions |
| **CPA** | Cost Per Acquisition, cout moyen pour obtenir une conversion |
| **Conversion** | Action souhaitee effectuee par l'utilisateur (achat, inscription) |
| **Depenses (Spend)** | Montant total depense sur la periode selectionnee |

---

## Comment y acceder

1. Allez dans **Media > Tableau de Bord**
2. Cliquez sur la carte **YouTube** dans la section "APIs & Publicites"
3. Ou naviguez vers `/admin/media/ads-youtube`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Le nom de la plateforme et son icone
- La date de la derniere synchronisation
- Un bouton **Synchroniser** pour forcer la mise a jour des donnees
- Un selecteur de periode (7, 30, 90, 365 jours)
- Un lien vers la documentation/portail externe de la plateforme

### 2. Cartes KPI (6 indicateurs)

| KPI | Description |
|-----|-------------|
| **Impressions** | Nombre d'affichages total |
| **Clics** | Nombre de clics sur vos annonces |
| **Depenses** | Budget consomme en dollars canadiens |
| **Conversions** | Actions completees par les utilisateurs |
| **CTR** | Taux de clics (clics / impressions * 100) |
| **CPA** | Cout par acquisition (depenses / conversions) |

### 3. Graphique de tendance quotidienne
Un graphique en barres montrant l'evolution jour par jour des impressions, clics, depenses et conversions.

### 4. Liste des campagnes
Un tableau listant chaque campagne avec :
- Nom de la campagne
- Impressions, clics, depenses, conversions
- CTR individuel

---

## Fonctionnalites detaillees

### Synchroniser les donnees
1. Cliquez sur le bouton **Synchroniser** en haut a droite
2. Les donnees sont recuperees depuis l'API YouTube/Google Ads
3. Un message de confirmation s'affiche une fois la synchronisation terminee
4. La date de derniere synchronisation se met a jour

### Changer la periode
1. Utilisez le selecteur de periode (7, 30, 90, 365 jours)
2. Les KPI et le graphique se rechargent automatiquement

### Voir les details d'une campagne
- Chaque ligne du tableau des campagnes montre les metriques detaillees
- Le nom de la campagne correspond a celui defini dans Google Ads

---

## Flux de travail recommandes

### Suivi quotidien
1. Ouvrez la page YouTube Ads
2. Verifiez le CTR (un bon CTR pour YouTube est entre 0.5% et 2%)
3. Verifiez le CPA (comparez avec votre marge par vente)
4. Si le CPA depasse votre seuil, envisagez de mettre en pause les campagnes peu performantes dans Google Ads

### Rapport mensuel
1. Selectionnez la periode **30 jours**
2. Notez les depenses totales et le nombre de conversions
3. Calculez le ROI : (revenus generes - depenses) / depenses * 100

---

## Questions frequentes

**Q : Les donnees ne se mettent pas a jour automatiquement ?**
R : La synchronisation se fait a intervalle regulier. Pour forcer une mise a jour, cliquez sur **Synchroniser**.

**Q : Comment creer une nouvelle campagne YouTube Ads ?**
R : Les campagnes se creent directement dans le portail Google Ads (ads.google.com). Koraline affiche les resultats mais ne gere pas la creation de campagnes.

**Q : Le CPA est tres eleve, que faire ?**
R : Un CPA eleve peut indiquer un ciblage trop large, des annonces peu pertinentes ou une page de destination mal optimisee. Revoyez votre ciblage dans Google Ads.

---

## Strategie expert : Budget et conformite YouTube Ads pour un e-commerce de peptides

### Budget recommande et allocation pour une PME de peptides

YouTube Ads est un canal premium qui necessite un budget minimal pour produire des resultats mesurables. Pour BioCycle Peptides, voici les recommandations par phase de maturite :

**Budget par phase :**

| Phase | Budget mensuel | Duree | Objectif |
|-------|---------------|-------|----------|
| **Phase 1 : Test** | 500 - 1 000$ CAD | 2-3 mois | Identifier les audiences qui convertissent, tester les formats |
| **Phase 2 : Optimisation** | 1 000 - 1 500$ CAD | 3-6 mois | Affiner le ciblage, optimiser le CPA, scaler les campagnes gagnantes |
| **Phase 3 : Croissance** | 1 500 - 2 000$ CAD | 6+ mois | Augmenter le volume tout en maintenant le ROAS cible |

**Allocation recommandee du budget :**

| Type de campagne | % du budget | Format | Objectif |
|-----------------|-------------|--------|----------|
| **Video educative** (in-stream skippable) | 40% | Videos 2-5 min : "Comprendre les peptides de recherche", "Comment lire un CoA" | Notoriete + confiance |
| **Retargeting video** (bumper 6s + in-stream) | 30% | Videos courtes ciblant les visiteurs du site | Conversion |
| **Discovery Ads** | 20% | Miniatures cliquables dans les resultats de recherche YouTube | Trafic qualifie |
| **Performance Max** | 10% | Campagnes automatisees Google | Test et complement |

### Ciblage des audiences pertinentes

Le ciblage est la cle du succes pour un produit de niche comme les peptides. Voici les segments d'audience recommandes :

**Audiences d'interet (Google Ads) :**

| Audience | Taille estimee (Canada) | Pertinence |
|----------|------------------------|------------|
| Sante et fitness | Large | Moyenne (trop large seul, combiner avec d'autres signaux) |
| Biohacking et optimisation de performance | Moyenne | Haute |
| Supplements et nutrition sportive | Large | Haute |
| Sciences et recherche biomedicale | Restreinte | Tres haute |
| Anti-aging et longevite | Moyenne | Haute |

**Audiences personnalisees (les plus efficaces) :**
- Visiteurs du site biocyclepeptides.com (retargeting)
- Chercheurs de termes cles : "peptides research", "BPC-157", "TB-500", "peptide synthesis", "buy peptides Canada"
- Spectateurs de chaines YouTube sur les peptides, la biologie moleculaire, le biohacking
- Audiences similaires (Lookalike) basees sur les clients existants

**Audiences a exclure :**
- Mineurs (< 18 ans)
- Audiences medicales sensibles (si Google le permet dans la categorie)

### Conformite publicitaire Google/YouTube pour les peptides

**C'est le point le plus critique de cette section.** Google a des politiques strictes sur les publicites liees a la sante, aux supplements et aux substances chimiques. Ne pas les respecter entraine le rejet immediat des annonces et potentiellement la suspension du compte publicitaire.

**Restrictions Google Ads applicables aux peptides :**

| Regle Google | Impact pour BioCycle | Action |
|--------------|---------------------|--------|
| **Pas de claims medicaux** | Ne JAMAIS dire "guerit", "traite", "soigne" dans les annonces video | Utiliser "pour usage de recherche uniquement" |
| **Pas de vente de substances a usage humain** | Ne pas presenter les peptides comme des supplements a consommer | Positionner clairement comme produits de recherche |
| **Politique Healthcare and medicines** | Les annonces pour substances pharmaceutiques sont restreintes | Eviter les termes "pharmaceutique", "medicament", "traitement" |
| **Politique Dangerous products** | Certains peptides peuvent etre classes comme dangereux | Verifier chaque produit annonce contre la liste Google |
| **Certification necessaire** | Google peut exiger une certification pour les annonces sante | Soumettre la certification pharma/recherche si demandee |

**Termes autorises dans les annonces :**
- "Peptides de recherche de haute purete"
- "Certifie par analyse independante (CoA)"
- "Pour usage de recherche en laboratoire"
- "Qualite GMP, purete >98%"
- "Fourniture de laboratoire pour la recherche"

**Termes interdits dans les annonces :**
- "Guerit", "traite", "soigne", "previent" (tout claim therapeutique)
- "Injection", "dosage humain", "posologie"
- "Resultats garantis", "cliniquement prouve" (sauf si etude publiee et citee)
- "Acheter des steroides", "hormone de croissance" (association negative)

### Formats video recommandes pour BioCycle Peptides

| Format | Duree | Contenu | Budget min/mois |
|--------|-------|---------|-----------------|
| **In-stream skippable** | 30s - 3 min | Presentation BioCycle, processus qualite, labo, CoA | 300$ |
| **Bumper ads** | 6 secondes | Message cle unique : "Peptides de recherche - Purete >98% - biocyclepeptides.com" | 200$ |
| **Discovery** | Miniature + titre | "5 choses a verifier avant d'acheter des peptides de recherche" | 200$ |
| **Shorts Ads** | 15-60 secondes | Behind-the-scenes du labo, unboxing commande, explication rapide | 150$ |

### KPI et ROAS cible

| Metrique | Cible BioCycle | Seuil de rentabilite |
|----------|---------------|---------------------|
| **CPC (Cout par clic)** | 0.50 - 1.50$ CAD | < 2.00$ |
| **CPV (Cout par vue)** | 0.02 - 0.10$ CAD | < 0.15$ |
| **CTR** | 0.5 - 2.0% | > 0.3% |
| **CPA (Cout par acquisition)** | 25 - 60$ CAD | < marge brute moyenne par commande |
| **ROAS (Return on Ad Spend)** | 3x - 5x | > 2x pour etre rentable |
| **Taux de visionnage** | > 25% pour in-stream | < 15% = creative a revoir |

**Calcul du ROAS seuil :** Si la marge brute moyenne est de 40% et le panier moyen est de 250$, la marge brute par commande est de 100$. Pour un ROAS de 3x, chaque dollar depense en publicite genere 3$ de ventes, soit 1.20$ de marge brute nette des couts publicitaires. C'est rentable.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **ROI** | Return On Investment, retour sur investissement |
| **Google Ads** | Plateforme publicitaire de Google, incluant YouTube Ads |
| **Ciblage** | Criteres definissant a qui vos annonces sont montrees |

---

## Pages associees

| Page | Description |
|------|-------------|
| [API YouTube](./19-api-youtube.md) | Configuration de la connexion YouTube |
| [API Google Ads](./23-api-google-ads.md) | Configuration de la connexion Google Ads |
| [Publicites Google](./11-ads-google.md) | Campagnes Google Search/Display |
| [Analytique Media](./02-analytics.md) | Vue globale des performances |
