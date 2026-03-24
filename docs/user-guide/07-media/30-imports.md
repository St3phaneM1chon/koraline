# Importations d'Enregistrements

> **Section**: Media > Gestion de Contenu > Importations
> **URL**: `/admin/media/imports`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Importations** affiche la file d'attente des enregistrements detectes sur vos plateformes connectees (Zoom, Teams, Google Meet, Webex, YouTube). C'est ici que vous decidez quels enregistrements importer dans votre bibliotheque video.

**En tant que gestionnaire, vous pouvez :**
- Voir tous les enregistrements detectes avec leur plateforme, titre, date et duree
- Filtrer par plateforme et par statut (en attente, en cours, termine, echoue, ignore)
- Synchroniser manuellement pour detecter les nouveaux enregistrements
- Importer un enregistrement individuellement
- Importer plusieurs enregistrements en lot (selection multiple)
- Ignorer un enregistrement (skip) pour ne pas le traiter
- Reessayer un import echoue
- Voir les videos creees a partir des imports reussis
- Suivre les consentements associes

---

## Concepts cles pour les debutants

| Terme | Definition |
|-------|-----------|
| **Enregistrement** | Fichier video genere par une plateforme de visioconference |
| **Synchronisation** | Action de recuperer la liste des enregistrements depuis les plateformes |
| **Import** | Action de telecharger et integrer un enregistrement dans la bibliotheque video |
| **Skip (Ignorer)** | Marquer un enregistrement comme "a ne pas importer" |
| **Consentement** | Autorisation des participants pour utiliser l'enregistrement |

---

## Comment y acceder

1. Allez dans **Media** dans la barre de navigation
2. Cliquez sur **Importations** dans le panneau lateral
3. Ou naviguez vers `/admin/media/imports`

---

## Vue d'ensemble de l'interface

### 1. En-tete
- Titre **Importations d'enregistrements** avec description
- Bouton **Importer en lot** (si des enregistrements sont selectionnes)
- Bouton **Synchroniser maintenant** pour lancer une detection

### 2. Filtres
- Filtre par **plateforme** (Zoom, Teams, Meet, Webex, YouTube)
- Filtre par **statut** (en attente, en cours, termine, echoue, ignore)
- Compteur total d'enregistrements

### 3. Tableau des enregistrements

| Colonne | Description |
|---------|-------------|
| **Case a cocher** | Selection pour import en lot (uniquement pour les "en attente") |
| **Plateforme** | Badge avec le nom de la plateforme (Zoom, Teams, etc.) |
| **Reunion** | Titre de la reunion et email de l'hote |
| **Date** | Date de l'enregistrement |
| **Duree** | Duree de l'enregistrement et taille du fichier |
| **Statut** | Badge colore (en attente, en cours, termine, echoue, ignore) |
| **Consentement** | Badge du statut de consentement (accorde, en attente) |
| **Actions** | Boutons d'action contextuels |

### 4. Statuts possibles

| Statut | Badge | Description |
|--------|-------|-------------|
| **En attente (pending)** | Gris | Detecte mais pas encore importe |
| **En cours (downloading)** | Indigo pulse | Import en cours de telechargement |
| **En traitement (processing)** | Jaune tournant | Post-traitement en cours |
| **Termine (completed)** | Vert | Import reussi, video creee |
| **Echoue (failed)** | Rouge | Erreur lors de l'import |
| **Ignore (skipped)** | Gris clair | Deliberement ignore par l'administrateur |

---

## Fonctionnalites detaillees

### Synchroniser les enregistrements
1. Cliquez sur **Synchroniser maintenant**
2. Koraline interroge toutes les plateformes connectees
3. Les nouveaux enregistrements apparaissent avec le statut "En attente"
4. Un message indique le nombre de nouveaux enregistrements detectes

### Importer un enregistrement
1. Sur la ligne de l'enregistrement, cliquez sur **Importer** (icone lecture)
2. L'enregistrement passe en statut "En cours"
3. Le fichier est telecharge et une video est creee dans la bibliotheque
4. Le statut passe a "Termine" avec un lien vers la video

### Import en lot
1. Cochez les enregistrements souhaites (cases a cocher a gauche)
2. Le bouton **Importer en lot** apparait en haut avec le compteur
3. Cliquez sur le bouton
4. Tous les enregistrements selectionnes sont importes en sequence
5. Un message resume le nombre de succes et d'echecs

### Ignorer un enregistrement
1. Cliquez sur **Ignorer** (icone skip) sur la ligne
2. L'enregistrement passe en statut "Ignore"
3. Il ne sera plus propose pour import

### Reessayer un import echoue
1. Sur une ligne en statut "Echoue", cliquez sur **Reessayer**
2. Le message d'erreur est affiche sous le statut pour vous aider a diagnostiquer

### Voir la video creee
1. Sur une ligne en statut "Termine", cliquez sur **Voir la video** (icone video verte)
2. Vous etes redirige vers la page de detail de la video

---

## Flux de travail recommandes

### Apres chaque reunion Zoom
1. Attendez quelques minutes apres la fin de la reunion (Zoom genere l'enregistrement)
2. Cliquez sur **Synchroniser maintenant**
3. Le nouvel enregistrement apparait en "En attente"
4. Verifiez le titre et la duree
5. Si pertinent, cliquez sur **Importer**
6. Allez ensuite dans [Videos](./27-videos.md) pour editer la video importee

### Traitement en lot hebdomadaire
1. En debut de semaine, synchronisez les enregistrements
2. Passez en revue tous les enregistrements "En attente"
3. Selectionnez ceux a importer et importez en lot
4. Ignorez les enregistrements non pertinents (tests, reunions internes)

---

## Questions frequentes

**Q : L'enregistrement n'apparait pas apres la synchronisation**
R : Certaines plateformes (Zoom) mettent quelques minutes a rendre les enregistrements disponibles. Attendez 5 minutes et resynchronisez.

**Q : L'import a echoue, que faire ?**
R : Consultez le message d'erreur sous le statut. Les causes courantes sont : fichier trop volumineux, token expire (reconnectez la plateforme), ou probleme reseau. Cliquez sur **Reessayer** apres avoir corrige.

**Q : Les enregistrements ignores peuvent-ils etre reimportes ?**
R : Oui, les enregistrements ignores restent dans la liste. Vous pouvez les reimporter ulterieurement.

---

## Pages associees

| Page | Description |
|------|-------------|
| [Connexions](./29-connections.md) | Configurer les plateformes pour la detection |
| [Videos](./27-videos.md) | Gerer les videos importees |
| [Consentements](./32-consents.md) | Verifier les consentements des participants |
| [Sessions Video](./31-sessions.md) | Planifier des sessions d'enregistrement |
