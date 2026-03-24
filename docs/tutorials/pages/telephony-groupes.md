# Telephonie - Groupes de sonnerie

**Route**: `/admin/telephonie/groupes`
**Score**: 89/100 (B+)
**Fichiers**: `groupes/page.tsx`, `groupes/GroupesClient.tsx`

## Fonctionnalites
- CRUD groupes de sonnerie (CallQueue)
- Grille de cartes avec nom, strategie badge, membres, timeout
- 5 strategies: Ring All, Round Robin, Hunt, Random, Least Recent
- Multi-select membres avec toggle utilisateur
- Configuration: ring timeout (10-120s slider), max wait, wrap-up time
- Badges membres affiches sur chaque carte

## Architecture
- Server Component: Prisma findMany CallQueue avec members + users
- Client Component: CRUD via API avec CSRF

## API
- POST/PUT `/api/admin/voip/ring-groups`
- DELETE `/api/admin/voip/ring-groups?id=`
