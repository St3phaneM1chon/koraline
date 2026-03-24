# Customers (Clients B2C) - Tutoriel

## Resume
La page Customers gere les acheteurs finaux (role CUSTOMER) de la boutique BioCycle Peptides. Elle offre une vue complete des clients avec segmentation RFM (Recency, Frequency, Monetary), identification VIP par CLV (Customer Lifetime Value), programme de fidelite multi-paliers, et indicateurs Surprise & Delight pour les meilleurs clients.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/customers`

## Comment ca fonctionne
La page utilise le composant generique `ContactListPage` configure via `customerConfig`. Au chargement, elle recupere tous les utilisateurs avec le role CUSTOMER via l'API, puis calcule en temps reel le score RFM de chaque client. Les 5 meilleurs clients par CLV sont affiches dans un panneau VIP doree en haut de la page, avec leur segment RFM et leur montant total depense.

Le panneau principal affiche la liste des clients dans un layout Outlook (liste + detail). Chaque client montre son palier de fidelite (Bronze, Silver, Gold, Platinum, Diamond) et son segment RFM (Champions, Loyaux, A risque, Perdus, etc.). Le detail d'un client affiche ses informations de contact, ses statistiques de fidelite, son code de referral, sa segmentation RFM detaillee avec action suggeree, ses indicateurs Surprise & Delight (anniversaire, anciennete, surprise aleatoire), et son parcours client simplifie.

Les KPIs affichent le total des clients, les revenus totaux en CAD, le panier moyen, et le nombre de VIP Gold+.

## Guide etape par etape
1. **Consulter les KPIs**: 4 cartes en haut - Total clients, Revenus totaux (CAD), Panier moyen, VIP Gold+
2. **Voir le panneau VIP**: Le panneau doree en haut montre les 5 meilleurs clients par CLV avec leur segment RFM
3. **Voir la repartition RFM**: Sous les VIP, les badges colores montrent la distribution des segments RFM de toute la base
4. **Filtrer par palier de fidelite**: Onglets Bronze, Silver, Gold, Platinum, Diamond pour filtrer la liste
5. **Rechercher un client**: Taper un nom ou email dans la barre de recherche
6. **Selectionner un client**: Cliquer sur un client pour voir son detail complet
7. **Consulter le segment RFM**: Section coloree montrant le segment, le score R/F/M detaille et l'action suggeree
8. **Voir les indicateurs Surprise & Delight**: Pour les VIP, badges Anniversaire, Anciennete, Surprise aleatoire
9. **Voir le parcours client**: Frise chronologique simplifiee (inscription, commandes, points)
10. **Acceder au profil complet**: Bouton "Voir le profil" pour aller sur `/admin/customers/{id}`
11. **Exporter en CSV**: Action ribbon "Exporter" pour telecharger la liste complete (nom, email, palier, points, depenses, code referral, date inscription)

## Fonctionnalites connexes
- [Tableau de bord](/admin/dashboard) - Inscriptions recentes
- [Commandes](/admin/commandes) - Commandes par client
- [Fidelite](/admin/fidelite) - Programme de fidelite complet
- [Clients B2B](/admin/clients) - Distributeurs et employes
- [Ambassadeurs](/admin/ambassadeurs) - Programme ambassadeur

## Conseils & bonnes pratiques
- Consultez regulierement les clients "A risque" ou "Perdus" dans la segmentation RFM pour lancer des campagnes de reactivation
- Les clients VIP Gold+ sont eligibles aux surprises : pensez a activer les mecanismes de Surprise & Delight
- Utilisez l'export CSV pour des analyses avancees ou des imports dans des outils marketing
- Le panier moyen est un bon indicateur de la sante commerciale : suivez son evolution

## Limitations connues
- Les scores RFM sont calcules cote client a chaque chargement (pas de cache serveur)
- Le parcours client est une approximation basee sur la date d'inscription et le nombre de commandes
- L'export CSV ne contient pas l'historique des commandes individuelles

## Endpoints API utilises
- `GET /api/admin/users?role=CUSTOMER` - Liste des clients avec statistiques
- `GET /api/admin/users/:id` - Detail d'un client specifique

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: ContactListPage (generique), MobileSplitLayout, ContentList, DetailPane
- **Config**: `src/app/admin/customers/config.ts` definit les KPIs, filtres, colonnes et sections de detail
- **Modeles Prisma**: User (role=CUSTOMER), Order (via _count.purchases)
- **Librairies**: `calculateRFMScore` et `RFM_SEGMENTS` de `@/lib/analytics/rfm-engine`
- **Score audit**: 90/100 (A)
- **Erreurs trouvees**: Aucune erreur bloquante
