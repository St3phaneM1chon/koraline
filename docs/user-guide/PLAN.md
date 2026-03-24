# PLAN — Guide Utilisateur Complet Suite Kor@line

## Objectif
Documentation exhaustive permettant a un utilisateur NEOPHYTE d'utiliser et comprendre l'ENSEMBLE des fonctionnalites de l'application admin BioCycle Peptides / Suite Kor@line.

## Methode pour CHAQUE page
1. **Navigation Playwright**: cliquer sur CHAQUE bouton, lien, formulaire
2. **Documentation**: expliquer le concept, le pourquoi, le comment etape par etape
3. **Screenshots annotes**: capture de chaque etape importante
4. **Workflows complets**: de A a Z, scenarios concrets
5. **Glossaire**: termes techniques expliques pour neophytes
6. **Erreurs courantes**: ce qui peut mal tourner et comment corriger

## Volume estime
- ~1500-2500 pages de documentation
- ~500+ screenshots annotes
- ~100+ workflows documentes

## Planning (3-5 jours, 24h/24)

### JOUR 1 — Commerce + Catalogue + Dashboard
| Section | Pages admin | Pages doc estimees | Heures |
|---------|-------------|-------------------|--------|
| Introduction + Navigation | - | 30 | 2h |
| Dashboard | 1 | 20 | 1h |
| Commerce (Commandes) | 1 | 80 | 4h |
| Commerce (Clients) | 2 | 60 | 3h |
| Commerce (Abonnements) | 1 | 40 | 2h |
| Commerce (Inventaire) | 1 | 40 | 2h |
| Commerce (Fournisseurs) | 1 | 30 | 2h |
| Commerce (Paiements) | 1 | 40 | 2h |
| Catalogue (Produits) | 1 | 60 | 3h |
| Catalogue (Categories) | 1 | 30 | 2h |
| Catalogue (Bundles) | 1 | 30 | 1h |
| **Sous-total J1** | **11** | **~460** | **~24h** |

### JOUR 2 — Marketing + Communaute + Fidelite + Emails
| Section | Pages admin | Pages doc estimees | Heures |
|---------|-------------|-------------------|--------|
| Marketing (Codes promo) | 1 | 50 | 3h |
| Marketing (Promotions) | 1 | 50 | 3h |
| Marketing (Newsletter) | 1 | 60 | 3h |
| Marketing (Bannieres) | 1 | 30 | 2h |
| Marketing (Upsell) | 1 | 40 | 2h |
| Marketing (Blog) | 2 | 50 | 3h |
| Marketing (Rapports) | 1 | 30 | 2h |
| Communaute (4 pages) | 4 | 80 | 4h |
| Fidelite (2 pages) | 2 | 60 | 2h |
| **Sous-total J2** | **14** | **~450** | **~24h** |

### JOUR 3 — CRM (54 pages, la plus grosse section)
| Section | Pages admin | Pages doc estimees | Heures |
|---------|-------------|-------------------|--------|
| CRM Dashboard + Pipeline | 3 | 80 | 4h |
| CRM Leads + Lists + Deals | 4 | 100 | 5h |
| CRM Sales (7 pages) | 7 | 80 | 4h |
| CRM Communications (7 pages) | 7 | 80 | 4h |
| CRM Call Center (8 pages) | 8 | 60 | 3h |
| CRM Automation (8 pages) | 8 | 60 | 2h |
| CRM Reports (13 pages) | 13 | 60 | 2h |
| **Sous-total J3** | **50** | **~520** | **~24h** |

### JOUR 4 — Comptabilite (45 pages, la plus complexe pour neophytes)
| Section | Pages admin | Pages doc estimees | Heures |
|---------|-------------|-------------------|--------|
| Concepts comptables (intro) | - | 40 | 2h |
| Ecritures + Saisie | 7 | 100 | 5h |
| Comptes + Grand livre | 8 | 80 | 4h |
| Banques + Rapprochement | 5 | 60 | 3h |
| Rapports financiers | 6 | 60 | 3h |
| Compliance + Cloture | 5 | 40 | 2h |
| Fiscal + RS&DE | 5 | 60 | 3h |
| Avance (Paie, Multi-entite...) | 10 | 60 | 2h |
| **Sous-total J4** | **46** | **~500** | **~24h** |

### JOUR 5 — Media + Telephonie + Systeme
| Section | Pages admin | Pages doc estimees | Heures |
|---------|-------------|-------------------|--------|
| Media Dashboard + Analytics | 2 | 40 | 2h |
| Media Plateformes (5 launch) | 5 | 50 | 3h |
| Media Publicite (6 ads) | 6 | 60 | 3h |
| Media APIs (12 pages) | 12 | 80 | 4h |
| Media Gestion (12 pages) | 12 | 80 | 4h |
| Telephonie (22 pages) | 22 | 120 | 5h |
| Systeme (24 pages) | 24 | 80 | 3h |
| **Sous-total J5** | **83** | **~510** | **~24h** |

## TOTAL: ~223 pages admin → ~2440 pages de documentation

## Format de chaque guide

### Structure type d'un guide de page
```markdown
# [Titre de la page]

## A quoi sert cette page ?
(Explication du concept pour un debutant complet)

## Comment y acceder
(Navigation exacte: menu → sous-menu → page)
(Screenshot de la navigation)

## Vue d'ensemble de l'interface
(Screenshot annote avec numeros)
1. Barre d'outils (ribbon)
2. Panneau de navigation
3. Zone principale
4. ...

## Fonctionnalites detaillees

### [Fonction 1: ex. Creer un code promo]
**Pourquoi**: Explication business
**Etapes**:
1. Cliquez sur "Nouveau code" (screenshot)
2. Remplissez le formulaire (screenshot + explication de chaque champ)
3. ...
**Resultat attendu**: (screenshot)
**Erreurs possibles**: ...

### [Fonction 2: ex. Modifier un code promo]
...

## Workflows complets
### Scenario: Lancer une promotion de fin d'annee
1. Creer le code promo → 2. Configurer les conditions → 3. Activer → 4. Verifier les stats

## FAQ
## Glossaire
## Pages liees
```

## Checkpoint systeme
Apres chaque section completee:
- Sauvegarder dans `/docs/user-guide/PROGRESS.json`
- Le fichier indique exactement ou reprendre a la session suivante
