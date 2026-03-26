'use client';

/**
 * Broadcast — Super-admin only
 * URL: /admin/platform/broadcast
 *
 * Send notifications to multiple tenants at once.
 * Filter by plan and status, preview count, send with confirmation.
 * Dark Glass Premium styling.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Send, Loader2, Megaphone, Check, AlertTriangle,
  Info, Zap, ChevronDown, Users,
} from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { addCSRFHeader } from '@/lib/csrf';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLANS = [
  { key: 'essential', label: 'Essentiel' },
  { key: 'pro', label: 'Pro' },
  { key: 'enterprise', label: 'Enterprise' },
];

const STATUSES = [
  { key: 'ACTIVE', label: 'Actif' },
  { key: 'SUSPENDED', label: 'Suspendu' },
  { key: 'PENDING', label: 'En attente' },
];

const TYPE_OPTIONS = [
  { key: 'info', label: 'Information', icon: Info, color: '#60a5fa' },
  { key: 'warning', label: 'Avertissement', icon: AlertTriangle, color: '#fbbf24' },
  { key: 'urgent', label: 'Urgent', icon: Zap, color: '#fb7185' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BroadcastPage() {
  const { t } = useI18n();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch preview count
  // ---------------------------------------------------------------------------

  const fetchPreviewCount = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlans.length > 0) params.set('plans', selectedPlans.join(','));
      if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','));
      const res = await fetch(`/api/admin/platform/broadcast?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewCount(data.count ?? 0);
      }
    } catch {
      // Silently handle
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedPlans, selectedStatuses]);

  useEffect(() => {
    fetchPreviewCount();
  }, [fetchPreviewCount]);

  // ---------------------------------------------------------------------------
  // Toggle helpers
  // ---------------------------------------------------------------------------

  const togglePlan = (plan: string) => {
    setSelectedPlans(prev =>
      prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // ---------------------------------------------------------------------------
  // Send broadcast
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Titre et message sont requis');
      return;
    }

    const confirmMsg = `Envoyer cette notification a ${previewCount ?? '?'} client(s) ? Un email sera envoye au proprietaire de chaque client.`;
    if (!confirm(confirmMsg)) return;

    setSending(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/admin/platform/broadcast', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          filter: {
            plan: selectedPlans.length > 0 ? selectedPlans : undefined,
            status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastResult({ sent: data.sent, failed: data.failed });
        toast.success(`Broadcast envoye a ${data.sent} client(s)`);
        setTitle('');
        setMessage('');
        setType('info');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors du broadcast');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const inputClasses = `w-full h-9 px-3 rounded-lg bg-[var(--k-bg-raised)] border border-[var(--k-border-subtle)]
    text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)]
    focus:outline-none focus:ring-2 focus:ring-[var(--k-border-focus)] transition-shadow`;

  const selectClasses = `${inputClasses} appearance-none cursor-pointer`;

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--k-text-primary)] flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-[var(--k-accent-indigo)]" />
          {t('admin.broadcast.title') || 'Broadcast'}
        </h1>
        <p className="text-sm text-[var(--k-text-secondary)] mt-1">
          {t('admin.broadcast.description') || 'Envoyer une notification a tous les clients ou a un sous-ensemble filtre.'}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[var(--k-border-subtle)] bg-[var(--k-glass-thin)] backdrop-blur-md p-5">
        <h3 className="text-sm font-semibold text-[var(--k-text-primary)] mb-4">
          {t('admin.broadcast.filters') || 'Filtres (optionnels)'}
        </h3>

        <div className="space-y-4">
          {/* Plan filter */}
          <div>
            <p className="text-xs font-medium text-[var(--k-text-secondary)] mb-2">Par plan</p>
            <div className="flex flex-wrap gap-2">
              {PLANS.map(plan => (
                <button
                  key={plan.key}
                  onClick={() => togglePlan(plan.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedPlans.includes(plan.key)
                      ? 'border-[var(--k-accent-indigo)] bg-[var(--k-accent-indigo-10)] text-[var(--k-accent-indigo)]'
                      : 'border-[var(--k-border-subtle)] text-[var(--k-text-secondary)] hover:bg-[var(--k-glass-thin)]'
                  }`}
                >
                  {selectedPlans.includes(plan.key) && <Check className="w-3 h-3 inline mr-1" />}
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <p className="text-xs font-medium text-[var(--k-text-secondary)] mb-2">Par statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(status => (
                <button
                  key={status.key}
                  onClick={() => toggleStatus(status.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedStatuses.includes(status.key)
                      ? 'border-[var(--k-accent-indigo)] bg-[var(--k-accent-indigo-10)] text-[var(--k-accent-indigo)]'
                      : 'border-[var(--k-border-subtle)] text-[var(--k-text-secondary)] hover:bg-[var(--k-glass-thin)]'
                  }`}
                >
                  {selectedStatuses.includes(status.key) && <Check className="w-3 h-3 inline mr-1" />}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview count */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--k-border-subtle)]">
            <Users className="w-4 h-4 text-[var(--k-accent-indigo)]" />
            <span className="text-sm text-[var(--k-text-secondary)]">
              {loadingPreview ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
              ) : (
                <>
                  Ce message sera envoye a <strong className="text-[var(--k-text-primary)]">{previewCount ?? 0}</strong> client(s)
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Message form */}
      <div className="rounded-xl border border-[var(--k-border-subtle)] bg-[var(--k-glass-thin)] backdrop-blur-md p-5">
        <h3 className="text-sm font-semibold text-[var(--k-text-primary)] mb-4">
          {t('admin.broadcast.messageForm') || 'Message'}
        </h3>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--k-text-secondary)]">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la notification"
                className={inputClasses}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--k-text-secondary)]">Type</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={selectClasses}
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--k-text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--k-text-secondary)]">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contenu de la notification..."
              rows={5}
              className={`w-full px-3 py-2 rounded-lg bg-[var(--k-bg-raised)] border border-[var(--k-border-subtle)]
                text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)] resize-y
                focus:outline-none focus:ring-2 focus:ring-[var(--k-border-focus)] transition-shadow`}
              maxLength={5000}
            />
            <p className="text-[10px] text-[var(--k-text-muted)] text-right">{message.length}/5000</p>
          </div>

          {/* Send button */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {lastResult && (
                <p className="text-sm text-[var(--k-text-secondary)]">
                  Dernier envoi: <span className="text-[var(--k-accent-emerald)]">{lastResult.sent} envoyes</span>
                  {lastResult.failed > 0 && (
                    <span className="text-[var(--k-accent-rose)] ml-2">{lastResult.failed} echecs</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim() || previewCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white
                bg-gradient-to-r from-[#6366f1] to-[#818cf8] hover:from-[#5558e6] hover:to-[#7580f2]
                disabled:opacity-50 transition-all"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Envoi en cours...' : `Envoyer a ${previewCount ?? 0} client(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
