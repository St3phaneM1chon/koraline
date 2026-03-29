/**
 * CSS-only scroll animations using IntersectionObserver + CSS classes.
 * Lightweight alternative — no external dependencies (Framer Motion available but heavier).
 *
 * Usage:
 *   import { scrollAnimationClasses } from '@/lib/animations/scroll-animations';
 *   <div className={scrollAnimationClasses.fadeInUp} />
 *
 * Or use the AnimatedSection component for a declarative approach.
 */

// ── Animation CSS class definitions (Tailwind-compatible) ────

export type AnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'scaleIn'
  | 'parallax';

/**
 * Base + visible state classes for each animation type.
 * Use `base` when element is NOT visible, `visible` when it enters the viewport.
 */
export const animationStates: Record<AnimationType, { base: string; visible: string }> = {
  fadeIn: {
    base: 'opacity-0 transition-all duration-700 ease-out',
    visible: 'opacity-100',
  },
  fadeInUp: {
    base: 'opacity-0 translate-y-8 transition-all duration-700 ease-out',
    visible: 'opacity-100 translate-y-0',
  },
  fadeInDown: {
    base: 'opacity-0 -translate-y-8 transition-all duration-700 ease-out',
    visible: 'opacity-100 translate-y-0',
  },
  fadeInLeft: {
    base: 'opacity-0 -translate-x-8 transition-all duration-700 ease-out',
    visible: 'opacity-100 translate-x-0',
  },
  fadeInRight: {
    base: 'opacity-0 translate-x-8 transition-all duration-700 ease-out',
    visible: 'opacity-100 translate-x-0',
  },
  scaleIn: {
    base: 'opacity-0 scale-95 transition-all duration-700 ease-out',
    visible: 'opacity-100 scale-100',
  },
  parallax: {
    base: 'transition-transform duration-300 ease-out will-change-transform',
    visible: '',
  },
};

/**
 * Delay utility classes (applied alongside animation classes).
 */
export const animationDelays: Record<number, string> = {
  0: 'delay-0',
  100: 'delay-100',
  150: 'delay-150',
  200: 'delay-200',
  300: 'delay-300',
  500: 'delay-500',
  700: 'delay-700',
  1000: 'delay-1000',
};

/**
 * Duration overrides.
 */
export const animationDurations: Record<number, string> = {
  300: 'duration-300',
  500: 'duration-500',
  700: 'duration-700',
  1000: 'duration-1000',
  1500: 'duration-[1500ms]',
};

/**
 * Get the combined className for a scroll animation.
 * @param type The animation type
 * @param isVisible Whether the element is in the viewport
 * @param delay Optional delay in ms (from animationDelays keys)
 * @param duration Optional duration override in ms
 */
export function getScrollAnimationClass(
  type: AnimationType,
  isVisible: boolean,
  delay?: number,
  duration?: number,
): string {
  const state = animationStates[type];
  const classes = [state.base];

  if (isVisible) {
    classes.push(state.visible);
  }

  if (delay && animationDelays[delay]) {
    classes.push(animationDelays[delay]);
  }

  if (duration && animationDurations[duration]) {
    // Replace the default duration class
    const baseDurationMatch = state.base.match(/duration-\d+/);
    if (baseDurationMatch) {
      classes[0] = classes[0].replace(baseDurationMatch[0], animationDurations[duration]);
    }
  }

  return classes.join(' ');
}

/**
 * Calculate parallax offset based on scroll position.
 * Use with a scroll listener for smooth parallax effect.
 * @param scrollY Current window.scrollY
 * @param elementTop Element's offsetTop from the page
 * @param speed Parallax speed multiplier (0.1 = subtle, 0.5 = strong)
 * @returns CSS translateY value in pixels
 */
export function getParallaxOffset(
  scrollY: number,
  elementTop: number,
  speed: number = 0.15,
): number {
  return (scrollY - elementTop) * speed;
}

/**
 * Stagger children animations.
 * Returns delay values for N children to create a cascading effect.
 * @param count Number of children
 * @param baseDelay Starting delay in ms
 * @param increment Delay increment per child in ms
 */
export function getStaggerDelays(
  count: number,
  baseDelay: number = 0,
  increment: number = 100,
): number[] {
  return Array.from({ length: count }, (_, i) => baseDelay + i * increment);
}
