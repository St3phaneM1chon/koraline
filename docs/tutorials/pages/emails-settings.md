# Emails - Settings

**Route**: `/admin/emails?tab=settings`
**Score**: 86/100 (B)
**Fichiers**: `page.tsx`

## Fonctionnalites
- Gestion multi-comptes email:
  - Providers: Resend (API key) et SMTP (host, port, user, pass)
  - Nom, email, display name, reply-to
  - Couleur et signature HTML
  - Toggle actif/inactif et defaut
  - CRUD complet avec modal
- Authentification email:
  - Status SPF, DKIM, DMARC, BIMI
  - Indicateurs visuels (pass/fail/unknown)
- Lazy loading: settings charges uniquement quand l'onglet est active
- Mailing list (tab=mailing-list):
  - Import CSV avec upload fichier
  - Ajout contact manuel (email, locale, source)
  - Variables template disponibles
  - Boutons ribbon: import, ajouter contact, variables

## Architecture
- Tout dans page.tsx principal (modal gestion comptes)
- Settings charges via API lazy au premier acces

## API
- GET/PUT `/api/admin/emails/settings`
- GET/POST/PUT/DELETE `/api/admin/emails/accounts`
- POST `/api/admin/emails/mailing-list`
- POST `/api/admin/emails/mailing-list/import`
