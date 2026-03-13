'use client';

interface SectionDividerProps {
  variant?: 'wave' | 'curve' | 'angle';
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
  className?: string;
}

export default function SectionDivider({
  variant = 'wave',
  fromColor = '#FAFAF9',
  toColor = '#FFFFFF',
  flip = false,
  className = '',
}: SectionDividerProps) {
  const transform = flip ? 'rotate(180deg)' : undefined;

  if (variant === 'angle') {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ height: 40, transform }} aria-hidden="true">
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <polygon fill={fromColor} points="0,0 1440,0 1440,40 0,0" />
          <polygon fill={toColor} points="0,0 1440,40 0,40" />
        </svg>
      </div>
    );
  }

  if (variant === 'curve') {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ height: 50, transform }} aria-hidden="true">
        <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <rect fill={fromColor} width="1440" height="50" />
          <path fill={toColor} d="M0,30 Q360,0 720,25 T1440,20 L1440,50 L0,50 Z" />
        </svg>
      </div>
    );
  }

  // wave (default)
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height: 60, transform }} aria-hidden="true">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <rect fill={fromColor} width="1440" height="60" />
        <path fill={toColor} d="M0,40 C240,60 480,10 720,35 C960,60 1200,15 1440,30 L1440,60 L0,60 Z" />
      </svg>
    </div>
  );
}
