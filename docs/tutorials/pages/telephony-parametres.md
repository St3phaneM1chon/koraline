# Telephonie - Parametres

**Route**: `/admin/telephonie/parametres`
**Score**: 91/100 (A-)
**Fichiers**: `parametres/page.tsx`, `parametres/ParametresClient.tsx`

## Fonctionnalites
- 7 sections de configuration dans des SectionCards:
  1. **Codecs audio**: opus, G.711, G.722, G.729 (checkboxes)
  2. **Politique d'enregistrement**: tout, entrant, sortant, aucun (radio)
  3. **Musique d'attente**: URL + bouton lecture preview (5s)
  4. **Sonnerie**: 5 presets (default, classic, modern, soft, urgent)
  5. **E911**: toggle + adresse/ville/province/code postal + validation via Telnyx
  6. **Fuseau horaire**: 13 options (Canada, US, Europe)
  7. **Heures d'ouverture**: 7 jours avec start/end time inputs
- Sauvegarde par section (bouton Save individuel)
- Validation E911 via API externe avec correction d'adresse
- Support dark mode complet

## Architecture
- Server Component: Prisma findMany SiteSetting module='voip'
- Client Component: map key-value, sauvegarde unitaire ou par section

## API
- PUT `/api/admin/voip/settings` (key/value/module)
- POST `/api/admin/voip/e911` (validation adresse)
