export const dynamic = 'force-dynamic';

/**
 * VoIP Park Retrieve
 * POST /api/voip/park/retrieve — Retrieve a parked call by orbit
 *
 * Called by useVoip.ts retrieveParkedCall().
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { retrieveParkedCall } from '@/lib/voip/call-park';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orbit } = body as { orbit: number };

    if (orbit == null) {
      return NextResponse.json({ error: 'orbit required' }, { status: 400 });
    }

    // Use the session user's call control ID for retrieval
    const result = await retrieveParkedCall(orbit, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Retrieve failed' }, { status: 422 });
    }

    return NextResponse.json({ retrieved: true, callId: result.call?.callControlId });
  } catch {
    return NextResponse.json({ error: 'Retrieve operation failed' }, { status: 500 });
  }
}
