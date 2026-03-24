# Paiements - Reconciliation - Tutoriel

## Resume
La page Reconciliation des paiements compare les totaux de commandes avec les paiements Stripe sur une periode donnee. Elle genere un rapport detaillant les revenus bruts, les remboursements, le revenu net, le taux de correspondance Stripe, et liste les commandes sans paiement Stripe associe ("unmatched") necessitant une attention particuliere.

**Utilisateurs cibles**: Proprietaires (OWNER), comptables
**Prerequis**: Etre connecte avec un compte admin autorise, integration Stripe configuree
**URL**: `/admin/paiements/reconciliation`

## Comment ca fonctionne
La page offre un selecteur de plage de dates (par defaut les 30 derniers jours). En cliquant sur "Generate Report", elle appelle l'API de reconciliation qui compare chaque commande de la periode avec les paiements enregistres dans Stripe. Le rapport retourne un resume avec le nombre total de commandes, les revenus, les remboursements, le revenu net, les erreurs de paiement, le nombre de commandes matchees avec Stripe, et les commandes non matchees.

Le rapport affiche 7 cartes KPI, un panneau de ventilation des revenus (brut, rembourse, net), une barre de progression du taux de match Stripe, et un tableau des commandes non matchees. Si toutes les commandes sont reconciliees, un message de succes vert s'affiche. Les commandes non matchees peuvent etre exportees en CSV pour investigation.

## Guide etape par etape
1. **Definir la periode**: Selectionner la date de debut (From) et la date de fin (To) dans les selecteurs de date
2. **Generer le rapport**: Cliquer sur "Generate Report" pour lancer la reconciliation
3. **Consulter les KPIs**: 7 cartes - Total Orders, Total Revenue, Total Refunded, Net Revenue, Payment Errors, Matched (Stripe), Unmatched
4. **Voir la ventilation des revenus**: Panneau avec 3 blocs : Gross Revenue (vert), Refunded (rouge), Net Revenue (indigo)
5. **Verifier le taux de match Stripe**: Barre de progression verte montrant le pourcentage de commandes avec un paiement Stripe confirme
6. **Identifier les commandes non matchees**: Tableau listant le numero de commande, le montant, le statut de paiement et la date
7. **Exporter les non matchees**: Bouton "Export Unmatched" telecharge un CSV des commandes sans paiement Stripe
8. **Verifier le tout reconcilie**: Si 100% des commandes sont matchees, un message vert "All payments reconciled" s'affiche

## Fonctionnalites connexes
- [Commandes](/admin/commandes) - Detail des commandes individuelles
- [Comptabilite](/admin/comptabilite/ecritures) - Ecritures comptables
- [Tableau de bord](/admin/dashboard) - Vue d'ensemble des revenus

## Conseils & bonnes pratiques
- Generez le rapport de reconciliation au minimum une fois par semaine pour detecter rapidement les anomalies
- Les commandes "Unmatched" ne sont pas forcement des erreurs : certaines peuvent etre des paiements manuels ou des commandes test
- Comparez les montants du rapport avec le tableau de bord Stripe pour double verification
- Exportez et archivez les rapports mensuels pour la comptabilite

## Limitations connues
- Plusieurs labels sont en anglais et non traduits (ex: "Payment Reconciliation", "Generate Report", "From", "To", "Total Orders", "Gross Revenue", etc.)
- Le rapport ne fait pas d'appel direct a l'API Stripe en temps reel ; il se base sur les paiements enregistres en base
- Pas de planification automatique des rapports (generation manuelle uniquement)
- Le bouton "Export Unmatched" est desactive si aucune commande non matchee n'est trouvee

## Endpoints API utilises
- `GET /api/admin/payments/reconciliation?from=ISO_DATE&to=ISO_DATE` - Generation du rapport de reconciliation

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: StatCard, Button (avec icones Calendar, RefreshCw, FileDown, ArrowRight)
- **Types**: ReconciliationReport (period, summary, unmatched[])
- **Modeles Prisma**: Order, Payment (via jointure Stripe)
- **Formatage**: `Intl.NumberFormat` pour les montants en CAD, `toLocaleDateString` pour les dates
- **Score audit**: 85/100 (B)
- **Erreurs trouvees**: Labels non traduits (anglais au lieu de francais via i18n)
