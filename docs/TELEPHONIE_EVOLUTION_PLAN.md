# PLAN D'ÉVOLUTION TÉLÉPHONIE — Attitudes VIP
**Date**: 2026-03-18 | **Version**: 1.0
**Scope**: Système VoIP complet + Intégration Admin + Client 360

---

## 1. ÉTAT ACTUEL — CE QUI EXISTE

### 1.1 Architecture en place
```
APPEL ENTRANT → Telnyx Webhook → call-control.ts
    → IVR (6 options FR/EN/Bilingue, time-aware)
    → Queue (stephane-queue / caroline-queue, 20s timeout)
    → Voicemail (Whisper transcription, push APNS)
    → Recording (dual-channel WAV)

APPEL SORTANT → Power Dialer
    → DNCL check → AMD → Agent connect → Disposition

iOS APP → SIP WebRTC → Telnyx
    → Header (logo + numéro + raccourcis)
    → 5 sous-tabs (Favoris, Récents, Contacts, Clavier, Boite vocale)
```

### 1.2 Modules implémentés (19 fichiers lib/voip)

| Module | Statut | Opérationnel ? |
|--------|--------|---------------|
| call-control.ts | COMPLET | Oui — cerveau du système |
| ivr-engine.ts | COMPLET | Oui — DTMF + time routing |
| queue-engine.ts | COMPLET | Partiel — ring-all ne sonne qu'1 agent |
| voicemail-engine.ts | COMPLET | Oui — transcription + push |
| recording.ts | COMPLET | Oui — dual-channel |
| transcription.ts | COMPLET | Oui — Whisper + GPT summary |
| crm-integration.ts | COMPLET | Partiel — screen pop OK, tags vides |
| power-dialer.ts | COMPLET | Oui — séquentiel avec DNCL |
| transfer-engine.ts | COMPLET | Oui — blind/attended/conference |
| dncl.ts | COMPLET | Oui — CRTC compliant |
| webhook-dispatcher.ts | COMPLET | Oui — HMAC + retry |
| agent-assist.ts | COMPLET | **Non branché** au flux live |
| live-sentiment.ts | COMPLET | **Non branché** au flux live |
| live-scoring.ts | COMPLET | **Non branché** + pas persisté |
| coaching-engine.ts | COMPLET | Partiel — pas de scoring post-session |
| keyword-detection.ts | COMPLET | **API config manquante** |
| conversational-ivr.ts | COMPLET | **Non branché** à call-control |
| post-call-survey.ts | PARTIEL | Helpers seulement, pas de flux IVR |
| call-quality-monitor.ts | COMPLET | Client-side uniquement (WebRTC) |

### 1.3 Pages Admin existantes (24 pages sous /admin/telephonie)
Dashboard, Journal d'appels, Numéros, Extensions, Groupes, IVR Builder, Messagerie vocale, Enregistrements, Connexions, Paramètres, Campagnes, Coaching, Conférence, Transferts, Sondages, Wallboard, Webhooks, Analytics (Hub + Appels + Agents + Queues + Speech)

### 1.4 Lacunes critiques identifiées

| # | Problème | Impact |
|---|----------|--------|
| 1 | Conversational IVR (GPT) non branché | Les appelants n'ont que le DTMF |
| 2 | RING_ALL ne sonne qu'1 agent | Les appels ne sonnent pas vraiment chez tous |
| 3 | Agent Assist non connecté au streaming | Pas de suggestions live pendant l'appel |
| 4 | Live Scoring pas persisté en DB | Scores perdus à la fin de l'appel |
| 5 | Post-Call Survey non intégré à l'IVR | Pas de sondage DTMF après l'appel |
| 6 | Pas de CRM Activity auto post-appel | L'appel n'apparaît pas dans la timeline client |
| 7 | Transcription hardcodée FR | Appels EN transcrits avec hint FR |
| 8 | Hold music absent | Silence pendant l'attente en queue |
| 9 | Screen pop tags/notes vides | Pas de contexte client à l'agent |
| 10 | Caroline sans mobile/email | Pas d'urgence nuit pour Caroline |

---

## 2. RECOMMANDATIONS — 8 CATÉGORIES

---

### 2.1 EXPÉRIENCE CLIENT (IVR, Attente, Callback)

#### 2.1.1 IVR Conversationnel — Brancher le GPT
**Priorité**: HAUTE | **Effort**: 2-3h
- Le module `conversational-ivr.ts` est complet mais jamais appelé
- Ajouter un toggle dans `phone-system-config.ts`: `useConversationalIvr: true`
- Dans `call-control.ts > routeInboundCall()`, si activé: instancier ConversationalIVR et utiliser `processInput()` au lieu du DTMF gather
- Le DTMF reste en fallback si GPT est indisponible (déjà codé)
- **Résultat**: Le client parle naturellement au lieu d'appuyer sur des touches

#### 2.1.2 Callback automatique en file d'attente
**Priorité**: HAUTE | **Effort**: 4-6h
- Quand la queue dépasse 60s d'attente: proposer un callback
- TTS: "Votre appel est important. Appuyez sur 1 pour être rappelé automatiquement dès qu'un agent est disponible."
- Créer `callback-scheduler.ts`:
  - Enregistrer le numéro + queue + position + heure
  - Quand un agent se libère: appeler le client automatiquement
  - Limiter à 3 tentatives, puis voicemail
- Ajouter table Prisma `QueueCallback` (phoneNumber, queueId, requestedAt, calledBackAt, status)
- **Résultat**: Plus de client qui raccroche par impatience

#### 2.1.3 Musique d'attente réelle
**Priorité**: MOYENNE | **Effort**: 2h
- Actuellement: TTS position announcements seulement, silence entre
- Utiliser Telnyx `audio_url` pour jouer un fichier MP3/WAV entre les annonces
- Upload 2-3 fichiers musique libre de droits dans un bucket S3/Azure Blob
- Config dans `phone-system-config.ts`: `holdMusicUrl: 'https://...'`
- **Résultat**: Attente professionnelle au lieu du silence

#### 2.1.4 Routage VIP / Client prioritaire
**Priorité**: MOYENNE | **Effort**: 3-4h
- Lookup le caller number dans la DB `User` avant de router
- Si le client a `loyaltyTier: 'VIP'` ou `lifetimePoints > 10000`:
  - Annoncer "Merci d'être un membre VIP"
  - Placer en priorité dans la queue (priority -1)
  - Skip l'IVR et transférer directement à Stéphane
- Modifier `queue-engine.ts` pour supporter la priorité par appel
- **Résultat**: Les meilleurs clients ne font jamais la queue

#### 2.1.5 Greeting audio personnalisé (upload WAV)
**Priorité**: BASSE | **Effort**: 3h
- Permettre d'uploader des fichiers audio WAV/MP3 pour les greetings IVR au lieu du TTS
- Ajouter champ `greetingUrl` dans IvrMenu (existe déjà dans le schema!)
- Page admin pour upload + preview
- Fallback TTS si pas d'audio uploadé
- **Résultat**: Voix humaine professionnelle au lieu du robot TTS

#### 2.1.6 IVR multilingue automatique
**Priorité**: BASSE | **Effort**: 2h
- Détecter la langue du caller via le numéro composé (déjà fait: FR/EN/Bilingue)
- Ajouter: détecter par le numéro source (caller ID +1-416/905 = probable EN, +1-514/438/819 = probable FR)
- Enrichir dans `call-control.ts` avant routeInboundCall
- **Résultat**: Moins de clients qui doivent choisir leur langue

---

### 2.2 PRODUCTIVITÉ AGENT (Softphone, Screen Pop, Notes)

#### 2.2.1 Screen Pop enrichi (fiche client complète)
**Priorité**: HAUTE | **Effort**: 4h
- `crm-integration.ts > screenPop()` retourne déjà: nom, numéro, historique appels, commandes récentes
- **Manque**: tags, notes, loyauté tier, deals CRM, tickets ouverts, dernière commande, panier abandonné
- Modifier `screenPop()` pour inclure:
  ```
  tags: user.tags (depuis CrmLead ou User)
  loyaltyTier: user.loyaltyTier
  openDeals: CrmDeal[].where(status: OPEN)
  openTickets: InboxConversation[].where(status: OPEN)
  lastOrder: Order.findFirst(orderBy: createdAt desc)
  abandonedCart: user.cart.where(status: ABANDONED)
  customerNotes: CustomerNote[].last(5)
  ```
- iOS: afficher le screen pop sur InCallView quand un appel entrant est décroché
- **Résultat**: L'agent sait tout sur le client avant de dire "Bonjour"

#### 2.2.2 Notes d'appel avec disposition
**Priorité**: HAUTE | **Effort**: 3h
- `CallLog` a déjà les champs `agentNotes`, `disposition`, `tags`
- Créer un formulaire de wrap-up post-appel (iOS + Admin web):
  - Disposition dropdown: Résolu, Callback requis, Escaladé, Vente, Information, Spam
  - Notes texte libre
  - Tags multi-select (Commande, Retour, Facturation, Technique, Plainte)
  - Bouton "Créer tâche de suivi" → CrmTask
- Timer wrap-up configurable (30s par défaut, extensible)
- **Résultat**: Chaque appel est documenté et actionnable

#### 2.2.3 Scripts d'appel dynamiques
**Priorité**: MOYENNE | **Effort**: 4h
- Selon l'intent IVR (ventes, support, facturation):
  - Afficher un script adapté à l'agent
  - Questions à poser, objections à anticiper, promotions en cours
- Intégrer avec `agent-assist.ts` qui a déjà la logique GPT
- Brancher agent-assist au streaming transcription (lacune #3)
- **Résultat**: Même un nouvel employé suit le bon processus

#### 2.2.4 Click-to-Call depuis chaque page admin
**Priorité**: MOYENNE | **Effort**: 2h
- Le module `crm-integration.ts > clickToCall()` existe
- Ajouter un composant `<ClickToCallButton number={phone} />` réutilisable
- L'intégrer dans: fiche client, fiche lead CRM, commandes, factures
- Sur clic: appel sortant via Telnyx + screen pop auto
- **Résultat**: Appeler un client en 1 clic depuis n'importe où dans l'admin

---

### 2.3 IA & ANALYTICS (Sentiment, Transcription, Coaching)

#### 2.3.1 Brancher Agent Assist au flux live
**Priorité**: HAUTE | **Effort**: 3h
- `agent-assist.ts` attend des appels `feedTranscript()` mais rien ne le nourrit
- Dans `call-control.ts > handleTranscription()`: instancier AgentAssist et appeler `feedTranscript()` à chaque segment
- Envoyer les suggestions via WebSocket au softphone iOS/web
- Types de suggestions: réponse, knowledge, action, warning, upsell
- **Résultat**: L'IA chuchote les bonnes réponses à l'agent en temps réel

#### 2.3.2 Résumé d'appel automatique (post-call)
**Priorité**: HAUTE | **Effort**: 2h
- `transcription.ts > generateCallSummary()` existe et fonctionne (GPT-4o-mini)
- Déclencher automatiquement après chaque appel:
  - Dans `handleCallHangup()`: si recording exists, attendre transcription, puis générer summary
  - Sauvegarder dans `CallLog.summary` (ajouter champ si manquant) ou `CallTranscription.analysis`
  - Pousser le résumé dans `CrmActivity` (voir 2.4.1)
- **Résultat**: Résumé IA de chaque appel sans effort humain

#### 2.3.3 Persistance du Live Scoring en DB
**Priorité**: MOYENNE | **Effort**: 1h
- `live-scoring.ts` calcule 6 critères mais ne sauvegarde rien
- Après `getFinalScorecard()`: sauvegarder dans Prisma
  - Créer table `CallQualityScore` ou utiliser `CoachingScore` existant
  - Lier à CallLog via callLogId
- Dashboard coaching: afficher scores par agent, par semaine
- **Résultat**: Données de qualité exploitables pour le management

#### 2.3.4 Sentiment analysis lié au Client 360
**Priorité**: MOYENNE | **Effort**: 2h
- `live-sentiment.ts` calcule le sentiment mais il est perdu
- Sauvegarder le `overallSentiment` dans `CallLog.sentiment` (ajouter champ)
- Agréger par client: "Ce client a eu 3 appels négatifs ce mois"
- Alert automatique si 2+ appels négatifs consécutifs → CrmTask "Appeler pour rétention"
- **Résultat**: Identifier les clients à risque de churn

#### 2.3.5 Détection de langue automatique pour transcription
**Priorité**: MOYENNE | **Effort**: 1h
- Actuellement hardcodé `language: 'fr'` dans transcription.ts et voicemail-engine.ts
- Utiliser la langue du menu IVR (stockée dans CallLog ou call state)
- Si Toronto (EN): `language: 'en'`, si Montréal (FR): `language: 'fr'`
- Whisper gère automatiquement si `language` n'est pas passé (auto-detect)
- **Résultat**: Transcriptions précises en anglais et français

#### 2.3.6 Coaching IA post-session
**Priorité**: BASSE | **Effort**: 4h
- Après une session de coaching (`coaching-engine.ts`):
  - Transcrire l'appel complet
  - GPT analyse: points forts, points à améliorer, suggestions
  - Créer `CoachingScore` avec les 6 critères du live-scoring
  - Envoyer rapport au superviseur par email
- **Résultat**: Formation continue basée sur les données

---

### 2.4 CRM & CLIENT 360 (Le plus gros chantier)

#### 2.4.1 Création automatique de CRM Activity post-appel
**Priorité**: CRITIQUE | **Effort**: 3h
- Après chaque appel (handleCallHangup):
  ```typescript
  await prisma.crmActivity.create({
    type: 'CALL',
    contactId: callLog.clientId,
    performedById: agent.userId,
    dealId: activeDeal?.id,
    leadId: activeLead?.id,
    description: callSummary || `Appel ${direction} ${duration}s`,
    metadata: { callLogId, sentiment, disposition, tags }
  })
  ```
- L'appel apparaît immédiatement dans la timeline du client
- **Résultat**: Chaque interaction téléphonique est tracée dans le CRM

#### 2.4.2 Vue Client 360 enrichie (onglet Téléphonie)
**Priorité**: CRITIQUE | **Effort**: 6-8h
- Page `/admin/customers/[id]` — ajouter un onglet "Communications"
- Sous-sections:
  - **Appels** : historique complet (date, durée, agent, disposition, recording player inline)
  - **Voicemails** : messages laissés par ce client (player + transcription)
  - **SMS** : historique des SMS envoyés/reçus
  - **Emails** : derniers emails (lien vers InboxConversation)
  - **Résumés IA** : synthèses d'appels générées par GPT
- Données depuis: CallLog (clientId), Voicemail (clientId), InboxConversation (contactId)
- **Résultat**: Vue 360° complète — tout l'historique de communication du client en un seul endroit

#### 2.4.3 Timeline unifiée multi-canal
**Priorité**: HAUTE | **Effort**: 6h
- Composant `<UnifiedTimeline contactId={id} />` réutilisable
- Fusionner chronologiquement:
  - CrmActivity (type CALL, EMAIL, SMS, NOTE, MEETING)
  - Order (commandes du client)
  - CallLog (avec mini-player recording)
  - Voicemail (avec transcription)
  - InboxConversation.messages
  - LoyaltyTransaction (points gagnés/dépensés)
- Filtrable par type, par date, par agent
- **Résultat**: L'agent voit TOUTE l'histoire du client en un scroll

#### 2.4.4 Lien automatique caller → client (identification)
**Priorité**: HAUTE | **Effort**: 2h
- Quand un appel entre, `crm-integration.ts > screenPop()` cherche déjà le client par numéro
- Améliorer le matching:
  - Chercher aussi dans `CrmLead.phone` (pas seulement User.phone)
  - Normaliser les 2 numéros en E.164 avant comparaison
  - Si pas trouvé: proposer "Créer un nouveau contact?" dans le screen pop
  - Si trouvé: lier automatiquement `CallLog.clientId`
- **Résultat**: 95%+ des appels entrants sont automatiquement liés au bon client

#### 2.4.5 Score d'engagement client
**Priorité**: MOYENNE | **Effort**: 3h
- Calculer un score composite par client:
  - Fréquence d'appel (récent = +points)
  - Sentiment moyen des appels (+/-)
  - Nombre de commandes (valeur totale)
  - Loyauté tier
  - Tickets ouverts (négatif)
  - NPS/CSAT responses
- Afficher sur la fiche client comme badge coloré
- Trier les clients par score d'engagement décroissant
- **Résultat**: Prioriser les actions sur les clients les plus engagés ou à risque

#### 2.4.6 Consentement et préférences communication
**Priorité**: MOYENNE | **Effort**: 2h
- Table `ConsentRecord` existe dans le schema CRM
- Afficher sur la fiche client:
  - Consentement appel enregistré: oui/non/date
  - Consentement SMS marketing: oui/non
  - Consentement email: oui/non
  - Liste DNC interne: oui/non
  - Heures de contact préférées
  - Langue préférée
- Respecter automatiquement lors des campagnes dialer
- **Résultat**: Conformité PIPEDA + respect des préférences client

---

### 2.5 ADMIN & REPORTING (Dashboards, KPIs, SLA)

#### 2.5.1 Dashboard temps réel enrichi
**Priorité**: HAUTE | **Effort**: 4h
- Le wallboard existe mais manque de métriques clés
- Ajouter les 12 KPIs standards:

| KPI | Cible | Source |
|-----|-------|--------|
| Service Level (80/20) | 80% répondu en 20s | CallLog.waitTime |
| ASA (Average Speed of Answer) | < 30s | CallLog.waitTime.avg |
| Abandon Rate | < 5% | CallLog.status = MISSED / total |
| FCR (First Call Resolution) | > 70% | CallLog.disposition = 'resolved' |
| AHT (Average Handle Time) | < 4min | CallLog.duration.avg |
| Occupancy Rate | 70-85% | time_in_call / time_available |
| CSAT | > 4.2/5 | CallSurvey.responses.avg |
| Transfer Rate | < 15% | CallLog.status = TRANSFERRED |
| Voicemail Rate | < 10% | CallLog.status = VOICEMAIL / total |
| Calls per Agent per Day | 25-40 | CallLog.count by agentId/day |
| Callback Completion | > 90% | QueueCallback.calledBackAt != null |
| Recording Compliance | 100% | CallRecording.count / CallLog.count |

- Vue par période: aujourd'hui, cette semaine, ce mois, custom
- **Résultat**: Vision complète de la performance en un coup d'œil

#### 2.5.2 Rapports automatiques par email
**Priorité**: MOYENNE | **Effort**: 3h
- Rapport quotidien (8h) à Stéphane:
  - Appels du jour précédent (entrants/sortants/manqués)
  - Voicemails non écoutés
  - Clients mécontents (sentiment négatif)
  - Top 5 raisons d'appel
- Rapport hebdomadaire (lundi 9h):
  - KPIs de la semaine vs objectifs
  - Tendances (volume, durée, satisfaction)
  - Agents: performance comparative
- Générer en HTML via email template existant
- **Résultat**: Stéphane suit la performance sans ouvrir l'admin

#### 2.5.3 Alertes proactives
**Priorité**: MOYENNE | **Effort**: 2h
- Conditions d'alerte (push + email):
  - Voicemail non écouté > 2h
  - 3+ appels manqués consécutifs
  - Client VIP en attente > 30s
  - Agent déconnecté pendant heures d'affaires
  - Volume d'appels > 150% de la moyenne
  - Sentiment négatif sur 3+ appels consécutifs
- Via webhook-dispatcher ou notification iOS directe
- **Résultat**: Réaction rapide aux problèmes

---

### 2.6 CONFORMITÉ & SÉCURITÉ (PIPEDA, CRTC)

#### 2.6.1 Consentement d'enregistrement double-optin
**Priorité**: HAUTE | **Effort**: 1h
- Déjà en place dans les greetings IVR: "Cet appel peut être enregistré"
- Ajouter: log du consentement dans CallLog.consentGiven (boolean + timestamp)
- Si le caller dit "non" ou appuie sur une touche: NE PAS enregistrer
- Conformité PIPEDA Art. 7 + Code criminel sec. 184
- **Résultat**: Preuve de consentement pour chaque enregistrement

#### 2.6.2 Rétention et purge automatique des enregistrements
**Priorité**: HAUTE | **Effort**: 2h
- PIPEDA: ne garder les données que le temps nécessaire
- Policy: 90 jours par défaut, 1 an pour les litiges, 3 ans pour la formation
- Cron job nocturne: supprimer CallRecording + audio où `createdAt < now - retentionDays`
- Configurable par type (standard, formation, litige)
- **Résultat**: Conformité automatique sans intervention manuelle

#### 2.6.3 DNCL — Vérification automatique avant appel sortant
**Priorité**: HAUTE | **Effort**: Déjà fait
- `dncl.ts` est complet et intégré au power-dialer
- Vérifier que click-to-call passe aussi par la vérification DNCL
- Ajouter un warning visuel si le numéro est sur la liste DNC
- **Résultat**: Zero risque d'amende CRTC (15K$/violation)

---

### 2.7 OMNICHANNEL (SMS, Email, Chat)

#### 2.7.1 SMS bidirectionnel intégré
**Priorité**: HAUTE | **Effort**: 6h
- Le webhook `/api/voip/webhooks/sms/route.ts` existe
- Créer `sms-engine.ts`:
  - Envoi SMS via Telnyx Messaging API
  - Réception SMS → InboxConversation (channel: SMS)
  - Templates SMS (confirmation commande, rappel RDV, promo)
  - Opt-out automatique (répondre STOP)
- UI admin: conversation SMS dans l'inbox unifiée
- UI iOS: onglet SMS dans le PhoneTabView
- **Résultat**: Communiquer par SMS depuis le même système

#### 2.7.2 Notifications e-commerce par événement
**Priorité**: MOYENNE | **Effort**: 4h
- Après chaque événement e-commerce, possibilité de SMS:
  - Commande confirmée → SMS "Votre commande #XXX est confirmée"
  - Expédition → SMS "Votre colis est en route, tracking: XXX"
  - Livraison → SMS "Votre colis a été livré"
  - Panier abandonné (24h) → SMS "Vous avez oublié quelque chose?"
- Configurable: on/off par type de notification
- Respecter consentement SMS (ConsentRecord)
- **Résultat**: Communication proactive augmente la satisfaction

#### 2.7.3 Inbox unifiée (tous les canaux)
**Priorité**: MOYENNE | **Effort**: 8h
- `InboxConversation` supporte déjà: EMAIL, SMS, PHONE, CHAT, WHATSAPP
- Créer une vue admin `/admin/crm/inbox` unifiée:
  - Toutes les conversations de tous les canaux
  - Filtrable par canal, statut, agent assigné
  - Répondre directement (email, SMS) depuis la même interface
  - Voir le contexte client (mini fiche 360)
- **Résultat**: Un seul endroit pour toutes les communications

---

### 2.8 AUTOMATION & WORKFLOWS

#### 2.8.1 Workflow post-appel automatique
**Priorité**: HAUTE | **Effort**: 4h
- Après chaque appel, selon la disposition:
  - `resolved` → CrmActivity "Appel résolu" + fermer ticket associé
  - `callback_needed` → CrmTask "Rappeler [client]" assignée à l'agent, due dans 24h
  - `escalated` → Notification superviseur + CrmTask priorité haute
  - `sale` → Ouvrir formulaire de commande pré-rempli avec infos client
  - `complaint` → Créer ticket support + alerte manager
- Configurable via rules engine simple (condition → action)
- **Résultat**: Chaque appel déclenche automatiquement la bonne suite d'actions

#### 2.8.2 Follow-up automatique
**Priorité**: MOYENNE | **Effort**: 3h
- Si un appel entrant est manqué et pas de voicemail:
  - Après 5 min: SMS "Nous avons manqué votre appel. Rappelons-nous? Répondez OUI"
  - Si OUI: ajouter à la queue callback
  - Si pas de réponse en 2h: email "Nous avons essayé de vous joindre"
- Configurable: actif/inactif, délais, templates
- **Résultat**: Aucun client perdu par un appel manqué

#### 2.8.3 Routing intelligent basé sur l'historique
**Priorité**: BASSE | **Effort**: 4h
- Si un client a parlé à Caroline hier et rappelle aujourd'hui:
  - Router directement à Caroline (continuité de service)
- Si un client a un deal CRM actif avec un rep spécifique:
  - Router vers ce rep en priorité
- Lookup dans CallLog (dernier agent) et CrmDeal (rep assigné)
- Fallback: routing normal par menu IVR
- **Résultat**: Le client parle toujours à la même personne

---

## 3. INTÉGRATION AVEC LES SECTIONS ADMIN EXISTANTES

### 3.1 Commerce (Commandes, Clients)
| Intégration | Description |
|-------------|-------------|
| Fiche client → Onglet Communications | Historique appels, voicemails, SMS, emails |
| Fiche commande → Appels liés | CallLog où disposition = commande ou notes mentionnent order# |
| Click-to-call | Bouton sur chaque fiche client/commande |
| Screen pop | Afficher dernière commande + statut livraison quand le client appelle |

### 3.2 Catalogue (Produits)
| Intégration | Description |
|-------------|-------------|
| Agent Assist | Quand le client mentionne un produit, afficher fiche produit à l'agent |
| Scripts vente | Scripts adaptés par catégorie de produit |
| Upsell suggestions | IA suggère des produits complémentaires pendant l'appel |

### 3.3 Marketing (Campagnes, Blog)
| Intégration | Description |
|-------------|-------------|
| Campagnes téléphoniques | Power dialer lié aux campagnes marketing (audience → liste d'appels) |
| Attribution | Tracker quel canal marketing a généré l'appel (UTM → IVR → CallLog) |
| SMS marketing | Envoyer des promos par SMS aux clients opt-in |

### 3.4 CRM (Leads, Deals, Pipeline)
| Intégration | Description |
|-------------|-------------|
| Lead → Appel | Click-to-call depuis fiche lead |
| Appel → CrmActivity | Auto-log chaque appel dans le pipeline |
| Deal progress | Si l'appel résulte en vente → avancer le deal au stage "Won" |
| Rep 360 | Intégrer stats appels dans le dashboard rep |
| Forecasting | Utiliser volume d'appels pour prédire les ventes |

### 3.5 Comptabilité (Factures)
| Intégration | Description |
|-------------|-------------|
| Facture → Appel | Quand le client appelle pour "facturation", afficher ses factures ouvertes |
| Paiement IVR | Future: paiement par téléphone (PCI compliance avec recording pause) |
| Coût télécom | Intégrer les coûts Telnyx (billableSec) dans la comptabilité |

### 3.6 Emails
| Intégration | Description |
|-------------|-------------|
| Voicemail → Email | Envoyer le voicemail transcrit par email à l'agent |
| Résumé d'appel → Email | Envoyer le résumé IA au client après un appel support |
| Follow-up email | Email automatique post-appel manqué |

### 3.7 Fidélité (Loyalty)
| Intégration | Description |
|-------------|-------------|
| VIP routing | Clients fidèles → queue prioritaire |
| Points bonus | +50 points loyauté pour chaque appel qui résulte en commande |
| Rétention | Alerte si client VIP fait 2+ appels négatifs |

### 3.8 Système (Monitoring, Logs)
| Intégration | Description |
|-------------|-------------|
| Health monitoring | Santé connexion Telnyx dans le monitoring système |
| Audit trail | Chaque action téléphonie dans les logs d'audit |
| Backup | Sauvegarder les enregistrements avec le backup quotidien |

---

## 4. PRIORISATION — ROADMAP

### Phase 1 : Fondations (Semaine 1-2)
- [ ] Brancher Conversational IVR au flux d'appel
- [ ] CRM Activity auto post-appel
- [ ] Vue Client 360 onglet Communications
- [ ] Détection langue auto transcription
- [ ] Consentement d'enregistrement loggé

### Phase 2 : Intelligence (Semaine 3-4)
- [ ] Brancher Agent Assist au streaming
- [ ] Résumé d'appel automatique post-call
- [ ] Persistance Live Scoring en DB
- [ ] Screen Pop enrichi (tags, loyauté, deals)
- [ ] Timeline unifiée multi-canal

### Phase 3 : Automation (Semaine 5-6)
- [ ] Workflow post-appel (disposition → action)
- [ ] Callback automatique en queue
- [ ] Follow-up automatique (SMS + email)
- [ ] Notes + disposition wrap-up form
- [ ] Dashboard KPIs enrichi (12 métriques)

### Phase 4 : Omnichannel (Semaine 7-8)
- [ ] SMS bidirectionnel (envoi + réception)
- [ ] Notifications e-commerce par SMS
- [ ] Inbox unifiée tous canaux
- [ ] Click-to-call partout dans l'admin
- [ ] Routing intelligent historique

### Phase 5 : Excellence (Semaine 9-10)
- [ ] Coaching IA post-session
- [ ] Score d'engagement client
- [ ] Rapports automatiques par email
- [ ] Alertes proactives
- [ ] Hold music + greeting audio custom
- [ ] Sondage post-appel DTMF
- [ ] Rétention/purge enregistrements

---

## 5. MÉTRIQUES DE SUCCÈS

| Métrique | Actuel | Cible Phase 5 |
|----------|--------|---------------|
| % appels liés au dossier client | ~60% | 95%+ |
| Temps moyen de résolution | Inconnu | < 4 min |
| Taux d'abandon | Inconnu | < 5% |
| Satisfaction client (CSAT) | Pas mesuré | > 4.2/5 |
| Appels documentés dans CRM | 0% | 100% |
| Résumés IA générés | 0% | 100% |
| Follow-up automatique | 0% | 90% des manqués |
| Canaux intégrés | 1 (voix) | 4 (voix + SMS + email + chat) |
