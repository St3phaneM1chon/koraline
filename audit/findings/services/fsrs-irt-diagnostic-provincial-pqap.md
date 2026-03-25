# Audit: fsrs-engine.ts + irt-engine.ts + diagnostic-service.ts + provincial-data.ts + pqap-glossary.ts

## fsrs-engine.ts (174 LOC) — 5 Findings

### P2: Division by zero possible in getRetrievability — line 44
`stability <= 0` returns 0, but `stability` could be very small positive (e.g., 0.0001) causing near-infinity in the exponent.
**Fix**: Add guard `if (stability < 0.01) return 0;`

### P2: weights array index out of bounds — line 106-148
Functions access `w[0]` through `w[18]`. If a custom weights array has fewer than 19 elements, we get `undefined` which becomes `NaN` in math operations.
**Fix**: Validate weights length: `if (weights.length < 19) throw new Error('FSRS weights must have 19 elements');`

### P3: nextInterval formula diverges from FSRS4Anki — line 145-148
The formula `(stability / 9) * (1/retention - 1)` is simplified. The original FSRS uses `stability / factor * (retention^(-1/decay) - 1)` where factor=19/81 and decay=-0.5. This gives different intervals.
**Fix**: Use the canonical formula or document the simplification.

### P3: No card.lapses update in scheduleReview — line 50-102
`lapses` count (number of failures) is never incremented when `rating === 1`. The caller must handle this.
**Fix**: Return `newLapses: card.lapses + (rating === 1 ? 1 : 0)` in the result.

### P3: quizScoreToRating thresholds hardcoded — line 154-159
The thresholds (0.5x, 1x, 1.2x of passingScore) are arbitrary and not configurable per tenant.
**Fix**: Accept optional threshold config parameter.

---

## irt-engine.ts (253 LOC) — 4 Findings

### P2: estimateAbility assumes all responses are independent — line ~40
IRT 1PL/2PL models assume local independence. If questions are correlated (same topic), ability estimate is biased.
**Fix**: Document limitation. For production, use 3PL or multidimensional IRT.

### P2: No convergence check in Newton-Raphson — line ~60-80
The iterative ability estimation runs a fixed 20 iterations. If it doesn't converge (oscillates), the result is unreliable.
**Fix**: Add convergence check: `if (Math.abs(delta) < 0.001) break;`

### P3: adaptiveItemSelection returns first match — line ~120
When selecting the next question, it picks the first item closest to ability. It should also consider exposure count to avoid showing the same question repeatedly.
**Fix**: Add exposure history check.

### P3: No bounds on ability estimate — line ~80
Ability can grow unbounded (e.g., 99.9). Should be clamped to reasonable range.
**Fix**: `ability = Math.max(-4, Math.min(4, ability));` (standard IRT range)

---

## diagnostic-service.ts (254 LOC) — 3 Findings

### P2: No time limit enforcement — server-side
The diagnostic quiz has a `maxMinutes` field but there's no server-side check that the student didn't exceed the time limit.
**Fix**: Validate submission time vs start time.

### P2: Results stored without encryption
Diagnostic results (conceptResults JSON) contain student skill profiles stored in plain text.
**Fix**: Consider encrypting PII-adjacent data at rest.

### P3: No retry limit
Students can retake the diagnostic quiz unlimited times, which undermines its purpose as a baseline assessment.
**Fix**: Add a `maxAttempts` check (default 1, configurable).

---

## provincial-data.ts (806 LOC) — 3 Findings

### P3: Static data — no versioning
Provincial regulations change over time. The data is hardcoded with no version date or source citation per entry.
**Fix**: Add `lastUpdated` and `source` fields to ProvinceRegulation.

### P3: getApplicableLaws string matching fragile — line 639-660
Topic matching uses `lower.includes('auto')` which would match "automation", "autograph", etc.
**Fix**: Use word boundary matching or a curated keyword map.

### P3: Missing error handling in getProvincePrograms — line 662-668
If `provinceCode` doesn't match any province, it returns an empty array silently. Could confuse the caller.
**Fix**: Return `null` or throw if province not found, with helpful message.

---

## pqap-glossary.ts (227 LOC) — 2 Findings

### P3: Glossary terms hardcoded
Terms should be loadable from database (AiTutorKnowledge) or JSON file for maintainability.
**Fix**: Move to DB seed or config file, cache in memory.

### P3: No fuzzy search
Search is exact match or contains. Typos in queries return no results.
**Fix**: Add Levenshtein distance or trigram matching for fuzzy search.
