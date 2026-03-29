'use client';

/**
 * Admin Events Management Page
 * Builds on top of the booking module.
 * CRUD for events + registration management.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, Search, Edit, Trash2, Users, MapPin,
  Video, Clock, DollarSign, CheckCircle,
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

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  startDate: string;
  endDate: string;
  maxAttendees: number | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { registrations: number };
}

const emptyForm = {
  title: '',
  description: '',
  location: '',
  isOnline: false,
  meetingUrl: '',
  startDate: '',
  endDate: '',
  maxAttendees: '',
  price: '0',
  imageUrl: '',
  isActive: true,
};

// ── Main Component ────────────────────────────────────────────

export default function EvenementsPage() {
  const { t, formatCurrency } = useI18n();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    eventId: string;
    title: string;
  }>({ isOpen: false, eventId: '', title: '' });

  // ─── Data Fetching ──────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchValue) params.set('search', searchValue);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetchWithRetry(`/api/admin/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [searchValue, statusFilter, t]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ─── Computed Stats ─────────────────────────────────────────

  const now = new Date();
  const upcomingCount = events.filter(e => new Date(e.startDate) > now).length;
  const totalRegistrations = events.reduce((sum, e) => sum + e._count.registrations, 0);
  const activeCount = events.filter(e => e.isActive).length;

  // ─── Form Handlers ─────────────────────────────────────────

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowFormModal(true);
  };

  const openEdit = (event: EventData) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      isOnline: event.isOnline,
      meetingUrl: event.meetingUrl || '',
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      maxAttendees: event.maxAttendees?.toString() || '',
      price: Number(event.price).toString(),
      imageUrl: event.imageUrl || '',
      isActive: event.isActive,
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error(t('admin.events.requiredFields'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editingEvent ? { id: editingEvent.id } : {}),
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        isOnline: form.isOnline,
        meetingUrl: form.isOnline && form.meetingUrl ? form.meetingUrl : null,
        startDate: form.startDate,
        endDate: form.endDate,
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : null,
        price: parseFloat(form.price) || 0,
        imageUrl: form.imageUrl || null,
        isActive: form.isActive,
      };

      const res = await fetch('/api/admin/events', {
        method: editingEvent ? 'PATCH' : 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingEvent ? t('admin.events.updated') : t('admin.events.created'));
        setShowFormModal(false);
        fetchEvents();
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

  const handleDelete = async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/events?id=${eventId}`, {
        method: 'DELETE',
        headers: addCSRFHeader({}),
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        toast.success(t('admin.events.deleted'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setConfirmDelete({ isOpen: false, eventId: '', title: '' });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.events.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('admin.events.subtitle')}
          </p>
        </div>
        <Button onClick={openCreate} icon={Plus}>
          {t('admin.events.createEvent')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('admin.events.upcoming')}
          value={upcomingCount.toString()}
          icon={Calendar}
        />
        <StatCard
          label={t('admin.events.totalRegistrations')}
          value={totalRegistrations.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label={t('admin.events.activeEvents')}
          value={activeCount.toString()}
          icon={CheckCircle}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('admin.events.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'upcoming', 'past'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {t(`admin.events.filter${s.charAt(0).toUpperCase() + s.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('admin.events.emptyTitle')}
          description={t('admin.events.emptyDescription')}
        />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const isPast = new Date(event.endDate) < now;
            const isFull = event.maxAttendees ? event._count.registrations >= event.maxAttendees : false;

            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all hover:shadow-md ${
                  isPast
                    ? 'border-gray-200 dark:border-gray-700 opacity-70'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {event.title}
                      </h3>
                      {!event.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded text-xs">
                          {t('common.inactive')}
                        </span>
                      )}
                      {isPast && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded text-xs">
                          {t('admin.events.past')}
                        </span>
                      )}
                      {isFull && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded text-xs">
                          {t('admin.events.full')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </span>
                      {event.isOnline ? (
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" />
                          {t('admin.events.online')}
                        </span>
                      ) : event.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {event._count.registrations}{event.maxAttendees ? `/${event.maxAttendees}` : ''} {t('admin.events.registrations')}
                      </span>
                      {Number(event.price) > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatCurrency(Number(event.price))}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(event)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ isOpen: true, eventId: event.id, title: event.title })}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingEvent ? t('admin.events.editEvent') : t('admin.events.createEvent')}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <FormField label={t('admin.events.fieldTitle')} required>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('admin.events.fieldTitlePlaceholder')}
            />
          </FormField>

          <FormField label={t('admin.events.fieldDescription')}>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('admin.events.fieldDescriptionPlaceholder')}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('admin.events.fieldStartDate')} required>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </FormField>
            <FormField label={t('admin.events.fieldEndDate')} required>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOnline}
                onChange={(e) => setForm(prev => ({ ...prev, isOnline: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.events.fieldIsOnline')}</span>
            </label>
          </div>

          {form.isOnline ? (
            <FormField label={t('admin.events.fieldMeetingUrl')}>
              <Input
                value={form.meetingUrl}
                onChange={(e) => setForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </FormField>
          ) : (
            <FormField label={t('admin.events.fieldLocation')}>
              <Input
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('admin.events.fieldLocationPlaceholder')}
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('admin.events.fieldMaxAttendees')}>
              <Input
                type="number"
                value={form.maxAttendees}
                onChange={(e) => setForm(prev => ({ ...prev, maxAttendees: e.target.value }))}
                placeholder={t('admin.events.fieldUnlimited')}
                min="1"
              />
            </FormField>
            <FormField label={t('admin.events.fieldPrice')}>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </FormField>
          </div>

          <FormField label={t('admin.events.fieldImageUrl')}>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
          </FormField>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.events.fieldIsActive')}</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingEvent ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title={t('admin.events.deleteTitle')}
        message={t('admin.events.deleteMessage', { title: confirmDelete.title })}
        variant="danger"
        onConfirm={() => handleDelete(confirmDelete.eventId)}
        onCancel={() => setConfirmDelete({ isOpen: false, eventId: '', title: '' })}
      />
    </div>
  );
}
