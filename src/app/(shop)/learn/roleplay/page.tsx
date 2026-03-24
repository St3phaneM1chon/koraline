'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';

interface ScenarioCompletion {
  score: number | null;
  passed: boolean;
}

interface Scenario {
  id: string;
  title: string;
  description: string | null;
  domain: string;
  difficulty: string;
  clientName: string;
  clientPersonality: string;
  bloomLevel: number;
  passingScore: number;
  maxMinutes: number;
  conceptsTested: string[];
  completion: ScenarioCompletion | null;
}

const DOMAIN_LABELS: Record<string, { fr: string; en: string; icon: string }> = {
  iard: { fr: 'IARD', en: 'P&C', icon: '🏠' },
  vie: { fr: 'Assurance vie', en: 'Life Insurance', icon: '💚' },
  ethique: { fr: 'Ethique', en: 'Ethics', icon: '⚖️' },
  conformite: { fr: 'Conformite', en: 'Compliance', icon: '📋' },
  collectif: { fr: 'Collectif', en: 'Group', icon: '👥' },
};

const DIFFICULTY_ORDER = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const PERSONALITY_BADGES: Record<string, { color: string }> = {
  ANXIOUS: { color: 'bg-yellow-100 text-yellow-800' },
  DEMANDING: { color: 'bg-red-100 text-red-800' },
  CONFUSED: { color: 'bg-blue-100 text-blue-800' },
  ANGRY: { color: 'bg-red-200 text-red-900' },
  FRIENDLY: { color: 'bg-green-100 text-green-800' },
};

export default function RolePlayCatalogPage() {
  const { t } = useI18n();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [starting, setStarting] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDomain !== 'all') params.set('domain', selectedDomain);
      if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);

      const res = await fetch(`/api/lms/roleplay?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setScenarios(data.scenarios ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedDomain, selectedDifficulty]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const startScenario = async (scenarioId: string) => {
    setStarting(scenarioId);
    try {
      const res = await fetch('/api/lms/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/learn/roleplay/${data.session.id}`;
      }
    } catch {
      // silent
    } finally {
      setStarting(null);
    }
  };

  // Group by domain
  const domains = [...new Set(scenarios.map(s => s.domain))].sort();

  const filteredScenarios = scenarios.sort((a, b) => {
    const aDiffIdx = DIFFICULTY_ORDER.indexOf(a.difficulty);
    const bDiffIdx = DIFFICULTY_ORDER.indexOf(b.difficulty);
    return aDiffIdx - bDiffIdx;
  });

  const groupedByDomain = domains.reduce((acc, domain) => {
    acc[domain] = filteredScenarios.filter(s => s.domain === domain);
    return acc;
  }, {} as Record<string, Scenario[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-[#143C78] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('learn.backToLearning')}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {t('learn.roleplay.title')}
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            {t('learn.roleplay.subtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('learn.roleplay.domain')}
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('learn.allArticles')}</option>
              {Object.entries(DOMAIN_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.fr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('learn.roleplay.difficulty')}
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('learn.allArticles')}</option>
              <option value="BEGINNER">{t('learn.roleplay.beginner')}</option>
              <option value="INTERMEDIATE">{t('learn.roleplay.intermediate')}</option>
              <option value="ADVANCED">{t('learn.roleplay.advanced')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">{t('learn.roleplay.noScenarios')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByDomain).map(([domain, domainScenarios]) => (
              <section key={domain}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>{DOMAIN_LABELS[domain]?.icon ?? '📚'}</span>
                  {DOMAIN_LABELS[domain]?.fr ?? domain}
                  <span className="text-sm font-normal text-gray-500">
                    ({domainScenarios.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {domainScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        {/* Status badge */}
                        <div className="flex items-center justify-between mb-3">
                          <DifficultyBadge difficulty={scenario.difficulty} t={t} />
                          {scenario.completion ? (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              scenario.completion.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {scenario.completion.passed ? t('learn.roleplay.passed') : t('learn.roleplay.attempted')}
                              {scenario.completion.score !== null && ` (${scenario.completion.score}%)`}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg mb-2">
                          {scenario.title}
                        </h3>

                        {scenario.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {scenario.description}
                          </p>
                        )}

                        {/* Client info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <span className="font-medium">{scenario.clientName}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            PERSONALITY_BADGES[scenario.clientPersonality]?.color ?? 'bg-gray-100 text-gray-600'
                          }`}>
                            {scenario.clientPersonality.toLowerCase()}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                          <span>{scenario.maxMinutes} {t('learn.roleplay.minutes')}</span>
                          <span>{t('learn.roleplay.passingScoreLabel')}: {scenario.passingScore}%</span>
                        </div>

                        {/* Start button */}
                        <button
                          onClick={() => startScenario(scenario.id)}
                          disabled={starting === scenario.id}
                          className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {starting === scenario.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              {t('common.loading')}
                            </span>
                          ) : (
                            t('learn.roleplay.startSimulation')
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty, t }: { difficulty: string; t: (key: string) => string }) {
  const config: Record<string, { color: string; key: string }> = {
    BEGINNER: { color: 'bg-green-100 text-green-800', key: 'learn.roleplay.beginner' },
    INTERMEDIATE: { color: 'bg-yellow-100 text-yellow-800', key: 'learn.roleplay.intermediate' },
    ADVANCED: { color: 'bg-red-100 text-red-800', key: 'learn.roleplay.advanced' },
  };
  const c = config[difficulty] ?? { color: 'bg-gray-100 text-gray-600', key: '' };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c.color}`}>
      {t(c.key) || difficulty.toLowerCase()}
    </span>
  );
}
