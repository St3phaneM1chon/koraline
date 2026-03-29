'use client';

/**
 * PhoneNumbersClient - Manage DIDs (phone numbers) and their routing.
 * Uses admin design system. French labels. Dark mode support.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { useI18n } from '@/i18n/client';
import { PageHeader, SectionCard, Button, EmptyState, Modal } from '@/components/admin';
import { Phone, Plus, Trash2, MapPin, Hash, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PhoneNumbersClient() {
  const { t } = useI18n();
  const { data, mutate, isLoading } = useSWR('/api/admin/voip/phone-numbers', fetcher);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ number: '', displayName: '', country: 'CA', connectionId: '' });

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/admin/voip/phone-numbers', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de l\u2019ajout');
        return;
      }
      toast.success('Num\u00e9ro ajout\u00e9 avec succ\u00e8s');
      setShowAdd(false);
      setForm({ number: '', displayName: '', country: 'CA', connectionId: '' });
      mutate();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce num\u00e9ro de t\u00e9l\u00e9phone ?')) return;
    try {
      await fetch(`/api/admin/voip/phone-numbers?id=${id}`, { method: 'DELETE', headers: addCSRFHeader({}) });
      toast.success('Num\u00e9ro supprim\u00e9');
      mutate();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const numbers = data?.numbers || [];

  const getNumberType = (num: string) => {
    if (num.startsWith('+1800') || num.startsWith('+1888') || num.startsWith('+1877') || num.startsWith('+1866') || num.startsWith('+1855')) {
      return 'Sans frais';
    }
    return 'Local';
  };

  const getRegion = (num: string) => {
    if (num.startsWith('+1514') || num.startsWith('+1438')) return 'Montr\u00e9al';
    if (num.startsWith('+1819') || num.startsWith('+1873')) return 'Gatineau';
    if (num.startsWith('+1416') || num.startsWith('+1647')) return 'Toronto';
    if (num.startsWith('+1418')) return 'Qu\u00e9bec';
    if (num.startsWith('+1450')) return 'Rive-Sud';
    if (num.startsWith('+1613')) return 'Ottawa';
    if (num.startsWith('+1800') || num.startsWith('+1888') || num.startsWith('+1877') || num.startsWith('+1866') || num.startsWith('+1855')) return 'National';
    return 'Canada';
  };

  const inputStyles = 'w-full px-3 py-2 bg-[var(--k-bg-surface)] border border-[var(--k-border-default)] rounded-lg text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Num\u00e9ros de t\u00e9l\u00e9phone"
        subtitle="G\u00e9rez les num\u00e9ros assign\u00e9s \u00e0 votre organisation"
        backHref="/admin/telephonie"
        backLabel="T\u00e9l\u00e9phonie"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
            Ajouter un num\u00e9ro
          </Button>
        }
      />

      {/* Add Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Ajouter un num\u00e9ro"
        subtitle="Saisissez les informations du nouveau num\u00e9ro de t\u00e9l\u00e9phone"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleAdd}>Enregistrer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Num\u00e9ro</label>
            <input
              placeholder="+15145551234"
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              aria-label="Num\u00e9ro de t\u00e9l\u00e9phone"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Nom d&apos;affichage</label>
            <input
              placeholder="Bureau principal"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              aria-label="Nom d'affichage"
              className={inputStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Pays</label>
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              aria-label="Pays"
              className={inputStyles}
            >
              <option value="CA">Canada</option>
              <option value="US">\u00c9tats-Unis</option>
              <option value="FR">France</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Phone Numbers Table */}
      {isLoading ? (
        <SectionCard>
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        </SectionCard>
      ) : numbers.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Phone}
            title="Aucun num\u00e9ro configur\u00e9"
            description="Ajoutez votre premier num\u00e9ro de t\u00e9l\u00e9phone pour commencer \u00e0 recevoir des appels."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
                Ajouter un num\u00e9ro
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Num\u00e9ros de t\u00e9l\u00e9phone">
              <thead>
                <tr className="bg-[var(--k-bg-surface)] text-[var(--k-text-tertiary)] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-start">Num\u00e9ro</th>
                  <th className="px-4 py-3 text-start">Nom</th>
                  <th className="px-4 py-3 text-start hidden sm:table-cell">R\u00e9gion</th>
                  <th className="px-4 py-3 text-start hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-start hidden md:table-cell">Rout\u00e9 vers</th>
                  <th className="px-4 py-3 text-start">Statut</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--k-border-subtle)]">
                {numbers.map((num: { id: string; number: string; displayName?: string; country: string; isActive: boolean; connection?: { provider: string }; routedTo?: string }) => (
                  <tr key={num.id} className="hover:bg-[var(--k-bg-surface)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#818cf8]" />
                        <span className="font-medium text-[var(--k-text-primary)] tabular-nums">{num.number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--k-text-secondary)]">
                      {num.displayName || '-'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-[var(--k-text-secondary)]">
                        <MapPin className="w-3 h-3" />
                        {getRegion(num.number)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-[var(--k-text-secondary)]">
                        <Hash className="w-3 h-3" />
                        {getNumberType(num.number)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-[var(--k-text-tertiary)]">
                        <ArrowUpDown className="w-3 h-3" />
                        {num.connection?.provider || 'Telnyx'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        num.isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-[var(--k-glass-thin)] text-[var(--k-text-muted)]'
                      }`}>
                        {num.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => handleDelete(num.id)}
                        className="p-1.5 rounded-lg text-[var(--k-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
