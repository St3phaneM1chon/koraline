# Categories - Tutoriel

## Resume
La page Categories gere l'arborescence des categories et sous-categories du catalogue. Elle affiche un tableau en vue arborescente (parent/enfants) avec des actions par ligne (ajouter sous-categorie, modifier, supprimer) et des actions globales (nouvelle categorie, reorganiser, exporter). Elle detecte et corrige automatiquement les categories orphelines.

**Utilisateurs cibles**: Employes (EMPLOYEE) et proprietaires (OWNER)
**Prerequis**: Etre connecte avec un compte admin autorise
**URL**: `/admin/categories`

## Comment ca fonctionne
La page charge toutes les categories (y compris inactives) via l'API publique categories avec le parametre `includeInactive=true`. Les categories sont organisees en arbre : les parents sont affiches en premier, suivis de leurs enfants indentes. Les categories orphelines (dont le parent a ete supprime) sont detectees et signalees avec un badge d'avertissement.

Le tableau affiche 5 colonnes : Categorie (avec image, nom, slug, badges orphelin/sous-categories), Produits (nombre total incluant les sous-categories pour les parents), Ordre (ordre d'affichage avec boutons de deplacement en mode reorganisation), Actif (toggle vert/gris), et Actions (ajouter sous-categorie, modifier, supprimer).

La creation et modification utilisent une modale avec : selecteur de categorie parent, nom (generation automatique du slug), slug (modifiable), description, image (via MediaUploader), et ordre de tri. La suppression n'est possible que pour les categories sans produits et sans sous-categories.

## Guide etape par etape
1. **Voir l'arborescence**: Le tableau affiche les categories parent en gras, et les sous-categories indentees avec une fleche
2. **Creer une categorie parent**: Bouton "Nouvelle categorie" (en haut) ou action ribbon ouvre la modale sans parent selectionne
3. **Creer une sous-categorie**: Bouton "+" sur une categorie parent, ou action ribbon "Nouvelle sous-categorie" (utilise le premier parent par defaut)
4. **Modifier une categorie**: Bouton crayon dans la colonne Actions ouvre la modale pre-remplie
5. **Supprimer une categorie**: Bouton poubelle (visible uniquement si 0 produit et 0 sous-categorie) avec confirmation
6. **Activer/desactiver**: Cliquer sur le toggle vert/gris dans la colonne Actif
7. **Reorganiser**: Bouton "Reorganiser" active le mode reordonnancement avec fleches haut/bas
8. **Corriger un orphelin**: Bouton "Fix: Set as root" (orange) sur les categories orphelines les transforme en categories parent
9. **Voir les stats**: Action ribbon "Stats" affiche un resume (total, parents, enfants, actifs, produits)
10. **Exporter en CSV**: Bouton "Exporter" ou action ribbon genere un CSV (ID, nom, slug, parent, ordre, actif, produits)
11. **Upload d'image**: Dans la modale d'edition, le MediaUploader permet de telecharger une image de categorie
12. **Retour aux produits**: Lien "Retour aux produits" en haut pour revenir a `/admin/produits`

## Fonctionnalites connexes
- [Produits](/admin/produits) - Les produits sont classes dans ces categories
- [Bundles](/admin/bundles) - Les lots peuvent regrouper des produits de differentes categories

## Conseils & bonnes pratiques
- Corrigez les categories orphelines immediatement pour eviter des problemes d'affichage en boutique
- Utilisez les sous-categories pour une navigation plus fine (ex: Peptides > Peptides de reparation)
- Ajoutez des images a chaque categorie pour ameliorer l'experience visuelle du catalogue
- L'ordre de tri determine l'affichage en boutique : placez les categories principales en premier
- Desactivez une categorie plutot que de la supprimer si elle contient un historique important

## Limitations connues
- **11 images de categories manquantes** : la majorite des categories n'ont pas d'image (icone FolderOpen par defaut)
- La suppression est bloquee si la categorie a des produits ou des sous-categories (il faut les deplacer d'abord)
- Le reordonnancement echange les ordres de tri 2 par 2 (pas de drag & drop)
- Le slug est genere automatiquement a la creation mais modifiable, ce qui peut causer des liens casses si change apres publication

## Endpoints API utilises
- `GET /api/categories?includeInactive=true` - Liste de toutes les categories
- `POST /api/categories` - Creation d'une categorie
- `PUT /api/categories/:id` - Modification (nom, slug, description, image, parent, ordre, actif)
- `DELETE /api/categories/:id` - Suppression (retourne 204 No Content si succes)

## Notes techniques
- **Render mode**: Client Component (`'use client'`)
- **Composants principaux**: DataTable (generique), PageHeader, Modal, FormField, Input, Textarea, MediaUploader
- **Detection orphelins**: Categories avec parentId pointant vers un ID inexistant (BUG-057 fix)
- **Gestion 204**: La suppression retourne 204 No Content, gere specialement (BUG-007 fix)
- **Types**: Category (avec parent, children, _count.products), FormData (name, slug, description, imageUrl, sortOrder, parentId)
- **Modeles Prisma**: Category (avec relations parent/children et _count.products)
- **Securite**: CSRF token via `addCSRFHeader()` sur toutes les mutations
- **Score audit**: 50/100 (D)
- **Erreurs trouvees**: 11 images de categories manquantes, ce qui degrade fortement le score visuel
