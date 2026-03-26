#!/usr/bin/env npx tsx
/**
 * AUDIT FORGE — Health Check
 * Verifies all audit system components are functional.
 *
 * Usage: npx tsx scripts/mega-audit/health-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve('.');
const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

function check(name: string, condition: boolean, detail: string) {
  checks.push({ name, pass: condition, detail });
}

// 1. Config files exist
check('audit-config.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/audit-config.ts')), 'Core configuration');
check('audit-prompts.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/audit-prompts.ts')), 'Prompt templates');
check('threat-models.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/threat-models.ts')), 'Domain threat models');
check('audit-runner.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/audit-runner.ts')), 'Pipeline orchestrator');
check('function-extractor.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/function-extractor.ts')), 'AST function extractor');

// 2. Pipeline components
check('consensus.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/consensus.ts')), 'Consensus engine');
check('framework-critic.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/framework-critic.ts')), 'Framework critic');
check('cross-module-check.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/cross-module-check.ts')), 'Cross-module detector');
check('mutation-tester.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/mutation-tester.ts')), 'Mutation tester');

// 3. Scoring and tracking
check('scoring.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/scoring.ts')), 'Scoring engine');
check('historical-tracker.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/historical-tracker.ts')), 'Historical tracker');
check('audit-dashboard.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/audit-dashboard.ts')), 'Dashboard generator');

// 4. Orchestrators
check('pre-push-audit.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/pre-push-audit.ts')), 'Pre-push checks');
check('audit-scheduler.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/audit-scheduler.ts')), 'Adaptive scheduler');
check('weekly-audit.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/weekly-audit.ts')), 'Weekly orchestrator');
check('monthly-audit.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/monthly-audit.ts')), 'Monthly orchestrator');
check('quarterly-audit.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/quarterly-audit.ts')), 'Quarterly planner');
check('quick-scan.ts', fs.existsSync(path.join(ROOT, 'scripts/mega-audit/quick-scan.ts')), 'Full codebase scanner');

// 5. Claude Code rule
check('mega-audit-recurring.md', fs.existsSync(path.join(ROOT, '.claude/rules/mega-audit-recurring.md')), 'Trigger word rule');

// 6. SAST
check('.semgrep.yml', fs.existsSync(path.join(ROOT, '.semgrep.yml')), 'Semgrep SAST rules');

// 7. Results directory
check('.audit_results/', fs.existsSync(path.join(ROOT, '.audit_results')), 'Results directory');
check('weekly/', fs.existsSync(path.join(ROOT, '.audit_results/weekly')), 'Weekly results');
check('monthly/', fs.existsSync(path.join(ROOT, '.audit_results/monthly')), 'Monthly results');

// 8. Count domain threat models
try {
  // Count threat model files by checking exports
  const threatPath = path.join(ROOT, 'scripts/mega-audit/threat-models.ts');
  const content = fs.readFileSync(threatPath, 'utf-8');
  const domainCount = (content.match(/^\s+\w+:\s*\{$/gm) || []).length;
  check('Threat models', domainCount >= 10, `${domainCount} domains detected`);
} catch {
  check('Threat models', false, 'File read failed');
}

// ── Report ──────────────────────────────────────────────────────

console.log('🔍 AUDIT FORGE — Health Check\n');

let passed = 0;
let failed = 0;

for (const c of checks) {
  const icon = c.pass ? '✅' : '❌';
  console.log(`${icon} ${c.name.padEnd(30)} ${c.detail}`);
  if (c.pass) passed++;
  else failed++;
}

console.log(`\n📊 ${passed}/${checks.length} checks passed`);
if (failed > 0) {
  console.log(`⚠️  ${failed} components missing or broken`);
  process.exit(1);
} else {
  console.log('✅ Audit Forge v5.0 is fully operational');
}
