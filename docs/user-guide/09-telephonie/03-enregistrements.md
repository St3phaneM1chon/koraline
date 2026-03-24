# Enregistrements d'appels

> **Section**: Telephonie > Enregistrements

---

## Concepts pour debutants

La page **Enregistrements** est un centre de contenu unifie qui regroupe trois types de
medias : les enregistrements **audio** des appels telephoniques, les enregistrements **video**
des visioconferences, et les transcriptions des conversations **chat**. Elle offre une
recherche transversale pour retrouver rapidement n'importe quel contenu enregistre.

Les enregistrements audio sont generes automatiquement selon la politique d'enregistrement
configuree dans les parametres VoIP. Chaque enregistrement est associe a son appel d'origine
et peut inclure une transcription IA avec analyse de sentiment.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, cliquez sur **Enregistrements**.
3. L'URL directe est : `/admin/telephonie/enregistrements`

---

## Apercu de l'interface

### Onglets de type de contenu
En haut, quatre onglets permettent de filtrer par type :
- **Tous** : Affiche tous les types de contenu
- **Audio** : Enregistrements d'appels telephoniques uniquement
- **Video** : Enregistrements de visioconferences
- **Chat** : Transcriptions de conversations par messagerie

### Barre de recherche
Un champ de recherche avec filtre de date permet de trouver un enregistrement par :
- Nom de l'appelant ou de l'appele
- Mot-cle dans la transcription
- Periode de temps

### Liste des enregistrements
Chaque enregistrement affiche :
- **Titre** : Format "Appelant -> Appele"
- **Description** : Resume de la transcription IA si disponible
- **Date** : Horodatage de l'enregistrement
- **Duree** : Longueur de l'enregistrement
- **Sentiment** : Badge de sentiment (positif, neutre, negatif)
- **Lecteur audio** : Controles de lecture integres
- **Telechargement** : Bouton pour telecharger le fichier

---

## Fonctions detaillees

### Recherche par contenu
La recherche interroge a la fois les metadonnees (noms, numeros) et le contenu des
transcriptions. Par exemple, chercher "remboursement" trouvera tous les appels ou ce
mot a ete prononce.

### Lecteur audio integre
Le composant AudioPlayer affiche une barre de progression avec :
- Bouton lecture/pause
- Indication du temps ecoule et de la duree totale
- Barre de progression cliquable pour naviguer dans l'enregistrement

### Telechargement
Les fichiers audio peuvent etre telecharges au format d'origine pour archivage
ou pour une ecoute hors ligne.

### Analyse de sentiment
Les enregistrements transcrits par l'IA incluent une analyse automatique du sentiment :
- **Positif** : Le client est satisfait
- **Neutre** : Conversation factuelle standard
- **Negatif** : Le client est mecontent ou frustre

---

## Workflows courants

### Workflow 1 : Chercher un enregistrement specifique
1. Tapez le nom du client ou un mot-cle dans la barre de recherche.
2. Filtrez par type (audio, video, chat) si necessaire.
3. Definissez la plage de dates.
4. Cliquez sur l'enregistrement pour l'ecouter.

### Workflow 2 : Revue qualite des conversations
1. Filtrez les enregistrements par la periode souhaitee.
2. Triez par sentiment negatif pour identifier les appels problematiques.
3. Ecoutez les enregistrements et notez les points d'amelioration.

---

## FAQ

**Q : Ou sont stockes les fichiers d'enregistrement ?**
R : Les fichiers audio sont stockes sur Azure Blob Storage et accessibles via une URL securisee.

**Q : Les enregistrements sont-ils conformes au RGPD ?**
R : Un message d'avertissement est joue en debut d'appel pour informer les parties que
l'appel est enregistre. La politique d'enregistrement est configurable.

**Q : Comment desactiver l'enregistrement pour certains appels ?**
R : La politique d'enregistrement se configure dans **Parametres VoIP**. Vous pouvez choisir
d'enregistrer tous les appels, uniquement les entrants, uniquement les sortants, ou aucun.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Enregistrement** | Fichier audio ou video capture pendant un appel |
| **Transcription IA** | Conversion automatique de la parole en texte par Whisper |
| **Sentiment** | Analyse emotionnelle du contenu de l'appel (positif, neutre, negatif) |
| **Blob Storage** | Service de stockage de fichiers dans le cloud Azure |

---

## Pages associees

- [Journal d'appels](./02-journal.md) : Voir les enregistrements dans le contexte de l'appel
- [Analytics vocales](./18-analytics-speech.md) : Analyses IA avancees des conversations
- [Parametres](./22-parametres.md) : Configurer la politique d'enregistrement
