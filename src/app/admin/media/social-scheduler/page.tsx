'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Send, Clock, Instagram, Facebook, Twitter,
  Plus, Sparkles, Trash2, Loader2, ExternalLink, RefreshCw,
  ChevronLeft, ChevronRight, Eye, AlertCircle, Image as ImageIcon,
  Copy, XCircle, Smartphone,
} from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { fetchWithCSRF } from '@/lib/csrf';
import { toast } from 'sonner';
// Bridge #41: Media → Marketing
import { MediaMarketingBridgeCard } from '@/components/admin/bridges';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  imageUrl: string | null;
  scheduledAt: string;
  publishedAt: string | null;
  status: string;
  error: string | null;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: string;
}

type Platform = 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin';

// ---------------------------------------------------------------------------
// Platform config
// ---------------------------------------------------------------------------

const platformConfig: Record<Platform, {
  icon: typeof Instagram;
  color: string;
  label: string;
  maxChars: number;
}> = {
  instagram: { icon: Instagram, color: 'text-pink-600 bg-pink-100', label: 'Instagram', maxChars: 2200 },
  facebook: { icon: Facebook, color: 'text-indigo-600 bg-indigo-100', label: 'Facebook', maxChars: 63206 },
  twitter: { icon: Twitter, color: 'text-indigo-500 bg-indigo-100', label: 'X / Twitter', maxChars: 280 },
  tiktok: { icon: Send, color: 'text-slate-800 bg-slate-100', label: 'TikTok', maxChars: 2200 },
  linkedin: { icon: Send, color: 'text-indigo-700 bg-indigo-100', label: 'LinkedIn', maxChars: 3000 },
};

const PLATFORMS = Object.keys(platformConfig) as Platform[];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SocialSchedulerPage() {
  const { t, locale } = useI18n();

  // Data state
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ scheduled: 0, draft: 0, published: 0, failed: 0 });

  // Filter state
  const [filterPlatform, setFilterPlatform] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [newPost, setNewPost] = useState<{
    platform: Platform;
    content: string;
    imageUrl: string;
    scheduledAt: string;
    status: 'draft' | 'scheduled';
  }>({
    platform: 'instagram',
    content: '',
    imageUrl: '',
    scheduledAt: '',
    status: 'scheduled',
  });
  const [creating, setCreating] = useState(false);

  // Calendar view
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Bulk schedule state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkPosts, setBulkPosts] = useState<Array<{
    platform: Platform;
    content: string;
    imageUrl: string;
    scheduledAt: string;
  }>>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Preview state
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterPlatform) params.set('platform', filterPlatform);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/admin/social-posts?${params}`);
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load social posts:', err);
      toast.error(t('admin.media.socialScheduler.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, filterPlatform, filterStatus, t]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social-posts?limit=0');
      if (!res.ok) return;
      // Load all counts
      const counts = { scheduled: 0, draft: 0, published: 0, failed: 0 };
      for (const status of ['scheduled', 'draft', 'published', 'failed']) {
        const r = await fetch(`/api/admin/social-posts?status=${status}&limit=1`);
        if (r.ok) {
          const d = await r.json();
          counts[status as keyof typeof counts] = d.pagination?.total || 0;
        }
      }
      setStats(counts);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const createPost = async () => {
    if (!newPost.content || !newPost.scheduledAt) {
      toast.error(t('admin.media.socialScheduler.contentDateRequired'));
      return;
    }
    setCreating(true);
    try {
      const res = await fetchWithCSRF('/api/admin/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPost.platform,
          content: newPost.content,
          imageUrl: newPost.imageUrl || null,
          scheduledAt: new Date(newPost.scheduledAt).toISOString(),
          status: newPost.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create post');
      }
      toast.success(t('admin.media.socialScheduler.postScheduled'));
      setNewPost({ platform: 'instagram', content: '', imageUrl: '', scheduledAt: '', status: 'scheduled' });
      setShowComposer(false);
      loadPosts();
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.media.socialScheduler.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const deletePost = async (id: string) => {
    try {
      const res = await fetchWithCSRF(`/api/admin/social-posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(t('admin.media.socialScheduler.postDeleted'));
      loadPosts();
      loadStats();
    } catch {
      toast.error(t('admin.media.socialScheduler.deleteFailed'));
    }
  };

  const publishNow = async (id: string) => {
    try {
      const res = await fetchWithCSRF(`/api/admin/social-posts/${id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('admin.media.socialScheduler.postPublished'));
      } else {
        toast.error(data.error || t('admin.media.socialScheduler.publishFailed'));
      }
      loadPosts();
      loadStats();
    } catch {
      toast.error(t('admin.media.socialScheduler.publishFailed'));
    }
  };

  const generateCaption = () => {
    const captions = [
      '🧬 Produits de qualité supérieure, maintenant disponibles chez Attitudes VIP! Certificat d\'analyse inclus avec chaque commande. #quality #attitudesvip',
      '🔬 Vous cherchez des produits de recherche fiables? Notre laboratoire garantit une pureté de 98%+ sur chaque lot. Découvrez notre catalogue! #attitudesvip #science',
      '💎 Livraison gratuite sur les commandes de 150$+! Profitez de nos produits certifiés avec analyse HPLC. attitudes.vip #quality #attitudesvip',
    ];
    setNewPost(prev => ({ ...prev, content: captions[Math.floor(Math.random() * captions.length)] }));
    toast.success(t('admin.media.socialScheduler.aiCaptionGenerated'));
  };

  // -----------------------------------------------------------------------
  // Bulk schedule
  // -----------------------------------------------------------------------

  const addBulkRow = () => {
    setBulkPosts(prev => [...prev, { platform: 'instagram', content: '', imageUrl: '', scheduledAt: '' }]);
  };

  const removeBulkRow = (idx: number) => {
    setBulkPosts(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBulkRow = (idx: number, field: string, value: string) => {
    setBulkPosts(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const submitBulk = async () => {
    const valid = bulkPosts.filter(p => p.content && p.scheduledAt);
    if (valid.length === 0) {
      toast.error(t('admin.media.socialScheduler.contentDateRequired'));
      return;
    }
    setBulkSaving(true);
    let succeeded = 0;
    let failed = 0;
    for (const post of valid) {
      try {
        const res = await fetchWithCSRF('/api/admin/social-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: post.platform,
            content: post.content,
            imageUrl: post.imageUrl || null,
            scheduledAt: new Date(post.scheduledAt).toISOString(),
            status: 'scheduled',
          }),
        });
        if (res.ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkSaving(false);
    toast.success(`${succeeded} ${t('admin.media.socialScheduler.postScheduled')}${failed > 0 ? ` (${failed} ${t('admin.media.socialScheduler.statusFailed')})` : ''}`);
    setBulkPosts([]);
    setShowBulk(false);
    loadPosts();
    loadStats();
  };

  const cancelPost = async (id: string) => {
    try {
      const res = await fetchWithCSRF(`/api/admin/social-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Cancel failed');
      toast.success(t('admin.media.socialScheduler.postCancelled'));
      loadPosts();
      loadStats();
    } catch {
      toast.error(t('admin.media.socialScheduler.cancelFailed'));
    }
  };

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));

  const statusBadge = (s: string) => {
    switch (s) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-indigo-100 text-indigo-700';
      case 'publishing': return 'bg-amber-100 text-amber-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-200 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'published': return t('admin.media.socialScheduler.statusPublished');
      case 'scheduled': return t('admin.media.socialScheduler.statusScheduled');
      case 'publishing': return t('admin.media.socialScheduler.statusPublishing');
      case 'failed': return t('admin.media.socialScheduler.statusFailed');
      case 'cancelled': return t('admin.media.socialScheduler.statusCancelled');
      default: return t('admin.media.socialScheduler.statusDraft');
    }
  };

  // Calendar helpers
  const calendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const postsForDay = (day: number) => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    return posts.filter(p => {
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            {t('admin.media.socialScheduler.title')}
          </h1>
          <p className="text-slate-500">{t('admin.media.socialScheduler.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="flex items-center gap-2 px-3 py-2 border border-[var(--k-border-subtle)] rounded-lg text-sm text-slate-600 hover:bg-white/5"
          >
            {viewMode === 'list' ? <Calendar className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {viewMode === 'list'
              ? (t('admin.media.socialScheduler.calendarView'))
              : (t('admin.media.socialScheduler.listView'))}
          </button>
          <button
            onClick={() => { loadPosts(); loadStats(); }}
            className="p-2 border border-[var(--k-border-subtle)] rounded-lg text-slate-500 hover:bg-white/5"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowBulk(!showBulk); if (!showBulk && bulkPosts.length === 0) addBulkRow(); }}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--k-border-subtle)] text-slate-600 rounded-lg hover:bg-white/5 text-sm font-medium"
          >
            <Copy className="w-4 h-4" /> {t('admin.media.socialScheduler.bulkSchedule')}
          </button>
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> {t('admin.media.socialScheduler.newPost')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('admin.media.socialScheduler.statsScheduled'), count: stats.scheduled, color: 'text-indigo-600' },
          { label: t('admin.media.socialScheduler.statsDraft'), count: stats.draft, color: 'text-slate-600' },
          { label: t('admin.media.socialScheduler.statsPublished'), count: stats.published, color: 'text-green-600' },
          { label: t('admin.media.socialScheduler.statsFailed'), count: stats.failed, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bridge #41: Media → Marketing (Social posts + campaigns correlation) */}
      <MediaMarketingBridgeCard t={t} locale={locale} />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterPlatform}
          onChange={e => { setFilterPlatform(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[var(--k-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">{t('admin.media.socialScheduler.allPlatforms')}</option>
          {PLATFORMS.map(p => (
            <option key={p} value={p}>{platformConfig[p].label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[var(--k-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">{t('admin.media.socialScheduler.allStatuses')}</option>
          <option value="draft">{t('admin.media.socialScheduler.statusDraft')}</option>
          <option value="scheduled">{t('admin.media.socialScheduler.statusScheduled')}</option>
          <option value="published">{t('admin.media.socialScheduler.statusPublished')}</option>
          <option value="failed">{t('admin.media.socialScheduler.statusFailed')}</option>
          <option value="cancelled">{t('admin.media.socialScheduler.statusCancelled')}</option>
        </select>
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t('admin.media.socialScheduler.composer')}</h3>
          <div className="space-y-4">
            {/* Platform selector */}
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(key => {
                const cfg = platformConfig[key];
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setNewPost(prev => ({ ...prev, platform: key }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      newPost.platform === key ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-[var(--k-border-subtle)] text-slate-500 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="relative">
              <textarea
                value={newPost.content}
                onChange={e => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('admin.media.socialScheduler.writePlaceholder')}
                rows={4}
                maxLength={platformConfig[newPost.platform].maxChars}
                className="w-full px-4 py-3 border border-[var(--k-border-subtle)] rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm resize-none"
              />
              <div className="absolute bottom-2 end-2 text-xs text-slate-400">
                {newPost.content.length}/{platformConfig[newPost.platform].maxChars}
              </div>
            </div>

            {/* Image URL */}
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={newPost.imageUrl}
                onChange={e => setNewPost(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder={t('admin.media.socialScheduler.imageUrlPlaceholder')}
                className="flex-1 px-3 py-2 border border-[var(--k-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Schedule + actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="datetime-local"
                value={newPost.scheduledAt}
                onChange={e => setNewPost(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="px-3 py-2 border border-[var(--k-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
              />
              <select
                value={newPost.status}
                onChange={e => setNewPost(prev => ({ ...prev, status: e.target.value as 'draft' | 'scheduled' }))}
                className="px-3 py-2 border border-[var(--k-border-subtle)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
              >
                <option value="scheduled">{t('admin.media.socialScheduler.statusScheduled')}</option>
                <option value="draft">{t('admin.media.socialScheduler.statusDraft')}</option>
              </select>
              <button onClick={generateCaption} className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium">
                <Sparkles className="w-4 h-4" /> {t('admin.media.socialScheduler.aiCaption')}
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowComposer(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                {t('admin.media.socialScheduler.cancel')}
              </button>
              <button
                onClick={createPost}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                {t('admin.media.socialScheduler.schedule')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Schedule */}
      {showBulk && (
        <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t('admin.media.socialScheduler.bulkSchedule')}</h3>
          <div className="space-y-3">
            {bulkPosts.map((row, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-slate-100">
                <select
                  value={row.platform}
                  onChange={e => updateBulkRow(idx, 'platform', e.target.value)}
                  className="px-2 py-1.5 border border-[var(--k-border-subtle)] rounded text-sm"
                >
                  {PLATFORMS.map(p => (
                    <option key={p} value={p}>{platformConfig[p].label}</option>
                  ))}
                </select>
                <textarea
                  value={row.content}
                  onChange={e => updateBulkRow(idx, 'content', e.target.value)}
                  placeholder={t('admin.media.socialScheduler.writePlaceholder')}
                  rows={2}
                  className="flex-1 px-3 py-1.5 border border-[var(--k-border-subtle)] rounded text-sm resize-none"
                />
                <input
                  type="datetime-local"
                  value={row.scheduledAt}
                  onChange={e => updateBulkRow(idx, 'scheduledAt', e.target.value)}
                  className="px-2 py-1.5 border border-[var(--k-border-subtle)] rounded text-sm"
                />
                <button onClick={() => removeBulkRow(idx)} className="p-1.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <button onClick={addBulkRow} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              <Plus className="w-4 h-4" /> {t('admin.media.socialScheduler.addRow')}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowBulk(false); setBulkPosts([]); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                {t('admin.media.socialScheduler.cancel')}
              </button>
              <button
                onClick={submitBulk}
                disabled={bulkSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {t('admin.media.socialScheduler.scheduleBulk')} ({bulkPosts.filter(p => p.content && p.scheduledAt).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreviewPost(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-800">
                  {t('admin.media.socialScheduler.preview')} - {platformConfig[previewPost.platform as Platform]?.label || previewPost.platform}
                </span>
              </div>
              <button onClick={() => setPreviewPost(null)} className="p-1 hover:bg-slate-100 rounded">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              {/* Platform-specific preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${platformConfig[previewPost.platform as Platform]?.color || 'bg-slate-100'}`}>
                    {(() => {
                      const cfg = platformConfig[previewPost.platform as Platform];
                      const Icon = cfg?.icon || Send;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Attitudes VIP</div>
                    <div className="text-xs text-slate-400">{formatDate(previewPost.scheduledAt)}</div>
                  </div>
                </div>
                {/* Image */}
                {previewPost.imageUrl && (
                  <div className="w-full aspect-square bg-slate-100 flex items-center justify-center">
                    <img
                      src={previewPost.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                {/* Content */}
                <div className="p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {previewPost.platform === 'twitter'
                      ? previewPost.content.slice(0, 280)
                      : previewPost.content}
                  </p>
                  {previewPost.platform === 'twitter' && previewPost.content.length > 280 && (
                    <span className="text-xs text-red-500">{t('admin.media.socialScheduler.truncated')}</span>
                  )}
                </div>
                {/* Footer */}
                <div className="px-3 pb-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>{platformConfig[previewPost.platform as Platform]?.maxChars || '?'} {t('admin.media.socialScheduler.charLimit')}</span>
                  <span>{previewPost.content.length} {t('admin.media.socialScheduler.charsUsed')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-slate-700">
              {calendarMonth.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
              <div key={d} className="text-xs text-center text-slate-400 font-medium py-2">{d}</div>
            ))}
            {calendarDays().map((day, i) => (
              <div key={i} className={`min-h-[60px] border border-slate-100 rounded p-1 text-xs ${day ? 'bg-[var(--k-glass-thin)]' : 'bg-white/5'}`}>
                {day && (
                  <>
                    <div className="font-medium text-slate-600 mb-0.5">{day}</div>
                    {postsForDay(day).slice(0, 3).map(p => {
                      const cfg = platformConfig[p.platform as Platform] || platformConfig.twitter;
                      return (
                        <div key={p.id} className={`rounded px-1 py-0.5 text-[10px] truncate mb-0.5 ${cfg.color}`}>
                          {cfg.label.slice(0, 3)}
                        </div>
                      );
                    })}
                    {postsForDay(day).length > 3 && (
                      <div className="text-[10px] text-slate-400">+{postsForDay(day).length - 3}</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts List */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-8 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">{t('admin.media.socialScheduler.noPosts')}</p>
            </div>
          ) : (
            posts.map(post => {
              const cfg = platformConfig[post.platform as Platform] || platformConfig.twitter;
              const Icon = cfg.icon;
              return (
                <div key={post.id} className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(post.status)}`}>
                        {statusLabel(post.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                    {post.imageUrl && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600">
                        <ImageIcon className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{post.imageUrl}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(post.scheduledAt)}
                      </div>
                      {post.externalUrl && (
                        <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                          <ExternalLink className="w-3 h-3" />
                          {t('admin.media.socialScheduler.viewExternal')}
                        </a>
                      )}
                    </div>
                    {post.error && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        {post.error}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setPreviewPost(post)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title={t('admin.media.socialScheduler.preview')}>
                      <Eye className="w-4 h-4" />
                    </button>
                    {['draft', 'scheduled', 'failed'].includes(post.status) && (
                      <button onClick={() => publishNow(post.id)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title={t('admin.media.socialScheduler.publishNow')}>
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {['scheduled', 'draft'].includes(post.status) && (
                      <button onClick={() => cancelPost(post.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title={t('admin.media.socialScheduler.cancelPost')}>
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deletePost(post.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title={t('admin.media.socialScheduler.deletePost')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-[var(--k-border-subtle)] rounded-lg disabled:opacity-50 hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-[var(--k-border-subtle)] rounded-lg disabled:opacity-50 hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
