# CRM Dashboard

**URL**: `/admin/crm`
**Fichier**: `src/app/admin/crm/page.tsx`
**Score**: **A- (88/100)**

## Description
Tableau de bord principal du CRM affichant les KPI cles (leads, deals, valeur pipeline, taux de conversion), un graphique funnel du pipeline et les activites recentes.

## Fonctionnalites
- 4 cartes KPI cliquables (leads totaux avec ventilation HOT/WARM/COLD, deals ouverts, valeur totale + ponderee, win rate)
- Graphique funnel horizontal du pipeline par etape (nom, nombre, valeur)
- Timeline des activites recentes avec icones par type (CALL, EMAIL, SMS, MEETING, NOTE)
- Navigation rapide vers 6 pages CRM principales
- Formatage devise CAD localise

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/crm/leads?limit=1&page=1` | GET | Total leads |
| `/api/admin/crm/deals/stats` | GET | Stats deals |
| `/api/admin/crm/activities?limit=8` | GET | Activites recentes |
| `/api/admin/crm/leads?limit=1&temperature=HOT` | GET | Comptage HOT |
| `/api/admin/crm/leads?limit=1&temperature=WARM` | GET | Comptage WARM |
| `/api/admin/crm/leads?limit=1&temperature=COLD` | GET | Comptage COLD |

## Composants utilises
- Icones lucide-react (Users, Handshake, DollarSign, Target, etc.)
- `useI18n()` pour les traductions
- `useRouter()` pour la navigation

## Problemes identifies
- **Performance**: 6 appels API au chargement (3 paralleles + 3 paralleles). Devrait etre un seul endpoint `/api/admin/crm/dashboard-stats`.
- **Erreur silencieuse**: Le catch vide ne notifie pas l'utilisateur en cas d'echec.
- `newThisWeek` est hardcode a 0 (commentaire "Would need date filter on API").

## Notes techniques
- Client component (`'use client'`)
- Skeleton loader pendant le chargement
- Intl.NumberFormat pour le formatage devise
- Formatage temps relatif (justNow, Xm, Xh, Xd)
