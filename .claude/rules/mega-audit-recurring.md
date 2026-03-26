# MOT MAGIQUE: "audit weekly" / "audit monthly" / "mega audit v5"

## Declencheurs

| Commande | Action |
|----------|--------|
| `audit weekly` | Audit profond du prochain domaine en rotation |
| `audit monthly` | Audit cross-module + compliance + E2E |
| `mega audit v5` | Mega audit complet tous les 14 domaines |
| `audit status` | Dashboard des scores actuels par domaine |
| `audit domain <nom>` | Audit specifique d'un domaine |

## Architecture: Pipeline "Audit Forge" (3 passes + consensus)

### PASS 1: GENERATOR (Audit profond, 1 fonction a la fois)

**REGLES NON NEGOCIABLES:**
1. AUDITER UNE SEULE FONCTION A LA FOIS — jamais un fichier entier
2. LIRE LE CODE SOURCE COMPLET avant d'emettre un finding
3. CHAQUE finding DOIT avoir: fichier:ligne, code exact, exploit steps, test case
4. Si tu ne peux PAS ecrire les exploit steps → NE PAS rapporter le finding
5. ZERO generalite — "ameliorer error handling" = INTERDIT, REJETE

**Prompt 4 couches (empilees sur chaque audit):**

```
COUCHE 1 — PERSONA LOCK
"Tu es un pentester senior avec 20 ans d'experience specialise en {domaine}.
Tu audites UNE SEULE fonction. Tu REFUSES de rapporter un finding sans:
(a) le numero de ligne exact, (b) le code exact problematique,
(c) les etapes d'exploit detaillees, (d) un test case Playwright/Jest."

COUCHE 2 — THREAT MODEL
"Cette fonction traite {description}. Attaquant: {type}. Donnees a risque: {data}.
Conformite requise: {standards}."

COUCHE 3 — EVIDENCE GATE (output JSON obligatoire)
{
  "file": "src/app/api/...",
  "line": 42,
  "code": "const user = await prisma.user.findFirst({...})",
  "severity": "critical|high|medium|low",
  "category": "security|performance|reliability|maintainability|compliance",
  "title": "Description courte et precise",
  "exploitSteps": ["1. Envoyer requete POST avec...", "2. Observer que..."],
  "testCase": "test('devrait rejeter...', async () => { ... })",
  "suggestedFix": "Ajouter tenantId au where clause: ...",
  "cweId": "CWE-XXX",
  "confidence": 0.9
}

COUCHE 4 — NEGATIVE EXAMPLES (NE PAS rapporter)
- Rate limiting sur endpoints cron internes (proteges par CRON_SECRET)
- SQL injection quand Prisma parameterise les queries par defaut
- Auth manquante quand withAdminGuard/withUserGuard est present
- CSRF sur requetes GET (CSRF ne s'applique qu'aux mutations)
- PII leak quand le select Prisma ne retourne que les champs necessaires
```

### PASS 2: CRITIC (Adversarial review)

Apres PASS 1, lancer un agent critique:

```
"Tu es un REVIEWER HOSTILE. Tu recois les findings du PASS 1.
CHAQUE finding est FAUX jusqu'a preuve du contraire.

Pour CHAQUE finding, verifie:
1. Le middleware Next.js (middleware.ts) protege-t-il deja?
2. withAdminGuard/withUserGuard est-il present?
3. Prisma parameterise-t-il deja la query?
4. Le framework React echappe-t-il deja le contenu (pas de dangerouslySetInnerHTML)?
5. L'endpoint est-il interne (cron) ou public?
6. Le schema Prisma a-t-il un @@unique qui previent deja le probleme?

Verdict pour chaque finding: CONFIRMED | DOWNGRADED | FALSE_POSITIVE
Justification obligatoire pour chaque verdict."
```

### PASS 3: CROSS-MODULE (apres tous les domaines)

```
"Tu recois les findings CONFIRMES de tous les domaines.
Identifie les VULNERABILITES COMPOSEES:
- Finding A dans auth + Finding B dans payment = quel risque combine?
- Interface entre Module X et Module Y = contrat respecte?
- Posture securitaire coherente entre les modules?"
```

### CONSENSUS (Critical/High uniquement)

Pour tout finding Critical ou High:
- Relancer PASS 1 deux fois de plus (total 3 runs)
- Finding confirme 3/3 = haute confiance
- Finding confirme 2/3 = moyenne confiance (downgrader d'un niveau)
- Finding confirme 1/3 = REJETE (hallucination non-deterministe)

## Rotation Hebdomadaire (14 domaines)

| Sem | Domaine | Poids | Routes estimees |
|-----|---------|-------|-----------------|
| 1 | auth + payment | 2.0 | ~80 |
| 2 | accounting | 1.5 | ~70 |
| 3 | ecommerce | 1.5 | ~90 |
| 4 | CRM | 1.2 | ~120 |
| 5 | VoIP/telephonie | 1.2 | ~60 |
| 6 | LMS (formation) | 1.2 | ~90 |
| 7 | loyalty + rewards | 1.0 | ~40 |
| 8 | marketing | 1.0 | ~50 |
| 9 | media | 1.0 | ~40 |
| 10 | community + content | 1.0 | ~50 |
| 11 | emails + communications | 1.0 | ~60 |
| 12 | admin infra + system | 1.0 | ~80 |
| 13 | i18n + bridges | 1.0 | ~30 |
| 14 | Synthese cross-module | — | — |

**Priorisation adaptative:** domaine avec >20 fichiers modifies depuis dernier audit = remonte dans la queue.

## Scoring (0-100)

```
Score = 100 - Σ(Penalite × Confiance)
  Critical: -10pts (max -50)
  High: -5pts (max -30)
  Medium: -2pts (max -20)
  Low: -1pt (max -10)

Score global = Moyenne ponderee (auth×2.0, accounting×1.5, ...)
Grade: A≥90, B≥80, C≥70, D≥50, F<50
```

## Stockage Resultats

```
.audit_results/
  baselines/2026-Q1-baseline.json
  weekly/2026-W14-auth.json
  monthly/2026-03-monthly.json
  trends/domain-scores.json
```

## IMPORTANT

- Chaque audit DOIT produire un rapport markdown + JSON
- Chaque rapport DOIT comparer avec le precedent (delta score, new/resolved findings)
- Les findings non-resolus sont REPORTES au prochain audit (tracking lifecycle)
- Score en regression (-5pts+ depuis dernier audit) = ALERTE IMMEDIATE
