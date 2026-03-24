# Fournisseurs - Tutoriel

## Resume
La page Fournisseurs offre une gestion avancee des fournisseurs avec un layout maitre-detail. Chaque fournisseur peut avoir plusieurs contacts (par departement), des liens utiles (formulaire de commande, portail, catalogue, suivi), et des informations geographiques completes. C'est la version complete de gestion par rapport au sous-onglet simplifie de la page Inventaire.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/fournisseurs`

## Comment ca fonctionne
La page charge les fournisseurs via l'API dediee avec recherche et filtrage par statut (actif/inactif). L'interface utilise un layout Outlook (liste + detail) : la liste a gauche affiche les fournisseurs avec leur code, ville et nombre de contacts, le panneau de detail a droite montre toutes les informations.

Le detail d'un fournisseur est organise en sections : badge de statut (actif/inactif), informations generales (code, email, telephone, site web, adresse complete), notes, contacts (tableau avec departement, nom, email, telephone, poste, titre, et indicateur de contact principal), et liens utiles (formulaire de commande, chat, portail, catalogue, suivi).

La creation et modification de fournisseurs utilisent un formulaire avance (`SupplierForm`) dans une modale qui gere l'ajout de contacts et de liens.

## Guide etape par etape
1. **Voir la liste**: La liste affiche tous les fournisseurs actifs par defaut avec leur initiale, nom, code, ville et nombre de contacts
2. **Filtrer par statut**: Onglets "Actifs" et "Actifs + Inactifs" pour inclure les fournisseurs desactives
3. **Rechercher**: Taper le nom ou code du fournisseur dans la barre de recherche
4. **Selectionner un fournisseur**: Cliquer pour voir le detail complet
5. **Ajouter un fournisseur**: Bouton "Ajouter un fournisseur" (en haut) ou action ribbon ouvre le formulaire complet
6. **Modifier**: Bouton "Modifier" dans le detail ou action ribbon ouvre le formulaire pre-rempli
7. **Supprimer**: Bouton "Supprimer" avec confirmation dans une modale
8. **Ouvrir le site web**: Action ribbon "Ouvrir site web" ouvre le site du fournisseur selectionne dans un nouvel onglet
9. **Consulter les contacts**: Tableau des contacts avec departement, nom, email, telephone, poste et titre (le contact principal est marque d'une etoile)
10. **Consulter les liens**: Section liens avec type (formulaire commande, chat, portail, catalogue, suivi) et URL cliquable
11. **Exporter en CSV**: Action ribbon "Exporter" telecharge tous les fournisseurs (nom, code, email, telephone, site, adresse, statut, nombre de contacts)

## Fonctionnalites connexes
- [Inventaire](/admin/inventaire) - Gestion simplifiee des fournisseurs dans l'onglet Fournisseurs
- [Produits](/admin/produits) - Produits fournis par les fournisseurs
- [Commandes](/admin/commandes) - Commandes clients liees aux approvisionnements

## Conseils & bonnes pratiques
- Definissez toujours un contact principal par fournisseur pour savoir qui joindre en priorite
- Ajoutez les liens utiles (formulaire commande, portail) pour un acces rapide sans chercher
- Desactivez un fournisseur plutot que de le supprimer pour conserver l'historique
- Utilisez le champ Notes pour documenter les conditions commerciales, delais, etc.
- Les departements permettent de segmenter les contacts (ventes, support, comptabilite, etc.)

## Limitations connues
- La suppression d'un fournisseur est definitive (pas de corbeille)
- Le site web doit commencer par http:// ou https:// pour s'ouvrir correctement
- Pas de liaison directe avec les bons de commande de la page Inventaire

## Endpoints API utilises
- `GET /api/admin/suppliers` - Liste des fournisseurs avec filtres (search, active, limit)
- `POST /api/admin/suppliers` - Creation d'un fournisseur avec contacts et liens
- `PATCH /api/admin/suppliers/:id` - Modification d'un fournisseur
- `DELETE /api/admin/suppliers/:id` - Suppression d'un fournisseur

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: MobileSplitLayout, ContentList, DetailPane, SupplierForm (formulaire avance), Modal
- **Formulaire**: `src/app/admin/fournisseurs/SupplierForm.tsx` gere contacts et liens dynamiques
- **Types**: Supplier, SupplierContact, SupplierLink, SupplierFormData
- **Modeles Prisma**: Supplier, SupplierContact, SupplierLink
- **Librairies**: `fetchWithRetry` pour les appels API resilients, `addCSRFHeader` pour la securite
- **Couleurs par type de lien**: order_form (indigo), chat (vert), portal (violet), catalog (orange), tracking (cyan), other (gris)
- **Score audit**: 90/100 (A)
- **Erreurs trouvees**: Aucune erreur bloquante
