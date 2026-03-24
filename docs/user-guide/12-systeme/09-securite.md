# Securite

> **Section**: Systeme > Outils > Securite
> **URL**: `/admin/securite`
> **Niveau**: Intermediaire a avance
> **Temps de lecture**: ~20 minutes

---

## A quoi sert cette page ?

La page **Securite** centralise tous les parametres de protection de la plateforme Koraline et des donnees de BioCycle Peptides. La securite est critique pour un site e-commerce qui traite des paiements et des donnees personnelles.

**En tant qu'administrateur, vous pouvez :**
- Configurer la politique de mots de passe
- Activer l'authentification a deux facteurs (2FA)
- Gerer les sessions actives
- Configurer les restrictions d'acces par IP
- Surveiller les tentatives de connexion echouees
- Gerer le chiffrement des donnees sensibles
- Configurer les politiques de conformite (Loi 25, LPRPDE)

---

## Concepts de base pour les debutants

### Pourquoi la securite est-elle si importante ?

BioCycle Peptides gere :
- **Donnees de paiement** : cartes de credit via Stripe (les numeros ne sont jamais stockes dans Koraline)
- **Donnees personnelles** : noms, adresses, emails, telephones des clients
- **Donnees financieres** : comptabilite, factures, relevees bancaires
- **Donnees commerciales** : prix d'achat, marges, listes de clients

Une fuite de donnees pourrait couter cher en termes de confiance, de reputation et de penalites legales.

### Les 3 piliers de la securite

| Pilier | Description | Mesures |
|--------|-------------|---------|
| **Confidentialite** | Seules les personnes autorisees voient les donnees | Roles, permissions, chiffrement |
| **Integrite** | Les donnees ne sont pas alterees sans autorisation | Logs d'audit, validations |
| **Disponibilite** | Le systeme est accessible quand necessaire | Sauvegardes, monitoring, redondance |

---

## Comment y acceder

1. Systeme > Outils > **Securite**
2. URL directe : `/admin/securite`

---

## Parametres de securite

### 1. Politique de mots de passe

| Parametre | Valeur recommandee | Description |
|-----------|-------------------|-------------|
| **Longueur minimale** | 12 caracteres | Plus c'est long, plus c'est securise |
| **Complexite** | Majuscule + minuscule + chiffre + caractere special | Exige un melange de types |
| **Expiration** | 90 jours | Force le changement regulier |
| **Historique** | 5 derniers mots de passe | Empeche la reutilisation |
| **Verrouillage** | Apres 5 echecs | Bloque le compte temporairement |

### 2. Authentification a deux facteurs (2FA)

**Qu'est-ce que c'est ?**
En plus du mot de passe, un deuxieme facteur est demande : un code envoye par SMS ou genere par une application (Google Authenticator, Authy).

**Configuration** :
1. Allez dans Securite > 2FA
2. Activez pour **tous les administrateurs** (recommande)
3. Optionnel : activez pour tous les utilisateurs
4. Chaque utilisateur configure son application 2FA a sa prochaine connexion

> **Fortement recommande** : Activez le 2FA au minimum pour les comptes administrateurs et comptables.

### 3. Gestion des sessions

| Parametre | Description | Valeur recommandee |
|-----------|-------------|-------------------|
| **Duree de session** | Temps avant deconnexion automatique | 8 heures |
| **Session unique** | Autoriser une seule session par utilisateur | Active |
| **Deconnexion inactivite** | Temps d'inactivite avant deconnexion | 30 minutes |

**Sessions actives** :
- Voir la liste des utilisateurs actuellement connectes
- Forcer la deconnexion d'un utilisateur si necessaire
- Voir l'IP et le navigateur de chaque session

### 4. Restrictions d'acces par IP

**Objectif** : Limiter l'acces a l'administration depuis certaines adresses IP seulement.

**Etapes** :
1. Allez dans Securite > Restrictions IP
2. Ajoutez les adresses IP autorisees (bureau, VPN)
3. Activez la restriction
4. Seules les connexions depuis ces IP seront acceptees

> **Attention** : Si vous activez cette restriction et perdez acces a l'IP autorisee, vous serez verrouille hors du systeme. Gardez toujours une IP de secours.

### 5. Surveillance des connexions

La page affiche :
- **Connexions reussies** : derniere date, IP, navigateur
- **Tentatives echouees** : nombre, IP source, date
- **Comptes verrouilles** : utilisateurs bloques apres trop d'echecs

**Signaux d'alerte** :
- Plus de 10 tentatives echouees depuis la meme IP → possible attaque par force brute
- Connexions depuis des pays inhabituels → possible compromission de compte
- Connexions en dehors des heures normales → verifier avec l'utilisateur

---

## Conformite legale

### Loi 25 du Quebec

La **Loi modernisant des dispositions legislatives en matiere de protection des renseignements personnels** (Loi 25) exige :

| Exigence | Implementation dans Koraline |
|----------|------------------------------|
| **Responsable** | Designez un responsable des donnees personnelles |
| **Consentement** | Formulaires de consentement pour la collecte de donnees |
| **Politique de confidentialite** | Page publiee sur le site |
| **Droit d'acces** | Les clients peuvent demander leurs donnees |
| **Droit de rectification** | Les clients peuvent corriger leurs donnees |
| **Droit de suppression** | Les clients peuvent demander la suppression |
| **Notification de breach** | Obligation de notifier en cas de fuite de donnees |
| **Journal d'audit** | Tracabilite des acces aux donnees personnelles |

### LPRPDE (federal)

La Loi sur la Protection des Renseignements Personnels et les Documents Electroniques s'applique aussi aux entreprises canadiennes et impose des obligations similaires.

---

## Questions frequentes (FAQ)

**Q : Les donnees de cartes de credit sont-elles stockees dans Koraline ?**
R : Non, jamais. Les paiements sont traites par Stripe. Koraline ne voit et ne stocke jamais les numeros de carte. Seuls les 4 derniers chiffres et le type de carte sont enregistres pour reference.

**Q : Comment reagir en cas de suspicion de piratage ?**
R : 1) Forcez la deconnexion de tous les utilisateurs. 2) Changez les mots de passe de tous les comptes admin. 3) Activez le 2FA. 4) Consultez les logs d'audit pour identifier l'intrusion. 5) Si des donnees clients sont compromises, notifiez conformement a la Loi 25.

**Q : Les sauvegardes sont-elles chiffrees ?**
R : Oui, les sauvegardes de la base de donnees sont chiffrees (voir page Sauvegardes).

**Q : Le site utilise-t-il HTTPS ?**
R : Oui, toutes les communications sont chiffrees via HTTPS (certificat SSL). Les connexions HTTP sont automatiquement redirigees vers HTTPS.

---

## Strategie expert : Conformite reglementaire detaillee pour un e-commerce de peptides au Quebec

### Loi 25 du Quebec -- Obligations detaillees

La Loi 25 (anciennement projet de loi 64) est entree en vigueur progressivement depuis septembre 2022. Elle impose des obligations strictes aux entreprises qui collectent, utilisent ou communiquent des renseignements personnels. Pour BioCycle Peptides, qui traite des donnees clients, des informations de paiement et des adresses de livraison, la conformite est obligatoire et les penalites sont severes.

**Obligations et implementation dans Koraline :**

| Obligation Loi 25 | Echeance | Implementation BioCycle | Statut requis |
|-------------------|----------|------------------------|---------------|
| **Responsable de la protection des RP** | En vigueur | Designez une personne (par defaut : le PDG). Son nom et ses coordonnees doivent etre publies sur le site web. | Obligatoire |
| **Registre des incidents de confidentialite** | En vigueur | Tenir un registre de TOUT incident impliquant des RP (acces non autorise, perte, vol, communication non autorisee). Conserver minimum 5 ans. | Obligatoire |
| **Notification des incidents** | En vigueur | Si un incident presente un "risque de prejudice serieux" : notifier la Commission d'acces a l'information (CAI) ET les personnes concernees. Delai : "avec diligence". | Obligatoire |
| **Consentement explicite** | En vigueur | Le consentement doit etre manifeste, libre, eclaire, donne a des fins specifiques et de duree limitee. Les cases pre-cochees sont INTERDITES. | Obligatoire |
| **Evaluation des facteurs relatifs a la vie privee (EFVP)** | En vigueur | Avant tout nouveau projet impliquant des RP (ex: nouveau partenaire de livraison, nouvel outil CRM, integration API tierce), mener une EFVP documentee. | Obligatoire |
| **Droit a l'oubli (desindexation)** | En vigueur | Un client peut demander que ses informations soient desindexees des moteurs de recherche si la diffusion contrevient a la loi ou a une ordonnance. | Obligatoire |
| **Droit a la portabilite** | En vigueur | Un client peut demander ses RP dans un format technologique structure et couramment utilise (CSV, JSON). | Obligatoire |
| **Politique de confidentialite** | En vigueur | Publiee sur le site en termes simples et clairs. Doit detailler : quelles RP sont collectees, pourquoi, avec qui elles sont partagees, combien de temps conservees, comment exercer ses droits. | Obligatoire |
| **Transparence des decisions automatisees** | En vigueur | Si Koraline utilise un algorithme pour prendre des decisions affectant les clients (scoring fidelite, detection fraude), informer le client et lui permettre de contester. | Obligatoire |

**Penalites Loi 25 :**

| Type de penalite | Montant maximum | Applicable a |
|-----------------|-----------------|--------------|
| **Penalite administrative (CAI)** | 10 000 000$ ou 2% du chiffre d'affaires mondial | Entreprise |
| **Penalite penale** | 25 000 000$ ou 4% du chiffre d'affaires mondial | Entreprise |
| **Penalite individuelle** | 50 000$ a 100 000$ | Dirigeant responsable |

### LPRPDE federale -- Obligations complementaires

La Loi sur la Protection des Renseignements Personnels et les Documents Electroniques (LPRPDE) s'applique aux activites commerciales interprovinciales et internationales. Pour BioCycle Peptides, qui vend partout au Canada et potentiellement a l'international, la LPRPDE s'ajoute a la Loi 25.

**Les 10 principes LPRPDE et leur application :**

| Principe | Application BioCycle |
|----------|---------------------|
| **Responsabilite** | L'entreprise est responsable des RP sous sa garde, y compris celles transferees a des tiers (Stripe, transporteurs) |
| **Fins determinees** | Collecter les RP uniquement pour des fins identifiees (commande, livraison, marketing si consentement) |
| **Consentement** | Obtenir le consentement avant ou au moment de la collecte |
| **Limitation de la collecte** | Ne collecter que les RP necessaires (pas de champs superflus dans les formulaires) |
| **Limitation de l'utilisation** | Ne pas utiliser les RP pour des fins autres que celles identifiees (pas de revente de donnees) |
| **Exactitude** | Maintenir les RP a jour et permettre au client de les corriger |
| **Mesures de securite** | Proteger les RP par des mesures techniques (chiffrement, 2FA) et organisationnelles (formation) |
| **Transparence** | Rendre disponible l'information sur les pratiques de gestion des RP |
| **Acces individuel** | Permettre au client d'acceder a ses RP et de les contester |
| **Possibilite de porter plainte** | Avoir un processus de traitement des plaintes relatif aux RP |

### PCI-DSS pour les paiements par carte

BioCycle Peptides utilise Stripe pour traiter les paiements, ce qui simplifie considerablement la conformite PCI-DSS. Cependant, certaines obligations demeurent.

**Niveau de conformite :** BioCycle est probablement un marchand de **niveau 4** (< 20 000 transactions e-commerce par an), ce qui signifie un questionnaire d'auto-evaluation (SAQ) plutot qu'un audit externe.

**Regles absolues :**

| Regle PCI-DSS | Implementation BioCycle | Consequence si non respectee |
|---------------|------------------------|------------------------------|
| **Ne JAMAIS stocker le CVV/CVC** | Stripe gere tout -- aucun CVV ne transite par les serveurs Koraline | Amende 5 000 - 100 000$/mois + perte du droit de traiter les cartes |
| **Ne JAMAIS stocker le numero de carte complet** | Seuls les 4 derniers chiffres sont stockes pour reference | Idem |
| **Utiliser la tokenisation** | Stripe tokenise les cartes. Koraline ne recoit qu'un token Stripe, pas les donnees de carte | Obligatoire |
| **HTTPS obligatoire** | Tout le site est en HTTPS (certificat SSL) | Obligatoire |
| **Logs d'acces** | Tracer les acces aux donnees de paiement | Obligatoire |
| **Mise a jour reguliere** | Maintenir les dependances de securite a jour (Next.js, libraries) | Obligatoire |

**Verifications trimestrielles recommandees :**
- Verifier que les pages de paiement ne contiennent aucun script tiers non autorise (risque de skimming)
- Verifier que les tokens Stripe expirent correctement
- Scanner le site avec un outil ASV (Approved Scanning Vendor) si le volume le justifie
- Revoir les logs d'acces aux donnees financieres

### Checklist de conformite pour BioCycle Peptides

**A verifier chaque trimestre :**

| Element | Verification | Fait |
|---------|-------------|------|
| Responsable RP designe et publie sur le site | Verifier la page "Politique de confidentialite" | |
| Registre d'incidents a jour | Verifier le registre (meme s'il est vide, il doit exister) | |
| Consentement explicite sur tous les formulaires | Tester le formulaire d'inscription, de commande, de newsletter | |
| Politique de confidentialite a jour | Relire et mettre a jour si changements | |
| Droits des clients fonctionnels | Tester le processus de demande d'acces, de rectification et de suppression | |
| EFVP pour tout nouveau partenaire/outil | Verifier que toute nouvelle integration a fait l'objet d'une EFVP | |
| 2FA actif sur tous les comptes admin | Verifier dans Securite > Sessions | |
| Sauvegardes chiffrees fonctionnelles | Tester la restauration (voir page Sauvegardes) | |
| Pas de donnees de carte stockees | Verifier avec Stripe que tout passe par tokenisation | |
| Formation equipe sur la protection des RP | Chaque employe doit comprendre ses obligations | |

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **2FA** | Two-Factor Authentication, authentification a deux facteurs |
| **Chiffrement** | Processus rendant les donnees illisibles sans la cle de dechiffrement |
| **Force brute** | Attaque essayant toutes les combinaisons de mot de passe |
| **Session** | Periode de connexion d'un utilisateur |
| **HTTPS** | Protocole de communication chiffre (le cadenas dans la barre d'adresse) |
| **Loi 25** | Loi quebecoise sur la protection des renseignements personnels |
| **LPRPDE** | Loi federale canadienne sur la protection des donnees |
| **Breach** | Fuite ou acces non autorise a des donnees |

---

## Pages reliees

- [Utilisateurs](/admin/employes) : Comptes a securiser
- [Roles](/admin/permissions) : Permissions d'acces
- [Audit Logs](/admin/logs) : Journal des actions
- [Sauvegardes](/admin/backups) : Protection des donnees
- [Parametres](/admin/parametres) : Configuration generale
