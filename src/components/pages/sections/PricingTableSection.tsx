'use client';

import Link from 'next/link';
import type { PricingTableSection as PricingTableSectionType } from '@/lib/homepage-sections';

export function PricingTableRenderer({ section }: { section: PricingTableSectionType }) {
  return (
    <div>
      {section.title && (
        <h2
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
        >
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p
          className="text-center mb-8"
          style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
        >
          {section.subtitle}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(section.plans || []).map((plan, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: plan.highlighted
                ? 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.12) 100%)'
                : 'var(--k-glass-regular, rgba(255,255,255,0.08))',
              border: plan.highlighted
                ? '2px solid rgba(99,102,241,0.40)'
                : '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {plan.highlighted && (
              <span
                className="text-[10px] uppercase font-bold tracking-wider mb-3 self-start px-2 py-0.5 rounded"
                style={{ background: 'var(--k-accent, #6366f1)', color: '#fff' }}
              >
                Populaire
              </span>
            )}
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {plan.name}
            </h3>
            <div className="flex items-end gap-1 mb-4">
              <span
                className="text-3xl font-bold"
                style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span
                  className="text-sm mb-1"
                  style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
                >
                  {plan.period}
                </span>
              )}
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {(plan.features || []).map((feat, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.70))' }}
                >
                  <span className="mt-0.5 text-emerald-400">&#10003;</span>
                  {feat}
                </li>
              ))}
            </ul>
            {plan.ctaLabel && plan.ctaHref && (
              <Link
                href={plan.ctaHref}
                className="block text-center px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{
                  background: plan.highlighted ? 'var(--k-accent, #6366f1)' : 'rgba(255,255,255,0.10)',
                  color: '#fff',
                }}
              >
                {plan.ctaLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
