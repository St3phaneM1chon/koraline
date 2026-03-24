# Gestion des Traductions (i18n)

> **Section**: Systeme > Configuration > Traductions
> **URL**: `/admin/traductions`
> **Niveau**: Intermediaire
> **Temps de lecture**: ~15 minutes

---

## A quoi sert cette page ?

La page **Traductions** gere les textes affiches dans les 22 langues supportees par la boutique BioCycle Peptides. Chaque label, bouton, message et description peut etre traduit pour offrir une experience multilingue aux clients du monde entier.

**En tant qu'administrateur, vous pouvez :**
- Consulter toutes les cles de traduction organisees par section
- Modifier les traductions existantes
- Ajouter des traductions manquantes
- Verifier les cles non traduites par langue
- Exporter et importer les traductions en masse
- Definir la langue par defaut de l'interface

---

## Concepts de base pour les debutants

### Qu'est-ce que l'i18n ?

**i18n** est l'abreviation de "internationalization" (il y a 18 lettres entre le "i" et le "n"). C'est le systeme qui permet a Koraline d'afficher son contenu dans differentes langues.

### Les 22 langues supportees

| Code | Langue | Marche cible |
|------|--------|--------------|
| **fr** | Francais | Quebec, France, Afrique francophone |
| **en** | Anglais | Canada anglophone, USA, international |
| **es** | Espagnol | Amerique latine |
| **de** | Allemand | Allemagne, Suisse |
| **pt** | Portugais | Bresil, Portugal |
| **it** | Italien | Italie |
| **ar** | Arabe | Moyen-Orient |
| **ar-dz** | Arabe (Algerie) | Algerie |
| **ar-lb** | Arabe (Liban) | Liban |
| **ar-ma** | Arabe (Maroc) | Maroc |
| **zh** | Chinois | Chine |
| **ko** | Coreen | Coree du Sud |
| **hi** | Hindi | Inde |
| **pa** | Pendjabi | Inde, Pakistan |
| **ta** | Tamoul | Inde du Sud, Sri Lanka |
| **ru** | Russe | Russie |
| **pl** | Polonais | Pologne |
| **sv** | Suedois | Suede |
| **vi** | Vietnamien | Vietnam |
| **tl** | Tagalog | Philippines |
| **ht** | Creole haitien | Haiti |
| **gcr** | Creole guyanais | Guyane |

### Comment ca fonctionne

Chaque texte affiche dans l'interface est associe a une **cle de traduction**. Par exemple :
- Cle : `common.addToCart`
- Francais : "Ajouter au panier"
- Anglais : "Add to Cart"
- Espagnol : "Agregar al carrito"

Quand un client visite le site en espagnol, le systeme affiche "Agregar al carrito" partout ou la cle `common.addToCart` est utilisee.

---

## Comment y acceder

1. Systeme > Configuration > **Traductions**
2. URL directe : `/admin/traductions`

---

## Fonctionnalites detaillees

### 1. Parcourir les traductions

L'interface affiche les traductions groupees par **namespace** (section) :

| Namespace | Exemples de cles |
|-----------|-----------------|
| **common** | addToCart, search, save, cancel, loading |
| **shop** | productDetails, relatedProducts, reviews |
| **admin** | dashboard, settings, permissions |
| **account** | myOrders, myProfile, changePassword |
| **checkout** | shippingAddress, paymentMethod, orderSummary |

### 2. Modifier une traduction

**Etapes** :
1. Trouvez la cle (recherche ou navigation par namespace)
2. Cliquez sur la cle
3. Modifiez le texte dans la langue souhaitee
4. Cliquez sur **Sauvegarder**

> **Important** : Le francais est la **langue de reference**. Toute modification en francais devrait etre propagee aux autres langues.

### 3. Identifier les traductions manquantes

**Etapes** :
1. Selectionnez une langue dans le filtre
2. Activez le filtre **Non traduit**
3. La liste affiche les cles sans traduction dans cette langue
4. Traduisez ou utilisez le bouton **Traduire automatiquement**

### 4. Import/Export en masse

**Exporter** :
1. Selectionnez la langue
2. Cliquez sur **Exporter CSV**
3. Le fichier contient les cles et les traductions

**Importer** :
1. Modifiez le CSV exporte (ou preparez un nouveau)
2. Cliquez sur **Importer CSV**
3. Les traductions sont mises a jour en masse

---

## Questions frequentes (FAQ)

**Q : Les descriptions de produits sont-elles aussi dans ce systeme ?**
R : Non. Les descriptions de produits ont leur propre systeme de traduction dans la fiche produit (Catalogue). Cette page gere les textes d'interface (boutons, labels, messages).

**Q : La traduction automatique est-elle fiable ?**
R : Elle donne un bon point de depart, mais une relecture humaine est recommandee pour le contenu visible par les clients.

**Q : Le site detecte-t-il la langue du visiteur automatiquement ?**
R : Oui, la langue est detectee via le navigateur du visiteur et peut etre changee manuellement via le selecteur de langue sur le site.

---

## Glossaire

| Terme | Definition |
|-------|-----------|
| **i18n** | Internationalization, systeme de gestion multilingue |
| **Cle de traduction** | Identifiant unique d'un texte (ex: common.save) |
| **Namespace** | Groupe de cles par section (common, shop, admin, etc.) |
| **Locale** | Code de langue (fr, en, es, etc.) |
| **Fallback** | Langue de secours si une traduction manque (anglais) |

---

## Pages reliees

- [Parametres](/admin/parametres) : Langue par defaut
- [Contenu](/admin/contenu) : Pages de contenu traduisibles
- [SEO](/admin/seo) : Meta-donnees multilingues
