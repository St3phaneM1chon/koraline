# Section Marketing — Vue d'ensemble

**Pages**: 8 | **Score moyen**: 82/100 | **Date**: 2026-03-17

## Resume

La section Marketing gere les outils promotionnels de la boutique BioCycle Peptides. Elle comprend 8 pages couvrant les codes promo, promotions automatiques, newsletter, bannieres hero slider, offres upsell, blog, analytics blog et rapports comptables.

## Scores par page

| Page | URL | Score | Grade | Problemes |
|------|-----|-------|-------|-----------|
| Codes Promo | `/admin/promo-codes` | 95 | A | Label `ADMIN.NAV.CONTENTMARKETING` non traduit dans sidebar |
| Promotions | `/admin/promotions` | 95 | A | Meme label non traduit |
| Newsletter | `/admin/newsletter` | 82 | B | i18n: "Non subscribers", descriptions segments en anglais |
| Bannieres | `/admin/bannieres` | 90 | A | Hydration mismatch |
| Upsell | `/admin/upsell` | 85 | B | Accents manquants: "configures", "Desactive", "Creez" |
| Blog | `/admin/blog` | 72 | C | Navigation sous Dashboard au lieu de Marketing, accents manquants |
| Blog Analytics | `/admin/blog/analytics` | 55 | D | Page 100% en anglais, navigation sous Dashboard |
| Rapports | `/admin/rapports` | 82 | B | Navigation sous Dashboard, section "Analyse ventes par region" dupliquee |

## Problemes globaux

### 1. Navigation Blog/Rapports (BUG)
Les pages `/admin/blog`, `/admin/blog/analytics` et `/admin/rapports` s'affichent sous la section "Dashboard" au lieu de "Marketing" dans la sidebar. La fonction `getActiveRailId()` dans `outlook-nav.ts` ne contient pas de regle pour ces chemins.

**Fix**: Ajouter dans `getActiveRailId()`:
```typescript
if (pathname.startsWith('/admin/blog') || pathname.startsWith('/admin/rapports')) return 'marketing';
```

### 2. Label ADMIN.NAV.CONTENTMARKETING non traduit
Le groupe "Content Marketing" dans la sidebar affiche la cle i18n brute `ADMIN.NAV.CONTENTMARKETING`.

### 3. Blog Analytics entierement en anglais
Aucune traduction i18n pour cette page: "Total Posts", "Published", "Drafts", "Featured", "Publish Rate", "Publishing Activity", "Categories", "Recent Posts".

### 4. Accents manquants dans Upsell et Blog
"configures" → "configurés", "Desactive" → "Désactivé", "Creez" → "Créez", "Creer" → "Créer", "gerer" → "gérer", "trouve" → "trouvé", "Publies" → "Publiés".

## Fonctionnalites par page

- **Codes Promo**: CRUD, filtres (Tous/Actifs/Inactif/Expire), stats (total/actifs/utilisations), ribbon complet
- **Promotions**: 7 types (produit, categorie, flash, bundles, BOGO), stats, planification
- **Newsletter**: 8 segments intelligents, conformite LCAP/CASL, tests A/B, sources inscription, export CSV
- **Bannieres**: Hero Slider avec traductions, stats, apercu, reorganisation drag-and-drop
- **Upsell**: Configurations globales et par produit, stats conversion
- **Blog**: Gestion articles, recherche, filtres brouillons/publies
- **Blog Analytics**: Stats posts, activite publication, categories, posts recents
- **Rapports**: Stats revenus/commandes/panier moyen/conversion, filtres periode, export PDF/Excel
