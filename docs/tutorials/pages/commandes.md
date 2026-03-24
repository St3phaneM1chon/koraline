# Commandes - Tutoriel

## Resume
La page Commandes est le centre nevralgique de la gestion des commandes e-commerce. Elle permet de visualiser, filtrer, traiter et expedier toutes les commandes clients, avec des KPIs en temps reel, une detection de fraude integree, un systeme de tags automatiques, et des ponts inter-modules (comptabilite, fidelite, marketing, emails, telephonie, CRM).

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/commandes`

## Comment ca fonctionne
La page charge les commandes via l'API `/api/admin/orders` avec pagination et filtrage. L'interface utilise un layout Outlook (liste + detail) : la liste a gauche affiche les commandes groupees par date, et le panneau de detail a droite montre toutes les informations d'une commande selectionnee.

Chaque commande est enrichie automatiquement : evaluation du risque de fraude (via `assessFraudRisk`), tags automatiques (via `autoTagOrder` avec les regles DEFAULT_TAG_RULES), timeline des evenements, et ponts vers les modules comptabilite, fidelite, marketing, emails, telephonie et CRM. Le panneau de detail affiche les articles commandes, l'adresse de livraison, les informations de paiement, les notes (client et admin), les ecritures comptables liees, les points de fidelite, les promotions appliquees, les emails envoyes et les appels telephoniques lies.

Les KPIs en haut de page montrent le nombre total de commandes, celles en attente, en traitement, expediees et livrees. Un systeme de filtrage par onglets permet de basculer rapidement entre les statuts.

## Guide etape par etape
1. **Consulter les KPIs**: En haut, 5 cartes statistiques affichent Total commandes, En attente (PENDING), En traitement (PROCESSING), Expediees (SHIPPED), Livrees (DELIVERED)
2. **Filtrer par statut**: Utiliser les onglets au-dessus de la liste pour filtrer par statut (Toutes, En attente, Confirmees, En traitement, Expediees, Livrees, Annulees)
3. **Rechercher une commande**: Taper un numero de commande, nom client ou email dans la barre de recherche
4. **Selectionner une commande**: Cliquer sur une commande dans la liste pour afficher son detail complet
5. **Modifier le statut**: Dans le detail, utiliser le selecteur de statut pour changer l'etat (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
6. **Ajouter un numero de suivi**: Renseigner le transporteur et le numero de tracking dans la section livraison
7. **Gerer les notes**: Consulter les notes client et ajouter des notes admin via la section Notes
8. **Consulter la fraude**: Le badge de risque (Low/Medium/High/Critical) s'affiche automatiquement avec les indicateurs de fraude
9. **Voir la timeline**: L'historique chronologique de la commande s'affiche avec tous les evenements
10. **Actions du ribbon**: Utiliser les boutons Nouvelle commande, Supprimer, Imprimer, Marquer expedie, Rembourser, Exporter
11. **Exporter en CSV**: Le bouton Exporter genere un fichier CSV avec toutes les commandes

## Fonctionnalites connexes
- [Tableau de bord](/admin/dashboard) - Vue d'ensemble avec commandes recentes
- [Produits](/admin/produits) - Catalogue des produits commandes
- [Inventaire](/admin/inventaire) - Impact sur le stock
- [Customers](/admin/customers) - Profils des clients ayant commande
- [Paiements - Reconciliation](/admin/paiements/reconciliation) - Rapprochement Stripe
- [Comptabilite](/admin/comptabilite/ecritures) - Ecritures comptables liees
- [Fidelite](/admin/fidelite) - Points gagnes/utilises par commande
- [CRM Pipeline](/admin/crm/pipeline) - Deals associes aux commandes

## Conseils & bonnes pratiques
- Consultez les commandes en attente (PENDING) en priorite chaque matin
- Verifiez le score de fraude avant d'expedier les commandes de montant eleve
- Utilisez les notes admin pour documenter les communications avec le client
- Imprimez le bon de commande avant d'emballer pour verification
- Renseignez toujours le numero de suivi pour que le client soit notifie

## Limitations connues
- 1 erreur d'hydration detectee lors de l'audit, corrigee en supprimant l'import winston de `fetch-with-retry.ts`
- La creation de nouvelle commande via le ribbon affiche un message informatif (les commandes sont creees cote boutique)
- Le remboursement via le ribbon redirige vers Stripe pour le traitement effectif

## Endpoints API utilises
- `GET /api/admin/orders` - Liste des commandes avec pagination et filtres
- `PATCH /api/admin/orders/:id` - Mise a jour du statut, tracking, notes
- `DELETE /api/admin/orders/:id` - Suppression d'une commande
- `GET /api/admin/orders/:id/timeline` - Timeline des evenements
- `GET /api/admin/orders/:id/notes` - Notes client et admin
- `PATCH /api/admin/orders/:id/notes` - Mise a jour des notes
- `GET /api/admin/orders/:id/bridge/accounting` - Pont comptabilite
- `GET /api/admin/orders/:id/bridge/loyalty` - Pont fidelite
- `GET /api/admin/orders/:id/bridge/marketing` - Pont marketing
- `GET /api/admin/orders/:id/bridge/emails` - Pont emails
- `GET /api/admin/orders/:id/bridge/calls` - Pont telephonie
- `GET /api/admin/orders/:id/bridge/deals` - Pont CRM
- `GET /api/admin/orders/:id/bridge/products` - Pont catalogue
- `GET /api/admin/orders/:id/bridge/reviews` - Pont communaute

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: MobileSplitLayout, ContentList, DetailPane, OrderTimeline, PaymentStatusBadge, StatCard
- **Modeles Prisma**: Order, OrderItem, User, CreditNote, PaymentError
- **Librairies**: `assessFraudRisk` (detection fraude), `autoTagOrder` (tags automatiques), `addCSRFHeader` (securite CSRF)
- **Score audit**: 95/100 (A)
- **Erreurs trouvees**: 1 erreur d'hydration (import winston dans fetch-with-retry.ts, corrige)
