export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { validateCsrf } from '@/lib/csrf-middleware';
import { logger } from '@/lib/logger';
import { getClientIpFromRequest } from '@/lib/admin-audit';

function getIp(request: Request): string { return getClientIpFromRequest(request); }

function logUnsubscribe(subscriberId: string, email: string, ip: string, method: string) {
  logger.info('mailing_list_unsubscribed', {
    subscriberId,
    email: email.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
    ip,
    method,
  });
}

// GET - Show unsubscribe confirmation page (read-only, no state change)
// COMM-F3 FIX: GET no longer performs unsubscribe. It validates the token and
// redirects to a confirmation page. Actual unsubscribe requires POST.
export async function GET(request: Request) {
  try {
    const ipAddr = getIp(request);
    const rl = await rateLimitMiddleware(ipAddr, '/api/mailing-list/unsubscribe');
    if (!rl.success) {
      return NextResponse.redirect(new URL('/?unsubscribe=error', request.url));
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?unsubscribe=error', request.url));
    }

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.redirect(new URL('/?unsubscribe=invalid', request.url));
    }

    const subscriber = await prisma.mailingListSubscriber.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL('/?unsubscribe=invalid', request.url));
    }

    // Redirect to confirmation page with token — user must confirm via POST
    return NextResponse.redirect(
      new URL(`/?unsubscribe=confirm&token=${encodeURIComponent(token)}`, request.url)
    );
  } catch (error) {
    logger.error('Mailing list unsubscribe error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.redirect(new URL('/?unsubscribe=error', request.url));
  }
}

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const unsubscribePostSchema = z.object({
  token: z.string().min(1, 'Token required').max(500),
});

// POST - Unsubscribe via API (from preferences page or one-click confirmation)
// COMM-F3 FIX: All state-changing unsubscribe operations use POST only.
export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const rl = await rateLimitMiddleware(ip, '/api/mailing-list/unsubscribe');
    if (!rl.success) {
      const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      Object.entries(rl.headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Accept token from JSON body or query string (for one-click email links)
    const contentType = request.headers.get('content-type') || '';
    let token: string | null = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // RFC 8058 one-click POST from email clients
      token = request.nextUrl.searchParams.get('token');
    } else {
      // CSRF protection for browser-originated JSON requests
      const csrfValid = await validateCsrf(request);
      if (!csrfValid) {
        // Allow token-from-query for one-click (no CSRF from email clients)
        token = request.nextUrl.searchParams.get('token');
        if (!token) {
          return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
        }
      } else {
        try {
          const body = await request.json();
          const parsed = unsubscribePostSchema.safeParse(body);
          if (parsed.success) {
            token = parsed.data.token;
          }
        } catch {
          // fallback to query string
        }
        if (!token) {
          token = request.nextUrl.searchParams.get('token');
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const subscriber = await prisma.mailingListSubscriber.findFirst({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json({ success: true });
    }

    await prisma.mailingListSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
        unsubscribeToken: null,
      },
    });

    await prisma.consentRecord.updateMany({
      where: {
        email: subscriber.email.toLowerCase(),
        type: { in: ['marketing', 'newsletter'] },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    }).catch((err) => logger.error('Unsubscribe cross-sync failed', { error: err instanceof Error ? err.message : String(err) }));

    await prisma.newsletterSubscriber.updateMany({
      where: { email: subscriber.email.toLowerCase() },
      data: { unsubscribedAt: new Date() },
    }).catch((err) => logger.error('Unsubscribe cross-sync failed', { error: err instanceof Error ? err.message : String(err) }));

    logUnsubscribe(subscriber.id, subscriber.email, ip, 'api-post');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Mailing list unsubscribe error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
