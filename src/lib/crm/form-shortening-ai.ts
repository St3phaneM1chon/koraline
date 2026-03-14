/**
 * CRM AI Form Shortening (A23)
 *
 * Intelligently pre-fill and shorten forms using enrichment data.
 * Similar to HubSpot Breeze Intelligence form optimization.
 *
 * Features:
 * - Determine which form fields can be pre-filled from existing CRM data
 * - Pre-fill form data from CrmLead + enrichment sources
 * - Calculate optimal form length based on conversion analytics
 * - Progressive profiling: only ask for unknown fields
 * - Form optimization metrics: completion rates, drop-off analysis
 * - AI-powered field removal suggestions
 *
 * Uses lazy OpenAI init for AI-powered suggestions.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Lazy OpenAI client
// ---------------------------------------------------------------------------

let _openai: ReturnType<typeof require> | null = null;

function getOpenAI(): { chat: { completions: { create: (params: Record<string, unknown>) => Promise<{ choices?: { message?: { content?: string } }[] }> } } } {
  if (_openai) return _openai;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: OpenAI } = require('openai');
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartFormField {
  field: string;
  canPrefill: boolean;
  currentValue: string | null;
  source: 'crm' | 'enrichment' | 'none';
  confidence: number; // 0-1
}

export interface PrefillData {
  leadId: string;
  fields: Record<string, string | number | null>;
  sources: Record<string, string>;   // field -> source
  coverage: number;                  // % of fields pre-filled
}

export interface FormLengthRecommendation {
  currentFieldCount: number;
  optimalFieldCount: number;
  currentConversionRate: number;
  predictedConversionRate: number;
  recommendation: string;
  reasoning: string;
}

export interface ProgressiveProfilingResult {
  leadId: string;
  knownFields: string[];
  unknownFields: string[];
  suggestedOrder: string[]; // Priority order for unknown fields
  formFieldCount: number;   // Recommended fields to show
}

export interface FormMetrics {
  formId: string;
  totalSubmissions: number;
  completionRate: number;
  avgTimeToComplete: number;  // seconds
  dropOffFields: {
    field: string;
    dropOffRate: number;
    avgTimeSpent: number;
  }[];
  fieldCompletionRates: Record<string, number>;
}

export interface FieldRemovalSuggestion {
  field: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  conversionLift: number; // estimated % increase
  alternativeSource: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Common form field to CrmLead field mapping.
 */
const FIELD_MAPPING: Record<string, { leadField: string; enrichmentPath?: string }> = {
  firstName: { leadField: 'contactName' },
  lastName: { leadField: 'contactName' },
  name: { leadField: 'contactName' },
  fullName: { leadField: 'contactName' },
  email: { leadField: 'email' },
  phone: { leadField: 'phone' },
  company: { leadField: 'companyName' },
  companyName: { leadField: 'companyName' },
  title: { leadField: 'customFields', enrichmentPath: 'linkedin.title' },
  jobTitle: { leadField: 'customFields', enrichmentPath: 'linkedin.title' },
  industry: { leadField: 'customFields', enrichmentPath: '_webEnrichment.industry' },
  companySize: { leadField: 'customFields', enrichmentPath: '_webEnrichment.companySize' },
  website: { leadField: 'customFields', enrichmentPath: '_enrichment.companyDomain' },
  city: { leadField: 'customFields', enrichmentPath: '_enrichment.city' },
  country: { leadField: 'customFields', enrichmentPath: '_enrichment.country' },
  linkedinUrl: { leadField: 'customFields', enrichmentPath: 'linkedin.url' },
};

/**
 * Extract a nested value from an object using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Get form metrics from audit trail (config storage pattern).
 */
async function getFormMetricsData(
  formId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const trail = await prisma.auditTrail.findFirst({
      where: { entityType: 'FORM_METRICS', entityId: formId, action: 'CONFIG' },
      orderBy: { createdAt: 'desc' },
    });
    if (!trail) return null;
    return (trail.metadata as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// getSmartFormFields
// ---------------------------------------------------------------------------

/**
 * Determine which form fields can be pre-filled from existing CRM data.
 */
export async function getSmartFormFields(
  leadId: string,
  formFields: string[],
): Promise<SmartFormField[]> {
  const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead not found');

  const customFields = (lead.customFields as Record<string, unknown>) || {};
  const results: SmartFormField[] = [];

  for (const field of formFields) {
    const mapping = FIELD_MAPPING[field];
    let canPrefill = false;
    let currentValue: string | null = null;
    let source: SmartFormField['source'] = 'none';
    let confidence = 0;

    if (mapping) {
      // Check direct CRM field
      if (mapping.leadField !== 'customFields') {
        const directValue = (lead as Record<string, unknown>)[mapping.leadField];
        if (directValue) {
          canPrefill = true;
          currentValue = String(directValue);
          source = 'crm';
          confidence = 0.95;

          // Handle name splitting
          if (field === 'firstName' && typeof directValue === 'string') {
            currentValue = directValue.split(' ')[0] || null;
          } else if (field === 'lastName' && typeof directValue === 'string') {
            const parts = directValue.split(' ');
            currentValue = parts.length > 1 ? parts.slice(1).join(' ') : null;
            if (!currentValue) { canPrefill = false; confidence = 0; }
          }
        }
      }

      // Check enrichment data
      if (!canPrefill && mapping.enrichmentPath) {
        const enrichedValue = getNestedValue(customFields, mapping.enrichmentPath);
        if (enrichedValue) {
          canPrefill = true;
          currentValue = String(enrichedValue);
          source = 'enrichment';
          confidence = 0.75;
        }
      }
    }

    results.push({ field, canPrefill, currentValue, source, confidence });
  }

  return results;
}

// ---------------------------------------------------------------------------
// prefillFormData
// ---------------------------------------------------------------------------

/**
 * Return all pre-fillable data for a lead from CRM + enrichment sources.
 */
export async function prefillFormData(leadId: string): Promise<PrefillData> {
  const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead not found');

  const customFields = (lead.customFields as Record<string, unknown>) || {};
  const fields: Record<string, string | number | null> = {};
  const sources: Record<string, string> = {};

  // Direct CRM fields
  if (lead.contactName) {
    const parts = lead.contactName.split(' ');
    fields.firstName = parts[0] || null;
    fields.lastName = parts.slice(1).join(' ') || null;
    fields.name = lead.contactName;
    fields.fullName = lead.contactName;
    sources.firstName = 'crm';
    sources.lastName = 'crm';
    sources.name = 'crm';
    sources.fullName = 'crm';
  }

  if (lead.email) {
    fields.email = lead.email;
    sources.email = 'crm';
  }

  if (lead.phone) {
    fields.phone = lead.phone;
    sources.phone = 'crm';
  }

  if (lead.companyName) {
    fields.company = lead.companyName;
    fields.companyName = lead.companyName;
    sources.company = 'crm';
    sources.companyName = 'crm';
  }

  // Enrichment data
  const enrichmentFields: Array<{ formField: string; path: string }> = [
    { formField: 'title', path: 'linkedin.title' },
    { formField: 'jobTitle', path: 'linkedin.title' },
    { formField: 'industry', path: '_webEnrichment.industry' },
    { formField: 'companySize', path: '_webEnrichment.companySize' },
    { formField: 'website', path: '_enrichment.companyDomain' },
    { formField: 'city', path: '_enrichment.city' },
    { formField: 'country', path: '_enrichment.country' },
    { formField: 'linkedinUrl', path: 'linkedin.url' },
  ];

  for (const ef of enrichmentFields) {
    if (!fields[ef.formField]) {
      const val = getNestedValue(customFields, ef.path);
      if (val) {
        fields[ef.formField] = String(val);
        sources[ef.formField] = 'enrichment';
      }
    }
  }

  const totalPossible = Object.keys(FIELD_MAPPING).length;
  const filled = Object.keys(fields).filter((k) => fields[k] !== null).length;
  const coverage = totalPossible > 0
    ? Math.round((filled / totalPossible) * 10000) / 100
    : 0;

  return { leadId, fields, sources, coverage };
}

// ---------------------------------------------------------------------------
// calculateOptimalFormLength
// ---------------------------------------------------------------------------

/**
 * Recommend optimal number of form fields based on conversion data.
 * Uses industry benchmarks and current conversion rate.
 */
export function calculateOptimalFormLength(
  conversionRate: number,
  currentFieldCount: number,
): FormLengthRecommendation {
  // Industry benchmarks: fewer fields = higher conversion
  // 1-3 fields: ~25% conversion
  // 4-5 fields: ~20% conversion
  // 6-7 fields: ~15% conversion
  // 8+ fields: ~10% conversion
  const benchmarks = [
    { fields: 3, rate: 25 },
    { fields: 5, rate: 20 },
    { fields: 7, rate: 15 },
    { fields: 10, rate: 10 },
    { fields: 15, rate: 5 },
  ];

  // Find optimal based on current performance
  let optimalFieldCount = currentFieldCount;
  let predictedRate = conversionRate;

  if (conversionRate < 15 && currentFieldCount > 5) {
    optimalFieldCount = Math.max(3, Math.floor(currentFieldCount * 0.6));
    // Estimate improvement
    const currentBench = benchmarks.find((b) => b.fields >= currentFieldCount) || benchmarks[benchmarks.length - 1];
    const optimalBench = benchmarks.find((b) => b.fields >= optimalFieldCount) || benchmarks[0];
    predictedRate = Math.min(conversionRate * (optimalBench.rate / currentBench.rate), 35);
  } else if (conversionRate < 20 && currentFieldCount > 3) {
    optimalFieldCount = Math.max(3, currentFieldCount - 2);
    predictedRate = conversionRate * 1.15;
  }

  let recommendation: string;
  let reasoning: string;

  if (optimalFieldCount === currentFieldCount) {
    recommendation = 'Current form length is optimal';
    reasoning = `With ${currentFieldCount} fields and ${conversionRate}% conversion, your form is performing well.`;
  } else {
    recommendation = `Reduce to ${optimalFieldCount} fields`;
    reasoning = `Reducing from ${currentFieldCount} to ${optimalFieldCount} fields could increase conversion from ${conversionRate}% to ~${Math.round(predictedRate)}%.`;
  }

  return {
    currentFieldCount,
    optimalFieldCount,
    currentConversionRate: conversionRate,
    predictedConversionRate: Math.round(predictedRate * 10) / 10,
    recommendation,
    reasoning,
  };
}

// ---------------------------------------------------------------------------
// getProgressiveProfilingFields
// ---------------------------------------------------------------------------

/**
 * Return only fields we don't know yet for progressive profiling.
 * Shows the most valuable unknown fields first.
 */
export async function getProgressiveProfilingFields(
  leadId: string,
  allFields: string[],
): Promise<ProgressiveProfilingResult> {
  const smartFields = await getSmartFormFields(leadId, allFields);

  const knownFields = smartFields.filter((f) => f.canPrefill).map((f) => f.field);
  const unknownFields = smartFields.filter((f) => !f.canPrefill).map((f) => f.field);

  // Prioritize fields by business value
  const fieldPriority: Record<string, number> = {
    email: 10,
    phone: 8,
    company: 7,
    companyName: 7,
    name: 6,
    fullName: 6,
    firstName: 5,
    lastName: 5,
    title: 4,
    jobTitle: 4,
    industry: 3,
    companySize: 3,
    website: 2,
    city: 1,
    country: 1,
  };

  const suggestedOrder = unknownFields.sort(
    (a, b) => (fieldPriority[b] || 0) - (fieldPriority[a] || 0),
  );

  // Show max 4 unknown fields at a time
  const formFieldCount = Math.min(unknownFields.length, 4);

  return {
    leadId,
    knownFields,
    unknownFields,
    suggestedOrder: suggestedOrder.slice(0, formFieldCount),
    formFieldCount,
  };
}

// ---------------------------------------------------------------------------
// getFormOptimizationMetrics
// ---------------------------------------------------------------------------

/**
 * Get form performance metrics: completion rate, drop-off fields, avg time.
 */
export async function getFormOptimizationMetrics(
  formId: string,
): Promise<FormMetrics> {
  const metricsData = await getFormMetricsData(formId);

  if (!metricsData) {
    // Return empty metrics if no data collected yet
    return {
      formId,
      totalSubmissions: 0,
      completionRate: 0,
      avgTimeToComplete: 0,
      dropOffFields: [],
      fieldCompletionRates: {},
    };
  }

  return {
    formId,
    totalSubmissions: Number(metricsData.totalSubmissions || 0),
    completionRate: Number(metricsData.completionRate || 0),
    avgTimeToComplete: Number(metricsData.avgTimeToComplete || 0),
    dropOffFields: (metricsData.dropOffFields || []) as FormMetrics['dropOffFields'],
    fieldCompletionRates: (metricsData.fieldCompletionRates || {}) as Record<string, number>,
  };
}

// ---------------------------------------------------------------------------
// suggestFieldRemovals
// ---------------------------------------------------------------------------

/**
 * AI analysis of which form fields hurt conversion and should be removed.
 */
export async function suggestFieldRemovals(
  formId: string,
): Promise<FieldRemovalSuggestion[]> {
  const metrics = await getFormOptimizationMetrics(formId);

  // Rule-based suggestions first
  const suggestions: FieldRemovalSuggestion[] = [];

  for (const dropOff of metrics.dropOffFields) {
    if (dropOff.dropOffRate > 20) {
      suggestions.push({
        field: dropOff.field,
        reason: `${dropOff.dropOffRate}% of users abandon the form at this field`,
        impact: dropOff.dropOffRate > 40 ? 'high' : 'medium',
        conversionLift: Math.round(dropOff.dropOffRate * 0.3 * 10) / 10,
        alternativeSource: FIELD_MAPPING[dropOff.field]
          ? 'Can be obtained via enrichment'
          : null,
      });
    }
  }

  // AI-powered deeper analysis
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.ENRICHMENT_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a conversion rate optimization expert. Analyze form metrics and suggest fields to remove. ' +
            'Return JSON array: [{"field":"name","reason":"why","impact":"high|medium|low","conversionLift":5.0,"alternativeSource":"enrichment|null"}]',
        },
        {
          role: 'user',
          content: `Form ${formId}:\nSubmissions: ${metrics.totalSubmissions}\n` +
            `Completion rate: ${metrics.completionRate}%\nAvg time: ${metrics.avgTimeToComplete}s\n` +
            `Drop-off fields: ${JSON.stringify(metrics.dropOffFields)}\n` +
            `Field completion rates: ${JSON.stringify(metrics.fieldCompletionRates)}`,
        },
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (raw) {
      const aiSuggestions = JSON.parse(raw) as FieldRemovalSuggestion[];
      // Merge AI suggestions (avoid duplicates)
      for (const ai of aiSuggestions) {
        if (!suggestions.find((s) => s.field === ai.field)) {
          suggestions.push(ai);
        }
      }
    }
  } catch (error) {
    logger.debug('[Form-AI] AI suggestions unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return suggestions.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
  });
}
