'use client';

/**
 * MASTERY GRAPH — Interactive concept mastery visualization
 * ==========================================================
 * Renders a responsive grid of concept nodes, color-coded by mastery level.
 * Concepts are grouped by domain with section headers.
 * Click a concept to open a detail popup with mastery stats and linked lessons.
 *
 * Usage:
 *   <MasteryGraph concepts={concepts} />
 */

import { useState, useMemo, useCallback } from 'react';
import { useI18n } from '@/i18n/client';

// ── Types ────────────────────────────────────────────────────

export interface MasteryConcept {
  id: string;
  name: string;
  domain: string;
  masteryLevel: number; // 0-5
  confidence: number; // 0-1
  prerequisiteIds: string[];
  description?: string;
  nextReviewAt?: string | null;
  linkedLessons?: Array<{ id: string; title: string }>;
  totalAttempts?: number;
  totalCorrect?: number;
  reviewCount?: number;
  lastTestedAt?: string | null;
}

interface MasteryGraphProps {
  concepts: MasteryConcept[];
}

// ── Color + Status Config ────────────────────────────────────

type StatusKey = 'mastered' | 'learning' | 'notStarted' | 'locked';

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
}

const STATUS_MAP: Record<StatusKey, StatusConfig> = {
  mastered: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-800 dark:text-green-300',
    dot: 'bg-green-500',
    label: 'learn.masteryGraph.mastered',
  },
  learning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-300',
    dot: 'bg-yellow-500',
    label: 'learn.masteryGraph.learning',
  },
  notStarted: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-300',
    dot: 'bg-red-500',
    label: 'learn.masteryGraph.notStarted',
  },
  locked: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-400 dark:text-gray-500',
    dot: 'bg-gray-300 dark:bg-gray-600',
    label: 'learn.masteryGraph.locked',
  },
};

const DOMAIN_LABELS: Record<string, string> = {
  iard: 'IARD',
  vie: 'Assurance vie',
  ethique: 'Ethique',
  conformite: 'Conformite',
  collectif: 'Collectif',
  ldpsf: 'LDPSF',
  'conformite-amf': 'Conformite AMF',
};

function getConceptStatus(concept: MasteryConcept, masteredIds: Set<string>): StatusKey {
  // Check if all prerequisites are mastered
  const prereqsMet = concept.prerequisiteIds.every(id => masteredIds.has(id));
  if (!prereqsMet) return 'locked';
  if (concept.masteryLevel >= 4) return 'mastered';
  if (concept.masteryLevel >= 2) return 'learning';
  return 'notStarted';
}

// ── Component ────────────────────────────────────────────────

export default function MasteryGraph({ concepts }: MasteryGraphProps) {
  const { t, formatDate } = useI18n();
  const [selectedConcept, setSelectedConcept] = useState<MasteryConcept | null>(null);

  // Set of mastered concept ids for prerequisite checking
  const masteredIds = useMemo(
    () => new Set(concepts.filter(c => c.masteryLevel >= 4).map(c => c.id)),
    [concepts]
  );

  // Group by domain
  const grouped = useMemo(() => {
    const groups: Record<string, MasteryConcept[]> = {};
    for (const concept of concepts) {
      const d = concept.domain;
      if (!groups[d]) groups[d] = [];
      groups[d].push(concept);
    }
    // Sort within each group by mastery level descending
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.masteryLevel - a.masteryLevel);
    }
    return groups;
  }, [concepts]);

  const handleSelect = useCallback((concept: MasteryConcept) => {
    setSelectedConcept(concept);
  }, []);

  if (concepts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">{t('learn.masteryGraph.noConcepts')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6" role="legend" aria-label={t('learn.masteryGraph.legend')}>
        {(Object.entries(STATUS_MAP) as [StatusKey, StatusConfig][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${cfg.dot}`} aria-hidden="true" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{t(cfg.label)}</span>
          </div>
        ))}
      </div>

      {/* Domain Groups */}
      {Object.entries(grouped).map(([domain, domainConcepts]) => (
        <div key={domain} className="mb-8">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            {DOMAIN_LABELS[domain] ?? domain}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {domainConcepts.map(concept => {
              const status = getConceptStatus(concept, masteredIds);
              const cfg = STATUS_MAP[status];

              return (
                <button
                  key={concept.id}
                  onClick={() => handleSelect(concept)}
                  disabled={status === 'locked'}
                  className={`p-3 rounded-xl border-2 text-start transition-all ${cfg.bg} ${cfg.border} ${
                    status === 'locked'
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:shadow-md hover:scale-[1.02] cursor-pointer'
                  }`}
                  aria-label={`${concept.name} - ${t(cfg.label)}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-sm font-medium ${cfg.text} truncate`}>
                      {concept.name}
                    </p>
                    {status === 'locked' && (
                      <svg className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                  </div>

                  {/* Confidence bar */}
                  <div className="mt-2 w-full bg-white/50 dark:bg-gray-900/30 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        status === 'mastered' ? 'bg-green-500' :
                        status === 'learning' ? 'bg-yellow-500' :
                        status === 'notStarted' ? 'bg-red-400' : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(100, concept.confidence * 100)}%` }}
                    />
                  </div>

                  <p className={`text-xs mt-1 ${cfg.text} opacity-70`}>
                    {t('learn.masteryGraph.levelShort', { level: String(concept.masteryLevel), max: '5' })}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Detail Popup */}
      {selectedConcept && (
        <ConceptDetailPopup
          concept={selectedConcept}
          status={getConceptStatus(selectedConcept, masteredIds)}
          onClose={() => setSelectedConcept(null)}
          t={t}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ── Detail Popup ─────────────────────────────────────────────

function ConceptDetailPopup({
  concept,
  status,
  onClose,
  t,
  formatDate,
}: {
  concept: MasteryConcept;
  status: StatusKey;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string) => string;
}) {
  const cfg = STATUS_MAP[status];

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={concept.name}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{concept.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {DOMAIN_LABELS[concept.domain] ?? concept.domain}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('common.close')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          {concept.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{concept.description}</p>
          )}

          {/* Status badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot} mr-2`} />
            {t(cfg.label)}
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <DetailRow
              label={t('learn.mastery.level')}
              value={`${concept.masteryLevel} / 5`}
            />
            <DetailRow
              label={t('learn.mastery.confidence')}
              value={`${Math.round(concept.confidence * 100)}%`}
            />
            {concept.reviewCount !== undefined && (
              <DetailRow
                label={t('learn.mastery.reviewCount')}
                value={String(concept.reviewCount)}
              />
            )}
            {concept.totalAttempts !== undefined && concept.totalAttempts > 0 && (
              <DetailRow
                label={t('learn.mastery.accuracy')}
                value={`${Math.round(((concept.totalCorrect ?? 0) / concept.totalAttempts) * 100)}%`}
              />
            )}
            {concept.lastTestedAt && (
              <DetailRow
                label={t('learn.mastery.lastTested')}
                value={formatDate(concept.lastTestedAt)}
              />
            )}
            {concept.nextReviewAt && (
              <DetailRow
                label={t('learn.mastery.nextReview')}
                value={formatDate(concept.nextReviewAt)}
              />
            )}
          </div>

          {/* Linked Lessons */}
          {concept.linkedLessons && concept.linkedLessons.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('learn.masteryGraph.linkedLessons')}
              </h3>
              <ul className="space-y-1.5">
                {concept.linkedLessons.map(lesson => (
                  <li key={lesson.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="truncate">{lesson.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites info */}
          {concept.prerequisiteIds.length > 0 && (
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              {t('learn.masteryGraph.prerequisiteCount', { count: concept.prerequisiteIds.length })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
