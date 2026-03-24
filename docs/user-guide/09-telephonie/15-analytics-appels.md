# Analytics des appels

> **Section**: Telephonie > Analytics > Appels

---

## Concepts pour debutants

La page **Analytics des appels** fournit des statistiques detaillees sur l'ensemble des
appels telephoniques : volumes, durees, taux de reponse, heures de pointe, et tendances.
Ces donnees permettent d'optimiser les effectifs et d'identifier les periodes critiques.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Avance**, cliquez sur **Analytics** > **Appels**.
3. L'URL directe est : `/admin/telephonie/analytics/appels`

---

## Apercu de l'interface

### Filtres de periode
Selecteur de plage de dates pour definir la periode d'analyse.

### Metriques principales
- Total des appels (entrants, sortants, internes)
- Taux de reponse global
- Duree moyenne des appels
- Appels par heure (graphique)
- Repartition par statut (complete, manque, messagerie, echoue)
- Tendance sur la periode (hausse/baisse par rapport a la periode precedente)

### Graphiques
- Histogramme des appels par jour/semaine
- Heatmap des heures de pointe
- Repartition par direction (entrant vs sortant)

---

## Workflows courants

### Workflow 1 : Identifier les heures de pointe
1. Selectionnez une periode de 30 jours.
2. Consultez le heatmap des heures de pointe.
3. Ajustez les plannings des agents pour couvrir les pics.

### Workflow 2 : Rapport mensuel
1. Definissez la plage de dates du mois.
2. Exportez les metriques principales.
3. Comparez avec le mois precedent.

---

## FAQ

**Q : Les appels internes sont-ils comptes ?**
R : Oui, mais ils peuvent etre filtres pour se concentrer sur les appels clients.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Taux de reponse** | Pourcentage d'appels decroches sur le total des appels recus |
| **Heatmap** | Carte thermique montrant l'intensite d'activite par heure/jour |

---

## Pages associees

- [Analytics agents](./16-analytics-agents.md) : Performance par agent
- [Analytics files](./17-analytics-queues.md) : Performance par file d'attente
- [Journal d'appels](./02-journal.md) : Detail individuel de chaque appel
