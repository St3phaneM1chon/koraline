# CRM Leads

**URL**: `/admin/crm/leads`
**Fichier**: `src/app/admin/crm/leads/page.tsx`
**Score**: **A (92/100)**

## Description
Page principale de gestion des leads/prospects. Tableau complet avec filtres avances, import CSV, creation manuelle, selection multiple et actions bulk.

## Fonctionnalites
- **Tableau**: Nom, entreprise, score (barre de progression coloree), temperature (icone HOT/WARM/COLD), statut (badge colore), source, agent assigne, dernier contact, DNC
- **Filtres**: Recherche texte, statut, source, temperature
- **Import CSV**: Modal avec parsing automatique des colonnes (name/nom, email/courriel, phone/tel, company/entreprise)
- **Creation manuelle**: Modal avec champs nom, entreprise, email, telephone, source
- **Selection multiple**: Checkbox par ligne + select all
- **Actions bulk**: Changement de statut, recalcul des scores, suppression
- **Pagination**: 20 leads par page avec navigation prev/next

## API Endpoints
| Endpoint | Methode | Usage |
|----------|---------|-------|
| `/api/admin/crm/leads` | GET | Liste paginee avec filtres |
| `/api/admin/crm/leads` | POST | Creer un lead |
| `/api/admin/crm/leads/import` | POST | Import CSV |
| `/api/admin/crm/leads/{id}` | PUT | Mise a jour statut |
| `/api/admin/crm/leads/{id}` | DELETE | Suppression |
| `/api/admin/crm/leads/{id}/score` | POST | Recalcul du score |

## Problemes identifies
- Boutons pagination "Prev"/"Next" hardcodes au lieu de t('common.previous')/t('common.next')
- Texte hardcode "Name is required" dans le modal de creation
- Les actions bulk font N appels paralleles (1 par lead selectionne) au lieu d'un seul appel bulk

## Notes techniques
- 553 lignes - fichier dense mais bien organise
- Composant CreateLeadModal extrait en sous-composant
- Score colore: vert >=70, ambre >=40, gris sinon
- 6 statuts: NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST
- 6 sources: WEB, REFERRAL, IMPORT, CAMPAIGN, MANUAL, PARTNER
