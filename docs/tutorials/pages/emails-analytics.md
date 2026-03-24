# Emails - Analytics

**Route**: `/admin/emails?tab=analytics`
**Score**: 87/100 (B+)
**Fichiers**: `page.tsx`, `analytics/AnalyticsDashboard.tsx`

## Fonctionnalites
- KPIs: total envoyes, bounces, echecs, taux delivery, taux bounce, emails total, campagnes actives, flows actifs
- Graphique barres (Recharts BarChart): emails par jour avec status
- Graphique camembert (Recharts PieChart): top templates par utilisation
- Stats conversations: repartition par status
- Logs recents: 10 derniers envois
- Filtres periode: 7j, 30j, 90j, 1an
- Indicateurs tendance (fleches haut/bas)
- Dynamic import (SSR disabled)

## Architecture
- AnalyticsDashboard: fetch analytics par periode, render Recharts
- Recharts: BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, Legend
- Couleurs: 6 couleurs predefinies

## API
- GET `/api/admin/emails/analytics?period=7d|30d|90d|1y`
