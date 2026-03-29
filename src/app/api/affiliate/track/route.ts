export const dynamic = 'force-dynamic';

/**
 * Affiliate Link Tracking API
 * GET /api/affiliate/track?code=ABC123&url=/products/xyz
 * - Increments click count on the affiliate link
 * - Sets a referral cookie (30 days)
 * - Redirects to the destination URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const redirectUrl = searchParams.get('url') || '/';

    if (!code) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Look up the affiliate link
    const link = await prisma.affiliateLink.findFirst({
      where: { code, isActive: true },
    });

    if (!link) {
      // Invalid code — redirect without tracking
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Increment click count (fire and forget for speed)
    prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }).catch((err) => {
      logger.error('Failed to increment affiliate click', { code, error: err });
    });

    // Build redirect response with referral cookie
    const destination = link.url || redirectUrl;
    const response = NextResponse.redirect(new URL(destination, request.url));

    // Set referral cookie — 30 days
    response.cookies.set('ref', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('Affiliate track error', { error });
    const fallback = new URL('/', request.url);
    return NextResponse.redirect(fallback);
  }
}
