'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Target, Eye, Zap, Plus, ToggleLeft, ToggleRight,
  TrendingUp, UserCheck, UserX, Clock,
} from 'lucide-react';
import { PageHeader, Button, StatCard, SectionCard, Modal, FormField, Input, Textarea, EmptyState } from '@/components/admin';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalizationRule {
  id: string;
  name: string;
  description?: string;
  segment: string;
  action: string;
  config: Record<string, unknown>;
  isActive: boolean;
  priority: number;
  startsAt?: string;
  endsAt?: string;
}

interface VisitorStats {
  totalVisitors: number;
  activeVisitors: number;
  newVisitors: number;
  totalEvents: number;
  eventsLast24h: number;
  segmentDistribution: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENTS = [
  { value: 'new_visitor', label: 'Nouveaux visiteurs', icon: UserCheck },
  { value: 'returning', label: 'Visiteurs fideles', icon: Users },
  { value: 'high_value', label: 'Haute valeur', icon: TrendingUp },
  { value: 'at_risk', label: 'A risque', icon: UserX },
  { value: 'frequent', label: 'Frequents', icon: Clock },
  { value: 'browser', label: 'Navigateurs sans achat', icon: Eye },
  { value: 'all', label: 'Tous les visiteurs', icon: Users },
];

const ACTIONS = [
  { value: 'show_banner', label: 'Afficher une banniere' },
  { value: 'recommend_products', label: 'Recommander des produits' },
  { value: 'show_popup', label: 'Afficher un popup' },
  { value: 'custom_cta', label: 'CTA personnalise' },
  { value: 'highlight_category', label: 'Mettre en avant une categorie' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PersonnalisationPage() {
  const [rules, setRules] = useState<PersonalizationRule[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PersonalizationRule | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSegment, setFormSegment] = useState('new_visitor');
  const [formAction, setFormAction] = useState('show_banner');
  const [formPriority, setFormPriority] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/personalization');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRules(data.rules || []);
      setStats(data.stats || null);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormDescription('');
    setFormSegment('new_visitor');
    setFormAction('show_banner');
    setFormPriority(0);
    setFormActive(true);
    setShowModal(true);
  };

  const openEdit = (rule: PersonalizationRule) => {
    setEditing(rule);
    setFormName(rule.name);
    setFormDescription(rule.description || '');
    setFormSegment(rule.segment);
    setFormAction(rule.action);
    setFormPriority(rule.priority);
    setFormActive(rule.isActive);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      const payload = {
        ...(editing?.id ? { id: editing.id } : {}),
        name: formName,
        description: formDescription,
        segment: formSegment,
        action: formAction,
        config: {},
        isActive: formActive,
        priority: formPriority,
      };

      const res = await fetch('/api/admin/personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success(editing ? 'Regle mise a jour' : 'Regle creee');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const segmentLabel = (val: string) => SEGMENTS.find((s) => s.value === val)?.label || val;
  const actionLabel = (val: string) => ACTIONS.find((a) => a.value === val)?.label || val;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Personnalisation"
        subtitle="Segmentez vos visiteurs et personnalisez leur experience"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Visiteurs totaux" value={stats?.totalVisitors || 0} icon={Users} />
        <StatCard label="Actifs (30j)" value={stats?.activeVisitors || 0} icon={Eye} />
        <StatCard label="Nouveaux (7j)" value={stats?.newVisitors || 0} icon={UserCheck} />
        <StatCard label="Evenements (24h)" value={stats?.eventsLast24h || 0} icon={Zap} />
        <StatCard label="Regles actives" value={rules.filter((r) => r.isActive).length} icon={Target} />
      </div>

      {/* Segment Distribution */}
      {stats?.segmentDistribution && Object.keys(stats.segmentDistribution).length > 0 && (
        <SectionCard title="Distribution des segments">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.segmentDistribution).map(([seg, count]) => {
              const segDef = SEGMENTS.find((s) => s.value === seg);
              const Icon = segDef?.icon || Users;
              return (
                <div key={seg} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Icon className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{segDef?.label || seg}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Rules */}
      <SectionCard
        title="Regles de personnalisation"
        headerAction={
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Nouvelle regle
          </Button>
        }
      >
        {rules.length === 0 ? (
          <EmptyState
            title="Aucune regle"
            description="Creez votre premiere regle de personnalisation pour cibler vos visiteurs."
            icon={Target}
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Creer une regle</Button>}
          />
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => openEdit(rule)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openEdit(rule)}
              >
                <div className="flex items-center gap-3">
                  {rule.isActive ? (
                    <ToggleRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-gray-500">
                      {segmentLabel(rule.segment)} &rarr; {actionLabel(rule.action)}
                      {rule.priority > 0 && <span className="ml-2 text-xs text-blue-500">P{rule.priority}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${rule.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Modifier la regle' : 'Nouvelle regle de personnalisation'}
      >
        <div className="space-y-4">
          <FormField label="Nom">
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Popup bienvenue" />
          </FormField>
          <FormField label="Description">
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description optionnelle" rows={2} />
          </FormField>
          <FormField label="Segment cible">
            <select
              value={formSegment}
              onChange={(e) => setFormSegment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            >
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Action">
            <select
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Priorite (0-100)">
            <Input type="number" value={formPriority} onChange={(e) => setFormPriority(Number(e.target.value))} min={0} max={100} />
          </FormField>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} id="rule-active" className="rounded" />
            <label htmlFor="rule-active" className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSave}>
              {editing ? 'Mettre a jour' : 'Creer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
