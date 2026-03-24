# Analytics vocales (IA)

> **Section**: Telephonie > Analytics > Speech

---

## Concepts pour debutants

Les **analytics vocales** utilisent l'intelligence artificielle pour analyser le contenu
des conversations telephoniques. A partir des transcriptions generees par Whisper, le
systeme extrait des informations precieuses : sentiment dominant, mots-cles recurrents,
sujets de preoccupation des clients, et qualite de la communication.

Cette analyse va au-dela des metriques quantitatives (duree, volume) pour mesurer la
**qualite** des interactions. Par exemple, un agent peut avoir un excellent taux de
reponse mais des conversations a sentiment negatif recurrent.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Avance**, cliquez sur **Analytics** > **Speech**.
3. L'URL directe est : `/admin/telephonie/analytics/speech`

---

## Apercu de l'interface

### Metriques IA
- Nombre total de transcriptions analysees
- Repartition des sentiments (positif, neutre, negatif)
- Mots-cles les plus frequents (nuage de mots)
- Sujets principaux identifies
- Evolution du sentiment dans le temps

### Filtres
- Periode d'analyse
- Agent specifique
- Type de sentiment
- Mot-cle ou sujet

---

## Fonctions detaillees

### Analyse de sentiment
Chaque transcription est classee :
- **Positif** : Client satisfait, remerciements, compliments
- **Neutre** : Conversation factuelle, questions d'information
- **Negatif** : Plainte, frustration, mecontentement

### Extraction de mots-cles
Les termes les plus frequents sont extraits automatiquement, excluant les mots
courants. Cela permet d'identifier les sujets de preoccupation recurrents.

### Alertes de qualite
Le systeme peut signaler automatiquement les conversations a sentiment fortement
negatif pour une revue par le superviseur.

---

## Workflows courants

### Workflow 1 : Detecter les sujets de mecontentement
1. Filtrez par sentiment **Negatif** sur les 30 derniers jours.
2. Consultez les mots-cles les plus frequents.
3. Identifiez les problemes recurrents (ex: "remboursement", "retard", "qualite").
4. Transmettez les constats aux equipes concernees.

### Workflow 2 : Evaluer l'evolution du sentiment client
1. Selectionnez une periode de 90 jours.
2. Consultez le graphique d'evolution du sentiment.
3. Identifiez les periodes de degradation et correllez avec les evenements.

---

## FAQ

**Q : Toutes les conversations sont-elles analysees ?**
R : Seules les conversations ayant un enregistrement transcrit sont analysees.

**Q : L'analyse est-elle disponible en francais ?**
R : Oui, Whisper supporte le francais et l'analyse de sentiment fonctionne dans les
deux langues (francais et anglais).

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Analyse de sentiment** | Classification automatique de l'emotion dominante d'une conversation |
| **Whisper** | Modele d'IA d'OpenAI pour la transcription et l'analyse vocale |
| **NLP** | Natural Language Processing, traitement automatique du langage |
| **Nuage de mots** | Visualisation des termes les plus frequents par taille de police |

---

## Pages associees

- [Enregistrements](./03-enregistrements.md) : Ecouter les enregistrements source
- [Journal d'appels](./02-journal.md) : Voir les transcriptions par appel
- [Analytics agents](./16-analytics-agents.md) : Correler sentiment et performance agent
