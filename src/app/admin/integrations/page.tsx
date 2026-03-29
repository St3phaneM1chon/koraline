'use client';

/**
 * G27 — Zapier/Make Webhook Integrations Admin Page
 *
 * Features:
 *   - List configured webhooks with delivery stats
 *   - Add/edit webhook (URL, name, events to subscribe)
 *   - Test webhook button
 *   - Delivery log viewer
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Zap,
  AlertTriangle,
  ExternalLink,
  Settings,
  Power,
  PowerOff,
} from 'lucide-react';
import { PageHeader, StatCard, Button, Modal, FormField, Input, EmptyState } from '@/components/admin';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  lastTriggered: string | null;
  failCount: number;
  createdAt: string;
  stats: {
    totalDeliveries: number;
    successCount: number;
    failedCount: number;
  };
}

interface DeliveryLog {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  duration: number | null;
  attempt: number;
  error: string | null;
  createdAt: string;
}

interface WebhookDetail extends Omit<WebhookData, 'stats'> {
  deliveryLogs: DeliveryLog[];
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  { value: 'order.created', label: 'Order Created' },
  { value: 'order.updated', label: 'Order Updated' },
  { value: 'customer.created', label: 'Customer Created' },
  { value: 'product.created', label: 'Product Created' },
  { value: 'product.updated', label: 'Product Updated' },
  { value: 'form.submitted', label: 'Form Submitted' },
  { value: 'booking.created', label: 'Booking Created' },
  { value: 'membership.created', label: 'Membership Created' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied to clipboard');
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const { t } = useI18n();

  // List state
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WebhookData | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Detail state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<WebhookDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Test state
  const [testingId, setTestingId] = useState<string | null>(null);

  // Secret shown after creation
  const [newSecret, setNewSecret] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations/webhooks');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch {
      toast.error(t('admin.integrations.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/integrations/webhooks/${id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setDetailData(data.webhook);
    } catch {
      toast.error(t('admin.integrations.loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const openCreateForm = () => {
    setEditing(null);
    setFormName('');
    setFormUrl('');
    setFormEvents([]);
    setNewSecret(null);
    setShowForm(true);
  };

  const openEditForm = (wh: WebhookData) => {
    setEditing(wh);
    setFormName(wh.name);
    setFormUrl(wh.url);
    setFormEvents(wh.events);
    setNewSecret(null);
    setShowForm(true);
  };

  const saveWebhook = async () => {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) {
      toast.error(t('admin.integrations.fillRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetchWithCSRF(`/api/admin/integrations/webhooks/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, url: formUrl, events: formEvents }),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success(t('admin.integrations.saved'));
      } else {
        const res = await fetchWithCSRF('/api/admin/integrations/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, url: formUrl, events: formEvents }),
        });
        if (!res.ok) throw new Error('Create failed');
        const data = await res.json();
        if (data.webhook?.secret && data.webhook.secret !== '***') {
          setNewSecret(data.webhook.secret);
        }
        toast.success(t('admin.integrations.created'));
      }
      loadWebhooks();
      if (!newSecret) setShowForm(false);
    } catch {
      toast.error(t('admin.integrations.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm(t('admin.integrations.confirmDelete'))) return;
    try {
      const res = await fetchWithCSRF(`/api/admin/integrations/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(t('admin.integrations.deleted'));
      loadWebhooks();
    } catch {
      toast.error(t('admin.integrations.deleteFailed'));
    }
  };

  const toggleActive = async (wh: WebhookData) => {
    try {
      const res = await fetchWithCSRF(`/api/admin/integrations/webhooks/${wh.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !wh.isActive }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      loadWebhooks();
      toast.success(wh.isActive ? t('admin.integrations.deactivated') : t('admin.integrations.activated'));
    } catch {
      toast.error(t('admin.integrations.saveFailed'));
    }
  };

  const testWebhook = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetchWithCSRF(`/api/admin/integrations/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(t('admin.integrations.testSuccess'));
      } else {
        toast.error(`${t('admin.integrations.testFailed')}: ${data.error || 'Unknown error'}`);
      }
      loadWebhooks();
    } catch {
      toast.error(t('admin.integrations.testFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailData(null);
    } else {
      setExpandedId(id);
      loadDetail(id);
    }
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  // -----------------------------------------------------------------------
  // Aggregate stats
  // -----------------------------------------------------------------------

  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter((w) => w.isActive).length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.stats.totalDeliveries, 0);
  const totalFailed = webhooks.reduce((sum, w) => sum + w.stats.failedCount, 0);

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
      <PageHeader
        title={t('admin.integrations.zapierTitle')}
        subtitle={t('admin.integrations.zapierSubtitle')}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadWebhooks()}
              className="p-2 border border-[var(--k-border-subtle)] rounded-lg text-slate-500 hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Button onClick={openCreateForm}>
              <Plus className="w-4 h-4" /> {t('admin.integrations.addWebhook')}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label={t('admin.integrations.totalWebhooks')} value={totalWebhooks} icon={Webhook} />
        <StatCard label={t('admin.integrations.activeWebhooks')} value={activeWebhooks} icon={Power} />
        <StatCard label={t('admin.integrations.totalDeliveries')} value={totalDeliveries} icon={CheckCircle} />
        <StatCard label={t('admin.integrations.failedDeliveries')} value={totalFailed} icon={XCircle} />
      </div>

      {/* Webhooks list */}
      {webhooks.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={t('admin.integrations.noWebhooks')}
          description={t('admin.integrations.noWebhooksDesc')}
          action={<Button onClick={openCreateForm}><Plus className="w-4 h-4" /> {t('admin.integrations.addWebhook')}</Button>}
        />
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <Fragment key={wh.id}>
              <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    wh.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Webhook className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">{wh.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        wh.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {wh.isActive ? t('admin.integrations.active') : t('admin.integrations.inactive')}
                      </span>
                      {wh.failCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" /> {wh.failCount} {t('admin.integrations.failures')}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-slate-500 truncate">{wh.url}</div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {wh.events.map((ev) => (
                        <span key={ev} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                          {ev}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {wh.lastTriggered && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t('admin.integrations.lastTriggered')}: {formatDate(wh.lastTriggered)}
                        </span>
                      )}
                      <span>{wh.stats.successCount} {t('admin.integrations.successes')}</span>
                      <span>{wh.stats.failedCount} {t('admin.integrations.failuresLabel')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => testWebhook(wh.id)}
                      disabled={testingId === wh.id}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title={t('admin.integrations.testWebhook')}
                    >
                      {testingId === wh.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleActive(wh)}
                      className={`p-2 rounded-lg ${wh.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                      title={wh.isActive ? t('admin.integrations.deactivate') : t('admin.integrations.activate')}
                    >
                      {wh.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditForm(wh)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title={t('admin.integrations.editWebhook')}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(wh.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                      title={t('admin.integrations.deliveryLog')}
                    >
                      {expandedId === wh.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteWebhook(wh.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title={t('admin.integrations.deleteWebhook')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery log (expandable) */}
              {expandedId === wh.id && (
                <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-5 ml-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('admin.integrations.deliveryLog')}</h4>
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    </div>
                  ) : detailData?.deliveryLogs && detailData.deliveryLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-500 border-b border-[var(--k-border-subtle)]">
                            <th className="pb-2 pr-4">{t('admin.integrations.event')}</th>
                            <th className="pb-2 pr-4">{t('admin.integrations.status')}</th>
                            <th className="pb-2 pr-4">{t('admin.integrations.duration')}</th>
                            <th className="pb-2 pr-4">{t('admin.integrations.attempt')}</th>
                            <th className="pb-2">{t('admin.integrations.date')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.deliveryLogs.map((log) => (
                            <tr key={log.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-2 pr-4 text-xs font-mono text-indigo-600">{log.event}</td>
                              <td className="py-2 pr-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {log.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {log.statusCode || 'Error'}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-xs text-slate-500">{log.duration ? `${log.duration}ms` : '-'}</td>
                              <td className="py-2 pr-4 text-xs text-slate-500">{log.attempt}</td>
                              <td className="py-2 text-xs text-slate-400">{formatDate(log.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">{t('admin.integrations.noDeliveries')}</p>
                  )}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          title={editing ? t('admin.integrations.editWebhook') : t('admin.integrations.addWebhook')}
          onClose={() => { setShowForm(false); setNewSecret(null); }}
        >
          <div className="space-y-4">
            {/* Secret display after creation */}
            {newSecret && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">{t('admin.integrations.secretWarning')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white rounded px-3 py-2 text-xs font-mono break-all border">
                    {newSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newSecret)}
                    className="p-2 text-amber-600 hover:bg-amber-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <FormField label={t('admin.integrations.webhookName')}>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Zapier - New Orders"
              />
            </FormField>

            <FormField label={t('admin.integrations.webhookUrl')}>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
            </FormField>

            <FormField label={t('admin.integrations.subscribedEvents')}>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_TYPES.map((et) => (
                  <label key={et.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEvents.includes(et.value)}
                      onChange={() => toggleEvent(et.value)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{et.label}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => { setShowForm(false); setNewSecret(null); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {newSecret ? t('admin.integrations.close') : t('admin.integrations.cancel')}
              </button>
              {!newSecret && (
                <Button onClick={saveWebhook} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? t('admin.integrations.save') : t('admin.integrations.create')}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Zapier/Make info */}
      <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          {t('admin.integrations.setupGuideTitle')}
        </h3>
        <div className="text-sm text-slate-500 space-y-2">
          <p><strong>Zapier:</strong> {t('admin.integrations.zapierGuide')}</p>
          <p><strong>Make:</strong> {t('admin.integrations.makeGuide')}</p>
          <p className="text-xs text-slate-400">{t('admin.integrations.signatureInfo')}</p>
        </div>
      </div>
    </div>
  );
}
