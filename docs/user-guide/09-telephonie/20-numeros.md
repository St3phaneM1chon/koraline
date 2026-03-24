# Numeros de telephone

> **Section**: Telephonie > Numeros

---

## Concepts pour debutants

La page **Numeros de telephone** gere les DID (Direct Inward Dialing), c'est-a-dire les
numeros de telephone publics de BioCycle Peptides. Chaque numero est associe a une
connexion VoIP (Telnyx) et peut etre configure pour router les appels entrants vers
un IVR, un groupe de sonnerie, ou une extension specifique.

Les numeros sont loues aupres du fournisseur VoIP et apparaissent comme Caller ID
lors des appels sortants. Un numero canadien local (+1 514, +1 450, etc.) inspire
confiance aux clients quebecois.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Telephone** dans la barre laterale.
2. Sous **Parametres**, cliquez sur **Numeros**.
3. L'URL directe est : `/admin/telephonie/numeros`

---

## Apercu de l'interface

### Liste des numeros
Chaque numero affiche :
- **Numero** : Format E.164 (ex: +15145551234)
- **Nom d'affichage** : Libelle personnalise (ex: "Ligne principale")
- **Pays** : Drapeau et code pays (CA, US, etc.)
- **Connexion** : Fournisseur VoIP associe
- **Actions** : Supprimer

### Bouton "Ajouter un numero"
Ouvre le formulaire d'ajout avec :
- Numero de telephone (format E.164)
- Nom d'affichage
- Pays (CA par defaut)
- Connexion VoIP associee

---

## Fonctions detaillees

### Ajout d'un numero
L'ajout d'un numero dans Koraline l'enregistre dans la base de donnees et l'associe a
la connexion VoIP. Le numero doit avoir ete prealablement achete ou loue dans le portail
du fournisseur (Telnyx Portal).

### Routage des appels entrants
Une fois le numero ajoute, les appels entrants sur ce numero sont routes selon la
configuration du menu IVR principal. Sans IVR, les appels sont diriges vers le groupe
de sonnerie par defaut.

### Suppression d'un numero
La suppression retire le numero de Koraline mais ne le resilie pas aupres du fournisseur.
Vous devez egalement le supprimer dans le portail Telnyx si vous ne souhaitez plus le payer.

---

## Workflows courants

### Workflow 1 : Ajouter un nouveau numero
1. Achetez le numero dans le portail Telnyx (portal.telnyx.com).
2. Configurez le webhook de l'appel entrant vers Koraline dans Telnyx.
3. Dans Koraline, cliquez sur **Ajouter un numero**.
4. Entrez le numero, le nom d'affichage, et selectionnez la connexion.
5. Sauvegardez. Le numero est maintenant actif.

### Workflow 2 : Configurer un numero pour les ventes
1. Ajoutez le numero avec le nom "Ligne Ventes".
2. Configurez un menu IVR dedie pour ce numero.
3. Le menu IVR redirige vers le groupe de sonnerie "Ventes".

---

## FAQ

**Q : Combien de numeros puis-je avoir ?**
R : Il n'y a pas de limite dans Koraline. La limite depend du forfait du fournisseur VoIP.

**Q : Puis-je porter mon numero existant ?**
R : Oui, la portabilite de numero est supportee par Telnyx. Contactez leur support pour
initier le processus de portage.

**Q : Le numero est-il affiche comme Caller ID lors des appels sortants ?**
R : Oui, vous pouvez choisir quel numero utiliser comme Caller ID dans les parametres
de chaque campagne ou extension.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **DID** | Direct Inward Dialing, numero de telephone public |
| **E.164** | Format international des numeros (+indicatif + numero) |
| **Portabilite** | Processus de transfert d'un numero d'un operateur a un autre |
| **Caller ID** | Numero de telephone affiche chez le destinataire |

---

## Pages associees

- [Connexions](./19-connexions.md) : Fournisseurs VoIP associes aux numeros
- [IVR Builder](./12-ivr-builder.md) : Router les appels entrants sur chaque numero
- [Campagnes](./07-campagnes.md) : Utiliser un numero comme Caller ID sortant
