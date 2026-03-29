/**
 * G27 — Zapier/Make Webhook Dispatcher
 *
 * Dispatches events to all matching IntegrationWebhook endpoints.
 * Features:
 *   - HMAC-SHA256 payload signing
 *   - Exponential backoff retry (3 attempts)
 *   - Delivery logging (success/failure)
 *   - Automatic deactivation after 10 consecutive failures
 */

import { createHmac } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s (exponential)
const MAX_CONSECUTIVE_FAILURES = 10;
const REQUEST_TIMEOUT_MS = 15_000; // 15 seconds

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookEventPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface DispatchResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Available event types
// ---------------------------------------------------------------------------

export const INTEGRATION_EVENT_TYPES = [
  'order.created',
  'order.updated',
  'customer.created',
  'product.created',
  'product.updated',
  'form.submitted',
  'booking.created',
  'membership.created',
] as const;

export type IntegrationEventType = (typeof INTEGRATION_EVENT_TYPES)[number];

// ---------------------------------------------------------------------------
// HMAC Signature
// ---------------------------------------------------------------------------

/**
 * Sign a payload string with HMAC-SHA256.
 * Returns hex-encoded signature.
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Dispatch helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a single webhook with retry and exponential backoff.
 */
async function sendWebhook(
  url: string,
  body: string,
  secret: string | null,
): Promise<{ statusCode: number; responseText: string; durationMs: number; attempt: number }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Koraline-Webhooks/1.0',
    };

    if (secret) {
      headers['X-Webhook-Signature'] = `sha256=${signPayload(body, secret)}`;
    }

    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const durationMs = Date.now() - start;
      const responseText = await res.text().catch(() => '');

      if (res.ok) {
        return { statusCode: res.status, responseText, durationMs, attempt };
      }

      // 4xx = client error, no point retrying
      if (res.status >= 400 && res.status < 500) {
        return { statusCode: res.status, responseText, durationMs, attempt };
      }

      // 5xx = server error, retry
      lastError = new Error(`HTTP ${res.status}: ${responseText.slice(0, 200)}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch an event to all matching IntegrationWebhook endpoints for a tenant.
 *
 * @param tenantId - Tenant ID
 * @param eventName - One of INTEGRATION_EVENT_TYPES
 * @param data - The event payload data
 * @returns Array of dispatch results
 */
export async function dispatchEvent(
  tenantId: string,
  eventName: string,
  data: Record<string, unknown>,
): Promise<DispatchResult[]> {
  // Find all active webhooks for this tenant that subscribe to this event
  const webhooks = await prisma.integrationWebhook.findMany({
    where: {
      tenantId,
      isActive: true,
    },
  });

  // Filter webhooks by event subscription
  const matching = webhooks.filter((wh) => {
    const events = (wh.events as string[]) || [];
    return events.includes(eventName) || events.includes('*');
  });

  if (matching.length === 0) {
    return [];
  }

  const payload: WebhookEventPayload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  const results: DispatchResult[] = [];

  for (const wh of matching) {
    const start = Date.now();
    let result: DispatchResult;

    try {
      const res = await sendWebhook(wh.url, body, wh.secret);

      const success = res.statusCode >= 200 && res.statusCode < 300;
      result = {
        webhookId: wh.id,
        success,
        statusCode: res.statusCode,
        attempts: res.attempt,
        durationMs: res.durationMs,
        error: success ? undefined : `HTTP ${res.statusCode}`,
      };

      // Log the delivery
      await prisma.integrationWebhookLog.create({
        data: {
          webhookId: wh.id,
          event: eventName,
          payload: JSON.parse(JSON.stringify(payload)),
          statusCode: res.statusCode,
          response: res.responseText.slice(0, 2000),
          duration: res.durationMs,
          success,
          attempt: res.attempt,
          error: success ? null : `HTTP ${res.statusCode}`,
        },
      });

      // Update webhook state
      if (success) {
        await prisma.integrationWebhook.update({
          where: { id: wh.id },
          data: {
            lastTriggered: new Date(),
            failCount: 0,
          },
        });
      } else {
        const newFailCount = wh.failCount + 1;
        await prisma.integrationWebhook.update({
          where: { id: wh.id },
          data: {
            lastTriggered: new Date(),
            failCount: newFailCount,
            isActive: newFailCount >= MAX_CONSECUTIVE_FAILURES ? false : undefined,
          },
        });

        if (newFailCount >= MAX_CONSECUTIVE_FAILURES) {
          logger.warn(`[WebhookDispatcher] Webhook ${wh.id} deactivated after ${MAX_CONSECUTIVE_FAILURES} failures`, {
            webhookId: wh.id,
            url: wh.url,
            tenantId,
          });
        }
      }
    } catch (err) {
      const durationMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);

      result = {
        webhookId: wh.id,
        success: false,
        attempts: MAX_RETRIES,
        durationMs,
        error: errorMsg,
      };

      // Log failure
      await prisma.integrationWebhookLog.create({
        data: {
          webhookId: wh.id,
          event: eventName,
          payload: JSON.parse(JSON.stringify(payload)),
          statusCode: null,
          response: null,
          duration: durationMs,
          success: false,
          attempt: MAX_RETRIES,
          error: errorMsg.slice(0, 2000),
        },
      }).catch((logErr) => {
        logger.error('[WebhookDispatcher] Failed to log delivery', { error: logErr });
      });

      // Update fail count
      const newFailCount = wh.failCount + 1;
      await prisma.integrationWebhook.update({
        where: { id: wh.id },
        data: {
          failCount: newFailCount,
          isActive: newFailCount >= MAX_CONSECUTIVE_FAILURES ? false : undefined,
        },
      }).catch((updateErr) => {
        logger.error('[WebhookDispatcher] Failed to update webhook', { error: updateErr });
      });

      logger.error('[WebhookDispatcher] Failed to deliver webhook', {
        webhookId: wh.id,
        event: eventName,
        error: errorMsg,
      });
    }

    results.push(result);
  }

  logger.info(`[WebhookDispatcher] Dispatched "${eventName}" to ${matching.length} webhooks`, {
    tenantId,
    event: eventName,
    total: matching.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });

  return results;
}

/**
 * Send a test ping to a webhook endpoint to verify connectivity.
 */
export async function testWebhook(webhookId: string): Promise<DispatchResult> {
  const webhook = await prisma.integrationWebhook.findUnique({ where: { id: webhookId } });
  if (!webhook) {
    return { webhookId, success: false, attempts: 0, durationMs: 0, error: 'Webhook not found' };
  }

  const payload: WebhookEventPayload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: { message: 'Test ping from Koraline', webhookId: webhook.id },
  };
  const body = JSON.stringify(payload);

  try {
    const res = await sendWebhook(webhook.url, body, webhook.secret);
    const success = res.statusCode >= 200 && res.statusCode < 300;

    // Log test delivery
    await prisma.integrationWebhookLog.create({
      data: {
        webhookId: webhook.id,
        event: 'webhook.test',
        payload: JSON.parse(JSON.stringify(payload)),
        statusCode: res.statusCode,
        response: res.responseText.slice(0, 2000),
        duration: res.durationMs,
        success,
        attempt: res.attempt,
        error: success ? null : `HTTP ${res.statusCode}`,
      },
    });

    return {
      webhookId,
      success,
      statusCode: res.statusCode,
      attempts: res.attempt,
      durationMs: res.durationMs,
      error: success ? undefined : `HTTP ${res.statusCode}`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      webhookId,
      success: false,
      attempts: MAX_RETRIES,
      durationMs: 0,
      error: errorMsg,
    };
  }
}
