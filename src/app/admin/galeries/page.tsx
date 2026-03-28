/**
 * ADMIN - Gallery / Portfolio Manager
 * Phase 2.5: Image gallery system with grid/masonry/carousel/lightbox layouts
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Plus, ImageIcon, Pencil, Trash2, ArrowLeft, ChevronRight,
  Grid3X3, LayoutGrid, Columns, Maximize,
} from 'lucide-react';
import { PageHeader, Button, Modal, EmptyState, FormField, Input, Textarea, StatCard } from '@/components/admin';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';
import { addCSRFHeader } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  layout: string;
  columns: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { images: number };
}

interface GalleryImageType {
  id: string;
  galleryId: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type View = 'galleries' | 'images';

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: Grid3X3 },
  { value: 'masonry', label: 'Masonry', icon: LayoutGrid },
  { value: 'carousel', label: 'Carousel', icon: Columns },
  { value: 'lightbox', label: 'Lightbox', icon: Maximize },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GaleriesPage() {
  const { t } = useI18n();

  // State
  const [view, setView] = useState<View>('galleries');
  const [galleries, setGalleries] = useState<GalleryType[]>([]);
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [activeGallery, setActiveGallery] = useState<GalleryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Gallery modal
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryType | null>(null);
  const [galleryForm, setGalleryForm] = useState({ name: '', slug: '', description: '', layout: 'grid', columns: 3, isActive: true });

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImageType | null>(null);
  const [imageForm, setImageForm] = useState({ imageUrl: '', title: '', caption: '', altText: '', sortOrder: 0 });

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'gallery' | 'image'; id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchGalleries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/galleries?limit=100&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) setGalleries(json.data);
    } catch (e) {
      toast.error(t('admin.galleries.fetchError'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  const fetchImages = useCallback(async (galleryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}/images`);
      const json = await res.json();
      if (json.success) {
        setImages(json.data.images || []);
        // Update active gallery with fresh data
        if (json.data.gallery) {
          setActiveGallery(prev => prev ? { ...prev, ...json.data.gallery } : prev);
        }
      }
    } catch (e) {
      toast.error(t('admin.galleries.fetchError'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (view === 'galleries') fetchGalleries();
  }, [view, fetchGalleries]);

  useEffect(() => {
    if (view === 'images' && activeGallery) fetchImages(activeGallery.id);
  }, [view, activeGallery, fetchImages]);

  // ---------------------------------------------------------------------------
  // Gallery CRUD
  // ---------------------------------------------------------------------------

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openGalleryModal = (g?: GalleryType) => {
    if (g) {
      setEditingGallery(g);
      setGalleryForm({ name: g.name, slug: g.slug, description: g.description || '', layout: g.layout, columns: g.columns, isActive: g.isActive });
    } else {
      setEditingGallery(null);
      setGalleryForm({ name: '', slug: '', description: '', layout: 'grid', columns: 3, isActive: true });
    }
    setShowGalleryModal(true);
  };

  const saveGallery = async () => {
    setSaving(true);
    try {
      const method = editingGallery ? 'PUT' : 'POST';
      const payload = editingGallery
        ? { id: editingGallery.id, ...galleryForm }
        : galleryForm;

      const res = await fetch('/api/admin/galleries', {
        method,
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingGallery ? t('admin.galleries.galleryUpdated') : t('admin.galleries.galleryCreated'));
        setShowGalleryModal(false);
        fetchGalleries();
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

  const deleteGallery = async () => {
    if (!deleteTarget || deleteTarget.type !== 'gallery') return;
    try {
      const res = await fetch(`/api/admin/galleries?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: addCSRFHeader(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t('admin.galleries.galleryDeleted'));
        fetchGalleries();
      } else {
        toast.error(json.error?.message || 'Error');
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Image CRUD
  // ---------------------------------------------------------------------------

  const openImageModal = (img?: GalleryImageType) => {
    if (img) {
      setEditingImage(img);
      setImageForm({ imageUrl: img.imageUrl, title: img.title || '', caption: img.caption || '', altText: img.altText || '', sortOrder: img.sortOrder });
    } else {
      setEditingImage(null);
      setImageForm({ imageUrl: '', title: '', caption: '', altText: '', sortOrder: 0 });
    }
    setShowImageModal(true);
  };

  const saveImage = async () => {
    if (!activeGallery) return;
    if (!imageForm.imageUrl) {
      toast.error(t('admin.galleries.imageRequired'));
      return;
    }
    setSaving(true);
    try {
      const method = editingImage ? 'PUT' : 'POST';
      const payload = editingImage
        ? { imageId: editingImage.id, ...imageForm }
        : imageForm;

      const res = await fetch(`/api/admin/galleries/${activeGallery.id}/images`, {
        method,
        headers: { 'Content-Type': 'application/json', ...addCSRFHeader() },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingImage ? t('admin.galleries.imageUpdated') : t('admin.galleries.imageAdded'));
        setShowImageModal(false);
        fetchImages(activeGallery.id);
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

  const deleteImage = async () => {
    if (!deleteTarget || deleteTarget.type !== 'image' || !activeGallery) return;
    try {
      const res = await fetch(`/api/admin/galleries/${activeGallery.id}/images?imageId=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: addCSRFHeader(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t('admin.galleries.imageRemoved'));
        fetchImages(activeGallery.id);
      } else {
        toast.error(json.error?.message || 'Error');
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Galleries List
  // ---------------------------------------------------------------------------

  const renderGalleries = () => (
    <>
      <PageHeader
        title={t('admin.galleries.title')}
        subtitle={t('admin.galleries.subtitle')}
        actions={<Button icon={Plus} onClick={() => openGalleryModal()}>{t('admin.galleries.newGallery')}</Button>}
      />

      <div className="px-6 py-4">
        <input
          type="text"
          placeholder={t('admin.galleries.searchGalleries')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('admin.galleries.totalGalleries')} value={galleries.length} icon={ImageIcon} />
        <StatCard label={t('admin.galleries.activeGalleries')} value={galleries.filter(g => g.isActive).length} icon={Grid3X3} />
        <StatCard label={t('admin.galleries.totalImages')} value={galleries.reduce((sum, g) => sum + g._count.images, 0)} icon={Plus} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : galleries.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={t('admin.galleries.noGalleries')}
          description={t('admin.galleries.noGalleriesDescription')}
          action={<Button icon={Plus} onClick={() => openGalleryModal()}>{t('admin.galleries.newGallery')}</Button>}
        />
      ) : (
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {galleries.map(g => {
            const layoutIcon = LAYOUT_OPTIONS.find(l => l.value === g.layout);
            const LayoutIcon = layoutIcon?.icon || Grid3X3;
            return (
              <div
                key={g.id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                onClick={() => { setActiveGallery(g); setView('images'); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <LayoutIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{g.name}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">/{g.slug}</div>
                    </div>
                  </div>
                  {!g.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {t('admin.galleries.inactive')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                  <span>{g._count.images} {t('admin.galleries.images')}</span>
                  <span>{layoutIcon?.label || g.layout}</span>
                  <span>{g.columns} {t('admin.galleries.cols')}</span>
                </div>

                {g.description && (
                  <p className="text-sm text-[var(--text-tertiary)] mb-3 line-clamp-2">{g.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openGalleryModal(g); }}
                      className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'gallery', id: g.id, name: g.name }); }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Images Grid
  // ---------------------------------------------------------------------------

  const renderImages = () => {
    if (!activeGallery) return null;

    return (
      <>
        <PageHeader
          title={activeGallery.name}
          subtitle={`${images.length} ${t('admin.galleries.images')} / ${activeGallery.layout} / ${activeGallery.columns} ${t('admin.galleries.cols')}`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => { setView('galleries'); setActiveGallery(null); }}>
                {t('admin.galleries.backToGalleries')}
              </Button>
              <Button icon={Plus} onClick={() => openImageModal()}>
                {t('admin.galleries.addImage')}
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={t('admin.galleries.noImages')}
            description={t('admin.galleries.noImagesDescription')}
            action={<Button icon={Plus} onClick={() => openImageModal()}>{t('admin.galleries.addImage')}</Button>}
          />
        ) : (
          <div className="px-6">
            <div className={`grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(activeGallery.columns + 1, 6)}`}>
              {images.map((img, idx) => (
                <div key={img.id} className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div className="aspect-square relative cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                    <Image
                      src={img.imageUrl}
                      alt={img.altText || img.title || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Maximize className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3">
                    {img.title && <div className="font-medium text-sm text-[var(--text-primary)] truncate">{img.title}</div>}
                    {img.caption && <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{img.caption}</div>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[var(--text-tertiary)]">#{img.sortOrder}</span>
                      <div className="flex gap-1">
                        <button onClick={() => openImageModal(img)} className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ type: 'image', id: img.id, name: img.title || 'Image' })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && images[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl"
              onClick={() => setLightboxIndex(null)}
            >
              &times;
            </button>
            {lightboxIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl px-3"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                &lsaquo;
              </button>
            )}
            {lightboxIndex < images.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl px-3"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                &rsaquo;
              </button>
            )}
            <div className="max-w-[90vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[lightboxIndex].imageUrl}
                alt={images[lightboxIndex].altText || ''}
                width={1200}
                height={800}
                className="object-contain max-h-[85vh] rounded-lg"
              />
              {(images[lightboxIndex].title || images[lightboxIndex].caption) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                  {images[lightboxIndex].title && <div className="text-white font-semibold">{images[lightboxIndex].title}</div>}
                  {images[lightboxIndex].caption && <div className="text-white/70 text-sm mt-1">{images[lightboxIndex].caption}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Gallery Modal
  // ---------------------------------------------------------------------------

  const renderGalleryModal = () => (
    <Modal
      isOpen={showGalleryModal}
      onClose={() => setShowGalleryModal(false)}
      title={editingGallery ? t('admin.galleries.editGallery') : t('admin.galleries.newGallery')}
      size="lg"
    >
      <div className="space-y-4">
        <FormField label={t('admin.galleries.galleryName')}>
          <Input
            value={galleryForm.name}
            onChange={(e) => {
              const name = e.target.value;
              setGalleryForm(prev => ({
                ...prev,
                name,
                slug: !editingGallery ? autoSlug(name) : prev.slug,
              }));
            }}
            placeholder="e.g. Product Showcase"
          />
        </FormField>

        <FormField label={t('admin.galleries.gallerySlug')}>
          <Input
            value={galleryForm.slug}
            onChange={(e) => setGalleryForm(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="e.g. product-showcase"
          />
        </FormField>

        <FormField label={t('admin.galleries.description')}>
          <Textarea
            value={galleryForm.description}
            onChange={(e) => setGalleryForm(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
        </FormField>

        <FormField label={t('admin.galleries.layout')}>
          <div className="grid grid-cols-4 gap-2">
            {LAYOUT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setGalleryForm(prev => ({ ...prev, layout: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    galleryForm.layout === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label={t('admin.galleries.columns')}>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setGalleryForm(prev => ({ ...prev, columns: n }))}
                className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                  galleryForm.columns === n
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </FormField>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={() => setShowGalleryModal(false)}>{t('common.cancel')}</Button>
          <Button onClick={saveGallery} disabled={saving}>
            {saving ? t('common.saving') : (editingGallery ? t('common.save') : t('common.create'))}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // ---------------------------------------------------------------------------
  // Render: Image Modal
  // ---------------------------------------------------------------------------

  const renderImageModal = () => (
    <Modal
      isOpen={showImageModal}
      onClose={() => setShowImageModal(false)}
      title={editingImage ? t('admin.galleries.editImage') : t('admin.galleries.addImage')}
      size="lg"
    >
      <div className="space-y-4">
        <FormField label={t('admin.galleries.imageUrl')}>
          <div className="space-y-2">
            <Input
              value={imageForm.imageUrl}
              onChange={(e) => setImageForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
            {imageForm.imageUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[var(--border)]">
                <Image
                  src={imageForm.imageUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </FormField>

        <FormField label={t('admin.galleries.imageTitle')}>
          <Input
            value={imageForm.title}
            onChange={(e) => setImageForm(prev => ({ ...prev, title: e.target.value }))}
          />
        </FormField>

        <FormField label={t('admin.galleries.imageCaption')}>
          <Textarea
            value={imageForm.caption}
            onChange={(e) => setImageForm(prev => ({ ...prev, caption: e.target.value }))}
            rows={2}
          />
        </FormField>

        <FormField label={t('admin.galleries.altText')}>
          <Input
            value={imageForm.altText}
            onChange={(e) => setImageForm(prev => ({ ...prev, altText: e.target.value }))}
            placeholder={t('admin.galleries.altTextPlaceholder')}
          />
        </FormField>

        <FormField label={t('admin.galleries.sortOrder')}>
          <Input
            type="number"
            value={String(imageForm.sortOrder)}
            onChange={(e) => setImageForm(prev => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
            className="w-24"
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>{t('common.cancel')}</Button>
          <Button onClick={saveImage} disabled={saving}>
            {saving ? t('common.saving') : (editingImage ? t('common.save') : t('common.create'))}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-0">
      {view === 'galleries' ? renderGalleries() : renderImages()}
      {renderGalleryModal()}
      {renderImageModal()}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteTarget?.type === 'gallery' ? deleteGallery : deleteImage}
        title={t('admin.galleries.confirmDelete')}
        message={`${t('admin.galleries.confirmDeleteMessage')} "${deleteTarget?.name}"?`}
        confirmLabel={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}
