# Messagerie vocale

> **Section**: Telephonie > Messagerie vocale

---

## Concepts pour debutants

La **messagerie vocale** de Koraline est un systeme de messagerie vocale visuelle qui va
bien au-dela d'une simple boite vocale. Chaque message est transcrit automatiquement par
l'IA (Whisper), analyse en termes de sentiment et d'urgence, et associe au contact CRM
correspondant lorsqu'il est identifie.

Cela permet aux agents de trier et prioriser les messages sans avoir a les ecouter tous :
un message avec un sentiment negatif et une urgence elevee sera traite en priorite.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, cliquez sur **Messagerie**.
3. L'URL directe est : `/admin/telephonie/messagerie`

---

## Apercu de l'interface

### Filtres
Trois boutons permettent de filtrer les messages :
- **Tous** : Tous les messages vocaux
- **Non lus** : Messages pas encore ecoutes
- **Lus** : Messages deja consultes

### Liste des messages vocaux
Chaque message affiche :
- **Icone enveloppe** : Fermee (non lu) ou ouverte (lu)
- **Appelant** : Nom ou numero de telephone
- **Extension** : Poste sur lequel le message a ete laisse
- **Duree** : Longueur du message audio
- **Date** : Horodatage du message
- **Contact CRM** : Lien vers la fiche client si identifie
- **Urgence** : Badge (haute, normale, basse) determine par l'IA
- **Sentiment** : Badge (positif, neutre, negatif)
- **Mots-cles** : Tags extraits automatiquement du contenu

### Panneau d'expansion
Cliquez sur un message pour afficher :
- **Lecteur audio** : Ecouter le message
- **Transcription** : Texte complet du message
- **Resume IA** : Synthese automatique du contenu
- **Actions** : Marquer comme lu, Archiver, Rappeler, Supprimer

---

## Fonctions detaillees

### Transcription automatique par IA
Chaque message vocal est automatiquement transcrit par le modele Whisper. La transcription
inclut :
- Le texte integral du message
- Un resume concis
- Les mots-cles principaux
- L'analyse de sentiment (positif/neutre/negatif)
- L'evaluation de l'urgence (haute/normale/basse)

### Actions groupees
Selectionnez plusieurs messages pour effectuer des actions en lot :
- **Marquer comme lu** : Mettre a jour le statut de plusieurs messages
- **Archiver** : Deplacer vers les archives
- **Supprimer** : Supprimer definitivement

### Rappel direct
Un bouton **Rappeler** permet de lancer un appel sortant directement vers le numero
de l'appelant, sans quitter la page.

---

## Workflows courants

### Workflow 1 : Trier les messages du matin
1. Filtrez par **Non lus** pour voir les nouveaux messages.
2. Triez par urgence (les messages urgents apparaissent en premier).
3. Lisez les transcriptions pour identifier les demandes critiques.
4. Rappelez les clients urgents en utilisant le bouton **Rappeler**.
5. Marquez les messages traites comme lus.

### Workflow 2 : Archiver les messages anciens
1. Filtrez par **Lus** pour voir les messages deja traites.
2. Selectionnez les messages de plus d'un mois.
3. Cliquez sur **Archiver** pour les deplacer.

---

## FAQ

**Q : La transcription est-elle toujours exacte ?**
R : Whisper offre une precision elevee mais peut faire des erreurs sur les noms propres
ou les termes techniques. Ecoutez l'audio en cas de doute.

**Q : Puis-je configurer un message d'accueil personnalise ?**
R : Oui, via le constructeur IVR ou les parametres de l'extension.

**Q : Les messages supprimes sont-ils recuperables ?**
R : Non, la suppression est definitive. Archivez plutot les messages que vous pourriez
vouloir consulter plus tard.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Messagerie vocale visuelle** | Systeme de messagerie affichant les messages avec transcription |
| **Whisper** | Modele IA d'OpenAI pour la reconnaissance vocale |
| **Urgence** | Niveau de priorite du message determine par l'IA |

---

## Pages associees

- [Tableau de bord](./01-dashboard.md) : Voir le compteur de messages non lus
- [Journal d'appels](./02-journal.md) : Retrouver l'appel qui a genere le message
- [Enregistrements](./03-enregistrements.md) : Recherche transversale dans les enregistrements
