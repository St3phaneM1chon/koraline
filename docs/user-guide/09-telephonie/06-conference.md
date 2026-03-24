# Conference telephonique

> **Section**: Telephonie > Conference

---

## Concepts pour debutants

La page **Conference** permet d'organiser et de gerer des appels conference (appels a
plusieurs participants) directement depuis Koraline. Une salle de conference virtuelle
est creee et les participants s'y joignent par telephone ou via le navigateur.

Les conferences sont utiles pour les reunions d'equipe, les consultations client avec
plusieurs intervenants, ou les sessions de formation interne.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale gauche.
2. Dans le panneau de navigation, cliquez sur **Conference**.
3. L'URL directe est : `/admin/telephonie/conference`

---

## Apercu de l'interface

### Liste des salles de conference
La page principale affiche les salles de conference existantes et actives avec :
- **Nom de la salle** : Identifiant unique de la conference
- **Participants** : Nombre de participants actuellement connectes
- **Statut** : Active ou terminee
- **Date de creation** : Quand la conference a ete creee

### Creation d'une conference
Un bouton permet de creer une nouvelle salle de conference en definissant :
- Nom de la salle
- Numero d'acces par telephone
- Code PIN optionnel pour securiser l'acces

### Salle de conference (vue detaillee)
En entrant dans une salle, vous voyez :
- **Liste des participants** avec controles individuels (mute, expulser)
- **Controles globaux** (muter tous, enregistrer, terminer)
- **Chat integre** pour les messages texte pendant la conference
- **Duree** de la conference en cours

---

## Fonctions detaillees

### Gestion des participants
- **Inviter** : Ajouter un participant par numero de telephone
- **Muter/Demuter** : Couper le micro d'un participant
- **Expulser** : Retirer un participant de la conference
- **Muter tous** : Couper les micros de tous les participants

### Enregistrement
La conference peut etre enregistree. L'enregistrement sera disponible dans la page
**Enregistrements** apres la fin de la conference.

---

## Workflows courants

### Workflow 1 : Organiser une conference client
1. Creez une nouvelle salle de conference avec un nom descriptif.
2. Partagez le numero d'acces et le code PIN avec les participants.
3. Demarrez la conference et attendez que les participants se joignent.
4. Gerez les micros selon les besoins.
5. Terminez la conference quand la reunion est finie.

### Workflow 2 : Reunion d'equipe hebdomadaire
1. Utilisez une salle de conference recurrente avec le meme nom.
2. Les agents se connectent via leur extension SIP.
3. Activez l'enregistrement pour garder un compte-rendu.

---

## FAQ

**Q : Combien de participants maximum dans une conference ?**
R : La limite depend du forfait Telnyx. En general, jusqu'a 20 participants.

**Q : Les conferences sont-elles facturees ?**
R : Oui, chaque participant genere une minute d'utilisation VoIP facturee par Telnyx.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Conference call** | Appel telephonique avec 3 participants ou plus |
| **PIN** | Code numerique personnel pour securiser l'acces a la salle |
| **Muter** | Couper le microphone d'un participant |

---

## Pages associees

- [Tableau de bord](./01-dashboard.md) : Vue d'ensemble de l'activite
- [Enregistrements](./03-enregistrements.md) : Retrouver l'enregistrement de la conference
