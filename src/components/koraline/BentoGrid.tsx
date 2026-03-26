'use client';

import { type ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: number;
}

function BentoGrid({ children, className = '', cols = 4 }: BentoGridProps) {
  return (
    <>
      <style>{`
        .k-bento-grid > [data-span="2"] { grid-column: span 2; }
        .k-bento-grid > [data-span="3"] { grid-column: span 3; }
        .k-bento-grid > [data-span="4"] { grid-column: span 4; }
        .k-bento-grid > [data-span="full"] { grid-column: 1 / -1; }
        .k-bento-grid > [data-row-span="2"] { grid-row: span 2; }
        @media (max-width: 1024px) {
          .k-bento-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .k-bento-grid > [data-span="3"],
          .k-bento-grid > [data-span="4"] { grid-column: span 2; }
        }
        @media (max-width: 640px) {
          .k-bento-grid { grid-template-columns: 1fr !important; }
          .k-bento-grid > [data-span] { grid-column: span 1; }
        }
      `}</style>
      <div
        className={`grid gap-4 k-bento-grid ${className}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </div>
    </>
  );
}

export { BentoGrid };
export type { BentoGridProps };
