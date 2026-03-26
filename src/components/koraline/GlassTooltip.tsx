'use client';

import { type ReactNode } from 'react';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface GlassTooltipProps {
  content: string;
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
}

const sidePositions: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowSide: Record<TooltipSide, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[rgba(255,255,255,0.08)]',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[rgba(255,255,255,0.08)]',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[rgba(255,255,255,0.08)]',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[rgba(255,255,255,0.08)]',
};

function GlassTooltip({ content, children, side = 'top', className = '' }: GlassTooltipProps) {
  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span
        className={`
          absolute z-50 pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          ${sidePositions[side]}
        `}
      >
        <span
          className="block px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
          style={{
            backdropFilter: 'blur(var(--k-glass-blur-thick, 120px))',
            WebkitBackdropFilter: 'blur(var(--k-glass-blur-thick, 120px))',
            background: 'var(--k-glass-bg-tooltip, rgba(30, 30, 30, 0.9))',
            border: '1px solid var(--k-glass-border, rgba(255, 255, 255, 0.08))',
            color: 'var(--k-text-primary, #fff)',
            boxShadow: 'var(--k-glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.12))',
          }}
        >
          {content}
        </span>
        <span className={`absolute w-0 h-0 border-4 ${arrowSide[side]}`} />
      </span>
    </span>
  );
}

export { GlassTooltip };
export type { GlassTooltipProps };
