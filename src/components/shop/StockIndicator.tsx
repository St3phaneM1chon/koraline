'use client';

/**
 * #9 Product Confidence Scores / Stock Level Indicator
 * Displays In Stock / Low Stock / Out of Stock with appropriate colors.
 */

import { useI18n } from '@/i18n/client';

interface StockIndicatorProps {
  quantity: number;
  lowStockThreshold?: number;
  showQuantity?: boolean;
  compact?: boolean;
}

export default function StockIndicator({
  quantity,
  lowStockThreshold = 10,
  showQuantity = false,
  compact = false,
}: StockIndicatorProps) {
  const { t } = useI18n();

  const status = quantity <= 0
    ? 'out_of_stock'
    : quantity <= lowStockThreshold
    ? 'low_stock'
    : 'in_stock';

  const config = {
    in_stock: {
      label: t('product.inStock') || 'In Stock',
      dotColor: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '✓',
    },
    low_stock: {
      label: t('product.lowStock') || 'Low Stock',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: '⚠',
    },
    out_of_stock: {
      label: t('product.outOfStock') || 'Out of Stock',
      dotColor: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '✕',
    },
  }[status];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.textColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} aria-hidden="true" />
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
      role="status"
      aria-label={`${config.label}${showQuantity && quantity > 0 ? ` — ${quantity} ${t('product.unitsAvailable') || 'units available'}` : ''}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'low_stock' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      <span>{config.label}</span>
      {showQuantity && quantity > 0 && status === 'low_stock' && (
        <span className="text-xs opacity-75">
          ({t('product.onlyXLeft')?.replace('{count}', String(quantity)) || `Only ${quantity} left`})
        </span>
      )}
    </div>
  );
}
