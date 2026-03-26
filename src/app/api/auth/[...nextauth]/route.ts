export const dynamic = 'force-dynamic';

/**
 * ROUTE NEXTAUTH
 * Gestion de l'authentification
 *
 * Railway supports HTTPS natively with correct x-forwarded-proto headers,
 * so no Azure-specific request fixups are needed. Auth.js detects HTTPS
 * and uses __Secure- prefixed cookie names consistently.
 */

import { handlers } from '@/lib/auth-config';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { getClientIpFromRequest } from '@/lib/admin-audit';

export const GET = (req: NextRequest) => {
  try {
    return handlers.GET(req);
  } catch (error) {
    logger.error('Auth GET error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    // SEC-002: Rate limit signin POST requests (credentials login) by IP
    // This complements the per-email brute-force protection in auth-config.ts
    const pathname = req.nextUrl.pathname;
    if (pathname.includes('/callback/credentials') || pathname.includes('/signin')) {
      const ip = getClientIpFromRequest(req);
      const rl = await rateLimitMiddleware(ip, '/api/auth/login');
      if (!rl.success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: rl.headers }
        );
      }
    }
    return handlers.POST(req);
  } catch (error) {
    logger.error('Auth POST error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
