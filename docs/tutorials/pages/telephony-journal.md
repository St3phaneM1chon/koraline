# Telephonie - Journal d'appels

**Route**: `/admin/telephonie/journal`
**Score**: 90/100 (A-)
**Fichiers**: `journal/page.tsx`, `journal/CallLogClient.tsx`

## Fonctionnalites
- Tableau complet des appels avec pagination (25/page)
- Filtres: recherche texte, direction (inbound/outbound/internal), status, plage de dates
- Auto-refresh SWR toutes les 15 secondes
- Detail expandable par appel: enregistrement audio (AudioPlayer), transcription + sentiment, notes agent
- Bridges cross-section: CRM deals, commandes recentes, info loyalty, emails recents du client
- Indicateurs visuels: icones direction, badges status colores, satisfaction badge

## Architecture
- Server Component: auth seulement (pas de data fetching)
- Client Component: SWR pour data fetching paginee
- 3 fetches paralleles pour les bridges (call detail + loyalty + emails)
- Composants: SatisfactionBadge, AudioPlayer

## API
- GET `/api/admin/voip/call-logs?page=&limit=&search=&direction=&status=&dateFrom=&dateTo=`
- GET `/api/admin/voip/call-logs/{id}` (bridges CRM + commandes)
- GET `/api/admin/voip/call-logs/{id}/loyalty`
- GET `/api/admin/voip/call-logs/{id}/emails`

## Problemes
- Fragment `<>` sans key dans le map (React warning potentiel)
- Type `any` sur les call logs
