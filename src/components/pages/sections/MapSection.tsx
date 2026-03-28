'use client';

import type { MapSection as MapSectionType } from '@/lib/homepage-sections';

export function MapRenderer({ section }: { section: MapSectionType }) {
  const height = section.height || 400;

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
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <iframe
          src={section.embedUrl}
          title={section.title || 'Map'}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
