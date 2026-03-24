# Telephonie - Conference Video

**Route**: `/admin/telephonie/conference`
**Score**: 88/100 (B+)
**Fichiers**: `conference/page.tsx`, `conference/ConferenceClient.tsx`, `conference/[roomName]/page.tsx`

## Fonctionnalites
- Lobby: liste des salles actives avec participants, duree, createur
- Creation de salle: nom + max participants (2-50)
- Rejoindre une salle (navigation vers /conference/{roomName})
- Fermer une salle (DELETE avec confirmation)
- Badge REC si enregistrement en cours
- Auto-refresh salles toutes les 15 secondes
- Modal creation propre avec CSRF protection
- Empty state avec icone Video

## Architecture
- Server Component: auth seulement
- Client Component: CRUD via API, router.push pour navigation

## API
- GET `/api/admin/voip/video-conference` (liste salles)
- POST `/api/admin/voip/video-conference` (creer salle)
- DELETE `/api/admin/voip/video-conference/{roomName}` (fermer)
