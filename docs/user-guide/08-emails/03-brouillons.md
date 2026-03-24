# Brouillons

> **Section**: Emails > Brouillons

---

## Concepts pour debutants

Le dossier **Brouillons** stocke les emails que vous avez commences a rediger mais que vous n'avez
pas encore envoyes. Cela vous permet de preparer un email, de le revoir plus tard, ou de le faire
valider par un collegue avant de l'expedier.

Les brouillons sont sauvegardes automatiquement dans Koraline et restent disponibles jusqu'a ce
que vous les envoyiez ou les supprimiez. Ils sont visibles uniquement par leur auteur et les
administrateurs.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Favoris** ou **Compte**, cliquez sur **Brouillons**.
3. L'URL directe est : `/admin/emails?folder=drafts`

---

## Apercu de l'interface

### Liste des brouillons
Chaque brouillon affiche :
- **Destinataire** : Adresse email du destinataire prevu (ou "Sans destinataire")
- **Objet** : Ligne d'objet du brouillon
- **Apercu** : Premiers caracteres du contenu
- **Date de creation** : Quand le brouillon a ete cree
- **Date de derniere modification** : Derniere sauvegarde

### Actions disponibles
- **Modifier** : Ouvrir le brouillon dans l'editeur pour continuer la redaction
- **Envoyer** : Envoyer le brouillon immediatement
- **Supprimer** : Supprimer definitivement le brouillon

---

## Fonctions detaillees

### Sauvegarde automatique
Lorsque vous redigez un email depuis le compositeur, le contenu est sauvegarde automatiquement
comme brouillon. Si vous fermez l'editeur sans envoyer, le brouillon sera disponible ici.

### Edition d'un brouillon
Cliquez sur un brouillon pour l'ouvrir dans le compositeur d'email. Vous retrouverez :
- Le destinataire pre-rempli
- L'objet tel que vous l'avez redige
- Le contenu HTML complet
- Les pieces jointes deja ajoutees

### Envoi depuis les brouillons
Depuis la liste des brouillons, cliquez sur l'icone d'envoi pour expedier directement sans
repasser par l'editeur. Un dialogue de confirmation apparait avant l'envoi.

---

## Workflows courants

### Workflow 1 : Preparer un email pour validation
1. Redigez votre email dans le compositeur.
2. Fermez l'editeur sans envoyer (le brouillon est sauvegarde automatiquement).
3. Informez votre collegue que le brouillon est pret pour revision.
4. Une fois valide, ouvrez le brouillon et cliquez sur **Envoyer**.

### Workflow 2 : Reprendre un email commence
1. Ouvrez le dossier **Brouillons**.
2. Cliquez sur le brouillon que vous souhaitez completer.
3. Terminez la redaction dans l'editeur.
4. Cliquez sur **Envoyer**.

---

## FAQ

**Q : Les brouillons sont-ils partages entre les agents ?**
R : Par defaut, un brouillon n'est visible que par son auteur. Les administrateurs peuvent
voir tous les brouillons.

**Q : Y a-t-il une limite au nombre de brouillons ?**
R : Non, il n'y a pas de limite technique. Neanmoins, il est recommande de nettoyer regulierement
les brouillons obsoletes.

**Q : Un brouillon peut-il contenir des pieces jointes ?**
R : Oui, les pieces jointes ajoutees pendant la redaction sont conservees avec le brouillon.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Brouillon** | Email sauvegarde mais non envoye |
| **Compositeur** | Editeur d'email integre a Koraline pour rediger et envoyer des messages |
| **Sauvegarde automatique** | Mecanisme qui preserve le contenu en cours de redaction |

---

## Pages associees

- [Boite de reception](./01-inbox.md) : Gerer les emails entrants
- [Emails envoyes](./02-envois.md) : Consulter l'historique des envois
- [Templates](./04-templates.md) : Utiliser des modeles pour accelerer la redaction
