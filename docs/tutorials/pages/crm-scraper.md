# Google Maps Scraper

**URL**: `/admin/scraper`
**Fichier**: `src/app/admin/scraper/page.tsx`
**Score**: **A+ (96/100)**

## Description
Scraper Google Maps interactif avec carte, dessin de zones, recherche de commerces, export et integration CRM directe. Page la plus avancee de tout le CRM.

## Fonctionnalites
- **Carte interactive**: Google Maps avec marqueurs, heatmap, Street View
- **Recherche**: Par query + localisation ou region dessinee (cercle, rectangle, polygone)
- **Resultats**: Panel lateral avec liste triable par distance
- **Selection multiple**: Checkbox par resultat + select all/deselect all
- **Export**: CSV et Excel
- **Integration CRM**: Ajout direct des places selectionnees en tant que prospects
- **Jobs Pipeline**: Suivi des jobs de scraping en background
- **Toolbar**: Toggle dessin, heatmap, Street View
- **Responsive**: Layout 70%/30% desktop, empile en mobile

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/scraper/search` | POST | Recherche Google Maps |
| `/api/admin/scraper/export` | POST | Export CSV |
| `/api/admin/scraper/export-excel` | POST | Export Excel |
| `/api/admin/scraper/add-to-crm` | POST | Import dans CRM |

## Composants utilises
- `InteractiveMap` (dynamic import, SSR false)
- `MapProvider`, `SearchPanel`, `ResultsList`, `ScraperToolbar`, `JobsPanel`
- Types partages: `ScrapedPlace`, `DrawnShape`

## Notes techniques
- 396 lignes bien decoupees en composants
- Utilise `useTranslations()` (seule page CRM a ne pas utiliser `useI18n()`)
- Banner CRM success avec lien vers la liste creee
- Support complet dark mode dans les classes CSS
