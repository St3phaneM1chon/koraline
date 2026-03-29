'use client';

/**
 * ConnectionsClient - Manage VoIP provider connections (Telnyx, VoIP.ms).
 * Uses admin design system. French labels. Dark mode support.
 */

import { useState } from 'react';
import { PageHeader, SectionCard, Button } from '@/components/admin';
import {
  Wifi, WifiOff, TestTube, Trash2, Save,
  CheckCircle, XCircle, Loader2, Shield, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

type Provider = 'telnyx' | 'voipms';

interface Connection {
  id: string;
  provider: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  lastSyncAt: string | null;
  syncStatus: string | null;
  phoneNumberCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ConnectionsClient({ initialConnections }: { initialConnections: any[] }) {
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [form, setForm] = useState({
    provider: '' as Provider,
    apiKey: '',
    apiSecret: '',
    isEnabled: true,
  });

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/voip/connections', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setConnections((prev) => {
        const idx = prev.findIndex((c) => c.provider === form.provider);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.connection;
          return updated;
        }
        return [...prev, data.connection];
      });
      setEditing(null);
      toast.success('Connexion enregistr\u00e9e');
    } catch {
      toast.error('Erreur lors de l\u2019enregistrement');
    }
  };

  const handleTest = async (provider: string) => {
    setTesting(provider);
    try {
      const res = await fetch('/api/admin/voip/connections', {
        method: 'PUT',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${provider} : Connexion r\u00e9ussie`);
      } else {
        toast.error(`${provider} : ${data.message}`);
      }
    } catch {
      toast.error('Erreur lors du test');
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (provider: string) => {
    if (!confirm('Supprimer cette connexion ? Les num\u00e9ros associ\u00e9s seront d\u00e9sactiv\u00e9s.')) return;
    try {
      await fetch(`/api/admin/voip/connections?provider=${provider}`, { method: 'DELETE', headers: addCSRFHeader({}) });
      setConnections((prev) => prev.filter((c) => c.provider !== provider));
      toast.success('Connexion supprim\u00e9e');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const providers: { id: Provider; label: string; description: string }[] = [
    { id: 'telnyx', label: 'Telnyx', description: 'Fournisseur VoIP principal \u2014 Appels, SMS, SIP Trunking' },
    { id: 'voipms', label: 'VoIP.ms', description: 'Fournisseur VoIP alternatif \u2014 Tarifs avantageux Canada' },
  ];

  const inputStyles = 'w-full px-3 py-2 bg-[var(--k-bg-surface)] border border-[var(--k-border-default)] rounded-lg text-sm text-[var(--k-text-primary)] placeholder:text-[var(--k-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connexions VoIP"
        subtitle="Configurez et g\u00e9rez vos fournisseurs de t\u00e9l\u00e9phonie"
        backHref="/admin/telephonie"
        backLabel="T\u00e9l\u00e9phonie"
      />

      <div className="grid gap-4">
        {providers.map((prov) => {
          const conn = connections.find((c) => c.provider === prov.id);
          const isEditing = editing === prov.id;

          return (
            <SectionCard key={prov.id}>
              {/* Provider Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {conn?.isEnabled ? (
                    <div className="p-2 rounded-lg bg-emerald-500/15">
                      <Wifi className="w-5 h-5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-[var(--k-glass-thin)]">
                      <WifiOff className="w-5 h-5 text-[var(--k-text-muted)]" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[var(--k-text-primary)]">{prov.label}</h3>
                    <p className="text-sm text-[var(--k-text-tertiary)]">{prov.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {conn && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={testing === prov.id ? Loader2 : TestTube}
                        onClick={() => handleTest(prov.id)}
                        disabled={testing === prov.id}
                        loading={testing === prov.id}
                      >
                        Tester
                      </Button>
                      <button
                        onClick={() => handleDelete(prov.id)}
                        className="p-1.5 rounded-lg text-[var(--k-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Supprimer la connexion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditing(isEditing ? null : prov.id);
                      setForm({
                        provider: prov.id,
                        apiKey: '',
                        apiSecret: '',
                        isEnabled: conn?.isEnabled ?? true,
                      });
                    }}
                  >
                    {conn ? 'Modifier' : 'Configurer'}
                  </Button>
                </div>
              </div>

              {/* Connection Status */}
              {conn && !isEditing && (
                <div className="flex flex-wrap gap-4 text-sm border-t border-[var(--k-border-subtle)] pt-4">
                  <div className="flex items-center gap-1.5 text-[var(--k-text-secondary)]">
                    {conn.hasApiKey ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-[var(--k-text-muted)]" />}
                    Cl\u00e9 API
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--k-text-secondary)]">
                    {conn.hasApiSecret ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-[var(--k-text-muted)]" />}
                    Secret API
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--k-text-secondary)]">
                    <Shield className="w-3.5 h-3.5 text-[#818cf8]" />
                    {conn.phoneNumberCount} num\u00e9ro{conn.phoneNumberCount > 1 ? 's' : ''}
                  </div>
                  {conn.lastSyncAt && (
                    <div className="text-[var(--k-text-tertiary)]">
                      Derni\u00e8re sync : {new Date(conn.lastSyncAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                  {conn.syncStatus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conn.syncStatus === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' :
                      conn.syncStatus === 'FAILED' ? 'bg-red-500/15 text-red-400' :
                      'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'
                    }`}>
                      {conn.syncStatus}
                    </span>
                  )}
                </div>
              )}

              {/* Edit Form */}
              {isEditing && (
                <div className="mt-3 border-t border-[var(--k-border-subtle)] pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Cl\u00e9 API</label>
                      <div className="relative">
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          value={form.apiKey}
                          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                          placeholder={conn?.hasApiKey ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'Saisissez la cl\u00e9 API'}
                          className={inputStyles}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-[var(--k-text-muted)] hover:text-[var(--k-text-secondary)]"
                          aria-label={showSecrets ? 'Masquer' : 'Afficher'}
                        >
                          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">Secret API</label>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        value={form.apiSecret}
                        onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                        placeholder={conn?.hasApiSecret ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'Saisissez le secret API'}
                        className={inputStyles}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-[var(--k-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={form.isEnabled}
                        onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                        className="rounded border-[var(--k-border-default)]"
                      />
                      Connexion activ\u00e9e
                    </label>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setEditing(null)}>
                        Annuler
                      </Button>
                      <Button variant="primary" icon={Save} onClick={handleSave}>
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
