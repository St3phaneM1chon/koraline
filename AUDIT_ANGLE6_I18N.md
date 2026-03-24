# AUDIT ANGLE 6 - i18n Translation Completeness
**Date**: 2026-03-10
**Project**: BioCycle Peptides (peptide-plus)
**Auditor**: Claude Opus 4.6
**Scope**: 22 locales, all source files

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| Total locales | 22 |
| FR reference leaf keys | 11,331 |
| EN reference leaf keys | 11,331 |
| Structural missing keys (vs FR) | **0** across all locales |
| t() keys used in source code | 9,791 |
| t() keys missing from fr.json | **1,142** |
| Potential orphan keys (in locale, not in code) | ~2,344 |
| Hardcoded string violations (placeholder) | 133 occurrences / 53 files |
| Hardcoded string violations (title) | 183 occurrences / 50 files |
| Hardcoded string violations (aria-label) | 206 occurrences / 79 files |
| Hardcoded JSX text (admin) | ~949 occurrences / 107 files |
| Hardcoded JSX text (shop) | ~172 occurrences / 29 files |
| Hardcoded JSX text (public) | ~34 occurrences / 12 files |
| Hardcoded JSX text (dashboard) | ~54 occurrences / 7 files |
| Hardcoded JSX text (mobile) | ~36 occurrences / 6 files |
| RTL support | Partial (config exists, minimal CSS) |

**Overall i18n Health Score: 58/100**

---

## 2. KEY COUNT COMPARISON

All 22 locale files have nearly identical key structures:

| Locale | Leaf Keys | Lines | vs FR | Untranslated (=FR) |
|--------|-----------|-------|-------|---------------------|
| fr (reference) | 11,331 | 12,188 | -- | -- |
| en | 11,331 | 12,188 | 0 missing | 928 (8.2%) |
| ar | 11,334 | 11,764 | 0 missing, +3 extra | 513 (4.6%) |
| ar-dz | 11,334 | 11,764 | 0 missing, +3 extra | 518 (4.6%) |
| ar-lb | 11,334 | 11,764 | 0 missing, +3 extra | 519 (4.6%) |
| ar-ma | 11,334 | 11,764 | 0 missing, +3 extra | 519 (4.6%) |
| de | 11,334 | 11,764 | 0 missing, +3 extra | 609 (5.4%) |
| es | 11,334 | 11,764 | 0 missing, +3 extra | 621 (5.5%) |
| gcr | 11,334 | 11,764 | 0 missing, +3 extra | **1,378 (12.2%)** |
| hi | 11,334 | 11,764 | 0 missing, +3 extra | 529 (4.7%) |
| ht | 11,334 | 11,764 | 0 missing, +3 extra | 647 (5.7%) |
| it | 11,334 | 11,764 | 0 missing, +3 extra | 603 (5.4%) |
| ko | 11,334 | 11,764 | 0 missing, +3 extra | 526 (4.7%) |
| pa | 11,334 | 11,764 | 0 missing, +3 extra | 532 (4.7%) |
| pl | 11,334 | 11,764 | 0 missing, +3 extra | 571 (5.1%) |
| pt | 11,334 | 11,764 | 0 missing, +3 extra | 618 (5.5%) |
| ru | 11,334 | 11,764 | 0 missing, +3 extra | 527 (4.7%) |
| sv | 11,334 | 11,764 | 0 missing, +3 extra | 584 (5.2%) |
| ta | 11,334 | 11,764 | 0 missing, +3 extra | 536 (4.8%) |
| tl | 11,334 | 11,764 | 0 missing, +3 extra | 628 (5.6%) |
| vi | 11,334 | 11,764 | 0 missing, +3 extra | 565 (5.0%) |
| zh | 11,334 | 11,764 | 0 missing, +3 extra | 518 (4.6%) |

### Extra Keys (in all non-FR/EN locales, not in FR/EN)
- `admin.bridges.allStages`
- `admin.bridges.kanbanView`
- `admin.bridges.listView`

### Translation Quality Spot Check
The spot check confirms translations are genuine across all languages. The t() function, formatDate(), formatCurrency(), and formatNumber() all use proper Intl API with the correct locale. Common keys like `common.search`, `nav.home`, `auth.login` show correct translations.

### GCR (Guyanese Creole) - Worst Untranslated Rate
With 12.2% values identical to FR (1,378 keys), gcr has the highest untranslated rate. Main untranslated sections:
- `admin`: 804 keys
- `account`: 96 keys
- `protocols`: 86 keys
- `voip`: 56 keys
- `pricing`: 47 keys

---

## 3. MISSING KEYS ANALYSIS (t() in code, not in locale files)

**1,142 translation keys are used in source code but do NOT exist in fr.json.**

### Top 15 Sections Missing Keys

| Section | Missing Keys |
|---------|-------------|
| admin | 1,000 |
| portal | 24 |
| account | 21 |
| community | 14 |
| search | 13 |
| track | 12 |
| common | 10 |
| auth | 10 |
| checkout | 6 |
| shop | 5 |
| customerRewards | 5 |
| rewards | 4 |
| socialProof | 4 |
| toast | 2 |
| subscriptions | 2 |

### Top 20 Files With Most Missing Keys

| File | Missing Keys |
|------|-------------|
| admin/comptabilite/declaration-tps-tvq/page.tsx | 53 |
| admin/crm/campaigns/page.tsx | 52 |
| admin/comptabilite/calendrier-fiscal/page.tsx | 49 |
| admin/newsletter/page.tsx | 41 |
| admin/fidelite/page.tsx | 32 |
| admin/comptabilite/immobilisations/page.tsx | 30 |
| admin/crm/playbooks/page.tsx | 29 |
| admin/crm/contracts/page.tsx | 27 |
| admin/crm/knowledge-base/page.tsx | 27 |
| admin/crm/quotas/page.tsx | 24 |
| (shop)/portal/page.tsx | 24 |
| admin/crm/tickets/page.tsx | 23 |
| admin/bannieres/page.tsx | 21 |
| admin/comptabilite/notes-credit/page.tsx | 20 |
| admin/crm/deal-journey/page.tsx | 20 |
| admin/crm/scheduling/page.tsx | 19 |
| admin/crm/reports/builder/page.tsx | 19 |
| admin/comptabilite/factures-fournisseurs/page.tsx | 18 |
| admin/comptabilite/devises/page.tsx | 16 |
| admin/comptabilite/ocr/page.tsx | 16 |

---

## 4. HARDCODED STRING VIOLATIONS

### 4a. Hardcoded `placeholder` Attributes (133 occurrences / 53 files)

**Worst offenders:**

| File | Count | Examples |
|------|-------|---------|
| admin/inventaire/page.tsx | 10 | "Supplier name", "Contact person", "Internal notes" |
| admin/comptabilite/temps/page.tsx | 12 | "Du", "Description de la tache..." |
| admin/comptabilite/devis/page.tsx | 7 | Various form placeholders |
| admin/comptabilite/bons-commande/page.tsx | 7 | Various form placeholders |
| admin/comptabilite/rsde/page.tsx | 5 | "Nom du projet *", "Incertitudes technologiques" |
| admin/telephonie/extensions/ExtensionsClient.tsx | 5 | "Extension (1001)", "SIP Username" |
| admin/comptabilite/multi-entite/page.tsx | 5 | Various |
| admin/fournisseurs/SupplierForm.tsx | 4 | "SUP-001", "QC", "H2X 1Y4" |
| admin/comptabilite/paie/page.tsx | 4 | Various |
| admin/traductions/TranslationsDashboard.tsx | 5 | "Rechercher un terme...", "Ex: Peptide" |
| mobile/invoice/page.tsx | 3 | "Nom du client *", "Email du client" |

### 4b. Hardcoded `title` Attributes (183 occurrences / 50 files)

**Worst offenders:**

| File | Count | Language |
|------|-------|----------|
| components/admin/EmailToolbar.tsx | 24 | French ("Gras", "Italique", "Souligné"...) |
| admin/comptabilite/projets-couts/page.tsx | 17 | French |
| admin/comptabilite/temps/page.tsx | 14 | French |
| admin/comptabilite/devis/page.tsx | 8 | French |
| admin/comptabilite/bons-commande/page.tsx | 7 | French |
| admin/comptabilite/paie/page.tsx | 16 | French |
| admin/crm/workflows/page.tsx | 4 | English |
| components/admin/crm/CtiToolbar.tsx | 5 | English |

### 4c. Hardcoded `aria-label` Attributes (206 occurrences / 79 files)

Mixed French and English aria-labels. This is also an accessibility concern.

### 4d. Hardcoded JSX Text Content

**Total: ~1,245 occurrences across ~178 files**

| Area | Occurrences | Files |
|------|-------------|-------|
| admin/ | 949 | 107 |
| (shop)/ | 172 | 29 |
| dashboard/ | 54 | 7 |
| mobile/ | 36 | 6 |
| (public)/ | 34 | 12 |
| components/ | 38 | 16 |

**Worst customer-facing pages:**
- `(shop)/shipping-policy/page.tsx`: **34 hardcoded strings** (entire page in English)
- `(shop)/refund-policy/page.tsx`: **26 hardcoded strings** (entire page in English)
- `(shop)/estimate/[token]/page.tsx`: 21 hardcoded strings
- `dashboard/employee/clients/[id]/page.tsx`: 20 hardcoded strings
- `(shop)/account/orders/page.tsx`: 15 hardcoded strings
- `admin/comptabilite/projets-couts/page.tsx`: 86 hardcoded strings
- `admin/comptabilite/temps/page.tsx`: 66 hardcoded strings
- `admin/comptabilite/paie/page.tsx`: 66 hardcoded strings
- `admin/media/videos/page.tsx`: 68 hardcoded strings
- `admin/inventaire/page.tsx`: 56 hardcoded strings

---

## 5. ORPHAN KEYS

**~2,344 keys exist in locale files but are NOT referenced in source code** (approximate, dynamic keys excluded).

### Top 20 Sections with Orphan Keys

| Section | Orphan Count | Notes |
|---------|-------------|-------|
| admin | 1,295 | May include planned/unimplemented features |
| voip | 224 | Telephony system keys |
| invoice | 82 | Invoice rendering keys |
| crm | 76 | CRM-specific flat keys |
| shop | 62 | Shop section |
| mobile | 58 | Mobile app keys |
| account | 46 | Account section |
| checkout | 45 | Checkout section |
| customerRewards | 36 | Rewards system |
| protocols | 32 | Protocol section |
| rsde | 30 | R&D tax credit section |
| trackOrder | 29 | Order tracking |
| shipping | 28 | Shipping section |
| common | 27 | Common UI elements |
| learn | 24 | Learning center |
| reviews | 23 | Product reviews |
| customerAddresses | 21 | Address management |
| refund | 17 | Refund policy |
| auth | 14 | Authentication |
| home | 13 | Homepage |

**Note**: Some orphans may be used via dynamic key construction (`t(\`section.${var}\``). 39 dynamic prefix patterns were detected. The true orphan count after dynamic prefix exclusion is still ~2,344.

---

## 6. RTL SUPPORT CHECK

### Configuration: GOOD
- `localeDirections` in `src/i18n/config.ts` correctly maps ar, ar-dz, ar-lb, ar-ma to `'rtl'`
- Root `<html>` element receives `dir={dir}` from server-side locale detection
- Client-side `I18nProvider` updates `document.documentElement.dir` on locale change
- Email templates also set `dir="rtl"` for Arabic locales
- `I18nContext` exposes `dir` property for components

### CSS/Tailwind RTL: MINIMAL
- Only **2 Tailwind RTL-aware classes** found:
  - `src/components/admin/outlook/DetailPane.tsx`: `rtl:rotate-180` on ArrowLeft icon
  - `src/components/shop/CartDrawer.tsx`: `ltr:translate-x-full rtl:-translate-x-full` for drawer animation
- **41 logical property classes** (ms-, me-, ps-, pe-, start-, end-, text-start, text-end) found across 20 files
- **Very few directional CSS properties** (ml-, mr-, pl-, pr-): only 1 file uses them
- **No dedicated RTL CSS file** or RTL-specific styles

### RTL Verdict
The app uses Tailwind's logical properties in some places, which is good. However, RTL coverage is extremely minimal -- only 2 explicit RTL-aware classes in the entire codebase. Most components do not account for RTL layout at all.

---

## 7. ISSUES CLASSIFICATION

### P0 - CRITICAL (must fix before RTL/multilingual release)

| # | Issue | Impact | Scope |
|---|-------|--------|-------|
| P0-1 | **1,142 t() keys used in code missing from all locale files** | App shows raw key strings instead of translations | 1,142 keys across ~80 files |
| P0-2 | **shipping-policy page entirely hardcoded in English** | Page untranslatable for 21 locales | 34 hardcoded strings |
| P0-3 | **refund-policy page entirely hardcoded in English** | Page untranslatable for 21 locales | 26 hardcoded strings |

### P1 - HIGH (should fix soon)

| # | Issue | Impact | Scope |
|---|-------|--------|-------|
| P1-1 | **133 hardcoded placeholder attributes** across 53 files | Form inputs show English/French text regardless of locale | 53 files |
| P1-2 | **183 hardcoded title attributes** across 50 files | Tooltip text wrong in non-FR/EN locales | 50 files |
| P1-3 | **206 hardcoded aria-label attributes** across 79 files | Accessibility broken for non-FR/EN screen readers | 79 files |
| P1-4 | **GCR locale 12.2% untranslated** (1,378 values identical to FR) | Creole users see French text | 1,378 keys |
| P1-5 | **EN locale 8.2% "untranslated"** (928 values identical to FR) | Some may be legitimate (Date, Total) but ~855 need review | ~855 keys |
| P1-6 | **gift-cards page hardcoded in English** | Cannot translate gift card flow | ~9 strings |
| P1-7 | **estimate/[token] page hardcoded** | Customer-facing estimate portal untranslatable | 21 strings |

### P2 - MEDIUM (plan for next sprint)

| # | Issue | Impact | Scope |
|---|-------|--------|-------|
| P2-1 | **~949 hardcoded strings in admin area** | Admin UI partially untranslatable | 107 files |
| P2-2 | **RTL CSS support minimal** | Arabic locales layout broken (no mirroring) | All pages |
| P2-3 | **3 extra keys in non-FR locales** not in FR/EN | Minor sync issue (admin.bridges.*) | 3 keys |
| P2-4 | **~2,344 potential orphan keys** in locale files | Bloated locale files, maintenance burden | All locales |
| P2-5 | **dashboard/employee pages hardcoded** | Employee dashboard not translatable | 54 strings / 7 files |
| P2-6 | **mobile pages hardcoded** | Mobile app UI not translatable | 36 strings / 6 files |

### P3 - LOW (nice to have)

| # | Issue | Impact | Scope |
|---|-------|--------|-------|
| P3-1 | **EmailToolbar 24 hardcoded French titles** | Rich text editor tooltips only in French | 1 file |
| P3-2 | **Date format identical across all locales** | All use `dateStyle: 'long'` (fine, Intl handles it) | Non-issue |
| P3-3 | **No plural form testing** | tp() supports plurals but coverage unknown | Unknown |

---

## 8. TOP-LEVEL SECTION BREAKDOWN

| Section | Leaf Keys | % of Total |
|---------|-----------|-----------|
| admin | 7,105 | 62.7% |
| voip | 625 | 5.5% |
| account | 450 | 4.0% |
| legal | 215 | 1.9% |
| shop | 217 | 1.9% |
| checkout | 157 | 1.4% |
| protocols | 148 | 1.3% |
| common | 140 | 1.2% |
| auth | 131 | 1.2% |
| pricing | 69 | 0.6% |
| All others | 2,174 | 19.2% |

---

## 9. RECOMMENDATIONS

### Immediate Actions
1. **Add the 1,142 missing keys** to all 22 locale files (P0-1). Priority: admin accounting/CRM sections.
2. **Convert shipping-policy and refund-policy pages** to use t() (P0-2, P0-3).
3. **Sync the 3 extra keys** (admin.bridges.*) -- add to FR/EN or remove from others.

### Short-term (1-2 sprints)
4. **Systematically convert all hardcoded placeholders/titles/aria-labels** to t() calls. Start with customer-facing pages.
5. **Review GCR locale** -- 1,378 values need actual Creole translation.
6. **Review EN locale** -- 855 potentially untranslated values (e.g., `account.profileForm.placeholderName: "Jean Dupont"` should be English name).
7. **Add comprehensive RTL CSS** -- use Tailwind's `rtl:` variant prefix across all layout-sensitive components.

### Medium-term
8. **Audit and clean orphan keys** -- remove truly unused keys to reduce file size and maintenance.
9. **Create i18n CI check** -- fail build if t() keys are missing from any locale file.
10. **Add RTL visual testing** -- Playwright tests with Arabic locale to catch layout issues.

---

## 10. TECHNICAL DETAILS

### i18n Architecture (Well-Designed)
- **Config**: `src/i18n/config.ts` -- 22 locales, RTL mapping, date/currency formats
- **Client provider**: `src/i18n/client.tsx` -- React context with t(), tp(), formatDate(), formatCurrency()
- **Root layout**: `src/app/layout.tsx` -- Sets `<html lang={locale} dir={dir}>` server-side
- **Pluralization**: Uses `Intl.PluralRules` (correct for Arabic 6-form, Russian 3-form, etc.)
- **Locale detection**: Accept-Language header + cookie + localStorage + DB preference
- **Fallback**: Missing key returns the key string with console.warn

### Locale Files
- Location: `src/i18n/locales/{locale}.json`
- FR and EN: 12,188 lines, 11,331 leaf keys each
- Others: 11,764 lines, 11,334 leaf keys each (3 extra keys)

### Dynamic Key Patterns (39 detected)
```
t(`admin.crmLists.${...}`)
t(`admin.density.${...}`)
t(`admin.emailConfig.emailStatus.${...}`)
t(`categories.${...}`)
t(`formats.${...}`)
t(`nav.${...}`)
... (34 more)
```
These generate keys at runtime, making static orphan detection imprecise.
