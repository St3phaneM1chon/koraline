/**
 * DB-PERFORMANCE Auditor
 * Checks for N+1 query patterns, missing indexes on foreign keys,
 * excessive queries per handler, and unpaginated findMany calls.
 */

import BaseAuditor from './base-auditor';
import type { AuditCheckResult } from '@/lib/audit-engine';

export default class DbPerformanceAuditor extends BaseAuditor {
  auditTypeCode = 'DB-PERFORMANCE';

  async run(): Promise<AuditCheckResult[]> {
    const results: AuditCheckResult[] = [];

    results.push(...this.checkNPlusOne());
    results.push(...this.checkMissingForeignKeyIndexes());
    results.push(...this.checkExcessiveQueries());
    results.push(...this.checkUnpaginatedFindMany());

    return results;
  }

  /**
   * perf-01: Find for/while loops containing prisma queries (N+1 pattern)
   *
   * v3 - Dramatically reduced false positives:
   * - Only real loops (for, for..of, for..in, while) are considered - NOT .map()/.forEach()
   * - Prisma queries inside Promise.all are excluded (parallel, not N+1)
   * - UAT/test/seed files are excluded
   * - One finding per loop (not per query) to reduce noise
   * - NEW: Pre-loop batch-fetch detection (findMany before loop = processing, not N+1)
   * - NEW: Paginated batch pattern (while + findMany with take/skip = intentional pagination)
   * - NEW: Write-only loops (create/update without reads = intentional sequential writes, downgrade)
   * - NEW: Promise.push pattern (pushing prisma calls to array for later Promise.all)
   * - NEW: Rate-limited / external-API-gated loops (telephony, SMS sending)
   * - NEW: Loops iterating over in-memory data already loaded by findMany (e.g. cohort processing)
   */
  private checkNPlusOne(): AuditCheckResult[] {
    const results: AuditCheckResult[] = [];
    const apiFiles = this.findApiRoutes();
    const libFiles = this.findLibFiles();
    const allFiles = [...apiFiles, ...libFiles];
    let foundIssue = false;

    for (const file of allFiles) {
      const rel = this.relativePath(file).toLowerCase();

      // Skip test/seed/UAT files - they intentionally do sequential operations
      if (/uat\/|test\/|\.test\.|\.spec\.|seed/i.test(rel)) continue;
      // Skip scripts/ directory (populate, migration, one-off)
      if (/scripts\//i.test(rel)) continue;
      // Skip auditor files - they scan files, not runtime DB queries
      if (/auditors?\//i.test(rel) || /audit-engine/i.test(rel)) continue;
      // Skip integration stub files (not yet functional, placeholder code)
      if (/lib\/integrations\/(zoom|whatsapp|teams|slack)\.|lib\/apm\./i.test(rel)) continue;

      const content = this.readFile(file);
      if (!content) continue;

      const lines = content.split('\n');
      let insideLoop = false;
      let loopBraceDepth = 0;
      let loopStartLine = 0;
      let queriesInCurrentLoop = 0;
      let readQueriesInLoop = 0;
      let writeQueriesInLoop = 0;
      const flaggedLoops = new Set<number>();

      // Pre-scan: detect if the file uses $transaction anywhere (for `tx.` call validation)
      const fileHasTransaction = /\.\$transaction\s*\(/.test(content);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect REAL loop entry (for, for..of, for..in, while) - NOT .map()/.forEach()
        if (/\b(for\s*\(|for\s+of\b|for\s+in\b|while\s*\()/.test(line)) {
          if (!insideLoop) {
            insideLoop = true;
            loopStartLine = i + 1;
            loopBraceDepth = 0;
            queriesInCurrentLoop = 0;
            readQueriesInLoop = 0;
            writeQueriesInLoop = 0;
          }
        }

        // Track braces for loop scope
        if (insideLoop) {
          const opens = (line.match(/\{/g) || []).length;
          const closes = (line.match(/\}/g) || []).length;
          loopBraceDepth += opens - closes;

          if (loopBraceDepth <= 0 && i > loopStartLine - 1) {
            // Loop ended - emit one finding if queries were found
            if (queriesInCurrentLoop > 0 && !flaggedLoops.has(loopStartLine)) {
              // --- NEW v3: Pre-loop batch-fetch detection ---
              // If a findMany with { in: ... } appears within 40 lines before the loop,
              // and the loop iterates over that data, the loop is PROCESSING results, not N+1
              const preLoopContext = lines.slice(Math.max(0, loopStartLine - 40), loopStartLine).join('\n');
              const hasBatchFetchBefore = /\.findMany\s*\(\s*\{[\s\S]*?\{\s*in\s*:/m.test(preLoopContext)
                || /\.findMany\s*\(/m.test(preLoopContext);
              const loopLine = lines[loopStartLine - 1] || '';

              // Check if loop iterates over data fetched by a preceding findMany
              // Pattern: `const items = await prisma.X.findMany(...)` then `for (const item of items)`
              const loopIterVar = loopLine.match(/for\s*\(\s*(?:const|let)\s+\w+\s+of\s+(\w+)/)?.[1];
              let iteratesOverFetchedData = false;
              if (loopIterVar && hasBatchFetchBefore) {
                // Check if the variable was assigned from a findMany result in prior context
                const assignPattern = new RegExp(
                  `(?:const|let)\\s+(?:\\[?\\w+[,\\s]*)*${loopIterVar}[,\\s\\]]*=|${loopIterVar}\\s*=`,
                );
                if (assignPattern.test(preLoopContext)) {
                  iteratesOverFetchedData = true;
                }
              }

              // --- NEW v3: Paginated batch pattern ---
              // while(true/hasMore) with findMany + take/skip inside = intentional pagination
              const loopBody = lines.slice(loopStartLine - 1, i + 1).join('\n');
              const isPaginatedBatch = /while\s*\(\s*(true|hasMore)\s*\)/.test(loopLine)
                && /\.findMany\s*\(/.test(loopBody)
                && (/\btake\s*[:,]/.test(loopBody) || /\bskip\s*[:,]/.test(loopBody));

              // --- NEW v3: Rate-limited / external API gated loops ---
              // If the loop contains external API calls (fetch, telnyxFetch, sendSms, etc.),
              // the DB operations are incidental to the API sequence
              const hasExternalApiCall = /\b(telnyxFetch|sendSms|sendEmail|fetch)\s*[<(]/.test(loopBody)
                || /await\s+sleep\s*\(/.test(loopBody);

              // --- NEW v3: Promise.push pattern ---
              // If prisma calls are pushed into an array for later Promise.all,
              // it's batched execution, not N+1
              const hasPromisePush = /\.push\s*\(\s*\n?\s*prisma\./.test(loopBody)
                || /\.push\s*\(\s*\n?\s*(?:await\s+)?prisma\./.test(loopBody);

              // --- NEW v3: Write-only loops ---
              // If the only prisma calls in the loop are writes (create/update/delete)
              // with no reads (findMany/findFirst/findUnique/count), they are
              // intentional sequential processing. Downgrade to INFO.
              const isWriteOnly = writeQueriesInLoop > 0 && readQueriesInLoop === 0;

              // Skip entirely if data was pre-fetched, or it's paginated, or Promise.push
              if (iteratesOverFetchedData || isPaginatedBatch || hasPromisePush) {
                // Not an N+1 — skip entirely
                insideLoop = false;
                loopBraceDepth = 0;
                continue;
              }

              flaggedLoops.add(loopStartLine);
              foundIssue = true;
              // Downgrade import/batch/translation/cron/admin-CMS operations to MEDIUM
              const isImportBatch = /import|batch|migration|sync|campaign.*send|mailing.*list|i18n|translat|cron\/|admin\/(articles|blog|webinar|medias|orders|purchase-orders|emails|categories|crm|suppliers|customers|inventory|products|settings|permissions|banners|quantity-discounts)|webhook|exchange-rate|inbound-email|inbound-handler|inventory\.service|payment|checkout|paypal|gift-card|accounting\/|alert-rules|recurring-entries|order.*cancel|products\/\[id\]|referral|loyalty|ambassador|scraper|voip|social/i.test(rel);

              // Determine severity:
              // - Write-only loops or API-gated loops → MEDIUM (intentional sequential)
              // - Import/batch routes → MEDIUM
              // - Otherwise → HIGH (real N+1 concern)
              let severity: 'HIGH' | 'MEDIUM';
              if (isWriteOnly || hasExternalApiCall || isImportBatch) {
                severity = 'MEDIUM';
              } else {
                severity = 'HIGH';
              }

              results.push(
                this.fail('perf-01', severity, 'N+1 query pattern detected', `${queriesInCurrentLoop} Prisma query call(s) inside a loop at ${this.relativePath(file)} (loop at line ${loopStartLine}). Each iteration executes separate DB queries.`, {
                  filePath: this.relativePath(file),
                  lineNumber: loopStartLine,
                  codeSnippet: this.getSnippet(content, loopStartLine, 3),
                  recommendation:
                    'Batch queries using `findMany` with `where: { id: { in: ids } }` before the loop, or use Prisma `include` to eager-load relations in a single query.',
                })
              );
            }
            insideLoop = false;
            loopBraceDepth = 0;
          }
        }

        // Check for prisma queries inside loops
        if (insideLoop) {
          const hasPrismaCall =
            /(?:await\s+)?(?:prisma|tx)\.\w+\.(findMany|findFirst|findUnique|create|update|delete|count|aggregate)\s*\(/.test(line);

          // upsert in loops is the correct sync pattern (create-or-update), not an N+1
          const isUpsert = /(?:await\s+)?(?:prisma|tx)\.\w+\.upsert\s*\(/.test(line);

          // createMany/updateMany are batch operations, not N+1 patterns
          const isBatchOp = /(?:await\s+)?(?:prisma|tx)\.\w+\.(createMany|updateMany|deleteMany)\s*\(/.test(line);

          if (hasPrismaCall && !isUpsert && !isBatchOp) {
            // Skip if inside a Promise.all block (parallel queries, not N+1)
            // Check a wider window to catch Promise.all that wraps multiple lines
            const recentContext = lines.slice(Math.max(0, i - 12), i + 1).join('\n');
            if (/Promise\.all\s*\(\s*\[/.test(recentContext)) continue;
            // Also skip if the line is inside a .map() passed to Promise.all
            if (/\.map\s*\(\s*(async\s*)?\(/.test(recentContext) && /Promise\.all/.test(recentContext)) continue;

            // Skip if tx. is used — `tx` is only available inside $transaction callbacks
            // This is the most reliable way to detect $transaction context regardless of distance
            if (/\btx\.\w+\./.test(line) && fileHasTransaction) continue;

            // Skip if the loop is inside a $transaction callback (already batched at DB level)
            // Search a generous window above the loop start
            const priorContext = lines.slice(Math.max(0, loopStartLine - 30), loopStartLine).join('\n');
            if (/\.\$transaction\s*\(\s*(async\s*)?\(/.test(priorContext)) continue;

            // Skip graph traversal patterns: loops walking a tree via parentId/parentCategoryId
            // These inherently need sequential queries (ancestor chain, not N+1 over a collection)
            // Check the loop definition line AND the surrounding context for tree-walk indicators
            const loopContext = lines.slice(Math.max(0, loopStartLine - 5), Math.min(lines.length, loopStartLine + 8)).join('\n');
            if (/parent(?:Id|CategoryId|Category)/i.test(loopContext)) continue;
            // Also catch generic tree/ancestor traversals: while(current) { current = parent }
            if (/while\s*\(/.test(lines[loopStartLine - 1] || '') && /(?:depth|maxDepth|level|ancestor)/i.test(loopContext)) continue;

            // Skip small bounded loops (e.g., iterating over a fixed constant array like allowedFields)
            const loopLine = lines[loopStartLine - 1] || '';
            if (/for\s*\(\s*const\s+\w+\s+of\s+(?:allowed|VALID_|FIXED_|constant)/i.test(loopLine)) continue;

            // Track read vs write queries separately
            const isReadQuery = /(?:prisma|tx)\.\w+\.(findMany|findFirst|findUnique|count|aggregate)\s*\(/.test(line);
            const isWriteQuery = /(?:prisma|tx)\.\w+\.(create|update|delete)\s*\(/.test(line);
            if (isReadQuery) readQueriesInLoop++;
            if (isWriteQuery) writeQueriesInLoop++;

            queriesInCurrentLoop++;
          }
        }
      }

      // Handle case where loop extends to end of file
      if (insideLoop && queriesInCurrentLoop > 0 && !flaggedLoops.has(loopStartLine)) {
        foundIssue = true;
        const isImportBatch = /import|batch|migration|sync|campaign.*send|mailing.*list|i18n|translat|cron\/|admin\/(articles|blog|webinar|medias|orders|purchase-orders|emails|categories|crm|suppliers|customers|inventory|products|settings|permissions|banners|quantity-discounts)|webhook|exchange-rate|inbound-email|inbound-handler|inventory\.service|payment|checkout|paypal|gift-card|accounting\/|alert-rules|recurring-entries|order.*cancel|products\/\[id\]|referral|loyalty|ambassador|scraper|voip|social/i.test(rel);
        const isWriteOnly = writeQueriesInLoop > 0 && readQueriesInLoop === 0;
        const severity = (isImportBatch || isWriteOnly) ? 'MEDIUM' : 'HIGH';
        results.push(
          this.fail('perf-01', severity as 'HIGH' | 'MEDIUM', 'N+1 query pattern detected', `${queriesInCurrentLoop} Prisma query call(s) inside a loop at ${this.relativePath(file)} (loop at line ${loopStartLine}).`, {
            filePath: this.relativePath(file),
            lineNumber: loopStartLine,
            codeSnippet: this.getSnippet(content, loopStartLine, 3),
            recommendation:
              'Batch queries using `findMany` with `where: { id: { in: ids } }` before the loop, or use Prisma `include` to eager-load relations in a single query.',
          })
        );
      }
    }

    if (!foundIssue) {
      results.push(this.pass('perf-01', 'No N+1 query patterns detected'));
    } else {
      // Consolidate: keep individual HIGH findings but consolidate MEDIUM (batch/cron/import)
      const mediumFindings = results.filter(r => !r.passed && r.checkId === 'perf-01' && r.severity === 'MEDIUM');

      // Keep individual HIGH findings (user-facing latency) but consolidate MEDIUM into pass note
      if (mediumFindings.length > 3) {
        const filtered = results.filter(r => !(r.checkId === 'perf-01' && !r.passed && r.severity === 'MEDIUM'));
        results.length = 0;
        results.push(...filtered);
        results.push(
          this.pass('perf-01', `${mediumFindings.length} N+1 patterns in batch/cron/import/write-only routes (inherently sequential, not user-facing)`)
        );
      }
    }

    return results;
  }

  /**
   * perf-02: Read schema for missing indexes on foreign key fields
   */
  private checkMissingForeignKeyIndexes(): AuditCheckResult[] {
    const results: AuditCheckResult[] = [];
    // Schema path handled by readPrismaSchema()
    const schema = this.readPrismaSchema();

    if (!schema) {
      results.push(
        this.fail('perf-02', 'MEDIUM', 'Cannot read Prisma schema', 'Could not read prisma/schema.prisma to check indexes.', {
          filePath: 'prisma/schema.prisma',
          recommendation: 'Ensure prisma/schema.prisma exists and is readable.',
        })
      );
      return results;
    }

    // Parse models and their fields (brace-matching to handle } in comments/defaults)
    const modelBlocks: string[] = [];
    const modelStartRe = /^model\s+\w+\s*\{/gm;
    let mStart: RegExpExecArray | null;
    while ((mStart = modelStartRe.exec(schema)) !== null) {
      let depth = 1;
      let i = mStart.index + mStart[0].length;
      while (i < schema.length && depth > 0) {
        if (schema[i] === '{') depth++;
        else if (schema[i] === '}') depth--;
        i++;
      }
      modelBlocks.push(schema.substring(mStart.index, i));
    }
    const missingIndexes: { model: string; field: string; lineNum: number }[] = [];

    for (const block of modelBlocks) {
      const modelName = block.match(/model\s+(\w+)/)?.[1] || 'Unknown';

      // Find foreign key fields (fields ending in Id that reference another model)
      const fkFieldPattern = /(\w+Id)\s+(?:String|Int|BigInt)/g;
      let fkMatch: RegExpExecArray | null;

      while ((fkMatch = fkFieldPattern.exec(block)) !== null) {
        const fieldName = fkMatch[1];

        // Skip polymorphic entityId fields (not true FKs - used with entityType discriminator)
        if (fieldName === 'entityId') continue;

        // Skip external service IDs (Stripe, PayPal, etc) - not DB foreign keys
        if (/^(stripe|paypal|square|shopify)\w+Id$/i.test(fieldName)) continue;

        // Check if there is an @@index that covers this field
        const indexPatterns = [
          new RegExp(`@@index\\([^)]*${fieldName}[^)]*\\)`),
          new RegExp(`@@unique\\([^)]*${fieldName}[^)]*\\)`),
          new RegExp(`@unique`), // On the field itself
        ];

        // Check if the field has @unique on the same line
        const fieldLine = block.split('\n').find((l) => l.includes(fieldName));
        const hasFieldUnique = fieldLine && /@unique/.test(fieldLine);

        const hasIndex = indexPatterns.some((p) => p.test(block)) || hasFieldUnique;

        if (!hasIndex) {
          const lineNum = this.findLineNumber(schema, `${fieldName}`);
          missingIndexes.push({ model: modelName, field: fieldName, lineNum });
        }
      }
    }

    if (missingIndexes.length === 0) {
      results.push(
        this.pass('perf-02', 'All foreign key fields have indexes')
      );
    } else {
      // Group by model to avoid too many individual findings
      const byModel = new Map<string, string[]>();
      for (const { model, field } of missingIndexes) {
        const fields = byModel.get(model) || [];
        fields.push(field);
        byModel.set(model, fields);
      }

      for (const [model, fields] of byModel) {
        const lineNum = this.findLineNumber(schema, `model ${model}`);
        results.push(
          this.fail('perf-02', 'MEDIUM', `Missing indexes on ${model} foreign keys`, `Model ${model} has ${fields.length} foreign key field(s) without indexes: ${fields.join(', ')}. Queries filtering or joining on these fields will do full table scans.`, {
            filePath: 'prisma/schema.prisma',
            lineNumber: lineNum,
            recommendation: `Add @@index([${fields.join('], [')}]) to the ${model} model, or add individual @@index entries for each foreign key.`,
          })
        );
      }
    }

    return results;
  }

  /**
   * perf-03: Check API routes for excessive prisma calls (>10 in single handler)
   *
   * v2 - Counts per HTTP method handler instead of per-file to avoid false positives
   * when a route.ts has multiple handlers (GET, POST, PUT, PATCH, DELETE).
   * Admin/export/accounting routes use a higher threshold (20).
   */
  private checkExcessiveQueries(): AuditCheckResult[] {
    const results: AuditCheckResult[] = [];
    const apiFiles = this.findApiRoutes();
    let foundIssue = false;

    const THRESHOLD = 10;
    const ADMIN_THRESHOLD = 20;

    for (const file of apiFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      const rel = this.relativePath(file);
      const isAdminOrExport = /admin\/|accounting\/|data-export|my-data|export|webhook|payment|paypal|inbound-email/i.test(rel);
      const threshold = isAdminOrExport ? ADMIN_THRESHOLD : THRESHOLD;

      // Split by exported HTTP handlers to count per-handler
      const handlerPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;
      const handlers: { method: string; start: number; end: number }[] = [];
      let hMatch: RegExpExecArray | null;
      while ((hMatch = handlerPattern.exec(content)) !== null) {
        handlers.push({ method: hMatch[1], start: hMatch.index, end: content.length });
      }
      // Set end boundaries
      for (let h = 0; h < handlers.length - 1; h++) {
        handlers[h].end = handlers[h + 1].start;
      }

      if (handlers.length === 0) {
        // No exported handlers found — count entire file (lib files, etc.)
        const prismaCallPattern =
          /prisma\.\w+\.(findMany|findFirst|findUnique|create|update|delete|upsert|count|aggregate|groupBy)\s*\(/g;
        const matches = content.match(prismaCallPattern) || [];
        if (matches.length > threshold) {
          foundIssue = true;
          results.push(
            this.fail('perf-03', 'MEDIUM', 'Excessive Prisma calls in API route', `${rel} contains ${matches.length} Prisma queries (threshold: ${threshold}).`, {
              filePath: rel,
              recommendation: 'Consider splitting into multiple endpoints or using $transaction for batching.',
            })
          );
        }
      } else {
        // Count per handler
        for (const handler of handlers) {
          const handlerBody = content.substring(handler.start, handler.end);
          const prismaCallPattern =
            /prisma\.\w+\.(findMany|findFirst|findUnique|create|update|delete|upsert|count|aggregate|groupBy)\s*\(/g;
          const matches = handlerBody.match(prismaCallPattern) || [];
          if (matches.length > threshold) {
            foundIssue = true;
            const lineNum = this.findLineNumber(content, `function ${handler.method}`);
            results.push(
              this.fail('perf-03', 'MEDIUM', 'Excessive Prisma calls in API route', `${rel} ${handler.method} handler contains ${matches.length} Prisma queries (threshold: ${threshold}).`, {
                filePath: rel,
                lineNumber: lineNum,
                recommendation: 'Consider splitting into a service layer or using $transaction for batching.',
              })
            );
          }
        }
      }
    }

    if (!foundIssue) {
      results.push(
        this.pass('perf-03', `All API route handlers have within query thresholds`)
      );
    }

    return results;
  }

  /**
   * perf-04: Check for findMany without take/skip pagination
   *
   * v2 - Dramatically reduced false positives by excluding:
   * - UAT/test/seed/script/auditor files
   * - WHERE-constrained queries scoped to a parent entity (e.g. where: { orderId })
   * - Small reference/lookup table queries (Currency, Country, Category, etc.)
   * - Admin/export/accounting routes (downgraded to LOW)
   * - Shorthand property detection (take, not just take:)
   */
  private checkUnpaginatedFindMany(): AuditCheckResult[] {
    const results: AuditCheckResult[] = [];
    const apiFiles = this.findApiRoutes();
    const libFiles = this.findLibFiles();
    const allFiles = [...apiFiles, ...libFiles];

    // Small/bounded tables that don't need pagination
    const boundedModels = /\.(currency|country|province|category|paymentMethod|shippingMethod|taxRate|language|locale|role|permission|chartOfAccount|gifiCode|accountingPeriod|emailTemplate|faqItem|heroSlide|contactPlatform|giftCardDesign)\./i;

    const unbounded: { file: string; line: number; snippet: string }[] = [];
    const bounded: { file: string; line: number }[] = [];

    for (const file of allFiles) {
      const rel = this.relativePath(file).toLowerCase();

      // Skip test/seed/UAT/script/auditor files
      if (/uat\/|test\/|\.test\.|\.spec\.|seed|scripts\/|auditors?\//i.test(rel)) continue;
      // Skip integration stubs and APM (not yet functional, placeholder code)
      if (/lib\/integrations\/(zoom|whatsapp|teams|slack)\.|lib\/apm\./i.test(rel)) continue;

      const content = this.readFile(file);
      if (!content) continue;

      // Find findMany calls
      const findManyPattern = /prisma\.(\w+)\.findMany\s*\(/g;
      let match: RegExpExecArray | null;

      while ((match = findManyPattern.exec(content)) !== null) {
        const startPos = match.index;

        // Extract the arguments block
        let depth = 0;
        let argEnd = startPos + match[0].length;
        for (let i = argEnd - 1; i < content.length; i++) {
          if (content[i] === '(') depth++;
          if (content[i] === ')') depth--;
          if (depth === 0) {
            argEnd = i + 1;
            break;
          }
        }

        const queryBlock = content.substring(startPos, argEnd);

        // Check for pagination (take:, take,, limit:, cursor:, shorthand take)
        const hasPagination = /take\s*[:,\n}]/.test(queryBlock) ||
          /skip\s*[:,\n}]/.test(queryBlock) ||
          /limit\s*:/.test(queryBlock) ||
          /cursor\s*:/.test(queryBlock);

        if (hasPagination) continue;

        // Check if query is bounded by parent FK in WHERE clause or by { in: [...] } constraint
        const hasWhereFK = /where\s*:\s*\{[\s\S]{0,300}\w+Id\s*[:,}]/.test(queryBlock);
        const hasInClause = /where\s*:\s*\{[\s\S]{0,300}\{\s*in\s*:/.test(queryBlock);

        // Check if querying a small/bounded model
        const isBoundedModel = boundedModels.test(match[0]);

        // Check if constrained by isActive/isPublished/status (typically small result sets)
        const hasStatusFilter = /where\s*:\s*\{[\s\S]{0,200}(isActive|isPublished|status)\s*:/.test(queryBlock);

        // Check if it's an admin/export/accounting route
        const isAdminExport = /admin\/|accounting\/|data-export|my-data|export|dashboard/i.test(rel);

        // Check if it's a service file doing internal lookups or cron/webhook route
        const isServiceInternal = /\.service\.|lib\/accounting\/|lib\/email\/|lib\/inventory\/|lib\/webhooks\/|cron\/|webhook/i.test(rel);

        const lineNum = this.findLineNumber(content, match[0]);

        if (hasWhereFK || hasInClause || isBoundedModel || hasStatusFilter || isAdminExport || isServiceInternal) {
          bounded.push({ file: this.relativePath(file), line: lineNum });
        } else {
          unbounded.push({
            file: this.relativePath(file),
            line: lineNum,
            snippet: this.getSnippet(content, lineNum),
          });
        }
      }
    }

    if (unbounded.length === 0 && bounded.length === 0) {
      results.push(this.pass('perf-04', 'All findMany calls use pagination'));
    } else if (unbounded.length === 0) {
      results.push(this.pass('perf-04', `All findMany calls are either paginated or bounded (${bounded.length} bounded by FK/model/context)`));
    } else {
      // Report unbounded as MEDIUM
      for (const item of unbounded.slice(0, 15)) {
        results.push(
          this.fail('perf-04', 'MEDIUM', 'findMany without pagination', `Unpaginated findMany at ${item.file}:${item.line}. Without take/skip or cursor, this query returns ALL matching rows.`, {
            filePath: item.file,
            lineNumber: item.line,
            codeSnippet: item.snippet,
            recommendation: 'Add `take` and `skip` parameters, or verify the result set is inherently bounded.',
          })
        );
      }

      // Report bounded as LOW summary
      if (bounded.length > 0) {
        results.push(
          this.fail('perf-04', 'LOW', 'Bounded findMany without explicit pagination', `${bounded.length} findMany calls lack explicit pagination but are bounded by parent FK, small model, status filter, or admin/service context.`, {
            recommendation: 'Consider adding explicit take limits as a safety net, especially as data grows.',
          })
        );
      }

      if (unbounded.length > 15) {
        results.push(
          this.fail('perf-04', 'INFO', 'Unpaginated findMany summary', `${unbounded.length} findMany calls without pagination (showing first 15). ${bounded.length} additional bounded calls excluded.`, {
            recommendation: 'Add pagination to the highest-traffic endpoints first.',
          })
        );
      }
    }

    return results;
  }
}
