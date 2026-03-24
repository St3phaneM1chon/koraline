# Connexions VoIP

> **Section**: Telephonie > Connexions

---

## Concepts pour debutants

La page **Connexions** permet de configurer et gerer les comptes fournisseurs VoIP qui
alimentent la telephonie de Koraline. Actuellement, deux fournisseurs sont supportes :

- **Telnyx** : Fournisseur principal de BioCycle Peptides, offrant des appels VoIP, SMS,
  et numeros de telephone canadiens.
- **VoIP.ms** : Fournisseur alternatif offrant des tarifs competitifs pour les appels
  canadiens et americains.

Chaque connexion est definie par des identifiants API (cle et secret) qui permettent a
Koraline de passer et recevoir des appels via le fournisseur.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Parametres**, cliquez sur **Connexions**.
3. L'URL directe est : `/admin/telephonie/connexions`

---

## Apercu de l'interface

### Liste des connexions
Chaque fournisseur affiche :
- **Nom du fournisseur** (Telnyx, VoIP.ms)
- **Statut** : Icone verte (connecte) ou rouge (deconnecte)
- **Cle API** : Indique si la cle est configuree (masquee)
- **Secret API** : Indique si le secret est configure (masque)
- **Derniere synchronisation** : Date et statut de la derniere verification
- **Numeros de telephone** : Nombre de numeros associes
- **Actions** : Configurer, Tester, Supprimer

### Formulaire de configuration
En cliquant sur **Configurer** pour un fournisseur :
- **Fournisseur** : Telnyx ou VoIP.ms
- **Cle API** : Identifiant d'authentification
- **Secret API** : Cle secrete
- **Active** : Toggle pour activer/desactiver la connexion

---

## Fonctions detaillees

### Test de connexion
Le bouton **Tester** envoie une requete de verification au fournisseur pour confirmer
que les identifiants sont valides et que l'API est accessible. Le resultat est affiche
immediatement (succes ou erreur avec message).

### Synchronisation
La synchronisation met a jour les informations du fournisseur (numeros disponibles,
solde, statut des lignes). La date de derniere synchronisation est affichee.

### Multi-fournisseur
Vous pouvez configurer plusieurs fournisseurs simultanement. Cela permet :
- Un fournisseur principal pour les appels locaux (Telnyx)
- Un fournisseur secondaire pour les appels longue distance
- Un basculement en cas de panne d'un fournisseur

---

## Workflows courants

### Workflow 1 : Configurer Telnyx
1. Connectez-vous au portail Telnyx (portal.telnyx.com).
2. Creez une cle API dans les parametres de votre compte.
3. Dans Koraline, cliquez sur **Configurer** pour Telnyx.
4. Entrez la cle API et le secret.
5. Activez la connexion.
6. Cliquez sur **Tester** pour verifier la connectivite.

### Workflow 2 : Diagnostiquer une connexion en echec
1. Verifiez le statut de la connexion (icone rouge = probleme).
2. Cliquez sur **Tester** pour identifier l'erreur.
3. Si "Invalid API key" : verifiez les identifiants dans le portail du fournisseur.
4. Si "Connection timeout" : verifiez que l'API du fournisseur est accessible.
5. Si "Account suspended" : verifiez le solde du compte.

---

## FAQ

**Q : Mes identifiants API sont-ils stockes de maniere securisee ?**
R : Oui, les cles et secrets sont chiffres dans la base de donnees. Ils ne sont jamais
affiches en clair dans l'interface.

**Q : Puis-je changer de fournisseur principal ?**
R : Oui, desactivez l'ancien fournisseur et configurez le nouveau. Les numeros de
telephone devront etre migres aupres du nouveau fournisseur.

**Q : Que se passe-t-il si la connexion tombe ?**
R : Les appels en cours ne seront pas interrompus, mais les nouveaux appels echoueront
jusqu'au retablissement de la connexion.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Fournisseur VoIP** | Entreprise qui fournit le service de telephonie par Internet |
| **Cle API** | Identifiant d'authentification pour acceder a l'API du fournisseur |
| **Secret API** | Cle secrete utilisee pour signer les requetes |
| **Telnyx** | Fournisseur VoIP canadien, principal partenaire de BioCycle Peptides |
| **SIP Trunk** | Connexion entre le PBX et le fournisseur VoIP |

---

## Pages associees

- [Numeros de telephone](./20-numeros.md) : Gerer les numeros associes aux connexions
- [Extensions](./21-extensions.md) : Configurer les postes SIP
- [Parametres](./22-parametres.md) : Configuration globale de la telephonie
- [Tableau de bord](./01-dashboard.md) : Etat des connexions en un coup d'oeil
