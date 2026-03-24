# Telephonie - Transferts (Regles de renvoi)

**Route**: `/admin/telephonie/transferts`
**Score**: 89/100 (B+)
**Fichiers**: `transferts/page.tsx`, `transferts/TransfertsClient.tsx`

## Fonctionnalites
- CRUD regles de renvoi d'appels
- Conditions: toujours, occupe, pas de reponse, indisponible
- Destination: numero externe, extension, messagerie vocale
- Duree de sonnerie configurable (5-60s, slider)
- Toggle actif/inactif par regle
- Selection extension via dropdown avec nom agent

## Architecture
- Server Component: regles stockees dans SiteSetting JSON + extensions Prisma
- Client Component: CRUD avec sauvegarde globale (toutes les regles en un seul JSON)
- Stockage: SiteSetting key='voip:forwarding_rules'

## API
- POST `/api/admin/voip/forwarding` (sauvegarde toutes les regles)
