/**
 * Koraline Motion Variants
 * Reusable Framer Motion animation variant sets.
 */

import type { Variants } from 'framer-motion';
import { duration, easing, spring } from './tokens';

// ---------------------------------------------------------------------------
// Fade
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.out } },
};

export const fadeOut: Variants = {
  visible: { opacity: 1 },
  exit:    { opacity: 0, transition: { duration: duration.fast, ease: easing.out } },
};

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------

export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.out } },
};

export const slideDown: Variants = {
  hidden:  { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.out } },
};

export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.out } },
};

export const slideRight: Variants = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.out } },
};

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { ...spring.snappy } },
};

export const scaleOut: Variants = {
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.92, transition: { duration: duration.fast, ease: easing.out } },
};

// ---------------------------------------------------------------------------
// Stagger Children
// ---------------------------------------------------------------------------

export function staggerChildren(delayPerChild = 0.06): Variants {
  return {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: delayPerChild,
        delayChildren: 0.05,
      },
    },
  };
}

/** Default stagger container (0.06s between children) */
export const staggerContainer: Variants = staggerChildren(0.06);

/** Child variant to pair with staggerContainer */
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.out } },
};

// ---------------------------------------------------------------------------
// Glass Card Hover
// ---------------------------------------------------------------------------

export const glassCardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  hover: {
    scale: 1.008,
    y: -2,
    boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.25)',
    borderColor: 'rgba(255,255,255,0.10)',
    transition: { ...spring.snappy },
  },
};

// ---------------------------------------------------------------------------
// Page Transition
// ---------------------------------------------------------------------------

export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: easing.out,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: duration.fast,
      ease: easing.out,
    },
  },
};

// ---------------------------------------------------------------------------
// Number Count (for AnimatedNumber)
// ---------------------------------------------------------------------------

export const numberCount: Variants = {
  hidden:  { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...spring.gentle },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.9,
    transition: { duration: duration.fast, ease: easing.out },
  },
};

// ---------------------------------------------------------------------------
// Pulse Glow (for status indicators)
// ---------------------------------------------------------------------------

export const pulseGlow: Variants = {
  idle: {
    opacity: 0.6,
    scale: 1,
  },
  pulse: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.15, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ---------------------------------------------------------------------------
// Spring Pop (for badges / achievements)
// ---------------------------------------------------------------------------

export const springPop: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...spring.bouncy },
  },
};
