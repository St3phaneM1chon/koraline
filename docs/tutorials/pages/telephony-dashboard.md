# Telephonie - Dashboard VoIP

**Route**: `/admin/telephonie`
**Score**: 92/100 (A)
**Fichiers**: `page.tsx`, `VoipDashboardClient.tsx`

## Fonctionnalites
- KPIs du jour: appels, completes, manques, duree moyenne, taux de reponse
- KPIs du mois: appels, completes, taux de reponse
- Score satisfaction moyen (CallSurvey)
- Agents actifs (SipExtension ONLINE/BUSY)
- Messageries vocales non lues
- Statut des connexions VoIP (Telnyx, VoIP.ms)
- Tableau des 15 derniers appels avec direction, caller, agent, status, duree, satisfaction
- Lien vers journal complet

## Architecture
- Server Component: auth + 11 requetes Prisma en $transaction
- Client Component: rendu KPI cards (CallStats), table appels, connexions
- i18n: complet via useI18n()
- Composants: CallStats, SatisfactionBadge, formatDuration

## API/Donnees
- Prisma direct (server-side): CallLog, CallSurvey, SipExtension, Voicemail, VoipConnection
- Pas d'API client-side (tout server-rendered)

## Problemes
- Aucun probleme majeur
- Type `any` sur data prop (mineur)
