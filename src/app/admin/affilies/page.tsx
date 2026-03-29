'use client';

/**
 * Admin Affiliate Marketing Page
 * Extends the ambassador module with trackable affiliate links.
 * Provides link management, click/conversion tracking, and revenue stats.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Link2, Plus, Copy, ExternalLink, TrendingUp, MousePointerClick,
  DollarSign, ToggleLeft, ToggleRight, Trash2, Search, Users,
} from 'lucide-react';
import { Button } from '@/components/admin/Button';
import { StatCard } from '@/components/admin/StatCard';
import { Modal } from '@/components/admin/Modal';
import { FormField, Input } from '@/components/admin/FormField';
import { EmptyState } from '@/components/admin/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';
import { fetchWithRetry } from '@/lib/fetch-with-retry';

// ── Types ─────────────────────────────────────────────────────

interface AffiliateLink {
  id: string;
  userId: string;
  code: string;
  url: string | null;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
}

// ── Main Component ────────────────────────────────────────────

export default function AffiliesPage() {
  const { t, formatCurrency } = useI18n();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    linkId: string;
    code: string;
  }>({ isOpen: false, linkId: '', code: '' });

  // Ambassador users for selection
  const [ambassadorUsers, setAmbassadorUsers] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    referralCode: string;
  }>>([]);

  // ─── Data Fetching ──────────────────────────────────────────

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchValue) params.set('search', searchValue);
      const res = await fetchWithRetry(`/api/admin/affiliate?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
        setStats(data.stats || { totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalCommission: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch affiliate links', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [searchValue, t]);

  const fetchAmbassadors = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/admin/ambassadors?limit=100');
      if (res.ok) {
        const data = await res.json();
        setAmbassadorUsers(
          (data.ambassadors || data.data || []).map((a: Record<string, unknown>) => ({
            id: a.id,
            userId: a.userId,
            userName: a.userName || a.name,
            userEmail: a.userEmail || a.email,
            referralCode: a.referralCode,
          }))
        );
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);
  useEffect(() => { fetchAmbassadors(); }, [fetchAmbassadors]);

  // ─── Actions ────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newCode || !newUserId) {
      toast.error(t('admin.affiliate.codeRequired'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/affiliate', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userId: newUserId,
          code: newCode,
          url: newUrl || null,
        }),
      });
      if (res.ok) {
        toast.success(t('admin.affiliate.created'));
        setShowCreateModal(false);
        setNewCode('');
        setNewUrl('');
        setNewUserId('');
        fetchLinks();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (link: AffiliateLink) => {
    try {
      const res = await fetch('/api/admin/affiliate', {
        method: 'PATCH',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: link.id, isActive: !link.isActive }),
      });
      if (res.ok) {
        setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
        toast.success(link.isActive ? t('admin.affiliate.deactivated') : t('admin.affiliate.activated'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate?id=${linkId}`, {
        method: 'DELETE',
        headers: addCSRFHeader({}),
      });
      if (res.ok) {
        setLinks(prev => prev.filter(l => l.id !== linkId));
        toast.success(t('admin.affiliate.deleted'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setConfirmDelete({ isOpen: false, linkId: '', code: '' });
  };

  const copyLink = (code: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${baseUrl}/api/affiliate/track?code=${code}`);
    toast.success(t('admin.affiliate.copied'));
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.affiliate.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('admin.affiliate.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
          {t('admin.affiliate.createLink')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('admin.affiliate.totalClicks')}
          value={stats.totalClicks.toLocaleString()}
          icon={MousePointerClick}
        />
        <StatCard
          label={t('admin.affiliate.totalConversions')}
          value={stats.totalConversions.toLocaleString()}
          icon={TrendingUp}
        />
        <StatCard
          label={t('admin.affiliate.totalRevenue')}
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          label={t('admin.affiliate.totalCommission')}
          value={formatCurrency(stats.totalCommission)}
          icon={DollarSign}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={t('admin.affiliate.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Links Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={Link2}
          title={t('admin.affiliate.emptyTitle')}
          description={t('admin.affiliate.emptyDescription')}
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.affiliate.colAffiliate')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.affiliate.colCode')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.affiliate.colClicks')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.affiliate.colConversions')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.affiliate.colRevenue')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('admin.affiliate.colCommission')}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('common.status')}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{link.user.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{link.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">
                          {link.code}
                        </code>
                        <button
                          onClick={() => copyLink(link.code)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title={t('admin.affiliate.copyLink')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {link.url && (
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                          <ExternalLink className="w-3 h-3" />
                          {link.url.substring(0, 40)}...
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {link.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {link.conversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {formatCurrency(Number(link.revenue))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">
                      {formatCurrency(Number(link.commission))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(link)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          link.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {link.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {link.isActive ? t('common.active') : t('common.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setConfirmDelete({ isOpen: true, linkId: link.id, code: link.code })}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('admin.affiliate.createLink')}
      >
        <div className="space-y-4">
          <FormField label={t('admin.affiliate.selectAmbassador')}>
            <select
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">{t('admin.affiliate.selectAmbassadorPlaceholder')}</option>
              {ambassadorUsers.map((a) => (
                <option key={a.userId || a.id} value={a.userId || a.id}>
                  {a.userName} ({a.userEmail})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('admin.affiliate.referralCode')}>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              placeholder="PARTNER2026"
            />
          </FormField>
          <FormField label={t('admin.affiliate.destinationUrl')}>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://attitudes.vip/shop"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title={t('admin.affiliate.deleteTitle')}
        message={t('admin.affiliate.deleteMessage', { code: confirmDelete.code })}
        variant="danger"
        onConfirm={() => handleDelete(confirmDelete.linkId)}
        onCancel={() => setConfirmDelete({ isOpen: false, linkId: '', code: '' })}
      />
    </div>
  );
}
