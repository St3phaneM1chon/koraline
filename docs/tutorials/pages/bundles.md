# Bundles - Tutoriel

## Resume
La page Bundles gere les lots de produits (product bundles) de la boutique. Un bundle regroupe plusieurs produits en un seul article avec un prix reduit par rapport a l'achat individuel. La page affiche les bundles existants en grille de cartes, ou un etat vide avec un lien pour creer le premier bundle.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/bundles`

## Comment ca fonctionne
La page charge les bundles via l'API `/api/admin/bundles` au montage. Les bundles sont affiches dans une grille responsive (1 colonne mobile, 2 tablette, 3 desktop). Chaque carte montre le nom du bundle, sa description (tronquee a 2 lignes), son statut (actif/inactif), son prix actuel, son prix barre (si superieur au prix actuel), et le nombre de produits inclus.

Si aucun bundle n'existe, un etat vide s'affiche avec une icone Package et un bouton "Creer un bundle" qui redirige vers `/admin/bundles/new`. La creation et l'edition de bundles se font sur des pages dediees (`/admin/bundles/new` et `/admin/bundles/{id}/edit`).

Le header de la page offre un bouton principal "Nouveau bundle" qui redirige vers le formulaire de creation. Chaque carte de bundle a deux actions : "Voir" (preview sur la boutique via `/bundles/{slug}`) et "Modifier" (edition via `/admin/bundles/{id}/edit`).

## Guide etape par etape
1. **Voir les bundles existants**: La page affiche une grille de cartes avec tous les bundles
2. **Creer un bundle**: Bouton "Nouveau bundle" en haut ou lien "Creer un bundle" dans l'etat vide redirige vers `/admin/bundles/new`
3. **Voir le bundle en boutique**: Bouton "Voir" sur chaque carte ouvre la page publique du bundle (`/bundles/{slug}`)
4. **Modifier un bundle**: Bouton "Modifier" sur chaque carte ouvre le formulaire d'edition (`/admin/bundles/{id}/edit`)
5. **Verifier le statut**: Le badge vert "Actif" ou gris "Inactif" indique la visibilite du bundle en boutique
6. **Comparer les prix**: Le prix barre (ancien prix) s'affiche a cote du prix actuel si le bundle offre une reduction

## Fonctionnalites connexes
- [Produits](/admin/produits) - Les produits individuels qui composent les bundles
- [Categories](/admin/categories) - Les categories auxquelles appartiennent les produits des bundles
- [Promotions](/admin/promotions) - Codes promo applicables aux bundles
- [Inventaire](/admin/inventaire) - Stock des produits inclus dans les bundles

## Conseils & bonnes pratiques
- Proposez des bundles avec une reduction visible (prix barre) pour inciter a l'achat
- Combinez des produits complementaires (ex: BPC-157 + seringues + tampons)
- Desactivez un bundle en rupture plutot que de le supprimer
- Testez le rendu en boutique avec le bouton "Voir" avant de publier
- Gardez les descriptions courtes et impactantes (2-3 lignes max)

## Limitations connues
- La page n'a pas de filtres ni de recherche (adaptee pour un petit nombre de bundles)
- Pas d'actions de masse (dupliquer, publier/depublier en lot)
- La suppression de bundles n'est pas disponible directement sur la page liste
- Le prix est affiche dans la devise configuree via le CurrencyContext

## Endpoints API utilises
- `GET /api/admin/bundles` - Liste des bundles avec nombre de produits (_count.items)

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: PageHeader, icones Lucide (Package, Plus, Pencil, Eye)
- **Contextes**: `useCurrency()` pour le formatage des prix, `useI18n()` pour les traductions
- **Types**: Bundle (id, name, slug, description, price, comparePrice, isActive, createdAt, _count.items)
- **Modeles Prisma**: Bundle (avec relation items)
- **Pages liees**: `/admin/bundles/new` (creation), `/admin/bundles/{id}/edit` (edition), `/bundles/{slug}` (vue boutique)
- **Score audit**: 90/100 (A)
- **Erreurs trouvees**: Aucune erreur bloquante
