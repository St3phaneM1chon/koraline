/**
 * #11 Search Highlighting — Wrap matched terms in <mark> tags
 * #12 Typo Correction — "Did you mean X?" for misspelled queries
 */

// ── Search Highlighting ─────────────────────────────────────

/**
 * Wraps matched search terms with <mark> tags for highlighting.
 * Safe: escapes HTML entities before inserting marks.
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim() || !text) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const terms = query.trim().split(/\s+/).filter(t => t.length >= 2);

  if (terms.length === 0) return escaped;

  // Build regex that matches any of the search terms (case-insensitive)
  const pattern = terms
    .map(t => escapeRegex(t))
    .join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');
  return escaped.replace(regex, '<mark class="bg-yellow-200 text-gray-900 rounded px-0.5">$1</mark>');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Typo Correction ─────────────────────────────────────────

/**
 * Common product names and their misspellings.
 * Used for "Did you mean?" suggestions.
 */
const KNOWN_TERMS: Record<string, string[]> = {
  'BPC-157': ['bpc157', 'bpc 157', 'bpc-15', 'bp-157', 'bpc1-57', 'bpc-157'],
  'TB-500': ['tb500', 'tb 500', 'tb-50', 'tv-500', 'tb500', 'thymosin'],
  'Semaglutide': ['semaglutid', 'semaglutyde', 'semglutide', 'semagltide', 'ozempic', 'semaglitide'],
  'Tirzepatide': ['tirzepatid', 'tirzepatyde', 'tirz', 'mounjaro', 'tirzapatide', 'trzepatide'],
  'Ipamorelin': ['ipamorlin', 'ipamorelen', 'ipamorellin', 'ipamoreiln'],
  'GHK-Cu': ['ghk cu', 'ghkcu', 'ghk-copper', 'ghk copper', 'ghk-c'],
  'Melanotan': ['melanontan', 'melantan', 'melonatan', 'melanotane'],
  'Peptide': ['peptid', 'peptyde', 'petide', 'pepitde'],
  'Collagen': ['colagen', 'colegen', 'collagene', 'collgen'],
  'NAD+': ['nad', 'nad plus', 'nad+', 'nmn'],
  'CJC-1295': ['cjc1295', 'cjc 1295', 'cjc-129', 'cjc-12'],
  'Selank': ['selank', 'selanck', 'seleank'],
  'Semax': ['semex', 'semaks', 'smax'],
  'PT-141': ['pt141', 'pt 141', 'pt-14', 'bremelanotide'],
};

/**
 * Computes Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Returns a "Did you mean?" suggestion if the query looks misspelled.
 * Returns null if the query seems fine or is already a known term.
 */
export function getTypoCorrection(query: string): string | null {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 3) return null;

  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const [correctTerm, misspellings] of Object.entries(KNOWN_TERMS)) {
    // Exact match on correct term — no suggestion needed
    if (normalized === correctTerm.toLowerCase()) return null;

    // Check against known misspellings
    for (const typo of misspellings) {
      if (normalized === typo.toLowerCase()) return correctTerm;
    }

    // Levenshtein distance check
    const distance = levenshtein(normalized, correctTerm.toLowerCase());
    const threshold = Math.max(1, Math.floor(correctTerm.length * 0.3));

    if (distance > 0 && distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = correctTerm;
    }
  }

  return bestMatch;
}

/**
 * Get multiple typo suggestions ranked by relevance.
 */
export function getTypoSuggestions(query: string, maxSuggestions: number = 3): string[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 3) return [];

  const suggestions: { term: string; distance: number }[] = [];

  for (const [correctTerm, misspellings] of Object.entries(KNOWN_TERMS)) {
    if (normalized === correctTerm.toLowerCase()) return [];

    for (const typo of misspellings) {
      if (normalized === typo.toLowerCase()) {
        suggestions.push({ term: correctTerm, distance: 0 });
        break;
      }
    }

    const distance = levenshtein(normalized, correctTerm.toLowerCase());
    const threshold = Math.max(2, Math.floor(correctTerm.length * 0.4));
    if (distance > 0 && distance <= threshold) {
      suggestions.push({ term: correctTerm, distance });
    }
  }

  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(s => s.term);
}
