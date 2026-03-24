# Telephonie - Connexions

**Route**: `/admin/telephonie/connexions`
**Score**: 87/100 (B+)
**Fichiers**: `connexions/page.tsx`, `connexions/ConnectionsClient.tsx`

## Fonctionnalites
- 2 providers: Telnyx et VoIP.ms
- Configuration: API Key + API Secret (champs password)
- Toggle actif/inactif
- Test de connexion
- Suppression avec confirmation
- Status: icones Wifi/WifiOff, checkmarks API Key/Secret
- Compteur de numeros par provider

## Architecture
- Server Component: listVoipConnections() depuis lib/voip/connection
- Client Component: CRUD via API avec CSRF

## API
- POST `/api/admin/voip/connections` (configurer)
- PUT `/api/admin/voip/connections` (tester)
- DELETE `/api/admin/voip/connections?provider=`
