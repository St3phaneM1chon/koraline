# Lancer Google Meet

**Route**: `/admin/media/launch-google-meet`
**Fichier**: `src/app/admin/media/launch-google-meet/page.tsx`
**Score**: **B** (83/100)

## Description
Page de lancement rapide pour Google Meet. Utilise `PlatformLauncher` avec `platformId="google-meet"`.

## Fonctionnalites
- Lancement de Google Meet via PlatformLauncher
- Ribbon actions: upload, delete, play, export

## Composants
- `PlatformLauncher` (`platformId="google-meet"`)
- `useRibbonAction`

## Notes Techniques
- `use client` -- 25 lignes
- Seule plateforme sans `hasDesktop: true` dans la config du dashboard
