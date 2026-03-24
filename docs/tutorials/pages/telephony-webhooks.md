# Telephonie - Webhooks

**Route**: `/admin/telephonie/webhooks`
**Score**: 90/100 (A-)
**Fichiers**: `webhooks/page.tsx`, `webhooks/WebhooksClient.tsx`

## Fonctionnalites
- CRUD webhooks pour integrations externes
- 7 evenements: call.started, call.ended, call.missed, voicemail.new, recording.ready, queue.joined, queue.abandoned
- URL + secret HMAC-SHA256 (auto-genere si vide)
- Toggle actif/inactif
- Test de livraison avec resultat
- Log des 10 dernieres livraisons avec status, event, HTTP code, timestamp
- Secret masque avec toggle show/hide
- Badge status (Active/Inactive)

## Architecture
- Server Component: SiteSetting JSON (webhook_configs)
- Client Component: CRUD + persist via SiteSetting API
- Stockage: SiteSetting key='voip:webhook_configs'

## API
- PATCH `/api/admin/voip/settings` (sauvegarde webhook configs dans SiteSetting)
- PUT `/api/admin/voip/settings` (test webhook delivery)
