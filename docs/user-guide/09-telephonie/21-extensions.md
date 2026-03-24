# Extensions

> **Section**: Telephonie > Extensions

---

## Concepts pour debutants

Une **extension** (ou poste SIP) est un numero interne attribue a un agent pour passer
et recevoir des appels. Chaque extension est associee a un compte SIP (Session Initiation
Protocol) qui permet de se connecter depuis un telephone IP, un softphone (application),
ou directement depuis le navigateur web.

Par exemple, l'agent Marie Dupont a l'extension 101. Quand un appel est dirige vers
l'extension 101, son telephone sonne. Quand elle passe un appel sortant, son extension
identifie la ligne utilisee.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Parametres**, cliquez sur **Extensions**.
3. L'URL directe est : `/admin/telephonie/extensions`

---

## Apercu de l'interface

### Liste des extensions
Chaque extension affiche :
- **Numero d'extension** (ex: 101, 102, 103)
- **Domaine SIP** : Serveur PBX (ex: pbx.biocyclepeptides.com)
- **Utilisateur** : Nom et email de l'agent associe
- **Statut** : En ligne (vert) ou Hors ligne (gris)
- **Enregistre** : Indique si le telephone SIP est actuellement connecte
- **Actions** : Supprimer

### Bouton "Nouvelle extension"
Ouvre le formulaire de creation avec :
- **Utilisateur** : Selection de l'employe
- **Extension** : Numero du poste (ex: 101)
- **Nom d'utilisateur SIP** : Identifiant de connexion SIP
- **Mot de passe SIP** : Mot de passe de connexion SIP
- **Domaine SIP** : Serveur PBX (pbx.biocyclepeptides.com par defaut)

---

## Fonctions detaillees

### Creation d'une extension
La creation genere un compte SIP que l'agent utilisera pour se connecter. Les identifiants
SIP (nom d'utilisateur et mot de passe) doivent etre communiques a l'agent pour configurer
son telephone ou softphone.

### Statut de connexion
Le champ **Enregistre** (isRegistered) indique si le telephone de l'agent est actuellement
connecte au serveur SIP. Un agent hors ligne ne recevra pas d'appels diriges vers son extension.

### Suppression d'une extension
La suppression deconnecte le compte SIP et supprime l'extension. L'agent ne pourra plus
recevoir ni passer d'appels VoIP.

---

## Workflows courants

### Workflow 1 : Creer une extension pour un nouvel agent
1. Cliquez sur **Nouvelle extension**.
2. Selectionnez l'employe dans la liste.
3. Attribuez un numero d'extension (ex: prochain numero disponible).
4. Definissez les identifiants SIP.
5. Sauvegardez.
6. Communiquez les identifiants SIP a l'agent.
7. L'agent configure son softphone avec ces identifiants.

### Workflow 2 : Verifier la connexion d'un agent
1. Consultez la liste des extensions.
2. Verifiez le statut "Enregistre" de l'agent.
3. Si l'agent est hors ligne, verifiez sa configuration SIP.

---

## FAQ

**Q : Quel softphone recommandez-vous ?**
R : Pour macOS/iOS, Zoiper ou Bria sont recommandes. L'application Koraline iOS
integre egalement un client SIP via TelnyxRTC SDK.

**Q : Plusieurs appareils peuvent-ils utiliser la meme extension ?**
R : Un seul appareil peut etre enregistre par extension a la fois. Pour plusieurs
appareils, creez une extension par appareil.

**Q : Comment changer le mot de passe SIP ?**
R : Supprimez l'extension et recreez-la avec un nouveau mot de passe.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Extension** | Numero de poste interne attribue a un agent |
| **SIP** | Session Initiation Protocol, protocole de telephonie VoIP |
| **Softphone** | Application logicielle simulant un telephone |
| **PBX** | Private Branch Exchange, central telephonique d'entreprise |
| **Enregistrement SIP** | Processus de connexion d'un telephone au serveur SIP |

---

## Pages associees

- [Connexions](./19-connexions.md) : Fournisseurs VoIP auxquels les extensions se connectent
- [Transferts](./09-transferts.md) : Regles de renvoi par extension
- [Groupes de sonnerie](./10-groupes.md) : Affecter les extensions aux groupes
- [Parametres](./22-parametres.md) : Configuration SIP globale
