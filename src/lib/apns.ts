/**
 * Apple Push Notification Service (APNs) — HTTP/2 sender
 *
 * Uses APNs JWT-based authentication (p8 key file).
 * Supports standard push and VoIP push.
 *
 * Required env vars:
 *   APNS_KEY_ID       — Key ID from Apple Developer Portal
 *   APNS_TEAM_ID      — Team ID (S3CT2R76W5)
 *   APNS_KEY_PATH     — Path to .p8 file (or APNS_KEY_CONTENT for inline)
 *   APNS_BUNDLE_ID    — App bundle ID (vip.attitudes.hub)
 *   APNS_ENVIRONMENT  — "production" or "development"
 */

import { SignJWT, importPKCS8 } from 'jose';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { readFileSync } from 'fs';

// ---------------------------------------------------------------------------
// Configuration (lazy-loaded)
// ---------------------------------------------------------------------------

let _apnsToken: string | null = null;
let _tokenIssuedAt = 0;
const TOKEN_TTL = 50 * 60 * 1000; // Refresh every 50 minutes (Apple allows 60)

function getApnsConfig() {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID || 'S3CT2R76W5';
  const bundleId = process.env.APNS_BUNDLE_ID || 'vip.attitudes.hub';
  const environment = process.env.APNS_ENVIRONMENT || 'development';

  if (!keyId) {
    return null;
  }

  return { keyId, teamId, bundleId, environment };
}

function getApnsKey(): string | null {
  // Inline key content takes priority
  if (process.env.APNS_KEY_CONTENT) {
    return process.env.APNS_KEY_CONTENT;
  }

  const keyPath = process.env.APNS_KEY_PATH;
  if (!keyPath) return null;

  try {
    return readFileSync(keyPath, 'utf-8');
  } catch {
    logger.error('[APNs] Failed to read key file', { keyPath });
    return null;
  }
}

async function getApnsJwt(): Promise<string | null> {
  const config = getApnsConfig();
  if (!config) return null;

  const now = Date.now();
  if (_apnsToken && now - _tokenIssuedAt < TOKEN_TTL) {
    return _apnsToken;
  }

  const keyContent = getApnsKey();
  if (!keyContent) {
    logger.warn('[APNs] No key configured — push notifications disabled');
    return null;
  }

  try {
    const privateKey = await importPKCS8(keyContent, 'ES256');
    _apnsToken = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
      .setIssuer(config.teamId)
      .setIssuedAt()
      .sign(privateKey);
    _tokenIssuedAt = now;
    return _apnsToken;
  } catch (error) {
    logger.error('[APNs] JWT generation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function getApnsHost(): string {
  const env = process.env.APNS_ENVIRONMENT || 'development';
  return env === 'production'
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com';
}

// ---------------------------------------------------------------------------
// Send Push Notification
// ---------------------------------------------------------------------------

export interface PushPayload {
  title: string;
  body: string;
  category?: string;  // EMAIL, SMS, CHAT, SALE, CALL, AURELIA
  sound?: string;     // e.g., "Courriel.caf"
  badge?: number;
  data?: Record<string, string>;
}

/**
 * Send a push notification to a specific device token.
 */
async function sendToToken(
  token: string,
  payload: PushPayload,
  options?: { isVoIP?: boolean }
): Promise<boolean> {
  const config = getApnsConfig();
  if (!config) return false;

  const jwt = await getApnsJwt();
  if (!jwt) return false;

  const host = getApnsHost();
  const topic = options?.isVoIP
    ? `${config.bundleId}.voip`
    : config.bundleId;

  const apnsPayload = options?.isVoIP
    ? {
        // VoIP push — minimal payload, CallKit handles UI
        aps: {},
        ...payload.data,
      }
    : {
        aps: {
          alert: { title: payload.title, body: payload.body },
          sound: payload.sound || 'default',
          badge: payload.badge,
          category: payload.category,
          'mutable-content': 1,
          'content-available': 1,
        },
        type: payload.category?.toLowerCase(),
        ...payload.data,
      };

  try {
    const response = await fetch(`${host}/3/device/${token}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': topic,
        'apns-push-type': options?.isVoIP ? 'voip' : 'alert',
        'apns-priority': options?.isVoIP ? '10' : '10',
        'apns-expiration': '0',
        'content-type': 'application/json',
      },
      body: JSON.stringify(apnsPayload),
    });

    if (response.status === 200) {
      return true;
    }

    const errorBody = await response.text();
    logger.warn('[APNs] Push failed', {
      status: response.status,
      token: token.slice(0, 8) + '...',
      body: errorBody.slice(0, 200),
    });

    // Token is invalid — mark device as inactive
    if (response.status === 410 || response.status === 400) {
      await prisma.userDevice.updateMany({
        where: { token },
        data: { isActive: false },
      });
    }

    return false;
  } catch (error) {
    logger.error('[APNs] Request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API — Send to user (all their devices)
// ---------------------------------------------------------------------------

/**
 * Send a push notification to ALL active devices of a user.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const devices = await prisma.userDevice.findMany({
    where: { userId, isActive: true, platform: { in: ['ios', 'android'] } },
  });

  if (devices.length === 0) return 0;

  let sent = 0;
  for (const device of devices) {
    const ok = await sendToToken(device.token, payload);
    if (ok) sent++;
  }

  logger.info('[APNs] Push sent to user', {
    userId,
    category: payload.category,
    devicesTotal: devices.length,
    devicesSent: sent,
  });

  return sent;
}

/**
 * Send a VoIP push for incoming call (wakes app via PushKit + CallKit).
 */
export async function sendVoIPPush(userId: string, callerNumber: string, callerName?: string): Promise<boolean> {
  const devices = await prisma.userDevice.findMany({
    where: { userId, isActive: true, platform: 'ios-voip' },
  });

  if (devices.length === 0) return false;

  for (const device of devices) {
    await sendToToken(
      device.token,
      {
        title: 'Appel entrant',
        body: callerName || callerNumber,
        category: 'CALL',
        data: { callerNumber, callerName: callerName || '' },
      },
      { isVoIP: true }
    );
  }

  return true;
}

/**
 * Send a push to ALL employees/owners (for new chat, new sale, etc.)
 */
export async function sendPushToStaff(payload: PushPayload): Promise<number> {
  const staffDevices = await prisma.userDevice.findMany({
    where: {
      isActive: true,
      user: { role: { in: ['EMPLOYEE', 'OWNER'] } },
    },
    include: { user: { select: { id: true } } },
  });

  if (staffDevices.length === 0) return 0;

  let sent = 0;
  const seen = new Set<string>();
  for (const device of staffDevices) {
    // Avoid duplicate pushes to same user across devices
    const key = `${device.userId}:${device.token}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ok = await sendToToken(device.token, payload);
    if (ok) sent++;
  }

  return sent;
}
