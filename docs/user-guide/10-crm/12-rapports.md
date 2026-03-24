# Rapports et Analytique CRM

> **Section**: CRM > Rapports
> **URL**: `/admin/crm/analytics`, `/admin/crm/reports/builder`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~25 minutes

---

## A quoi sert cette page ?

La section **Rapports CRM** fournit des analyses detaillees de votre activite commerciale. Elle regroupe plusieurs outils d'analyse pour comprendre vos performances, identifier les tendances et prendre des decisions eclairees.

**En tant que gestionnaire, vous pouvez :**
- Consulter des tableaux de bord analytiques preconfigures
- Creer des rapports personnalises avec le Report Builder
- Analyser l'entonnoir de conversion (funnel analysis)
- Suivre les rapports d'activite de l'equipe
- Mesurer le revenu recurrent (MRR/ARR)
- Identifier les sources d'acquisition les plus performantes (attribution)
- Analyser le taux de churn (attrition)
- Calculer la valeur a vie des clients (CLV)
- Effectuer des analyses de cohortes
- Visualiser les patterns d'activite avec des heatmaps
- Suivre le parcours complet d'un deal (deal journey)
- Prendre des snapshots pour comparer dans le temps
- Construire des tableaux de bord personnalises

---

## Concepts de base pour les debutants

### Pourquoi analyser ses ventes ?

Sans analyse, vous naviguez a l'aveugle. Les rapports CRM repondent a des questions cruciales :
- **Combien** avons-nous vendu ce mois-ci vs le mois dernier ?
- **D'ou** viennent nos meilleurs clients ?
- **Pourquoi** certains deals sont perdus ?
- **Qui** performe le mieux dans l'equipe ?
- **Combien** vaut un client sur sa duree de vie ?
- **Ou** perdons-nous des clients dans le pipeline ?

### Les types de rapports

| Type | Question | Page |
|------|----------|------|
| **Analytique generale** | Vue d'ensemble des performances | `/admin/crm/analytics` |
| **Report Builder** | Rapports personnalises | `/admin/crm/reports/builder` |
| **Funnel Analysis** | Ou les prospects quittent le pipeline ? | `/admin/crm/funnel-analysis` |
| **Activity Reports** | Qui fait quoi dans l'equipe ? | `/admin/crm/activity-reports` |
| **Recurring Revenue** | Quel est notre revenu recurrent ? | `/admin/crm/recurring-revenue` |
| **Attribution** | Quel canal genere le plus de ventes ? | `/admin/crm/attribution` |
| **Churn** | Combien de clients perdons-nous ? | `/admin/crm/churn` |
| **CLV** | Combien vaut un client a vie ? | `/admin/crm/clv` |
| **Cohort Analysis** | Comment se comportent des groupes similaires ? | `/admin/crm/cohort-analysis` |
| **Heatmaps** | Quand sont nos pics d'activite ? | `/admin/crm/heatmaps` |
| **Deal Journey** | Quel est le parcours d'un deal type ? | `/admin/crm/deal-journey` |
| **Snapshots** | Comment etait le pipeline il y a X jours ? | `/admin/crm/snapshots` |
| **Dashboard Builder** | Tableaux de bord sur mesure | `/admin/crm/dashboard-builder` |

---

## Comment y acceder

Les rapports sont dans le groupe **Rapports** du panneau CRM, ou directement via les URLs listees ci-dessus.

---

## Fonctionnalites detaillees

### 1. Analytique generale (`/admin/crm/analytics`)

Vue d'ensemble avec les KPIs principaux :

| KPI | Description |
|-----|-------------|
| **Revenu total** | Somme des deals gagnes sur la periode |
| **Deals gagnes vs perdus** | Ratio de succes |
| **Pipeline value** | Valeur des deals ouverts |
| **Cycle moyen** | Duree moyenne d'un deal de la creation a la conclusion |
| **Win rate** | Taux de deals gagnes / (gagnes + perdus) |
| **Taille moyenne deal** | Montant moyen d'un deal gagne |

Graphiques disponibles :
- Evolution du revenu (ligne)
- Repartition par etape (barres empilees)
- Top sources (camembert)
- Top representants (barres horizontales)

### 2. Report Builder (`/admin/crm/reports/builder`)

**Objectif** : Creer des rapports 100% personnalises.

**Etapes** :
1. Cliquez sur **Nouveau rapport**
2. Choisissez le **type de donnees** : contacts, deals, activites, commandes
3. Selectionnez les **colonnes** a afficher (glisser-deposer)
4. Ajoutez des **filtres** (periode, representant, source, etc.)
5. Choisissez le **type de visualisation** : tableau, barres, lignes, camembert, jauge
6. Nommez et sauvegardez le rapport
7. Optionnel : planifiez un envoi automatique par email (quotidien, hebdomadaire)

### 3. Analyse d'entonnoir (`/admin/crm/funnel-analysis`)

**Objectif** : Comprendre ou les prospects "tombent" du pipeline.

L'entonnoir montre :
```
Prospection :     100 deals (100%)
  ↓ -30%
Qualification :    70 deals (70%)
  ↓ -28%
Proposition :      42 deals (42%)
  ↓ -24%
Negociation :      18 deals (18%)
  ↓ -10%
Gagne :             8 deals (8%)
```

**Lecture** : Sur 100 deals entres en prospection, 30 sont perdus avant la qualification. C'est la ou il faut agir en priorite.

**Filtres disponibles** :
- Par representant
- Par source
- Par periode
- Par montant

### 4. Revenu recurrent (`/admin/crm/recurring-revenue`)

Pour les ventes par abonnement (tres pertinent pour BioCycle Peptides) :

| Metrique | Description |
|----------|-------------|
| **MRR** | Monthly Recurring Revenue - revenu recurrent mensuel |
| **ARR** | Annual Recurring Revenue - revenu recurrent annuel |
| **New MRR** | Nouveaux abonnements ce mois |
| **Expansion MRR** | Augmentation des abonnements existants (upgrades) |
| **Churn MRR** | Perte de revenu due aux desabonnements |
| **Net MRR** | New + Expansion - Churn |

### 5. Attribution (`/admin/crm/attribution`)

**Objectif** : Savoir quel canal marketing genere le plus de revenus.

| Canal | Leads | Deals gagnes | Revenu | Cout acquisition |
|-------|-------|-------------|--------|-----------------|
| Google Ads | 120 | 8 | 28 000 $ | 45 $ |
| Email marketing | 85 | 12 | 42 000 $ | 12 $ |
| Salon professionnel | 40 | 6 | 35 000 $ | 180 $ |
| Referral | 30 | 10 | 55 000 $ | 0 $ |

**Modeles d'attribution** :
- **Premier contact** : tout le credit au premier canal
- **Dernier contact** : tout le credit au dernier canal avant la vente
- **Lineaire** : credit reparti egalement entre tous les canaux
- **Pondere** : plus de credit aux etapes proches de la conclusion

### 6. Churn et retention (`/admin/crm/churn`)

**Objectif** : Mesurer et reduire la perte de clients.

| Metrique | Description |
|----------|-------------|
| **Taux de churn mensuel** | % de clients perdus ce mois |
| **Churn revenue** | Montant de revenu perdu |
| **Raisons de churn** | Pourquoi les clients partent (prix, qualite, concurrent) |
| **Cohorte de retention** | % de clients encore actifs X mois apres leur premier achat |

### 7. CLV - Customer Lifetime Value (`/admin/crm/clv`)

**Objectif** : Calculer la valeur totale qu'un client genere pendant sa relation avec BioCycle.

**Formule simplifiee** :
```
CLV = (Panier moyen x Frequence d'achat annuelle) x Duree de vie moyenne
Exemple : (150 $ x 6 achats/an) x 3 ans = 2 700 $ CLV
```

**Utilite** : Si un client vaut 2 700 $ sur sa vie, vous savez combien investir pour l'acquerir (cout d'acquisition acceptable).

### 8. Analyse de cohortes (`/admin/crm/cohort-analysis`)

**Objectif** : Comparer le comportement de groupes de clients acquis a la meme periode.

**Exemple** :
| Cohorte | Mois 1 | Mois 3 | Mois 6 | Mois 12 |
|---------|--------|--------|--------|---------|
| Janvier 2026 | 100% | 72% | 55% | 40% |
| Fevrier 2026 | 100% | 78% | 62% | - |
| Mars 2026 | 100% | 80% | - | - |

**Lecture** : La cohorte de mars retient mieux ses clients que celle de janvier. Qu'est-ce qui a change ? (nouveau produit, meilleur onboarding, etc.)

### 9. Dashboard Builder (`/admin/crm/dashboard-builder`)

**Objectif** : Creer des tableaux de bord personnalises combinant plusieurs widgets.

**Etapes** :
1. Cliquez sur **Nouveau dashboard**
2. Nommez-le (ex: "Vue directeur commercial")
3. Ajoutez des widgets depuis le catalogue :
   - KPIs, graphiques, tableaux, jauges, listes
4. Configurez chaque widget (source, filtres, periode)
5. Disposez-les en glisser-deposer
6. Sauvegardez et partagez avec l'equipe

---

## Workflows courants

### Rapport mensuel de direction
1. Ouvrez l'analytique generale, periode "Ce mois"
2. Notez les KPIs principaux (revenu, win rate, pipeline)
3. Consultez l'attribution pour les canaux performants
4. Verifiez le churn pour les signaux d'alerte
5. Exportez le tout en PDF pour la direction

### Diagnostic d'une baisse de performance
1. Comparez les metriques avec la periode precedente
2. Analysez l'entonnoir : ou est le blocage ?
3. Verifiez les rapports d'activite : l'equipe est-elle moins active ?
4. Consultez les cohortes : est-ce un probleme d'acquisition ou de retention ?
5. Identifiez les actions correctives

---

## Questions frequentes (FAQ)

**Q : Les rapports sont-ils en temps reel ?**
R : Les KPIs principaux sont en temps reel. Les rapports complexes (cohortes, CLV) sont recalcules toutes les heures.

**Q : Puis-je exporter les rapports ?**
R : Oui, tous les rapports sont exportables en CSV, Excel ou PDF.

**Q : Puis-je planifier l'envoi automatique d'un rapport ?**
R : Oui, dans le Report Builder, activez l'option "Envoi planifie" pour recevoir le rapport par email chaque semaine ou chaque mois.

**Q : Qui peut voir les rapports ?**
R : Les administrateurs et managers voient tous les rapports. Les representants voient leurs propres metriques mais pas celles des collegues (sauf le leaderboard si active).

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Win rate** | Taux de deals gagnes vs (gagnes + perdus) |
| **MRR** | Monthly Recurring Revenue, revenu recurrent mensuel |
| **CLV** | Customer Lifetime Value, valeur a vie du client |
| **Churn** | Taux d'attrition, perte de clients |
| **Attribution** | Identification du canal ayant genere une vente |
| **Cohorte** | Groupe de clients acquis dans la meme periode |
| **Funnel** | Entonnoir de conversion, visualisation du pipeline |
| **Heatmap** | Carte de chaleur montrant les concentrations d'activite |
| **Snapshot** | Photo instantanee de l'etat du pipeline a un moment donne |

---

## Pages reliees

- [Tableau de bord CRM](/admin/crm) : Vue synthetique
- [Pipeline](/admin/crm/pipeline) : Donnees source des rapports
- [Leaderboard](/admin/crm/leaderboard) : Performance de l'equipe
- [Previsions](/admin/crm/forecast) : Projections de revenus
- [Rapports d'activite](/admin/crm/activity-reports) : Detail des actions
