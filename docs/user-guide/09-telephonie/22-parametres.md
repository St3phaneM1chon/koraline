# Parametres VoIP

> **Section**: Telephonie > Parametres

---

## Concepts pour debutants

La page **Parametres** regroupe toute la configuration globale du module de telephonie.
Elle couvre les codecs audio, la politique d'enregistrement, la musique d'attente, la
sonnerie, les horaires d'ouverture, le fuseau horaire, et la conformite E911 (urgences).

Ces parametres s'appliquent a l'ensemble du systeme telephonique et affectent tous les
agents et toutes les lignes. Ils sont generalement configures une fois lors de la mise
en place initiale, puis ajustes ponctuellement.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Parametres**, cliquez sur **Parametres**.
3. L'URL directe est : `/admin/telephonie/parametres`

---

## Apercu de l'interface

### Sections de configuration

L'interface est organisee en sections thematiques, chacune avec un bouton de sauvegarde
independant :

**Audio et codecs** :
- Codecs actives (Opus, G.711, G.722, G.729)
- URL de la musique d'attente
- Selection de la sonnerie (defaut, classique, moderne, douce, urgente)

**Enregistrement** :
- Politique d'enregistrement (tous, entrants, sortants, aucun)

**Horaires d'ouverture** :
- Fuseau horaire (America/Toronto par defaut)
- Horaires par jour de la semaine (heure de debut et de fin pour chaque jour)

**E911 (Urgences)** :
- Active/Desactive
- Adresse physique de l'entreprise
- Ville, Province, Code postal
- Bouton de validation de l'adresse E911

---

## Fonctions detaillees

### Codecs audio

| Codec | Bande passante | Qualite | Usage |
|-------|---------------|---------|-------|
| **Opus** | Variable | Excellente | Recommande (defaut) |
| **G.711** | 64 kbps | Bonne | Compatibilite maximale |
| **G.722** | 64 kbps | Tres bonne | HD Voice |
| **G.729** | 8 kbps | Acceptable | Bande passante limitee |

Selectionnez les codecs supportes par votre infrastructure. Opus est recommande pour
la meilleure qualite avec la bande passante la plus faible.

### Politique d'enregistrement

| Politique | Description |
|-----------|-------------|
| **Tous** | Tous les appels sont enregistres |
| **Entrants** | Seuls les appels recus sont enregistres |
| **Sortants** | Seuls les appels passes sont enregistres |
| **Aucun** | Aucun enregistrement |

Note : L'enregistrement des appels doit etre conforme a la legislation. Au Canada, il
suffit qu'une des parties consente a l'enregistrement. Neanmoins, il est recommande
d'informer tous les participants via un message IVR.

### Musique d'attente
Fournissez l'URL d'un fichier audio (MP3 ou WAV) joue aux appelants en file d'attente.
Si aucune URL n'est fournie, un silence est joue.

### Sonneries
Cinq presets de sonnerie sont disponibles :
- **Defaut** : Sonnerie standard
- **Classique** : Sonnerie telephonique traditionnelle
- **Moderne** : Melodie contemporaine
- **Douce** : Son discret pour environnement calme
- **Urgente** : Son insistant pour appels prioritaires

### Horaires d'ouverture
Definissez les heures d'ouverture pour chaque jour de la semaine. En dehors de ces
horaires, les appels sont rediriges vers le menu IVR "hors heures" ou la messagerie.

Les jours sont configurables individuellement (lundi a dimanche). Chaque jour a une
heure de debut et de fin.

### Fuseau horaire
Le fuseau horaire affecte :
- Les horaires d'ouverture
- Les timestamps dans le journal d'appels
- Les plages horaires des campagnes d'appels

Fuseaux supportes : Montreal, Toronto, Vancouver, Winnipeg, Edmonton, Halifax,
New York, Chicago, Denver, Los Angeles, Paris, Londres, UTC.

### Configuration E911
Le E911 (Enhanced 911) est le systeme d'urgence nord-americain. La configuration de
l'adresse E911 permet aux services d'urgence de localiser votre entreprise si un
appel 911 est passe depuis une ligne VoIP.

La validation verifie que l'adresse est reconnue par le systeme E911 et la lie a
votre compte Telnyx. **Cette configuration est obligatoire pour les entreprises
canadiennes utilisant la VoIP.**

---

## Workflows courants

### Workflow 1 : Configuration initiale
1. Selectionnez les codecs audio (Opus + G.711 recommandes).
2. Definissez la politique d'enregistrement (tous, pour le controle qualite).
3. Configurez le fuseau horaire (America/Montreal).
4. Definissez les horaires d'ouverture (lundi-vendredi 9h-17h).
5. Remplissez l'adresse E911 et validez-la.
6. Sauvegardez chaque section.

### Workflow 2 : Modifier les horaires pour une periode speciale
1. Ouvrez la section **Horaires d'ouverture**.
2. Ajustez les heures pour les jours concernes.
3. Par exemple, pour les fetes : fermez le samedi et le dimanche, reduisez les horaires.
4. Sauvegardez. N'oubliez pas de restaurer les horaires normaux apres la periode.

---

## FAQ

**Q : Le E911 est-il obligatoire ?**
R : Oui, au Canada, tout fournisseur de services VoIP doit offrir l'acces au 911.
La configuration de l'adresse E911 est requise pour la conformite.

**Q : Puis-je avoir des horaires differents par numero de telephone ?**
R : Les horaires globaux s'appliquent a tout le systeme. Pour des horaires differents
par ligne, utilisez les menus IVR avec leur propre configuration d'horaires.

**Q : Le changement de codec affecte-t-il les appels en cours ?**
R : Non, le changement de codec s'applique uniquement aux nouveaux appels.

**Q : La musique d'attente doit-elle etre libre de droits ?**
R : Oui, vous etes responsable des droits sur la musique utilisee. Des bibliotheques
de musique d'attente libre de droits sont disponibles en ligne.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Codec** | Algorithme de compression/decompression audio |
| **Opus** | Codec audio moderne offrant la meilleure qualite/bande passante |
| **G.711** | Codec audio standard, compatibilite universelle |
| **E911** | Enhanced 911, systeme d'urgence avec localisation de l'appelant |
| **TTS** | Text-to-Speech, synthese vocale a partir de texte |
| **PBX** | Private Branch Exchange, central telephonique d'entreprise |

---

## Pages associees

- [Connexions](./19-connexions.md) : Configurer les fournisseurs VoIP
- [Extensions](./21-extensions.md) : Gerer les comptes SIP
- [Numeros](./20-numeros.md) : Gerer les numeros de telephone
- [IVR Builder](./12-ivr-builder.md) : Configurer le menu vocal (utilise les horaires)
- [Tableau de bord](./01-dashboard.md) : Vue d'ensemble du systeme
