# Gestion des Webinaires

> **Section**: Fidelite > Webinaires
> **URL**: `/admin/webinaires`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Webinaires** gere vos evenements educatifs en ligne. Les webinaires sont un outil puissant pour eduquer vos clients sur les peptides de recherche, presenter de nouveaux produits, repondre aux questions en direct et fideliser votre communaute. Ils renforcent votre positionnement d'expert dans le domaine.

**En tant que gestionnaire, vous pouvez :**
- Creer et planifier de nouveaux webinaires
- Modifier les details d'un webinaire (titre, description, date, heure, duree)
- Voir le nombre d'inscrits et le taux de remplissage
- Suivre les statistiques de participation (inscrits vs. presents)
- Annuler un webinaire planifie (avec confirmation)
- Lancer un webinaire directement depuis l'interface
- Acceder a l'enregistrement (replay) apres l'evenement
- Filtrer par statut (tous, a venir, termines, brouillons)
- Exporter la liste des webinaires au format CSV

---

## Concepts cles pour les debutants

### Qu'est-ce qu'un webinaire ?
Un webinaire (contraction de "web" et "seminaire") est une presentation ou conference en ligne diffusee en direct. Les participants s'inscrivent a l'avance et rejoignent l'evenement via un lien de visioconference (Zoom, Teams, Google Meet, etc.).

### Quels sont les statuts possibles d'un webinaire ?

| Statut | Signification |
|--------|--------------|
| **Brouillon** | Le webinaire est cree mais pas encore planifie (pas de date definie) |
| **Planifie** | Le webinaire a une date et est ouvert aux inscriptions |
| **En direct** | Le webinaire est actuellement en cours de diffusion |
| **Termine** | Le webinaire est termine, les statistiques de participation sont disponibles |
| **Annule** | Le webinaire a ete annule avant sa tenue |

### Qu'est-ce qu'un replay ?
Le replay est l'enregistrement video du webinaire. Une fois l'evenement termine, vous pouvez ajouter un lien vers l'enregistrement pour que les inscrits (ou tout client) puissent le visionner apres coup.

### Qu'est-ce que le taux de participation ?
C'est le pourcentage de personnes inscrites qui ont effectivement assiste au webinaire. Un taux de 40 a 60 % est considere comme normal pour les webinaires en ligne.

---

## Comment y acceder

### Methode 1 : Via le rail de navigation
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la colonne d'icones a gauche, cliquez sur l'icone **Fidelite** (cadeau)
3. Dans le panneau lateral, cliquez sur **Webinaires**

### Methode 2 : Via la barre de recherche
1. Tapez "webinaires" ou "webinar" dans la barre de recherche
2. Selectionnez le resultat correspondant

### Methode 3 : Acces direct par URL
1. Rendez-vous a l'adresse `/admin/webinaires` dans votre navigateur

---

## Vue d'ensemble de l'interface

L'interface suit la disposition maitresse/detail (Outlook-style) avec 4 zones :

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Icone | Fonction |
|--------|-------|----------|
| **Nouveau webinaire** | + vert | Ouvrir le formulaire de creation d'un webinaire |
| **Supprimer** | Poubelle rouge | Annuler le webinaire selectionne (avec confirmation) |
| **Planifier** | Calendrier | Modifier la date et les details du webinaire selectionne |
| **Lancer maintenant** | Lecture | Ouvrir le lien de visioconference du webinaire dans un nouvel onglet |
| **Enregistrement** | Video | Ouvrir le lien de replay du webinaire termine |
| **Statistiques participants** | Graphique | Afficher le nombre d'inscrits et de presents |
| **Exporter** | Telecharger | Exporter la liste des webinaires au format CSV |

### 2. Les cartes statistiques -- sous le ruban

Quatre indicateurs :
- **A venir** : nombre de webinaires planifies dans le futur
- **Termines** : nombre de webinaires deja realises
- **Inscrits (a venir)** : total des inscriptions aux webinaires planifies
- **Taux moyen de participation** : pourcentage moyen de presents parmi les inscrits (webinaires termines)

### 3. Le panneau de liste (gauche) -- liste maitre

La colonne de gauche affiche la liste des webinaires. Chaque entree montre :
- La lettre initiale du titre (avatar)
- Le titre du webinaire
- La date et le nom de l'animateur
- Le nombre d'inscrits sur la capacite maximale et la duree
- Des badges : statut (Brouillon / Planifie / En direct / Termine / Annule) et "Replay" si un enregistrement est disponible

**Au-dessus de la liste :**
- Des **onglets de filtre** : Tous / A venir (Scheduled) / Termines (Completed) / Brouillons (Draft) (avec compteur)
- Une **barre de recherche** pour filtrer par titre, animateur ou description

### 4. Le panneau de detail (droite)

Quand vous selectionnez un webinaire, le panneau droit affiche :
- Le titre et la date/heure
- Le badge de statut (avec couleur)
- La **description** complete
- Les **details** dans un encadre :
  - Animateur (nom du presentateur)
  - Date et heure
  - Duree (en minutes)
  - Capacite maximale
- Les **statistiques d'inscription** :
  - Nombre d'inscrits
  - Capacite maximale
  - Nombre de presents (pour les webinaires termines)
  - Barre de progression du remplissage (en pourcentage)
- Le **lien de visioconference** (cliquable, ouvre dans un nouvel onglet)
- Le **lien de replay** si un enregistrement est disponible
- Les boutons **Modifier** et **Annuler** (pour les webinaires planifies)

---

## Fonctions detaillees

### Creer un nouveau webinaire

1. Cliquez sur **Nouveau webinaire** dans le ruban ou sur le bouton en haut a droite de la page
2. La fenetre de creation s'ouvre avec les champs suivants :
   - **Titre** (obligatoire) : le nom du webinaire
   - **Description** (obligatoire) : le contenu et les objectifs du webinaire
   - **Date et heure** (obligatoire) : quand le webinaire aura lieu
   - **Duree** (obligatoire) : en minutes (par defaut 60 min)
   - **Animateur** (obligatoire) : le nom du presentateur
   - **Places maximum** : le nombre maximum de participants (par defaut 100)
   - **Lien de visioconference** : l'URL Zoom, Teams, Meet ou autre
3. Remplissez tous les champs obligatoires
4. Cliquez sur **Creer**
5. Le webinaire apparait dans la liste avec le statut "Planifie" (si une date est definie) ou "Brouillon" (sans date)

> **Validation** : le systeme verifie que le titre, la description, l'animateur, la date et la duree sont renseigns. Des messages d'erreur inline apparaissent sous chaque champ manquant.

### Modifier un webinaire

1. Selectionnez le webinaire dans la liste
2. Cliquez sur **Modifier** dans le panneau de detail ou sur **Planifier** dans le ruban
3. La fenetre d'edition s'ouvre avec les valeurs actuelles pre-remplies
4. Modifiez les champs souhaites
5. Cliquez sur **Mettre a jour**

### Annuler un webinaire

1. Selectionnez le webinaire planifie
2. Cliquez sur **Annuler** dans le panneau de detail ou sur **Supprimer** dans le ruban
3. Une boite de confirmation apparait :
   - Elle indique le titre du webinaire
   - Elle precise le nombre d'inscrits qui seront affectes
4. Confirmez l'annulation
5. Le statut passe a "Annule" et le webinaire n'est plus visible pour les clients

### Lancer un webinaire

1. Selectionnez le webinaire planifie
2. Cliquez sur **Lancer maintenant** dans le ruban
3. Le lien de visioconference s'ouvre dans un nouvel onglet de votre navigateur
4. Si aucun lien n'est configure, un message vous invite a en ajouter un

### Consulter le replay

1. Selectionnez un webinaire termine
2. Si un enregistrement est disponible, un lien violet "Replay" apparait dans le panneau de detail
3. Cliquez sur ce lien pour ouvrir l'enregistrement dans un nouvel onglet
4. Si aucun replay n'est disponible, cliquez sur **Enregistrement** dans le ruban pour voir un message d'information

### Voir les statistiques d'un webinaire

1. Selectionnez le webinaire
2. Le panneau de detail affiche directement :
   - Le nombre d'inscrits et la capacite
   - La barre de progression de remplissage
   - Le nombre de presents (si termine)
3. Cliquez sur **Statistiques participants** dans le ruban pour un resume rapide via notification

### Exporter en CSV

1. Cliquez sur **Exporter** dans le ruban
2. Un fichier CSV contenant tous les webinaires est telecharge
3. Colonnes : Titre, Animateur, Statut, Date, Duree, Inscrits, Presents, Capacite max, Lien

---

## Scenarios courants

### Scenario 1 : Planifier un webinaire educatif mensuel

1. Ouvrez la page Webinaires
2. Cliquez sur **Nouveau webinaire**
3. Remplissez les informations :
   - Titre : "Peptides et recuperation musculaire : les dernieres etudes"
   - Description : resume du contenu et des objectifs d'apprentissage
   - Date : le premier mardi du mois prochain, 19h00 EST
   - Duree : 60 minutes
   - Animateur : "Dr. Martin Leblanc"
   - Places : 200
   - Lien : votre lien Zoom ou Teams
4. Cliquez sur **Creer**
5. Partagez le lien d'inscription dans votre newsletter et sur les reseaux sociaux
6. Le jour J, ouvrez le webinaire et cliquez sur **Lancer maintenant** pour demarrer

### Scenario 2 : Suivi post-webinaire et replay

1. Apres un webinaire termine, retournez sur la page Webinaires
2. Selectionnez le webinaire recemment termine
3. Consultez les statistiques : combien d'inscrits ? combien de presents ?
4. Calculez le taux de participation (presents / inscrits x 100)
5. Ajoutez le lien de replay en modifiant le webinaire si ce n'est pas deja fait
6. Exportez les donnees en CSV si vous avez besoin d'un rapport pour votre equipe

### Scenario 3 : Annuler un webinaire en cas d'imprevu

1. Selectionnez le webinaire concerne
2. Cliquez sur **Annuler**
3. La boite de confirmation indique le nombre d'inscrits affectes
4. Confirmez l'annulation
5. Envoyez un email aux inscrits via la page Emails pour les prevenir et proposer une nouvelle date
6. Creez un nouveau webinaire avec la date reportee

---

## Foire aux questions (FAQ)

**Q : Les clients peuvent-ils s'inscrire directement depuis le site ?**
R : Oui. Les webinaires planifies apparaissent sur le site public avec un bouton d'inscription. Les clients renseignent leur email pour s'inscrire.

**Q : Puis-je limiter le nombre de places ?**
R : Oui. Le champ "Places maximum" definit la capacite. Une fois le nombre d'inscrits atteint, les inscriptions sont fermees automatiquement.

**Q : Comment ajouter un replay apres le webinaire ?**
R : Modifiez le webinaire et ajoutez l'URL de l'enregistrement dans le champ "Lien de visioconference" ou dans un champ dedie au replay si disponible. Le badge "Replay" apparaitra dans la liste.

**Q : Le suivi individuel des participants est-il disponible ?**
R : Le bouton "Voir les inscrits" est actuellement en cours de developpement. Pour le moment, vous disposez du nombre total d'inscrits et de presents, mais pas de la liste nominative dans l'interface.

**Q : Puis-je creer un webinaire recurrent automatiquement ?**
R : Pas directement. Vous devez creer chaque occurrence manuellement. Cependant, vous pouvez modifier un webinaire existant pour le reutiliser avec une nouvelle date.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Webinaire** | Seminaire en ligne diffuse en direct, accessible via un lien de visioconference |
| **Animateur (host)** | Personne qui presente et anime le webinaire |
| **Replay** | Enregistrement video du webinaire, disponible apres l'evenement |
| **Taux de participation** | Pourcentage de personnes inscrites qui ont assiste au webinaire |
| **Brouillon (draft)** | Webinaire cree mais pas encore planifie (sans date) |
| **Planifie (scheduled)** | Webinaire avec une date definie, ouvert aux inscriptions |
| **Capacite** | Nombre maximum de participants autorises |

---

## Pages liees

- [Programme de fidelite](/admin/fidelite) -- les points de fidelite pouvant recompenser la participation
- [Newsletter](/admin/newsletter) -- pour promouvoir les webinaires aupres de votre base clients
- [Emails](/admin/emails) -- pour envoyer les invitations et les rappels
- [Blog](/admin/blog) -- pour publier un article resumant le contenu du webinaire
- [Ambassadeurs](/admin/ambassadeurs) -- les ambassadeurs peuvent relayer vos webinaires
