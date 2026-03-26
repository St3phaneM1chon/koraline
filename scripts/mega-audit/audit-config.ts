/**
 * MEGA-AUDIT CONFIGURATION
 * Defines domains, dimensions, severity thresholds, and scoring rules.
 */

// =====================================================
// DIMENSIONS (each audited independently per function)
// =====================================================

export type AuditDimension =
  | 'security'
  | 'performance'
  | 'reliability'
  | 'maintainability'
  | 'compliance';

export const DIMENSIONS: AuditDimension[] = [
  'security',
  'performance',
  'reliability',
  'maintainability',
  'compliance',
];

// =====================================================
// SEVERITY & SCORING
// =====================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1,
  info: 0,
};

/** Legacy: Score thresholds — lower is better (weighted sum of findings) */
export const GRADE_THRESHOLDS: { maxScore: number; grade: Grade }[] = [
  { maxScore: 0, grade: 'A' },
  { maxScore: 3, grade: 'B' },
  { maxScore: 8, grade: 'C' },
  { maxScore: 15, grade: 'D' },
  { maxScore: Infinity, grade: 'F' },
];

export function scoreToGrade(weightedScore: number): Grade {
  for (const t of GRADE_THRESHOLDS) {
    if (weightedScore <= t.maxScore) return t.grade;
  }
  return 'F';
}

// =====================================================
// V5: UNIFIED 0-100 SCORING MODEL
// =====================================================

/** Penalty caps per severity (prevent one domain from going infinitely negative) */
export const SEVERITY_CAPS: Record<Severity, number> = {
  critical: 50,
  high: 30,
  medium: 20,
  low: 10,
  info: 0,
};

/** Domain risk weights (higher = more impactful on global score) */
export const DOMAIN_RISK_WEIGHTS: Record<string, number> = {
  auth: 2.0,
  payment: 2.0,
  accounting: 1.5,
  ecommerce: 1.5,
  crm: 1.2,
  voip: 1.2,
  lms: 1.2,
  loyalty: 1.0,
  communications: 1.0,
  media: 1.0,
  admin: 1.0,
  user: 1.0,
  api_core: 1.0,
  i18n: 1.0,
};

/**
 * Calculate domain score (0-100) from findings.
 * Normalized by sqrt(numFunctions) for fairness across domain sizes.
 */
export function calculateDomainScore(
  findings: AuditFinding[],
  numFunctions: number
): { score: number; grade: Grade } {
  const penalties: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

  for (const f of findings) {
    if (f.criticVerdict === 'false_positive') continue;
    const penalty = SEVERITY_WEIGHTS[f.severity] * (f.confidence ?? 0.7);
    penalties[f.severity] += penalty;
  }

  // Apply caps
  let totalPenalty = 0;
  for (const [sev, val] of Object.entries(penalties)) {
    totalPenalty += Math.min(val, SEVERITY_CAPS[sev as Severity]);
  }

  // Normalize by domain size (sqrt to dampen effect)
  const normalizer = numFunctions > 0 ? Math.sqrt(numFunctions) : 1;
  const normalizedPenalty = totalPenalty / normalizer;

  const score = Math.max(0, Math.round(100 - normalizedPenalty * 10));
  const grade: Grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 50 ? 'D' : 'F';

  return { score, grade };
}

/**
 * Calculate global platform score (weighted average of all domains).
 */
export function calculateGlobalScore(
  domainScores: Record<string, number>
): { score: number; grade: Grade } {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [domain, score] of Object.entries(domainScores)) {
    const weight = DOMAIN_RISK_WEIGHTS[domain] ?? 1.0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const grade: Grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 50 ? 'D' : 'F';

  return { score, grade };
}

// =====================================================
// FEATURE DOMAINS (group functions by business area)
// =====================================================

export interface DomainConfig {
  name: string;
  /** Glob patterns to include */
  include: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Dimensions to emphasize (weight ×2) */
  emphasize?: AuditDimension[];
}

export const DOMAINS: Record<string, DomainConfig> = {
  auth: {
    name: 'Authentication & Authorization',
    include: [
      'src/lib/auth*.ts',
      'src/lib/brute-force*.ts',
      'src/lib/mfa*.ts',
      'src/lib/session-security*.ts',
      'src/lib/security*.ts',
      'src/lib/token-encryption*.ts',
      'src/app/api/auth/**/*.ts',
      'src/app/auth/**/*.tsx',
    ],
    emphasize: ['security', 'compliance'],
  },
  payment: {
    name: 'Payment & Billing',
    include: [
      'src/lib/stripe*.ts',
      'src/lib/payment*.ts',
      'src/lib/invoice*.ts',
      'src/app/api/checkout/**/*.ts',
      'src/app/api/webhooks/stripe/**/*.ts',
      'src/app/api/admin/invoices/**/*.ts',
    ],
    emphasize: ['security', 'reliability'],
  },
  accounting: {
    name: 'Accounting & Journal',
    include: [
      'src/lib/accounting*.ts',
      'src/lib/journal*.ts',
      'src/lib/tax*.ts',
      'src/app/api/admin/accounting/**/*.ts',
      'src/app/api/admin/journal/**/*.ts',
    ],
    emphasize: ['reliability', 'compliance'],
  },
  ecommerce: {
    name: 'E-commerce (Products, Cart, Orders)',
    include: [
      'src/lib/product*.ts',
      'src/lib/cart*.ts',
      'src/lib/order*.ts',
      'src/lib/inventory*.ts',
      'src/app/api/products/**/*.ts',
      'src/app/api/cart/**/*.ts',
      'src/app/api/orders/**/*.ts',
    ],
    emphasize: ['performance', 'reliability'],
  },
  admin: {
    name: 'Admin Dashboard',
    include: [
      'src/app/admin/**/*.tsx',
      'src/app/api/admin/**/*.ts',
    ],
    exclude: [
      'src/app/api/admin/accounting/**/*.ts',
      'src/app/api/admin/journal/**/*.ts',
      'src/app/api/admin/invoices/**/*.ts',
    ],
    emphasize: ['security', 'maintainability'],
  },
  user: {
    name: 'User-facing (Account, Dashboard)',
    include: [
      'src/app/dashboard/**/*.tsx',
      'src/app/(shop)/account/**/*.tsx',
      'src/app/api/user/**/*.ts',
      'src/app/api/account/**/*.ts',
    ],
    emphasize: ['performance', 'reliability'],
  },
  api_core: {
    name: 'Core API Infrastructure',
    include: [
      'src/lib/db*.ts',
      'src/lib/prisma*.ts',
      'src/lib/logger*.ts',
      'src/lib/email*.ts',
      'src/lib/cache*.ts',
      'src/lib/rate-limit*.ts',
      'src/middleware*.ts',
    ],
    emphasize: ['security', 'performance'],
  },
  i18n: {
    name: 'Internationalization',
    include: [
      'src/i18n/**/*.ts',
      'src/i18n/**/*.tsx',
      'src/hooks/useTranslations*.ts',
    ],
    emphasize: ['maintainability'],
  },
  // V5: 6 new domains for complete coverage
  voip: {
    name: 'VoIP & Telephony',
    include: [
      'src/lib/voip/**/*.ts',
      'src/lib/telnyx*.ts',
      'src/lib/crm/voice*.ts',
      'src/app/api/voip/**/*.ts',
      'src/app/api/admin/telephonie/**/*.ts',
    ],
    emphasize: ['security', 'reliability'],
  },
  lms: {
    name: 'LMS (Formation / Aptitudes)',
    include: [
      'src/lib/lms/**/*.ts',
      'src/app/api/lms/**/*.ts',
      'src/app/api/admin/lms/**/*.ts',
      'src/app/api/cron/compliance-reminders/**/*.ts',
    ],
    emphasize: ['compliance', 'reliability'],
  },
  crm: {
    name: 'CRM (Leads, Deals, Pipelines)',
    include: [
      'src/lib/crm/**/*.ts',
      'src/app/api/crm/**/*.ts',
      'src/app/api/admin/crm/**/*.ts',
    ],
    emphasize: ['security', 'reliability'],
  },
  loyalty: {
    name: 'Loyalty & Rewards',
    include: [
      'src/lib/loyalty/**/*.ts',
      'src/app/api/loyalty/**/*.ts',
      'src/app/api/admin/loyalty/**/*.ts',
      'src/app/api/gift-cards/**/*.ts',
    ],
    emphasize: ['reliability', 'compliance'],
  },
  media: {
    name: 'Media & Content Management',
    include: [
      'src/lib/media/**/*.ts',
      'src/app/api/media/**/*.ts',
      'src/app/api/admin/media/**/*.ts',
    ],
    emphasize: ['performance', 'security'],
  },
  communications: {
    name: 'Emails, Chat & Notifications',
    include: [
      'src/lib/email/**/*.ts',
      'src/lib/chat/**/*.ts',
      'src/app/api/email/**/*.ts',
      'src/app/api/emails/**/*.ts',
      'src/app/api/chat/**/*.ts',
      'src/app/api/admin/emails/**/*.ts',
    ],
    emphasize: ['reliability', 'compliance'],
  },
};

// =====================================================
// CONFIDENCE THRESHOLDS (filter noise)
// =====================================================

/** Minimum confidence to report a finding */
export const MIN_CONFIDENCE = 0.6;

/** Minimum confidence for a finding to be auto-fixable */
export const AUTO_FIX_CONFIDENCE = 0.9;

// =====================================================
// OUTPUT CONFIG
// =====================================================

export const OUTPUT_DIR = '.audit_results/mega-audit';
export const REPORT_JSON = 'audit-report.json';
export const REPORT_MD = 'audit-report.md';
export const BASELINE_FILE = 'audit-baseline.json';

// =====================================================
// FINDING STRUCTURE
// =====================================================

export interface AuditFinding {
  id: string;
  dimension: AuditDimension;
  severity: Severity;
  confidence: number;
  title: string;
  description: string;
  file: string;
  line: number;
  endLine?: number;
  codeSnippet?: string;
  suggestedFix?: string;
  cweId?: string;
  owaspCategory?: string;
  references?: string[];
  // V5 additions — Anti-Generalization Evidence Gate
  exploitSteps?: string[];      // Step-by-step exploit instructions (REQUIRED for Critical/High)
  testCase?: string;            // Playwright/Jest pseudo-code to prove the bug
  criticVerdict?: 'confirmed' | 'downgraded' | 'false_positive'; // Pass 2 result
  consensusRuns?: number;       // How many independent runs confirmed (1-3)
  consensusConfidence?: 'high' | 'medium' | 'rejected'; // Based on consensusRuns
  firstSeen?: string;           // ISO date when first detected
  lastSeen?: string;            // ISO date when last confirmed
  status?: 'open' | 'fixed' | 'wontfix' | 'false_positive'; // Lifecycle tracking
  fixedInCommit?: string;       // Git SHA where fix was committed
  regressionCount?: number;     // Times this finding re-appeared after fix
}

export interface FunctionAuditResult {
  function: string;
  file: string;
  line: number;
  endLine: number;
  domain: string;
  dimensions: Record<AuditDimension, {
    score: Grade;
    weightedScore: number;
    findings: AuditFinding[];
    confidence: number;
  }>;
  overallScore: Grade;
  overallWeightedScore: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
}

export interface AuditReport {
  generatedAt: string;
  projectRoot: string;
  gitCommit?: string;
  totalFunctions: number;
  totalFindings: number;
  bySeverity: Record<Severity, number>;
  byDimension: Record<AuditDimension, { grade: Grade; findingsCount: number }>;
  byDomain: Record<string, { grade: Grade; functionsAudited: number; findingsCount: number }>;
  functions: FunctionAuditResult[];
  topCritical: AuditFinding[];
}
