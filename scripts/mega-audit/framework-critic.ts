/**
 * AUDIT FORGE — Framework-Aware Critic
 * Reduces false positives by understanding the project's framework protections.
 *
 * Knows about:
 * - Next.js middleware (src/middleware.ts)
 * - withAdminGuard / withUserGuard (centralized auth + CSRF + rate limiting)
 * - Prisma parameterized queries (prevents SQL injection by default)
 * - React JSX auto-escaping (prevents XSS on text content)
 * - Zod validation schemas (type-safe input validation)
 */

import * as fs from 'fs';
import * as path from 'path';
import { AuditFinding } from './audit-config';

interface FrameworkContext {
  hasMiddleware: boolean;
  middlewareRoutes: string[];
  hasAdminGuard: boolean;
  hasUserGuard: boolean;
  hasCsrfProtection: boolean;
  hasRateLimiting: boolean;
  usesPrisma: boolean;
  usesZod: boolean;
}

/**
 * Analyze the project to understand framework-level protections.
 * This is cached — run once per audit session.
 */
export function analyzeFrameworkContext(projectRoot: string): FrameworkContext {
  const ctx: FrameworkContext = {
    hasMiddleware: false,
    middlewareRoutes: [],
    hasAdminGuard: false,
    hasUserGuard: false,
    hasCsrfProtection: false,
    hasRateLimiting: false,
    usesPrisma: false,
    usesZod: false,
  };

  // Check middleware.ts
  const middlewarePath = path.join(projectRoot, 'src/middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    ctx.hasMiddleware = true;
    const content = fs.readFileSync(middlewarePath, 'utf-8');
    // Extract matcher config
    const matcherMatch = content.match(/matcher\s*:\s*\[([\s\S]*?)\]/);
    if (matcherMatch) {
      ctx.middlewareRoutes = matcherMatch[1].match(/'[^']+'/g)?.map(s => s.replace(/'/g, '')) ?? [];
    }
  }

  // Check admin-api-guard
  const adminGuardPath = path.join(projectRoot, 'src/lib/admin-api-guard.ts');
  if (fs.existsSync(adminGuardPath)) {
    const content = fs.readFileSync(adminGuardPath, 'utf-8');
    ctx.hasAdminGuard = true;
    ctx.hasCsrfProtection = content.includes('csrf') || content.includes('CSRF');
    ctx.hasRateLimiting = content.includes('rateLimit') || content.includes('rate_limit');
  }

  // Check user-api-guard
  const userGuardPath = path.join(projectRoot, 'src/lib/user-api-guard.ts');
  if (fs.existsSync(userGuardPath)) {
    ctx.hasUserGuard = true;
  }

  // Check Prisma
  ctx.usesPrisma = fs.existsSync(path.join(projectRoot, 'prisma/schema'));

  // Check Zod
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    ctx.usesZod = !!(pkg.dependencies?.zod || pkg.devDependencies?.zod);
  } catch {
    ctx.usesZod = false;
  }

  return ctx;
}

/**
 * Apply framework-aware filtering to findings.
 * Returns findings with criticVerdict set.
 */
export function applyFrameworkCritic(
  findings: AuditFinding[],
  ctx: FrameworkContext,
  fileContent?: string
): AuditFinding[] {
  return findings.map(finding => {
    const verdict = evaluateFinding(finding, ctx, fileContent);
    return { ...finding, criticVerdict: verdict };
  });
}

function evaluateFinding(
  finding: AuditFinding,
  ctx: FrameworkContext,
  fileContent?: string
): 'confirmed' | 'downgraded' | 'false_positive' {
  const title = finding.title.toLowerCase();
  const desc = (finding.description || '').toLowerCase();

  // Rule 1: "Missing authentication" on routes that use withAdminGuard/withUserGuard
  if ((title.includes('missing auth') || title.includes('no auth') || desc.includes('unauthenticated')) && fileContent) {
    if (fileContent.includes('withAdminGuard') || fileContent.includes('withUserGuard')) {
      return 'false_positive';
    }
  }

  // Rule 2: "SQL injection" when using Prisma (parameterized by default)
  if ((title.includes('sql injection') || desc.includes('sql injection')) && ctx.usesPrisma) {
    // Only valid if using $queryRawUnsafe or string concatenation
    if (fileContent && !fileContent.includes('$queryRawUnsafe') && !fileContent.includes('$executeRawUnsafe')) {
      return 'false_positive';
    }
  }

  // Rule 3: "Missing CSRF" on GET requests
  if ((title.includes('csrf') || title.includes('cross-site request forgery')) && fileContent) {
    if (fileContent.includes('export const GET') && !fileContent.includes('export const POST') && !fileContent.includes('export const PUT')) {
      return 'false_positive'; // GET-only routes don't need CSRF
    }
    // Also: withAdminGuard/withUserGuard include CSRF by default
    if (fileContent.includes('withAdminGuard') || fileContent.includes('withUserGuard')) {
      if (!fileContent.includes('skipCsrf: true')) {
        return 'false_positive'; // CSRF already enforced by guard
      }
    }
  }

  // Rule 4: "Missing rate limiting" on guarded routes
  if ((title.includes('rate limit') || desc.includes('rate limit')) && fileContent) {
    if ((fileContent.includes('withAdminGuard') || fileContent.includes('withUserGuard')) && ctx.hasRateLimiting) {
      return 'false_positive'; // Rate limiting built into guards
    }
  }

  // Rule 5: "XSS" in React components (JSX auto-escapes)
  if ((title.includes('xss') || title.includes('cross-site scripting')) && fileContent) {
    if (!fileContent.includes('dangerouslySetInnerHTML')) {
      return 'false_positive'; // React escapes by default
    }
  }

  // Rule 6: "Missing input validation" when Zod schema exists
  if ((title.includes('missing validation') || title.includes('no input validation')) && fileContent) {
    if (fileContent.includes('safeParse') || fileContent.includes('z.object')) {
      return 'false_positive'; // Zod validation present
    }
  }

  // Rule 7: "Rate limiting" on cron endpoints (protected by CRON_SECRET)
  if (title.includes('rate limit') && finding.file.includes('/cron/')) {
    return 'false_positive'; // Cron endpoints are internal
  }

  // Rule 8: Downgrade "missing pagination" if take is present
  if (title.includes('pagination') && fileContent) {
    if (fileContent.includes('take:') || fileContent.includes('limit')) {
      return 'downgraded';
    }
  }

  return 'confirmed';
}

/**
 * Generate a critic report showing what was filtered.
 */
export function generateCriticReport(
  original: AuditFinding[],
  filtered: AuditFinding[]
): string {
  const falsePositives = filtered.filter(f => f.criticVerdict === 'false_positive');
  const downgraded = filtered.filter(f => f.criticVerdict === 'downgraded');
  const confirmed = filtered.filter(f => f.criticVerdict === 'confirmed');

  return [
    '## Framework-Aware Critic Report',
    `- Original findings: ${original.length}`,
    `- Confirmed: ${confirmed.length}`,
    `- Downgraded: ${downgraded.length}`,
    `- False positives filtered: ${falsePositives.length}`,
    `- Filter rate: ${original.length > 0 ? Math.round((falsePositives.length / original.length) * 100) : 0}%`,
    '',
    '### Filtered False Positives:',
    ...falsePositives.map(f => `- [${f.severity}] ${f.file}:${f.line} — ${f.title}`),
  ].join('\n');
}
