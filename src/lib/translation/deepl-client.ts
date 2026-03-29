/**
 * DEEPL TRANSLATION CLIENT (G30)
 *
 * Optional DeepL API integration for higher-quality translations.
 * Falls back gracefully to GPT-4o-mini if DEEPL_API_KEY is not configured.
 *
 * Features:
 * - Single text translation
 * - Batch translation (up to 50 texts per request)
 * - Language detection
 * - In-memory cache to avoid re-translating identical content
 */

import { logger } from '@/lib/logger';
import { cacheGet, cacheSet, CacheTTL } from '@/lib/cache';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEEPL_API_BASE_FREE = 'https://api-free.deepl.com/v2';
const DEEPL_API_BASE_PRO = 'https://api.deepl.com/v2';

function getDeepLConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return null;

  // Free API keys end with ':fx'
  const baseUrl = apiKey.endsWith(':fx') ? DEEPL_API_BASE_FREE : DEEPL_API_BASE_PRO;
  return { apiKey, baseUrl };
}

/** Check if DeepL is available (API key configured) */
export function isDeepLAvailable(): boolean {
  return !!process.env.DEEPL_API_KEY;
}

// ---------------------------------------------------------------------------
// Language code mapping (Koraline locale -> DeepL language code)
// ---------------------------------------------------------------------------

const LOCALE_TO_DEEPL: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
  it: 'IT',
  pt: 'PT-BR',
  ru: 'RU',
  zh: 'ZH',
  ko: 'KO',
  pl: 'PL',
  sv: 'SV',
  ar: 'AR',
  hi: 'HI',
  // Unsupported by DeepL: gcr, ht, pa, ta, tl, vi, ar-dz, ar-lb, ar-ma
  // These will fall back to GPT-4o-mini
};

export function isDeepLSupportedLocale(locale: string): boolean {
  return !!LOCALE_TO_DEEPL[locale];
}

function toDeepLLang(locale: string): string {
  return LOCALE_TO_DEEPL[locale] || locale.toUpperCase();
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function deepLCacheKey(text: string, targetLang: string): string {
  const hash = createHash('md5').update(text).digest('hex');
  return `deepl:${targetLang}:${hash}`;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Translate a single text using DeepL API.
 * Returns the translated text. Throws on API errors.
 */
export async function translateWithDeepL(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  const config = getDeepLConfig();
  if (!config) {
    throw new Error('DEEPL_API_KEY not configured');
  }

  // Check cache
  const cacheKey = deepLCacheKey(text, targetLang);
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const deepLTarget = toDeepLLang(targetLang);
  const deepLSource = toDeepLLang(sourceLang);

  const response = await fetch(`${config.baseUrl}/translate`, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: deepLSource,
      target_lang: deepLTarget,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[DeepL] API error', { status: response.status, error: errorText });
    throw new Error(`DeepL API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const translated = data.translations?.[0]?.text || text;

  // Cache the result
  cacheSet(cacheKey, translated, { ttl: CacheTTL.STATIC, tags: ['deepl'] });

  return translated;
}

/**
 * Batch translate multiple texts using DeepL API (up to 50 per request).
 * Returns an array of translated texts in the same order.
 */
export async function batchTranslateWithDeepL(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  if (texts.length === 0) return [];

  const config = getDeepLConfig();
  if (!config) {
    throw new Error('DEEPL_API_KEY not configured');
  }

  // Check cache for each text, collect uncached
  const results: (string | null)[] = new Array(texts.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    if (!texts[i] || texts[i].trim().length === 0) {
      results[i] = '';
      continue;
    }
    const cacheKey = deepLCacheKey(texts[i], targetLang);
    const cached = cacheGet<string>(cacheKey);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
    }
  }

  // Translate uncached texts in batches of 50
  const BATCH_SIZE = 50;
  for (let b = 0; b < uncachedTexts.length; b += BATCH_SIZE) {
    const batch = uncachedTexts.slice(b, b + BATCH_SIZE);
    const batchIndices = uncachedIndices.slice(b, b + BATCH_SIZE);

    const deepLTarget = toDeepLLang(targetLang);
    const deepLSource = toDeepLLang(sourceLang);

    const response = await fetch(`${config.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: batch,
        source_lang: deepLSource,
        target_lang: deepLTarget,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[DeepL] Batch API error', { status: response.status, error: errorText });
      // On error, keep original texts for this batch
      for (let i = 0; i < batch.length; i++) {
        results[batchIndices[i]] = batch[i];
      }
      continue;
    }

    const data = await response.json();
    const translations = data.translations || [];

    for (let i = 0; i < batch.length; i++) {
      const translated = translations[i]?.text || batch[i];
      results[batchIndices[i]] = translated;

      // Cache each result
      const cacheKey = deepLCacheKey(batch[i], targetLang);
      cacheSet(cacheKey, translated, { ttl: CacheTTL.STATIC, tags: ['deepl'] });
    }
  }

  return results.map((r, i) => r ?? texts[i]);
}

/**
 * Get DeepL API usage statistics (character count / limit).
 */
export async function getDeepLUsage(): Promise<{
  characterCount: number;
  characterLimit: number;
  percentUsed: number;
} | null> {
  const config = getDeepLConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.baseUrl}/usage`, {
      headers: { 'Authorization': `DeepL-Auth-Key ${config.apiKey}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      characterCount: data.character_count || 0,
      characterLimit: data.character_limit || 0,
      percentUsed: data.character_limit
        ? Math.round((data.character_count / data.character_limit) * 100)
        : 0,
    };
  } catch {
    return null;
  }
}
