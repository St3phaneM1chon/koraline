# Analytics des agents

> **Section**: Telephonie > Analytics > Agents

---

## Concepts pour debutants

La page **Analytics des agents** mesure la performance individuelle de chaque agent du
centre d'appels. Elle permet aux superviseurs d'identifier les meilleurs performeurs,
les agents necessitant du coaching, et de repartir la charge de travail equitablement.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Avance**, cliquez sur **Analytics** > **Agents**.
3. L'URL directe est : `/admin/telephonie/analytics/agents`

---

## Apercu de l'interface

### Tableau de performance par agent
Chaque agent affiche :
- Nom et extension
- Nombre total d'appels traites
- Duree moyenne des appels
- Taux de reponse (appels decroches / appels recus)
- Score de satisfaction moyen (sondages post-appel)
- Temps de connexion total
- Nombre d'appels manques
- Temps moyen de wrap-up

### Classement
Les agents sont classes par performance globale avec un code couleur :
- Vert : Performance au-dessus de la moyenne
- Jaune : Performance dans la moyenne
- Rouge : Performance en dessous de la moyenne

### Filtres
- Periode (jour, semaine, mois, trimestre)
- Groupe/file d'attente
- Direction des appels (entrants/sortants)

---

## Workflows courants

### Workflow 1 : Revue de performance hebdomadaire
1. Selectionnez la periode de la semaine.
2. Consultez le classement des agents.
3. Identifiez les agents avec un faible taux de reponse.
4. Planifiez des sessions de coaching pour les agents en difficulte.

### Workflow 2 : Equilibrer la charge de travail
1. Comparez le nombre d'appels traites par agent.
2. Si un desequilibre est constate, ajustez les groupes de sonnerie.
3. Modifiez les strategies de distribution (round robin, least recent).

---

## FAQ

**Q : Le temps de connexion inclut-il les pauses ?**
R : Non, seul le temps ou l'agent est en statut "En ligne" ou "Occupe" est comptabilise.

**Q : Comment le score de satisfaction est-il calcule ?**
R : C'est la moyenne des scores de sondage post-appel pour les appels de l'agent.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Taux de reponse** | Pourcentage d'appels repondus par l'agent |
| **Temps de wrap-up** | Duree entre la fin d'un appel et la disponibilite pour le suivant |
| **Score CSAT** | Score de satisfaction client moyen de l'agent |

---

## Pages associees

- [Coaching](./08-coaching.md) : Former les agents selon les resultats
- [Wallboard](./05-wallboard.md) : Voir les agents en temps reel
- [Analytics appels](./15-analytics-appels.md) : Metriques globales des appels
