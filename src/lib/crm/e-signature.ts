/**
 * CRM E-Signature Integration (DocuSign/PandaDoc)
 *
 * - createSignatureRequest: Create DocuSign envelope for quote signing
 * - getSignatureStatus: Check signing status of an envelope
 * - handleSignatureWebhook: Process DocuSign webhook events (completed, declined, voided)
 * - cancelSignatureRequest: Cancel/void a pending envelope
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignatureRequest {
  envelopeId: string;
  signingUrl: string;
  status: string;
}

export interface SignatureStatus {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
  completedAt?: string;
  declinedReason?: string;
}

export interface SignatureWebhookEvent {
  event: string;
  data: {
    envelopeId: string;
    status: string;
    quoteId?: string;
    completedAt?: string;
    declinedReason?: string;
  };
}

// ---------------------------------------------------------------------------
// Lazy DocuSign SDK initialization
// ---------------------------------------------------------------------------

let _docuSignBaseUrl: string | null = null;

function getDocuSignConfig(): { baseUrl: string; accessToken: string; accountId: string } {
  if (!process.env.DOCUSIGN_ACCESS_TOKEN) {
    throw new Error('DOCUSIGN_ACCESS_TOKEN is not configured');
  }
  if (!process.env.DOCUSIGN_ACCOUNT_ID) {
    throw new Error('DOCUSIGN_ACCOUNT_ID is not configured');
  }

  if (!_docuSignBaseUrl) {
    _docuSignBaseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';
  }

  return {
    baseUrl: _docuSignBaseUrl,
    accessToken: process.env.DOCUSIGN_ACCESS_TOKEN,
    accountId: process.env.DOCUSIGN_ACCOUNT_ID,
  };
}

// ---------------------------------------------------------------------------
// Create Signature Request
// ---------------------------------------------------------------------------

/**
 * Creates a DocuSign envelope for a quote and sends it to the signer.
 */
export async function createSignatureRequest(
  quoteId: string,
  signerEmail: string,
  signerName: string
): Promise<SignatureRequest> {
  const config = getDocuSignConfig();

  const quote = await prisma.crmQuote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });

  if (!quote) {
    throw new Error(`Quote ${quoteId} not found`);
  }

  // Build envelope definition
  const envelopeDefinition = {
    emailSubject: `Please sign quote ${quote.number}`,
    recipients: {
      signers: [
        {
          email: signerEmail,
          name: signerName,
          recipientId: '1',
          routingOrder: '1',
        },
      ],
    },
    status: 'sent',
    customFields: {
      textCustomFields: [
        { name: 'quoteId', value: quoteId },
      ],
    },
  };

  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error('[e-signature] Failed to create envelope', { status: response.status, body: text.slice(0, 500) });
    throw new Error(`DocuSign API error: ${response.status}`);
  }

  const data = await response.json();

  // Update quote status
  await prisma.crmQuote.update({
    where: { id: quoteId },
    data: { status: 'SENT', sentAt: new Date() },
  });

  logger.info('[e-signature] Envelope created', {
    event: 'esign_envelope_created',
    quoteId,
    envelopeId: data.envelopeId,
    signerEmail,
  });

  return {
    envelopeId: data.envelopeId,
    signingUrl: data.uri || '',
    status: 'sent',
  };
}

// ---------------------------------------------------------------------------
// Get Signature Status
// ---------------------------------------------------------------------------

/**
 * Check the current status of a DocuSign envelope.
 */
export async function getSignatureStatus(envelopeId: string): Promise<SignatureStatus> {
  const config = getDocuSignConfig();

  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
    {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error('[e-signature] Failed to get envelope status', { envelopeId, status: response.status, body: text.slice(0, 500) });
    throw new Error(`DocuSign API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    envelopeId,
    status: data.status,
    completedAt: data.completedDateTime || undefined,
    declinedReason: data.declinedReason || undefined,
  };
}

// ---------------------------------------------------------------------------
// Handle Signature Webhook
// ---------------------------------------------------------------------------

/**
 * Process DocuSign webhook events: completed, declined, voided.
 */
export async function handleSignatureWebhook(event: SignatureWebhookEvent): Promise<void> {
  const { data } = event;
  const { envelopeId, status, quoteId } = data;

  logger.info('[e-signature] Webhook received', {
    event: event.event,
    envelopeId,
    status,
    quoteId,
  });

  if (!quoteId) {
    logger.warn('[e-signature] No quoteId in webhook data, skipping', { envelopeId });
    return;
  }

  switch (status) {
    case 'completed': {
      await prisma.crmQuote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED', signedAt: new Date() },
      });
      logger.info('[e-signature] Quote signed', { quoteId, envelopeId });
      break;
    }
    case 'declined': {
      await prisma.crmQuote.update({
        where: { id: quoteId },
        data: { status: 'REJECTED' },
      });
      logger.info('[e-signature] Quote declined', { quoteId, envelopeId, reason: data.declinedReason });
      break;
    }
    case 'voided': {
      await prisma.crmQuote.update({
        where: { id: quoteId },
        data: { status: 'DRAFT' },
      });
      logger.info('[e-signature] Envelope voided', { quoteId, envelopeId });
      break;
    }
    default:
      logger.info('[e-signature] Unhandled status', { envelopeId, status });
  }
}

// ---------------------------------------------------------------------------
// Cancel Signature Request
// ---------------------------------------------------------------------------

/**
 * Cancel/void a pending DocuSign envelope.
 */
export async function cancelSignatureRequest(envelopeId: string): Promise<void> {
  const config = getDocuSignConfig();

  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'voided', voidedReason: 'Cancelled by user' }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error('[e-signature] Failed to void envelope', { envelopeId, status: response.status, body: text.slice(0, 500) });
    throw new Error(`DocuSign API error: ${response.status}`);
  }

  logger.info('[e-signature] Envelope voided', { event: 'esign_envelope_voided', envelopeId });
}
