# Section Emails - Rapport d'Audit Mega

**Date**: 2026-03-17
**Pages auditees**: 15 (via query params folder= et tab=)
**Score global**: 86/100 (B)

---

## Resume executif

La section Emails est implementee comme une Single Page Application dans un seul fichier `page.tsx` monolithique (~700+ lignes). Elle utilise `useSearchParams()` pour naviguer entre les dossiers (inbox, sent, drafts, etc.) et les onglets de gestion (templates, campaigns, flows, analytics, segments, settings). Chaque sous-section est un composant separe importe dynamiquement.

L'architecture est riche fonctionnellement: inbox conversationnel avec thread, campagnes email marketing avec A/B test, automation flows avec editeur visuel (react-flow), analytics avec graphiques Recharts, segments RFM, template builder drag-and-drop, et gestion de comptes email multi-provider.

## Points forts

- **Architecture modulaire**: Composants separes (InboxView, CampaignList, CampaignEditor, FlowList, FlowEditor, AnalyticsDashboard, SegmentBuilder, TemplateBuilder, EmailComposer)
- **Inbox conversationnel**: Vue split panel resizable, threads, sidebar client, statuts (NEW/OPEN/PENDING/RESOLVED/CLOSED)
- **Campagnes marketing**: CRUD complet, stats (sent/delivered/opened/clicked/bounced/revenue), envoi, scheduling
- **Automation flows**: Editeur visuel react-flow avec nodes (Email, SMS, Delay, Condition, Trigger), drag-and-drop
- **Analytics**: Graphiques Recharts (BarChart, PieChart), KPIs, top templates, logs recents
- **Segments**: RFM segmentation, segments builtin, compteurs utilisateurs
- **Template builder**: Drag-and-drop blocs (header, text, image, product grid, CTA, divider), preview, compilation HTML
- **Email composer**: Composition inline avec reply-to
- **Multi-comptes**: Gestion de comptes email (Resend, SMTP), couleurs, signatures
- **A/B Testing**: Modal pour tester 2 sujets avec split percentage
- **Import contacts**: Upload CSV pour mailing list
- **Calendrier campagnes**: Vue calendrier des campagnes planifiees
- **Auth email**: Verification SPF/DKIM/DMARC/BIMI
- **Error Boundary**: EmailErrorBoundary pour gerer les crashs rendering
- **Ribbon actions**: Integration useRibbonAction pour actions contextuelles
- **Dynamic imports**: FlowEditor et AnalyticsDashboard charges dynamiquement (SSR disabled)

## Points faibles identifies

1. **Fichier monolithique**: page.tsx est trop gros (~700+ lignes) avec beaucoup d'etats et de logique, devrait etre decoupe
2. **Pas de Server Component**: Le fichier principal est `'use client'` sans `page.tsx` wrapper server pour l'auth
3. **Auth manquante**: Pas de verification session/role server-side (contrairement a la telephonie)
4. **Pas de `force-dynamic`**: Pas de directive pour forcer le rendu dynamique
5. **Quelques textes hardcodes**: "Something went wrong", "Try Again" dans ErrorBoundary
6. **Nombreux etats**: 30+ useState dans le composant principal, risque de re-renders excessifs
7. **Loading state**: Chargement initial fait 3 fetches en parallele mais pas de Suspense
8. **FlowEditor SSR disabled**: Charge via dynamic import car depend de react-flow (normal mais a noter)
9. **Console.error dans catch**: Quelques `console.error` restants
10. **Pas de pagination**: Les logs et sent emails charges avec limit fixe (100)

## Scores par sous-page (via query params)

### Dossiers email (folder=)

| # | Page | Route | Score | Notes |
|---|------|-------|-------|-------|
| 1 | Inbox | /admin/emails?folder=inbox | 88 | Split panel, conversations, threads, recherche, statuts |
| 2 | Sent | /admin/emails?folder=sent | 84 | Liste emails envoyes, pas de pagination |
| 3 | Drafts | /admin/emails?folder=drafts | 80 | Vue basique, brouillons |
| 4 | Deleted | /admin/emails?folder=deleted | 80 | Vue corbeille |
| 5 | Junk | /admin/emails?folder=junk | 80 | Vue spam |
| 6 | Notes | /admin/emails?folder=notes | 80 | Notes internes |
| 7 | Archive | /admin/emails?folder=archive | 80 | Archives |
| 8 | Search | /admin/emails?folder=search | 82 | Recherche globale |

### Onglets gestion (tab=)

| # | Page | Route | Score | Notes |
|---|------|-------|-------|-------|
| 9 | Templates | /admin/emails?tab=templates | 88 | CRUD, template builder drag-drop, preview HTML |
| 10 | Campaigns | /admin/emails?tab=campaigns | 90 | CRUD, stats detaillees, A/B test, scheduling, calendrier |
| 11 | Flows | /admin/emails?tab=flows | 91 | Editeur visuel react-flow, 8 triggers, 5 types de nodes |
| 12 | Analytics | /admin/emails?tab=analytics | 87 | Recharts, KPIs, periodes, top templates |
| 13 | Segments | /admin/emails?tab=segments | 85 | RFM, builtin, compteurs, pas de creation custom |
| 14 | Mailing List | /admin/emails?tab=mailing-list | 84 | Import CSV, ajout contact, variables |
| 15 | Settings | /admin/emails?tab=settings | 86 | Multi-comptes, auth SPF/DKIM/DMARC, lazy load |

## Composants principaux

| Composant | Fichier | Lignes | Fonction |
|-----------|---------|--------|----------|
| EmailsPage | page.tsx | ~700+ | Orchestrateur principal, tabs, modals |
| InboxView | inbox/InboxView.tsx | ~250 | Liste conversations, recherche, statuts |
| ConversationThread | inbox/ConversationThread.tsx | ~300 | Thread emails, replies, notes, sidebar client |
| CustomerSidebar | inbox/CustomerSidebar.tsx | ~200 | Info client, loyalty, historique |
| CampaignList | campaigns/CampaignList.tsx | ~200 | Liste campagnes, CRUD, envoi |
| CampaignEditor | campaigns/CampaignEditor.tsx | ~400 | Editeur campagne, audience, scheduling |
| FlowList | flows/FlowList.tsx | ~200 | Liste flows automation |
| FlowEditor | flows/FlowEditor.tsx | ~500 | Editeur visuel react-flow |
| EmailNode | flows/nodes/EmailNode.tsx | - | Node email dans flow |
| SMSNode | flows/nodes/SMSNode.tsx | - | Node SMS dans flow |
| DelayNode | flows/nodes/DelayNode.tsx | - | Node delai dans flow |
| ConditionNode | flows/nodes/ConditionNode.tsx | - | Node condition dans flow |
| TriggerNode | flows/nodes/TriggerNode.tsx | - | Node declencheur dans flow |
| AnalyticsDashboard | analytics/AnalyticsDashboard.tsx | ~300 | Graphiques Recharts, KPIs |
| SegmentBuilder | segments/SegmentBuilder.tsx | ~150 | Segments RFM et builtin |
| TemplateBuilder | TemplateBuilder.tsx | ~300 | Drag-drop template builder |
| CampaignCalendar | CampaignCalendar.tsx | ~200 | Vue calendrier campagnes |
| EmailComposer | compose/EmailComposer.tsx | ~250 | Composition email inline |

## API Routes utilisees

- `/api/admin/emails` (GET) - Liste templates
- `/api/admin/emails/logs` (GET) - Logs d'envoi
- `/api/admin/emails/settings` (GET/PUT) - Parametres email
- `/api/admin/emails/accounts` (GET/POST/PUT/DELETE) - Comptes email
- `/api/admin/emails/campaigns` (GET/POST/PUT/DELETE) - Campagnes
- `/api/admin/emails/campaigns/[id]/send` (POST) - Envoi campagne
- `/api/admin/emails/flows` (GET/POST/PUT/DELETE) - Flows automation
- `/api/admin/emails/segments` (GET) - Segments
- `/api/admin/emails/analytics` (GET) - Donnees analytics
- `/api/admin/emails/compose` (POST) - Envoi email compose
- `/api/admin/emails/conversations` (GET) - Conversations inbox
- `/api/admin/emails/conversations/[id]` (GET/PUT) - Detail conversation
- `/api/admin/emails/mailing-list` (GET/POST) - Mailing list
- `/api/admin/emails/mailing-list/import` (POST) - Import CSV
- `/api/admin/emails/ab-test` (POST) - A/B test

## Modeles Prisma utilises

EmailTemplate, EmailLog, EmailConversation, InboundEmail, OutboundReply, EmailCampaign, EmailCampaignRecipient, EmailFlow, EmailFlowNode, EmailFlowEdge, EmailAccount, MailingListContact, SiteSetting, User

## Recommandations prioritaires

1. **P0**: Ajouter verification auth server-side (creer un wrapper page.tsx avec auth + redirect)
2. **P1**: Decouper page.tsx monolithique en sous-composants (trop de state dans un seul composant)
3. **P1**: Ajouter `export const dynamic = 'force-dynamic'` dans un wrapper server
4. **P2**: Ajouter pagination sur les logs et sent emails
5. **P2**: Remplacer les textes hardcodes anglais par des cles i18n
6. **P2**: Optimiser les re-renders (30+ useState, considerer useReducer)
7. **P3**: Ajouter un loading skeleton/Suspense pour le chargement initial
8. **P3**: Supprimer les console.error restants
