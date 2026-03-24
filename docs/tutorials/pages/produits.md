# Produits - Tutoriel

## Resume
La page Produits est le gestionnaire du catalogue de la boutique BioCycle Peptides. Elle permet de visualiser, creer, modifier, dupliquer, publier/depublier les produits. Les produits sont classes par type (Peptides, Supplements, Accessoires) et par categorie, avec une vue liste ou grille.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/produits`

## Comment ca fonctionne
La page est un Server Component qui charge les produits et categories depuis Prisma au rendu serveur, puis passe les donnees au composant client `ProductsListClient`. Les produits incluent leur categorie et leurs formats (variantes avec prix, stock et disponibilite).

Les statistiques sont calculees cote serveur : total des produits, actifs, peptides, supplements, accessoires, et mis en avant. La liste client offre un toggle vue liste/grille, un filtre par categorie via dropdown, une recherche textuelle, et des actions groupees via le ribbon.

Le ribbon supporte 11 actions : Nouveau produit (redirige vers `/admin/produits/nouveau`), Supprimer, Dupliquer, Publier, Depublier, Filtrer par categorie, Mise a jour prix en masse, Pages populaires, PDF Catalogue, Import CSV, Export. Chaque produit dans la liste affiche son nom, sa categorie, son type, ses formats avec prix et niveaux de stock.

## Guide etape par etape
1. **Consulter les KPIs**: 4 cartes - Total produits, Peptides, Supplements, Accessoires
2. **Basculer la vue**: Toggle liste/grille pour changer le mode d'affichage
3. **Filtrer par categorie**: Dropdown pour selectionner une categorie specifique
4. **Rechercher**: Taper le nom ou SKU d'un produit
5. **Creer un produit**: Bouton "Nouveau produit" ou action ribbon redirige vers `/admin/produits/nouveau`
6. **Modifier un produit**: Cliquer sur un produit pour acceder a sa page d'edition (`/admin/produits/{id}`)
7. **Dupliquer**: Selectionner un produit puis action ribbon "Dupliquer" pour creer une copie
8. **Publier/Depublier**: Actions ribbon pour changer la visibilite d'un produit sur la boutique
9. **Mise a jour prix en masse**: Action ribbon "Bulk Price" pour ajuster les prix de plusieurs produits
10. **Generer le PDF catalogue**: Action ribbon "PDF Catalogue" pour creer un document imprimable
11. **Importer des produits**: Action ribbon "Import CSV" pour ajouter des produits en masse
12. **Exporter**: Action ribbon "Exporter" pour telecharger le catalogue en CSV

## Fonctionnalites connexes
- [Categories](/admin/categories) - Gestion de l'arborescence des categories
- [Bundles](/admin/bundles) - Lots de produits
- [Inventaire](/admin/inventaire) - Niveaux de stock par format
- [Commandes](/admin/commandes) - Produits commandes
- [Fournisseurs](/admin/fournisseurs) - Fournisseurs des produits

## Conseils & bonnes pratiques
- Chaque produit doit avoir au moins un format avec un prix et un niveau de stock
- Utilisez les categories pour organiser le catalogue et faciliter la navigation client
- Le produit BPC-157 est un produit phare : verifiez regulierement son stock et sa visibilite
- La duplication est utile pour creer des variantes similaires rapidement
- Depubliez un produit plutot que de le supprimer pour conserver l'historique des commandes

## Limitations connues
- La page est un Server Component : les donnees sont chargees au rendu serveur (pas de rafraichissement en temps reel sans rechargement)
- Le PDF Catalogue est genere cote client et peut etre lent pour un catalogue volumineux
- L'import CSV necessite un format specifique (voir documentation import)

## Endpoints API utilises
- Chargement initial via Prisma directement (Server Component) :
  - `prisma.product.findMany` avec include category et formats
  - `prisma.category.findMany` pour le filtre
- `POST /api/admin/products` - Creation de produit
- `PATCH /api/admin/products/:id` - Modification (publier, depublier, prix)
- `DELETE /api/admin/products/:id` - Suppression
- `POST /api/admin/products/:id/duplicate` - Duplication

## Notes techniques
- **Render mode**: Server Component (page.tsx) + Client Component (ProductsListClient.tsx)
- **Composants principaux**: ProductsListClient, PageHeader
- **Config serveur**: Authentification via `auth()`, verification role EMPLOYEE/OWNER
- **Modeles Prisma**: Product (avec category, formats), Category, ProductFormat
- **Metadata**: Titre "Gestion des produits | Admin"
- **Prop `isOwner`**: Les proprietaires ont des actions supplementaires (suppression, etc.)
- **Score audit**: 85/100 (B)
- **Erreurs trouvees**: Aucune erreur bloquante majeure
