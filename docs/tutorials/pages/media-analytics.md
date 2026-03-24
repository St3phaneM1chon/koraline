# Media Analytics

**Route**: `/admin/media/analytics`
**Fichier**: `src/app/admin/media/analytics/page.tsx` + `MediaAnalyticsClient.tsx`
**Score**: **A** (91/100)

## Description
Page d'analytiques media avec vrais graphiques Recharts. Affiche les KPI (vues, clics, partages, conversions), un graphique tendance journalier (AreaChart), une repartition par plateforme (PieChart), et le top contenu avec BarChart.

## Fonctionnalites
- 4 cartes KPI: vues totales, clics, partages, conversions
- Taux d'engagement moyen affiche
- Filtre par periode: 7, 30, 90, 365 jours
- Graphique AreaChart tendance journaliere (vues, clics, partages)
- Graphique PieChart repartition par plateforme sociale
- Graphique BarChart top 10 contenus avec detail
- Tableau detaille des top contenus avec liens vers les videos
- Support dark mode

## Composants
- `MediaAnalyticsClient` -- composant client Recharts
- `AreaChart`, `BarChart`, `PieChart` -- Recharts
- Suspense + LoadingSpinner (server component wrapper)

## API Endpoints
| Methode | Endpoint | Usage |
|---|---|---|
| GET | `/api/admin/media/analytics?days={n}` | Donnees analytiques completes |

## Problemes Identifies
- Aucun probleme critique
- Les donnees sont chargees cote client (pas de SSR pour les analytics)
- Le composant page.tsx est un server component minimal qui wrappe le client

## Notes Techniques
- Architecture server/client split: page.tsx (server) + MediaAnalyticsClient.tsx (client)
- Recharts pour les graphiques (AreaChart, PieChart, BarChart)
- ~264 lignes (client component)
