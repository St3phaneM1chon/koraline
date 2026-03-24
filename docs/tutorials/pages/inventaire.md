# Inventaire - Tutoriel

## Resume
La page Inventaire est un outil complet de gestion des stocks avec 4 onglets specialises : Stock (niveaux par format de produit), Fournisseurs (gestion simplifiee), Bons de commande (purchase orders), et Reconciliation. Elle offre une vue consolidee de la valeur du stock, des alertes de rupture, et des actions de reapprovisionnement.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/inventaire`

## Comment ca fonctionne
L'onglet Stock est le coeur de la page. Il charge tous les formats de produits via l'API inventaire et les affiche dans un layout Outlook (liste + detail). Chaque format montre son SKU, sa quantite en stock, son seuil d'alerte, et sa disponibilite. Les KPIs aggregent le total des produits, ceux en stock, en stock bas, en rupture, et la valeur totale du stock.

L'onglet Fournisseurs (simplifie) permet de creer et visualiser les fournisseurs directement dans la page inventaire. L'onglet Bons de commande gere le cycle de vie des commandes fournisseurs (DRAFT, ORDERED, PARTIAL, RECEIVED, CANCELLED). L'onglet Reconciliation permet de comparer les niveaux de stock theoriques avec les comptages physiques.

Le detail d'un format de produit permet de modifier la quantite en stock directement, avec un historique des mouvements de stock. Les actions du ribbon incluent le reapprovisionnement, le transfert, les statistiques, les alertes, et l'import/export CSV.

## Guide etape par etape
1. **Consulter les KPIs**: 5 cartes - Total produits, En stock, Stock bas, Rupture, Valeur du stock (CAD)
2. **Naviguer entre les onglets**: Stock | Fournisseurs | Bons de commande | Reconciliation
3. **Filtrer le stock**: Onglets Tous, En stock, Stock bas, Rupture
4. **Rechercher un produit**: Taper le nom, SKU ou format dans la barre de recherche
5. **Selectionner un format**: Cliquer pour voir le detail (quantite, seuil, prix, disponibilite, historique)
6. **Modifier la quantite**: Editer directement la quantite en stock dans le panneau de detail
7. **Ajouter un fournisseur**: Dans l'onglet Fournisseurs, bouton "Add Supplier" pour creer un fournisseur avec nom, contact, email, telephone, adresse, site web, notes
8. **Creer un bon de commande**: Dans l'onglet Bons de commande, creer un PO avec fournisseur, articles, quantites et couts
9. **Reapprovisionner**: Action ribbon pour lancer un reapprovisionnement
10. **Importer du stock**: Action ribbon "Importer CSV" pour mise a jour en masse
11. **Exporter**: Action ribbon "Exporter" pour telecharger l'inventaire complet en CSV
12. **Configurer les alertes**: Action ribbon "Alertes" pour definir les seuils de notification

## Fonctionnalites connexes
- [Produits](/admin/produits) - Catalogue des produits (chaque produit a des formats avec stock)
- [Fournisseurs](/admin/fournisseurs) - Gestion avancee des fournisseurs (page dediee)
- [Commandes](/admin/commandes) - Les commandes impactent le stock
- [Tableau de bord](/admin/dashboard) - Alertes stock dans les KPIs

## Conseils & bonnes pratiques
- Verifiez les alertes de stock bas chaque matin pour anticiper les ruptures
- Utilisez les bons de commande pour tracer les approvisionnements et calculer les couts
- La reconciliation periodique (mensuelle) permet de detecter les ecarts entre stock theorique et physique
- Exportez regulierement pour avoir un backup des niveaux de stock
- Les produits phares comme BPC-157 doivent avoir un seuil d'alerte plus eleve

## Limitations connues
- Certains labels sont en anglais et non traduits (ex: "Add Supplier", "Supplier name is required", "Supplier created")
- L'onglet Fournisseurs est une version simplifiee ; pour la gestion complete, utiliser `/admin/fournisseurs`
- La reconciliation est basique et ne gere pas encore les comptages par emplacement

## Endpoints API utilises
- `GET /api/admin/inventory` - Liste des formats de produits avec niveaux de stock
- `PATCH /api/admin/inventory/:id` - Mise a jour de la quantite en stock
- `GET /api/admin/inventory/suppliers` - Liste des fournisseurs (simplifie)
- `POST /api/admin/inventory/suppliers` - Creation d'un fournisseur
- `GET /api/admin/inventory/purchase-orders` - Liste des bons de commande
- `POST /api/admin/inventory/purchase-orders` - Creation d'un bon de commande

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: MobileSplitLayout, ContentList, DetailPane, StatCard, SuppliersTab (sous-composant)
- **Types**: ProductFormat, Supplier, PurchaseOrder, InventoryTab (`stock | suppliers | purchase-orders | reconciliation`)
- **Modeles Prisma**: ProductFormat, Supplier, PurchaseOrder
- **Librairies**: `fetchWithRetry` pour les appels API resilients, `addCSRFHeader` pour la securite
- **Score audit**: 85/100 (B)
- **Erreurs trouvees**: Labels non traduits dans l'onglet Fournisseurs et les messages toast
