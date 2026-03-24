# CRM Sales (Quotes, Forecast, Leaderboard, Quotas, Approvals, Contracts, Exchange Rates)

Ce fichier couvre les 7 pages de la sous-section Sales du CRM.

---

## Quotes (Devis)
**URL**: `/admin/crm/quotes` | **Score**: **A (90/100)**

Gestion complete des devis lies aux deals. Creation avec ligne d'items, calcul automatique sous-total/taxe/total, envoi, visualisation en panel lateral.

**Fonctionnalites**: Tableau avec numero, deal, statut (DRAFT/SENT/VIEWED/ACCEPTED/REJECTED/EXPIRED), total, validite, createur. Actions: voir, envoyer, supprimer. Creation: selection deal, taux taxe (14.975% defaut), date validite, lignes d'items (description, quantite, prix unitaire, remise %), notes, conditions.

**API**: GET/POST `/api/admin/crm/quotes`, PUT/DELETE `/api/admin/crm/quotes/{id}`, GET `/api/admin/crm/deals?limit=100`

---

## Forecast (Previsions)
**URL**: `/admin/crm/forecast` | **Score**: **B+ (82/100)**

Page wrapper minimal qui delegue au composant `ForecastDashboard`.

**Note**: Pas de `'use client'` directive (server component). Toute la logique est dans `@/components/admin/crm/ForecastDashboard`.

---

## Leaderboard (Classement)
**URL**: `/admin/crm/leaderboard` | **Score**: **A- (87/100)**

Classement gamifie des agents de vente avec podium (top 3) et liste classee.

**Fonctionnalites**: Filtres par periode (today/week/month) et metrique (conversions/calls/revenue). Podium visuel pour les 3 premiers. Badges automatiques (Power Caller, Closer, Revenue King, Connector). Statistiques: appels, conversions, revenu, taux de contact.

**API**: GET `/api/admin/crm/agents/performance?period={period}`

**Problemes**: Textes hardcodes "calls", "rate" dans PodiumCard.

---

## Quotas
**URL**: `/admin/crm/quotas` | **Score**: **A- (88/100)**

Gestion des objectifs individuels par agent avec barre de progression coloree.

**Fonctionnalites**: Creation inline (agent, periode daily/weekly/monthly/quarterly, type calls/revenue/deals/conversions, cible). Tableau avec progression coloree (vert >=80%, jaune >=50%, rouge sinon). Suppression.

**API**: GET/POST `/api/admin/crm/quotas`, DELETE `/api/admin/crm/quotas/{id}`, GET `/api/admin/crm/agents/performance`

---

## Approvals (Approbations)
**URL**: `/admin/crm/approvals` | **Score**: **A (92/100)**

Systeme d'approbation pour deals, devis et remises avec workflow approve/reject.

**Fonctionnalites**: Onglets Pending/History. Cartes avec type d'entite (deal/quote/discount), statut, raison, demandeur, approbateur. Modal d'action avec note optionnelle. Focus trap complet et gestion Escape. Badge de compteur sur l'onglet Pending.

**API**: GET `/api/admin/crm/approvals`, PUT `/api/admin/crm/approvals/{id}`

**Point fort**: Excellente accessibilite (focus trap, aria, keyboard navigation).

---

## Contracts
**URL**: `/admin/crm/contracts` | **Score**: **A (91/100)**

Gestion des contrats clients avec suivi des renouvellements.

**Fonctionnalites**: Onglets All/Renewals (renouvellements < 30 jours). Tableau: titre, statut (7 statuts avec icones), dates debut/fin, valeur, type renouvellement. Modal de creation/edition complete. Alerte "Expiring Soon" sur les contrats actifs proche de l'echeance. Focus trap dans la modale.

**API**: GET/POST `/api/admin/crm/contracts`, PUT `/api/admin/crm/contracts/{id}`

---

## Exchange Rates (Taux de change)
**URL**: `/admin/crm/exchange-rates` | **Score**: **A- (87/100)**

Gestion des taux de change avec convertisseur integre et synchronisation API.

**Fonctionnalites**: Convertisseur de devises inline (7 devises: CAD, USD, EUR, GBP, CHF, AUD, JPY). Tableau des taux avec source et date. Sync depuis API externe. Ajout manuel. Conversion inverse automatique si taux direct non disponible.

**API**: GET/POST `/api/admin/crm/exchange-rates`, POST `/api/admin/crm/exchange-rates/sync`

**Probleme mineur**: POST addRate n'utilise pas `addCSRFHeader()` pour les headers.
