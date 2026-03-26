'use client';

import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'glass' | 'gradient' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
  asChild?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  glass: {
    backdropFilter: 'blur(var(--k-glass-blur-thin, 40px))',
    WebkitBackdropFilter: 'blur(var(--k-glass-blur-thin, 40px))',
    background: 'var(--k-glass-bg, rgba(255, 255, 255, 0.06))',
    border: '1px solid var(--k-glass-border, rgba(255, 255, 255, 0.08))',
  },
  gradient: {
    background: 'var(--k-gradient-primary, linear-gradient(135deg, #6366f1, #8b5cf6))',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid var(--k-glass-border, rgba(255, 255, 255, 0.08))',
  },
};

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { children, variant = 'glass', size = 'md', icon, loading, disabled, className = '', asChild, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium rounded-xl
          text-white transition-all duration-200
          hover:brightness-110 active:scale-[0.97]
          disabled:opacity-50 disabled:pointer-events-none
          ${sizeClasses[size]}
          ${className}
        `}
        style={variantStyles[variant]}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
export { GlassButton };
export type { GlassButtonProps };
