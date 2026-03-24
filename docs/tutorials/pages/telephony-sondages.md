# Telephonie - Sondages post-appel

**Route**: `/admin/telephonie/sondages`
**Score**: 86/100 (B)
**Fichiers**: `sondages/page.tsx`, `sondages/SondagesClient.tsx`

## Fonctionnalites
- CRUD configurations de sondages
- Stats: total reponses, score moyen, taux de reponse
- Methodes: DTMF (clavier) ou formulaire web
- Toggle actif/inactif
- Builder de questions: types rating (1-5), oui/non, texte libre, DTMF
- Support dark mode

## Architecture
- Server Component: SiteSetting (configs JSON) + CallSurvey groupBy (stats)
- Client Component: CRUD via API avec CSRF

## Problemes
- Taux de reponse toujours 100% (calcul bugge: totalResponses/max(totalResponses,1))
- Stockage: SiteSetting key='voip:survey_config:{name}'

## API
- POST/PUT/DELETE `/api/admin/voip/surveys?id=`
