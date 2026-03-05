export const dynamic = 'force-dynamic';

/**
 * VoIP Call Flip API
 * GET  /api/voip/flip — Get available devices for call flip
 * POST /api/voip/flip — Flip an active call to another device
 *
 * Called by useVoip.ts flipCall() to transfer the active call
 * from one device (web softphone) to another (desk phone, mobile).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { flipCall, getUserDevices } from '@/lib/voip/call-flip';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const devices = await getUserDevices(session.user.id);
    return NextResponse.json({ devices });
  } catch {
    return NextResponse.json({ error: 'Failed to get devices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { callControlId, targetDeviceId, targetNumber, targetType } = body as {
      callControlId: string;
      targetDeviceId?: string;
      targetNumber?: string;
      targetType?: string;
    };

    if (!callControlId) {
      return NextResponse.json({ error: 'callControlId required' }, { status: 400 });
    }

    // Build a FlipDevice from the request
    const devices = await getUserDevices(session.user.id);
    const device = targetDeviceId
      ? devices.find(d => d.label === targetDeviceId)
      : devices.find(d => d.type === targetType) || {
          type: 'sip' as const,
          label: 'Ad-hoc device',
          destination: targetNumber || '',
          isActive: true,
        };

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const result = await flipCall(callControlId, device, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Flip failed' }, { status: 422 });
    }

    return NextResponse.json({ flipped: true });
  } catch {
    return NextResponse.json({ error: 'Call flip failed' }, { status: 500 });
  }
}
