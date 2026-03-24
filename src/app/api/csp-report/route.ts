export const dynamic = 'force-dynamic';

/**
 * CSP Violation Report Endpoint
 * POST /api/csp-report
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * Reports are logged server-side for security monitoring.
 *
 * This endpoint is public (browsers send CSP reports automatically)
 * but rate-limited to prevent abuse.
 *
 * SEC-HARDENING: Enterprise-grade CSP violation monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security';
import { logger } from '@/lib/logger';

/** Maximum report body size: 10KB (CSP reports are small JSON payloads) */
const MAX_REPORT_SIZE = 10_240;

export async function POST(request: NextRequest) {
  // Rate limit: 50 reports per IP per minute to prevent flooding
  const ip =
    request.headers.get('x-azure-clientip') ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    '127.0.0.1';

  const rateResult = checkRateLimit(`csp-report:${ip}`, 50, 60_000);
  if (!rateResult.allowed) {
    return new NextResponse(null, { status: 429 });
  }

  try {
    // Validate content length before reading body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_REPORT_SIZE) {
      return new NextResponse(null, { status: 413 });
    }

    const text = await request.text();
    if (text.length > MAX_REPORT_SIZE) {
      return new NextResponse(null, { status: 413 });
    }

    // Parse the CSP report (browsers send as application/csp-report or application/json)
    let report: Record<string, unknown>;
    try {
      const parsed = JSON.parse(text);
      // CSP Level 2 wraps report in "csp-report" key; Level 3 uses flat object
      report = parsed['csp-report'] || parsed;
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    // Log the violation for monitoring/alerting
    logger.warn('CSP violation report', {
      event: 'csp_violation',
      documentUri: String(report['document-uri'] || report.documentURL || '').substring(0, 500),
      violatedDirective: String(report['violated-directive'] || report.violatedDirective || '').substring(0, 200),
      blockedUri: String(report['blocked-uri'] || report.blockedURL || '').substring(0, 500),
      effectiveDirective: String(report['effective-directive'] || report.effectiveDirective || '').substring(0, 200),
      originalPolicy: String(report['original-policy'] || '').substring(0, 500),
      sourceFile: String(report['source-file'] || report.sourceFile || '').substring(0, 300),
      lineNumber: report['line-number'] || report.lineNumber,
      columnNumber: report['column-number'] || report.columnNumber,
      statusCode: report['status-code'] || report.statusCode,
      ip,
    });

    // Return 204 No Content (standard for report endpoints)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('Failed to process CSP report', {
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse(null, { status: 500 });
  }
}
