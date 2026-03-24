# Lancer Zoom

**Route**: `/admin/media/launch-zoom`
**Fichier**: `src/app/admin/media/launch-zoom/page.tsx`
**Score**: **B** (83/100)

## Description
Page de lancement rapide pour Zoom. Pattern identique a launch-teams avec le composant `PlatformLauncher` parametre sur `zoom`.

## Fonctionnalites
- Lancement de Zoom via PlatformLauncher
- Ribbon actions: upload, delete, play, export

## Composants
- `PlatformLauncher` (`platformId="zoom"`)
- `useRibbonAction` -- 4 actions

## Problemes Identifies
- Meme duplication que les autres pages launch-*

## Notes Techniques
- `use client` -- 25 lignes
