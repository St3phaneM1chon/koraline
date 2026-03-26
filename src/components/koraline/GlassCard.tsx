'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  hoverable?: boolean;
}

function GlassCard({ children, className = '', href, hoverable = true }: GlassCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const linkProps = href ? { href } : {};

  return (
    <motion.div
      whileHover={
        hoverable
          ? { scale: 1.02, y: -4, boxShadow: 'var(--k-glass-shadow-hover, 0 16px 48px rgba(0, 0, 0, 0.2))' }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-2xl overflow-hidden ${hoverable ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backdropFilter: 'blur(var(--k-glass-blur-regular, 80px))',
        WebkitBackdropFilter: 'blur(var(--k-glass-blur-regular, 80px))',
        background: 'var(--k-glass-bg, rgba(255, 255, 255, 0.06))',
        border: '1px solid var(--k-glass-border, rgba(255, 255, 255, 0.08))',
        boxShadow: 'var(--k-glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.12))',
      }}
    >
      <Wrapper {...linkProps} className={href ? 'block h-full' : undefined}>
        {children}
      </Wrapper>
    </motion.div>
  );
}

export { GlassCard };
export type { GlassCardProps };
