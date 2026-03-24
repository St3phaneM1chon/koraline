# Telephonie - Numeros de telephone

**Route**: `/admin/telephonie/numeros`
**Score**: 83/100 (B-)
**Fichiers**: `numeros/page.tsx`, `numeros/PhoneNumbersClient.tsx`

## Fonctionnalites
- Liste des DIDs (Direct Inward Dialing numbers)
- Ajout: numero, nom affiche, pays (CA/US/FR)
- Badge actif/inactif
- Provider associe
- Suppression avec confirmation

## Architecture
- Server Component: auth seulement (pas de data fetching)
- Client Component: useSWR pour charger les numeros

## Problemes
- Pas de chargement Prisma server-side (tout client-side via SWR)
- Pas de formulaire d'edition (seulement ajout et suppression)
- Pas de routing/assignment des numeros

## API
- GET `/api/admin/voip/phone-numbers`
- POST `/api/admin/voip/phone-numbers`
- DELETE `/api/admin/voip/phone-numbers?id=`
