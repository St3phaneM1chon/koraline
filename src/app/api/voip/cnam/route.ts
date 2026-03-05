export const dynamic = 'force-dynamic';

/**
 * CNAM Caller ID Lookup API
 * GET /api/voip/cnam?number=+15145551234 — Lookup caller name
 *
 * Called by useVoip.ts enrichCnam() on incoming calls to display
 * the caller's name and spam score.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { lookupCnam } from '@/lib/voip/cnam-lookup';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');

  if (!number) {
    return NextResponse.json({ error: 'number parameter required' }, { status: 400 });
  }

  try {
    // First check local contacts/customers database
    const contact = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: number },
          { phone: number.replace(/^\+1/, '') },
        ],
      },
      select: { name: true, email: true, phone: true },
    });

    if (contact?.name) {
      return NextResponse.json({
        phoneNumber: number,
        callerName: contact.name,
        source: 'local',
        spamScore: 0,
      });
    }

    // Fall back to external CNAM lookup (Telnyx API)
    const result = await lookupCnam(number);

    return NextResponse.json({
      ...result,
      source: result.callerName ? 'cnam' : 'unknown',
    });
  } catch {
    // Return empty result on error — don't block the call
    return NextResponse.json({
      phoneNumber: number,
      callerName: null,
      source: 'error',
      spamScore: 0,
    });
  }
}
