# Emails - Flows (Automation)

**Route**: `/admin/emails?tab=flows`
**Score**: 91/100 (A-)
**Fichiers**: `page.tsx`, `flows/FlowList.tsx`, `flows/FlowEditor.tsx`, `flows/nodes/*.tsx`

## Fonctionnalites
- Liste des flows: nom, trigger, statut actif/inactif, stats (triggered, sent, opened, clicked, revenue)
- 8 triggers: order.created, order.shipped, order.delivered, cart.abandoned, user.registered, user.birthday, winback.eligible, reorder.due
- Editeur visuel react-flow (dynamic import, SSR disabled):
  - 5 types de nodes: TriggerNode, EmailNode, SMSNode, DelayNode, ConditionNode
  - Connexion drag-and-drop entre nodes
  - Configuration de chaque node
- CRUD complet avec activation/desactivation
- Stats: triggered, sent, opened, clicked, revenue par flow

## Architecture
- FlowList: fetch + CRUD via API
- FlowEditor: react-flow avec custom nodes, edges, sauvegarde JSON
- Nodes custom: chacun dans son fichier (EmailNode, SMSNode, etc.)
- Dynamic import pour eviter SSR avec react-flow

## API
- GET/POST/PUT/DELETE `/api/admin/emails/flows`
