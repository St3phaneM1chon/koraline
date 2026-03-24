# Emails - Segments

**Route**: `/admin/emails?tab=segments`
**Score**: 85/100 (B)
**Fichiers**: `page.tsx`, `segments/SegmentBuilder.tsx`

## Fonctionnalites
- Segments RFM (Recency, Frequency, Monetary): segments automatiques bases sur le comportement d'achat
- Segments builtin: segments predefinies (VIP, nouveaux, inactifs, etc.)
- Compteur total utilisateurs
- Compteur par segment
- Icones: Users, Crown, Mail, Globe, TrendingUp, Zap
- Couleurs par segment

## Architecture
- SegmentBuilder: fetch segments via API, affichage en grille
- Types: 'rfm', 'builtin', 'custom'

## Problemes
- Pas de creation de segment custom (lecture seule)
- Pas de detail/drill-down dans un segment

## API
- GET `/api/admin/emails/segments`
