'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  X,
  Flame,
  Thermometer,
  Snowflake,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';
import { addCSRFHeader } from '@/lib/csrf';

interface Contact {
  id: string;
  contactName: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  score: number;
  temperature: string;
  tags: string[];
  assignedTo?: { name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-[#6366f1]/15 text-[#818cf8]',
  CONTACTED: 'bg-yellow-500/15 text-yellow-400',
  QUALIFIED: 'bg-green-500/15 text-green-400',
  UNQUALIFIED: 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]',
  CONVERTED: 'bg-purple-500/15 text-purple-400',
  LOST: 'bg-red-500/15 text-red-400',
};

const TEMP_ICONS: Record<string, typeof Flame> = {
  HOT: Flame,
  WARM: Thermometer,
  COLD: Snowflake,
};

const TEMP_COLORS: Record<string, string> = {
  HOT: 'text-red-500',
  WARM: 'text-orange-500',
  COLD: 'text-blue-400',
};

export default function ContactsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [tempFilter, setTempFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const limit = 20;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (tempFilter) params.set('temperature', tempFilter);

      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      const json = await res.json();
      if (json.success) {
        setContacts(json.data || []);
        setTotal(json.pagination?.total || 0);
      }
    } catch {
      toast.error(t('admin.crm.contacts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sourceFilter, tempFilter, t]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--k-text-primary)]">
            {t('admin.crm.contacts.title')}
          </h1>
          <p className="text-sm text-[var(--k-text-tertiary)] mt-1">
            {total} {t('admin.crm.contacts.totalCount')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white rounded-md hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {t('admin.crm.contacts.newContact')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--k-text-muted)]" />
          <input
            type="text"
            placeholder={t('admin.crm.contacts.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full ps-9 pe-3 py-2 text-sm border border-[var(--k-border-default)] rounded-md bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-[var(--k-border-default)] rounded-md px-3 py-2 bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
        >
          <option value="">{t('admin.crm.allStatuses')}</option>
          {['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="text-sm border border-[var(--k-border-default)] rounded-md px-3 py-2 bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
        >
          <option value="">{t('admin.crm.allSources')}</option>
          {['WEB', 'REFERRAL', 'IMPORT', 'CAMPAIGN', 'MANUAL', 'PARTNER', 'EMAIL', 'SOCIAL', 'CHATBOT'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={tempFilter}
          onChange={(e) => { setTempFilter(e.target.value); setPage(1); }}
          className="text-sm border border-[var(--k-border-default)] rounded-md px-3 py-2 bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
        >
          <option value="">{t('admin.crm.allTemperatures')}</option>
          {['HOT', 'WARM', 'COLD'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--k-glass-thin)] backdrop-blur-sm rounded-lg border border-[var(--k-border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--k-glass-thin)] border-b border-[var(--k-border-subtle)]">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('admin.crm.name')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('common.email')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('common.phone')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('admin.crm.company')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('admin.crm.status')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('admin.crm.score')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('admin.crm.temperature')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-[var(--k-text-tertiary)] uppercase">
                  {t('common.createdAt')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--k-border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--k-text-muted)]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Search className="h-10 w-10 text-[var(--k-text-muted)] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[var(--k-text-tertiary)]">
                      {t('admin.crm.contacts.noContacts')}
                    </p>
                    <p className="text-xs text-[var(--k-text-muted)] mt-1">
                      {t('admin.crm.contacts.noContactsDescription')}
                    </p>
                  </td>
                </tr>
              ) : contacts.map((contact) => {
                const TempIcon = TEMP_ICONS[contact.temperature] || Thermometer;
                return (
                  <tr
                    key={contact.id}
                    className="hover:bg-[var(--k-glass-thin)] cursor-pointer"
                    onClick={() => router.push(`/admin/crm/contacts/${contact.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--k-text-primary)]">
                        {contact.contactName}
                      </div>
                      {contact.assignedTo && (
                        <div className="text-xs text-[var(--k-text-muted)]">
                          {contact.assignedTo.name || contact.assignedTo.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {contact.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-[var(--k-text-secondary)]">
                          <Mail className="h-3.5 w-3.5 text-[var(--k-text-muted)]" />
                          {contact.email}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--k-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {contact.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-[var(--k-text-secondary)]">
                          <Phone className="h-3.5 w-3.5 text-[var(--k-text-muted)]" />
                          {contact.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--k-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {contact.companyName ? (
                        <div className="flex items-center gap-1.5 text-sm text-[var(--k-text-secondary)]">
                          <Building2 className="h-3.5 w-3.5 text-[var(--k-text-muted)]" />
                          {contact.companyName}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--k-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[contact.status] || 'bg-[var(--k-glass-thin)] text-[var(--k-text-secondary)]'}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5 w-12">
                        <span className={`text-sm font-bold ${contact.score >= 70 ? 'text-green-600' : contact.score >= 40 ? 'text-amber-600' : 'text-[var(--k-text-muted)]'}`}>
                          {contact.score}
                        </span>
                        <div className="w-full h-1 bg-[var(--k-glass-thin)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${contact.score}%`,
                              backgroundColor: contact.score >= 70 ? '#10B981' : contact.score >= 40 ? '#F59E0B' : '#9CA3AF',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TempIcon className={`h-5 w-5 mx-auto ${TEMP_COLORS[contact.temperature] || 'text-[var(--k-text-muted)]'}`} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--k-text-muted)]">
                      {new Date(contact.createdAt).toLocaleDateString(locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--k-border-subtle)] bg-[var(--k-glass-thin)]">
            <p className="text-sm text-[var(--k-text-tertiary)]">
              {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} / {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-[var(--k-border-default)] rounded-md disabled:opacity-50 hover:bg-[var(--k-glass-thin)]"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-[var(--k-border-default)] rounded-md disabled:opacity-50 hover:bg-[var(--k-glass-thin)]"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <CreateContactModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchContacts(); }}
        />
      )}
    </div>
  );
}

function CreateContactModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    contactName: '',
    companyName: '',
    email: '',
    phone: '',
    source: 'MANUAL',
  });
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!form.contactName.trim()) {
      toast.error(t('admin.crm.contactName') + ' ' + t('common.required'));
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, string> = {
        contactName: form.contactName.trim(),
        source: form.source,
      };
      if (form.companyName) body.companyName = form.companyName;
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;

      const res = await fetch('/api/admin/crm/contacts', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t('admin.crm.contacts.created'));
        onCreated();
      } else {
        toast.error(json.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.networkError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-[var(--k-bg-surface)] rounded-xl shadow-xl border border-[var(--k-border-subtle)] w-full max-w-md mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-contact-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--k-border-subtle)]">
          <h2 id="create-contact-modal-title" className="text-lg font-semibold text-[var(--k-text-primary)]">
            {t('admin.crm.contacts.newContact')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--k-glass-thin)] rounded" aria-label={t('common.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">
              {t('admin.crm.contactName')} *
            </label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm(p => ({ ...p, contactName: e.target.value }))}
              className="w-full border border-[var(--k-border-default)] rounded-md px-3 py-2 text-sm bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">
              {t('admin.crm.company')}
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))}
              className="w-full border border-[var(--k-border-default)] rounded-md px-3 py-2 text-sm bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">
                {t('common.email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-[var(--k-border-default)] rounded-md px-3 py-2 text-sm bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">
                {t('common.phone')}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-[var(--k-border-default)] rounded-md px-3 py-2 text-sm bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--k-text-secondary)] mb-1">
              {t('admin.crm.source')}
            </label>
            <select
              value={form.source}
              onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))}
              className="w-full border border-[var(--k-border-default)] rounded-md px-3 py-2 text-sm bg-[var(--k-glass-thin)] text-[var(--k-text-primary)]"
            >
              {['MANUAL', 'WEB', 'REFERRAL', 'CAMPAIGN', 'PARTNER', 'EMAIL', 'SOCIAL', 'CHATBOT'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--k-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--k-text-secondary)] bg-[var(--k-glass-thin)] rounded-md hover:opacity-80"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={creating}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {creating ? '...' : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
