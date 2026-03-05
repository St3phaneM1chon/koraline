export const dynamic = 'force-dynamic';

/**
 * Admin VoIP Settings API
 * GET   /api/admin/voip/settings — Get user VoIP preferences
 * PATCH /api/admin/voip/settings — Update user VoIP preferences
 *
 * Called by Softphone.tsx for noise cancellation and virtual background settings.
 * Settings are stored in-memory per user (would persist to DB in production).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

// In-memory store keyed by userId (production would use DB)
const userSettings = new Map<string, Record<string, unknown>>();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = userSettings.get(session.user.id) ?? {
    noiseCancellation: false,
    ringtone: 'default',
    virtualBackground: 'none',
  };

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = userSettings.get(session.user.id) ?? {
      noiseCancellation: false,
      ringtone: 'default',
      virtualBackground: 'none',
    };

    const updated = { ...current, ...body };
    userSettings.set(session.user.id, updated);

    return NextResponse.json({ saved: true, settings: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
