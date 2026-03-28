/**
 * ADMIN - CMS Dynamic Collections Manager
 * Phase 2.4: Lightweight CMS collection system (Wix/Squarespace-style)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Database, Pencil, Trash2, Eye, EyeOff, ChevronRight,
  ArrowLeft, FileText, ToggleLeft, ToggleRight, GripVertical,
} from 'lucide-react';
import { PageHeader, Button, Modal, EmptyState, FormField, Input, Textarea, StatCard } from '@/components/admin';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldDef {
  name: string;
  type: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
}

interface CmsCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: FieldDef[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
}

interface CmsItem {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  slug: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type View = 'collections' | 'items';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'rich-text', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'image', label: 'Image URL' },
  { value: 'email', label: 'Email' },
  { value: 'color', label: 'Color' },
  { value: 'select', label: 'Select (Dropdown)' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CmsPage() {
  const { t } = useI18n();

  // State
  const [view, setView] = useState<View>('collections');
  const [collections, setCollections] = useState<CmsCollection[]>([]);
  const [items, setItems] = useState<CmsItem[]>([]);
  const [activeCollection, setActiveCollection] = useState<CmsCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Collection modal
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CmsCollection | null>(null);
  const [collectionForm, setCollectionForm] = useState({ name: '', slug: '', description: '', isActive: true });
  const [fields, setFields] = useState<FieldDef[]>([{ name: '', type: 'text', required: false }]);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsItem | null>(null);
  const [itemForm, setItemForm] = useState<Record<string, unknown>>({});
  const [itemSlug, setItemSlug] = useState('');
  const [itemPublished, setItemPublished] = useState(true);
  const [itemSortOrder, setItemSortOrder] = useState(0);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'collection' | 'item'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/collections?limit=100&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) setCollections(json.data);
    } catch (e) {
      toast.error(t('admin.cms.fetchError'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  const fetchItems = useCallback(async (collectionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/collections/${collectionId}/items?limit=200`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch (e) {
      toast.error(t('admin.cms.fetchError'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (view === 'collections') fetchCollections();
  }, [view, fetchCollections]);

  useEffect(() => {
    if (view === 'items' && activeCollection) fetchItems(activeCollection.id);
  }, [view, activeCollection, fetchItems]);

  // ---------------------------------------------------------------------------
  // Collection CRUD
  // ---------------------------------------------------------------------------

  const openCollectionModal = (c?: CmsCollection) => {
    if (c) {
      setEditingCollection(c);
      setCollectionForm({ name: c.name, slug: c.slug, description: c.description || '', isActive: c.isActive });
      setFields(c.fields.length > 0 ? c.fields : [{ name: '', type: 'text', required: false }]);
    } else {
      setEditingCollection(null);
      setCollectionForm({ name: '', slug: '', description: '', isActive: true });
      setFields([{ name: '', type: 'text', required: false }]);
    }
    setShowCollectionModal(true);
  };

  const saveCollection = async () => {
    const validFields = fields.filter(f => f.name.trim());
    if (validFields.length === 0) {
      toast.error(t('admin.cms.atLeastOneField'));
      return;
    }
    setSaving(true);
    try {
      const method = editingCollection ? 'PUT' : 'POST';
      const payload = editingCollection
        ? { id: editingCollection.id, ...collectionForm, fields: validFields }
        : { ...collectionForm, fields: validFields };

      const res = await fetch('/api/admin/cms/collections', {
        method,
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingCollection ? t('admin.cms.collectionUpdated') : t('admin.cms.collectionCreated'));
        setShowCollectionModal(false);
        fetchCollections();
      } else {
        toast.error(json.error?.message || 'Error');
      }
    } catch (e) {
      toast.error('Network error');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async () => {
    if (!deleteTarget || deleteTarget.type !== 'collection') return;
    try {
      const res = await fetch(`/api/admin/cms/collections?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: addCSRFHeader(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t('admin.cms.collectionDeleted'));
        fetchCollections();
      } else {
        toast.error(json.error?.message || 'Error');
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Item CRUD
  // ---------------------------------------------------------------------------

  const openItemModal = (item?: CmsItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm(item.data || {});
      setItemSlug(item.slug || '');
      setItemPublished(item.isPublished);
      setItemSortOrder(item.sortOrder);
    } else {
      setEditingItem(null);
      setItemForm({});
      setItemSlug('');
      setItemPublished(true);
      setItemSortOrder(0);
    }
    setShowItemModal(true);
  };

  const saveItem = async () => {
    if (!activeCollection) return;
    setSaving(true);
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const payload = editingItem
        ? { itemId: editingItem.id, data: itemForm, slug: itemSlug || null, isPublished: itemPublished, sortOrder: itemSortOrder }
        : { data: itemForm, slug: itemSlug || null, isPublished: itemPublished, sortOrder: itemSortOrder };

      const res = await fetch(`/api/admin/cms/collections/${activeCollection.id}/items`, {
        method,
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingItem ? t('admin.cms.itemUpdated') : t('admin.cms.itemCreated'));
        setShowItemModal(false);
        fetchItems(activeCollection.id);
      } else {
        toast.error(json.error?.message || 'Error');
      }
    } catch (e) {
      toast.error('Network error');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget || deleteTarget.type !== 'item' || !activeCollection) return;
    try {
      const res = await fetch(`/api/admin/cms/collections/${activeCollection.id}/items?itemId=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: addCSRFHeader(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t('admin.cms.itemDeleted'));
        fetchItems(activeCollection.id);
      } else {
        toast.error(json.error?.message || 'Error');
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Field builder helpers
  // ---------------------------------------------------------------------------

  const addField = () => setFields(prev => [...prev, { name: '', type: 'text', required: false }]);
  const removeField = (idx: number) => setFields(prev => prev.filter((_, i) => i !== idx));
  const updateField = (idx: number, key: keyof FieldDef, value: unknown) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  // Auto-generate slug from name
  const autoSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  // ---------------------------------------------------------------------------
  // Render: Collections List
  // ---------------------------------------------------------------------------

  const renderCollections = () => (
    <>
      <PageHeader
        title={t('admin.cms.title')}
        subtitle={t('admin.cms.subtitle')}
        actions={<Button icon={Plus} onClick={() => openCollectionModal()}>{t('admin.cms.newCollection')}</Button>}
      />

      <div className="px-6 py-4">
        <input
          type="text"
          placeholder={t('admin.cms.searchCollections')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {/* Stats */}
      <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('admin.cms.totalCollections')} value={collections.length} icon={Database} />
        <StatCard label={t('admin.cms.activeCollections')} value={collections.filter(c => c.isActive).length} icon={ToggleRight} />
        <StatCard label={t('admin.cms.totalItems')} value={collections.reduce((sum, c) => sum + c._count.items, 0)} icon={FileText} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={Database}
          title={t('admin.cms.noCollections')}
          description={t('admin.cms.noCollectionsDescription')}
          action={<Button icon={Plus} onClick={() => openCollectionModal()}>{t('admin.cms.newCollection')}</Button>}
        />
      ) : (
        <div className="px-6 space-y-3">
          {collections.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
              onClick={() => { setActiveCollection(c); setView('items'); }}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                    {!c.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        {t('admin.cms.inactive')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    /{c.slug} &middot; {c.fields.length} {t('admin.cms.fields')} &middot; {c._count.items} {t('admin.cms.items')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openCollectionModal(c); }}
                  className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  title={t('common.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'collection', id: c.id, name: c.name }); }}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Items List
  // ---------------------------------------------------------------------------

  const renderItems = () => {
    if (!activeCollection) return null;
    const collectionFields = activeCollection.fields || [];

    return (
      <>
        <PageHeader
          title={activeCollection.name}
          subtitle={`${activeCollection._count.items} ${t('admin.cms.items')} &middot; /${activeCollection.slug}`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => { setView('collections'); setActiveCollection(null); }}>
                {t('admin.cms.backToCollections')}
              </Button>
              <Button icon={Plus} onClick={() => openItemModal()}>
                {t('admin.cms.newItem')}
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('admin.cms.noItems')}
            description={t('admin.cms.noItemsDescription')}
            action={<Button icon={Plus} onClick={() => openItemModal()}>{t('admin.cms.newItem')}</Button>}
          />
        ) : (
          <div className="px-6">
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">#</th>
                    {collectionFields.slice(0, 4).map(f => (
                      <th key={f.name} className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{f.name}</th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">{t('admin.cms.status')}</th>
                    <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">{t('admin.cms.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-tertiary)]">{idx + 1}</td>
                      {collectionFields.slice(0, 4).map(f => (
                        <td key={f.name} className="px-4 py-3 text-[var(--text-primary)] max-w-[200px] truncate">
                          {String(item.data[f.name] ?? '')}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {item.isPublished ? (
                          <span className="inline-flex items-center gap-1 text-green-600"><Eye className="h-3.5 w-3.5" /> {t('admin.cms.published')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]"><EyeOff className="h-3.5 w-3.5" /> {t('admin.cms.draft')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openItemModal(item)} className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.slug || `Item #${idx + 1}` })} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Collection Modal (field schema builder)
  // ---------------------------------------------------------------------------

  const renderCollectionModal = () => (
    <Modal
      isOpen={showCollectionModal}
      onClose={() => setShowCollectionModal(false)}
      title={editingCollection ? t('admin.cms.editCollection') : t('admin.cms.newCollection')}
      size="lg"
    >
      <div className="space-y-4">
        <FormField label={t('admin.cms.collectionName')}>
          <Input
            value={collectionForm.name}
            onChange={(e) => {
              const name = e.target.value;
              setCollectionForm(prev => ({
                ...prev,
                name,
                slug: !editingCollection ? autoSlug(name) : prev.slug,
              }));
            }}
            placeholder="e.g. Team Members"
          />
        </FormField>

        <FormField label={t('admin.cms.collectionSlug')}>
          <Input
            value={collectionForm.slug}
            onChange={(e) => setCollectionForm(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="e.g. team-members"
          />
        </FormField>

        <FormField label={t('admin.cms.collectionDescription')}>
          <Textarea
            value={collectionForm.description}
            onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
        </FormField>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollectionForm(prev => ({ ...prev, isActive: !prev.isActive }))}
            className="text-[var(--text-secondary)]"
          >
            {collectionForm.isActive ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t('admin.cms.active')}</span>
        </div>

        {/* Field Schema Builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[var(--text-primary)]">{t('admin.cms.fieldSchema')}</span>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addField}>{t('admin.cms.addField')}</Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
                <GripVertical className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                  placeholder={t('admin.cms.fieldName')}
                  className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(idx, 'type', e.target.value)}
                  className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {FIELD_TYPES.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                  />
                  {t('admin.cms.required')}
                </label>
                {fields.length > 1 && (
                  <button onClick={() => removeField(idx)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={() => setShowCollectionModal(false)}>{t('common.cancel')}</Button>
          <Button onClick={saveCollection} disabled={saving}>
            {saving ? t('common.saving') : (editingCollection ? t('common.save') : t('common.create'))}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // ---------------------------------------------------------------------------
  // Render: Item Modal (dynamic fields from collection schema)
  // ---------------------------------------------------------------------------

  const renderItemModal = () => {
    if (!activeCollection) return null;
    const collectionFields = activeCollection.fields || [];

    return (
      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItem ? t('admin.cms.editItem') : t('admin.cms.newItem')}
        size="lg"
      >
        <div className="space-y-4">
          {collectionFields.map(field => (
            <FormField key={field.name} label={`${field.name}${field.required ? ' *' : ''}`}>
              {field.type === 'textarea' || field.type === 'rich-text' ? (
                <Textarea
                  value={String(itemForm[field.name] || '')}
                  onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  rows={field.type === 'rich-text' ? 6 : 3}
                />
              ) : field.type === 'boolean' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(itemForm[field.name])}
                    onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.checked }))}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{field.name}</span>
                </label>
              ) : field.type === 'select' ? (
                <select
                  value={String(itemForm[field.name] || '')}
                  onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                >
                  <option value="">{t('admin.cms.selectOption')}</option>
                  {(field.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'number' ? (
                <Input
                  type="number"
                  value={String(itemForm[field.name] || '')}
                  onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value ? Number(e.target.value) : '' }))}
                />
              ) : field.type === 'date' ? (
                <Input
                  type="date"
                  value={String(itemForm[field.name] || '')}
                  onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                />
              ) : field.type === 'color' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={String(itemForm[field.name] || '#000000')}
                    onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="h-9 w-12 rounded border border-[var(--border)] cursor-pointer"
                  />
                  <Input
                    value={String(itemForm[field.name] || '')}
                    onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              ) : (
                <Input
                  type={field.type === 'email' ? 'email' : field.type === 'url' || field.type === 'image' ? 'url' : 'text'}
                  value={String(itemForm[field.name] || '')}
                  onChange={(e) => setItemForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                />
              )}
            </FormField>
          ))}

          <div className="border-t border-[var(--border)] pt-4 space-y-4">
            <FormField label={t('admin.cms.itemSlug')}>
              <Input
                value={itemSlug}
                onChange={(e) => setItemSlug(e.target.value)}
                placeholder={t('admin.cms.itemSlugPlaceholder')}
              />
            </FormField>

            <div className="flex items-center gap-4">
              <FormField label={t('admin.cms.sortOrder')}>
                <Input
                  type="number"
                  value={String(itemSortOrder)}
                  onChange={(e) => setItemSortOrder(Number(e.target.value) || 0)}
                  className="w-24"
                />
              </FormField>
              <label className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={itemPublished} onChange={(e) => setItemPublished(e.target.checked)} />
                <span className="text-sm text-[var(--text-secondary)]">{t('admin.cms.published')}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveItem} disabled={saving}>
              {saving ? t('common.saving') : (editingItem ? t('common.save') : t('common.create'))}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-0">
      {view === 'collections' ? renderCollections() : renderItems()}
      {renderCollectionModal()}
      {renderItemModal()}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteTarget?.type === 'collection' ? deleteCollection : deleteItem}
        title={t('admin.cms.confirmDelete')}
        message={`${t('admin.cms.confirmDeleteMessage')} "${deleteTarget?.name}"?`}
        confirmLabel={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}
