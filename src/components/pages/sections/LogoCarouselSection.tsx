'use client';

import type { LogoCarouselSection as LogoCarouselSectionType } from '@/lib/homepage-sections';

const speedDuration: Record<string, string> = {
  slow: '40s',
  normal: '25s',
  fast: '15s',
};

export function LogoCarouselRenderer({ section }: { section: LogoCarouselSectionType }) {
  const duration = speedDuration[section.speed || 'normal'] || speedDuration.normal;
  const logos = section.logos || [];
  // Duplicate logos for seamless loop
  const allLogos = [...logos, ...logos];

  return (
    <div>
      {section.title && (
        <h2
          className="text-2xl font-bold mb-8 text-center"
          style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
        >
          {section.title}
        </h2>
      )}
      <div className="overflow-hidden relative">
        {/* Fade edges */}
        <div
          className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, var(--k-bg, #0a0a0f), transparent)' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, var(--k-bg, #0a0a0f), transparent)' }}
        />
        <div
          className="flex items-center gap-12 py-4"
          style={{
            animation: `pagebuilder-scroll ${duration} linear infinite`,
            width: 'max-content',
          }}
        >
          {allLogos.map((logo, i) => {
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.url}
                alt={logo.alt}
                className="h-10 md:h-12 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            );
            if (logo.href) {
              return (
                <a key={i} href={logo.href} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  {img}
                </a>
              );
            }
            return <div key={i} className="flex-shrink-0">{img}</div>;
          })}
        </div>
        <style>{`
          @keyframes pagebuilder-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </div>
  );
}
