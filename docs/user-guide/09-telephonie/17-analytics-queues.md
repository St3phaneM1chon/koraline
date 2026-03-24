# Analytics des files d'attente

> **Section**: Telephonie > Analytics > Files d'attente

---

## Concepts pour debutants

La page **Analytics des files d'attente** mesure la performance de chaque groupe de
sonnerie (queue). Elle repond aux questions : combien de temps les clients attendent-ils ?
Combien d'appels sont perdus dans chaque file ? Le SLA est-il respecte ?

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Avance**, cliquez sur **Analytics** > **Files d'attente**.
3. L'URL directe est : `/admin/telephonie/analytics/queues`

---

## Apercu de l'interface

### Tableau par file d'attente
Chaque file affiche :
- Nom de la file
- Nombre de membres (agents)
- Total des appels recus
- Appels repondus vs. abandonnes
- Temps d'attente moyen
- Temps d'attente maximum
- SLA % (appels repondus dans le delai cible)
- Taux d'abandon

### Graphiques
- Evolution du SLA dans le temps
- Distribution des temps d'attente
- Comparaison entre files

---

## Workflows courants

### Workflow 1 : Optimiser le SLA d'une file
1. Identifiez la file avec le SLA le plus bas.
2. Verifiez le nombre de membres vs. le volume d'appels.
3. Ajoutez des agents ou ajustez la strategie de distribution.
4. Suivez l'evolution du SLA sur les jours suivants.

### Workflow 2 : Reduire le taux d'abandon
1. Identifiez les files avec un taux d'abandon > 10%.
2. Verifiez le temps d'attente moyen (cible : < 60 secondes).
3. Envisagez un message d'attente ou une option de rappel.

---

## FAQ

**Q : Qu'est-ce qu'un bon SLA ?**
R : L'objectif standard est de repondre a 80% des appels en moins de 20 secondes (80/20).

**Q : Le taux d'abandon inclut-il les appels rediriges vers la messagerie ?**
R : Non, seuls les appels ou l'appelant raccroche activement sont comptes comme abandonnes.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **SLA** | Service Level Agreement, objectif de temps de reponse |
| **Taux d'abandon** | Pourcentage d'appelants qui raccrochent avant d'etre servis |
| **Temps d'attente moyen (ASA)** | Average Speed of Answer, duree moyenne avant decrochage |

---

## Pages associees

- [Groupes de sonnerie](./10-groupes.md) : Configurer les files d'attente
- [Wallboard](./05-wallboard.md) : Vue temps reel des files
- [Analytics agents](./16-analytics-agents.md) : Performance par agent dans chaque file
