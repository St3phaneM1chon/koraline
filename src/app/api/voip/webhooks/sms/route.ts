export const dynamic = 'force-dynamic';

/**
 * Telnyx SMS/MMS Webhook Handler
 *
 * Receives inbound SMS/MMS events from Telnyx messaging profile.
 * Triggers push notification to staff when a new SMS arrives.
 *
 * Configure in Telnyx Portal > Messaging > Inbound webhook:
 *   https://biocyclepeptides.com/api/voip/webhooks/sms
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { sendPushToStaff } from '@/lib/apns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body?.data;
    const eventType = data?.event_type || body?.event_type;

    // Telnyx sends message events with event_type "message.received"
    if (eventType === 'message.received' || eventType === 'message.sent') {
      const payload = data?.payload || {};
      const from = payload.from?.phone_number || payload.from || 'Inconnu';
      const text = payload.text || '';
      const direction = payload.direction || 'inbound';

      logger.info('[SMS Webhook] Message received', {
        from,
        direction,
        textPreview: text.slice(0, 50),
      });

      // Push notification to staff for inbound SMS
      if (direction === 'inbound') {
        sendPushToStaff({
          title: `SMS de ${from}`,
          body: text.slice(0, 200) || 'Nouveau message',
          category: 'SMS',
          sound: 'SMS.caf',
          data: { from, type: 'sms' },
        }).catch(() => {});
      }
    }

    // Always respond 200 to Telnyx (avoid retries)
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('[SMS Webhook] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ received: true });
  }
}
