'use client';

import { type ReactNode } from 'react';

type TextTag = 'h1' | 'h2' | 'h3' | 'p' | 'span';

interface GradientTextProps {
  children: ReactNode;
  gradient?: string;
  as?: TextTag;
  className?: string;
}

function GradientText({
  children,
  gradient,
  as: Tag = 'span',
  className = '',
}: GradientTextProps) {
  return (
    <Tag
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: gradient || 'var(--k-gradient-brand, linear-gradient(135deg, #6366f1, #a855f7, #ec4899))',
      }}
    >
      {children}
    </Tag>
  );
}

export { GradientText };
export type { GradientTextProps };
