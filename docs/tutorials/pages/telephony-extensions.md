# Telephonie - Extensions SIP

**Route**: `/admin/telephonie/extensions`
**Score**: 82/100 (B-)
**Fichiers**: `extensions/page.tsx`, `extensions/ExtensionsClient.tsx`

## Fonctionnalites
- Liste des extensions SIP avec status colore
- Ajout: extension, SIP username, SIP password, SIP domain, user ID
- Badge status: ONLINE (vert), BUSY (rouge), DND (orange), AWAY (ambre), OFFLINE (gris)
- Suppression avec confirmation
- Domain par defaut: pbx.biocyclepeptides.com

## Architecture
- Server Component: Prisma findMany SipExtension avec user
- Client Component: CRUD via API avec CSRF

## Problemes
- userId en champ texte libre (devrait etre un select d'utilisateurs)
- Pas d'edition (seulement ajout et suppression)
- Texte hardcode "No extensions configured"
