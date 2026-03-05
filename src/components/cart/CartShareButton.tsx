'use client';

/**
 * CartShareButton
 *
 * Renders a "Share Cart" button that, when clicked, calls POST /api/cart/share
 * to generate a JWT-based share link and copies it to the clipboard.
 *
 * Used inside the CartDrawer footer when the cart has items.
 */

import { useCartShare, type CartShareItem } from '@/hooks/useCartShare';
import { useI18n } from '@/i18n/client';

interface CartShareButtonProps {
  items: CartShareItem[];
  className?: string;
}

export default function CartShareButton({ items, className = '' }: CartShareButtonProps) {
  const { shareCart, sharing } = useCartShare();
  const { t } = useI18n();

  if (items.length === 0) return null;

  return (
    <button
      type="button"
      className={`cart-drawer__share ${className}`.trim()}
      onClick={() => shareCart(items)}
      disabled={sharing}
      aria-label={t('cart.shareCart')}
    >
      {/* Share icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
        />
      </svg>
      {sharing ? '...' : t('cart.shareCart')}
    </button>
  );
}
