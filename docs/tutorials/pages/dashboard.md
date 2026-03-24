# Tableau de bord - Tutoriel

## Resume
Le tableau de bord est la page d'accueil de l'interface admin Suite Kor@line / BioCycle Peptides. Il offre une vue d'ensemble complete de l'activite de la boutique avec des KPIs en temps reel, des insights IA, et des raccourcis vers les actions principales.

**Utilisateurs cibles**: Tous les administrateurs (OWNER, EMPLOYEE)
**Prerequis**: Etre connecte avec un compte admin
**URL**: `/admin/dashboard`

## Comment ca fonctionne
Le dashboard charge automatiquement les donnees depuis plusieurs APIs:
- Statistiques commandes et revenus (API dashboard)
- Cross-module overview (CRM, Comptabilite, Fidelite, Marketing, Telephonie)
- Insights IA generes par Claude (analyses et recommandations)
- Commandes recentes et inscriptions recentes

Les KPIs se rafraichissent a chaque visite. Le bouton "Actualiser" force un rechargement.

## Guide etape par etape
1. **Consulter les KPIs principaux**: En haut, 4 cartes montrent Commandes totales, Revenu du mois (CAD), Commandes en attente, Alertes stock
2. **Voir les metriques secondaires**: Clients B2B, Clients, Produits actifs
3. **Obtenir le Briefing IA**: Cliquer "Obtenir le Briefing" pour les priorites quotidiennes generees par IA
4. **Consulter les Insights IA**: Section avec analyse detaillee et recommandations
5. **Vue inter-modules**: En bas, apercu rapide CRM, Comptabilite, Fidelite, Marketing, Telephonie avec liens directs
6. **Commandes recentes**: Tableau des dernieres commandes avec lien "Voir tout"
7. **Inscriptions recentes**: Tableau des derniers clients inscrits
8. **Actions rapides**: Boutons "Commandes" et "Nouveau produit" en haut a droite
9. **Exporter**: Bouton "Exporter tableau de bord" pour telecharger les donnees

## Fonctionnalites connexes
- [Commandes](/admin/commandes) - Gestion des commandes
- [Produits](/admin/produits) - Catalogue produits
- [Inventaire](/admin/inventaire) - Gestion des stocks
- [CRM Pipeline](/admin/crm/pipeline) - Pipeline commercial
- [Comptabilite](/admin/comptabilite/ecritures) - Ecritures comptables
- [Fidelite](/admin/fidelite) - Programme de fidelite

## Conseils & bonnes pratiques
- Consultez le briefing IA chaque matin pour prioriser vos actions
- Les cartes KPI sont cliquables et menent directement a la section concernee
- Le widget telephonie en bas a gauche permet de passer des appels sans quitter le dashboard

## Limitations connues
- Les donnees sont en temps reel mais ne se rafraichissent pas automatiquement (cliquer "Actualiser")
- Les Insights IA necessitent des donnees dans la base pour etre pertinents

## Endpoints API utilises
- `GET /api/admin/ai/insights?locale=fr` - Insights IA
- `GET /api/admin/dashboard/cross-module` - Vue inter-modules
- `GET /api/admin/voip/health` - Sante telephonie
- `GET /api/admin/chats/recent` - Chats recents
- `GET /api/admin/nav-sections/by-rail/dashboard` - Navigation

## Notes techniques
- **Render mode**: Server Component avec client hydration
- **Composants principaux**: DashboardPage, AdminLayout, OutlookNav
- **Modeles Prisma**: Order, User, Product, JournalEntry, LoyaltyMember, PromoCode
- **Score audit**: 100/100 (A) - 0 erreurs console, 0 erreurs reseau
