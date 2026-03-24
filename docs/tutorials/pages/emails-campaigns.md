# Emails - Campagnes

**Route**: `/admin/emails?tab=campaigns`
**Score**: 90/100 (A-)
**Fichiers**: `page.tsx`, `campaigns/CampaignList.tsx`, `campaigns/CampaignEditor.tsx`, `CampaignCalendar.tsx`

## Fonctionnalites
- Liste campagnes: nom, sujet, status badge (DRAFT/SCHEDULED/SENDING/SENT/CANCELLED)
- Stats par campagne: envoyes, delivres, ouverts, cliques, bounces, revenus
- CRUD complet avec confirmation de suppression (ConfirmDialog)
- Editeur de campagne: audience, contenu, scheduling
- A/B Testing: modal pour 2 sujets avec % split
- Calendrier campagnes: vue calendrier des campagnes planifiees
- Envoi de campagne avec confirmation
- Boutons ribbon: nouveau, calendrier, A/B test

## Architecture
- CampaignList: fetch + CRUD via API
- CampaignEditor: edition audience + contenu + schedule
- CampaignCalendar: vue calendrier
- CSRF protection sur mutations

## API
- GET/POST/PUT/DELETE `/api/admin/emails/campaigns`
- POST `/api/admin/emails/campaigns/{id}/send`
- POST `/api/admin/emails/ab-test`
