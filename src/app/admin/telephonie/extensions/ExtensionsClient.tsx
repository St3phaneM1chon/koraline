'use client';

/**
 * ExtensionsClient - Manage SIP extensions for agents.
 * Uses admin design system. French labels. Dark mode support.
 */

import { useState } from 'react';
import { useI18n } from '@/i18n/client';
import { PageHeader, SectionCard, Button, EmptyState, Modal } from '@/components/admin';
import { Headphones, Plus, Trash2, Circle, User } from 'lucide-react';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

interface Extension {
  id: string;
  extension: string;
  sipDomain: string;
  status: string;
  isRegistered: boolean;
  user?: { name: string | null; email: string };
}

export default function ExtensionsClient({ extensions: initial }: { extensions: Extension[] }) {
  const { t } = useI18n();
  const [extensions, setExtensions] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    extension: '',
    sipUsername: '',
    sipPassword: '',
    sipDomain: 'pbx.attitudes.vip',
  });

  const handleAdd = async () => {
    if (!form.extension) {
      toast.error('Le num\u00e9ro d\u2019extension est requis');
      return;
    }
    try {
      const res = await fetch('/api/admin/voip/extensions', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de la cr\u00e9ation');
        return;
      }
      const { extension } = await res.json();
      setExtensions((prev) => [...prev, extension]);
      toast.success('Extension cr\u00e9\u00e9e avec succ\u00e8s');
      setShowAdd(false);
      setForm({ userId: '', extension: '', sipUsername: '', sipPassword: '', sipDomain: 'pbx.attitudes.vip' });
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette extension ?')) return;
    try {
      await fetch(`/api/admin/voip/extensions?id=${id}`, { method: 'DELETE', headers: addCSRFHeader({}) });
      setExtensions((prev) => prev.filter((e) => e.id !== id));
      toast.success('Extension supprim\u00e9e');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    ONLINE: { label: 'En ligne', color: 'bg-emerald-500/15 text-emerald-400', dotColor: 'bg-emerald-500' },
    BUSY: { label: 'Occup\u00e9', color: 'bg-red-500/15 text-red-400', dotColor: 'bg-red-500' },
    DND: { label: 'Ne pas d\u00e9ranger', color: 'bg-orange-500/15 text-orange-400', dotColor: 'bg-orange-500' },
    AWAY: { label: 'Absent', color: 'bg-amber-500/15 text-amber-400', dotColor: 'bg-amber-500' },
    OFFLINE: { label: 'Hors ligne', color: 'bg-[var(--k-glass-thin)] text-[var(--k-text-muted)]', dotColor: 'bg-gray-500' },
  };

  const inputStyles = 'w-full px-3 py-2 bg-[var(--k-bg-surface)] border border-[var(--k-border-default)] rounded-lg text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extensions SIP"
        subtitle="G\u00e9rez les extensions t\u00e9l\u00e9phoniques des agents"
        backHref="/admin/telephonie"
        backLabel="T\u00e9l\u00e9phonie"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
            Nouvelle extension
          </Button>
        }
      />

      {/* Add Extension Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Cr\u00e9er une extension"
        subtitle="Assignez une nouvelle extension SIP \u00e0 un utilisateur"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleAdd}>Cr\u00e9er</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Num\u00e9ro d&apos;extension *</label>
            <input
              placeholder="1001"
              value={form.extension}
              onChange={(e) => setForm((f) => ({ ...f, extension: e.target.value }))}
              aria-label="Num\u00e9ro d'extension"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Nom d&apos;utilisateur SIP</label>
            <input
              placeholder="sip_user_1001"
              value={form.sipUsername}
              onChange={(e) => setForm((f) => ({ ...f, sipUsername: e.target.value }))}
              aria-label="Nom d'utilisateur SIP"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Mot de passe SIP</label>
            <input
              placeholder="********"
              type="password"
              value={form.sipPassword}
              onChange={(e) => setForm((f) => ({ ...f, sipPassword: e.target.value }))}
              aria-label="Mot de passe SIP"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Domaine SIP</label>
            <input
              placeholder="pbx.attitudes.vip"
              value={form.sipDomain}
              onChange={(e) => setForm((f) => ({ ...f, sipDomain: e.target.value }))}
              aria-label="Domaine SIP"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Identifiant utilisateur</label>
            <input
              placeholder="ID de l'utilisateur \u00e0 assigner"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              aria-label="Identifiant utilisateur"
              className={inputStyles}
            />
            <p className="text-xs text-[var(--k-text-muted)] mt-1">Laissez vide pour cr\u00e9er une extension non assign\u00e9e</p>
          </div>
        </div>
      </Modal>

      {/* Extensions Table */}
      {extensions.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Headphones}
            title="Aucune extension configur\u00e9e"
            description="Cr\u00e9ez une extension SIP pour permettre aux agents de recevoir des appels."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
                Nouvelle extension
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Extensions SIP">
              <thead>
                <tr className="bg-[var(--k-bg-surface)] text-[var(--k-text-tertiary)] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-start">Extension</th>
                  <th className="px-4 py-3 text-start">Utilisateur</th>
                  <th className="px-4 py-3 text-start hidden md:table-cell">Domaine SIP</th>
                  <th className="px-4 py-3 text-start">Statut</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--k-border-subtle)]">
                {extensions.map((ext) => {
                  const statusInfo = statusConfig[ext.status] || statusConfig.OFFLINE;
                  return (
                    <tr key={ext.id} className="hover:bg-[var(--k-bg-surface)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-[#818cf8]" />
                          <span className="font-semibold text-[var(--k-text-primary)] tabular-nums">{ext.extension}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[var(--k-text-muted)]" />
                          <div>
                            <div className="text-[var(--k-text-primary)]">{ext.user?.name || 'Non assign\u00e9'}</div>
                            {ext.user?.email && (
                              <div className="text-xs text-[var(--k-text-tertiary)]">{ext.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--k-text-secondary)] hidden md:table-cell">
                        {ext.sipDomain}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          <Circle className={`w-2 h-2 fill-current ${statusInfo.dotColor.replace('bg-', 'text-')}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDelete(ext.id)}
                          className="p-1.5 rounded-lg text-[var(--k-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label="Supprimer l'extension"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
