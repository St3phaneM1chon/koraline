/**
 * Call Control Business Logic — Central Event Router
 *
 * Processes Telnyx webhook events and dispatches to specialized engines:
 * - IVR Engine: menu routing, DTMF handling, time-based routing
 * - Queue Engine: agent ring strategies, hold music, overflow
 * - Voicemail Engine: recording, transcription, notifications
 * - Transfer Engine: blind/attended transfer, conference
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import * as telnyx from '@/lib/telnyx';
import { sendPushToStaff } from '@/lib/apns';
import { resolveIvrMenu, playIvrMenu, handleIvrInput, handleIvrTimeout } from './ivr-engine';
import { routeToQueue, removeFromQueue } from './queue-engine';
import { handleVoicemailSaved, isVoicemailActive, cleanupVoicemail, startVoicemail } from './voicemail-engine';
import { cleanupTransferState } from './transfer-engine';
import { VoipStateMap } from './voip-state';

// Event payload shape from webhook handler
export interface CallEventPayload {
  callControlId: string;
  callLegId?: string;
  callSessionId?: string;
  connectionId?: string;
  from?: string;
  to?: string;
  direction?: 'inbound' | 'outbound';
  state?: string;
  clientState?: Record<string, unknown>;
  hangupCause?: string;
  hangupSource?: string;
  digit?: string;
  digits?: string;
  recordingUrls?: { mp3?: string; wav?: string };
  amdResult?: string;
  transcriptionData?: { text: string; confidence: number; is_final: boolean };
}

// Active call state cache — Redis-backed with in-memory fallback
export const activeCallStates = new VoipStateMap<{
  callLogId?: string;
  ivrMenuId?: string;
  ivrAttempts?: number;
  campaignId?: string;
  listEntryId?: string;
  queueId?: string;
  isVoicemail?: boolean;
  callerNumber?: string;
  callerName?: string;
  language?: string; // Detected language (from dialed number or caller preference)
  dialedNumber?: string; // The number that was called (for multi-DID routing)
}>('voip:call:');

/**
 * Main event router — dispatches Telnyx events to handlers.
 */
export async function handleCallEvent(eventType: string, payload: CallEventPayload) {
  switch (eventType) {
    case 'call.initiated':
      return handleCallInitiated(payload);

    case 'call.answered':
      return handleCallAnswered(payload);

    case 'call.hangup':
      return handleCallHangup(payload);

    case 'call.dtmf.received':
      return handleDtmfReceived(payload);

    case 'call.gather.ended':
      return handleGatherEnded(payload);

    case 'call.recording.saved':
      return handleRecordingSaved(payload);

    case 'call.machine.detection.ended':
      return handleAmdResult(payload);

    case 'streaming.started':
    case 'call.transcription':
      return handleTranscription(payload);

    case 'call.bridged':
      logger.info('[CallControl] Call bridged', { callControlId: payload.callControlId });
      break;

    case 'call.speak.ended':
      // TTS playback completed - no action needed
      break;

    case 'conference.participant.joined':
    case 'conference.participant.left':
      logger.info('[CallControl] Conference event', { eventType, callControlId: payload.callControlId });
      break;

    default:
      logger.debug('[CallControl] Unhandled event type', { eventType });
  }
}

// ── Event Handlers ─────────────────────────

async function handleCallInitiated(payload: CallEventPayload) {
  const { callControlId, from, to, direction, connectionId } = payload;

  // Look up the phone number to get language and forwarding config
  const phoneNumber = to ? await prisma.phoneNumber.findUnique({
    where: { number: to },
  }) : null;

  // Create call log entry with phone number linkage
  const callLog = await prisma.callLog.create({
    data: {
      pbxUuid: callControlId,
      callerNumber: from || 'unknown',
      calledNumber: to || 'unknown',
      direction: direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
      startedAt: new Date(),
      status: 'RINGING',
      ...(phoneNumber ? { phoneNumberId: phoneNumber.id } : {}),
      ...(connectionId ? {
        connection: {
          connect: { provider: 'telnyx' },
        },
      } : {}),
    },
  });

  // Cache the call state for later events
  activeCallStates.set(callControlId, {
    callLogId: callLog.id,
    callerNumber: from,
    callerName: undefined,
    dialedNumber: to,
    language: phoneNumber?.language || 'fr-CA',
    ...(payload.clientState as Record<string, string> || {}),
  });

  logger.info('[CallControl] Call initiated', {
    callLogId: callLog.id,
    direction,
    from,
    to,
    language: phoneNumber?.language,
    region: phoneNumber?.region,
  });

  // For inbound calls: check forwarding first, then answer
  if (direction === 'inbound') {
    // Handle forwarding (alias numbers like Gatineau → Montreal)
    if (phoneNumber?.forwardTo) {
      logger.info('[CallControl] Forwarding call', {
        from: to,
        forwardTo: phoneNumber.forwardTo,
      });
      await telnyx.transferCall(callControlId, phoneNumber.forwardTo, {
        from: from,
      });
      return;
    }

    await telnyx.answerCall(callControlId);

    // Send push notification to staff for incoming call
    sendPushToStaff({
      title: 'Appel entrant',
      body: `${from || 'Inconnu'} → ${phoneNumber?.displayName || to}`,
      category: 'CALL',
      sound: 'Appel.caf',
      data: {
        type: 'incoming_call',
        callerNumber: from || '',
        dialedNumber: to || '',
      },
    }).catch(() => { /* non-blocking */ });
  }
}

async function handleCallAnswered(payload: CallEventPayload) {
  const { callControlId } = payload;
  const state = activeCallStates.get(callControlId);

  if (state?.callLogId) {
    await prisma.callLog.update({
      where: { id: state.callLogId },
      data: {
        status: 'IN_PROGRESS',
        answeredAt: new Date(),
      },
    });
  }

  // For inbound calls: route through IVR/Queue/Direct
  if (payload.direction === 'inbound') {
    await routeInboundCall(callControlId, payload);
  }

  // For outbound dialer calls: start AMD detection
  if (state?.campaignId) {
    await telnyx.enableAmd(callControlId);
  }

  // Start recording (consent announced in IVR greeting)
  if (!state?.isVoicemail) {
    await telnyx.startRecording(callControlId, {
      channels: 'dual',
      format: 'wav',
    });
  }
}

async function handleCallHangup(payload: CallEventPayload) {
  const { callControlId, hangupCause } = payload;
  const state = activeCallStates.get(callControlId);

  if (state?.callLogId) {
    const callLog = await prisma.callLog.findUnique({
      where: { id: state.callLogId },
    });

    const endedAt = new Date();
    const duration = callLog?.startedAt
      ? Math.round((endedAt.getTime() - callLog.startedAt.getTime()) / 1000)
      : undefined;
    const billableSec = callLog?.answeredAt
      ? Math.round((endedAt.getTime() - callLog.answeredAt.getTime()) / 1000)
      : 0;

    await prisma.callLog.update({
      where: { id: state.callLogId },
      data: {
        status: callLog?.answeredAt ? 'COMPLETED' : 'MISSED',
        endedAt,
        duration,
        billableSec,
        hangupCause,
      },
    });
  }

  // Cleanup all engine states
  removeFromQueue(callControlId);
  cleanupVoicemail(callControlId);
  cleanupTransferState(callControlId);
  activeCallStates.delete(callControlId);
}

async function handleDtmfReceived(payload: CallEventPayload) {
  logger.debug('[CallControl] DTMF received', { digit: payload.digit });
}

async function handleGatherEnded(payload: CallEventPayload) {
  const { callControlId, digits } = payload;
  const state = activeCallStates.get(callControlId);

  if (!state?.ivrMenuId) return;

  // Load the menu for timeout handling
  const menu = await prisma.ivrMenu.findFirst({
    where: { id: state.ivrMenuId, isActive: true },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!digits || digits === '') {
    // Timeout — delegate to IVR engine
    const attempts = (state.ivrAttempts || 0) + 1;
    activeCallStates.set(callControlId, { ...state, ivrAttempts: attempts });

    if (menu) {
      await handleIvrTimeout(callControlId, menu, attempts);
    } else {
      const lang = state.language || 'fr-CA';
      const msg = lang.startsWith('fr')
        ? "Nous n'avons pas reçu votre choix. Transfert vers un agent."
        : "We did not receive your selection. Transferring to an agent.";
      await telnyx.speakText(callControlId, msg, { language: lang });
    }
    return;
  }

  logger.info('[CallControl] IVR input received', { digits, callControlId });

  // Delegate to IVR engine
  const handled = await handleIvrInput(callControlId, state.ivrMenuId, digits);

  if (!handled) {
    // Invalid input
    const attempts = (state.ivrAttempts || 0) + 1;
    activeCallStates.set(callControlId, { ...state, ivrAttempts: attempts });

    const lang = state.language || menu?.language || 'fr-CA';
    const isFr = lang.startsWith('fr');

    if (attempts >= (menu?.maxRetries || 3)) {
      // Max retries — route to operator or voicemail
      if (menu?.timeoutAction === 'voicemail' && menu.timeoutTarget) {
        await startVoicemail(callControlId, menu.timeoutTarget, {
          from: state.callerNumber,
          language: lang,
        });
      } else {
        await telnyx.speakText(callControlId,
          isFr ? "Transfert vers un agent. Veuillez patienter." : "Transferring to an agent. Please hold.",
          { language: lang });
      }
    } else {
      await telnyx.speakText(callControlId,
        isFr ? "Choix invalide. Veuillez réessayer." : "Invalid selection. Please try again.",
        { language: lang });
      // Replay the menu
      if (menu) {
        await playIvrMenu(callControlId, menu);
      }
    }
  }
}

async function handleRecordingSaved(payload: CallEventPayload) {
  const { callControlId, recordingUrls } = payload;
  const state = activeCallStates.get(callControlId);

  if (!recordingUrls) return;

  // Check if this is a voicemail recording
  if (isVoicemailActive(callControlId)) {
    await handleVoicemailSaved(callControlId, recordingUrls);
    return;
  }

  // Regular call recording
  if (state?.callLogId) {
    await prisma.callRecording.create({
      data: {
        callLogId: state.callLogId,
        blobUrl: recordingUrls.wav || recordingUrls.mp3,
        format: recordingUrls.wav ? 'wav' : 'mp3',
        isUploaded: true,
        consentObtained: true,
        consentMethod: 'ivr_prompt',
      },
    });

    logger.info('[CallControl] Recording saved', {
      callLogId: state.callLogId,
      url: recordingUrls.wav || recordingUrls.mp3,
    });
  }
}

async function handleAmdResult(payload: CallEventPayload) {
  const { callControlId, amdResult } = payload;
  const state = activeCallStates.get(callControlId);

  logger.info('[CallControl] AMD result', { result: amdResult, callControlId });

  if (amdResult === 'machine' && state?.campaignId) {
    // Answering machine detected — hang up for campaigns
    await telnyx.hangupCall(callControlId);

    if (state.callLogId) {
      await prisma.callLog.update({
        where: { id: state.callLogId },
        data: {
          status: 'COMPLETED',
          disposition: 'voicemail_detected',
          tags: ['amd_machine'],
        },
      });
    }
  }
}

async function handleTranscription(payload: CallEventPayload) {
  const { callControlId, transcriptionData } = payload;
  const state = activeCallStates.get(callControlId);

  if (transcriptionData?.is_final && state?.callLogId) {
    const existing = await prisma.callTranscription.findUnique({
      where: { callLogId: state.callLogId },
    });

    if (existing) {
      await prisma.callTranscription.update({
        where: { id: existing.id },
        data: {
          fullText: existing.fullText + ' ' + transcriptionData.text,
        },
      });
    } else {
      await prisma.callTranscription.create({
        data: {
          callLogId: state.callLogId,
          fullText: transcriptionData.text,
          engine: 'telnyx',
          confidence: transcriptionData.confidence,
          language: 'fr',
        },
      });
    }
  }
}

// ── Inbound Routing ─────────────────────────

/**
 * Route an inbound call based on the dialed number's configuration.
 * Priority: IVR → Queue → Extension → Default simultaneous ring
 *
 * Enhanced features:
 * - Multi-language support (greetings in the number's language)
 * - Forwarding already handled in handleCallInitiated
 * - Simultaneous ring to all staff as fallback
 * - Voicemail fallback after ring timeout
 */
async function routeInboundCall(callControlId: string, payload: CallEventPayload) {
  const { to } = payload;
  const state = activeCallStates.get(callControlId);
  const language = state?.language || 'fr-CA';
  const isFrench = language.startsWith('fr');

  const phoneNumber = to ? await prisma.phoneNumber.findUnique({
    where: { number: to },
  }) : null;

  if (!phoneNumber) {
    // Unknown number — play bilingual greeting and route to general queue
    await telnyx.speakText(callControlId,
      "Merci d'avoir appelé Attitudes VIP. Thank you for calling Attitudes VIP. " +
      "Veuillez patienter. Please hold.",
      { language: 'fr-CA' });
    await routeToQueue(callControlId, 'general-queue');
    return;
  }

  // Route 1: IVR Menu (primary routing method)
  if (phoneNumber.routeToIvr) {
    const menu = await resolveIvrMenu(phoneNumber);
    if (menu) {
      activeCallStates.set(callControlId, {
        ...state,
        ivrMenuId: menu.id,
        ivrAttempts: 0,
        language: menu.language || language,
      });
      await playIvrMenu(callControlId, menu);
      return;
    }
  }

  // Route 2: Queue
  if (phoneNumber.routeToQueue) {
    const consentMsg = isFrench
      ? "Cet appel peut être enregistré à des fins de qualité. Veuillez patienter."
      : "This call may be recorded for quality purposes. Please hold.";
    await telnyx.speakText(callControlId, consentMsg, { language });
    await routeToQueue(callControlId, phoneNumber.routeToQueue);
    return;
  }

  // Route 3: Direct Extension
  if (phoneNumber.routeToExt) {
    const ext = await prisma.sipExtension.findUnique({
      where: { extension: phoneNumber.routeToExt },
    });
    if (ext) {
      const transferMsg = isFrench
        ? "Cet appel peut être enregistré à des fins de qualité. Transfert en cours."
        : "This call may be recorded for quality purposes. Transferring now.";
      await telnyx.speakText(callControlId, transferMsg, { language });
      await telnyx.transferCall(callControlId, `sip:${ext.sipUsername}@sip.telnyx.com`);
      return;
    }
  }

  // Default: Route to general queue (ring all agents simultaneously)
  const defaultMsg = isFrench
    ? "Cet appel peut être enregistré à des fins de qualité. Veuillez patienter pendant que nous vous mettons en communication."
    : "This call may be recorded for quality purposes. Please hold while we connect you.";
  await telnyx.speakText(callControlId, defaultMsg, { language });
  await routeToQueue(callControlId, 'general-queue');
}

// ── Outbound Dialer ─────────────────────────

/**
 * Initiate an outbound call for a dialer campaign.
 */
export async function dialCampaignCall(options: {
  campaignId: string;
  listEntryId: string;
  phoneNumber: string;
  callerIdNumber: string;
  connectionId: string;
  webhookUrl: string;
}) {
  const clientState = JSON.stringify({
    campaignId: options.campaignId,
    listEntryId: options.listEntryId,
  });

  const result = await telnyx.dialCall({
    to: options.phoneNumber,
    from: options.callerIdNumber,
    connectionId: options.connectionId,
    webhookUrl: options.webhookUrl,
    clientState,
    timeout: 30,
  });

  await prisma.dialerListEntry.update({
    where: { id: options.listEntryId },
    data: {
      isCalled: true,
      callAttempts: { increment: 1 },
      lastCalledAt: new Date(),
    },
  });

  await prisma.dialerCampaign.update({
    where: { id: options.campaignId },
    data: {
      totalCalled: { increment: 1 },
    },
  });

  return result;
}
