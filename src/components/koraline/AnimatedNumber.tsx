'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

function AnimatedNumber({ value, duration = 1.2, format, className = '' }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    return format ? format(latest) : Math.round(latest).toLocaleString();
  });
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });
    prevValue.current = value;
    return controls.stop;
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

export { AnimatedNumber };
export type { AnimatedNumberProps };
