# Webhooks VoIP

> **Section**: Telephonie > Webhooks

---

## Concepts pour debutants

Les **webhooks** permettent a Koraline d'envoyer des notifications automatiques vers des
systemes externes lorsque des evenements telephoniques se produisent. Par exemple, quand
un appel est termine, Koraline peut envoyer les details de l'appel vers un CRM externe,
un systeme de ticketing, ou un outil d'analyse.

Chaque webhook est configure avec une URL de destination, une liste d'evenements a surveiller,
et un **secret** de signature pour securiser les communications.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Avance**, cliquez sur **Webhooks**.
3. L'URL directe est : `/admin/telephonie/webhooks`

---

## Apercu de l'interface

### Liste des webhooks
Chaque webhook affiche :
- **URL** de destination
- **Evenements** souscrits (badges)
- **Secret** de signature (masque par defaut, revelable)
- **Actif** : Toggle on/off
- **Dernier envoi** : Statut et date du dernier envoi
- **Journal** : Historique des livraisons recentes
- **Actions** : Modifier, Tester, Supprimer

### Bouton "Nouveau webhook"
Ouvre le formulaire de configuration.

---

## Fonctions detaillees

### Evenements disponibles
Les evenements VoIP que vous pouvez surveiller incluent :
- Debut d'appel
- Fin d'appel
- Appel manque
- Message vocal recu
- Transfert d'appel
- Changement de statut d'agent
- Resultat de sondage

### Signature de securite
Chaque requete envoyee inclut une signature HMAC-SHA256 calculee avec le secret
configure. Le systeme destinataire peut verifier cette signature pour s'assurer
que la requete provient bien de Koraline.

### Journal de livraison
Pour chaque webhook, un journal affiche les derniers envois avec :
- Evenement envoye
- Code de statut HTTP recu
- Date et heure de l'envoi
- Indicateur de succes/echec

### Test de livraison
Un bouton **Tester** envoie une requete de test a l'URL configuree pour verifier
que le systeme destinataire repond correctement.

---

## Workflows courants

### Workflow 1 : Integrer avec un CRM externe
1. Cliquez sur **Nouveau webhook**.
2. Entrez l'URL du CRM (ex: https://crm.example.com/webhooks/calls).
3. Selectionnez les evenements : Fin d'appel, Appel manque.
4. Generez un secret de signature.
5. Testez la connexion avec le bouton **Tester**.
6. Activez le webhook.

### Workflow 2 : Diagnostiquer un webhook defaillant
1. Verifiez le statut du dernier envoi dans la liste.
2. Consultez le journal de livraison pour voir les codes HTTP.
3. Si le code est 500, le probleme est du cote du systeme destinataire.
4. Si le code est 0 ou timeout, verifiez que l'URL est accessible.

---

## FAQ

**Q : Combien de webhooks puis-je configurer ?**
R : Il n'y a pas de limite au nombre de webhooks.

**Q : Que se passe-t-il si le destinataire ne repond pas ?**
R : La requete est consideree comme echouee et loguee dans le journal.

**Q : Le secret est-il obligatoire ?**
R : Techniquement non, mais il est fortement recommande pour la securite.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Webhook** | Notification HTTP envoyee automatiquement lors d'un evenement |
| **HMAC-SHA256** | Algorithme de signature cryptographique |
| **Payload** | Corps de la requete contenant les donnees de l'evenement |

---

## Pages associees

- [Connexions](./19-connexions.md) : Configurer les fournisseurs VoIP
- [Parametres](./22-parametres.md) : Configuration globale
