'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/i18n/client';
import { addCSRFHeader } from '@/lib/csrf';
import { toast } from 'sonner';

interface BuyNowButtonProps {
  productId: string;
  optionId?: string;
  quantity?: number;
  /** 'primary' full-width | 'compact' for product cards */
  variant?: 'primary' | 'compact';
  className?: string;
  disabled?: boolean;
}

/**
 * G21 - Express Checkout "Buy Now" button.
 * Skips the cart entirely and sends the user straight to Stripe Checkout
 * with a single line item.
 */
export default function BuyNowButton({
  productId,
  optionId,
  quantity = 1,
  variant = 'primary',
  className = '',
  disabled = false,
}: BuyNowButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleBuyNow = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (loading || disabled) return;

      // Must be authenticated to buy
      if (!session?.user) {
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
        return;
      }

      setLoading(true);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        addCSRFHeader(headers);

        const res = await fetch('/api/checkout/express', {
          method: 'POST',
          headers,
          body: JSON.stringify({ productId, optionId, quantity }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Checkout failed');
        }

        // Redirect to Stripe hosted checkout or returned URL
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Checkout failed');
        setLoading(false);
      }
    },
    [productId, optionId, quantity, session, router, loading, disabled],
  );

  const baseClasses =
    variant === 'primary'
      ? 'w-full py-3 px-6 rounded-lg font-bold text-base transition-all'
      : 'py-2 px-4 rounded-lg font-semibold text-sm transition-all';

  const stateClasses = loading
    ? 'bg-neutral-200 text-neutral-500 cursor-wait'
    : disabled
      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
      : 'bg-black text-white hover:bg-neutral-800 active:scale-95';

  return (
    <button
      onClick={handleBuyNow}
      disabled={loading || disabled}
      aria-label={t('shop.buyNow')}
      className={`${baseClasses} ${stateClasses} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {t('common.loading') || 'Loading...'}
        </span>
      ) : (
        t('shop.buyNow')
      )}
    </button>
  );
}
