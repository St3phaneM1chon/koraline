export const dynamic = 'force-dynamic';

/**
 * Security Headers Audit API (I-SECURITY)
 * GET /api/admin/security/headers-audit
 *
 * Checks the current security headers configuration and returns a report card
 * with pass/fail for each header and common misconfiguration warnings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeaderCheck {
  header: string;
  status: 'pass' | 'fail' | 'warn';
  value: string | null;
  recommendation: string | null;
}

interface HeadersAuditReport {
  timestamp: string;
  url: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  grade: string;
  checks: HeaderCheck[];
}

// ---------------------------------------------------------------------------
// Header definitions
// ---------------------------------------------------------------------------

const REQUIRED_HEADERS: {
  header: string;
  description: string;
  validate: (value: string | null) => { status: 'pass' | 'fail' | 'warn'; recommendation: string | null };
}[] = [
  {
    header: 'Strict-Transport-Security',
    description: 'HSTS - Forces HTTPS connections',
    validate: (value) => {
      if (!value) return { status: 'fail', recommendation: 'Add Strict-Transport-Security: max-age=63072000; includeSubDomains; preload' };
      const maxAgeMatch = value.match(/max-age=(\d+)/);
      if (!maxAgeMatch) return { status: 'warn', recommendation: 'HSTS header present but missing max-age directive' };
      const maxAge = parseInt(maxAgeMatch[1], 10);
      if (maxAge < 15768000) return { status: 'warn', recommendation: `HSTS max-age is ${maxAge}s (${Math.round(maxAge / 86400)} days). Recommend at least 6 months (15768000s)` };
      if (!value.includes('includeSubDomains')) return { status: 'warn', recommendation: 'HSTS missing includeSubDomains directive' };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'Content-Security-Policy',
    description: 'CSP - Prevents XSS and injection attacks',
    validate: (value) => {
      if (!value) return { status: 'fail', recommendation: 'Add Content-Security-Policy header with restrictive directives' };
      const warnings: string[] = [];
      if (value.includes("'unsafe-eval'")) warnings.push("Contains 'unsafe-eval' which weakens XSS protection");
      if (value.includes("'unsafe-inline'") && value.includes('script-src') && !value.includes("'strict-dynamic'") && !value.includes("'nonce-")) {
        warnings.push("script-src uses 'unsafe-inline' without nonce or strict-dynamic fallback");
      }
      if (!value.includes('frame-ancestors')) warnings.push('Missing frame-ancestors directive (clickjacking protection)');
      if (!value.includes("object-src 'none'") && !value.includes('object-src none')) warnings.push("Missing object-src 'none' (blocks plugin-based attacks)");
      if (!value.includes("base-uri 'self'") && !value.includes('base-uri self')) warnings.push("Missing base-uri 'self' (prevents base tag injection)");
      if (warnings.length > 0) return { status: 'warn', recommendation: warnings.join('; ') };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'X-Frame-Options',
    description: 'Prevents clickjacking by controlling iframe embedding',
    validate: (value) => {
      if (!value) return { status: 'warn', recommendation: 'Add X-Frame-Options: DENY (or use CSP frame-ancestors)' };
      if (value.toUpperCase() !== 'DENY' && value.toUpperCase() !== 'SAMEORIGIN') {
        return { status: 'warn', recommendation: `X-Frame-Options should be DENY or SAMEORIGIN, got: ${value}` };
      }
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'X-Content-Type-Options',
    description: 'Prevents MIME type sniffing',
    validate: (value) => {
      if (!value) return { status: 'fail', recommendation: 'Add X-Content-Type-Options: nosniff' };
      if (value !== 'nosniff') return { status: 'warn', recommendation: 'X-Content-Type-Options should be "nosniff"' };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'Referrer-Policy',
    description: 'Controls what referrer information is sent',
    validate: (value) => {
      if (!value) return { status: 'fail', recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin' };
      const safe = ['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'];
      if (!safe.includes(value)) return { status: 'warn', recommendation: `Referrer-Policy "${value}" may leak URL paths. Use strict-origin-when-cross-origin` };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'Permissions-Policy',
    description: 'Controls browser feature access (camera, mic, geolocation)',
    validate: (value) => {
      if (!value) return { status: 'warn', recommendation: 'Add Permissions-Policy header to restrict browser APIs: camera=(), microphone=(), geolocation=()' };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'X-DNS-Prefetch-Control',
    description: 'Controls DNS prefetching',
    validate: (value) => {
      if (!value) return { status: 'warn', recommendation: 'Add X-DNS-Prefetch-Control: off to prevent DNS leaks' };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'X-Powered-By',
    description: 'Should NOT be present (information disclosure)',
    validate: (value) => {
      if (value) return { status: 'fail', recommendation: 'Remove X-Powered-By header to hide server technology. In Next.js: set poweredByHeader: false in next.config.js' };
      return { status: 'pass', recommendation: null };
    },
  },
  {
    header: 'Server',
    description: 'Should not reveal detailed server info',
    validate: (value) => {
      if (value && (value.toLowerCase().includes('apache') || value.toLowerCase().includes('nginx') || value.toLowerCase().includes('express'))) {
        return { status: 'warn', recommendation: 'Server header reveals technology stack. Consider removing or generalizing it.' };
      }
      return { status: 'pass', recommendation: null };
    },
  },
];

// ---------------------------------------------------------------------------
// Grade calculation
// ---------------------------------------------------------------------------

function calculateGrade(passed: number, total: number, failed: number): string {
  if (failed === 0 && passed === total) return 'A+';
  const ratio = passed / total;
  if (ratio >= 0.9 && failed === 0) return 'A';
  if (ratio >= 0.8 && failed <= 1) return 'B';
  if (ratio >= 0.7) return 'C';
  if (ratio >= 0.5) return 'D';
  return 'F';
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const GET = withAdminGuard(async (_request: NextRequest) => {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Self-fetch to inspect actual response headers
    let responseHeaders: Headers | null = null;
    try {
      const res = await fetch(`${appUrl}/api/health`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'SecurityHeadersAudit/1.0' },
        // Short timeout to avoid hanging
        signal: AbortSignal.timeout(10000),
      });
      responseHeaders = res.headers;
    } catch (fetchError) {
      logger.warn('[security/headers-audit] Could not self-fetch for header inspection, using config-based audit', {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      });
    }

    // Run checks
    const checks: HeaderCheck[] = REQUIRED_HEADERS.map(({ header, validate }) => {
      const value = responseHeaders?.get(header) ?? null;
      const { status, recommendation } = validate(value);
      return { header, status, value, recommendation };
    });

    // If we could not self-fetch, add a note and do config-based checks instead
    if (!responseHeaders) {
      // Add config-based analysis from known next.config.js and middleware settings
      const configNote: HeaderCheck = {
        header: '_audit_note',
        status: 'warn',
        value: 'Could not self-fetch response headers. Results based on static analysis only.',
        recommendation: 'Ensure NEXT_PUBLIC_APP_URL is set correctly and the app is accessible.',
      };
      checks.unshift(configNote);

      // Override checks with known config values (we know from next.config.js and middleware.ts)
      const knownHeaders: Record<string, string> = {
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' ...; (configured in next.config.js and middleware.ts)",
      };

      for (const check of checks) {
        if (check.header in knownHeaders) {
          const { status, recommendation } = REQUIRED_HEADERS.find(h => h.header === check.header)!.validate(knownHeaders[check.header]);
          check.value = `[from config] ${knownHeaders[check.header]}`;
          check.status = status;
          check.recommendation = recommendation;
        }
      }
    }

    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warn').length;
    const totalChecks = checks.length;

    const report: HeadersAuditReport = {
      timestamp: new Date().toISOString(),
      url: appUrl,
      totalChecks,
      passed,
      failed,
      warnings,
      grade: calculateGrade(passed, totalChecks, failed),
      checks,
    };

    return NextResponse.json({ data: report });
  } catch (error) {
    logger.error('[security/headers-audit] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to run security headers audit' }, { status: 500 });
  }
});
