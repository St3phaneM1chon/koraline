# CRM Communications (Inbox, Campaigns, SMS, Snippets, Knowledge Base, Tickets)

Ce fichier couvre les 7 pages de la sous-section Communications du CRM.

---

## Inbox (Messagerie unifiee)
**URL**: `/admin/crm/inbox` | **Score**: **A (93/100)**

Boite de reception multi-canal avec layout 3 panneaux style Outlook.

**Fonctionnalites**: Panel gauche: liste des conversations avec filtres canal (EMAIL/SMS/PHONE/CHAT/WHATSAPP) et statut (OPEN/PENDING/RESOLVED/CLOSED). Panel central: messages en style chat (bulles entrant/sortant), reponse avec Enter pour envoyer. Panel droit: fiche contact enrichie (score lead, temperature, statut, source, tags, deals actifs), details conversation. SLA deadline avec alerte. Actions: resoudre, fermer, rouvrir.

**API**: GET `/api/admin/crm/inbox`, GET/POST `/api/admin/crm/inbox/{id}`, POST `.../reply`, PUT `.../status`

**Point fort**: Page la plus riche en UX. Fiche contact avec liens vers lead et deals.

---

## Campaigns
**URL**: `/admin/crm/campaigns` | **Score**: **A (92/100)**

Gestion des campagnes multicanal avec stats detaillees et actions start/pause/stop.

**Fonctionnalites**: Creation complete avec criteres de ciblage (statut lead, temperature, score min/max, tags). 4 types: CALL, EMAIL, SMS, MULTI_CHANNEL. 6 statuts avec transitions. Stats par campagne expandables: metriques cles, breakdown par canal, timeline quotidienne mini-chart. Pagination.

**API**: GET/POST `/api/admin/crm/campaigns`, GET `.../stats`, POST `.../start`, PATCH `.../{id}`

**Point fort**: 885 lignes bien decoupees avec composants MetricCard, CampaignRow, CreateCampaignForm.

---

## SMS Campaigns
**URL**: `/admin/crm/sms-campaigns` | **Score**: **B (78/100)**

Campagnes SMS avec suivi sent/delivered/failed/opt-out.

**Fonctionnalites**: Tableau avec stats (recipients, sent, delivered, failed, opt-out). Actions: envoyer, pause, reprendre. Creation avec merge fields ({firstName}, {companyName}).

**API**: GET/POST `/api/admin/crm/sms-campaigns`, POST `.../send`, PUT `.../pause`

**Problemes**: Beaucoup de textes hardcodes en anglais ("New Campaign", "Campaign Name *", "Message", "No campaigns yet").

---

## SMS Templates
**URL**: `/admin/crm/sms-templates` | **Score**: **A (91/100)**

Gestion avancee des templates SMS avec preview en temps reel.

**Fonctionnalites**: Grille de cartes avec preview, compteur caracteres/segments. Detection automatique des variables ({{firstName}}, etc.). Preview live avec valeurs personnalisables. Toggle actif/inactif. CRUD complet. Recherche et filtre actif/inactif. Stats (total, actifs, inactifs).

**API**: GET/POST/PUT/DELETE `/api/admin/crm/sms-templates`

---

## Snippets
**URL**: `/admin/crm/snippets` | **Score**: **A- (88/100)**

Bibliotheque de textes reutilisables avec raccourcis pour email, SMS, chat.

**Fonctionnalites**: Grille de cartes par categorie (general, email, sms, chat). Shortcut personnalisable (ex: /greet). Toggle actif/inactif. Copier dans le presse-papier. CRUD complet avec modal. Recherche et filtre categorie.

**API**: GET/POST/PUT/DELETE `/api/admin/crm/snippets`

---

## Knowledge Base
**URL**: `/admin/crm/knowledge-base` | **Score**: **A- (88/100)**

Base de connaissances avec articles markdown, categories et metriques.

**Fonctionnalites**: Tableau avec titre, categorie, statut (DRAFT/PUBLISHED/ARCHIVED), vues, helpfulness (yes/no), tags, date. Creation avec editeur markdown. Filtres recherche, statut, categorie. Pagination. Categories chargees via header HTTP X-KB-Categories.

**API**: GET/POST `/api/admin/crm/knowledge-base`

---

## Tickets
**URL**: `/admin/crm/tickets` | **Score**: **B+ (85/100)**

Systeme de tickets CRM avec priorite, categorie et assignation.

**Fonctionnalites**: Numero de ticket, sujet, statut, priorite avec codage couleur, categorie, contact, assignation. Creation et gestion. Ce fichier utilise le pattern standard avec filtres et tableau.

**API**: GET/POST `/api/admin/crm/tickets`
