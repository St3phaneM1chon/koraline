# Ads YouTube

**Route**: `/admin/media/ads-youtube`
**Fichier**: `src/app/admin/media/ads-youtube/page.tsx`
**Score**: **A** (92/100)

## Description
Page de configuration YouTube Ads. Utilise le composant partage `AdsPlatformDashboard` avec `platform="youtube"`.

## Fonctionnalites
- Dashboard publicitaire YouTube complet (delegue au composant AdsPlatformDashboard)
- Gestion des campagnes, budgets, performances

## Composants
- `AdsPlatformDashboard` (`platform="youtube"`)

## Notes Techniques
- 5 lignes seulement -- toute la logique est dans le composant partage
- Server component (pas de `use client`)
