# Analytics email

> **Section**: Emails > Analytics

---

## Concepts pour debutants

Le tableau de bord **Analytics email** centralise toutes les metriques de performance de
vos communications par email. Il vous donne une vue d'ensemble de la delivrabilite, des
taux d'engagement (ouvertures, clics), et de l'impact commercial (revenus generes).

Ces donnees sont essentielles pour evaluer l'efficacite de vos campagnes, identifier les
problemes de delivrabilite, et optimiser votre strategie email. Par exemple, un taux de
rebond eleve peut indiquer un probleme de qualite de votre liste de contacts, tandis qu'un
faible taux d'ouverture peut signaler des lignes d'objet peu engageantes.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Gestion**, cliquez sur **Analytics**.
3. L'URL directe est : `/admin/emails?tab=analytics`

---

## Apercu de l'interface

### Selecteur de periode
En haut a droite, un selecteur permet de choisir la periode d'analyse :
- **7 jours** : Vue court terme
- **30 jours** : Vue mensuelle (par defaut)
- **90 jours** : Vue trimestrielle
- **1 an** : Vue annuelle

### Cartes KPI
Quatre cartes de metriques principales sont affichees en haut :

| KPI | Description | Indicateur |
|-----|-------------|------------|
| **Emails envoyes** | Nombre total d'emails expedies sur la periode | Taux de delivrabilite (%) |
| **Rebonds** | Nombre d'emails non delivres | Taux de rebond (%) |
| **Workflows actifs** | Nombre de flows actuellement en fonctionnement | Nombre de campagnes |
| **Conversations** | Nombre total de conversations | Nouvelles conversations |

### Graphique de volume d'envoi
Un graphique en barres empilees montre le volume d'emails par jour, segmente par statut :
- **Bleu** : Emails envoyes/delivres
- **Rouge** : Emails rebondis

Ce graphique permet d'identifier les pics d'envoi et les tendances de delivrabilite.

### Diagramme circulaire des conversations
Un camembert affiche la repartition des conversations par statut (Nouveau, Ouvert, En attente,
Resolu, Ferme). Il donne une vue instantanee de la charge de travail du support.

### Top templates
Un classement des templates les plus utilises, avec le nombre d'utilisations pour chacun.
Utile pour identifier les contenus les plus populaires.

### Activite recente
Un journal des derniers emails envoyes, avec :
- Adresse du destinataire
- Objet de l'email
- Statut (delivre, rebondi, echoue) indique par un point colore
- Date et heure d'envoi

---

## Fonctions detaillees

### Metriques de delivrabilite
La delivrabilite mesure la capacite de vos emails a atteindre la boite de reception du
destinataire. Koraline suit :
- **Taux de delivrabilite** : % d'emails acceptes par les serveurs destinataires
- **Taux de rebond** : % d'emails rejetes (hard bounce = adresse invalide, soft bounce =
  boite pleine)
- **Emails echoues** : Erreurs techniques d'envoi

### Suivi des revenus
Pour les campagnes et flows, Koraline suit les conversions et attribue un revenu genere.
Cette metrique permet de calculer le ROI de chaque campagne.

### Donnees par periode
Le changement de periode met a jour toutes les metriques simultanement, permettant de
comparer les performances entre differentes periodes.

---

## Workflows courants

### Workflow 1 : Audit mensuel de delivrabilite
1. Selectionnez la periode **30 jours**.
2. Verifiez le taux de delivrabilite (cible : > 95%).
3. Si le taux de rebond depasse 5%, consultez la liste des rebonds.
4. Nettoyez les adresses invalides de votre liste de contacts.

### Workflow 2 : Evaluer la performance d'une campagne recente
1. Selectionnez la periode **7 jours**.
2. Consultez le graphique de volume pour identifier le pic d'envoi de la campagne.
3. Verifiez les metriques de la campagne dans la section activite recente.
4. Comparez le taux d'ouverture et de clic avec les benchmarks de l'industrie.

---

## FAQ

**Q : Les statistiques incluent-elles les emails transactionnels ?**
R : Oui, le tableau de bord consolide tous les types d'emails : transactionnels, campagnes,
flows et reponses manuelles.

**Q : Le taux d'ouverture est-il fiable a 100% ?**
R : Non, le suivi des ouvertures repose sur un pixel invisible. Certains clients email
bloquent le chargement d'images, ce qui peut sous-estimer le taux reel.

**Q : Comment ameliorer ma delivrabilite ?**
R : Nettoyez regulierement votre liste de contacts, utilisez un domaine d'envoi authentifie
(SPF, DKIM, DMARC), et maintenez un taux de plainte inferieur a 0.1%.

**Q : Les revenus sont-ils calcules automatiquement ?**
R : Oui, Koraline attribue un revenu lorsqu'un destinataire clique sur un lien d'email
et complete un achat dans les 7 jours suivant le clic.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Delivrabilite** | Capacite d'un email a atteindre la boite de reception |
| **Hard bounce** | Email rejete definitivement (adresse invalide) |
| **Soft bounce** | Email rejete temporairement (boite pleine, serveur indisponible) |
| **Taux d'ouverture** | Pourcentage de destinataires ayant ouvert l'email |
| **Taux de clic** | Pourcentage de destinataires ayant clique sur un lien |
| **SPF/DKIM/DMARC** | Protocoles d'authentification des emails pour empecher l'usurpation |
| **ROI** | Return on Investment, retour sur investissement d'une campagne |

---

## Pages associees

- [Campagnes](./05-campagnes.md) : Creer et envoyer des campagnes email
- [Flows](./06-flows.md) : Configurer les sequences automatisees
- [Boite de reception](./01-inbox.md) : Voir les conversations qui alimentent les stats
