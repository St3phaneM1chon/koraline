/**
 * Keyword / Moment Detection — Real-time keyword alerts during live calls
 *
 * Monitors transcription text for configurable keywords and phrases, then
 * triggers categorized alerts. Supports:
 * - Competitor mentions
 * - Price/discount discussions
 * - Cancellation intent
 * - Escalation requests
 * - Compliance-sensitive phrases
 * - Custom keywords per campaign/team
 *
 * Alerts include surrounding context for review and optional supervisor
 * notification. Case-insensitive matching with word boundary awareness.
 *
 * Usage:
 *   const detector = new KeywordDetector();
 *   detector.addKeyword({ keyword: 'lawyer', category: 'escalation', alertLevel: 'critical' });
 *   detector.onKeywordAlert((alert) => notifySupervisor(alert));
 *   const alerts = detector.detect('I want to speak to a lawyer', 'customer');
 */

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeywordConfig {
  keyword: string;
  category: 'competitor' | 'price' | 'cancellation' | 'escalation' | 'compliance' | 'custom';
  alertLevel: 'info' | 'warning' | 'critical';
  notifySupervisor?: boolean;
}

export interface KeywordAlert {
  id: string;
  keyword: string;
  category: string;
  alertLevel: string;
  context: string;
  timestamp: number;
  speaker: 'agent' | 'customer';
  notified: boolean;
}

// ---------------------------------------------------------------------------
// Default keywords
// ---------------------------------------------------------------------------

const DEFAULT_KEYWORDS: KeywordConfig[] = [
  // Cancellation intent
  { keyword: 'cancel', category: 'cancellation', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'annuler', category: 'cancellation', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'terminate', category: 'cancellation', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'unsubscribe', category: 'cancellation', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'desabonner', category: 'cancellation', alertLevel: 'warning', notifySupervisor: false },

  // Escalation
  { keyword: 'manager', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },
  { keyword: 'supervisor', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },
  { keyword: 'responsable', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },
  { keyword: 'lawyer', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },
  { keyword: 'avocat', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },
  { keyword: 'lawsuit', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },
  { keyword: 'poursuivre', category: 'escalation', alertLevel: 'critical', notifySupervisor: true },

  // Price/Refund
  { keyword: 'refund', category: 'price', alertLevel: 'info', notifySupervisor: false },
  { keyword: 'remboursement', category: 'price', alertLevel: 'info', notifySupervisor: false },
  { keyword: 'discount', category: 'price', alertLevel: 'info', notifySupervisor: false },
  { keyword: 'too expensive', category: 'price', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'trop cher', category: 'price', alertLevel: 'warning', notifySupervisor: false },

  // Compliance
  { keyword: 'guarantee', category: 'compliance', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'promise', category: 'compliance', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'garanti', category: 'compliance', alertLevel: 'warning', notifySupervisor: false },
  { keyword: 'promis', category: 'compliance', alertLevel: 'warning', notifySupervisor: false },
];

// ---------------------------------------------------------------------------
// KeywordDetector
// ---------------------------------------------------------------------------

export class KeywordDetector {
  private keywords: KeywordConfig[] = [];
  private alerts: KeywordAlert[] = [];
  private onAlertCallback?: (alert: KeywordAlert) => void;
  private alertCounter = 0;

  constructor(keywords?: KeywordConfig[]) {
    this.keywords = keywords ? [...keywords] : [...DEFAULT_KEYWORDS];
  }

  /**
   * Add a keyword to watch for.
   */
  addKeyword(config: KeywordConfig): void {
    // Avoid duplicates
    const existing = this.keywords.findIndex(
      (k) => k.keyword.toLowerCase() === config.keyword.toLowerCase()
    );
    if (existing >= 0) {
      this.keywords[existing] = config;
    } else {
      this.keywords.push(config);
    }
  }

  /**
   * Remove a keyword from the watch list.
   */
  removeKeyword(keyword: string): void {
    this.keywords = this.keywords.filter(
      (k) => k.keyword.toLowerCase() !== keyword.toLowerCase()
    );
  }

  /**
   * Feed text to check for keywords. Returns any alerts triggered.
   */
  detect(text: string, speaker: 'agent' | 'customer'): KeywordAlert[] {
    const matched = this.matchKeywords(text);
    const newAlerts: KeywordAlert[] = [];

    for (const config of matched) {
      // Build context: extract surrounding text around the keyword
      const context = this.extractContext(text, config.keyword);

      const alert: KeywordAlert = {
        id: this.generateId(),
        keyword: config.keyword,
        category: config.category,
        alertLevel: config.alertLevel,
        context,
        timestamp: Date.now(),
        speaker,
        notified: config.notifySupervisor ?? false,
      };

      // Deduplicate: don't alert for the same keyword within 10 seconds
      const recentSame = this.alerts.find(
        (a) =>
          a.keyword.toLowerCase() === config.keyword.toLowerCase() &&
          Date.now() - a.timestamp < 10000
      );

      if (!recentSame) {
        this.alerts.push(alert);
        newAlerts.push(alert);
        this.onAlertCallback?.(alert);

        logger.info('[KeywordDetection] Alert triggered', {
          keyword: config.keyword,
          category: config.category,
          alertLevel: config.alertLevel,
          speaker,
        });
      }
    }

    return newAlerts;
  }

  /**
   * Match text against all configured keywords.
   * Uses case-insensitive matching with word boundary detection for single words,
   * and substring matching for multi-word phrases.
   */
  private matchKeywords(text: string): KeywordConfig[] {
    const lowerText = text.toLowerCase();
    const matched: KeywordConfig[] = [];

    for (const config of this.keywords) {
      const keyword = config.keyword.toLowerCase();

      // Multi-word phrase: use simple substring matching
      if (keyword.includes(' ')) {
        if (lowerText.includes(keyword)) {
          matched.push(config);
        }
      } else {
        // Single word: use word boundary regex for precision
        try {
          const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
          if (regex.test(text)) {
            matched.push(config);
          }
        } catch {
          // Fallback to substring match if regex fails
          if (lowerText.includes(keyword)) {
            matched.push(config);
          }
        }
      }
    }

    return matched;
  }

  /**
   * Extract surrounding context around the keyword match.
   */
  private extractContext(text: string, keyword: string): string {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerText.indexOf(lowerKeyword);

    if (index < 0) return text;

    // Take up to 50 characters before and after the keyword
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + keyword.length + 50);

    let context = text.substring(start, end).trim();
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context;
  }

  /**
   * Escape special regex characters in a string.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Subscribe to keyword alerts.
   */
  onKeywordAlert(callback: (alert: KeywordAlert) => void): void {
    this.onAlertCallback = callback;
  }

  /**
   * Get all alerts from this session.
   */
  getAlerts(): KeywordAlert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts filtered by category.
   */
  getAlertsByCategory(category: string): KeywordAlert[] {
    return this.alerts.filter((a) => a.category === category);
  }

  /**
   * Get alerts filtered by alert level.
   */
  getAlertsByLevel(level: 'info' | 'warning' | 'critical'): KeywordAlert[] {
    return this.alerts.filter((a) => a.alertLevel === level);
  }

  /**
   * Get all currently configured keywords.
   */
  getKeywords(): KeywordConfig[] {
    return [...this.keywords];
  }

  /**
   * Load keywords from an external config source (API endpoint).
   */
  async loadFromConfig(configId: string): Promise<void> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/voip/keyword-configs/${configId}`);

      if (!response.ok) {
        throw new Error(`Failed to load keyword config: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.keywords)) {
        // Merge with existing, new config overwrites duplicates
        for (const kw of data.keywords) {
          this.addKeyword({
            keyword: kw.keyword,
            category: kw.category || 'custom',
            alertLevel: kw.alertLevel || 'info',
            notifySupervisor: kw.notifySupervisor ?? false,
          });
        }
        logger.info('[KeywordDetection] Loaded config', {
          configId,
          keywordCount: data.keywords.length,
        });
      }
    } catch (error) {
      logger.warn('[KeywordDetection] Failed to load config', {
        configId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get summary statistics for the current session.
   */
  getSummary(): {
    totalAlerts: number;
    byCategory: Record<string, number>;
    byLevel: Record<string, number>;
    criticalAlerts: KeywordAlert[];
  } {
    const byCategory: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    for (const alert of this.alerts) {
      byCategory[alert.category] = (byCategory[alert.category] || 0) + 1;
      byLevel[alert.alertLevel] = (byLevel[alert.alertLevel] || 0) + 1;
    }

    return {
      totalAlerts: this.alerts.length,
      byCategory,
      byLevel,
      criticalAlerts: this.alerts.filter((a) => a.alertLevel === 'critical'),
    };
  }

  /**
   * Reset all alerts and state.
   */
  reset(): void {
    this.alerts = [];
    this.alertCounter = 0;
  }

  // -- Helpers ----------------------------------------------------------------

  private generateId(): string {
    this.alertCounter++;
    return `kw-${Date.now()}-${this.alertCounter}`;
  }
}
