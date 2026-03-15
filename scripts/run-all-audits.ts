/**
 * Run all 40 audits directly (bypasses API auth)
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/run-all-audits.ts
 *        npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/run-all-audits.ts --critical-only
 *        npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/run-all-audits.ts AUTH-SESSION
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

const AUDITORS_DIR = path.join(__dirname, '..', 'src', 'lib', 'auditors');

interface AuditCheckResult {
  checkId: string;
  passed: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  recommendation?: string;
  functionId?: string;
}

const ALL_CODES = [
  // CRITICAL (1-10)
  'AUTH-SESSION', 'AUTHZ-RBAC', 'INPUT-INJECTION', 'CSRF-RATELIMIT', 'SECRETS-ENV',
  'PAYMENT-PCI', 'ACCOUNTING-INTEGRITY', 'TAX-ACCURACY', 'PRIVACY-COMPLIANCE', 'DB-INTEGRITY',
  // HIGH (11-19)
  'RACE-CONDITIONS', 'API-LEAKAGE', 'DB-PERFORMANCE', 'WEBHOOK-IDEMPOTENCY', 'CRON-RELIABILITY',
  'EMAIL-CASL', 'I18N-COMPLETENESS', 'WEBAUTHN-MFA', 'SECURITY-HEADERS',
  'AZURE-LOCAL-SYNC', 'ADMIN-BACKEND-MEGA',
  // MEDIUM (20-26)
  'TYPESCRIPT-QUALITY', 'FRONTEND-PERFORMANCE', 'ERROR-OBSERVABILITY', 'ARCHITECTURE-QUALITY', 'ACCESSIBILITY-WCAG',
  'API-CONTRACTS',
  // SECTION (27-39)
  'SECTION-DASHBOARD', 'SECTION-COMMERCE', 'SECTION-CATALOG', 'SECTION-MARKETING',
  'SECTION-COMMUNITY', 'SECTION-LOYALTY', 'SECTION-MEDIA', 'SECTION-EMAILS',
  'SECTION-TELEPHONY', 'SECTION-CRM', 'SECTION-ACCOUNTING', 'SECTION-SYSTEM',
  'SECTION-PURCHASE-WORKFLOW',
];

const CODE_TO_FILE: Record<string, string> = {
  'AUTH-SESSION': 'auth-session',
  'AUTHZ-RBAC': 'authz-rbac',
  'INPUT-INJECTION': 'input-injection',
  'CSRF-RATELIMIT': 'csrf-ratelimit',
  'SECRETS-ENV': 'secrets-env',
  'PAYMENT-PCI': 'payment-pci',
  'ACCOUNTING-INTEGRITY': 'accounting-integrity',
  'TAX-ACCURACY': 'tax-accuracy',
  'PRIVACY-COMPLIANCE': 'privacy-compliance',
  'DB-INTEGRITY': 'db-integrity',
  'RACE-CONDITIONS': 'race-conditions',
  'API-LEAKAGE': 'api-leakage',
  'DB-PERFORMANCE': 'db-performance',
  'WEBHOOK-IDEMPOTENCY': 'webhook-idempotency',
  'CRON-RELIABILITY': 'cron-reliability',
  'EMAIL-CASL': 'email-casl',
  'I18N-COMPLETENESS': 'i18n-completeness',
  'WEBAUTHN-MFA': 'webauthn-mfa',
  'SECURITY-HEADERS': 'security-headers',
  'TYPESCRIPT-QUALITY': 'typescript-quality',
  'FRONTEND-PERFORMANCE': 'frontend-performance',
  'ERROR-OBSERVABILITY': 'error-observability',
  'ARCHITECTURE-QUALITY': 'architecture-quality',
  'ACCESSIBILITY-WCAG': 'accessibility-wcag',
  'API-CONTRACTS': 'api-contracts',
  'AZURE-LOCAL-SYNC': 'azure-local-sync',
  'ADMIN-BACKEND-MEGA': 'admin-backend-mega',
  // Section auditors
  'SECTION-DASHBOARD': 'section/section-dashboard',
  'SECTION-COMMERCE': 'section/section-commerce',
  'SECTION-CATALOG': 'section/section-catalog',
  'SECTION-MARKETING': 'section/section-marketing',
  'SECTION-COMMUNITY': 'section/section-community',
  'SECTION-LOYALTY': 'section/section-loyalty',
  'SECTION-MEDIA': 'section/section-media',
  'SECTION-EMAILS': 'section/section-emails',
  'SECTION-TELEPHONY': 'section/section-telephony',
  'SECTION-CRM': 'section/section-crm',
  'SECTION-ACCOUNTING': 'section/section-accounting',
  'SECTION-SYSTEM': 'section/section-system',
  'SECTION-PURCHASE-WORKFLOW': 'section/section-purchase-workflow',
};

async function runSingleAudit(code: string): Promise<{
  code: string;
  findings: number;
  passed: number;
  failed: number;
  duration: number;
  results: AuditCheckResult[];
}> {
  const fileName = CODE_TO_FILE[code];
  if (!fileName) throw new Error(`Unknown audit code: ${code}`);

  const filePath = path.join(AUDITORS_DIR, `${fileName}.ts`);
  if (!fs.existsSync(filePath)) {
    const jsPath = path.join(AUDITORS_DIR, `${fileName}.js`);
    if (!fs.existsSync(jsPath)) throw new Error(`Auditor file not found: ${filePath}`);
  }

  const startTime = Date.now();

  const mod = require(filePath);
  const AuditorClass = mod.default || mod;
  const auditor = new AuditorClass();
  const results: AuditCheckResult[] = await auditor.run();

  const duration = Date.now() - startTime;
  const findings = results.filter(r => !r.passed);
  const passed = results.filter(r => r.passed);

  // Save to database
  const auditType = await prisma.auditType.findUnique({ where: { code } });
  if (auditType) {
    const run = await prisma.auditRun.create({
      data: {
        auditTypeId: auditType.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        totalChecks: results.length,
        passedChecks: passed.length,
        failedChecks: findings.length,
        findingsCount: findings.length,
        durationMs: duration,
        runBy: 'mega-audit-phase12',
        summary: JSON.stringify({
          totalResults: results.length,
          passed: passed.length,
          failed: findings.length,
          bySeverity: {
            CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
            HIGH: findings.filter(f => f.severity === 'HIGH').length,
            MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
            LOW: findings.filter(f => f.severity === 'LOW').length,
            INFO: findings.filter(f => f.severity === 'INFO').length,
          },
        }),
      },
    });

    // Save findings in batches
    for (const finding of findings) {
      await prisma.auditFinding.create({
        data: {
          auditRunId: run.id,
          checkId: finding.checkId,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          filePath: finding.filePath,
          lineNumber: finding.lineNumber,
          codeSnippet: finding.codeSnippet?.substring(0, 2000),
          recommendation: finding.recommendation,
        },
      });
    }
  }

  return { code, findings: findings.length, passed: passed.length, failed: findings.length, duration, results };
}

async function main() {
  const args = process.argv.slice(2);
  const criticalOnly = args.includes('--critical-only');
  const sectionOnly = args.includes('--section-only');
  const singleCode = args.find(a => !a.startsWith('--'))?.toUpperCase();

  let codes = ALL_CODES;
  if (singleCode) {
    codes = [singleCode];
  } else if (criticalOnly) {
    codes = ALL_CODES.slice(0, 10);
  } else if (sectionOnly) {
    codes = ALL_CODES.filter(c => c.startsWith('SECTION-'));
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  BIOCYCLE PEPTIDES — MEGA AUDIT PHASE 12`);
  console.log(`  Running ${codes.length} audit(s)...`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(70)}\n`);

  const allResults: Array<{ code: string; findings: number; passed: number; failed: number; duration: number; results?: AuditCheckResult[] }> = [];
  let totalFindings = 0;
  let totalPassed = 0;

  for (const code of codes) {
    process.stdout.write(`▶ ${code.padEnd(32)} `);
    try {
      const result = await runSingleAudit(code);
      totalFindings += result.findings;
      totalPassed += result.passed;
      allResults.push(result);

      const status = result.findings === 0 ? '✅ PASS' : `⚠️  ${result.findings} findings`;
      console.log(`${status.padEnd(20)} (${result.passed} passed, ${result.duration}ms)`);

      // Show critical/high findings inline
      if (result.findings > 0) {
        const criticalFindings = result.results.filter(r => !r.passed && (r.severity === 'CRITICAL' || r.severity === 'HIGH'));
        for (const f of criticalFindings.slice(0, 5)) {
          console.log(`   └─ [${f.severity}] ${f.title}${f.filePath ? ` → ${f.filePath}` : ''}`);
        }
        if (criticalFindings.length > 5) {
          console.log(`   └─ ... and ${criticalFindings.length - 5} more CRITICAL/HIGH`);
        }
      }
    } catch (err) {
      console.log(`❌ ERROR: ${err instanceof Error ? err.message : err}`);
      allResults.push({ code, findings: -1, passed: 0, failed: -1, duration: 0 });
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  MEGA AUDIT SUMMARY — Phase 12`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`  Audits run:       ${allResults.length}`);
  console.log(`  Total checks:     ${totalPassed + totalFindings}`);
  console.log(`  Passed:           ${totalPassed}`);
  console.log(`  Findings:         ${totalFindings}`);
  console.log(`  Errors:           ${allResults.filter(r => r.findings === -1).length}`);
  console.log(`  Finished:         ${new Date().toISOString()}`);
  console.log(`${'─'.repeat(70)}`);

  // Top findings by severity
  const allFindings: AuditCheckResult[] = [];
  for (const r of allResults) {
    if (r.results) {
      allFindings.push(...r.results.filter(f => !f.passed));
    }
  }

  const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = allFindings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = allFindings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = allFindings.filter(f => f.severity === 'LOW').length;

  console.log(`  By severity:  CRITICAL=${criticalCount}  HIGH=${highCount}  MEDIUM=${mediumCount}  LOW=${lowCount}`);
  console.log(`${'═'.repeat(70)}\n`);

  // Clean audits
  const clean = allResults.filter(r => r.findings === 0);
  if (clean.length > 0) {
    console.log(`✅ CLEAN (${clean.length}):`);
    clean.forEach(r => console.log(`   ${r.code}`));
  }

  // Audits with findings
  const withFindings = allResults.filter(r => r.findings > 0);
  if (withFindings.length > 0) {
    console.log(`\n⚠️  WITH FINDINGS (${withFindings.length}):`);
    withFindings
      .sort((a, b) => b.findings - a.findings)
      .forEach(r => console.log(`   ${r.code}: ${r.findings} findings (${r.passed} passed)`));
  }

  // Errors
  const withErrors = allResults.filter(r => r.findings === -1);
  if (withErrors.length > 0) {
    console.log(`\n❌ ERRORS (${withErrors.length}):`);
    withErrors.forEach(r => console.log(`   ${r.code}`));
  }

  console.log('');
}

main()
  .catch(e => { console.error('\nFatal error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
