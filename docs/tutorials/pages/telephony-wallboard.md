# Telephonie - Wallboard

**Route**: `/admin/telephonie/wallboard`
**Score**: 90/100 (A-)
**Fichiers**: `wallboard/page.tsx`, `wallboard/WallboardClient.tsx`

## Fonctionnalites
- 9 KPI cards: appels actifs, agents en ligne, en file, temps attente moyen, SLA%, taux abandon, appels jour, repondus, manques
- Auto-refresh toutes les 10 secondes
- Bouton refresh manuel avec animation spin
- Liste agents avec avatar initial, status colore (ONLINE/BUSY/DND/AWAY/OFFLINE), extension
- Liste files d'attente avec strategie, nombre membres, attente
- Support dark mode complet
- SLA color-coded (vert >=90%, orange >=70%, rouge <70%)
- Abandon rate color-coded (vert <=5%, orange <=15%, rouge >15%)

## Architecture
- Server Component: 3 requetes paralleles Prisma (calls, agents, queues) + aggregations
- Client Component: auto-refresh via 2 APIs (team-presence + dashboard stats)

## API
- GET `/api/voip/team-presence` (presence agents)
- GET `/api/admin/voip/dashboard` (stats jour)
