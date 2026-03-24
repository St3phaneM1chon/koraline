# Telephonie - Coaching

**Route**: `/admin/telephonie/coaching`
**Score**: 85/100 (B)
**Fichiers**: `coaching/page.tsx`, `coaching/CoachingClient.tsx`

## Fonctionnalites
- Classement agents par score moyen pondere (top 8 avec etoiles)
- Sessions actives (SCHEDULED, IN_PROGRESS) avec coach + agent
- Modes coaching: Listen (ecoute), Whisper (chuchotement), Barge (intervention)
- Fin de session
- Historique sessions completees avec scores
- Creation nouvelle session: selection agent, topic, objectives, planification
- Calcul score moyen pondere par critere

## Architecture
- Server Component: Prisma findMany CoachingSession avec coach, student, scores + users disponibles
- Client Component: gestion sessions, calcul metriques

## Problemes
- Plusieurs textes hardcodes en anglais: "Coach", "Recent Sessions", "Topic", "Objectives", "Schedule", "Scheduled", "In Progress", etc.
- Pas de CSRF header sur les mutations

## API
- POST `/api/admin/voip/coaching` (creer session)
- PUT `/api/admin/voip/coaching` (action: listen/whisper/barge/end)
