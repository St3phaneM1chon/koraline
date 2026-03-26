'use client';

/**
 * #20 Competency-Based Progression
 * Replace % completion with "X of Y skills mastered" display.
 */

import { useTranslations } from '@/hooks/useTranslations';

export interface Skill {
  id: string;
  name: string;
  mastered: boolean;
  score: number; // 0-100
  requiredScore: number; // threshold for mastery
}

export interface CompetencyProgressProps {
  skills: Skill[];
  showDetails?: boolean;
  compact?: boolean;
}

export default function CompetencyProgress({
  skills,
  showDetails = false,
  compact = false,
}: CompetencyProgressProps) {
  const { t } = useTranslations();
  const mastered = skills.filter(s => s.mastered).length;
  const total = skills.length;
  const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`w-2 h-4 rounded-sm ${
                skill.mastered ? 'bg-green-500' : 'bg-gray-200'
              }`}
              title={`${skill.name}: ${skill.mastered ? 'Mastered' : `${skill.score}%`}`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-gray-600">
          {mastered}/{total}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {mastered} <span className="text-base font-normal text-gray-500">/ {total}</span>
          </p>
          <p className="text-sm text-gray-500">
            {t('lms.skillsMastered') || 'skills mastered'}
          </p>
        </div>

        {/* Circular progress */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Skill details */}
      {showDetails && (
        <div className="space-y-2">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                skill.mastered
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {skill.mastered ? '✓' : '○'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${skill.mastered ? 'text-gray-900' : 'text-gray-600'}`}>
                  {skill.name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      skill.mastered ? 'bg-green-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, skill.score)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{skill.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
