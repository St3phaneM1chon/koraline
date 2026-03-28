'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Workflow, Plus, Play, Trash2, Mail, MessageSquare, Bell,
  Gift, UserPlus, ShoppingCart, Star, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Zap, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { PageHeader, Button, StatCard, SectionCard, Modal, FormField, Input, Textarea, EmptyState } from '@/components/admin';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationCondition {
  field: string;
  operator: string;
  value: string;
}

interface AutomationAction {
  type: string;
  templateId?: string;
  delay?: string;
  config?: Record<string, unknown>;
}

interface WorkflowAutomation {
  id: string;
  name: string;
  description?: string;
  type: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  failCount: number;
  logCount: number;
  createdAt: string;
}

interface AutomationLog {
  id: string;
  automationName: string;
  status: string;
  targetEmail?: string;
  error?: string;
  createdAt: string;
}

interface AutomationStats {
  total: number;
  active: number;
  totalRuns: number;
  totalSuccess: number;
  totalFails: number;
  successRate: number;
}

// ---------------------------------------------------------------------------
// Pre-built automation templates
// ---------------------------------------------------------------------------

const TEMPLATES = [
  {
    name: 'Email de bienvenue',
    description: 'Envoyer un email de bienvenue lors de l\'inscription',
    type: 'welcome' as const,
    trigger: 'user.registered',
    icon: UserPlus,
    color: 'text-green-600',
    actions: [{ type: 'email', delay: '0m', config: { subject: 'Bienvenue!' } }],
  },
  {
    name: 'Panier abandonne',
    description: 'Relancer apres un panier abandonne',
    type: 'abandoned_cart' as const,
    trigger: 'cart.abandoned',
    icon: ShoppingCart,
    color: 'text-orange-600',
    actions: [
      { type: 'email', delay: '1h', config: { subject: 'Votre panier vous attend!' } },
      { type: 'email', delay: '24h', config: { subject: 'Derniere chance — 10% de reduction' } },
    ],
  },
  {
    name: 'Reduction anniversaire',
    description: 'Offrir une reduction le jour de l\'anniversaire',
    type: 'birthday' as const,
    trigger: 'user.birthday',
    icon: Gift,
    color: 'text-pink-600',
    actions: [{ type: 'email', delay: '0m', config: { subject: 'Joyeux anniversaire! Voici votre cadeau' } }, { type: 'discount', config: { percent: 15 } }],
  },
  {
    name: 'Demande d\'avis',
    description: 'Demander un avis apres livraison',
    type: 'review_request' as const,
    trigger: 'order.delivered',
    icon: Star,
    color: 'text-yellow-600',
    actions: [{ type: 'email', delay: '3d', config: { subject: 'Que pensez-vous de votre commande?' } }],
  },
  {
    name: 'Reengagement inactif',
    description: 'Relancer les utilisateurs inactifs depuis 30 jours',
    type: 'reengagement' as const,
    trigger: 'user.inactive',
    icon: RefreshCw,
    color: 'text-blue-600',
    actions: [
      { type: 'email', delay: '0m', config: { subject: 'Vous nous manquez!' } },
      { type: 'discount', delay: '7d', config: { percent: 10 } },
    ],
  },
];

const TRIGGER_LABELS: Record<string, string> = {
  'user.registered': 'Inscription utilisateur',
  'cart.abandoned': 'Panier abandonne',
  'user.birthday': 'Anniversaire',
  'order.delivered': 'Commande livree',
  'user.inactive': 'Utilisateur inactif',
  'order.created': 'Nouvelle commande',
  'review.received': 'Avis recu',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  discount: Gift,
  tag: Zap,
  webhook: RefreshCw,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AutomatisationsPage() {
  const [automations, setAutomations] = useState<WorkflowAutomation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<string>('custom');
  const [formTrigger, setFormTrigger] = useState('user.registered');
  const [formActions, setFormActions] = useState<AutomationAction[]>([{ type: 'email' }]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/automations');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setAutomations(data.automations || []);
      setLogs(data.recentLogs || []);
      setStats(data.stats || null);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createFromTemplate = (template: typeof TEMPLATES[number]) => {
    setEditingId(null);
    setFormName(template.name);
    setFormDescription(template.description);
    setFormType(template.type);
    setFormTrigger(template.trigger);
    setFormActions(template.actions);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormType('custom');
    setFormTrigger('user.registered');
    setFormActions([{ type: 'email' }]);
    setShowModal(true);
  };

  const openEdit = (auto: WorkflowAutomation) => {
    setEditingId(auto.id);
    setFormName(auto.name);
    setFormDescription(auto.description || '');
    setFormType(auto.type);
    setFormTrigger(auto.trigger);
    setFormActions(Array.isArray(auto.actions) ? auto.actions : []);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    if (formActions.length === 0) {
      toast.error('Au moins une action est requise');
      return;
    }

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: formName,
        description: formDescription,
        type: formType,
        trigger: formTrigger,
        conditions: [],
        actions: formActions,
        isActive: true,
      };

      const res = await fetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success(editingId ? 'Automatisation mise a jour' : 'Automatisation creee');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await fetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify({ _method: 'toggle', id }),
      });
      toast.success('Statut mis a jour');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm('Supprimer cette automatisation?')) return;
    try {
      await fetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify({ _method: 'delete', id }),
      });
      toast.success('Automatisation supprimee');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const addAction = () => {
    setFormActions([...formActions, { type: 'email' }]);
  };

  const removeAction = (idx: number) => {
    setFormActions(formActions.filter((_, i) => i !== idx));
  };

  const updateAction = (idx: number, key: string, value: string) => {
    setFormActions(formActions.map((a, i) => (i === idx ? { ...a, [key]: value } : a)));
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Automatisations"
        subtitle="Creez des workflows automatiques pour engager vos clients"
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Automatisations actives" value={stats.active} icon={Play} />
          <StatCard label="Total executions" value={stats.totalRuns} icon={Zap} />
          <StatCard label="Taux de succes" value={`${stats.successRate}%`} icon={CheckCircle} />
          <StatCard label="Echecs" value={stats.totalFails} icon={XCircle} />
        </div>
      )}

      {/* Pre-built Templates */}
      <SectionCard title="Automatisations pre-construites">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const exists = automations.some((a) => a.type === tmpl.type);
            return (
              <button
                key={tmpl.type}
                onClick={() => !exists && createFromTemplate(tmpl)}
                disabled={exists}
                className={`text-left p-4 rounded-lg border transition-all ${exists ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 cursor-default' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${tmpl.color}`} />
                  <span className="font-medium text-sm">{tmpl.name}</span>
                  {exists && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                </div>
                <p className="text-xs text-gray-500">{tmpl.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  {tmpl.actions.map((a, i) => {
                    const AIcon = ACTION_ICONS[a.type] || Zap;
                    return <AIcon key={i} className="w-3 h-3 text-gray-400" />;
                  })}
                  {tmpl.actions.length > 1 && (
                    <span className="text-xs text-gray-400 ml-1">{tmpl.actions.length} etapes</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Active Automations */}
      <SectionCard
        title="Mes automatisations"
        headerAction={
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Personnalisee
          </Button>
        }
      >
        {automations.length === 0 ? (
          <EmptyState
            title="Aucune automatisation"
            description="Utilisez un template ci-dessus ou creez une automatisation personnalisee."
            icon={Workflow}
          />
        ) : (
          <div className="space-y-3">
            {automations.map((auto) => {
              const Icon = TEMPLATES.find((t) => t.type === auto.type)?.icon || Workflow;
              return (
                <div
                  key={auto.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => openEdit(auto)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openEdit(auto)}
                  >
                    <Icon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{auto.name}</p>
                      <p className="text-xs text-gray-500">
                        {TRIGGER_LABELS[auto.trigger] || auto.trigger}
                        {auto.runCount > 0 && (
                          <span className="ml-2">
                            {auto.runCount} runs &bull; {auto.successCount} succes
                            {auto.failCount > 0 && <span className="text-red-500"> &bull; {auto.failCount} echecs</span>}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(auto.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title={auto.isActive ? 'Desactiver' : 'Activer'}
                    >
                      {auto.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAutomation(auto.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <SectionCard
          title="Activite recente"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)}>
              {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          }
        >
          {showLogs && (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : log.status === 'failure' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">{log.automationName}</span>
                    {log.targetEmail && <span className="text-gray-500">&rarr; {log.targetEmail}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {log.error && <span className="text-red-500 truncate max-w-48">{log.error}</span>}
                    <span>{new Date(log.createdAt).toLocaleString('fr-CA')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <FormField label="Nom">
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Email de bienvenue" />
          </FormField>
          <FormField label="Description">
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description optionnelle" rows={2} />
          </FormField>
          <FormField label="Declencheur">
            <select
              value={formTrigger}
              onChange={(e) => setFormTrigger(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            >
              {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </FormField>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Actions</label>
              <Button variant="ghost" size="sm" onClick={addAction}>
                <Plus className="w-3 h-3 mr-1" /> Ajouter
              </Button>
            </div>
            <div className="space-y-3">
              {formActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(idx, 'type', e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push</option>
                        <option value="discount">Reduction</option>
                        <option value="tag">Tag</option>
                        <option value="webhook">Webhook</option>
                      </select>
                      <Input
                        value={action.delay || ''}
                        onChange={(e) => updateAction(idx, 'delay', e.target.value)}
                        placeholder="Delai (0m, 1h, 3d)"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  {formActions.length > 1 && (
                    <button onClick={() => removeAction(idx)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSave}>
              {editingId ? 'Mettre a jour' : 'Creer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
