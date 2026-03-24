# Telephonie - Campagnes d'appels sortants

**Route**: `/admin/telephonie/campagnes`
**Score**: 87/100 (B+)
**Fichiers**: `campagnes/page.tsx`, `campagnes/CampagnesClient.tsx`

## Fonctionnalites
- CRUD complet campagnes d'appels sortants
- Tableau: nom, status badge, contacts, appeles, connectes (%), caller ID, horaire
- Status: ACTIVE, PAUSED, COMPLETED, DRAFT, ARCHIVED
- Formulaire: nom, description, caller ID, max concurrent, AMD (answering machine detection)
- Script agent: titre + contenu
- Planification: heure debut/fin, timezone (7 options), jours actifs (toggle chips)
- Modal d'edition/creation responsive

## Architecture
- Server Component: Prisma findMany DialerCampaign
- Client Component: CRUD via API avec CSRF

## API
- POST/PUT `/api/admin/voip/campaigns`
- DELETE `/api/admin/voip/campaigns?id=`
