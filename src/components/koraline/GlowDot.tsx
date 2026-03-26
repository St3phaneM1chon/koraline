'use client';

type DotSize = 'sm' | 'md' | 'lg';

interface GlowDotProps {
  color?: string;
  size?: DotSize;
  pulse?: boolean;
  className?: string;
}

const sizePx: Record<DotSize, { dot: number; glow: number }> = {
  sm: { dot: 6, glow: 12 },
  md: { dot: 8, glow: 16 },
  lg: { dot: 12, glow: 24 },
};

function GlowDot({ color = 'var(--k-success, #34c759)', size = 'md', pulse = true, className = '' }: GlowDotProps) {
  const s = sizePx[size];

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      {pulse && (
        <span
          className="absolute animate-ping rounded-full opacity-40"
          style={{
            width: s.glow,
            height: s.glow,
            backgroundColor: color,
          }}
        />
      )}
      <span
        className="relative rounded-full"
        style={{
          width: s.dot,
          height: s.dot,
          backgroundColor: color,
          boxShadow: `0 0 ${s.glow}px ${color}`,
        }}
      />
    </span>
  );
}

export { GlowDot };
export type { GlowDotProps };
