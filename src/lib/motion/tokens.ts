/**
 * Koraline Motion Tokens
 * Centralized animation constants for Framer Motion.
 */

// ---------------------------------------------------------------------------
// Spring Configurations
// ---------------------------------------------------------------------------

export interface SpringConfig {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
}

export const spring = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 },
  gentle: { type: 'spring' as const, stiffness: 120, damping: 20, mass: 1 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 15, mass: 0.8 },
  stiff:  { type: 'spring' as const, stiffness: 600, damping: 40, mass: 0.6 },
} as const satisfies Record<string, SpringConfig>;

// ---------------------------------------------------------------------------
// Duration Constants (seconds)
// ---------------------------------------------------------------------------

export const duration = {
  instant:   0.1,
  fast:      0.2,
  normal:    0.3,
  slow:      0.5,
  cinematic: 0.8,
} as const;

export type DurationKey = keyof typeof duration;

// ---------------------------------------------------------------------------
// Easing Curves (cubic-bezier tuples)
// ---------------------------------------------------------------------------

export type EasingTuple = [number, number, number, number];

export const easing = {
  /** Quick deceleration — great for entrances */
  out:    [0.16, 1, 0.3, 1]   as EasingTuple,
  /** Symmetric ease — good for layout shifts */
  inOut:  [0.4, 0, 0.2, 1]    as EasingTuple,
  /** Subtle spring feel via bezier approximation */
  spring: [0.34, 1.56, 0.64, 1] as EasingTuple,
} as const;

// ---------------------------------------------------------------------------
// Composite Transition Presets
// ---------------------------------------------------------------------------

export const transition = {
  snappy:    { ...spring.snappy },
  gentle:    { ...spring.gentle },
  fast:      { duration: duration.fast,      ease: easing.out },
  normal:    { duration: duration.normal,    ease: easing.out },
  slow:      { duration: duration.slow,      ease: easing.inOut },
  cinematic: { duration: duration.cinematic, ease: easing.inOut },
} as const;
