/**
 * AUDIT FORGE — Cross-Module Consistency Check (Pass 3)
 * Identifies compound vulnerabilities that span multiple domains.
 *
 * Checks:
 * 1. Interface contract mismatches between API producer/consumer
 * 2. Security posture inconsistencies across modules
 * 3. Cascading vulnerability chains (A+B creates C)
 * 4. Shared state corruption risks
 */

import * as fs from 'fs';
import * as path from 'path';
import { AuditFinding, AuditDimension } from './audit-config';

const RESULTS_DIR = path.resolve('.audit_results/weekly');

export interface CrossModuleFinding {
  id: string;
  type: 'contract_mismatch' | 'posture_inconsistency' | 'cascading_vulnerability' | 'shared_state_risk';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  involvedDomains: string[];
  involvedFiles: string[];
  chainDescription?: string;
}

/**
 * Known cross-module interfaces (bridges) in the Koraline platform.
 * Each bridge defines a producer → consumer relationship.
 */
const KNOWN_BRIDGES = [
  { producer: 'payment', consumer: 'ecommerce', interface: 'Stripe webhook → OrderStatus', risk: 'Payment processed but order not updated' },
  { producer: 'payment', consumer: 'lms', interface: 'Stripe webhook → Enrollment', risk: 'Payment processed but enrollment not created' },
  { producer: 'payment', consumer: 'loyalty', interface: 'Order complete → Points award', risk: 'Double point award on webhook retry' },
  { producer: 'auth', consumer: 'admin', interface: 'Session → AdminGuard', risk: 'Stale session allows access after permission revoked' },
  { producer: 'auth', consumer: 'lms', interface: 'Session → UserGuard', risk: 'Cross-tenant data access via session manipulation' },
  { producer: 'ecommerce', consumer: 'accounting', interface: 'Order → JournalEntry', risk: 'Order refunded but journal not reversed' },
  { producer: 'lms', consumer: 'communications', interface: 'Completion → Email', risk: 'Email sent but completion rolled back' },
  { producer: 'crm', consumer: 'communications', interface: 'Lead → Email Campaign', risk: 'Deleted lead still receives campaigns' },
  { producer: 'voip', consumer: 'crm', interface: 'Call → Contact Activity', risk: 'Call logged to wrong contact' },
  { producer: 'lms', consumer: 'lms', interface: 'Quiz → Certificate → CeCredit', risk: 'Certificate issued without passing quiz' },
];

/**
 * Analyze findings from all domains to detect cross-module issues.
 */
export function analyzeCrossModule(
  domainFindings: Record<string, AuditFinding[]>
): CrossModuleFinding[] {
  const crossFindings: CrossModuleFinding[] = [];

  // Check 1: Security posture inconsistencies
  crossFindings.push(...checkPostureConsistency(domainFindings));

  // Check 2: Cascading vulnerability chains from known bridges
  crossFindings.push(...checkCascadingVulnerabilities(domainFindings));

  // Check 3: Shared state risks (e.g., denormalized counters)
  crossFindings.push(...checkSharedStateRisks(domainFindings));

  return crossFindings;
}

function checkPostureConsistency(
  domainFindings: Record<string, AuditFinding[]>
): CrossModuleFinding[] {
  const results: CrossModuleFinding[] = [];

  // Check if security dimension has findings in some domains but not others
  const domainSecurityScores: Record<string, number> = {};
  for (const [domain, findings] of Object.entries(domainFindings)) {
    const secFindings = findings.filter(f => f.dimension === 'security' && f.criticVerdict !== 'false_positive');
    domainSecurityScores[domain] = secFindings.length;
  }

  // Find domains with disproportionately high security findings
  const avgFindings = Object.values(domainSecurityScores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(domainSecurityScores).length, 1);

  for (const [domain, count] of Object.entries(domainSecurityScores)) {
    if (count > avgFindings * 2 && count > 3) {
      results.push({
        id: `CROSS-POSTURE-${domain}`,
        type: 'posture_inconsistency',
        severity: 'high',
        title: `${domain} has disproportionately high security findings`,
        description: `${domain} has ${count} security findings vs. average ${avgFindings.toFixed(1)}. This suggests the security posture of this module is weaker than others, creating a weak link in the chain.`,
        involvedDomains: [domain],
        involvedFiles: [],
      });
    }
  }

  return results;
}

function checkCascadingVulnerabilities(
  domainFindings: Record<string, AuditFinding[]>
): CrossModuleFinding[] {
  const results: CrossModuleFinding[] = [];

  for (const bridge of KNOWN_BRIDGES) {
    const producerFindings = domainFindings[bridge.producer] ?? [];
    const consumerFindings = domainFindings[bridge.consumer] ?? [];

    // Check if both sides of a bridge have reliability/integrity issues
    const producerReliability = producerFindings.filter(f =>
      f.dimension === 'reliability' && f.criticVerdict !== 'false_positive'
    );
    const consumerReliability = consumerFindings.filter(f =>
      f.dimension === 'reliability' && f.criticVerdict !== 'false_positive'
    );

    if (producerReliability.length > 0 && consumerReliability.length > 0) {
      results.push({
        id: `CROSS-CASCADE-${bridge.producer}-${bridge.consumer}`,
        type: 'cascading_vulnerability',
        severity: 'critical',
        title: `Cascading vulnerability: ${bridge.producer} → ${bridge.consumer}`,
        description: `Both sides of the ${bridge.interface} bridge have reliability issues. ${bridge.risk}. Producer has ${producerReliability.length} findings, consumer has ${consumerReliability.length} findings.`,
        involvedDomains: [bridge.producer, bridge.consumer],
        involvedFiles: [
          ...producerReliability.map(f => f.file),
          ...consumerReliability.map(f => f.file),
        ],
        chainDescription: `${bridge.producer} (${producerReliability.map(f => f.title).join('; ')}) → ${bridge.consumer} (${consumerReliability.map(f => f.title).join('; ')})`,
      });
    }
  }

  return results;
}

function checkSharedStateRisks(
  domainFindings: Record<string, AuditFinding[]>
): CrossModuleFinding[] {
  const results: CrossModuleFinding[] = [];

  // Known shared state: enrollment counters, budget, leaderboard
  const sharedStatePatterns = [
    { pattern: 'enrollmentCount', domains: ['ecommerce', 'lms', 'payment'], risk: 'Counter drift between enrollment create/delete/refund' },
    { pattern: 'budgetUsed', domains: ['lms', 'payment'], risk: 'Corporate budget can be exceeded by concurrent enrollments' },
    { pattern: 'earnedUfc', domains: ['lms'], risk: 'UFC credits denormalized from CeCredit records can drift' },
    { pattern: 'replyCount', domains: ['lms'], risk: 'Discussion reply counter can drift from actual replies' },
  ];

  for (const shared of sharedStatePatterns) {
    const relatedFindings = Object.entries(domainFindings)
      .filter(([domain]) => shared.domains.includes(domain))
      .flatMap(([, findings]) => findings)
      .filter(f => f.title.toLowerCase().includes(shared.pattern.toLowerCase()) || f.description?.toLowerCase().includes(shared.pattern.toLowerCase()));

    if (relatedFindings.length > 0) {
      results.push({
        id: `CROSS-STATE-${shared.pattern}`,
        type: 'shared_state_risk',
        severity: 'medium',
        title: `Shared state risk: ${shared.pattern}`,
        description: `${shared.risk}. ${relatedFindings.length} related findings across ${shared.domains.join(', ')}.`,
        involvedDomains: shared.domains,
        involvedFiles: relatedFindings.map(f => f.file),
      });
    }
  }

  return results;
}

/**
 * Load all domain findings from weekly audit results.
 */
export function loadAllDomainFindings(): Record<string, AuditFinding[]> {
  const result: Record<string, AuditFinding[]> = {};

  if (!fs.existsSync(RESULTS_DIR)) return result;

  for (const file of fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json') && !f.includes('manifest'))) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, file), 'utf-8'));
      const domain = data.domain;
      if (domain && data.findings) {
        result[domain] = data.findings;
      }
    } catch {
      // Skip corrupted files
    }
  }

  return result;
}

/**
 * Generate cross-module report.
 */
export function generateCrossModuleReport(findings: CrossModuleFinding[]): string {
  if (findings.length === 0) {
    return '## Cross-Module Analysis\n\nNo cross-module vulnerabilities detected.\n';
  }

  const lines = [
    '## Cross-Module Analysis',
    '',
    `Total cross-module findings: ${findings.length}`,
    `- Cascading vulnerabilities: ${findings.filter(f => f.type === 'cascading_vulnerability').length}`,
    `- Posture inconsistencies: ${findings.filter(f => f.type === 'posture_inconsistency').length}`,
    `- Shared state risks: ${findings.filter(f => f.type === 'shared_state_risk').length}`,
    '',
  ];

  for (const f of findings.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2 };
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
  })) {
    lines.push(`### [${f.severity.toUpperCase()}] ${f.title}`);
    lines.push(`**Type:** ${f.type} | **Domains:** ${f.involvedDomains.join(', ')}`);
    lines.push(f.description);
    if (f.chainDescription) {
      lines.push(`**Chain:** ${f.chainDescription}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// CLI entry point
if (require.main === module) {
  const domainFindings = loadAllDomainFindings();
  const crossFindings = analyzeCrossModule(domainFindings);
  const report = generateCrossModuleReport(crossFindings);
  console.log(report);
}
