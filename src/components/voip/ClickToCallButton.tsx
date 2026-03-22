'use client';

/**
 * ClickToCallButton — Reusable click-to-call button for CRM, contacts, orders, etc.
 *
 * Usage:
 *   <ClickToCallButton phoneNumber="+15145551234" />
 *   <ClickToCallButton phoneNumber="+15145551234" contactName="Jean Dupont" variant="button" />
 *   <ClickToCallButton phoneNumber="+15145551234" size="lg" />
 */

import { useState } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { addCSRFHeader } from '@/lib/csrf';

interface ClickToCallButtonProps {
  /** Phone number in E.164 format (e.g. +15145551234) */
  phoneNumber: string;
  /** Contact name for tooltip display */
  contactName?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant: icon-only circle or full button with label */
  variant?: 'icon' | 'button';
  /** Additional CSS classes */
  className?: string;
}

export function ClickToCallButton({
  phoneNumber,
  contactName,
  size = 'sm',
  variant = 'icon',
  className = '',
}: ClickToCallButtonProps) {
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCall = async () => {
    if (!phoneNumber || calling) return;

    setCalling(true);
    setError(null);

    try {
      const res = await fetch('/api/voip/click-to-call', {
        method: 'POST',
        headers: addCSRFHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ to: phoneNumber }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Call failed' }));
        throw new Error(data.error || 'Call failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Call failed';
      setError(msg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setCalling(false);
    }
  };

  const sizeClasses: Record<string, string> = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes: Record<string, number> = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const title = error
    || (contactName ? `Appeler ${contactName}` : `Appeler ${phoneNumber}`);

  if (variant === 'button') {
    return (
      <button
        onClick={handleCall}
        disabled={calling || !phoneNumber}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg
          ${calling
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        title={title}
      >
        {calling ? (
          <Loader2 size={iconSizes[size]} className="animate-spin" />
        ) : error ? (
          <PhoneOff size={iconSizes[size]} />
        ) : (
          <Phone size={iconSizes[size]} />
        )}
        {calling ? 'Appel...' : error ? 'Erreur' : 'Appeler'}
      </button>
    );
  }

  return (
    <button
      onClick={handleCall}
      disabled={calling || !phoneNumber}
      className={`inline-flex items-center justify-center rounded-full
        ${calling
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          : error
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        ${sizeClasses[size]} ${className}`}
      title={title}
    >
      {calling ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : error ? (
        <PhoneOff size={iconSizes[size]} />
      ) : (
        <Phone size={iconSizes[size]} />
      )}
    </button>
  );
}
