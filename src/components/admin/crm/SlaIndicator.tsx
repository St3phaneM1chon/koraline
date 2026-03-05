'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SlaIndicatorProps {
  deadline: string | Date | null;
  label?: string;
  compact?: boolean;
}

/**
 * SLA countdown badge — shows remaining time until SLA deadline.
 * Green (>50% remaining), Yellow (25-50%), Red (<25%), Gray (breached).
 */
export default function SlaIndicator({ deadline, label, compact = false }: SlaIndicatorProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;

    const update = () => {
      const now = Date.now();
      const diff = deadlineDate.getTime() - now;
      setRemaining(diff);
      setBreached(diff <= 0);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || remaining === null) {
    return compact ? null : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
        <Clock className="h-3 w-3" /> No SLA
      </span>
    );
  }

  const formatTime = (ms: number) => {
    const abs = Math.abs(ms);
    const hours = Math.floor(abs / 3600000);
    const minutes = Math.floor((abs % 3600000) / 60000);
    const seconds = Math.floor((abs % 60000) / 1000);

    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Calculate urgency (assume SLA was set at creation, estimate total duration)
  const getColor = () => {
    if (breached) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    if (remaining! < 900000) return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }; // <15min
    if (remaining! < 3600000) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }; // <1h
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  };

  const colors = getColor();
  const Icon = breached ? AlertTriangle : remaining! < 3600000 ? Clock : CheckCircle;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        <Icon className="h-3 w-3" />
        {breached ? '-' : ''}{formatTime(remaining!)}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
      <Icon className="h-4 w-4" />
      <div>
        {label && <span className="text-xs font-medium block">{label}</span>}
        <span className="text-sm font-mono font-bold">
          {breached ? 'BREACHED ' : ''}{breached ? '+' : ''}{formatTime(remaining!)}
        </span>
      </div>
    </div>
  );
}
