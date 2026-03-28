'use client';

import type { TextImageSection as TextImageSectionType } from '@/lib/homepage-sections';

export function TextImageRenderer({ section }: { section: TextImageSectionType }) {
  const isLeft = section.layout === 'image_left';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className={`flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-0`}>
        {/* Image */}
        <div className="md:w-1/2 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={section.imageUrl}
            alt={section.imageAlt || section.title || ''}
            className="w-full h-full object-cover"
            style={{ minHeight: '280px' }}
            loading="lazy"
          />
        </div>

        {/* Text */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          {section.title && (
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {section.title}
            </h2>
          )}
          <div
            className="prose prose-invert max-w-none"
            style={{
              color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
              lineHeight: '1.8',
            }}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </div>
      </div>
    </div>
  );
}
