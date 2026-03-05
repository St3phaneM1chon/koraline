/**
 * CRM Voicemail Drop - 3F.2
 *
 * Manages pre-recorded voicemail messages for automated drop during calls.
 * Currently stores messages in a JSON config file. Integration with Telnyx
 * or other telephony provider would be added when the VoIP layer is connected.
 */

import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoicemailMessage {
  id: string;
  name: string;
  audioUrl: string;
  duration?: number; // seconds
  createdAt: string;
}

interface VoicemailConfig {
  messages: VoicemailMessage[];
}

// ---------------------------------------------------------------------------
// Config file path (use /tmp for Azure compatibility)
// ---------------------------------------------------------------------------

const CONFIG_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.resolve(process.cwd(), 'data');

const CONFIG_PATH = path.join(CONFIG_DIR, 'voicemail-messages.json');

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function ensureConfigDir(): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  } catch {
    // Directory may already exist or /tmp is always available
  }
}

function readConfig(): VoicemailConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw) as VoicemailConfig;
    }
  } catch (err) {
    logger.warn('Voicemail drop: failed to read config, using defaults', {
      event: 'voicemail_config_read_error',
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Default messages
  return {
    messages: [
      {
        id: 'vm-default-en',
        name: 'Default English',
        audioUrl: '/audio/voicemail/default-en.mp3',
        duration: 30,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'vm-default-fr',
        name: 'Default French',
        audioUrl: '/audio/voicemail/default-fr.mp3',
        duration: 35,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'vm-promo-en',
        name: 'Promotion English',
        audioUrl: '/audio/voicemail/promo-en.mp3',
        duration: 45,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function writeConfig(config: VoicemailConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// listVoicemailMessages
// ---------------------------------------------------------------------------

/**
 * List all available pre-recorded voicemail messages.
 *
 * @returns Array of voicemail messages with id, name, audioUrl, and duration
 */
export async function listVoicemailMessages(): Promise<
  Array<{ id: string; name: string; audioUrl: string; duration?: number }>
> {
  const config = readConfig();
  return config.messages.map((m) => ({
    id: m.id,
    name: m.name,
    audioUrl: m.audioUrl,
    duration: m.duration,
  }));
}

// ---------------------------------------------------------------------------
// dropVoicemail
// ---------------------------------------------------------------------------

/**
 * Drop a pre-recorded voicemail message on an active call.
 *
 * This is a placeholder that logs the action. In production, this would
 * integrate with Telnyx API to transfer the call to the voicemail message:
 *
 * ```
 * POST https://api.telnyx.com/v2/calls/{callId}/actions/playback_start
 * { audio_url: message.audioUrl, overlay: false }
 * ```
 *
 * @param callId - The active call ID (from telephony provider)
 * @param messageId - The voicemail message ID to drop
 */
export async function dropVoicemail(callId: string, messageId: string): Promise<void> {
  const config = readConfig();
  const message = config.messages.find((m) => m.id === messageId);

  if (!message) {
    logger.error('Voicemail drop: message not found', {
      event: 'voicemail_drop_message_not_found',
      callId,
      messageId,
    });
    throw new Error(`Voicemail message not found: ${messageId}`);
  }

  // TODO: Integrate with Telnyx or telephony provider
  // Example Telnyx integration:
  // const telnyx = getTelnyxClient();
  // await telnyx.calls.playbackStart(callId, {
  //   audio_url: message.audioUrl,
  //   overlay: false,
  // });
  // await telnyx.calls.hangup(callId); // Hang up after voicemail

  logger.info('Voicemail drop: message dropped (placeholder)', {
    event: 'voicemail_dropped',
    callId,
    messageId,
    messageName: message.name,
    audioUrl: message.audioUrl,
    duration: message.duration,
  });
}

// ---------------------------------------------------------------------------
// createVoicemailMessage
// ---------------------------------------------------------------------------

/**
 * Create a new pre-recorded voicemail message entry.
 *
 * @param name - Display name for the message
 * @param audioUrl - URL to the audio file (hosted on CDN/blob storage)
 * @returns The created voicemail message with generated ID
 */
export async function createVoicemailMessage(
  name: string,
  audioUrl: string
): Promise<{ id: string; name: string; audioUrl: string }> {
  const config = readConfig();

  const id = `vm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const message: VoicemailMessage = {
    id,
    name,
    audioUrl,
    createdAt: new Date().toISOString(),
  };

  config.messages.push(message);
  writeConfig(config);

  logger.info('Voicemail drop: message created', {
    event: 'voicemail_message_created',
    id,
    name,
    audioUrl,
  });

  return { id, name, audioUrl };
}
