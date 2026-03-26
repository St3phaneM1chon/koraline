'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

type GlassInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full h-10 px-4 rounded-xl text-sm
          text-[var(--k-text-primary,#fff)]
          placeholder:text-[var(--k-text-tertiary,rgba(255,255,255,0.4))]
          outline-none transition-all duration-200
          focus:ring-2 focus:ring-[var(--k-accent,#6366f1)] focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        style={{
          backdropFilter: 'blur(var(--k-glass-blur-thin, 40px))',
          WebkitBackdropFilter: 'blur(var(--k-glass-blur-thin, 40px))',
          background: 'var(--k-glass-bg-input, rgba(255, 255, 255, 0.04))',
          border: '1px solid var(--k-glass-border, rgba(255, 255, 255, 0.08))',
        }}
        {...props}
      />
    );
  }
);

GlassInput.displayName = 'GlassInput';
export { GlassInput };
export type { GlassInputProps };
