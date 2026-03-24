# Telephonie - Enregistrements

**Route**: `/admin/telephonie/enregistrements`
**Score**: 88/100 (B+)
**Fichiers**: `enregistrements/page.tsx`, `enregistrements/RecordingsClient.tsx`

## Fonctionnalites
- Dashboard unifie de contenu: Audio, Video, Chat
- Onglets filtrants: Tout, Audio, Video, Chat
- Recherche via API avec type filter
- Lecteur audio (AudioPlayer) et video integre
- Transcription avec sentiment analysis
- Metadata: agent, client, direction, format
- Export chat en CSV et JSON
- 50 enregistrements initiaux charges server-side

## Architecture
- Server Component: Prisma findMany avec include callLog, transcription
- Client Component: Conversion en ContentItem unifie, recherche API optionnelle
- Composants: AudioPlayer, Button, Input

## API
- GET `/api/admin/content/recordings?q=&type=&limit=`
- GET `/api/admin/voip/recordings/{id}` (streaming audio)
- GET `/api/admin/chat/export?conversationId=&format=csv|json`
