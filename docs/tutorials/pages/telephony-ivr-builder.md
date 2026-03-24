# Telephonie - IVR Builder

**Route**: `/admin/telephonie/ivr-builder`
**Score**: 93/100 (A)
**Fichiers**: `ivr-builder/page.tsx`, `ivr-builder/IvrBuilderClient.tsx`

## Fonctionnalites
- Editeur visuel IVR complet (meilleure page de la section)
- Sidebar gauche: liste des menus IVR avec selection
- Vue principale: arbre visuel du menu selectionne
- Carte menu: nom, description, greeting TTS, settings (timeout, retries, language)
- Options DTMF en grille 2 colonnes: digit badge, label, action, target
- 6 actions: transfer ext, transfer queue, sous-menu, voicemail, replay, hangup
- Navigation entre sous-menus (clic pour naviguer)
- Lien heures hors bureau vers menu alternatif
- Editeur CRUD complet: nom, description, greeting (TTS + URL audio), timeout, retries, on-timeout action
- Support 12 touches DTMF (0-9, *, #)
- CSRF protection

## Architecture
- Server Component: Prisma findMany IvrMenu avec options
- Client Component: sidebar + flow view + editor mode
- Layout fullscreen: flex h-[calc(100vh-8rem)]

## API
- POST `/api/voip/ivr` (creer menu)
- PUT `/api/voip/ivr/{id}` (modifier)
- DELETE `/api/voip/ivr/{id}` (supprimer)
