'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gauge, Monitor,
  AlertTriangle, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import { PageHeader, Button, StatCard, SectionCard } from '@/components/admin';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetricAgg {
  avg: number;
  p75: number;
  p95: number;
  count: number;
  good: number;
  poor: number;
}

interface PerformanceData {
  score: number;
  grade: string;
  metrics: Record<string, MetricAgg>;
  pageBreakdown: Array<{ page: string; avgValue: number; count: number }>;
  trend: Array<{ date: string; avgLcp: number }>;
  ratingDistribution: { good: number; needsImprovement: number; poor: number; total: number };
  period: { days: number; since: string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METRIC_INFO: Record<string, { label: string; unit: string; description: string }> = {
  LCP: { label: 'Largest Contentful Paint', unit: 'ms', description: 'Temps de chargement du plus grand element visible' },
  FID: { label: 'First Input Delay', unit: 'ms', description: 'Delai avant la premiere interaction' },
  CLS: { label: 'Cumulative Layout Shift', unit: '', description: 'Stabilite visuelle de la page' },
  TTFB: { label: 'Time to First Byte', unit: 'ms', description: 'Temps de reponse du serveur' },
  INP: { label: 'Interaction to Next Paint', unit: 'ms', description: 'Reactivite globale aux interactions' },
};

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A': return 'text-green-600 dark:text-green-400';
    case 'B': return 'text-blue-600 dark:text-blue-400';
    case 'C': return 'text-yellow-600 dark:text-yellow-400';
    case 'D': return 'text-orange-600 dark:text-orange-400';
    default: return 'text-red-600 dark:text-red-400';
  }
}

function getRatingIcon(rating: string) {
  switch (rating) {
    case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default: return <XCircle className="w-4 h-4 text-red-500" />;
  }
}

function getRatingFromAvg(metric: string, avg: number): string {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  const [good, poor] = thresholds[metric] || [0, 0];
  if (avg <= good) return 'good';
  if (avg <= poor) return 'needs-improvement';
  return 'poor';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/performance?days=${days}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Erreur de chargement des donnees de performance');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const hasData = data && data.ratingDistribution.total > 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Performance"
        subtitle="Core Web Vitals et metriques de performance en temps reel"
      />

      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {d}j
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {!hasData ? (
        <SectionCard title="Aucune donnee">
          <div className="text-center py-12 text-gray-500">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Aucune metrique collectee</p>
            <p className="text-sm">Les Core Web Vitals seront collectes automatiquement lorsque des visiteurs navigueront sur votre boutique.</p>
          </div>
        </SectionCard>
      ) : (
        <>
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-500 mb-2">Score Global</p>
              <p className={`text-6xl font-bold ${getGradeColor(data!.grade)}`}>{data!.score}</p>
              <p className={`text-2xl font-bold mt-1 ${getGradeColor(data!.grade)}`}>Grade {data!.grade}</p>
              <p className="text-xs text-gray-400 mt-2">{data!.ratingDistribution.total} mesures</p>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <StatCard
                label="Bonnes performances"
                value={`${data!.ratingDistribution.total > 0 ? Math.round((data!.ratingDistribution.good / data!.ratingDistribution.total) * 100) : 0}%`}
                icon={CheckCircle}
              />
              <StatCard
                label="A ameliorer"
                value={`${data!.ratingDistribution.total > 0 ? Math.round((data!.ratingDistribution.needsImprovement / data!.ratingDistribution.total) * 100) : 0}%`}
                icon={AlertTriangle}
              />
              <StatCard
                label="Mauvaises performances"
                value={`${data!.ratingDistribution.total > 0 ? Math.round((data!.ratingDistribution.poor / data!.ratingDistribution.total) * 100) : 0}%`}
                icon={XCircle}
              />
              <StatCard
                label="Mesures collectees"
                value={data!.ratingDistribution.total}
                icon={Gauge}
              />
            </div>
          </div>

          {/* Core Web Vitals */}
          <SectionCard title="Core Web Vitals">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(data!.metrics).map(([metric, agg]) => {
                const info = METRIC_INFO[metric];
                const rating = getRatingFromAvg(metric, agg.avg);
                return (
                  <div key={metric} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">{metric}</span>
                      {getRatingIcon(rating)}
                    </div>
                    <p className="text-2xl font-bold">{agg.avg}{info?.unit}</p>
                    <p className="text-xs text-gray-500 mt-1">{info?.label}</p>
                    <div className="mt-3 space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>P75</span>
                        <span className="font-mono">{agg.p75}{info?.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P95</span>
                        <span className="font-mono">{agg.p95}{info?.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mesures</span>
                        <span>{agg.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* LCP Trend */}
          {data!.trend.length > 0 && (
            <SectionCard title="Tendance LCP">
              <div className="h-48 flex items-end gap-1">
                {data!.trend.map((t, i) => {
                  const maxLcp = Math.max(...data!.trend.map((x) => x.avgLcp), 1);
                  const height = (t.avgLcp / maxLcp) * 100;
                  const color = t.avgLcp <= 2500 ? 'bg-green-500' : t.avgLcp <= 4000 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{t.avgLcp}ms</span>
                      <div className={`w-full ${color} rounded-t`} style={{ height: `${Math.max(height, 4)}%` }} />
                      <span className="text-xs text-gray-500 truncate w-full text-center">{t.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Slowest Pages */}
          {data!.pageBreakdown.length > 0 && (
            <SectionCard title="Pages les plus lentes">
              <div className="space-y-2">
                {data!.pageBreakdown.slice(0, 10).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-mono text-gray-500 w-6 text-right">{i + 1}.</span>
                      <span className="text-sm truncate">{p.page}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm text-gray-500">{p.count} mesures</span>
                      <span className={`text-sm font-bold ${p.avgValue <= 2500 ? 'text-green-600' : p.avgValue <= 4000 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(p.avgValue)}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Recommendations */}
          <SectionCard title="Recommandations">
            <div className="space-y-3">
              {data!.metrics.LCP?.avg > 2500 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">LCP eleve ({Math.round(data!.metrics.LCP.avg)}ms)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Optimisez les images (WebP, lazy loading), reduisez le CSS bloquant, et utilisez un CDN.</p>
                  </div>
                </div>
              )}
              {data!.metrics.CLS?.avg > 0.1 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">CLS eleve ({data!.metrics.CLS.avg})</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ajoutez des dimensions explicites aux images/videos, evitez l&apos;injection dynamique de contenu au-dessus du fold.</p>
                  </div>
                </div>
              )}
              {data!.metrics.TTFB?.avg > 800 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">TTFB eleve ({Math.round(data!.metrics.TTFB.avg)}ms)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Verifiez la latence serveur, activez le cache HTTP, optimisez les queries de base de donnees.</p>
                  </div>
                </div>
              )}
              {data!.score >= 90 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Excellentes performances!</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Votre site offre une experience rapide et fluide. Continuez a surveiller les metriques.</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
