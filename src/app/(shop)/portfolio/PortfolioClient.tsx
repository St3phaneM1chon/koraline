'use client';

/**
 * G29 - Portfolio Client Component
 * Masonry grid with category filter, lightbox, and responsive layout.
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  altText: string | null;
  category: string;
  gallerySlug: string;
}

interface PortfolioClientProps {
  items: PortfolioItem[];
  categories: string[];
}

export default function PortfolioClient({ items, categories }: PortfolioClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = activeCategory ? items.filter((i) => i.category === activeCategory) : items;

  // Distribute into 3 columns for masonry
  const columns: PortfolioItem[][] = [[], [], []];
  filtered.forEach((item, idx) => {
    columns[idx % 3].push(item);
  });

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === 'ArrowRight' && lightboxIndex < filtered.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filtered.length]);

  const openLightbox = useCallback(
    (itemId: string) => {
      const idx = filtered.findIndex((i) => i.id === itemId);
      if (idx >= 0) setLightboxIndex(idx);
    },
    [filtered],
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <h1 className="text-4xl font-bold text-neutral-900">Portfolio</h1>
        <p className="text-lg text-neutral-600 mt-2">
          Browse our projects and creative work.
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Masonry Grid */}
      {filtered.length === 0 ? (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-neutral-500">
          <p className="text-lg">No portfolio items yet.</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex gap-4">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-4">
                {col.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-xl cursor-pointer"
                    onClick={() => openLightbox(item.id)}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.altText || item.title || 'Portfolio image'}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      {item.title && (
                        <span className="mt-2 text-white font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                          {item.title}
                        </span>
                      )}
                    </div>
                    {/* Category badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={filtered[lightboxIndex].title || 'Portfolio image'}
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
          {lightboxIndex < filtered.length - 1 && (
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
              src={filtered[lightboxIndex].imageUrl}
              alt={filtered[lightboxIndex].altText || filtered[lightboxIndex].title || ''}
              width={1400}
              height={900}
              className="object-contain max-h-[85vh] rounded-lg"
              priority
            />
            {(filtered[lightboxIndex].title || filtered[lightboxIndex].caption) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                {filtered[lightboxIndex].title && (
                  <div className="text-white font-semibold text-lg">{filtered[lightboxIndex].title}</div>
                )}
                {filtered[lightboxIndex].caption && (
                  <div className="text-white/70 text-sm mt-1">{filtered[lightboxIndex].caption}</div>
                )}
                <div className="text-white/50 text-xs mt-2">{filtered[lightboxIndex].category}</div>
              </div>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {filtered.length}
          </div>
        </div>
      )}
    </div>
  );
}
