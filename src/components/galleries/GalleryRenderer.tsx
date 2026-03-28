/**
 * GalleryRenderer - Public gallery component with multiple layout options
 * Supports: grid, masonry, carousel, lightbox
 *
 * Usage:
 * <GalleryRenderer slug="my-gallery" />
 * or
 * <GalleryRenderer gallery={galleryData} images={imagesData} />
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryImage {
  id: string;
  imageUrl: string;
  title?: string | null;
  caption?: string | null;
  altText?: string | null;
  sortOrder: number;
}

interface GalleryData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  layout: string;
  columns: number;
}

interface GalleryRendererProps {
  /** Fetch gallery by slug from the public API */
  slug?: string;
  /** Provide gallery data directly */
  gallery?: GalleryData;
  /** Provide images directly */
  images?: GalleryImage[];
  /** Override layout (grid, masonry, carousel, lightbox) */
  layout?: 'grid' | 'masonry' | 'carousel' | 'lightbox';
  /** Override number of columns (1-6) */
  columns?: number;
  /** Gap between images in px */
  gap?: number;
  /** Show image titles/captions */
  showCaptions?: boolean;
  /** Enable lightbox on click */
  enableLightbox?: boolean;
  /** Custom CSS class */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GalleryRenderer({
  slug,
  gallery: initialGallery,
  images: initialImages,
  layout: overrideLayout,
  columns: overrideColumns,
  gap = 16,
  showCaptions = true,
  enableLightbox = true,
  className = '',
}: GalleryRendererProps) {
  const [gallery, setGallery] = useState<GalleryData | null>(initialGallery || null);
  const [images, setImages] = useState<GalleryImage[]>(initialImages || []);
  const [loading, setLoading] = useState(!initialGallery);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const finalLayout = overrideLayout || (gallery?.layout as 'grid' | 'masonry' | 'carousel' | 'lightbox') || 'grid';
  const finalColumns = overrideColumns || gallery?.columns || 3;

  // ---------------------------------------------------------------------------
  // Fetch from public API if slug provided
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!slug || initialGallery) return;

    const fetchGallery = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cms/${slug}`);
        if (!res.ok) {
          setError('Gallery not found');
          return;
        }
        const json = await res.json();
        if (json.success) {
          setGallery(json.data.collection);
          setImages(json.data.items.map((item: { id: string; data: Record<string, unknown> }) => ({
            id: item.id,
            ...item.data,
          })));
        }
      } catch {
        setError('Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [slug, initialGallery]);

  // ---------------------------------------------------------------------------
  // Carousel navigation
  // ---------------------------------------------------------------------------

  const scrollCarousel = useCallback((direction: 'prev' | 'next') => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
    setCarouselIndex(prev => direction === 'next' ? Math.min(prev + 1, images.length - 1) : Math.max(prev - 1, 0));
  }, [images.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === 'ArrowRight' && lightboxIndex < images.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, images.length]);

  // ---------------------------------------------------------------------------
  // Loading / Error
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  const openLightbox = enableLightbox ? (idx: number) => setLightboxIndex(idx) : undefined;

  // ---------------------------------------------------------------------------
  // Grid Layout
  // ---------------------------------------------------------------------------

  const renderGrid = () => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${finalColumns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {images.map((img, idx) => (
        <div key={img.id} className="group relative overflow-hidden rounded-xl">
          <div
            className={`aspect-square relative ${openLightbox ? 'cursor-pointer' : ''}`}
            onClick={() => openLightbox?.(idx)}
          >
            <Image
              src={img.imageUrl}
              alt={img.altText || img.title || ''}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={`(max-width: 640px) ${Math.round(100 / Math.min(finalColumns, 2))}vw, ${Math.round(100 / finalColumns)}vw`}
            />
            {openLightbox && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            )}
          </div>
          {showCaptions && (img.title || img.caption) && (
            <div className="p-3">
              {img.title && <div className="font-medium text-sm">{img.title}</div>}
              {img.caption && <div className="text-xs text-gray-500 mt-0.5">{img.caption}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Masonry Layout
  // ---------------------------------------------------------------------------

  const renderMasonry = () => {
    // Distribute images into columns
    const columnArrays: GalleryImage[][] = Array.from({ length: finalColumns }, () => []);
    images.forEach((img, idx) => {
      columnArrays[idx % finalColumns].push(img);
    });

    return (
      <div className="flex" style={{ gap: `${gap}px` }}>
        {columnArrays.map((col, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col" style={{ gap: `${gap}px` }}>
            {col.map((img) => {
              const globalIdx = images.findIndex(i => i.id === img.id);
              return (
                <div key={img.id} className="group relative overflow-hidden rounded-xl">
                  <div
                    className={`relative ${openLightbox ? 'cursor-pointer' : ''}`}
                    onClick={() => openLightbox?.(globalIdx)}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.altText || img.title || ''}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={`${Math.round(100 / finalColumns)}vw`}
                    />
                    {openLightbox && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  {showCaptions && (img.title || img.caption) && (
                    <div className="p-3">
                      {img.title && <div className="font-medium text-sm">{img.title}</div>}
                      {img.caption && <div className="text-xs text-gray-500 mt-0.5">{img.caption}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Carousel Layout
  // ---------------------------------------------------------------------------

  const renderCarousel = () => (
    <div className="relative group">
      <div
        ref={carouselRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ gap: `${gap}px`, scrollbarWidth: 'none' }}
      >
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="snap-start flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: `${Math.round(100 / Math.min(finalColumns, images.length))}%` }}
          >
            <div
              className={`aspect-[4/3] relative ${openLightbox ? 'cursor-pointer' : ''}`}
              onClick={() => openLightbox?.(idx)}
            >
              <Image
                src={img.imageUrl}
                alt={img.altText || img.title || ''}
                fill
                className="object-cover"
                sizes={`${Math.round(100 / finalColumns)}vw`}
              />
            </div>
            {showCaptions && (img.title || img.caption) && (
              <div className="p-3">
                {img.title && <div className="font-medium text-sm">{img.title}</div>}
                {img.caption && <div className="text-xs text-gray-500 mt-0.5">{img.caption}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      {images.length > finalColumns && (
        <>
          <button
            onClick={() => scrollCarousel('prev')}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollCarousel('next')}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Lightbox-only Layout (thumbnails that open lightbox)
  // ---------------------------------------------------------------------------

  const renderLightboxLayout = () => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${finalColumns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {images.map((img, idx) => (
        <div
          key={img.id}
          className="group cursor-pointer relative overflow-hidden rounded-xl"
          onClick={() => setLightboxIndex(idx)}
        >
          <div className="aspect-square relative">
            <Image
              src={img.imageUrl}
              alt={img.altText || img.title || ''}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes={`${Math.round(100 / finalColumns)}vw`}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Lightbox Overlay
  // ---------------------------------------------------------------------------

  const renderLightboxOverlay = () => {
    if (lightboxIndex === null || !images[lightboxIndex]) return null;
    const img = images[lightboxIndex];

    return (
      <div
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={() => setLightboxIndex(null)}
        role="dialog"
        aria-modal="true"
        aria-label={img.title || 'Gallery image'}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={() => setLightboxIndex(null)}
          aria-label="Close"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Prev */}
        {lightboxIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        )}

        {/* Next */}
        {lightboxIndex < images.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        )}

        {/* Image */}
        <div className="max-w-[90vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
          <Image
            src={img.imageUrl}
            alt={img.altText || img.title || ''}
            width={1400}
            height={900}
            className="object-contain max-h-[85vh] rounded-lg"
            priority
          />
          {showCaptions && (img.title || img.caption) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              {img.title && <div className="text-white font-semibold text-lg">{img.title}</div>}
              {img.caption && <div className="text-white/70 text-sm mt-1">{img.caption}</div>}
            </div>
          )}
        </div>

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {lightboxIndex + 1} / {images.length}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <div className={className}>
      {gallery?.name && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{gallery.name}</h2>
          {gallery.description && <p className="text-gray-500 mt-1">{gallery.description}</p>}
        </div>
      )}

      {finalLayout === 'grid' && renderGrid()}
      {finalLayout === 'masonry' && renderMasonry()}
      {finalLayout === 'carousel' && renderCarousel()}
      {finalLayout === 'lightbox' && renderLightboxLayout()}

      {renderLightboxOverlay()}
    </div>
  );
}
