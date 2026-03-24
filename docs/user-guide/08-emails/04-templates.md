# Templates d'email

> **Section**: Emails > Templates

---

## Concepts pour debutants

Les **templates d'email** (modeles) sont des gabarits reutilisables qui permettent de creer
rapidement des emails professionnels sans repartir de zero a chaque fois. Dans Koraline, le
constructeur de templates fonctionne par **blocs** : vous assemblez visuellement des elements
(en-tete, texte, image, grille de produits, bouton d'action, separateur) pour composer votre email.

Chaque template peut contenir des **variables dynamiques** (comme `{{prenom}}`, `{{email}}`,
`{{nom}}`) qui seront remplacees automatiquement par les donnees du destinataire lors de l'envoi.
Cela permet de personnaliser les emails a grande echelle.

Les templates servent de base aux campagnes email, aux flows automatises, et aux reponses rapides
de l'equipe. Un bon jeu de templates reduit considerablement le temps de preparation des
communications.

---

## Comment y acceder

1. Dans le panneau d'administration, cliquez sur l'icone **Emails** dans la barre laterale gauche.
2. Dans le panneau de navigation, sous **Gestion**, cliquez sur **Templates**.
3. L'URL directe est : `/admin/emails?tab=templates`

---

## Apercu de l'interface

### Liste des templates
L'interface principale affiche tous les templates existants sous forme de cartes ou de tableau.
Chaque template affiche :
- **Nom** du template (ex: "welcome-new-customer")
- **Objet** de l'email
- **Date de creation** et de derniere modification
- **Apercu** visuel du rendu

### Bouton "Nouveau template"
En haut a droite, un bouton permet de creer un nouveau template.

### Constructeur de template (Template Builder)
Le constructeur se divise en trois zones :

1. **Palette de blocs** (gauche) : Liste des types de blocs disponibles
2. **Canevas** (centre) : Zone de composition ou les blocs sont empiles
3. **Panneau de proprietes** (droite) : Options de configuration du bloc selectionne

---

## Fonctions detaillees

### Types de blocs disponibles

| Bloc | Description | Utilisation typique |
|------|-------------|---------------------|
| **En-tete** | Titre avec alignement configurable | Titre principal de l'email |
| **Texte** | Paragraphe de texte libre | Corps du message, explications |
| **Image** | Image avec URL, texte alternatif et largeur | Banniere, photo de produit |
| **Grille produits** | Grille de 1 a 8 produits | Recommandations, nouveautes |
| **Bouton CTA** | Bouton d'appel a l'action colore | "Acheter maintenant", "Voir les produits" |
| **Separateur** | Ligne horizontale de separation | Organisation visuelle |

### Manipulation des blocs
- **Ajouter** : Cliquez sur un type de bloc dans la palette pour l'ajouter en bas du canevas
- **Selectionner** : Cliquez sur un bloc dans le canevas pour le selectionner
- **Deplacer** : Utilisez les fleches haut/bas pour reordonner les blocs
- **Supprimer** : Cliquez sur l'icone corbeille a gauche du bloc
- **Configurer** : Modifiez les proprietes dans le panneau de droite

### Variables dynamiques
Inserez des variables dans le texte avec la syntaxe `{{nomVariable}}` :
- `{{prenom}}` ou `{{firstName}}` : Prenom du destinataire
- `{{nom}}` : Nom de famille
- `{{email}}` : Adresse email
- `{{company}}` : Nom de l'entreprise

Le systeme detecte automatiquement les variables utilisees et les affiche lors de la sauvegarde.

### Mode apercu
Cliquez sur le bouton **Apercu** pour visualiser le rendu final de l'email tel qu'il apparaitra
dans la boite de reception du destinataire. Le mode apercu montre le HTML compile.

### Sauvegarde
- **Nouveau template** : Renseignez le nom et l'objet, puis cliquez sur **Sauvegarder**
- **Template existant** : Cliquez sur **Mettre a jour** pour enregistrer les modifications

Le contenu est compile en HTML compatible email (tables, styles inline) et le JSON des blocs
est conserve pour permettre l'edition ulterieure.

---

## Workflows courants

### Workflow 1 : Creer un template de bienvenue
1. Cliquez sur **Nouveau template**.
2. Nommez-le "welcome-new-customer" et definissez l'objet "Bienvenue chez BioCycle Peptides!".
3. Ajoutez un bloc **En-tete** avec le texte "BioCycle Peptides".
4. Ajoutez un bloc **Texte** avec : "Bonjour {{prenom}}, Decouvrez nos peptides de qualite pharmaceutique!"
5. Ajoutez un bloc **Grille produits** pour montrer 4 produits recommandes.
6. Ajoutez un bloc **Bouton CTA** "Voir les produits" pointant vers biocyclepeptides.com/products.
7. Cliquez sur **Sauvegarder**.

### Workflow 2 : Modifier un template existant
1. Dans la liste des templates, cliquez sur celui a modifier.
2. Le constructeur s'ouvre avec les blocs existants pre-charges.
3. Ajoutez, supprimez ou modifiez les blocs selon vos besoins.
4. Verifiez le rendu via le bouton **Apercu**.
5. Cliquez sur **Mettre a jour**.

### Workflow 3 : Utiliser un template dans une campagne
1. Creez un template avec le contenu souhaite.
2. Allez dans **Campagnes** et creez une nouvelle campagne.
3. Dans l'editeur de campagne, selectionnez le template comme base.
4. Personnalisez si necessaire, puis envoyez.

---

## FAQ

**Q : Les templates supportent-ils le HTML personnalise ?**
R : Le constructeur genere du HTML compatible email automatiquement. Pour un controle total,
l'editeur de campagne offre un mode **Code** pour editer le HTML directement.

**Q : Comment tester un template avant de l'utiliser ?**
R : Utilisez le mode **Apercu** dans le constructeur. Pour un test reel, creez une campagne
de test avec votre propre adresse email comme destinataire.

**Q : Les images sont-elles hebergees par Koraline ?**
R : Non, vous devez fournir l'URL de l'image. Utilisez la mediatheque de Koraline ou un CDN
pour heberger vos images.

**Q : Combien de templates puis-je creer ?**
R : Il n'y a pas de limite au nombre de templates.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **Template** | Modele d'email reutilisable compose de blocs |
| **Bloc** | Element de base du template (texte, image, bouton, etc.) |
| **Variable dynamique** | Placeholder remplace par les donnees du destinataire lors de l'envoi |
| **CTA (Call-to-Action)** | Bouton incitant le destinataire a effectuer une action |
| **Canevas** | Zone centrale du constructeur ou les blocs sont assembles |
| **HTML compatible email** | Code HTML utilisant des tables et styles inline pour un affichage uniforme |

---

## Pages associees

- [Campagnes](./05-campagnes.md) : Utiliser les templates dans des envois en masse
- [Flows](./06-flows.md) : Integrer les templates dans des sequences automatisees
- [Boite de reception](./01-inbox.md) : Gerer les reponses aux emails envoyes
