'use client';

/**
 * PROGRESS RING — Reusable circular progress indicator
 * =====================================================
 * SVG-based ring with animated stroke-dashoffset.
 * Supports auto-coloring based on progress thresholds.
 *
 * Usage:
 *   <ProgressRing progress={75} size="md" showPercent />
 *   <ProgressRing progress={42} size="lg" color="blue" label="Quiz" />
 */

interface ProgressRingProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Ring size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Color override. "auto" derives from progress thresholds. */
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'auto';
  /** Optional text label rendered inside the ring */
  label?: string;
  /** Show numeric percentage inside the ring */
  showPercent?: boolean;
}

const SIZE_CONFIG = {
  sm: { diameter: 40, stroke: 3, fontSize: 'text-[10px]', labelSize: 'text-[8px]' },
  md: { diameter: 64, stroke: 4, fontSize: 'text-sm', labelSize: 'text-[10px]' },
  lg: { diameter: 96, stroke: 5, fontSize: 'text-lg', labelSize: 'text-xs' },
} as const;

const COLOR_MAP: Record<string, { track: string; bar: string }> = {
  green:  { track: 'stroke-green-100 dark:stroke-green-900/30',  bar: 'stroke-green-500' },
  blue:   { track: 'stroke-blue-100 dark:stroke-blue-900/30',    bar: 'stroke-blue-500' },
  yellow: { track: 'stroke-yellow-100 dark:stroke-yellow-900/30', bar: 'stroke-yellow-500' },
  red:    { track: 'stroke-red-100 dark:stroke-red-900/30',      bar: 'stroke-red-500' },
};

function resolveColor(progress: number): string {
  if (progress >= 80) return 'green';
  if (progress >= 50) return 'yellow';
  return 'red';
}

export default function ProgressRing({
  progress,
  size = 'md',
  color = 'auto',
  label,
  showPercent = false,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const resolvedColor = color === 'auto' ? resolveColor(clamped) : color;
  const { track, bar } = COLOR_MAP[resolvedColor];
  const { diameter, stroke, fontSize, labelSize } = SIZE_CONFIG[size];

  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = diameter / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: diameter, height: diameter }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : `${Math.round(clamped)}%`}
    >
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={track}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${bar} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercent && (
          <span className={`font-semibold text-gray-900 dark:text-white ${fontSize} leading-none`}>
            {Math.round(clamped)}%
          </span>
        )}
        {label && (
          <span className={`text-gray-500 dark:text-gray-400 ${labelSize} leading-tight mt-0.5 truncate max-w-[80%] text-center`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
