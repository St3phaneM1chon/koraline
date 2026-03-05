/**
 * CRM Recording Consent - 3F.5
 *
 * Manages call recording consent requirements based on jurisdiction.
 * Canada (federal PIPEDA + provincial laws) requires all-party consent.
 * US varies by state (one-party vs. all-party consent).
 *
 * This module determines when a consent message must be played,
 * provides the appropriate message text, and logs consent events.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Jurisdiction rules
// ---------------------------------------------------------------------------

/**
 * US states requiring all-party consent (both parties must be notified).
 * These are "two-party" or "all-party" consent states.
 */
const US_ALL_PARTY_STATES = new Set([
  'CA', // California
  'CT', // Connecticut
  'DE', // Delaware (in some cases)
  'FL', // Florida
  'IL', // Illinois
  'MA', // Massachusetts
  'MD', // Maryland
  'MI', // Michigan (for eavesdropping)
  'MT', // Montana
  'NH', // New Hampshire
  'NV', // Nevada
  'PA', // Pennsylvania
  'WA', // Washington
]);

/**
 * Canadian provinces - all require consent under PIPEDA + provincial legislation.
 * Canada uses all-party consent federally.
 */
const CANADIAN_PROVINCES = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
]);

/**
 * Jurisdiction classification for consent requirements.
 */
type ConsentRequirement = 'all_party' | 'one_party' | 'none';

/**
 * Determine consent requirement for a jurisdiction.
 *
 * @param jurisdiction - Province/state code (e.g., "QC", "CA", "NY") or country code ("CA", "US")
 * @returns The consent requirement level
 */
function getConsentRequirement(jurisdiction: string): ConsentRequirement {
  const upper = jurisdiction.toUpperCase().trim();

  // Canada (country code or province)
  if (upper === 'CANADA' || CANADIAN_PROVINCES.has(upper)) {
    return 'all_party';
  }

  // US all-party consent states
  if (US_ALL_PARTY_STATES.has(upper)) {
    return 'all_party';
  }

  // US one-party consent states (federal default)
  if (upper === 'US' || upper === 'USA' || upper.length === 2) {
    // If not in the all-party set, it's a one-party state
    // One-party means the caller (our agent) counts as the consenting party,
    // but best practice is still to notify
    return 'one_party';
  }

  // Unknown jurisdiction - default to requiring consent (safer)
  return 'all_party';
}

// ---------------------------------------------------------------------------
// shouldPlayConsent
// ---------------------------------------------------------------------------

/**
 * Determine if a consent message should be played before recording.
 *
 * @param callType - The type of call: 'inbound', 'outbound', 'transfer', etc.
 * @param jurisdiction - Province/state code or country code
 * @returns true if a consent/notification message must be played
 */
export async function shouldPlayConsent(
  callType: string,
  jurisdiction: string
): Promise<boolean> {
  const requirement = getConsentRequirement(jurisdiction);

  switch (requirement) {
    case 'all_party':
      // Must always play consent - both parties need to know
      return true;

    case 'one_party':
      // Technically not required (our agent is the consenting party),
      // but best practice for quality assurance and legal safety.
      // Play consent for all inbound calls (customer is calling us)
      // and outbound calls to new leads.
      if (callType === 'inbound') return true;
      if (callType === 'outbound') return true;
      // Internal/transfer calls don't need it
      return false;

    case 'none':
      return false;

    default:
      // Fail-safe: always play consent if unsure
      return true;
  }
}

// ---------------------------------------------------------------------------
// getConsentMessage
// ---------------------------------------------------------------------------

/**
 * Get the consent notification message text in the specified language.
 *
 * @param lang - Language code ('en', 'fr', 'es', etc.)
 * @returns The consent message text to be read or played
 */
export function getConsentMessage(lang: string): string {
  const messages: Record<string, string> = {
    en: 'This call may be recorded for quality assurance and training purposes. By continuing this call, you consent to the recording.',
    fr: 'Cet appel peut etre enregistre a des fins d\'assurance qualite et de formation. En poursuivant cet appel, vous consentez a l\'enregistrement.',
    es: 'Esta llamada puede ser grabada con fines de aseguramiento de calidad y capacitacion. Al continuar esta llamada, usted consiente la grabacion.',
    de: 'Dieser Anruf kann zu Qualitaetssicherungs- und Schulungszwecken aufgezeichnet werden. Durch die Fortsetzung dieses Anrufs stimmen Sie der Aufzeichnung zu.',
    pt: 'Esta chamada pode ser gravada para fins de garantia de qualidade e treinamento. Ao continuar esta chamada, voce consente com a gravacao.',
    it: 'Questa chiamata puo essere registrata per scopi di garanzia della qualita e formazione. Continuando questa chiamata, acconsenti alla registrazione.',
    ar: 'قد يتم تسجيل هذه المكالمة لأغراض ضمان الجودة والتدريب. بمتابعة هذه المكالمة، فإنك توافق على التسجيل.',
    zh: '本次通话可能会被录音，用于质量保证和培训目的。继续通话即表示您同意录音。',
    ko: '이 통화는 품질 보증 및 교육 목적으로 녹음될 수 있습니다. 통화를 계속하면 녹음에 동의하는 것입니다.',
    hi: 'यह कॉल गुणवत्ता आश्वासन और प्रशिक्षण उद्देश्यों के लिए रिकॉर्ड की जा सकती है। इस कॉल को जारी रखकर, आप रिकॉर्डिंग के लिए सहमति देते हैं।',
    ru: 'Этот звонок может быть записан в целях обеспечения качества и обучения. Продолжая этот звонок, вы даете согласие на запись.',
    vi: 'Cuoc goi nay co the duoc ghi am nham muc dich dam bao chat luong va dao tao. Khi tiep tuc cuoc goi nay, ban dong y voi viec ghi am.',
    pl: 'Ta rozmowa moze byc nagrywana w celach zapewnienia jakosci i szkoleniowych. Kontynuujac ta rozmowe, wyrazasz zgode na nagrywanie.',
  };

  const normalizedLang = lang.toLowerCase().split('-')[0]; // "fr-CA" -> "fr"
  return messages[normalizedLang] || messages['en'];
}

// ---------------------------------------------------------------------------
// logConsentPlayed
// ---------------------------------------------------------------------------

/**
 * Record that the consent message was played for a specific call.
 *
 * Updates the CallRecording entry (if it exists) to mark consent as obtained.
 * If no CallRecording exists yet, this creates a log entry for audit purposes.
 *
 * @param callLogId - The call log ID to associate the consent with
 */
export async function logConsentPlayed(callLogId: string): Promise<void> {
  // Try to update the associated CallRecording
  const recording = await prisma.callRecording.findUnique({
    where: { callLogId },
    select: { id: true },
  });

  if (recording) {
    await prisma.callRecording.update({
      where: { id: recording.id },
      data: {
        consentObtained: true,
        consentMethod: 'ivr_prompt',
      },
    });

    logger.info('Recording consent: marked on recording', {
      event: 'recording_consent_logged',
      callLogId,
      recordingId: recording.id,
      method: 'ivr_prompt',
    });
  } else {
    // No recording entry yet - just log it. The recording entry will be
    // created when the actual recording starts, and should check this log.
    logger.info('Recording consent: played (no recording entry yet)', {
      event: 'recording_consent_played',
      callLogId,
      method: 'ivr_prompt',
    });
  }
}
