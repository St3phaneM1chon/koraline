'use client';

/**
 * ADMIN — Automatic Translation Dashboard (G30)
 *
 * Features:
 * - Translate text on-the-fly (DeepL or GPT-4o-mini)
 * - Bulk translate products/pages/blog posts
 * - Translation history and coverage
 * - API key configuration info
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Languages,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Play,
  BarChart3,
  Settings,
  Zap,
  Globe,
  Copy,
  ArrowRight,
  Package,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ── Types ─────────────────────────────────────────────────────

interface ModelCoverage {
  totalEntities: number;
  fullyTranslated: number;
  partiallyTranslated: number;
  untranslated: number;
  coveragePercent: number;
}

interface TranslationResult {
  translated: string;
  engine: string;
  sourceLang: string;
  targetLang: string;
}

// ── Constants ─────────────────────────────────────────────────

const MODELS = [
  { key: 'Product', icon: Package, label: 'Products' },
  { key: 'Category', icon: Globe, label: 'Categories' },
  { key: 'Article', icon: FileText, label: 'Articles' },
  { key: 'BlogPost', icon: BookOpen, label: 'Blog Posts' },
  { key: 'Video', icon: Play, label: 'Videos' },
  { key: 'Faq', icon: FileText, label: 'FAQ' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ta', name: 'Tamil' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ht', name: 'Haitian Creole' },
];

export default function AutoTranslationPage() {
  const { t } = useI18n();

  // ── State ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'instant' | 'bulk' | 'coverage'>('instant');

  // Instant translation
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('fr');
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [engine, setEngine] = useState('');

  // Bulk translation
  const [selectedModel, setSelectedModel] = useState('Product');
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ queued: number } | null>(null);

  // Coverage
  const [coverage, setCoverage] = useState<Record<string, ModelCoverage>>({});
  const [loadingCoverage, setLoadingCoverage] = useState(true);

  // ── Load coverage ─────────────────────────────────────────

  const fetchCoverage = useCallback(async () => {
    setLoadingCoverage(true);
    try {
      const res = await fetch('/api/admin/translations/status', { headers: addCSRFHeader({}) });
      if (res.ok) {
        const data = await res.json();
        setCoverage(data.coverage || {});
      }
    } catch (err) {
      console.error('Error fetching coverage:', err);
    } finally {
      setLoadingCoverage(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  // ── Instant translate ─────────────────────────────────────

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error(t('admin.autoTranslate.enterText'));
      return;
    }
    setTranslating(true);
    setTranslatedText('');
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader({}) },
        body: JSON.stringify({ text: sourceText, sourceLang, targetLang }),
      });
      if (res.ok) {
        const data: TranslationResult = await res.json();
        setTranslatedText(data.translated);
        setEngine(data.engine);
      } else {
        toast.error(t('admin.autoTranslate.translationFailed'));
      }
    } catch {
      toast.error(t('admin.autoTranslate.translationFailed'));
    } finally {
      setTranslating(false);
    }
  };

  // ── Bulk translate ────────────────────────────────────────

  const handleBulkTranslate = async () => {
    setBulkTranslating(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader({}) },
        body: JSON.stringify({ model: selectedModel, all: true, force: false }),
      });
      if (res.ok) {
        const data = await res.json();
        setBulkResult({ queued: data.queued });
        toast.success(`${data.queued} ${selectedModel}(s) ${t('admin.autoTranslate.queued')}`);
      } else {
        toast.error(t('admin.autoTranslate.bulkFailed'));
      }
    } catch {
      toast.error(t('admin.autoTranslate.bulkFailed'));
    } finally {
      setBulkTranslating(false);
    }
  };

  const copyTranslation = () => {
    navigator.clipboard.writeText(translatedText);
    toast.success(t('admin.autoTranslate.copied'));
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin.autoTranslate.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('admin.autoTranslate.subtitle')}
        </p>
      </div>

      {/* Engine info */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          {t('admin.autoTranslate.engineInfo')}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'instant' as const, label: t('admin.autoTranslate.instantTab'), icon: Languages },
          { key: 'bulk' as const, label: t('admin.autoTranslate.bulkTab'), icon: RefreshCw },
          { key: 'coverage' as const, label: t('admin.autoTranslate.coverageTab'), icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Instant Translation */}
      {activeTab === 'instant' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.autoTranslate.instantTitle')}
          </h2>

          {/* Language selectors */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('admin.autoTranslate.from')}
              </label>
              <select
                value={sourceLang}
                onChange={e => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 mt-5" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('admin.autoTranslate.to')}
              </label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Text areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <textarea
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                placeholder={t('admin.autoTranslate.enterTextPlaceholder')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              />
            </div>
            <div className="relative">
              <textarea
                value={translatedText}
                readOnly
                placeholder={t('admin.autoTranslate.translationWillAppear')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              />
              {translatedText && (
                <button
                  onClick={copyTranslation}
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                  title={t('admin.autoTranslate.copy')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Translate button + engine info */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleTranslate}
              disabled={translating || !sourceText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              {t('admin.autoTranslate.translate')}
            </button>
            {engine && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Settings className="w-3 h-3" />
                {t('admin.autoTranslate.engine')}: {engine === 'deepl' ? 'DeepL' : 'GPT-4o-mini'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bulk Translation */}
      {activeTab === 'bulk' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('admin.autoTranslate.bulkTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('admin.autoTranslate.bulkDescription')}
          </p>

          {/* Model selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {MODELS.map(m => {
              const cov = coverage[m.key];
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedModel(m.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedModel === m.key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <m.icon className={`w-5 h-5 ${selectedModel === m.key ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{m.label}</span>
                  </div>
                  {cov && (
                    <div className="text-xs text-gray-500">
                      {cov.totalEntities} {t('admin.autoTranslate.total')} | {cov.coveragePercent}% {t('admin.autoTranslate.covered')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Translate button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBulkTranslate}
              disabled={bulkTranslating}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {bulkTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {t('admin.autoTranslate.translateAll')} {selectedModel}
            </button>
            {bulkResult && (
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {bulkResult.queued} {t('admin.autoTranslate.queued')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Coverage tab */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.autoTranslate.coverageTitle')}
            </h2>
            <button
              onClick={fetchCoverage}
              disabled={loadingCoverage}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCoverage ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </button>
          </div>

          {loadingCoverage ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODELS.map(m => {
                const cov = coverage[m.key];
                if (!cov) return null;
                const percent = cov.coveragePercent;
                return (
                  <div
                    key={m.key}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <m.icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{m.label}</h3>
                        <p className="text-xs text-gray-500">{cov.totalEntities} {t('admin.autoTranslate.total')}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-green-600">{cov.fullyTranslated}</div>
                        <div className="text-xs text-gray-500">{t('admin.autoTranslate.complete')}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-amber-600">{cov.partiallyTranslated}</div>
                        <div className="text-xs text-gray-500">{t('admin.autoTranslate.partial')}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-red-500">{cov.untranslated}</div>
                        <div className="text-xs text-gray-500">{t('admin.autoTranslate.untranslated')}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
