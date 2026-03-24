# Transferts d'appels

> **Section**: Telephonie > Transferts

---

## Concepts pour debutants

La page **Transferts** permet de configurer des **regles de renvoi d'appel** automatiques
pour chaque extension. Quand un agent est indisponible, occupe, ou ne repond pas, l'appel
est automatiquement redirige vers une destination alternative.

Quatre conditions de transfert sont disponibles :
- **Toujours** : Tous les appels sont renvoyes sans sonner
- **Occupe** : Renvoi quand la ligne est deja en communication
- **Non-reponse** : Renvoi apres un delai de sonnerie configurable
- **Indisponible** : Renvoi quand l'agent est deconnecte

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Operations**, cliquez sur **Transferts**.
3. L'URL directe est : `/admin/telephonie/transferts`

---

## Apercu de l'interface

### Tableau des regles de transfert
Chaque regle affiche :
- **Extension** : Le poste concerne
- **Condition** : Toujours, Occupe, Non-reponse, Indisponible
- **Destination** : Numero ou extension de redirection
- **Duree de sonnerie** : Secondes avant le renvoi (pour la condition non-reponse)
- **Actif** : Toggle on/off pour activer/desactiver la regle

### Bouton "Nouvelle regle"
Ouvre le formulaire de creation d'une regle de transfert.

---

## Fonctions detaillees

### Conditions de transfert

| Condition | Declencheur | Cas d'usage |
|-----------|-------------|-------------|
| **Toujours** | Immediatement, sans sonnerie | Agent en vacances |
| **Occupe** | Ligne deja en communication | Redirection vers collegue |
| **Non-reponse** | Apres X secondes de sonnerie | Messagerie vocale |
| **Indisponible** | Agent hors ligne | Numero de secours |

### Duree de sonnerie
Pour la condition "non-reponse", le delai de sonnerie definit combien de secondes
l'appel sonne avant d'etre redirige (typiquement 15 a 30 secondes).

### Activation/Desactivation rapide
Le toggle permet d'activer ou desactiver une regle sans la supprimer, utile pour
les regles temporaires (vacances, maladie).

---

## Workflows courants

### Workflow 1 : Configurer le renvoi pendant les vacances
1. Cliquez sur **Nouvelle regle**.
2. Selectionnez l'extension de l'agent absent.
3. Choisissez la condition **Toujours**.
4. Definissez la destination (extension du remplacant ou messagerie).
5. Activez la regle. Desactivez-la au retour de l'agent.

### Workflow 2 : Renvoi vers messagerie en cas de non-reponse
1. Creez une regle avec la condition **Non-reponse**.
2. Definissez la duree de sonnerie a 20 secondes.
3. Configurez la destination vers la messagerie vocale.

---

## FAQ

**Q : Plusieurs regles peuvent-elles s'appliquer a la meme extension ?**
R : Oui, vous pouvez configurer une regle par condition pour la meme extension.

**Q : La destination peut-elle etre un numero externe ?**
R : Oui, vous pouvez renvoyer vers un numero de telephone externe.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Renvoi d'appel** | Redirection automatique d'un appel vers une autre destination |
| **Extension** | Numero de poste interne d'un agent |
| **Toggle** | Interrupteur pour activer/desactiver une fonctionnalite |

---

## Pages associees

- [Extensions](./21-extensions.md) : Gerer les postes internes
- [Groupes de sonnerie](./10-groupes.md) : Alternative au transfert individuel
- [IVR Builder](./12-ivr-builder.md) : Transferts automatises via le menu vocal
