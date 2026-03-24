# Telephonie - Analytics Hub

**Route**: `/admin/telephonie/analytics`
**Score**: 88/100 (B+)
**Fichiers**: `analytics/page.tsx`, `analytics/AnalyticsHubClient.tsx`

## Fonctionnalites
- Hub de navigation vers 4 sous-pages analytics
- 4 cartes avec icone, titre, description, metrique, lien
- Cartes: Performance Agents, Queues, Appels, Speech Analytics
- Stats server-side: total appels (30j), nb agents, nb queues, nb transcriptions, satisfaction moyenne
- Hover effect avec fleche animee
- Support dark mode

## Architecture
- Server Component: 5 requetes Prisma en parallele (counts + aggregation)
- Client Component: grille de cartes Link

## Sous-pages
- `/admin/telephonie/analytics/agents` - Performance agents (12 metriques, tri)
- `/admin/telephonie/analytics/appels` - Volume et disposition (direction, duration, status bars)
- `/admin/telephonie/analytics/queues` - Performance queues (SLA, ASA, abandon, wait)
- `/admin/telephonie/analytics/speech` - Sentiment, keywords, compliance, word cloud
