'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

export type ProvinceCode = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

interface ProvinceSelectorProps {
  value?: string | null;
  onChange: (code: ProvinceCode) => void;
  label?: string;
  description?: string;
  /** Compact mode for widget inline use */
  compact?: boolean;
}

const PROVINCES: { code: ProvinceCode; name: string; nameFr: string }[] = [
  { code: 'AB', name: 'Alberta', nameFr: 'Alberta' },
  { code: 'BC', name: 'British Columbia', nameFr: 'Colombie-Britannique' },
  { code: 'MB', name: 'Manitoba', nameFr: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick', nameFr: 'Nouveau-Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador', nameFr: 'Terre-Neuve-et-Labrador' },
  { code: 'NS', name: 'Nova Scotia', nameFr: 'Nouvelle-Ecosse' },
  { code: 'NT', name: 'Northwest Territories', nameFr: 'Territoires du Nord-Ouest' },
  { code: 'NU', name: 'Nunavut', nameFr: 'Nunavut' },
  { code: 'ON', name: 'Ontario', nameFr: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island', nameFr: 'Ile-du-Prince-Edouard' },
  { code: 'QC', name: 'Quebec', nameFr: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan', nameFr: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon', nameFr: 'Yukon' },
];

export default function ProvinceSelector({
  value,
  onChange,
  label,
  description,
  compact = false,
}: ProvinceSelectorProps) {
  const { t, locale } = useTranslations();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return PROVINCES;
    const lower = search.toLowerCase();
    return PROVINCES.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.nameFr.toLowerCase().includes(lower) ||
        p.code.toLowerCase().includes(lower)
    );
  }, [search]);

  const isFr = locale === 'fr';

  if (compact) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as ProvinceCode)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        aria-label={label || t('learn.preferences.provinceLabel')}
      >
        <option value="">{t('learn.preferences.selectProvince')}</option>
        {PROVINCES.map((p) => (
          <option key={p.code} value={p.code}>
            {isFr ? p.nameFr : p.name} ({p.code})
          </option>
        ))}
      </select>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}

      {/* Search input */}
      <div className="relative mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('learn.preferences.searchProvince')}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('learn.preferences.searchProvince')}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Province grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {filtered.map((p) => {
          const isSelected = value === p.code;
          return (
            <button
              key={p.code}
              onClick={() => onChange(p.code)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              aria-pressed={isSelected}
            >
              <span className="font-mono text-xs text-gray-400 w-5">{p.code}</span>
              <span className="truncate">{isFr ? p.nameFr : p.name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-400 py-4">
            {t('common.noResults')}
          </p>
        )}
      </div>
    </div>
  );
}
