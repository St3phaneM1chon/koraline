/**
 * CRM MMS SUPPORT
 * Send and receive MMS messages via Telnyx.
 * Lazy-initializes the Telnyx client to avoid build-time crashes.
 */

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TelnyxMessage {
  data: {
    id: string;
    type: string;
    record_type: string;
  };
}

interface TelnyxClient {
  messages: {
    create: (params: {
      from: string;
      to: string;
      text: string;
      media_urls?: string[];
      messaging_profile_id?: string;
    }) => Promise<TelnyxMessage>;
  };
}

interface MmsWebhookResult {
  from: string;
  body: string;
  mediaUrls: string[];
}

// ---------------------------------------------------------------------------
// Lazy Telnyx client
// ---------------------------------------------------------------------------

let telnyxClient: TelnyxClient | null = null;
let telnyxLoadAttempted = false;

function getTelnyxClient(): TelnyxClient | null {
  if (telnyxLoadAttempted) return telnyxClient;
  telnyxLoadAttempted = true;

  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    logger.warn('TELNYX_API_KEY not set. MMS sending will return mock responses.');
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Telnyx = require('telnyx');
    telnyxClient = Telnyx(apiKey) as TelnyxClient;
    logger.info('Telnyx client initialized for MMS');
  } catch {
    logger.warn('telnyx package not available. MMS sending will return mock responses.');
    telnyxClient = null;
  }

  return telnyxClient;
}

// ---------------------------------------------------------------------------
// Supported media types
// ---------------------------------------------------------------------------

const SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
];

/**
 * Get the list of supported MMS media types.
 */
export function getSupportedMediaTypes(): string[] {
  return [...SUPPORTED_MEDIA_TYPES];
}

// ---------------------------------------------------------------------------
// Send MMS
// ---------------------------------------------------------------------------

/**
 * Send an MMS message with a media attachment via Telnyx.
 * If TELNYX_API_KEY is not set, logs a warning and returns a mock response.
 *
 * @param to - Recipient phone number (E.164 format)
 * @param body - Text body of the message
 * @param mediaUrl - URL of the media to attach
 * @returns messageId and status
 */
export async function sendMMS(
  to: string,
  body: string,
  mediaUrl: string
): Promise<{ messageId: string; status: string }> {
  const client = getTelnyxClient();

  if (!client) {
    logger.warn('MMS send skipped (Telnyx not configured)', {
      to: to.slice(0, 4) + '****',
      bodyLength: body.length,
      mediaUrl: mediaUrl.slice(0, 50),
    });
    return {
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'mock_sent',
    };
  }

  const fromNumber = process.env.TELNYX_PHONE_NUMBER || process.env.TELNYX_FROM_NUMBER;
  if (!fromNumber) {
    logger.error('TELNYX_PHONE_NUMBER not configured');
    throw new Error('TELNYX_PHONE_NUMBER not configured');
  }

  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID;

  try {
    const result = await client.messages.create({
      from: fromNumber,
      to,
      text: body,
      media_urls: [mediaUrl],
      ...(messagingProfileId ? { messaging_profile_id: messagingProfileId } : {}),
    });

    const messageId = result.data?.id || `telnyx_${Date.now()}`;

    logger.info('MMS sent successfully', {
      messageId,
      to: to.slice(0, 4) + '****',
      bodyLength: body.length,
      mediaUrl: mediaUrl.slice(0, 50),
    });

    return {
      messageId,
      status: 'sent',
    };
  } catch (error) {
    logger.error('MMS send failed', {
      to: to.slice(0, 4) + '****',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Process MMS Webhook
// ---------------------------------------------------------------------------

/**
 * Parse an incoming MMS webhook payload from Telnyx.
 * Extracts the sender, body text, and any media URLs.
 *
 * Telnyx webhook payload structure:
 * {
 *   data: {
 *     event_type: "message.received",
 *     payload: {
 *       from: { phone_number: "+1..." },
 *       to: [{ phone_number: "+1..." }],
 *       text: "...",
 *       media: [{ url: "...", content_type: "image/jpeg" }]
 *     }
 *   }
 * }
 */
export async function processMmsWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<MmsWebhookResult> {
  const data = payload?.data?.payload || payload?.data || payload;

  // Extract sender
  const from =
    data?.from?.phone_number ||
    data?.from ||
    data?.sender ||
    '';

  // Extract body text
  const body =
    data?.text ||
    data?.body ||
    data?.message ||
    '';

  // Extract media URLs
  const mediaUrls: string[] = [];

  if (Array.isArray(data?.media)) {
    for (const media of data.media) {
      if (media?.url) {
        mediaUrls.push(media.url);
      }
    }
  } else if (Array.isArray(data?.media_urls)) {
    mediaUrls.push(...data.media_urls);
  }

  logger.info('MMS webhook processed', {
    from: from ? from.slice(0, 4) + '****' : 'unknown',
    bodyLength: body.length,
    mediaCount: mediaUrls.length,
  });

  return { from, body, mediaUrls };
}

// ---------------------------------------------------------------------------
// Validate Media URL
// ---------------------------------------------------------------------------

/**
 * Validate that a URL is accessible and points to a supported media type.
 * Performs a HEAD request to check Content-Type without downloading the full file.
 */
export async function validateMediaUrl(url: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url);

    // Only allow http(s) URLs
    if (!parsedUrl.protocol.startsWith('http')) {
      logger.warn('Invalid media URL protocol', { url: url.slice(0, 80) });
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn('Media URL not accessible', {
          url: url.slice(0, 80),
          status: response.status,
        });
        return false;
      }

      const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();

      if (!contentType) {
        logger.warn('Media URL has no Content-Type', { url: url.slice(0, 80) });
        return false;
      }

      const isSupported = SUPPORTED_MEDIA_TYPES.includes(contentType);

      if (!isSupported) {
        logger.warn('Unsupported media type', {
          url: url.slice(0, 80),
          contentType,
          supported: SUPPORTED_MEDIA_TYPES,
        });
      }

      return isSupported;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    logger.warn('Media URL validation failed', {
      url: url.slice(0, 80),
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
