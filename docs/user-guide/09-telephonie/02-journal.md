# Journal d'appels

> **Section**: Telephonie > Journal d'appels

---

## Concepts pour debutants

Le **journal d'appels** (Call Log) est l'historique complet de tous les appels telephoniques
passes et recus via Koraline. C'est le registre central de l'activite telephonique de BioCycle
Peptides. Chaque appel y est consigne avec ses details : direction, participants, duree, statut,
enregistrement audio, transcription IA, et donnees CRM associees.

Le journal se rafraichit automatiquement toutes les 15 secondes pour afficher les nouveaux appels
en temps reel, sans rechargement de page.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, cliquez sur **Journal d'appels**.
3. L'URL directe est : `/admin/telephonie/journal`

---

## Apercu de l'interface

### Barre de filtres
En haut de la page, une barre de filtres permet de preciser votre recherche :

| Filtre | Options |
|--------|---------|
| **Recherche** | Champ texte pour chercher par nom, numero, ou mot-cle |
| **Direction** | Tous, Entrant, Sortant, Interne |
| **Statut** | Tous, Complete, Manque, Messagerie, Echoue |
| **Date debut** | Selecteur de date |
| **Date fin** | Selecteur de date |

### Tableau des appels
Le tableau principal affiche les colonnes suivantes :
- **Direction** : Icone fleche entrante (bleu), sortante (vert) ou interne (gris)
- **Appelant** : Nom et numero, avec lien CRM si le client est identifie
- **Appele** : Numero compose
- **Agent** : Nom de l'agent et extension
- **Statut** : Badge colore (Complete, Manque, Messagerie, Echoue, En cours, Transfere)
- **Duree** : Temps de conversation au format mm:ss
- **Date** : Date et heure de l'appel
- **Satisfaction** : Score du sondage post-appel
- **Enregistrement** : Icone indiquant la disponibilite d'un enregistrement

### Pagination
Navigation par pages avec affichage du nombre total d'appels (25 par page).

### Panneau de detail (expansion)
Cliquez sur une ligne pour afficher le detail de l'appel en dessous :

- **Enregistrement audio** : Lecteur audio integre avec barre de progression
- **Transcription IA** : Resume genere par Whisper avec analyse de sentiment
- **Notes de l'agent** : Notes ajoutees manuellement par l'agent
- **Deals CRM** : Opportunites commerciales liees au client appelant
- **Commandes recentes** : Dernieres commandes du client
- **Fidelite** : Niveau et points du programme de fidelite
- **Emails recents** : Derniers emails echanges avec ce client

---

## Fonctions detaillees

### Recherche en texte libre
Le champ de recherche filtre les appels par :
- Nom de l'appelant ou de l'appele
- Numero de telephone
- Nom de l'agent

### Filtrage par date
Les selecteurs de date permettent de definir une plage precise. Utile pour les rapports
d'activite ou la recherche d'un appel specifique.

### Detail enrichi par les ponts inter-modules (Bridges)
Le panneau d'expansion tire des donnees de 4 modules differents :

| Pont | Donnees affichees |
|------|------------------|
| **CRM** | Deals associes au client (titre, etape, valeur) |
| **Commerce** | Commandes recentes (numero, statut, montant) |
| **Fidelite** | Niveau du client et solde de points |
| **Emails** | Derniers emails echanges (objet, statut) |

Ces ponts permettent a l'agent d'avoir un contexte complet sans quitter le journal d'appels.

### Lecteur audio integre
Le composant **AudioPlayer** offre :
- Lecture / Pause / Arret
- Barre de progression cliquable
- Affichage de la duree totale et du temps ecoule

### Transcription IA
Les transcriptions sont generees automatiquement par Whisper et incluent :
- **Resume** : Synthese du contenu de l'appel
- **Sentiment** : Positif (vert), Neutre (gris), ou Negatif (rouge)

---

## Workflows courants

### Workflow 1 : Retrouver un appel client specifique
1. Tapez le nom ou le numero du client dans le champ de recherche.
2. Ajustez la plage de dates si necessaire.
3. Cliquez sur l'appel pour afficher les details.
4. Ecoutez l'enregistrement ou lisez la transcription.

### Workflow 2 : Revue quotidienne des appels manques
1. Selectionnez le filtre **Statut** > **Manque**.
2. Definissez la date du jour.
3. Parcourez la liste et rappelez les clients prioritaires.
4. Verifiez si des messages vocaux ont ete laisses.

### Workflow 3 : Audit qualite d'un agent
1. Filtrez par le nom de l'agent dans le champ de recherche.
2. Definissez la periode souhaitee.
3. Ecoutez les enregistrements des appels.
4. Consultez les scores de satisfaction.
5. Notez vos observations pour la session de coaching.

---

## FAQ

**Q : Tous les appels sont-ils enregistres ?**
R : Cela depend de la politique d'enregistrement configuree dans les parametres
(tous, entrants uniquement, sortants uniquement, ou aucun).

**Q : Les donnees CRM sont-elles en temps reel ?**
R : Les ponts inter-modules chargent les donnees a la demande lorsque vous expandissez
un appel. Elles refletent l'etat actuel de la base de donnees.

**Q : Combien de temps les appels sont-ils conserves ?**
R : Les enregistrements du journal sont conserves indefiniment. Les fichiers audio
sont stockes sur Azure Blob Storage.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Call Log** | Registre historique de tous les appels telephoniques |
| **Direction** | Sens de l'appel : entrant (INBOUND), sortant (OUTBOUND), interne (INTERNAL) |
| **Whisper** | Modele d'IA d'OpenAI utilise pour la transcription automatique des appels |
| **Pont (Bridge)** | Lien inter-module affichant des donnees d'un autre module dans le contexte actuel |
| **SWR** | Bibliotheque de cache et rafraichissement automatique des donnees |

---

## Pages associees

- [Tableau de bord](./01-dashboard.md) : Vue d'ensemble de l'activite telephonique
- [Enregistrements](./03-enregistrements.md) : Recherche avancee dans les enregistrements
- [Messagerie vocale](./04-messagerie.md) : Gerer les messages vocaux
- [Analytics appels](./15-analytics-appels.md) : Statistiques detaillees des appels
