# Emails - Templates

**Route**: `/admin/emails?tab=templates`
**Score**: 88/100 (B+)
**Fichiers**: `page.tsx`, `TemplateBuilder.tsx`

## Fonctionnalites
- Liste des templates avec DataTable (nom, type badge, sujet, actif/inactif, date)
- Template Builder drag-and-drop:
  - Blocs: En-tete, Texte, Image, Grille produits, Bouton CTA, Separateur
  - Reordonnement par drag
  - Edition inline de chaque bloc
  - Preview HTML en temps reel
  - Compilation en HTML email-safe
- Creation de nouveau template (modal nom + sujet)
- Edition de template existant
- Variables dynamiques: {{firstName}}, {{orderNumber}}, etc.

## Architecture
- Templates charges via API `/api/admin/emails`
- TemplateBuilder: blocs array, compilation HTML, sauvegarde via API
- Blocs types: header, text, image, product_grid, cta, divider, footer

## API
- GET `/api/admin/emails` (liste templates)
- POST/PUT `/api/admin/emails` (creer/modifier template)
