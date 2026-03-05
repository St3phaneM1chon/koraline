export const dynamic = 'force-dynamic';

/**
 * VoIP Call Pickup API
 * GET  /api/admin/voip/pickup — List ringing calls available for pickup
 * POST /api/admin/voip/pickup — Pick up a ringing call
 *
 * Called by Softphone.tsx to show team calls that can be picked up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getVisibleRingingCalls, directedPickup } from '@/lib/voip/call-pickup';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Extension and companyId would come from user's SipExtension in production
    const ringingCalls = getVisibleRingingCalls('*', 'default');

    return NextResponse.json({
      ringingCalls,
      count: ringingCalls.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to list ringing calls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetExtension, callControlId } = body as {
      targetExtension: string;
      callControlId: string;
    };

    if (!targetExtension || !callControlId) {
      return NextResponse.json(
        { error: 'targetExtension and callControlId required' },
        { status: 400 }
      );
    }

    const result = await directedPickup(targetExtension, callControlId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Pickup failed' }, { status: 422 });
    }

    return NextResponse.json({ pickedUp: true });
  } catch {
    return NextResponse.json({ error: 'Pickup operation failed' }, { status: 500 });
  }
}
