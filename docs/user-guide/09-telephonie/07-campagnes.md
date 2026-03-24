# Campagnes d'appels

> **Section**: Telephonie > Campagnes

---

## Concepts pour debutants

Les **campagnes d'appels** (ou campagnes de composition automatique) permettent de passer
des appels sortants en masse vers une liste de contacts. C'est l'outil principal pour la
prospection telephonique, les relances commerciales, et les sondages telephoniques.

Chaque campagne definit un **Caller ID** (numero affiche chez le destinataire), un **script**
que l'agent doit suivre, un **calendrier** de fonctionnement (horaires et jours actifs), et
un niveau de **concurrence** (nombre d'appels simultanes).

La detection de repondeur (**AMD** - Answering Machine Detection) permet d'identifier
automatiquement les repondeurs pour que les agents ne perdent pas de temps avec des
boites vocales.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Operations**, cliquez sur **Campagnes**.
3. L'URL directe est : `/admin/telephonie/campagnes`

---

## Apercu de l'interface

### Tableau des campagnes
Le tableau principal liste toutes les campagnes avec les colonnes :
- **Nom** : Nom de la campagne et description
- **Statut** : Badge colore (Brouillon, Active, En pause, Terminee, Archivee)
- **Contacts** : Nombre total de contacts dans la liste
- **Appeles** : Nombre de contacts deja appeles
- **Connectes** : Nombre de contacts ayant repondu (avec taux de connexion en %)
- **Caller ID** : Numero affiche chez le destinataire
- **Horaires** : Plage horaire de fonctionnement
- **Actions** : Modifier, Supprimer

### Bouton "Nouvelle campagne"
Ouvre le formulaire de creation de campagne.

### Formulaire de campagne (modale)
Le formulaire de creation/edition comporte :

**Informations generales** :
- Nom de la campagne
- Caller ID (numero de telephone sortant)

**Parametres d'appel** :
- Appels simultanes maximum (1-50)
- Detection de repondeur (AMD) active/desactivee

**Script de l'agent** :
- Titre du script
- Corps du script (texte que l'agent doit lire/adapter)

**Calendrier** :
- Heure de debut et de fin
- Fuseau horaire (America/Montreal par defaut)
- Jours actifs (lundi a dimanche, selectionnable individuellement)

---

## Fonctions detaillees

### Statuts des campagnes

| Statut | Description |
|--------|-------------|
| **Brouillon** | Campagne en preparation, pas encore lancee |
| **Active** | Campagne en cours de composition |
| **En pause** | Campagne temporairement arretee |
| **Terminee** | Tous les contacts ont ete appeles |
| **Archivee** | Campagne terminee et archivee |

### Detection de repondeur (AMD)
Quand AMD est active, le systeme detecte automatiquement si l'appel est decroche
par une personne ou un repondeur. Si c'est un repondeur, l'appel peut etre :
- Raccrocher automatiquement
- Laisser un message pre-enregistre
- Transfere a un agent

### Taux de connexion
Le taux de connexion est calcule : `(contacts connectes / contacts appeles) * 100`.
Un taux superieur a 30% est considere comme bon pour la prospection B2B.

### Fuseau horaire
Le calendrier respecte le fuseau horaire configure. La campagne ne passera aucun appel
en dehors des horaires definis, meme si le serveur est dans un autre fuseau.

---

## Workflows courants

### Workflow 1 : Creer une campagne de prospection
1. Cliquez sur **Nouvelle campagne**.
2. Nommez la campagne (ex: "Prospection Q2 2026").
3. Definissez le Caller ID avec un numero local canadien.
4. Activez AMD pour eviter les repondeurs.
5. Redigez le script que les agents suivront.
6. Definissez les horaires (9h-17h, lundi a vendredi).
7. Sauvegardez et importez la liste de contacts.
8. Activez la campagne.

### Workflow 2 : Analyser les resultats d'une campagne
1. Consultez le tableau des campagnes.
2. Identifiez la campagne souhaitee.
3. Verifiez le taux de connexion (contacts connectes / appeles).
4. Si le taux est faible (< 20%), verifiez la qualite de la liste de contacts.

---

## FAQ

**Q : Comment importer une liste de contacts ?**
R : Les contacts sont importes via un fichier CSV ou saisis manuellement dans le module CRM.

**Q : Les appels sont-ils enregistres pendant les campagnes ?**
R : Oui, selon la politique d'enregistrement globale configuree dans les parametres.

**Q : Puis-je respecter la loi sur la Liste nationale de numeros de telecommunication ?**
R : Koraline ne verifie pas automatiquement la LNNTE. Assurez-vous que votre liste de
contacts est conforme avant de lancer une campagne.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Campagne d'appels** | Ensemble d'appels sortants planifies vers une liste de contacts |
| **AMD** | Answering Machine Detection, detection automatique de repondeur |
| **Caller ID** | Numero de telephone affiche chez le destinataire |
| **Taux de connexion** | Pourcentage de contacts ayant effectivement decroche |
| **LNNTE** | Liste nationale de numeros de telecommunication exclus (loi canadienne) |

---

## Pages associees

- [Coaching](./08-coaching.md) : Former les agents avant de lancer une campagne
- [Groupes de sonnerie](./10-groupes.md) : Affecter les agents aux campagnes
- [Analytics appels](./15-analytics-appels.md) : Statistiques detaillees des appels sortants
