'use client';

import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

type Animation = 'fadeIn' | 'slideUp' | 'scaleIn' | 'stagger';

interface MotionDivProps {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
}

const presets: Record<Animation, { variants: Variants; initial: string; animate: string }> = {
  fadeIn: {
    variants: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    initial: 'hidden',
    animate: 'visible',
  },
  slideUp: {
    variants: {
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0 },
    },
    initial: 'hidden',
    animate: 'visible',
  },
  scaleIn: {
    variants: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
    initial: 'hidden',
    animate: 'visible',
  },
  stagger: {
    variants: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
      },
    },
    initial: 'hidden',
    animate: 'visible',
  },
};

function MotionDiv({ children, animation = 'fadeIn', delay = 0, className = '' }: MotionDivProps) {
  const preset = presets[animation];

  return (
    <motion.div
      variants={preset.variants}
      initial={preset.initial}
      animate={preset.animate}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { MotionDiv };
export type { MotionDivProps };
