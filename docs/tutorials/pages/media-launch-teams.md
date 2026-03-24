# Lancer Microsoft Teams

**Route**: `/admin/media/launch-teams`
**Fichier**: `src/app/admin/media/launch-teams/page.tsx`
**Score**: **B** (83/100)

## Description
Page de lancement rapide pour Microsoft Teams. Utilise le composant partage `PlatformLauncher` avec l'ID `teams`. Inclut des ribbon actions contextuelles pour l'upload, suppression, lecture et export.

## Fonctionnalites
- Lancement de Microsoft Teams via le composant PlatformLauncher
- Ribbon actions: upload, delete, play, export (affichent des toasts informatifs)

## Composants
- `PlatformLauncher` (partage) -- composant principal
- `useRibbonAction` -- 4 actions registrees

## API Endpoints
Delegues au composant `PlatformLauncher` interne.

## Problemes Identifies
- Code ribbon duplique sur les 5 pages launch-* (pourrait etre factorise)
- Les ribbon actions affichent simplement des toasts "hint" sans action reelle

## Notes Techniques
- `use client` -- 25 lignes
- Pattern identique aux 4 autres pages launch-*
