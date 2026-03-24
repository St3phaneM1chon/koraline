# Abonnements - Tutoriel

## Resume
La page Abonnements gere les abonnements recurrents des clients. Elle permet de visualiser, filtrer, modifier, suspendre ou annuler les abonnements, avec un panneau de configuration globale (reduction, livraison gratuite, rappels, pauses). Le revenu mensuel recurrent (MRR) est calcule en temps reel.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/abonnements`

## Comment ca fonctionne
La page charge les abonnements et la configuration globale au montage. Les abonnements supportent 4 frequences (tous les 2, 4, 6 ou 12 mois) et 3 statuts (Actif, En pause, Annule). Le revenu mensuel estime est calcule en prenant chaque abonnement actif et en multipliant son prix remise par un coefficient de frequence (ex: 0.5 pour bi-mensuel, 1/6 pour semestriel).

La configuration globale est stockee dans l'API Settings et permet de definir : le pourcentage de reduction par defaut (15%), la livraison gratuite pour les abonnes, le nombre de jours de rappel avant livraison (3), et le nombre maximum de pauses par an (1). Ces parametres sont modifiables via une modale de configuration.

L'interface utilise un layout Outlook (liste + detail). La liste affiche chaque abonnement avec le nom du produit, le client, le format, la frequence et le prix remise. Le panneau de detail permet de voir les informations completes et d'effectuer des actions (pause, reprise, annulation, modification).

## Guide etape par etape
1. **Consulter les KPIs**: 4 cartes - Total abonnements, Actifs, En pause, Revenu mensuel estime (MRR)
2. **Voir la configuration**: Section sous les KPIs montrant la reduction (%), la livraison, le rappel (jours) et les pauses autorisees
3. **Modifier la configuration**: Bouton "Configurer les options" ouvre une modale avec tous les parametres modifiables
4. **Filtrer par statut**: Onglets Tous, Actifs, En pause, Annules
5. **Rechercher**: Taper le nom du client, email ou nom du produit
6. **Selectionner un abonnement**: Cliquer pour voir le detail complet (client, produit, format, quantite, frequence, prix, dates)
7. **Mettre en pause**: Bouton "Pause" (uniquement pour les abonnements actifs)
8. **Reprendre**: Bouton "Reprendre" (uniquement pour les abonnements en pause)
9. **Annuler**: Bouton "Annuler" avec confirmation (irreversible, un abonnement annule ne peut pas etre reactive)
10. **Modifier un abonnement**: Bouton "Modifier" ouvre une modale pour changer la frequence, quantite, reduction et date de prochaine livraison
11. **Voir les stats MRR/ARR**: Action ribbon "Stats MRR" affiche MRR, ARR et nombre d'abonnements actifs
12. **Exporter en CSV**: Action ribbon "Exporter" telecharge tous les abonnements

## Fonctionnalites connexes
- [Commandes](/admin/commandes) - Les commandes generees par les abonnements
- [Produits](/admin/produits) - Les produits disponibles en abonnement
- [Customers](/admin/customers) - Les clients abonnes
- [Paiements](/admin/paiements/reconciliation) - Reconciliation des paiements recurrents

## Conseils & bonnes pratiques
- Surveillez le MRR quotidiennement : une baisse indique des annulations ou pauses en augmentation
- Limitez les pauses a 1 par an pour eviter les abus tout en offrant de la flexibilite
- La reduction de 15% est un bon compromis pour encourager les abonnements sans trop impacter les marges
- Envoyez les rappels 3 jours avant la livraison pour laisser au client le temps de reagir

## Limitations connues
- Probleme de debordement (overflow) detecte dans l'interface
- Erreurs API Settings lors du chargement de la configuration (la page fonctionne avec les valeurs par defaut si l'API echoue)
- Les abonnements annules ne peuvent pas etre reactives depuis cette interface
- Le remboursement est redirige vers Stripe (pas de traitement in-app)

## Endpoints API utilises
- `GET /api/admin/subscriptions` - Liste des abonnements
- `PATCH /api/admin/subscriptions/:id` - Modification statut, frequence, quantite, reduction, prochaine livraison
- `GET /api/admin/settings?key=subscription_config` - Configuration des abonnements
- `PATCH /api/admin/settings` - Sauvegarde de la configuration

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: MobileSplitLayout, ContentList, DetailPane, StatCard, Modal, ConfirmDialog
- **Modeles Prisma**: Subscription (lie a User et Product)
- **Securite**: CSRF token via `addCSRFHeader()` sur toutes les mutations
- **Calcul MRR**: Arrondi a 2 decimales (fix F-074) pour eviter les erreurs de virgule flottante
- **Score audit**: 70/100 (C)
- **Erreurs trouvees**: Overflow UI, erreurs API Settings au chargement de la config
