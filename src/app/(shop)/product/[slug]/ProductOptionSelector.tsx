'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { useI18n } from '@/i18n/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getOptionIcon } from '@/lib/option-icons';

interface ProductOption {
  id: string;
  name: string;
  nameKey?: string;
  type: string;
  dosageMg?: number;
  price: number;
  comparePrice?: number;
  sku: string;
  inStock: boolean;
  stockQuantity: number;
  image?: string;
}

interface ProductOptionSelectorProps {
  productName: string;
  selectedFormat: ProductOption;
  availableOptions: ProductOption[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onFormatSelect: (format: ProductOption) => void;
  getOptionName: (format: ProductOption) => string;
}

export default function ProductOptionSelector({
  productName,
  selectedFormat,
  availableOptions,
  isDropdownOpen,
  setIsDropdownOpen,
  onFormatSelect,
  getOptionName,
}: ProductOptionSelectorProps) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsDropdownOpen]);

  return (
    <div className="mb-6 relative" ref={dropdownRef}>
      <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
        {t('shop.packaging')}:
      </label>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label={`Select format for ${productName}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 border-2 border-neutral-300 rounded-lg bg-white hover:border-primary-400 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {getOptionIcon(selectedFormat?.type)}
          </span>
          <div className="text-start">
            <p className="font-semibold text-black">
              {getOptionName(selectedFormat)}
            </p>
            <p className="text-sm text-primary-600 font-bold">
              {formatPrice(selectedFormat.price)}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-50 top-full inset-x-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto" role="listbox" aria-label={t('shop.aria.availableOptions')}>
          {availableOptions.map((format) => (
            <button
              key={format.id}
              role="option"
              aria-selected={selectedFormat.id === format.id}
              onClick={() => onFormatSelect(format)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors border-b border-neutral-100 last:border-b-0 ${
                selectedFormat.id === format.id
                  ? 'bg-primary-50'
                  : format.inStock
                  ? 'hover:bg-neutral-50'
                  : 'opacity-50 bg-neutral-50 hover:bg-neutral-100'
              }`}
            >
              {/* Format Icon */}
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                {format.image ? (
                  <Image src={format.image} alt={getOptionName(format)} width={48} height={48} className="object-cover rounded-lg" />
                ) : (
                  <span className="text-2xl">{getOptionIcon(format.type)}</span>
                )}
              </div>

              {/* Format Info */}
              <div className="flex-1">
                <p className="font-medium text-black">{getOptionName(format)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-primary-600 font-bold">{formatPrice(format.price)}</span>
                  {format.comparePrice && format.comparePrice > format.price && (
                    <span className="text-sm text-neutral-400 line-through">{formatPrice(format.comparePrice)}</span>
                  )}
                </div>
                {!format.inStock && (
                  <span className="text-xs text-red-500">{t('shop.outOfStock')}</span>
                )}
                {format.inStock && format.stockQuantity <= 10 && (
                  <span className="text-xs text-amber-600">{t('shop.onlyLeft')} {format.stockQuantity} {t('shop.left')}</span>
                )}
              </div>

              {/* Selected Check */}
              {selectedFormat.id === format.id && (
                <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
