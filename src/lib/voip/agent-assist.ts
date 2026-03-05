/**
 * AI Agent Assist — Contextual suggestions to agents during live calls
 *
 * Listens to the conversation transcript and generates:
 * - Suggested responses to customer questions
 * - Knowledge base lookups for product/policy info
 * - Action recommendations (upsell, escalation, follow-up)
 * - Compliance warnings (prohibited phrases, missing disclosures)
 *
 * Integrates with CRM context (customer info, order history) for personalized
 * suggestions. Uses OpenAI GPT for intelligent suggestion generation.
 *
 * Usage:
 *   const assist = new AgentAssist({ productCatalog: true });
 *   assist.setCrmContext({ customerName: 'John', orderHistory: [...] });
 *   assist.onNewSuggestion((s) => renderSuggestion(s));
 *   assist.feedTranscript('customer', 'I want to cancel my order');
 */

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Suggestion {
  id: string;
  type: 'response' | 'knowledge' | 'action' | 'warning' | 'upsell';
  text: string;
  confidence: number;
  source?: string;
  timestamp: number;
}

export interface AgentAssistConfig {
  apiKey?: string;
  model?: string;
  maxSuggestions?: number;
  crmContext?: Record<string, unknown>;
  productCatalog?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Required<AgentAssistConfig> = {
  apiKey: '',
  model: 'gpt-4o-mini',
  maxSuggestions: 50,
  crmContext: {},
  productCatalog: false,
};

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

const ASSIST_SYSTEM_PROMPT = `You are an AI assistant helping a customer service agent during a live call.
Based on the conversation so far and available CRM context, generate helpful suggestions.

Return a JSON array of suggestion objects, each with:
- "type": one of "response", "knowledge", "action", "warning", "upsell"
- "text": the suggestion text (concise, actionable)
- "confidence": 0.0-1.0 how relevant this suggestion is
- "source": optional source reference (e.g., "FAQ #12", "Policy 3.2")

Rules:
- "response": A suggested reply the agent can use or adapt
- "knowledge": Relevant product/policy information
- "action": Recommended action (create ticket, escalate, schedule callback)
- "warning": Compliance/quality warning (missing greeting, prohibited language)
- "upsell": Cross-sell or upsell opportunity based on context

Generate 1-3 suggestions maximum. Only include high-relevance ones.
Respond ONLY with a valid JSON array, no markdown fences.`;

// ---------------------------------------------------------------------------
// AgentAssist
// ---------------------------------------------------------------------------

export class AgentAssist {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private suggestions: Suggestion[] = [];
  private crmData: Record<string, unknown> = {};
  private onSuggestionCallback?: (suggestion: Suggestion) => void;
  private config: Required<AgentAssistConfig>;
  private dismissed = new Set<string>();
  private suggestionCounter = 0;

  constructor(config?: AgentAssistConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY || '',
    };
    if (config?.crmContext) {
      this.crmData = { ...config.crmContext };
    }
  }

  /**
   * Set CRM context (customer info, order history, etc.).
   */
  setCrmContext(data: Record<string, unknown>): void {
    this.crmData = { ...this.crmData, ...data };
  }

  /**
   * Feed transcript text to generate suggestions.
   * Returns new suggestions generated for this utterance.
   */
  async feedTranscript(
    speaker: 'agent' | 'customer',
    text: string
  ): Promise<Suggestion[]> {
    this.conversationHistory.push({
      role: speaker,
      content: text,
    });

    // Only generate suggestions on customer utterances (agent doesn't need
    // suggestions for their own words), unless it's the first message
    if (speaker === 'agent' && this.conversationHistory.length > 1) {
      return [];
    }

    try {
      const newSuggestions = await this.generateSuggestions(text);

      for (const suggestion of newSuggestions) {
        this.suggestions.push(suggestion);
        this.onSuggestionCallback?.(suggestion);
      }

      // Trim old suggestions
      if (this.suggestions.length > this.config.maxSuggestions) {
        this.suggestions = this.suggestions.slice(-this.config.maxSuggestions);
      }

      return newSuggestions;
    } catch (error) {
      logger.warn('[AgentAssist] Suggestion generation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Generate suggestions using GPT based on conversation context.
   */
  private async generateSuggestions(customerText: string): Promise<Suggestion[]> {
    if (!this.config.apiKey) {
      return this.fallbackSuggestions(customerText);
    }

    // Build context message with CRM data and conversation history
    const recentHistory = this.conversationHistory.slice(-10);
    const contextParts: string[] = [];

    if (Object.keys(this.crmData).length > 0) {
      contextParts.push(`CRM Context: ${JSON.stringify(this.crmData)}`);
    }

    contextParts.push(
      'Conversation:',
      ...recentHistory.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    );

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: ASSIST_SYSTEM_PROMPT },
            { role: 'user', content: contextParts.join('\n') },
          ],
          temperature: 0.4,
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: Record<string, unknown>) => ({
        id: this.generateId(),
        type: this.validateType(item.type as string),
        text: String(item.text || ''),
        confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
        source: item.source ? String(item.source) : undefined,
        timestamp: Date.now(),
      }));
    } catch (error) {
      logger.debug('[AgentAssist] GPT call failed, using fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.fallbackSuggestions(customerText);
    }
  }

  /**
   * Fallback keyword-based suggestions when OpenAI is unavailable.
   */
  private fallbackSuggestions(text: string): Suggestion[] {
    const lower = text.toLowerCase();
    const suggestions: Suggestion[] = [];

    if (lower.includes('cancel') || lower.includes('annuler')) {
      suggestions.push({
        id: this.generateId(),
        type: 'action',
        text: 'Customer is requesting cancellation. Check retention offers before proceeding.',
        confidence: 0.9,
        source: 'Keyword: cancellation',
        timestamp: Date.now(),
      });
    }

    if (lower.includes('refund') || lower.includes('remboursement')) {
      suggestions.push({
        id: this.generateId(),
        type: 'knowledge',
        text: 'Refund policy: Full refund within 30 days, partial refund within 60 days. Check order date.',
        confidence: 0.8,
        source: 'Refund Policy',
        timestamp: Date.now(),
      });
    }

    if (lower.includes('manager') || lower.includes('supervisor') || lower.includes('responsable')) {
      suggestions.push({
        id: this.generateId(),
        type: 'warning',
        text: 'Customer requesting escalation. Acknowledge concern and attempt resolution before transferring.',
        confidence: 0.95,
        source: 'Escalation Protocol',
        timestamp: Date.now(),
      });
    }

    if (lower.includes('price') || lower.includes('discount') || lower.includes('prix') || lower.includes('rabais')) {
      suggestions.push({
        id: this.generateId(),
        type: 'upsell',
        text: 'Consider offering bundle pricing or subscription discount for retention.',
        confidence: 0.6,
        source: 'Sales Guidelines',
        timestamp: Date.now(),
      });
    }

    return suggestions;
  }

  /**
   * Get a suggested response for the current conversation context.
   */
  async getSuggestedResponse(): Promise<string> {
    if (!this.config.apiKey || this.conversationHistory.length === 0) {
      return '';
    }

    const recentHistory = this.conversationHistory.slice(-8);

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content:
                'You are helping a customer service agent. Generate a single suggested response the agent can say next. Be professional, empathetic, and concise. Return only the suggested text, no JSON.',
            },
            {
              role: 'user',
              content: recentHistory
                .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
                .join('\n'),
            },
          ],
          temperature: 0.5,
          max_tokens: 150,
        }),
      });

      if (!response.ok) return '';

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    } catch {
      return '';
    }
  }

  /**
   * Search knowledge base for relevant information.
   */
  async searchKnowledge(query: string): Promise<Suggestion[]> {
    // Use GPT as a knowledge retrieval proxy
    if (!this.config.apiKey) return [];

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: `You are a knowledge base assistant. Given the query, return relevant product/policy information as a JSON array of objects with "text" and "source" fields. Max 3 results. Respond ONLY with valid JSON array.`,
            },
            { role: 'user', content: query },
          ],
          temperature: 0.2,
          max_tokens: 300,
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: Record<string, unknown>) => ({
        id: this.generateId(),
        type: 'knowledge' as const,
        text: String(item.text || ''),
        confidence: 0.7,
        source: item.source ? String(item.source) : 'Knowledge Base',
        timestamp: Date.now(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to new suggestions.
   */
  onNewSuggestion(callback: (suggestion: Suggestion) => void): void {
    this.onSuggestionCallback = callback;
  }

  /**
   * Get all active (non-dismissed) suggestions.
   */
  getAllSuggestions(): Suggestion[] {
    return this.suggestions.filter((s) => !this.dismissed.has(s.id));
  }

  /**
   * Dismiss a suggestion by ID.
   */
  dismissSuggestion(id: string): void {
    this.dismissed.add(id);
  }

  /**
   * Reset all state for a new call.
   */
  reset(): void {
    this.conversationHistory = [];
    this.suggestions = [];
    this.dismissed.clear();
    this.suggestionCounter = 0;
  }

  // -- Helpers ----------------------------------------------------------------

  private generateId(): string {
    this.suggestionCounter++;
    return `sug-${Date.now()}-${this.suggestionCounter}`;
  }

  private validateType(type: string): Suggestion['type'] {
    const valid: Suggestion['type'][] = ['response', 'knowledge', 'action', 'warning', 'upsell'];
    return valid.includes(type as Suggestion['type'])
      ? (type as Suggestion['type'])
      : 'response';
  }
}
