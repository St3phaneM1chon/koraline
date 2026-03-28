'use client';

import type { GallerySection as GallerySectionType } from '@/lib/homepage-sections';

const colsClass: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
};

export function GalleryRenderer({ section }: { section: GallerySectionType }) {
  const cols = section.columns || 3;

  return (
    <div>
      {section.title && (
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
        >
          {section.title}
        </h2>
      )}
      <div className={`grid ${colsClass[cols] || colsClass[3]} gap-4`}>
        {(section.images || []).map((img, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden group"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || ''}
              className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {img.caption && (
              <p
                className="text-center py-2 px-3 text-sm"
                style={{
                  background: 'var(--k-glass-thin, rgba(255,255,255,0.05))',
                  color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))',
                }}
              >
                {img.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
