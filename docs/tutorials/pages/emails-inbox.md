# Emails - Inbox et Dossiers

**Route**: `/admin/emails?folder=inbox|sent|drafts|deleted|junk|notes|archive|search`
**Score**: 80-88/100 selon le dossier
**Fichiers**: `page.tsx`, `inbox/InboxView.tsx`, `inbox/ConversationThread.tsx`, `inbox/CustomerSidebar.tsx`

## Fonctionnalites
- **Inbox** (88/100): Split panel resizable, liste conversations avec status/priorite, thread complet, sidebar client
- **Sent** (84/100): Liste emails envoyes avec status, sujet, destinataire
- **Drafts** (80/100): Brouillons
- **Deleted/Junk/Notes/Archive** (80/100): Vues dossiers standard
- **Search** (82/100): Recherche globale

### Inbox detaille
- Conversations avec statuts: NEW, OPEN, PENDING, RESOLVED, CLOSED
- Priorites: URGENT, HIGH, NORMAL (bordure coloree)
- Split panel drag-to-resize (260-600px)
- Thread: emails entrants + reponses sortantes + notes internes
- Sidebar client: loyalty tier, avatar, historique
- Email composer inline pour reponses
- Compteur non lus dans l'onglet

## Architecture
- Tout client-side (pas de Server Component pour auth)
- InboxView: fetch conversations, recherche, filtres status
- ConversationThread: thread emails, reply, notes
- CustomerSidebar: info client enrichie

## API
- GET `/api/admin/emails/conversations`
- GET `/api/admin/emails/conversations/{id}`
- PUT `/api/admin/emails/conversations/{id}` (status, assign)
- GET `/api/admin/emails/logs?excludeCampaigns=true&limit=100`
