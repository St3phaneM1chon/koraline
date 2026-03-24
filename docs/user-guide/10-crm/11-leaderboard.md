# Leaderboard et Gamification des Ventes

> **Section**: CRM > Ventes > Leaderboard
> **URL**: `/admin/crm/leaderboard`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

Le **Leaderboard** (classement des ventes) est un outil de motivation et de suivi de performance qui classe vos representants commerciaux selon leurs resultats. Il transforme la vente en une competition amicale avec des metriques claires et des objectifs mesurables.

**En tant que gestionnaire, vous pouvez :**
- Voir le classement en temps reel de votre equipe de vente
- Comparer les performances par representant
- Suivre les objectifs individuels et d'equipe (quotas)
- Identifier les meilleurs performeurs et ceux qui ont besoin de coaching
- Configurer des periodes de competition (mensuel, trimestriel)
- Afficher le leaderboard sur un ecran d'equipe (mode TV)
- Analyser les tendances de performance dans le temps
- Gerer les approbations de deals et soumissions

---

## Concepts de base pour les debutants

### Pourquoi un leaderboard ?

La gamification (transformer le travail en jeu) est une technique prouvee pour stimuler la motivation des equipes de vente. Un classement visible :
- Cree une **competition saine** entre representants
- Rend les objectifs **concrets et visibles**
- Permet de **celebrer les succes** publiquement
- Aide a **identifier les besoins** de formation

### Metriques du leaderboard

| Metrique | Description |
|----------|-------------|
| **Revenu genere** | Montant total des deals gagnes ($CA) |
| **Nombre de deals gagnes** | Nombre d'opportunites conclues |
| **Valeur pipeline** | Montant total des deals ouverts |
| **Activites** | Nombre d'appels + emails + reunions |
| **Taux de conversion** | % de leads convertis en clients |
| **Panier moyen** | Montant moyen par deal gagne |
| **Temps moyen de cycle** | Duree moyenne de la prospection a la conclusion |

---

## Comment y acceder

1. CRM > groupe **Ventes** > **Leaderboard**
2. URL directe : `/admin/crm/leaderboard`

---

## Vue d'ensemble de l'interface

### 1. Le classement principal

Un tableau montrant les representants classes du meilleur au moins bon :

| Position | Representant | Deals gagnes | Revenu | Activites | Quota (%) |
|----------|-------------|-------------|--------|-----------|-----------|
| 1 | Marie L. | 12 | 45 200 $ | 156 | 112% |
| 2 | Jean-Marc R. | 10 | 38 800 $ | 142 | 97% |
| 3 | Sophie D. | 8 | 31 500 $ | 118 | 79% |

### 2. Les filtres temporels

| Periode | Description |
|---------|-------------|
| **Cette semaine** | Performances de la semaine en cours |
| **Ce mois** | Performances du mois en cours |
| **Ce trimestre** | Performances du trimestre en cours |
| **Cette annee** | Performances de l'annee en cours |
| **Personnalise** | Plage de dates specifique |

### 3. Les graphiques

- **Graphique en barres** : revenu par representant
- **Evolution temporelle** : progression du revenu dans le temps
- **Radar** : performance multi-criteres (appels, emails, deals, revenu)
- **Comparaison vs objectif** : barre de progression vers le quota

---

## Fonctionnalites detaillees

### 1. Configurer les quotas

**URL** : `/admin/crm/quotas`

**Etapes** :
1. Allez dans CRM > Ventes > **Quotas**
2. Pour chaque representant, definissez :
   - **Quota de revenu** : montant a atteindre par mois/trimestre ($CA)
   - **Quota d'activites** : nombre minimum d'appels, emails, reunions
   - **Quota de deals** : nombre minimum de deals a conclure
3. Sauvegardez

Le leaderboard calcule automatiquement le pourcentage d'atteinte du quota.

### 2. Gerer les approbations

**URL** : `/admin/crm/approvals`

Certains deals necessitent une approbation avant d'etre conclus :
- Deals au-dessus d'un montant seuil (ex: > 10 000 $CA)
- Remises superieures a un pourcentage (ex: > 15%)
- Conditions speciales de paiement

**Etapes** :
1. Le representant soumet le deal pour approbation
2. Le manager recoit une notification
3. Il examine les details et approuve ou refuse
4. Le deal peut ensuite etre marque comme gagne

### 3. Gerer les taux de change

**URL** : `/admin/crm/exchange-rates`

Si vous avez des clients internationaux :
- Definissez les taux de change USD/CAD, EUR/CAD
- Les montants du pipeline sont automatiquement convertis en $CA
- Le leaderboard utilise toujours la devise de reference ($CA)

### 4. Mode affichage TV

**Objectif** : Afficher le leaderboard sur un ecran dans le bureau de vente.

**Etapes** :
1. Cliquez sur le bouton **Mode TV** en haut a droite
2. L'interface passe en plein ecran avec des chiffres grand format
3. Le rafraichissement est automatique (toutes les 5 minutes)
4. Les animations soulignent les changements de position

---

## Pages associees dans la section Ventes

### Soumissions (`/admin/crm/quotes`)
- Creez des devis professionnels
- Envoyez par email directement
- Suivez l'etat : brouillon, envoye, accepte, refuse

### Previsions (`/admin/crm/forecast`)
- Projection des revenus futurs
- Base sur le pipeline actuel et les probabilites par etape
- Comparaison objectifs vs prevision vs realisation

### Contrats (`/admin/crm/contracts`)
- Gestion des contrats lies aux deals
- Suivi des dates d'echeance et de renouvellement
- Modeles de contrats reutilisables

---

## Workflows courants

### Revue mensuelle de performance
1. Ouvrez le leaderboard, periode "Ce mois"
2. Identifiez les 3 meilleurs : preparez des felicitations
3. Identifiez ceux sous 70% du quota : planifiez un coaching
4. Comparez avec le mois precedent : tendance positive ou negative ?
5. Ajustez les quotas si necessaire pour le mois suivant

### Competition trimestrielle
1. Definissez un objectif d'equipe ambitieux
2. Communiquez le defi (ex: "50 000 $ de revenu nouveau ce trimestre")
3. Affichez le leaderboard en mode TV dans le bureau
4. Faites un point hebdomadaire sur la progression
5. Celebrez les resultats en fin de trimestre

---

## Questions frequentes (FAQ)

**Q : Les representants voient-ils le leaderboard ?**
R : Par defaut, oui. Chaque representant voit sa position et celles de ses collegues. Vous pouvez desactiver cette visibilite dans les parametres si prefere.

**Q : Comment sont comptes les deals d'equipe ?**
R : Un deal est attribue au representant principal. Si la vente est collaborative, vous pouvez activer le "split credit" qui repartit le revenu entre les participants.

**Q : Le leaderboard prend-il en compte les remboursements ?**
R : Oui. Si un deal gagne est ensuite rembourse, le revenu est deduit du score du representant.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Leaderboard** | Classement des representants par performance |
| **Quota** | Objectif chiffre a atteindre par periode |
| **Gamification** | Utilisation de mecaniques de jeu pour motiver |
| **Split credit** | Repartition du credit d'une vente entre plusieurs representants |
| **Forecast** | Prevision des revenus futurs |
| **Approbation** | Validation manageriale requise pour certains deals |

---

## Pages reliees

- [Pipeline](/admin/crm/pipeline) : Source des deals comptabilises
- [Quotas](/admin/crm/quotas) : Configuration des objectifs
- [Previsions](/admin/crm/forecast) : Projections de revenus
- [Soumissions](/admin/crm/quotes) : Devis associes aux deals
- [Performance agents](/admin/crm/agents/performance) : Metriques detaillees
- [Rapports CRM](/admin/crm/analytics) : Analyses approfondies
