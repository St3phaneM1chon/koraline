'use client';

/**
 * AnimatedSection — Wrapper component for scroll-triggered animations.
 * Uses IntersectionObserver (via useIntersectionObserver hook) + CSS classes.
 * No external animation library needed (lightweight, performant).
 *
 * Usage:
 *   <AnimatedSection animation="fadeInUp" delay={200}>
 *     <h2>Content fades in when scrolled into view</h2>
 *   </AnimatedSection>
 *
 *   <AnimatedSection animation="scaleIn" stagger={3} staggerIncrement={150}>
 *     <Card /><Card /><Card />  // Each card animates with increasing delay
 *   </AnimatedSection>
 */

import React, { Children, cloneElement, isValidElement } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import {
  type AnimationType,
  getScrollAnimationClass,
  getStaggerDelays,
} from '@/lib/animations/scroll-animations';

interface AnimatedSectionProps {
  /** The animation type to apply */
  animation?: AnimationType;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Duration override (ms) */
  duration?: number;
  /** IntersectionObserver threshold (0-1) */
  threshold?: number;
  /** Only animate once (default: true) */
  triggerOnce?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** HTML element type to render (default: div) */
  as?: keyof JSX.IntrinsicElements;
  /** If set, children are staggered with N items */
  stagger?: number;
  /** Delay increment between staggered items (ms, default: 100) */
  staggerIncrement?: number;
  /** React children */
  children: React.ReactNode;
}

export default function AnimatedSection({
  animation = 'fadeInUp',
  delay = 0,
  duration,
  threshold = 0.15,
  triggerOnce = true,
  className = '',
  as: Tag = 'div',
  stagger,
  staggerIncrement = 100,
  children,
}: AnimatedSectionProps) {
  const [ref, isVisible] = useIntersectionObserver({ threshold, triggerOnce });

  // Stagger mode: wrap each child with its own delay
  if (stagger && stagger > 0) {
    const childArray = Children.toArray(children);
    const delays = getStaggerDelays(childArray.length, delay, staggerIncrement);

    return (
      // @ts-expect-error - dynamic tag type
      <Tag ref={ref} className={className}>
        {childArray.map((child, index) => {
          if (!isValidElement(child)) return child;

          const staggerClass = getScrollAnimationClass(
            animation,
            isVisible,
            delays[index],
            duration,
          );

          return cloneElement(child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, {
            className: `${(child.props as { className?: string }).className || ''} ${staggerClass}`.trim(),
            style: {
              ...((child.props as { style?: React.CSSProperties }).style || {}),
              transitionDelay: isVisible ? `${delays[index]}ms` : '0ms',
            },
          });
        })}
      </Tag>
    );
  }

  // Standard mode: animate the whole section
  const animClass = getScrollAnimationClass(animation, isVisible, delay, duration);
  const delayStyle = delay > 0 ? { transitionDelay: isVisible ? `${delay}ms` : '0ms' } : undefined;

  return (
    <Tag
      ref={ref}
      className={`${animClass} ${className}`.trim()}
      style={delayStyle}
    >
      {children}
    </Tag>
  );
}
