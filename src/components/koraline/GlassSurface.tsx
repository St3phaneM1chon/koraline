'use client';

import { type ReactNode, forwardRef } from 'react';

const blurMap = {
  thin: 'var(--k-glass-blur-thin, 40px)',
  regular: 'var(--k-glass-blur-regular, 80px)',
  thick: 'var(--k-glass-blur-thick, 120px)',
} as const;

type BlurLevel = keyof typeof blurMap;
type ElementTag = 'div' | 'section' | 'aside';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
  blur?: BlurLevel;
  as?: ElementTag;
}

const GlassSurface = forwardRef<HTMLElement, GlassSurfaceProps>(
  ({ children, className = '', blur = 'regular', as: Tag = 'div' }, ref) => {
    const blurValue = blurMap[blur];

    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={`relative overflow-hidden rounded-2xl ${className}`}
        style={{
          backdropFilter: `blur(${blurValue})`,
          WebkitBackdropFilter: `blur(${blurValue})`,
          background: 'var(--k-glass-bg, rgba(255, 255, 255, 0.06))',
          border: '1px solid var(--k-glass-border, rgba(255, 255, 255, 0.08))',
          boxShadow: 'var(--k-glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.12))',
        }}
      >
        {children}
      </Tag>
    );
  }
);

GlassSurface.displayName = 'GlassSurface';
export { GlassSurface };
export type { GlassSurfaceProps };
