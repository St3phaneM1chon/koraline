# AUDIT EXHAUSTIF - SECTIONS COMPTABILITE ET SYSTEME
## Date: 2026-02-24
## Scope: 55+ API routes, 33+ services, 29+ admin pages, 13+ cron jobs

---

# SECTION 1: COMPTABILITE (Journals, GL, Tax, Reports)

## FAILLES / BUGS (ACF-001 a ACF-100)

### SECURITE
- **ACF-001** [CRITIQUE] `src/lib/accounting/ocr.service.ts` - La cle API OpenAI est envoyee directement dans le header. Aucune rotation ni stockage securise. Si le log capture le header, la cle est exposee.
- **ACF-002** [CRITIQUE] `src/app/api/accounting/cron/route.ts` - L'endpoint cron utilise `X-Cron-Secret` au lieu du standard `Authorization: Bearer`. Cela peut bypasser les protections de reverse proxy qui filtrent sur Authorization.
- **ACF-003** [HAUTE] `src/lib/accounting/reconciliation.service.ts` - L'auto-reconciliation ne valide pas si l'utilisateur a le droit de rapprocher des transactions. Toute personne avec acces admin peut reconcilier n'importe quel compte.
- **ACF-004** [HAUTE] `src/lib/accounting/stripe-sync.service.ts` - Les erreurs Stripe sont loguees avec `String(error)` qui peut contenir des tokens/identifiants Stripe dans le stack trace.
- **ACF-005** [HAUTE] `src/app/api/accounting/entries/route.ts` - Le DELETE soft-delete verifie la retention de 7 ans mais ne verifie pas si l'entree a des references croisees (factures, rapprochements, declarations fiscales).
- **ACF-006** [MOYENNE] `src/lib/accounting/pdf-reports.service.ts` - Le HTML genere pour les PDF injecte directement les donnees company (nom, adresse) sans echappement HTML, vulnerabilite XSS si les donnees company contiennent des caracteres speciaux.
- **ACF-007** [MOYENNE] `src/lib/accounting/ocr.service.ts` - L'image base64 envoyee a OpenAI n'a pas de taille maximale validee avant l'envoi API (seulement la taille fichier est verifiee, pas la taille base64 decodee).
- **ACF-008** [MOYENNE] `src/app/api/accounting/entries/route.ts` - L'optimistic locking compare `updatedAt` en string ISO mais les fuseaux horaires pourraient causer des faux positifs de conflit si le serveur et la DB sont en TZ differents.
- **ACF-009** [BASSE] `src/lib/accounting/tax-compliance.service.ts` - `generateTaxSummary()` utilise `take: 10000` sans pagination. Pour les entreprises avec >10K commandes par periode, des donnees sont silencieusement tronquees.
- **ACF-010** [BASSE] `src/lib/accounting/currency.service.ts` - Le cache de taux de change est in-memory (`Map`). En multi-instance Azure, chaque instance a un cache different, causant des calculs de change inconsistants.

### ERREURS
- **ACF-011** [CRITIQUE] `src/lib/accounting/expense.service.ts` - `createExpenseEntry()` utilise `new Date().getFullYear()` pour le prefix, pas `data.date.getFullYear()`. Si l'expense est pour une date dans l'annee precedente, le numero de sequence sera dans la mauvaise serie.
- **ACF-012** [HAUTE] `src/lib/accounting/forecasting.service.ts` - `linearRegression()` avec n=1 retourne `slope: 0, intercept: data[0]` mais `r2: 0` ce qui peut etre mal interprete comme "aucune correlation" alors qu'il n'y a pas assez de donnees.
- **ACF-013** [HAUTE] `src/lib/accounting/alerts.service.ts` - `generateClosingAlerts()` utilise `RECONCILIATION_PENDING` comme type au lieu d'un vrai `PERIOD_CLOSE_PENDING` car le type n'existe pas dans le type Alert.
- **ACF-014** [HAUTE] `src/lib/accounting/kpi.service.ts` - `getKPITrend()` fait 15+ queries DB par periode x 6 periodes = 90+ queries. Pas de timeout ni protection contre la surcharge DB.
- **ACF-015** [HAUTE] `src/lib/accounting/period-close.service.ts` - `runYearEndClose()` verifie que 12 periodes sont verrouillees mais ne verifie pas qu'il s'agit bien des 12 periodes de l'annee en cours (pourrait verrouiller des periodes d'autres annees).
- **ACF-016** [MOYENNE] `src/lib/accounting/recurring-entries.service.ts` - `calculateNextRunDate()` pour WEEKLY avec `dayOfWeek` peut sauter une semaine si le calcul tombe le meme jour (diff=0, ajoute 7 jours au lieu de 0).
- **ACF-017** [MOYENNE] `src/lib/accounting/auto-entries.service.ts` - `calculateTaxes()` avec le path legacy n'inclut pas PST pour BC/SK/MB quand `shippingProvince` est absent, mais le total inclut tvh=0 pour ces provinces.
- **ACF-018** [MOYENNE] `src/lib/accounting/reconciliation.service.ts` - La similarite Jaccard pour la description est case-sensitive dans le split mais le match est fait en lowercase, potentielle inconsistance.
- **ACF-019** [MOYENNE] `src/lib/accounting/stripe-sync.service.ts` - `syncStripeCharges()` n'a pas de limite de pagination. Si Stripe a 1M+ charges dans la periode, la boucle while tournera indefiniment en memoire.
- **ACF-020** [BASSE] `src/lib/accounting/currency.service.ts` - `getExchangeRateSummary()` utilise la variance de population (N) au lieu de la variance d'echantillon (N-1) pour la volatilite, inconsistant avec `forecasting.service.ts` qui utilise N-1.

### DONNEES
- **ACF-021** [CRITIQUE] `src/lib/accounting/types.ts` - `TAX_RATES` definit les taux comme constantes hardcodees. Aucun mecanisme pour les mettre a jour si le gouvernement change un taux (ex: TVQ passant de 9.975% a 10%).
- **ACF-022** [CRITIQUE] `src/lib/accounting/validation.ts` - `createJournalEntrySchema` accepte `date: z.coerce.date()` sans bornes. Une ecriture datee de 1970 ou 2099 serait acceptee sans avertissement.
- **ACF-023** [HAUTE] `src/lib/accounting/period-close.service.ts` - L'ecriture de cloture de fin d'annee calcule le benefice net mais ne verifie pas que TOUTES les ecritures automatiques (Stripe sync, recurring) ont ete generees avant la cloture.
- **ACF-024** [HAUTE] `src/lib/accounting/payment-matching.service.ts` - `applyPaymentMatch()` ne verifie pas si la facture est deja en statut PAID avant d'appliquer un nouveau paiement. Double paiement possible.
- **ACF-025** [HAUTE] `src/lib/accounting/auto-entries.service.ts` - `generateSaleEntry()` met la reduction dans les debits mais le subtotal deja reduit est aussi dans le credit, causant un double-comptage potentiel du discount.
- **ACF-026** [MOYENNE] `src/lib/accounting/expense.service.ts` - `getExpensesByDepartment()` fait `Number(line.debit)` sur un Prisma Decimal sans utiliser `fromDecimal()` de financial.ts, potentielle perte de precision.
- **ACF-027** [MOYENNE] `src/lib/accounting/gifi-codes.ts` - Le mapping `7010` dans `RECOMMENDED_CHART_OF_ACCOUNTS` est "Interets debiteurs" mais dans `GIFI_CODES` le code 7010 est "Sales to related parties". Confusion de codes.
- **ACF-028** [MOYENNE] `src/lib/accounting/canadian-tax-config.ts` - Les taux de paie (RQAP, RRQ) sont hardcodes pour 2026. Pas de mecanisme de mise a jour annuelle automatique.
- **ACF-029** [MOYENNE] `src/lib/accounting/tax-compliance.service.ts` - `validateTaxNumbers()` accepte le format `123456789RT0001` mais ne valide pas le check digit du numero TPS (algorithme Luhn Mod 10).
- **ACF-030** [BASSE] `src/lib/accounting/types.ts` - `ACCOUNT_CODES` definit FX_GAINS_LOSSES='7000', FX_LOSS='7010', FX_GAIN='7020'. Mais 7000 est aussi le code GIFI pour "Trade sales". Collision de namespace.

### ACCESSIBILITE
- **ACF-031** [HAUTE] `src/app/admin/comptabilite/page.tsx` - Les graphiques SVG (RevenueExpensesChart, CashFlowLineChart, ExpenseDonutChart) n'ont pas de `role="img"` ni `aria-label`. Les lecteurs d'ecran ne peuvent pas les interpreter.
- **ACF-032** [HAUTE] `src/app/admin/comptabilite/page.tsx` - Les tooltips des barres SVG utilisent `<title>` qui ne fonctionne pas avec les lecteurs d'ecran sur tous les navigateurs. Utiliser `aria-describedby` a la place.
- **ACF-033** [MOYENNE] `src/app/admin/comptabilite/page.tsx` - Les checkboxes des taches ont `onChange={() => {}}` (no-op). Le focus visuel et le retour clavier ne fonctionnent pas comme attendu.
- **ACF-034** [MOYENNE] `src/app/admin/comptabilite/page.tsx` - Les couleurs du donut chart (emerald-500, blue-500, violet-500) n'ont pas de patterns/textures alternatives pour les daltoniens.
- **ACF-035** [BASSE] `src/lib/accounting/pdf-reports.service.ts` - Les rapports PDF HTML generes n'ont pas de structure `<table>` avec `scope="col"` ni `<caption>` pour l'accessibilite des tableaux.

### I18N
- **ACF-036** [CRITIQUE] `src/lib/accounting/alerts.service.ts` - Tous les messages d'alerte sont en francais hardcode: "Facture en retard", "Alerte de tresorerie", etc. Pas de traduction via t().
- **ACF-037** [HAUTE] `src/lib/accounting/expense.service.ts` - `DEPARTMENTS` contient des labels en francais hardcodes ("Operations", "Marketing"). Devrait utiliser des cles i18n.
- **ACF-038** [HAUTE] `src/lib/accounting/recurring-entries.service.ts` - `PREDEFINED_TEMPLATES` a des noms et descriptions en francais ("Amortissement equipement", "Hebergement Azure"). Non traduits.
- **ACF-039** [HAUTE] `src/lib/accounting/error-handler.ts` - Tous les messages d'erreur Prisma sont en francais: "enregistrement existe deja", "non trouve". Devrait utiliser des codes d'erreur traduits par le frontend.
- **ACF-040** [MOYENNE] `src/lib/accounting/pdf-reports.service.ts` - `PDF_LABELS` ne supporte que 'fr' et 'en'. Les 20 autres locales du systeme ne sont pas couvertes pour les rapports PDF.
- **ACF-041** [MOYENNE] `src/lib/accounting/auto-entries.service.ts` - `getAccountName()` retourne des noms en francais hardcodes ("Compte bancaire principal (CAD)", "TPS a payer"). Non localises.
- **ACF-042** [MOYENNE] `src/lib/accounting/ocr.service.ts` - Le prompt OCR envoye a OpenAI est en francais fixe. Les factures en anglais/autres langues pourraient etre mal interpretees.
- **ACF-043** [BASSE] `src/lib/accounting/gifi-codes.ts` - `RECOMMENDED_CHART_OF_ACCOUNTS` a des noms en francais sans accents ("Benefices non repartis" au lieu de "Benefices non repartis"). Inconsistance.
- **ACF-044** [BASSE] `src/lib/accounting/currency.service.ts` - `CURRENCIES` a des noms en francais uniquement ("Dollar canadien", "Euro"). Pas de noms en anglais.
- **ACF-045** [BASSE] `src/lib/accounting/forecasting.service.ts` - `formatProjectionSummary()` genere du texte en francais ("Sur X mois:", "Entrees totales:").

### PERFORMANCE
- **ACF-046** [CRITIQUE] `src/lib/accounting/kpi.service.ts` - `calculateKPIs()` fait 15 requetes DB sequentielles via `sumByAccountType()`. Devrait utiliser un seul GROUP BY agrege.
- **ACF-047** [HAUTE] `src/lib/accounting/tax-compliance.service.ts` - `generateTaxSummary()` charge jusqu'a 10,000 commandes en memoire d'un coup. Pour un site a volume, risque OOM.
- **ACF-048** [HAUTE] `src/app/admin/comptabilite/page.tsx` - Le dashboard fait 2 fetches API separees (dashboard + alerts) au chargement. Devrait utiliser un seul endpoint ou React Suspense avec streaming.
- **ACF-049** [MOYENNE] `src/lib/accounting/payment-matching.service.ts` - `suggestUnmatchedPayments()` fait un cross-join entre 50 transactions et toutes les factures ouvertes en memoire. O(n*m) sans index.
- **ACF-050** [MOYENNE] `src/lib/accounting/reconciliation.service.ts` - L'auto-reconciliation calcule la similarite Jaccard pour chaque paire transaction-ecriture. Avec 1000 transactions et 1000 ecritures, c'est 1M de comparaisons.

### UX
- **ACF-051** [HAUTE] `src/app/admin/comptabilite/page.tsx` - Les `StatCard` affichent `trend.value: 0` et `vsLastMonth` pour toutes les stats car les donnees comparatives ne sont pas implementees dans l'API dashboard.
- **ACF-052** [HAUTE] `src/app/admin/comptabilite/page.tsx` - `periodOptions` est hardcode avec des dates specifiques (2026-01, 2025-12...). Pas de generation dynamique des periodes disponibles.
- **ACF-053** [MOYENNE] `src/app/admin/comptabilite/page.tsx` - Le bouton "Export" dans le header fait `toast.info(t('common.comingSoon'))`. Fonctionnalite non implementee.
- **ACF-054** [MOYENNE] `src/lib/accounting/alerts.service.ts` - Les alertes de tresorerie calculent `daysUntilCritical` avec une division qui peut donner NaN ou Infinity si outflows == inflows.
- **ACF-055** [BASSE] `src/app/admin/comptabilite/page.tsx` - Le loading skeleton ne correspond pas a la mise en page reelle (4 rectangles vs 4 StatCards + 4 KPI cards + charts).

### API
- **ACF-056** [CRITIQUE] `src/app/api/accounting/entries/route.ts` - Le GET ne filtre pas par `deletedAt: null`. Les ecritures supprimees (soft-deleted) apparaissent dans les resultats.
- **ACF-057** [HAUTE] `src/app/api/accounting/cron/route.ts` - L'endpoint ne retourne pas de code HTTP d'erreur specifique si une des 3 taches echoue. Retourne toujours 200 avec success: true/false dans le body.
- **ACF-058** [HAUTE] `src/lib/accounting/scheduler.service.ts` - `runScheduledTasks()` ne persiste pas l'historique d'execution. Impossible de savoir quand la derniere execution cron a eu lieu.
- **ACF-059** [MOYENNE] `src/app/api/accounting/entries/route.ts` - Le POST ne valide pas que les `accountId` des lignes existent dans ChartOfAccount avant de creer l'ecriture. Prisma lance une erreur FK peu claire.
- **ACF-060** [MOYENNE] `src/lib/accounting/stripe-sync.service.ts` - `fullStripeSync()` execute charges, refunds et payouts sequentiellement. Pas de parallelisation possible.

### TYPES
- **ACF-061** [HAUTE] `src/lib/accounting/types.ts` - L'interface `JournalEntry` a `type: string` au lieu d'un union type strict. N'importe quelle valeur est acceptee.
- **ACF-062** [HAUTE] `src/lib/accounting/expense.service.ts` - `getDepartmentBudgetVsActual()` cast `line as Record<string, unknown>` pour acceder a `costCenter`, indiquant que le champ n'existe pas dans le type Prisma BudgetLine.
- **ACF-063** [MOYENNE] `src/lib/accounting/recurring-entries.service.ts` - `getRecurringTemplates()` cast `t.templateData` comme un type ad-hoc inline. Devrait etre un type nomme pour la reutilisabilite.
- **ACF-064** [MOYENNE] `src/lib/accounting/kpi.service.ts` - `sumByAccountType()` cast `accountType as Prisma.EnumAccountTypeFilter['equals']` sans verification que la valeur est valide dans l'enum Prisma.
- **ACF-065** [BASSE] `src/lib/accounting/currency.service.ts` - `calculateFxGainLoss()` a des parametres `_originalCurrency` et `_settlementAmount` prefixes underscore mais non utilises. Dead parameters.

### LOGIQUE
- **ACF-066** [CRITIQUE] `src/lib/accounting/auto-entries.service.ts` - `generateSaleEntry()` calcule le credit de vente comme `subtotal - discount` mais le total inclut shipping+taxes. Si shipping > 0 et discount > 0, l'ecriture est potentiellement desequilibree avec le check `assertJournalBalance` manquant.
- **ACF-067** [HAUTE] `src/lib/accounting/forecasting.service.ts` - `generateCashFlowProjection()` calcule les taxes comme `(sales - purchases - operating - marketing) * taxRate`. Si le resultat est negatif, les taxes sont 0 grace a `Math.max(0, taxes)` mais le loss-carryforward n'est pas considere.
- **ACF-068** [HAUTE] `src/lib/accounting/period-close.service.ts` - `rollbackYearEndClose()` vide l'ecriture de cloture et reopen les 12 periodes. Mais si de nouvelles ecritures ont ete postees dans la nouvelle annee entre-temps, le rollback casse l'integrite.
- **ACF-069** [MOYENNE] `src/lib/accounting/alerts.service.ts` - `generatePaymentReminders()` envoie un REMINDER a 7-14 jours ET un autre REMINDER a 14-30 jours. Pas de tracking si le premier a deja ete envoye. L'utilisateur recoit des doublons.
- **ACF-070** [MOYENNE] `src/lib/accounting/reconciliation.service.ts` - Le score de confiance additionne amount(50) + date(25) + reference(25) = max 100. Mais si amount est exact ET reference match, c'est clairement un match. Le score devrait etre pondere differemment.
- **ACF-071** [MOYENNE] `src/lib/accounting/canadian-tax-config.ts` - `calculateCCA()` applique la regle du demi-taux mais ne verifie pas si l'immobilisation a ete acquise dans une transaction de parties liees (cas ou la regle du demi-taux ne s'applique pas).
- **ACF-072** [MOYENNE] `src/lib/accounting/currency.service.ts` - `revalueForeignAccounts()` cree une seule ligne de gain/perte de change nette. En comptabilite, chaque compte devrait avoir sa propre ecriture de reevaluation pour la piste d'audit.
- **ACF-073** [BASSE] `src/lib/accounting/auto-entries.service.ts` - `getSalesAccount()` verifie la liste de pays europeens hardcodee ['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'BE']. Manque 20+ pays UE.
- **ACF-074** [BASSE] `src/lib/accounting/forecasting.service.ts` - `calculateSeasonalIndices()` requiert 12 mois minimum mais si seulement 11 mois sont fournis, retourne Array(12).fill(1). Pas d'avertissement a l'utilisateur.
- **ACF-075** [BASSE] `src/lib/accounting/ocr.service.ts` - `detectCurrency()` retourne 'JPY' pour le signe yen mais le yen et le yuan chinois utilisent le meme symbole. Ambiguite non resolue.
- **ACF-076** [BASSE] `src/lib/accounting/payment-matching.service.ts` - Le seuil de confiance minimum est 20 pour inclure un match. C'est tres bas - un match avec seulement "date dans les 30 jours" (score 5) est exclu mais "date dans les 14 jours" (score 10) + n'importe quoi d'autre passe.
- **ACF-077** [BASSE] `src/lib/accounting/gifi-codes.ts` - `categoryForCode()` fallback vers CURRENT_ASSETS pour les codes non reconnus (ex: 4000-6999 entre EQUITY et REVENUE). Ces codes sont des comptes internes et ne devraient pas avoir de categorie GIFI.
- **ACF-078** [BASSE] `src/lib/accounting/alerts.service.ts` - `detectExpenseAnomalies()` prend `threshold: number = 0.5` (50%) mais le check compare `percentageAbove > threshold * 100` (50) vs un pourcentage. Si on passe `threshold: 0.5`, il detecte anomalies > 50%, correct. Mais si on passe `threshold: 50`, ca detecte > 5000%. API confuse.
- **ACF-079** [BASSE] `src/lib/financial.ts` - `amountsEqual()` avec tolerance de 1 cent. Pour des montants multi-devises (JPY a 0 decimales), 1 cent de tolerance est trop strict.
- **ACF-080** [BASSE] `src/lib/accounting/index.ts` - Le barrel export re-exporte tout de 20+ fichiers sans tree-shaking boundaries. L'import de n'importe quel symbole charge tout le module accounting.

### SECURITE (suite)
- **ACF-081** [MOYENNE] `src/lib/accounting/ocr.service.ts` - L'endpoint OCR n'a pas de validation MIME type cote serveur. Le `file.type` vient du client et peut etre spoofe.
- **ACF-082** [BASSE] `src/lib/accounting/audit-trail.service.ts` - Les audit trails ne sont pas signes cryptographiquement. Un admin avec acces DB direct peut modifier/supprimer des entries sans detection.

### ERREURS (suite)
- **ACF-083** [MOYENNE] `src/lib/accounting/stripe-sync.service.ts` - `getStripeBalance()` retourne `currency: cadBalance?.currency?.toUpperCase() || 'CAD'`. Si le compte Stripe n'a pas de balance CAD, retourne la premiere devise disponible mais pretend que c'est du CAD.
- **ACF-084** [MOYENNE] `src/lib/accounting/currency.service.ts` - `fetchBOCRate()` fetch une URL Bank of Canada. Si la structure JSON change, `parseFloat(latest[rateKey]?.v)` retourne NaN silencieusement.
- **ACF-085** [BASSE] `src/lib/accounting/reconciliation.service.ts` - Le parsing CSV pour Desjardins/TD/RBC assume un format specifique. Pas de validation de header ni detection auto du format.

### DONNEES (suite)
- **ACF-086** [HAUTE] `src/lib/accounting/canadian-tax-config.ts` - Les `PAYROLL_RATES_QC_2026` n'ont pas de date d'effet. Le systeme ne peut pas gerer la transition vers les taux 2027 sans modifier le code.
- **ACF-087** [MOYENNE] `src/lib/accounting/gifi-codes.ts` - Le mapping GIFI code 2680 est utilise pour 7 comptes differents de passifs (charges a payer, salaires, interets, vacances...). Trop generique pour une declaration T2 precise.
- **ACF-088** [BASSE] `src/lib/tax-constants.ts` - Seulement 6 lignes: `GST_RATE = 0.05` et `QST_RATE = 0.09975`. Duplique les taux de `canadian-tax-config.ts`. Source de verite ambigue.

### API (suite)
- **ACF-089** [MOYENNE] `src/app/api/accounting/entries/route.ts` - La pagination GET utilise `skip/take` qui devient lent sur des grandes tables. Devrait utiliser cursor-based pagination.
- **ACF-090** [MOYENNE] Les endpoints `/api/accounting/balance-sheet`, `/api/accounting/income-statement`, `/api/accounting/trial-balance` et `/api/accounting/general-ledger` n'ont pas de cache. Chaque chargement de page regenere le rapport.

### TYPES (suite)
- **ACF-091** [MOYENNE] `src/lib/accounting/types.ts` - `TAX_RATES` utilise des types avec `TPS`, `TVQ`, `TVH`, `PST` mais les interfaces ne sont pas definies proprement. C'est un objet literral non type.
- **ACF-092** [BASSE] `src/lib/accounting/auto-entries.service.ts` - `JournalLine` interface a `id: string` mais `generateSaleEntry()` genere des IDs avec prefixes inconsistants (`line-`, `entry-`, `entry-fee-`, `entry-refund-`).

### PERFORMANCE (suite)
- **ACF-093** [HAUTE] `src/lib/accounting/period-close.service.ts` - `runMonthEndChecklist()` fait 7 verifications sequentielles avec des queries DB chacune. Pas de parallelisation.
- **ACF-094** [MOYENNE] `src/lib/accounting/reconciliation.service.ts` - L'import CSV parse tout le fichier en memoire. Pour des fichiers de releves bancaires de 100K+ lignes, risque OOM.
- **ACF-095** [BASSE] `src/lib/accounting/gifi-codes.ts` - `suggestGifiCode()` itere sur 50+ keyword mappings pour chaque suggestion. Devrait pre-indexer les keywords dans un Map.

### LOGIQUE (suite)
- **ACF-096** [HAUTE] `src/lib/accounting/auto-entries.service.ts` - `generateRefundEntry()` debite DISCOUNTS_RETURNS pour `refund.amount - tps - tvq - tvh` mais ne considere pas PST. Si un remboursement inclut du PST, l'ecriture est desequilibree.
- **ACF-097** [MOYENNE] `src/lib/accounting/forecasting.service.ts` - `forecastRevenue()` permet des projections negatives (F075 FIX) mais l'intervalle de confiance `range.min` est borne a `Math.max(0, ...)`. Inconsistance: la projection peut etre negative mais pas le range.
- **ACF-098** [MOYENNE] `src/lib/accounting/currency.service.ts` - Le cross-rate `fromCAD / toCAD` divise deux taux BOC. Si l'un est 0 (erreur API), division par zero.
- **ACF-099** [BASSE] `src/lib/accounting/recurring-entries.service.ts` - `PREDEFINED_TEMPLATES[3]` (Provision creances douteuses) a des montants 0/0. Le template est inutilisable tel quel.
- **ACF-100** [BASSE] `src/lib/accounting/auto-entries.service.ts` - `validateEntry()` verifie `difference >= 0.01` mais la tolerance devrait etre configurable par devise (JPY = 1, CAD = 0.01).

---

## AMELIORATIONS (ACA-001 a ACA-100)

### SECURITE
- **ACA-001** Ajouter un audit trail signe (HMAC) pour detecter les modifications directes en DB des ecritures comptables.
- **ACA-002** Implementer le chiffrement at-rest pour les numeros de compte bancaire dans `BankAccount` table.
- **ACA-003** Ajouter une validation RBAC granulaire: seuls les comptables certifies peuvent poster des ecritures, les assistants ne peuvent que creer des brouillons.
- **ACA-004** Implementer un mecanisme de dual-approval pour les ecritures depassant un seuil configurable (ex: >50K$).
- **ACA-005** Ajouter rate limiting specifique a l'endpoint OCR (couteux en tokens OpenAI) - max 10 scans/heure.
- **ACA-006** Chiffrer les donnees OCR en transit et ne pas stocker les images de factures en base de donnees apres extraction.
- **ACA-007** Ajouter une detection de fraude basique: alerter si le meme fournisseur a des factures avec le meme montant exact dans un court laps de temps.
- **ACA-008** Implementer la segregation des taches: la meme personne ne devrait pas pouvoir creer et approuver une ecriture.
- **ACA-009** Ajouter un watermark "CONFIDENTIEL" sur les rapports PDF exportes avec l'ID de l'utilisateur qui a genere le rapport.
- **ACA-010** Implementer un log d'export: chaque telechargement de rapport PDF/CSV est trace dans l'audit trail.

### ERREURS
- **ACA-011** Ajouter un systeme de notification par email quand une ecriture automatique (Stripe sync, recurring) echoue.
- **ACA-012** Implementer un dead-letter queue pour les ecritures Stripe qui echouent a la synchronisation.
- **ACA-013** Ajouter une validation pre-cloture qui liste TOUS les problemes avant de permettre la cloture de periode.
- **ACA-014** Implementer un mecanisme de recovery automatique pour les ecritures recurrentes echouees (au-dela du retry actuel de 3x).
- **ACA-015** Ajouter un health check specifique pour la connexion Stripe dans le cron monitor.
- **ACA-016** Implementer un circuit breaker pour les appels BOC API (taux de change) pour eviter les cascades d'erreurs.
- **ACA-017** Ajouter une verification de coherence post-cloture: re-verifier la balance trial apres le verrouillage.
- **ACA-018** Implementer des alertes en temps reel (WebSocket/SSE) pour les erreurs critiques de comptabilite.
- **ACA-019** Ajouter un systeme de rollback granulaire par ecriture (pas seulement par annee complete).
- **ACA-020** Implementer un systeme de brouillons auto-sauvegardes pour les ecritures manuelles en cours de saisie.

### DONNEES
- **ACA-021** Migrer les taux de taxe de constantes hardcodees vers une table DB `TaxRate` avec date d'effet et historique.
- **ACA-022** Ajouter un champ `fiscalYear` sur `JournalEntry` pour faciliter les requetes multi-exercices.
- **ACA-023** Implementer le support multi-devises natif sur les ecritures de journal (montant original + montant converti).
- **ACA-024** Ajouter un systeme de tags/labels personnalises sur les ecritures pour le suivi de projets.
- **ACA-025** Implementer un historique des modifications sur les ecritures de journal (versionning avec diff).
- **ACA-026** Migrer le champ `details` (TEXT/JSON.stringify) de AuditLog vers JSONB PostgreSQL natif pour les requetes.
- **ACA-027** Ajouter le support des ecritures inter-devises avec calcul automatique du gain/perte de change au posting.
- **ACA-028** Implementer un systeme de pieces jointes liees aux ecritures (pas seulement via OCR).
- **ACA-029** Ajouter un champ `approvedBy` et `approvedAt` sur JournalEntry pour le workflow d'approbation.
- **ACA-030** Implementer la gestion des numeros de sequences par serie (par type d'ecriture) plutot qu'une seule serie globale.

### ACCESSIBILITE
- **ACA-031** Ajouter `role="img"` et `aria-label` descriptifs a tous les graphiques SVG du dashboard comptable.
- **ACA-032** Implementer des tableaux de donnees alternatifs aux graphiques pour les utilisateurs de lecteurs d'ecran.
- **ACA-033** Ajouter des patterns/hachures aux segments du donut chart pour la distinction sans couleur.
- **ACA-034** Implementer la navigation au clavier complete dans les tableaux d'ecritures (Tab, Arrow keys).
- **ACA-035** Ajouter des `aria-live` regions pour les mises a jour dynamiques (chargement de donnees, alertes).

### I18N
- **ACA-036** Externaliser tous les messages d'alerte comptable dans les fichiers i18n (22 locales).
- **ACA-037** Traduire les noms de departements et les templates recurrants dans tous les locales supportes.
- **ACA-038** Ajouter le support de toutes les 22 locales dans la generation de rapports PDF (pas seulement fr/en).
- **ACA-039** Localiser les formats de numeros de comptes selon la convention du pays de l'utilisateur.
- **ACA-040** Ajouter le support RTL (arabe) dans les rapports PDF generes.

### PERFORMANCE
- **ACA-041** Refactorer `calculateKPIs()` pour utiliser une seule requete GROUP BY au lieu de 15+ requetes sequentielles.
- **ACA-042** Implementer un cache Redis pour les KPIs et les rapports financiers (invalidation sur nouvelle ecriture postee).
- **ACA-043** Ajouter la pagination cursor-based pour les endpoints d'ecritures de journal (remplacer skip/take).
- **ACA-044** Implementer le streaming pour l'export CSV des ecritures (pas tout en memoire).
- **ACA-045** Ajouter des index DB partiels pour les requetes frequentes: `WHERE status = 'POSTED' AND deletedAt IS NULL`.
- **ACA-046** Implementer la parallelisation dans `fullStripeSync()` (charges, refunds, payouts en parallele).
- **ACA-047** Ajouter un pre-calcul batch des soldes de comptes par periode pour eviter les recalculs a la volee.
- **ACA-048** Implementer le lazy-loading des graphiques du dashboard (Intersection Observer).
- **ACA-049** Ajouter un systeme de materialized views pour les rapports financiers frequemment consultes.
- **ACA-050** Optimiser l'auto-reconciliation avec des index sur (amount, date, reconciliationStatus) dans BankTransaction.

### UX
- **ACA-051** Implementer les tendances comparatives reelles (vs mois precedent, vs meme mois annee precedente) dans le dashboard.
- **ACA-052** Ajouter la generation dynamique des options de periode basee sur les periodes comptables existantes.
- **ACA-053** Implementer l'export PDF/Excel reel des rapports financiers (actuellement "Coming Soon").
- **ACA-054** Ajouter un wizard step-by-step pour la cloture de fin de mois/annee.
- **ACA-055** Implementer un mode "brouillon" avec sauvegarde automatique pour les ecritures manuelles complexes.
- **ACA-056** Ajouter un tableau de bord de rapprochement bancaire visuel avec drag-and-drop matching.
- **ACA-057** Implementer des raccourcis clavier pour la saisie rapide d'ecritures (Tab entre champs, Ctrl+Enter pour poster).
- **ACA-058** Ajouter des graphiques de tendance inline dans les cards KPI (sparklines).
- **ACA-059** Implementer un calendrier fiscal interactif avec les echeances et rappels.
- **ACA-060** Ajouter la possibilite de personnaliser le dashboard comptable (widgets reordonnables).

### API
- **ACA-061** Ajouter un endpoint `/api/accounting/health` qui verifie la connexion DB, Stripe, et les taux de change.
- **ACA-062** Implementer le versioning API (v1/v2) pour les endpoints comptables pour les futures migrations.
- **ACA-063** Ajouter des webhooks sortants pour les evenements comptables (nouvelle ecriture, facture payee, alerte).
- **ACA-064** Implementer un endpoint batch pour creer plusieurs ecritures en une seule requete atomique.
- **ACA-065** Ajouter un endpoint de simulation "what-if" qui calcule l'impact d'une ecriture sans la persister.
- **ACA-066** Implementer le support GraphQL pour les requetes de reporting flexibles.
- **ACA-067** Ajouter un endpoint d'export GIFI format pour les declarations T2 (Schedule 100/125).
- **ACA-068** Implementer un endpoint de reconciliation automatique on-demand (pas seulement via cron).
- **ACA-069** Ajouter un endpoint pour generer la declaration TPS/TVQ pre-remplie au format XML Revenu Quebec.
- **ACA-070** Implementer un endpoint de comparaison budgetaire avec drill-down par departement et categorie.

### TYPES
- **ACA-071** Definir un union type strict pour `JournalEntryType` au lieu de `string`.
- **ACA-072** Creer un type `Money` avec devise et montant pour eviter les confusions de devises.
- **ACA-073** Ajouter des branded types pour les IDs (`EntryId`, `AccountId`, `InvoiceId`) pour eviter les erreurs de parametres.
- **ACA-074** Definir des discriminated unions pour les differents types d'alertes comptables.
- **ACA-075** Creer un type `Period` avec validation (format YYYY-MM) pour les parametres de periode.

### LOGIQUE
- **ACA-076** Implementer la gestion des notes de credit avec application automatique sur les factures.
- **ACA-077** Ajouter le support des paiements partiels avec suivi du solde restant et echeancier.
- **ACA-078** Implementer un systeme de provision automatique pour les creances douteuses base sur l'aging.
- **ACA-079** Ajouter le calcul automatique de la TPS/TVQ sur les ecritures de depenses.
- **ACA-080** Implementer un rapprochement three-way (bon de commande + facture + reception) pour les achats.
- **ACA-081** Ajouter un mecanisme de verrouillage des taux de change pour les transactions en cours.
- **ACA-082** Implementer les regles de place of supply pour la TVH inter-provinciale automatiquement.
- **ACA-083** Ajouter le calcul automatique des interets de retard sur les factures impayees.
- **ACA-084** Implementer un systeme de budget par projet (pas seulement par departement).
- **ACA-085** Ajouter la detection automatique de doublons potentiels dans les ecritures.
- **ACA-086** Implementer le support des devises a 0 decimales (JPY) et 3 decimales (KWD, BHD).
- **ACA-087** Ajouter un calendrier de depreciation automatique avec les classes CCA.
- **ACA-088** Implementer un rapprochement automatique Stripe<->Banque pour les virements.
- **ACA-089** Ajouter le support des avoirs fournisseurs et leur application sur les factures d'achat.
- **ACA-090** Implementer une detection de gap dans la sequence des numeros d'ecritures.

### MISC
- **ACA-091** Ajouter des tests unitaires pour `calculateTaxes()` avec tous les scenarii provinciaux.
- **ACA-092** Implementer des tests d'integration pour le flux complet vente->ecriture->rapprochement->cloture.
- **ACA-093** Ajouter des metriques Prometheus pour les operations comptables (latence, erreurs, volumes).
- **ACA-094** Implementer un mode simulation/sandbox pour tester les ecritures sans affecter les donnees reelles.
- **ACA-095** Ajouter un systeme de templates d'ecritures personnalisables par l'utilisateur.
- **ACA-096** Implementer l'import de plan comptable depuis d'autres logiciels (QuickBooks, Sage).
- **ACA-097** Ajouter le support des releves de carte de credit comme source de transactions.
- **ACA-098** Implementer un rapport de flux de tresorerie (cash flow statement) automatique.
- **ACA-099** Ajouter un systeme d'annotations/commentaires sur les ecritures pour la collaboration.
- **ACA-100** Implementer un dashboard mobile-responsive avec les KPIs critiques.

---

# SECTION 2: SYSTEME (Auth, Security, Cron, Config, Headers, Middleware)

## FAILLES / BUGS (SF-001 a SF-100)

### SECURITE
- **SF-001** [CRITIQUE] `next.config.js` - `typescript.ignoreBuildErrors: true` desactive le type checking au build. Les 958 erreurs TypeScript pre-existantes incluent potentiellement des bugs de securite non detectes.
- **SF-002** [CRITIQUE] `src/lib/auth-config.ts` L393 - `session.user.mfaVerified = true` pour TOUS les providers OAuth. Le MFA est bypasse completement pour les connexions Google/Apple/Twitter.
- **SF-003** [CRITIQUE] `src/lib/session-security.ts` - Toutes les sessions sont stockees en memoire (`Map`). Un redemarrage du serveur deconnecte tous les utilisateurs sans journalisation. Pas de persistence Redis.
- **SF-004** [HAUTE] `src/lib/auth-config.ts` L24 - `type AuthProvider = any` bypass le type safety. Des providers mal configures ne seraient pas detectes a la compilation.
- **SF-005** [HAUTE] `src/lib/csrf.ts` - Le cookie CSRF est `httpOnly: false` par design (doit etre lu par JS). Mais le token est aussi expose dans la reponse, un XSS pourrait le voler.
- **SF-006** [HAUTE] `src/lib/auth-config.ts` - `allowDangerousEmailAccountLinking: true` pour Google. Si un attaquant cree un compte avec l'email de la victime avant que celle-ci ne se connecte avec Google, account takeover possible.
- **SF-007** [HAUTE] `src/middleware.ts` L108 - `Math.random() < 0.1` pour le sampling des logs. `Math.random()` n'est pas cryptographiquement sur et le sampling est inconsistant entre les instances.
- **SF-008** [HAUTE] `src/lib/user-api-guard.ts` L172 - En mode development, `error.message` est expose au client. Si un dev deploie accidentellement en mode dev, les messages d'erreur internes fuient.
- **SF-009** [HAUTE] `src/lib/token-encryption.ts` - `decryptToken()` retourne le token brut si le dechiffrement echoue (periode de migration). Cela signifie que des tokens non chiffres sont acceptes indefiniment.
- **SF-010** [HAUTE] `src/lib/brute-force-protection.ts` - Le lockout notification email n'est pas implemente (TODO). L'utilisateur ne sait pas que son compte est verrouille.
- **SF-011** [MOYENNE] `src/lib/security.ts` - `sanitizeUrl()` bloque les IPs privees mais ne bloque pas les noms DNS qui resolvent vers des IPs privees (DNS rebinding attack).
- **SF-012** [MOYENNE] `src/lib/auth-config.ts` - Twitter genere un email placeholder `twitter_${data.id}@noreply.invalid`. Ce faux email pourrait etre utilise dans des logiques de matching email.
- **SF-013** [MOYENNE] `src/lib/csrf.ts` - Le token CSRF expire apres 1 heure sans auto-refresh. Si l'utilisateur reste sur un formulaire plus d'une heure, la soumission echoue sans explication claire.
- **SF-014** [MOYENNE] `src/lib/rate-limiter.ts` - `checkRateLimitSync()` utilise toujours la memoire locale, bypassant Redis. En multi-instance, le rate limiting est inefficace pour les requetes synchrones.
- **SF-015** [MOYENNE] `src/lib/mfa.ts` - `authenticator.options.window = 1` accepte le code precedent et suivant. Fenetre de 90 secondes au total (3 codes valides simultanement).
- **SF-016** [MOYENNE] `src/app/api/auth/forgot-password/route.ts` L60 - Le logger log l'email en clair pour les utilisateurs inexistants: `Password reset requested for non-existent email: ${email}`. Information leak dans les logs.
- **SF-017** [MOYENNE] `src/app/api/auth/reset-password/route.ts` - Le schema de validation `password` ne verifie pas les regles NYDFS (majuscule, minuscule, chiffre, special) comme le fait le signup. Un mot de passe faible pourrait etre accepte.
- **SF-018** [BASSE] `next.config.js` - CSP utilise `unsafe-inline` pour scripts et styles. Reduit significativement la protection XSS.
- **SF-019** [BASSE] `src/lib/auth-config.ts` - Les cookies de session n'ont pas le prefixe `__Secure-` (pour compatibilite Azure). Cela affaiblit la protection cookie en environnement non-Azure.
- **SF-020** [BASSE] `src/lib/security.ts` - `passwordSchema` regex pour caracteres speciaux `[!@#$%^&*(),.?":{}|<>]` n'inclut pas `-`, `_`, `~`, `+`. Des mots de passe avec ces caracteres ne sont pas consideres comme ayant un special.

### ERREURS
- **SF-021** [CRITIQUE] `src/lib/session-security.ts` - Le cleanup toutes les 5 minutes utilise `setInterval` qui n'est jamais nettoye. En serverless (Azure Functions), le timer survit entre les invocations cold start.
- **SF-022** [HAUTE] `src/lib/cron-lock.ts` - Le fallback in-memory pour les locks cron ne fonctionne pas en multi-instance. Deux instances Azure peuvent executer le meme job simultanément.
- **SF-023** [HAUTE] `src/lib/cron-monitor.ts` - Le seuil "unhealthy" est 2x l'intervalle attendu. Mais si le cron est desactive intentionnellement, toutes les health checks reportent "unhealthy" sans distinction.
- **SF-024** [HAUTE] `src/app/api/cron/data-retention/route.ts` - Le hard-delete des sessions et email logs ne cree pas d'audit trail. En cas de litige, impossible de prouver que les donnees ont ete supprimees conformement a la politique.
- **SF-025** [MOYENNE] `src/lib/auth-config.ts` - Le JWT role n'est rafraichi que sur trigger 'update'. Si un admin revoque le role d'un utilisateur, celui-ci garde son ancien role jusqu'a la prochaine connexion.
- **SF-026** [MOYENNE] `src/lib/brute-force-protection.ts` - `MAP_MAX_SIZE: 10,000` pour le fallback in-memory. Si un botnet utilise 10,000+ IPs differentes, les anciennes entrees sont supprimees et le lockout est reset.
- **SF-027** [MOYENNE] `src/app/api/auth/forgot-password/route.ts` L100 - `NEXT_PUBLIC_APP_URL` est utilisee pour construire le reset URL. Si non definie en production, le lien pointe vers `http://localhost:3000`.
- **SF-028** [MOYENNE] `src/lib/logger.ts` - Le transport fichier pour les erreurs en production (`10MB, 5 files, tailable`) ne couvre que les erreurs. Les logs info/warn sont perdus en cas de probleme a debugger.
- **SF-029** [BASSE] `src/lib/admin-audit.ts` - `parseDetails()` catch les erreurs de parse JSON et log sur `console.error` au lieu de `logger.error`. Inconsistance avec le reste du systeme.
- **SF-030** [BASSE] `src/lib/security.ts` - `rateLimitCleanupInterval` est cree au top-level du module. En serverless, ce timer est cree a chaque cold start mais jamais nettoye si le process est recycle.

### DONNEES
- **SF-031** [CRITIQUE] `src/lib/session-security.ts` - Les sessions concurrent (max 3) sont gerees via `deleteMany` en DB mais les sessions in-memory ne sont pas synchronisees. Un utilisateur pourrait avoir 3 sessions DB + N sessions in-memory.
- **SF-032** [HAUTE] `src/lib/mfa.ts` - Les backup codes sont stockes comme JSON stringifie puis chiffre en un seul blob. Pas de tracking individuel de l'utilisation de chaque code.
- **SF-033** [HAUTE] `src/app/api/auth/forgot-password/route.ts` - Le champ `resetToken` en DB n'a peut-etre pas d'index. La recherche `findFirst` avec `resetToken + resetTokenExpiry > now + email` pourrait etre lente.
- **SF-034** [MOYENNE] `src/lib/admin-audit.ts` - Les logs d'audit stockent l'`ipAddress` et `userAgent` qui sont des donnees personnelles RGPD. Pas de politique de retention specifique pour ces champs.
- **SF-035** [MOYENNE] `src/lib/auth-config.ts` - Le `session.maxAge: 3600` (1 heure) mais `session-security.ts` a `ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000` (8 heures). Conflit de durees de session.
- **SF-036** [BASSE] `src/lib/cron-monitor.ts` - Les stats d'execution cron sont stockees en Redis ou memoire. En cas de restart, tout l'historique de sante est perdu.
- **SF-037** [BASSE] `src/app/api/auth/reset-password/route.ts` - `addToPasswordHistory()` est appele apres la mise a jour du mot de passe. Si l'ajout a l'historique echoue, le mot de passe est change mais pas enregistre dans l'historique.

### ACCESSIBILITE
- **SF-038** [HAUTE] Les pages d'erreur 401/403/404 generees par le middleware n'ont pas de contenu accessible. Un lecteur d'ecran recoit juste le code HTTP.
- **SF-039** [MOYENNE] `src/app/api/auth/signup/route.ts` - Les messages d'erreur de validation (`password_min_length`, `password_uppercase_required`) sont des codes i18n non traduits cote API. Le frontend doit les mapper.
- **SF-040** [BASSE] Les pages d'authentification (login, signup, reset-password) n'ont pas de `aria-live` pour les messages d'erreur dynamiques.

### I18N
- **SF-041** [HAUTE] `src/lib/security.ts` - Les messages de validation Zod (`invalid_email`, `password_min_length`, etc.) sont des codes anglophones. Le mapping i18n depend entierement du frontend.
- **SF-042** [HAUTE] `src/app/api/auth/forgot-password/route.ts` - Le message de succes est en francais hardcode: "Si un compte existe avec cet email, vous recevrez un lien de reinitialisation."
- **SF-043** [MOYENNE] `src/app/api/auth/reset-password/route.ts` - Messages d'erreur en francais: "Lien de reinitialisation invalide ou expire", "Ce mot de passe a deja ete utilise". Non localises.
- **SF-044** [MOYENNE] `src/lib/admin-api-guard.ts` - Messages d'erreur en anglais: "Unauthorized", "Forbidden", "Too many requests". Inconsistant avec les autres routes en francais.
- **SF-045** [BASSE] `src/lib/mfa.ts` - L'app name TOTP est `NEXT_PUBLIC_APP_NAME || 'BioCycle Peptides'`. L'utilisateur voit ce nom dans Google Authenticator. Pas localise.

### PERFORMANCE
- **SF-046** [HAUTE] `src/lib/rate-limiter.ts` - 25+ configurations de rate limiting, chacune avec sa propre fenetre. Le nettoyage toutes les 5 minutes itere sur TOUTES les entrees, meme les expirees depuis longtemps.
- **SF-047** [HAUTE] `src/middleware.ts` - Le middleware execute `auth()` pour CHAQUE requete, y compris les assets statiques. Devrait exclure `/_next/static`, `/favicon.ico`, etc.
- **SF-048** [MOYENNE] `src/lib/session-security.ts` - `cleanupExpiredSessions()` fait un `deleteMany` en DB toutes les 5 minutes sans index sur `expires`. Query lente sur une grande table sessions.
- **SF-049** [MOYENNE] `src/lib/admin-api-guard.ts` - `new URL(request.url).pathname` est appele 3 fois dans la meme execution (logging, rate limiting, CSRF logging). Devrait etre calcule une seule fois.
- **SF-050** [BASSE] `src/lib/security.ts` - `escapeHtml()` utilise un regex avec remplacement character-by-character. Pour de gros volumes de texte, une methode par Map serait plus rapide.

### UX
- **SF-051** [HAUTE] `src/lib/csrf.ts` - Quand le token CSRF expire (1h), l'utilisateur recoit un "Invalid CSRF token" sans message explicatif. Devrait rafraichir automatiquement le token.
- **SF-052** [HAUTE] `src/lib/brute-force-protection.ts` - Le message de lockout est generique par design (anti-enumeration) mais ne dit pas a l'utilisateur QUAND le lockout expire.
- **SF-053** [MOYENNE] `src/app/api/auth/signup/route.ts` - La reponse anti-enumeration retourne le meme message que le succes. L'utilisateur qui fait une faute de frappe dans son email croit avoir recu l'email alors qu'il n'existe pas.
- **SF-054** [MOYENNE] `src/middleware.ts` - `ADMIN_ROUTE_PERMISSIONS` renvoie 403 sans detailler quelle permission manque. L'admin ne sait pas ce qu'il doit demander.
- **SF-055** [BASSE] `src/lib/cron-monitor.ts` - Le health check GET n'a pas de format humain. Retourne du JSON brut, pas de page de status lisible.

### API
- **SF-056** [CRITIQUE] `src/app/api/auth/[...nextauth]/route.ts` - L'endpoint NextAuth est expose sans rate limiting specifique. Un attaquant peut bruteforcer le login via cet endpoint.
- **SF-057** [HAUTE] `src/app/api/cron/update-exchange-rates/route.ts` - L'endpoint accepte GET et POST identiquement. Le GET devrait etre readonly (health check), le POST devrait executer la mise a jour.
- **SF-058** [HAUTE] `src/lib/user-api-guard.ts` - Pas de validation de taille du body (`content-length`) comme dans `admin-api-guard.ts`. Un utilisateur pourrait envoyer un body de 100MB.
- **SF-059** [MOYENNE] `src/app/api/auth/webauthn/*/route.ts` - 4 routes WebAuthn (register options/verify, authenticate options/verify). Pas de rate limiting specifique pour la phase de challenge.
- **SF-060** [MOYENNE] `src/app/api/auth/accept-terms/route.ts` - L'endpoint d'acceptation des CGV n'est pas protege par CSRF. Un attaquant pourrait forcer l'acceptation via CSRF attack.

### TYPES
- **SF-061** [HAUTE] `src/lib/admin-api-guard.ts` L35 - `context: any` pour le type du handler. Perte complete de type safety sur les parametres de route.
- **SF-062** [HAUTE] `src/lib/admin-api-guard.ts` L106 - `routeContext?: any` pour le second parametre. Double `any` dans le meme fichier.
- **SF-063** [MOYENNE] `src/lib/auth-config.ts` L24 - `type AuthProvider = any` avec eslint-disable. Le type correct serait le type Provider de NextAuth.
- **SF-064** [MOYENNE] `src/lib/admin-audit.ts` L204 - `where: Record<string, unknown>` pour les filtres de query. Pas de validation de type Prisma.
- **SF-065** [BASSE] `src/lib/security.ts` - `maskSensitiveData(data: Record<string, unknown>)` ne type pas la sortie. Le retour devrait avoir le meme type que l'entree.

### LOGIQUE
- **SF-066** [CRITIQUE] `src/lib/auth-config.ts` - Le callback JWT ne rafraichit le role que sur `trigger === 'update'`. Un changement de role en DB (par un autre admin) n'est PAS detecte jusqu'a ce que l'utilisateur force un update de session.
- **SF-067** [HAUTE] `src/lib/session-security.ts` - La detection d'anomalie (changement IP, UA, pays) est implementee mais la reaction (invalider la session) n'est pas implementee. L'anomalie est loguee mais ignoree.
- **SF-068** [HAUTE] `src/middleware.ts` - `ADMIN_ROUTE_PERMISSIONS` donne OWNER le bypass complet. Si le compte OWNER est compromis, TOUTES les permissions sont accordees sans audit additionnel.
- **SF-069** [HAUTE] `src/lib/cron-lock.ts` - Le timeout AbortController de 5 minutes est cree mais le signal n'est pas passe aux operations internes. Le job peut continuer meme apres le timeout.
- **SF-070** [MOYENNE] `src/app/api/cron/data-retention/route.ts` - La politique de retention des audit logs est 7 ans (2557 jours) mais le calcul `sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7)` ne gere pas les annees bissextiles correctement (off-by-one-day).
- **SF-071** [MOYENNE] `src/lib/security.ts` - `sanitizeUrl()` bloque `169.254.x.x` (Azure IMDS) mais ne bloque pas le hostname `metadata.google.internal` (GCP IMDS) ni `fd00::` (IPv6 ULA).
- **SF-072** [MOYENNE] `src/lib/mfa.ts` - `verifyBackupCode()` itere sequentiellement sur tous les codes hashes avec bcrypt.compare. Pour 10 codes, cela fait jusqu'a 10 comparaisons bcrypt (lentes par design). Pas de shortcut.
- **SF-073** [MOYENNE] `src/lib/auth-config.ts` - Twitter callback n'a pas de verification email_verified (Twitter ne fournit pas ce champ). Un compte Twitter avec un email non verifie pourrait etre lie.
- **SF-074** [BASSE] `src/lib/admin-api-guard.ts` - `getClientIp()` fait confiance a `x-forwarded-for` qui peut etre spoofe si le reverse proxy n'est pas configure pour ecraser ce header.
- **SF-075** [BASSE] `src/lib/user-api-guard.ts` - `getClientIp()` n'a PAS la validation regex d'IP que `admin-api-guard.ts` a. Inconsistance de securite entre les deux guards.

### ERREURS (suite)
- **SF-076** [HAUTE] `src/lib/mfa.ts` - `finalizeMFASetup()` importe prisma dynamiquement via `await import('./db')`. Si l'import echoue, l'erreur est cryptique et non geree.
- **SF-077** [MOYENNE] `src/lib/auth-config.ts` - Le callback `signIn` pour Apple utilise `profile?.email_verified` mais Apple ne retourne pas toujours ce champ. Undefined est falsy, potentiellement bloquant des connexions valides.
- **SF-078** [MOYENNE] `src/app/api/cron/abandoned-cart/route.ts` - Le SMS recovery channel est configurable via env mais aucune validation du format de telephone avant envoi.
- **SF-079** [BASSE] `src/lib/cron-lock.ts` - Le catch de `JSON.parse` pour lire le lock Redis en memoire ne log pas l'erreur. Echec silencieux.
- **SF-080** [BASSE] `src/lib/security.ts` - `createSecurityLog()` retourne un `JSON.stringify()` (string). L'appelant doit re-parser ou le passer au logger, creation double serialisation.

### DONNEES (suite)
- **SF-081** [HAUTE] `src/app/api/cron/data-retention/route.ts` - Les chat messages sont anonymises mais pas les metadonnees (timestamps, roomId, replyTo). Pas completement GDPR-compliant.
- **SF-082** [MOYENNE] `src/lib/auth-config.ts` - Les tokens OAuth (access_token, refresh_token) sont chiffres via token-encryption.ts mais la cle de chiffrement est derivee de `ENCRYPTION_KEY` env. Pas de rotation de cle.
- **SF-083** [BASSE] `src/app/api/auth/signup/route.ts` - L'enregistrement des termes (version + timestamp) est envoye par le client. Le client pourrait envoyer un faux timestamp.

### PERFORMANCE (suite)
- **SF-084** [HAUTE] `src/lib/auth-config.ts` - Le callback JWT charge le user depuis la DB a CHAQUE requete qui trigger un JWT refresh. Devrait mettre en cache le role/permissions.
- **SF-085** [MOYENNE] `src/lib/admin-api-guard.ts` - `hasPermission()` est appele pour chaque requete admin protegee. Si c'est une requete DB, c'est une query par requete HTTP.
- **SF-086** [BASSE] `src/lib/admin-audit.ts` - `logAdminAction()` est async mais appele sans await dans certains routes handlers. Si la DB est lente, les logs d'audit sont perdus sur process kill.

### UX (suite)
- **SF-087** [MOYENNE] `src/app/api/auth/reset-password/route.ts` - Pas de feedback sur la complexite du mot de passe en temps reel. L'utilisateur decouvre les erreurs seulement apres soumission.
- **SF-088** [BASSE] `src/lib/cron-lock.ts` - Le message 409 "Job already running" ne dit pas depuis combien de temps ni quand il est prevu de se terminer.

### API (suite)
- **SF-089** [HAUTE] Les 13 cron jobs utilisent tous `CRON_SECRET` comme unique cle. Si la cle est compromise, TOUS les cron jobs sont accessibles. Devrait avoir une cle par job ou un systeme de scopes.
- **SF-090** [MOYENNE] `src/app/api/cron/data-retention/route.ts` - Le GET (health check) n'est pas authentifie. N'importe qui peut voir les statistiques de retention.
- **SF-091** [MOYENNE] Les endpoints auth (signup, forgot-password, reset-password) n'ont pas de header `Cache-Control: no-store` explicite. Les reponses pourraient etre mises en cache par un CDN.
- **SF-092** [BASSE] `src/app/api/auth/forgot-password/route.ts` - L'endpoint accepte seulement POST mais pourrait beneficier d'un GET qui retourne le CSRF token necessaire pour le formulaire.

### LOGIQUE (suite)
- **SF-093** [HAUTE] `src/middleware.ts` - La resolution du locale est faite a chaque requete middleware mais le resultat n'est pas mis en cache dans le cookie. Le parsing Accept-Language est refait a chaque fois.
- **SF-094** [MOYENNE] `src/lib/session-security.ts` - Le token rotation toutes les heures genere un nouveau token mais l'ancien reste valide jusqu'a expiration. Fenetre d'utilisation des deux tokens.
- **SF-095** [MOYENNE] `src/lib/mfa.ts` - `regenerateBackupCodes()` n'invalide pas les anciens codes avant de generer les nouveaux. Si la mise a jour DB echoue, les anciens codes restent valides ET les nouveaux sont retournes a l'utilisateur.
- **SF-096** [BASSE] `src/lib/admin-api-guard.ts` - La normalisation des paths dynamiques (`/[id]`) utilise un regex qui match les segments de 20+ caracteres. Un segment de 19 caracteres n'est pas normalise, creant un bucket de rate limit different.
- **SF-097** [BASSE] `src/app/api/cron/abandoned-cart/route.ts` - Le batch processing de 10 paniers a la fois est hardcode. Pas de configuration pour ajuster la taille du batch.
- **SF-098** [BASSE] `src/lib/rate-limiter.ts` - Le cleanup in-memory toutes les 5 minutes supprime les entrees >10 minutes. Mais le rate limit le plus long est 3600s (1 heure) pour /api/auth. Ces entrees ne sont jamais nettoyees.
- **SF-099** [BASSE] `src/lib/security.ts` - `cleanupSecurityIntervals()` ecoute SIGTERM mais pas SIGINT. En dev, Ctrl+C (SIGINT) ne nettoie pas le timer.
- **SF-100** [BASSE] `next.config.js` - `serverExternalPackages` inclut 'jsdom' et 'isomorphic-dompurify'. Ces packages sont lourds et charges en serverless meme quand non utilises par la route.

---

## AMELIORATIONS (SA-001 a SA-100)

### SECURITE
- **SA-001** Activer `typescript.ignoreBuildErrors: false` et corriger les 958 erreurs TypeScript. Chaque erreur est un bug potentiel.
- **SA-002** Implementer la verification MFA reelle pour les connexions OAuth (challenge TOTP apres le callback OAuth).
- **SA-003** Migrer les sessions in-memory vers Redis pour la persistence cross-instance et cross-restart.
- **SA-004** Implementer le CSRF auto-refresh: le middleware regenere le token CSRF automatiquement avant expiration.
- **SA-005** Ajouter un mecanisme de rotation de cle de chiffrement (ENCRYPTION_KEY) avec support de dechiffrement avec l'ancienne cle.
- **SA-006** Implementer le Content Security Policy avec des nonces dynamiques au lieu de `unsafe-inline`.
- **SA-007** Ajouter un WAF (Web Application Firewall) pour proteger contre les attaques communes (SQLi, XSS, SSRF).
- **SA-008** Implementer le password breach detection (HaveIBeenPwned API) lors du signup et reset-password.
- **SA-009** Ajouter le support FIDO2/WebAuthn comme second facteur natif (les routes existent deja).
- **SA-010** Implementer le logging centralise de securite avec alertes en temps reel (SIEM-compatible).

### ERREURS
- **SA-011** Remplacer tous les `setInterval` par un systeme de timer central avec cleanup garanti au shutdown.
- **SA-012** Implementer un distributed lock robuste avec Redis Redlock au lieu du SETNX simple.
- **SA-013** Ajouter un circuit breaker pour les appels Redis avec fallback gracieux documenter.
- **SA-014** Implementer un systeme de health check unifie qui aggrege tous les services (DB, Redis, Stripe, BOC API).
- **SA-015** Ajouter un mecanisme de retry avec backoff exponentiel pour les operations auth critiques (signup, reset-password).
- **SA-016** Implementer un dead-letter log pour les echecs de logging d'audit (jamais perdre un log d'audit).
- **SA-017** Ajouter des alertes Slack/email quand un cron job echoue ou ne s'execute pas dans la fenetre prevue.
- **SA-018** Implementer un systeme de graceful shutdown qui complete les requetes en cours avant d'arreter.
- **SA-019** Ajouter un systeme de self-healing: si un service est down, tenter un restart automatique.
- **SA-020** Implementer un diagnostic endpoint (`/api/system/diagnostics`) qui verifie toutes les connexions externes.

### DONNEES
- **SA-021** Implementer un systeme de migration zero-downtime pour les tokens chiffres (double-lecture ancien/nouveau format).
- **SA-022** Ajouter un champ `lastPasswordChange` sur User pour forcer le changement periodique (NYDFS compliance).
- **SA-023** Implementer l'anonymisation automatique des donnees personnelles dans les audit logs apres la periode de retention.
- **SA-024** Ajouter un systeme de backup automatique des sessions actives avant chaque deploiement.
- **SA-025** Implementer le data residency: stocker les donnees des clients EU dans une region EU separee.

### ACCESSIBILITE
- **SA-026** Ajouter des messages d'erreur accessibles (aria-live, role="alert") pour toutes les pages auth.
- **SA-027** Implementer un captcha accessible (hCaptcha avec audio challenge) pour le signup et forgot-password.
- **SA-028** Ajouter des liens "skip to content" sur toutes les pages protegees par auth.
- **SA-029** Implementer le support du mode haut contraste pour les pages d'authentification.
- **SA-030** Ajouter des instructions contextuelles pour les champs de mot de passe (regles NYDFS affichees).

### I18N
- **SA-031** Localiser tous les messages d'erreur des API routes auth dans les 22 locales (utiliser le header Accept-Language).
- **SA-032** Externaliser les messages du middleware (401, 403, 429) dans les fichiers i18n.
- **SA-033** Localiser les emails transactionnels (reset password, lockout notification) dans la locale de l'utilisateur.
- **SA-034** Ajouter le support RTL (arabe) dans les pages d'authentification.
- **SA-035** Localiser les noms d'evenements dans les audit logs pour le dashboard admin.

### PERFORMANCE
- **SA-036** Exclure les routes statiques du middleware auth (`/_next/static`, `/favicon.ico`, images).
- **SA-037** Mettre en cache le resultat de `auth()` dans un header pour eviter les double-appels middleware+route.
- **SA-038** Implementer le lazy-loading des permissions au lieu de les charger a chaque requete admin.
- **SA-039** Ajouter un index sur `Session.expires` et `User.resetTokenExpiry` pour les cleanup queries.
- **SA-040** Implementer le connection pooling Redis avec PgBouncer pour les sessions haute-concurrence.

### UX
- **SA-041** Implementer le CSRF auto-refresh transparent: le frontend renouvelle le token avant expiration.
- **SA-042** Ajouter un indicateur de temps restant avant le lockout expire sur la page de login.
- **SA-043** Implementer la validation de mot de passe en temps reel (progression bar avec les 4 criteres NYDFS).
- **SA-044** Ajouter un systeme de "Remember this device" pour eviter le MFA sur les appareils de confiance.
- **SA-045** Implementer un dashboard de sessions actives permettant a l'utilisateur de revoquer ses propres sessions.
- **SA-046** Ajouter un guide de premiere connexion (onboarding wizard) pour les nouveaux admins.
- **SA-047** Implementer le login sans mot de passe via magic link email.
- **SA-048** Ajouter un ecran de maintenance informant l'utilisateur quand les cron jobs sont en cours.
- **SA-049** Implementer un systeme de notification push pour les alertes de securite (connexion inhabituelle).
- **SA-050** Ajouter un panneau admin de monitoring des cron jobs avec historique visuel.

### API
- **SA-051** Implementer des cles API par cron job au lieu d'un CRON_SECRET unique.
- **SA-052** Ajouter un endpoint `/api/auth/me` qui retourne le profil complet de l'utilisateur connecte.
- **SA-053** Implementer le rate limiting par utilisateur (pas seulement par IP) pour les endpoints auth.
- **SA-054** Ajouter un endpoint de revocation de session (`DELETE /api/auth/sessions/{id}`).
- **SA-055** Implementer un endpoint de changement de mot de passe (necessitant l'ancien mot de passe).
- **SA-056** Ajouter un endpoint de verification d'email (`POST /api/auth/verify-email`) avec token.
- **SA-057** Implementer un endpoint admin pour lister/revoquer toutes les sessions d'un utilisateur.
- **SA-058** Ajouter un endpoint de rotation forcee de mot de passe pour les admins.
- **SA-059** Implementer un endpoint de status systeme public (`GET /api/status`) avec uptime et health.
- **SA-060** Ajouter des OpenAPI/Swagger specs pour tous les endpoints auth et cron.

### TYPES
- **SA-061** Remplacer les `any` dans admin-api-guard.ts par des types generiques properly typed.
- **SA-062** Definir un type strict pour `UserRole` union au lieu de cast `as string`.
- **SA-063** Creer un type `RequestContext` unifie pour admin-guard et user-guard avec les champs communs.
- **SA-064** Ajouter des branded types pour les tokens (CsrfToken, ResetToken, SessionToken).
- **SA-065** Definir un type `CronJobName` union avec tous les noms de jobs valides.

### LOGIQUE
- **SA-066** Implementer la verification periodique du role JWT en background (pas seulement sur trigger 'update').
- **SA-067** Ajouter un mecanisme de reaction aux anomalies de session (invalider, forcer re-auth, notifier).
- **SA-068** Implementer un systeme de permissions basees sur les attributs (ABAC) au lieu du RBAC simple.
- **SA-069** Ajouter un systeme de quotas par utilisateur/role (ex: max 100 exports PDF/jour pour EMPLOYEE).
- **SA-070** Implementer le geo-fencing: bloquer les connexions depuis des pays non autorises.

### MISC
- **SA-071** Ajouter des tests de charge pour les endpoints auth (simuler 1000 connexions simultanees).
- **SA-072** Implementer des tests de penetration automatises dans le pipeline CI/CD.
- **SA-073** Ajouter des tests de regression pour chaque faille corrigee (FAILLE-xxx → test-xxx).
- **SA-074** Implementer un systeme de canary deployment pour les changements de securite.
- **SA-075** Ajouter des metriques de securite au dashboard admin (tentatives de bruteforce, CSRF rejetes, etc.).
- **SA-076** Implementer un systeme de changelog securite visible par les admins.
- **SA-077** Ajouter un mecanisme de feature flags pour desactiver rapidement des fonctionnalites en cas de vulnerabilite.
- **SA-078** Implementer un rapport de conformite automatique (NYDFS, PIPEDA, LPRPDE) generable par les admins.
- **SA-079** Ajouter le support de l'authentification SSO (SAML/OIDC) pour les clients entreprise.
- **SA-080** Implementer un systeme de delegation d'autorite (un admin peut temporairement deleguer ses droits).
- **SA-081** Ajouter le support des IP allowlists/blocklists configurables par l'admin.
- **SA-082** Implementer un systeme de "break glass" pour les acces d'urgence avec audit renforce.
- **SA-083** Ajouter le support de l'authentification par certificat client (mTLS) pour les API B2B.
- **SA-084** Implementer un systeme de quarantaine: les comptes suspects sont restreints automatiquement.
- **SA-085** Ajouter un mecanisme de recovery automatique si Redis tombe (basculer vers DB sessions).
- **SA-086** Implementer le support de plusieurs facteurs d'authentification (TOTP + WebAuthn + SMS).
- **SA-087** Ajouter un systeme de trust scoring base sur le comportement de l'utilisateur.
- **SA-088** Implementer la detection de credential stuffing (correlation entre tentatives multi-comptes).
- **SA-089** Ajouter le support des security keys hardware (YubiKey) via FIDO2.
- **SA-090** Implementer un systeme de configuration centralisee pour tous les parametres de securite.
- **SA-091** Ajouter des alertes automatiques quand les certificats SSL approchent de l'expiration.
- **SA-092** Implementer un systeme de replay attack detection via nonces dans les tokens.
- **SA-093** Ajouter le support de l'IP reputation checking (blocklist communautaires).
- **SA-094** Implementer un systeme de rate limiting adaptatif (plus strict sous attaque, plus souple normalement).
- **SA-095** Ajouter un mecanisme de "progressive challenge" (captcha seulement apres comportement suspect).
- **SA-096** Implementer la separation des responsabilites admin (network admin vs app admin vs security admin).
- **SA-097** Ajouter le support de l'authentification passwordless via passkeys (WebAuthn PRF).
- **SA-098** Implementer un tableau de bord de conformite PCI-DSS pour le traitement des paiements.
- **SA-099** Ajouter un systeme de rotation automatique des secrets (NEXTAUTH_SECRET, CSRF_SECRET).
- **SA-100** Implementer un programme de bug bounty interne avec tracking des vulnerabilites reportees.
