# Telephonie - Messagerie Vocale

**Route**: `/admin/telephonie/messagerie`
**Score**: 91/100 (A-)
**Fichiers**: `messagerie/page.tsx`, `messagerie/VoicemailClient.tsx`

## Fonctionnalites
- Liste des messages vocaux non archives
- Filtres: tous, non lus, lus
- Badge compteur non lus
- Actions bulk: marquer tout lu
- Actions par message: marquer lu, callback (softphone), archiver, supprimer
- Lecteur audio avec waveform (AudioPlayer)
- Transcription complete avec preview
- Analyse IA: resume, sentiment (emoji), mots-cles, urgence
- Liaison CRM: affichage client avec lien vers fiche contact
- Vue expandable avec details complets

## Architecture
- Server Component: Prisma findMany voicemails avec extension + client
- Client Component: gestion locale des voicemails, optimistic updates
- Callback via CustomEvent 'softphone:dial'

## API
- PUT `/api/admin/voip/voicemails` (bulk: markRead/archive/delete)
