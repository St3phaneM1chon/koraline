# Lancer Webex

**Route**: `/admin/media/launch-webex`
**Fichier**: `src/app/admin/media/launch-webex/page.tsx`
**Score**: **B** (83/100)

## Description
Page de lancement rapide pour Cisco Webex. Utilise `PlatformLauncher` avec `platformId="webex"`.

## Fonctionnalites
- Lancement de Webex via PlatformLauncher
- Ribbon actions: upload, delete, play, export

## Composants
- `PlatformLauncher` (`platformId="webex"`)
- `useRibbonAction`

## Notes Techniques
- `use client` -- 25 lignes, meme pattern
