'use client';

/**
 * #18 Bloom Taxonomy Visualization
 * Show cognitive levels mastered per domain.
 * Bloom's taxonomy: Remember → Understand → Apply → Analyze → Evaluate → Create
 */

import { useTranslations } from '@/hooks/useTranslations';

export interface BloomLevel {
  level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  label: string;
  mastered: number; // 0-100 percentage
  total: number;    // total items at this level
  completed: number; // items mastered
}

export interface BloomTaxonomyProps {
  domain: string;
  levels: BloomLevel[];
  compact?: boolean;
}

const BLOOM_COLORS: Record<string, { bg: string; fill: string; text: string }> = {
  remember:    { bg: 'bg-blue-100',   fill: 'bg-blue-500',   text: 'text-blue-700' },
  understand:  { bg: 'bg-cyan-100',   fill: 'bg-cyan-500',   text: 'text-cyan-700' },
  apply:       { bg: 'bg-green-100',  fill: 'bg-green-500',  text: 'text-green-700' },
  analyze:     { bg: 'bg-amber-100',  fill: 'bg-amber-500',  text: 'text-amber-700' },
  evaluate:    { bg: 'bg-orange-100', fill: 'bg-orange-500', text: 'text-orange-700' },
  create:      { bg: 'bg-red-100',    fill: 'bg-red-500',    text: 'text-red-700' },
};

const BLOOM_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

export default function BloomTaxonomy({ domain, levels, compact = false }: BloomTaxonomyProps) {
  const { t } = useTranslations();

  // Sort levels by Bloom's hierarchy
  const sortedLevels = [...levels].sort(
    (a, b) => BLOOM_ORDER.indexOf(a.level) - BLOOM_ORDER.indexOf(b.level)
  );

  const overallMastery = levels.length > 0
    ? Math.round(levels.reduce((s, l) => s + l.mastered, 0) / levels.length)
    : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1" title={`${domain}: ${overallMastery}% mastered`}>
        {sortedLevels.map((level) => {
          const colors = BLOOM_COLORS[level.level];
          return (
            <div
              key={level.level}
              className={`w-6 h-4 rounded-sm ${level.mastered >= 70 ? colors.fill : colors.bg} transition-colors`}
              title={`${level.label}: ${level.mastered}%`}
              aria-label={`${level.label}: ${level.mastered}% mastered`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{domain}</h4>
        <span className="text-xs font-medium text-gray-500">
          {overallMastery}% {t('lms.mastered') || 'mastered'}
        </span>
      </div>

      {/* Pyramid visualization */}
      <div className="space-y-1">
        {[...sortedLevels].reverse().map((level, index) => {
          const colors = BLOOM_COLORS[level.level];
          const widthPercent = 40 + (index * 10); // Pyramid widens at base

          return (
            <div
              key={level.level}
              className="flex items-center gap-3"
            >
              {/* Level name */}
              <span className={`text-xs font-medium w-20 text-right ${colors.text}`}>
                {level.label}
              </span>

              {/* Progress bar */}
              <div className="flex-1" style={{ maxWidth: `${widthPercent}%` }}>
                <div className={`h-6 rounded-md ${colors.bg} relative overflow-hidden`}>
                  <div
                    className={`h-full ${colors.fill} rounded-md transition-all duration-500`}
                    style={{ width: `${level.mastered}%` }}
                    role="progressbar"
                    aria-valuenow={level.mastered}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${level.label}: ${level.mastered}%`}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                    {level.completed}/{level.total}
                  </span>
                </div>
              </div>

              {/* Percentage */}
              <span className="text-xs font-medium text-gray-600 w-10 text-right">
                {level.mastered}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
