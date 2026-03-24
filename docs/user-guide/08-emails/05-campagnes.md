# Campagnes email

> **Section**: Emails > Campagnes

---

## Concepts pour debutants

Les **campagnes email** permettent d'envoyer un meme email a un grand nombre de destinataires
en une seule operation. C'est l'outil principal pour les communications marketing de BioCycle
Peptides : promotions, lancements de produits, newsletters, offres speciales.

Chaque campagne passe par un cycle de vie : elle est creee en tant que **brouillon**, editee
avec le contenu souhaite, puis **envoyee** ou **planifiee** pour un envoi ulterieur. Apres
l'envoi, les statistiques de performance (ouvertures, clics, rebonds, revenus) sont collectees
automatiquement.

Koraline offre un editeur visuel riche avec mode visuel (WYSIWYG), mode code HTML, et mode
apercu. Les variables dynamiques permettent de personnaliser chaque email avec le prenom du
destinataire, son entreprise, etc.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Gestion**, cliquez sur **Campagnes**.
3. L'URL directe est : `/admin/emails?tab=campaigns`

---

## Apercu de l'interface

### Liste des campagnes
L'ecran principal affiche toutes les campagnes sous forme de cartes, chacune avec :
- **Nom** de la campagne
- **Statut** : Brouillon, Planifiee, En cours d'envoi, Envoyee, Annulee
- **Objet** de l'email
- **Date de creation** et date d'envoi
- **Statistiques** (pour les campagnes envoyees) : envoyes, ouverts, cliques, rebondis, revenus

### Bouton "Nouvelle campagne"
Cree une nouvelle campagne en brouillon avec un nom et un objet par defaut.

### Badges de statut

| Statut | Couleur | Description |
|--------|---------|-------------|
| **Brouillon** | Gris | Campagne en cours de preparation |
| **Planifiee** | Bleu | Campagne programmee pour un envoi futur |
| **En cours** | Jaune | Campagne en train d'etre envoyee |
| **Envoyee** | Vert | Campagne entierement envoyee |
| **Annulee** | Rouge | Campagne annulee avant l'envoi |

### Actions par campagne
- **Envoyer** (icone avion) : Envoyer la campagne (brouillons uniquement)
- **Modifier** (icone crayon) : Ouvrir l'editeur de campagne
- **Supprimer** (icone corbeille) : Supprimer la campagne
- **Statistiques** (icone graphique) : Voir les metriques (campagnes envoyees)

---

## Fonctions detaillees

### Editeur de campagne
L'editeur de campagne est l'outil central de creation de contenu. Il offre trois modes :

1. **Mode visuel** : Editeur WYSIWYG avec barre d'outils complete (gras, italique, liens,
   images, alignement, listes). Modifier le contenu directement comme dans un traitement de texte.

2. **Mode code** : Editeur HTML brut pour un controle total du rendu. Utile pour les
   utilisateurs avances ou pour coller du HTML depuis un outil externe.

3. **Mode apercu** : Visualisation du rendu final avec les variables remplacees par des
   valeurs d'exemple.

### Barre d'outils (mode visuel)
La barre d'outils EmailToolbar offre :
- Mise en forme : Gras, Italique, Souligne, Barre
- Listes : A puces, Numerotees
- Alignement : Gauche, Centre, Droite
- Insertion : Liens, Images
- Variables : Menu deroulant pour inserer `{{prenom}}`, `{{email}}`, `{{nom}}`, `{{company}}`

### Variables dynamiques
Les variables sont inserees avec la syntaxe `{{variable}}` et remplacees automatiquement :
- `{{prenom}}` : Prenom du client
- `{{email}}` : Adresse email du client
- `{{nom}}` : Nom de famille
- `{{company}}` : Nom de l'entreprise

### Version texte
En bas de l'editeur, une section pliable permet de definir une **version texte brut** de l'email.
Cette version est utilisee par les clients email qui n'affichent pas le HTML.

### Statistiques post-envoi
Apres l'envoi, la campagne affiche des metriques en temps reel :

| Metrique | Description |
|----------|-------------|
| **Envoyes** | Nombre d'emails expedies |
| **Ouverts** | Nombre de destinataires ayant ouvert l'email |
| **Cliques** | Nombre de clics sur les liens |
| **Rebondis** | Nombre d'emails non delivres |
| **Revenus** | Revenus generes par la campagne (suivi des conversions) |

### Confirmation d'envoi
Avant chaque envoi, une boite de dialogue demande confirmation. Cette precaution empeche
les envois accidentels.

---

## Workflows courants

### Workflow 1 : Creer et envoyer une campagne promotionnelle
1. Cliquez sur **Nouvelle campagne** pour creer un brouillon.
2. Dans l'editeur, modifiez le **nom** (ex: "Promo printemps 2026").
3. Definissez l'**objet** (ex: "20% sur les peptides cette semaine!").
4. Composez le contenu en mode visuel, en utilisant les variables pour personnaliser.
5. Cliquez sur **Apercu** pour verifier le rendu.
6. Cliquez sur **Sauvegarder** puis **Envoyer**.
7. Confirmez l'envoi dans la boite de dialogue.

### Workflow 2 : Analyser les performances d'une campagne
1. Dans la liste des campagnes, trouvez une campagne avec le statut **Envoyee**.
2. Consultez les statistiques affichees directement sur la carte (envoyes, ouverts, cliques,
   rebondis, revenus).
3. Cliquez sur l'icone graphique pour des metriques plus detaillees.
4. Comparez avec vos benchmarks (taux d'ouverture cible > 20%, taux de clic > 3%).

### Workflow 3 : Dupliquer et adapter une campagne
1. Creez une nouvelle campagne.
2. Dans l'editeur en mode code, copiez le HTML d'une campagne precedente.
3. Adaptez le contenu (objet, texte, variables).
4. Verifiez via l'apercu et envoyez.

---

## FAQ

**Q : Puis-je planifier une campagne pour un envoi futur ?**
R : Oui, le champ de planification permet de definir une date et heure d'envoi automatique.

**Q : A qui est envoyee la campagne ?**
R : Par defaut, la campagne est envoyee a la liste de diffusion (mailing list). Vous pouvez
definir un segment specifique via les criteres de segmentation.

**Q : Puis-je annuler une campagne en cours d'envoi ?**
R : Les campagnes en statut **Brouillon** ou **Planifiee** peuvent etre annulees. Une fois
l'envoi commence, il ne peut pas etre interrompu.

**Q : Comment eviter le spam ?**
R : Koraline integre la conformite CASL (loi anti-pourriel canadienne). Chaque email
inclut un lien de desabonnement et respecte les preferences des destinataires.

---

## Strategie expert : calendrier email annuel pour BioCycle Peptides

### Planification sur 12 mois

Un calendrier email structure garantit une communication reguliere sans submerger vos abonnes. Prevoyez 2 a 3 emails par mois minimum : 1 newsletter educative, 1 promotion, et 1 email de contenu (blog, guide, actualite).

| Mois | Theme principal | Type de campagne | Objet email suggere |
|------|----------------|-----------------|---------------------|
| **Janvier** | Resolutions sante / Bien-etre | Promotion -15% peptides reparation | "Nouvelle annee, nouvelle recherche : 15% sur les peptides reparation" |
| **Fevrier** | Guides pour debutants | Contenu educatif | "Votre premier peptide : le guide complet de reconstitution" |
| **Mars** | Printemps / Renouveau | Flash sale 48h | "Flash Sale Printemps : 48h pour economiser 20%" |
| **Avril** | Nouveaux produits | Lancement produit | "Nouveau : [peptide] maintenant disponible chez BioCycle" |
| **Mai** | Temoignages / Etudes | Social proof + contenu | "Ce que les chercheurs disent du BPC-157 en 2026" |
| **Juin** | Ete fitness | Bundle promotion | "Summer Stack : BPC-157 + TB-500 a -20%" |
| **Juillet** | Soldes mi-annee | Promotion generale | "Soldes d'ete : jusqu'a 25% sur tout le catalogue" |
| **Aout** | Rentree labos | Campagne B2B | "Labos et universites : votre tarif recherche rentre en vigueur" |
| **Septembre** | Immunitaire / Automne | Contenu + promotion | "Preparez votre recherche automnale : focus peptides immunitaires" |
| **Octobre** | Pre-Black Friday | Teaser + liste VIP | "Black Friday arrive : inscrivez-vous pour un acces anticipe" |
| **Novembre** | Black Friday / Cyber Monday | Promotion majeure | "BLACK FRIDAY : -25% sur TOUT - 4 jours seulement" |
| **Decembre** | Coffrets / Fin d'annee | Coffrets cadeaux + bilan | "Coffret Starter Research Kit : l'idee cadeau parfaite" |

### Conformite CASL : rappel essentiel pour chaque campagne

Avant chaque envoi de campagne, verifiez ces 5 points :

1. **Consentement valide** : Chaque destinataire a donne son consentement explicite (opt-in actif) ou implicite (achat < 2 ans, demande < 6 mois)
2. **Identification** : Le nom de BioCycle Peptides et l'adresse postale physique apparaissent dans l'email
3. **Desabonnement** : Le lien de desabonnement est visible, fonctionnel et gratuit
4. **Objet non trompeur** : L'objet de l'email decrit fidelement le contenu (pas de fausses urgences ou de sujets misleading)
5. **Registre a jour** : Les desabonnements recents ont ete traites (Koraline le fait automatiquement, mais verifiez si vous importez des listes externes)

**Penalites** : Jusqu'a 10 000 000 $CA par infraction pour les entreprises. Le CRTC audite activement les e-commerces canadiens.

### A/B testing : guide pratique

Le A/B testing est la methode la plus fiable pour ameliorer vos performances email. Testez UN SEUL element a la fois pour des resultats mesurables.

**Elements a tester par ordre d'impact** :

| Element | Impact potentiel | Exemple de test |
|---------|-----------------|-----------------|
| **Objet** | +20 a +50% taux d'ouverture | "20% de rabais sur les peptides" vs "Votre code exclusif : PEPTIDE20" |
| **Heure d'envoi** | +10 a +25% taux d'ouverture | Mardi 10h vs Jeudi 14h |
| **CTA (appel a l'action)** | +15 a +30% taux de clic | "Magasiner" vs "Voir les offres" vs "Profitez maintenant" |
| **Personnalisation** | +10 a +20% taux d'ouverture | "Offre speciale" vs "{{prenom}}, offre speciale pour vous" |
| **Longueur** | +5 a +15% taux de clic | Email court (3 paragraphes) vs email long (8 paragraphes) |

**Protocole de test** :
1. Definissez l'hypothese : "Un objet avec le prenom augmente le taux d'ouverture"
2. Creez 2 variantes identiques sauf l'element teste
3. Envoyez a 20% de votre liste (10% variante A, 10% variante B)
4. Attendez 2 a 4 heures (Koraline le fait automatiquement)
5. Envoyez la variante gagnante aux 80% restants
6. Documentez le resultat pour vos prochaines campagnes

**Heures d'envoi optimales pour le marche canadien** :
- **B2C** : Mardi et jeudi, 10h-11h EST (meilleur taux d'ouverture)
- **B2B** : Mardi et mercredi, 8h-9h EST (avant les reunions)
- **Weekend** : Samedi 9h-10h EST (moins de concurrence dans la boite de reception, mais volume plus faible)

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Campagne** | Envoi en masse d'un email a une liste de destinataires |
| **WYSIWYG** | Editeur visuel "What You See Is What You Get" |
| **Taux d'ouverture** | Pourcentage de destinataires ayant ouvert l'email |
| **Taux de clic** | Pourcentage de destinataires ayant clique sur un lien |
| **Rebond (bounce)** | Email non delivre au destinataire |
| **CASL** | Canadian Anti-Spam Legislation, loi federale canadienne sur les courriels |
| **Segmentation** | Ciblage d'un sous-ensemble de destinataires selon des criteres |

---

## Pages associees

- [Templates](./04-templates.md) : Creer des modeles reutilisables pour les campagnes
- [Flows](./06-flows.md) : Automatiser l'envoi d'emails bases sur des evenements
- [Analytics emails](./07-analytics.md) : Tableau de bord complet des metriques
- [Boite de reception](./01-inbox.md) : Gerer les reponses des clients
