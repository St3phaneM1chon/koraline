# MOT MAGIQUE: "audit formation" ou "mega audit lms"

## Declencheur
Quand l'utilisateur tape "audit formation" ou "mega audit lms":
Lancer l'audit exhaustif du module Formation ci-dessous.

## Prompt Anti-Generalisation (OBLIGATOIRE)

### REGLES NON NEGOCIABLES
1. AUDITE UNE SEULE FONCTION A LA FOIS — jamais un fichier entier
2. LIS LE CODE SOURCE COMPLET avant d'emettre un finding
3. CHAQUE finding doit citer: fichier:ligne, code exact, CWE/ISO reference
4. ZERO generalite — "ameliorer error handling" = INTERDIT
5. TESTE MENTALEMENT chaque edge case: null, concurrent, max int, empty array, unicode, injection

### POUR CHAQUE FONCTION, VERIFIER:

**Securite (OWASP)**:
- Auth: verifie identite ET permissions?
- Input: TOUS les parametres valides avec Zod?
- Output: reponse peut leaker PII (password, email)?
- Injection: inputs concatenes dans queries?
- CSRF: mutations ont token CSRF?
- Rate limiting: route peut etre abusee?

**Integrite donnees**:
- Transaction: operations multi-tables dans $transaction?
- Race condition: 2 requetes simultanees corrompent?
- Cascade: parent supprime → enfants geres?
- Idempotence: meme requete 2x = meme resultat?
- Cross-tenant: IDs references du meme tenant?

**Performance**:
- N+1: boucles avec queries DB individuelles?
- Index: champs filtres/tries indexes?
- Pagination: listes avec limit?
- Cache: donnees statiques cachees?
- Select: queries ne selectionnent que les champs necessaires?

**UX/Accessibilite**:
- Loading state visible?
- Error state affiche clairement?
- Empty state quand pas de donnees?
- Keyboard: elements interactifs accessibles?
- Screen reader: roles ARIA corrects?

**Robustesse**:
- Try/catch autour des operations fallibles?
- Erreurs loguees avec contexte?
- Timeout sur appels externes?
- Retry pour operations transitoires?
- Graceful degradation?

## Pipeline d'audit

### Phase 1: Services (14 fichiers)
```bash
# Auditer chaque service fonction par fonction
ls src/lib/lms/*.ts
```
Pour chaque fichier: lire → auditer chaque fonction → documenter findings dans audit/findings/services/

### Phase 2: Routes API (69 routes)
```bash
find src/app/api/lms src/app/api/admin/lms -name "route.ts"
```
Pour chaque route: auth guard? validation? response? errors?

### Phase 3: Pages (57 pages)
```bash
find src/app/admin/formation src/app/\(shop\)/learn -name "page.tsx"
```
Pour chaque page: loading/error/empty states? a11y? responsive?

### Phase 4: Schema (85 modeles)
```bash
cat prisma/schema/lms.prisma
```
Pour chaque modele: indexes? constraints? relations? cascade?

### Phase 5: Build + deploy
```bash
npx prisma validate && npx prisma generate && npm run build
git add -A && git commit && git push
```

## Cadence
| Frequence | Type | Scope |
|-----------|------|-------|
| Chaque commit | Lint + type check | Fichiers modifies |
| Hebdomadaire | 1 service complet | Rotation des 14 services |
| Mensuel | WCAG + performance | Toutes les pages |
| Trimestriel | Mega audit complet | Tout le module |

## Metriques
- Findings par severite (P0/P1/P2/P3)
- % resolus vs documentes
- Build status
- Tests E2E pass rate
