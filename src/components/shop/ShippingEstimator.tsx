'use client';

/**
 * #10 Live Shipping Calculator
 * Shows estimated shipping cost in cart sidebar based on country/province.
 * Uses existing shipping calculator from lib/shipping/calculator.ts
 */

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/client';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ShippingEstimatorProps {
  subtotal: number;
}

interface ShippingEstimate {
  cost: number;
  method: string;
  estimatedDays: string;
  freeShipping: boolean;
  freeThreshold: number;
}

export default function ShippingEstimator({ subtotal }: ShippingEstimatorProps) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const [country, setCountry] = useState('CA');
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Calculate shipping estimate based on country and subtotal
    const zones: Record<string, { flatRate: number; freeThreshold: number; estimatedDays: string; method: string }> = {
      CA: { flatRate: 9.99, freeThreshold: 100, estimatedDays: '3-5', method: 'Standard' },
      US: { flatRate: 14.99, freeThreshold: 200, estimatedDays: '5-10', method: 'Standard' },
      INTL: { flatRate: 24.99, freeThreshold: 500, estimatedDays: '10-20', method: 'International' },
    };

    const zone = zones[country] || zones.INTL;
    const freeShipping = subtotal >= zone.freeThreshold;

    setEstimate({
      cost: freeShipping ? 0 : zone.flatRate,
      method: zone.method,
      estimatedDays: zone.estimatedDays,
      freeShipping,
      freeThreshold: zone.freeThreshold,
    });
  }, [country, subtotal]);

  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {t('cart.estimateShipping') || 'Estimate Shipping'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="shipping-country" className="text-xs font-medium text-gray-500 block mb-1">
              {t('checkout.country') || 'Country'}
            </label>
            <select
              id="shipping-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="CA">🇨🇦 Canada</option>
              <option value="US">🇺🇸 United States</option>
              <option value="INTL">🌍 International</option>
            </select>
          </div>

          {estimate && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{estimate.method}</span>
                <span className={`font-medium ${estimate.freeShipping ? 'text-green-600' : 'text-gray-900'}`}>
                  {estimate.freeShipping
                    ? (t('cart.freeShipping') || 'FREE')
                    : formatPrice(estimate.cost)
                  }
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t('cart.estimatedDelivery')?.replace('{days}', estimate.estimatedDays)
                  || `Estimated ${estimate.estimatedDays} business days`}
              </p>
              {!estimate.freeShipping && (
                <p className="text-xs text-primary-600">
                  {t('cart.freeShippingAt')?.replace('{amount}', formatPrice(estimate.freeThreshold))
                    || `Free shipping on orders over ${formatPrice(estimate.freeThreshold)}`}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
