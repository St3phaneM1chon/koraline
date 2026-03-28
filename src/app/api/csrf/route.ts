export const dynamic = 'force-dynamic';

/**
 * CSRF Token API
 * GET - Issue a new CSRF token (set as cookie + return in body)
 *
 * This endpoint MUST always return a valid token — it is critical for all
 * forms and mutations across the application.  When the primary cookie-based
 * flow fails (e.g. cookies() throws in an edge-runtime, or the CSRF secret
 * env var is temporarily missing), we fall back to generating an unsigned
 * random token so that the client can still operate.
 */

import { NextResponse } from 'next/server';
import { setCSRFCookie, generateCSRFToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const token = await setCSRFCookie();
    return NextResponse.json({ token });
  } catch (error) {
    logger.error('CSRF token generation error — falling back to unsigned token', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback: generate a random token so the client is never blocked.
    // The cookie may not be set, but the client will receive a token it can
    // use in the x-csrf-token header.  The middleware will re-issue a proper
    // signed cookie on the next successful request cycle.
    try {
      const fallback = generateCSRFToken();
      return NextResponse.json({ token: fallback.token });
    } catch (fallbackError) {
      // Last resort: pure random hex token (no HMAC, no secret needed)
      const { randomBytes } = await import('crypto');
      const emergencyToken = randomBytes(32).toString('hex');
      logger.error('CSRF emergency fallback used', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
      return NextResponse.json({ token: emergencyToken });
    }
  }
}
