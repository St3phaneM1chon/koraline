'use client';

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-3 bg-white/10 rounded-xl mb-4">
        <Icon className="w-8 h-8 text-[var(--k-text-muted)]" />
      </div>
      <h3 className="text-sm font-medium text-[var(--k-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--k-text-secondary)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
