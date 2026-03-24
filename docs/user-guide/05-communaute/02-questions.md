# Gestion des Questions Produits

> **Section**: Communaute > Questions
> **URL**: `/admin/questions`
> **Niveau**: Debutant a intermediaire
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Questions** regroupe toutes les questions posees par les visiteurs et clients au sujet de vos produits. Ces questions apparaissent sur les fiches produits du site public, dans une section "Questions & Reponses". Repondre rapidement aux questions augmente la confiance des acheteurs potentiels et reduit le nombre de demandes de support.

**En tant que gestionnaire, vous pouvez :**
- Voir toutes les questions clients en un coup d'oeil
- Filtrer par statut (toutes, repondues, en attente de reponse)
- Rechercher une question par mot-cle, nom de client ou produit
- Repondre a une question (ou modifier une reponse existante)
- Basculer la visibilite d'une question entre publique et privee
- Supprimer une question inappropriee
- Convertir une question/reponse en entree FAQ
- Exporter toutes les questions au format CSV
- Marquer une question comme resolue

---

## Concepts cles pour les debutants

### Qu'est-ce qu'une question produit ?
C'est une question posee par un visiteur ou un client directement depuis la page d'un produit sur le site. Par exemple : "Ce peptide est-il compatible avec un autre supplement ?" ou "Quelle est la duree de conservation apres ouverture ?".

### Pourquoi repondre aux questions ?
Les questions sans reponse signalent un manque d'information. Quand vous repondez, votre reponse est visible par tous les visiteurs du site, ce qui :
- Aide les futurs acheteurs a prendre leur decision
- Reduit les demandes de support repetitives
- Demontre votre expertise et votre reactivite

### Quelle est la difference entre publique et privee ?
- **Publique** : la question et sa reponse sont visibles par tous les visiteurs du site
- **Privee** : la question est masquee du site public, seul l'administrateur la voit

### Qu'est-ce que la conversion en FAQ ?
Quand une question revient souvent, vous pouvez la convertir en entree FAQ. Le systeme copie la question et la reponse dans le presse-papier pour que vous puissiez facilement la coller dans votre section FAQ.

---

## Comment y acceder

### Methode 1 : Via le rail de navigation
1. Connectez-vous a l'interface d'administration (`/admin`)
2. Dans la colonne d'icones a gauche, cliquez sur l'icone **Communaute**
3. Dans le panneau lateral, cliquez sur **Questions**

### Methode 2 : Via la barre de recherche
1. Cliquez sur la barre de recherche en haut (ou tapez `/`)
2. Tapez "questions"
3. Selectionnez le resultat correspondant

### Methode 3 : Acces direct par URL
1. Rendez-vous a l'adresse `/admin/questions` dans votre navigateur

---

## Vue d'ensemble de l'interface

L'interface suit la disposition maitresse/detail (Outlook-style) avec 4 zones :

### 1. La barre de ruban (Ribbon) -- en haut

| Bouton | Icone | Fonction |
|--------|-------|----------|
| **Repondre** | Bulle de message | Ouvrir la fenetre de reponse pour la question selectionnee |
| **Marquer resolue** | Coche verte | Marquer la question comme resolue (la rend publique si elle ne l'est pas) |
| **Archiver** | Boite d'archive | Supprimer la question selectionnee (avec confirmation) |
| **Signaler le contenu** | Drapeau | Rendre une question publique privee (contenu inapproprie) |
| **Convertir en FAQ** | Signet | Copier la question et la reponse au format FAQ dans le presse-papier |
| **Exporter** | Telecharger | Exporter toutes les questions au format CSV |

### 2. Les cartes statistiques -- sous le ruban

Trois indicateurs cles :
- **Total des questions** : nombre total de questions recues
- **Sans reponse** : nombre de questions en attente de reponse (priorite haute)
- **Repondues** : nombre de questions auxquelles vous avez deja repondu

### 3. Le panneau de liste (gauche) -- liste maitre

La colonne de gauche affiche la liste des questions. Chaque entree montre :
- L'avatar ou les initiales du client
- Le nom du client (ou "Utilisateur anonyme" si non identifie)
- Le nom du produit concerne
- Un apercu de la question (80 premiers caracteres)
- La date de soumission
- Des badges : **Repondue** (vert) ou **En attente** (orange), et **Publique** (bleu) ou **Privee** (gris)

**Au-dessus de la liste :**
- Des **onglets de filtre** : Toutes / Sans reponse / Repondues (avec compteur)
- Une **barre de recherche** pour filtrer par mot-cle

### 4. Le panneau de detail (droite)

Quand vous selectionnez une question dans la liste, le panneau droit affiche :
- Le nom du client et le produit associe avec la date
- Le badge de visibilite **Publique** ou **Privee** (cliquable pour basculer)
- Le badge **En attente de reponse** si aucune reponse n'existe
- La **question complete** du client dans un encadre gris
- La **reponse** de l'administrateur dans un encadre vert (si elle existe)
- Le nom de l'administrateur qui a repondu et la date de la reponse
- Les informations de contact du client (email)
- Les boutons **Repondre / Modifier la reponse** et **Supprimer**

---

## Fonctions detaillees

### Repondre a une question

1. Selectionnez la question dans la liste de gauche
2. Cliquez sur le bouton **Repondre** dans le panneau de detail ou dans le ruban
3. La fenetre modale s'ouvre et affiche :
   - Le rappel de la question (client, produit, texte)
   - Un champ de texte pour votre reponse
4. Redigez votre reponse
5. Cliquez sur **Publier la reponse**
6. La question passe au statut "Repondue" et votre reponse apparait sur le site (si la question est publique)

> **Raccourci clavier** : appuyez sur Cmd+Entree (Mac) ou Ctrl+Entree (Windows) pour soumettre la reponse directement depuis le champ de texte.

### Modifier une reponse existante

1. Selectionnez la question deja repondue
2. Cliquez sur **Modifier la reponse** (icone crayon)
3. La fenetre de reponse s'ouvre avec le texte existant pre-rempli
4. Modifiez le texte selon vos besoins
5. Cliquez sur **Publier la reponse** pour sauvegarder

### Basculer la visibilite (publique / privee)

1. Selectionnez la question dans la liste
2. Dans le panneau de detail, cliquez sur le badge **Publique** ou **Privee**
3. Le statut bascule immediatement (un indicateur de chargement apparait pendant la mise a jour)
4. Une question privee ne sera pas visible sur le site public

### Supprimer une question

1. Selectionnez la question a supprimer
2. Cliquez sur le bouton **Supprimer** (poubelle rouge) dans le panneau de detail ou sur **Archiver** dans le ruban
3. Une boite de confirmation apparait pour prevenir les suppressions accidentelles
4. Confirmez la suppression
5. La question est retiree de la liste definitivement

### Convertir en FAQ

1. Selectionnez une question qui a deja une reponse
2. Cliquez sur **Convertir en FAQ** dans le ruban
3. Le systeme copie la question et la reponse au format "Q: ... / A: ..." dans votre presse-papier
4. Collez le contenu dans votre section FAQ ou dans un document

### Exporter en CSV

1. Cliquez sur **Exporter** dans le ruban
2. Un fichier CSV contenant toutes les questions est telecharge automatiquement
3. Colonnes du fichier : Produit, Client, Question, Reponse, Statut, Publique, Date

---

## Scenarios courants

### Scenario 1 : Repondre aux questions en attente de la journee

1. Ouvrez la page Questions
2. Consultez la carte **Sans reponse** pour connaitre le volume
3. Cliquez sur l'onglet **Sans reponse** pour afficher uniquement les questions en attente
4. Pour chaque question :
   - Lisez la question dans le panneau de detail
   - Si la question est pertinente : cliquez **Repondre**, redigez votre reponse, publiez
   - Si la question est inappropriee : cliquez sur le badge pour la passer en **Privee**, puis supprimez-la si necessaire
5. Verifiez que le compteur "Sans reponse" est a zero une fois termine

### Scenario 2 : Identifier les questions recurrentes pour la FAQ

1. Filtrez sur **Toutes** les questions
2. Utilisez la barre de recherche pour chercher des termes recurrents (ex: "posologie", "conservation", "livraison")
3. Pour chaque question frequente ayant une bonne reponse :
   - Selectionnez-la
   - Cliquez sur **Convertir en FAQ** dans le ruban
   - La question et la reponse sont copiees dans votre presse-papier
4. Collez le contenu dans la section FAQ de votre site
5. Cette demarche reduit les questions futures sur les memes sujets

---

## Foire aux questions (FAQ)

**Q : Les questions anonymes sont-elles frequentes ?**
R : Oui, les visiteurs non connectes peuvent poser des questions. Elles apparaissent avec le nom "Utilisateur anonyme". Vous ne disposerez pas de leur adresse email dans ce cas.

**Q : Puis-je modifier le texte de la question du client ?**
R : Non. Seule la reponse de l'administrateur peut etre redigee ou modifiee. Le texte de la question reste intact pour preserver l'authenticite.

**Q : La reponse est-elle visible immediatement sur le site ?**
R : Oui, des que vous publiez la reponse, elle apparait sous la question sur la fiche produit -- a condition que la question soit en mode **Publique**.

**Q : Que se passe-t-il si je supprime une question qui a deja une reponse ?**
R : La question et sa reponse sont supprimees definitivement du site et de la base de donnees. Cette action est irreversible.

**Q : Puis-je etre notifie quand une nouvelle question arrive ?**
R : Le nombre de questions sans reponse est visible dans les cartes statistiques. Le systeme met a jour ce compteur en temps reel.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Question produit** | Question posee par un visiteur depuis la fiche d'un produit sur le site |
| **Publique / Privee** | Visibilite de la question sur le site public |
| **En attente** | Question qui n'a pas encore recu de reponse de l'administrateur |
| **Resolue** | Question repondue et rendue publique |
| **FAQ** | Foire aux questions, section du site regroupant les questions frequentes |
| **Conversion en FAQ** | Action de copier une question/reponse pour l'integrer dans la section FAQ |

---

## Pages liees

- [Avis clients](/admin/avis) -- les evaluations et notes laissees par les clients
- [Chat support](/admin/chat) -- les conversations en direct avec les visiteurs
- [Produits](/admin/produits) -- les fiches produits ou apparaissent les questions
- [Contenu](/admin/contenu) -- les pages de contenu dont la section FAQ
