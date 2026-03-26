'use client';

import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface GlassBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  glow?: boolean;
  className?: string;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; glow: string }> = {
  default: {
    bg: 'rgba(255, 255, 255, 0.08)',
    text: 'var(--k-text-secondary, rgba(255, 255, 255, 0.7))',
    glow: 'rgba(255, 255, 255, 0.15)',
  },
  success: {
    bg: 'rgba(52, 199, 89, 0.15)',
    text: 'var(--k-success, #34c759)',
    glow: 'rgba(52, 199, 89, 0.3)',
  },
  warning: {
    bg: 'rgba(255, 149, 0, 0.15)',
    text: 'var(--k-warning, #ff9500)',
    glow: 'rgba(255, 149, 0, 0.3)',
  },
  error: {
    bg: 'rgba(255, 56, 60, 0.15)',
    text: 'var(--k-error, #ff383c)',
    glow: 'rgba(255, 56, 60, 0.3)',
  },
  info: {
    bg: 'rgba(0, 122, 255, 0.15)',
    text: 'var(--k-info, #007aff)',
    glow: 'rgba(0, 122, 255, 0.3)',
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

function GlassBadge({ children, variant = 'default', size = 'sm', glow = false, className = '' }: GlassBadgeProps) {
  const colors = variantColors[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${sizeClasses[size]} ${className}`}
      style={{
        background: colors.bg,
        color: colors.text,
        boxShadow: glow ? `0 0 12px ${colors.glow}` : undefined,
      }}
    >
      {children}
    </span>
  );
}

export { GlassBadge };
export type { GlassBadgeProps };
