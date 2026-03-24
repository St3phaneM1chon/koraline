# Audit 100 Failles + 100 Améliorations — Design / UI / UX
# Date: 2026-03-12
# Projet: peptide-plus (BioCycle Peptides)

## Résumé
- **Total issues trouvées**: 96 (48 admin + 48 shop)
- **HIGH**: 18 | **MEDIUM**: 42 | **LOW**: 36

---

## PARTIE 1: ADMIN UI/UX (48 issues)

### 1. Patterns Incohérents (4 issues)
1. **Styles de boutons variables** — bannieres/page.tsx:577-586 — sizes et variants incohérents
2. **Tailles de modales non standardisées** — bannieres xl, autres md — pas de guidelines
3. **Styles de champs de formulaire incohérents** — abonnements/page.tsx:716, bannieres/page.tsx:740
4. **Espacement/padding variable** — p-4 vs p-3 vs px-2.5 py-1 sans convention

### 2. Loading States Manquants (4 issues)
5. **Pas de squelettes pour listes de données** — blog/page.tsx:98-101 — spinner simple
6. **Loading partiel sur pages multi-sections** — customers/page.tsx:36-65 — VIP panel
7. **Analytics sans loading granulaire** — analytics/page.tsx:53-76
8. **Pas de feedback visuel pour opérations async** — bannieres/page.tsx:247-266

### 3. États d'Erreur Manquants (5 issues) [HIGH]
9. **Échecs silencieux** — customers/page.tsx:36-65 — RFM catch silencieux
10. **Erreurs réseau génériques** — bannieres/page.tsx:263-265 — "Network error" sans détail
11. **Dialogues d'erreur vides** — audits/page.tsx:216
12. **Erreurs validation formulaire non visibles** — bannieres/page.tsx:196-216
13. **Réponses API erreur non gérées** — bannieres/page.tsx:231-235

### 4. Accessibilité (6 issues) [HIGH]
14. **Labels ARIA manquants sur boutons icône** — bannieres/page.tsx:511-524
15. **Pas d'états focus documentés** — abonnements/page.tsx:663-668
16. **Pas de gestion focus dans modales** — bannieres/page.tsx:619-942
17. **Problèmes contraste badges statut** — audits/page.tsx:137-149
18. **Ambiguïtés lecteurs d'écran** — avis — étoiles sans aria-label
19. **Skip links admin insuffisants** — AdminLayoutClient.tsx:106-111

### 5. Problèmes Responsive (4 issues)
20. **Largeurs fixes** — bannieres w-36 flex-shrink-0 — overflow mobile
21. **Overflow table mobile** — audits/page.tsx:845-962 — pas d'indicateur scroll
22. **Taille modale non responsive** — bannieres size="xl" — trop grande <640px
23. **Barre filtre/recherche non responsive** — blog/page.tsx max-w-md

### 6. Empty States Manquants (4 issues)
24. **Empty state table minimal** — blog/page.tsx:102-106 — pas de CTA
25. **Empty state audit log** — audits/page.tsx:840-843 — pas de contexte
26. **Pas d'empty state clients/VIP** — customers/page.tsx
27. **Abonnements empty state sans fallback** — abonnements/page.tsx:508-510

### 7. UX Formulaires (6 issues)
28. **Pas d'autofocus à l'ouverture modale** — bannieres/page.tsx:664-692
29. **Pas de validation inline en temps réel** — bannieres/page.tsx:668-683
30. **Ordre champs formulaire illogique** — abonnements/page.tsx:650-687
31. **Placeholder manquant sur certains inputs** — bannieres/page.tsx:694-696
32. **Pas d'indicateur champs optionnels** — bannieres/page.tsx:706-715
33. **Compteur caractères sans warning progressif** — bannieres/page.tsx:698-701

### 8. Navigation (3 issues)
34. **Breadcrumbs manquants sur pages détail** — AdminLayoutClient.tsx:177
35. **Pas de nav retour claire sur modales détail mobile** — abonnements/page.tsx:514-555
36. **Item navigation actif pas visuellement clair** — AdminLayoutClient.tsx

### 9. Feedback & Confirmation (4 issues)
37. **Confirmation manquante pour changements de statut** — bannieres toggle
38. **Toasts succès disparaissent trop vite** — 4s par défaut Sonner
39. **Pas de fonctionnalité Undo** — bannieres/page.tsx:269-279 delete permanent
40. **Actions bulk sans feedback** — audits/page.tsx:343-389

### 10. Dark Mode (3 issues)
41. **Couleurs hardcodées incompatibles dark mode** — backups/page.tsx:164-193
42. **Styles inline sans support dark mode** — bannieres/page.tsx:244
43. **Contraste texte non testé en dark mode** — customers text-slate-500

### 11. Améliorations Additionnelles (5 issues)
44. **Pas de debounce loading** — bannieres slug check 500ms trop court
45. **Pagination manquante sur listes** — blog/page.tsx limit 50 hardcodé
46. **Pas d'indicateurs de tri** — bannieres — pas de headers clickables
47. **Pas de UI sélection/action bulk** — customers — pas de checkboxes
48. **Rate limiting API non communiqué** — erreurs 429 silencieuses

---

## PARTIE 2: SHOP UI/UX (48 issues)

### 12. SEO (3 issues)
49. **Schema CollectionPage manquant** — shop/page.tsx — que breadcrumb
50. **ALT incomplet images fallback** — HomePageClient.tsx:313-322 — emoji sans alt
51. **Pas de AggregateRating dans JSON-LD** — product/[slug]/page.tsx

### 13. Performance (5 issues) [HIGH]
52. **Composant monolithique 498 lignes** — ProductPageClient.tsx
53. **Lazy loading images manquant grille produits** — ProductCard.tsx:172-178
54. **Images cart drawer non optimisées** — CartDrawer.tsx:289
55. **Import tax calculation top-level** — checkout/page.tsx:22-29
56. **Pas d'images progressives hero slider** — HomePageClient.tsx:12-20

### 14. Mobile UX (4 issues) [HIGH]
57. **Touch targets trop petits (32px vs 44px)** — ProductCard.tsx:373-397
58. **Sidebar filtre sans animation mobile** — ShopPageClient.tsx:341-352
59. **Risque scroll horizontal résultats recherche** — search/page.tsx:404-467
60. **Breadcrumbs non abrégés sur mobile** — Breadcrumbs.tsx

### 15. Cart/Checkout UX (5 issues) [HIGH]
61. **Pas d'indicateur progrès checkout** — checkout/page.tsx — 4 étapes sans stepper
62. **Pas de résumé commande étape paiement mobile** — checkout/page.tsx
63. **Page confirmation commande manquante** — checkout/page.tsx
64. **Erreurs validation formulaire non scroll-to** — checkout/page.tsx:81-84
65. **Guest checkout pas par défaut** — checkout/page.tsx:44

### 16. Pages Produit (5 issues)
66. **Pas de zoom image galerie** — ProductPageClient.tsx
67. **Produits reliés même catégorie seulement** — product/[slug]/page.tsx:53-69
68. **FAQ produit manquante** — ProductPageClient.tsx
69. **Niveau stock sans barre urgence** — ProductCard.tsx:269-280
70. **Titre produit tronqué sans tooltip** — ProductCard.tsx:221 line-clamp-2

### 17. Recherche UX (4 issues) [HIGH]
71. **Pas d'autocomplete/suggestions** — search — pas de dropdown temps réel
72. **Compteur résultats pas temps réel** — search/page.tsx:531-538
73. **Filtre pureté radio au lieu checkbox** — search/page.tsx:486-512
74. **Suggestions recherche pas dans header** — search/page.tsx:252-259

### 18. Accessibilité Shop (6 issues)
75. **Attribut lang manquant switch langue** — Header.tsx:16-21
76. **Labels ARIA boutons icône flous** — ProductCard.tsx:205-213
77. **Dropdown format sans nav clavier** — ProductCard.tsx:286-368
78. **Contraste couleur insuffisant badges** — ProductCard.tsx:196
79. **Pas de skip-to-content link** — layout.tsx
80. **Indicateurs focus manquants filtres** — search/page.tsx:407-423

### 19. Loading & Content Shifts (4 issues)
81. **Pas de squelette pendant filtrage** — ShopPageClient.tsx:113-150
82. **Largeur squelette ne match pas contenu** — ShopPageClient.tsx:600-627
83. **Squelette manquant options filtre** — search/page.tsx:619-630
84. **Squelette articles hauteur fixe** — HomePageClient.tsx:240-249

### 20. Gestion Erreurs Shop (4 issues) [HIGH]
85. **Pas d'error boundary page shop** — ShopPageClient.tsx — reload complet
86. **Échec silencieux sélection format** — ProductCard.tsx:138-163
87. **Pas de timeout API lentes** — ShopPageClient.tsx:113-150
88. **Pas d'indicateur statut réseau** — pas de détection offline

### 21. i18n & RTL (4 issues)
89. **CSS directionnel incohérent (start/end vs left/right)** — Multiple fichiers
90. **Labels ARIA hardcodés en anglais** — ProductCard.tsx:170
91. **Position symbole devise pas i18n-aware** — ProductCard.tsx:254
92. **Format nombres pas locale-aware** — virgule vs point décimal

### 22. Fonctionnalités Manquantes (4 issues)
93. **Pas de wishlist sur page produit** — ProductPageClient.tsx
94. **Pas d'alertes prix/stock** — StockAlertButton.tsx non connecté
95. **Pas de comparaison produits visible** — ShopPageClient.tsx
96. **Pas de notification rupture stock** — product/[slug]

---

## PRIORITÉ RECOMMANDÉE

### FIX IMMÉDIAT (HIGH — 18 issues)
- Touch targets 44px minimum (#57)
- Stepper progrès checkout (#61)
- Zoom images galerie produit (#66)
- Autocomplete recherche (#71)
- Timeout API calls (#87)
- Error boundaries (#85)
- Confirmation commande (#63)
- Labels ARIA (#14, #76)
- Loading states granulaires (#5-8)
- Validation formulaire visible (#12, #64)

### SPRINT SUIVANT (MEDIUM — 42 issues)
- Standardiser boutons/modales (#1-3)
- Squelettes pour filtres (#81-84)
- RTL support (#89-92)
- Responsive modales (#22-23)
- Empty states avec CTA (#24-27)
- Dark mode support (#41-43)

### FUTUR (LOW — 36 issues)
- Undo delete (#39)
- Urgence stock visuelle (#69)
- Comparaison produits (#95)
- Pagination avancée (#45)
- Hero images progressives (#56)
