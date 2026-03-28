'use client';

import { useState } from 'react';
import type { ContactFormSection as ContactFormSectionType } from '@/lib/homepage-sections';

export function ContactFormRenderer({ section }: { section: ContactFormSectionType }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would POST to an API endpoint
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{
          background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="text-4xl mb-4">&#10003;</div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
        >
          Message envoy&eacute;
        </h3>
        <p style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}>
          Nous vous r&eacute;pondrons dans les plus brefs d&eacute;lais.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-8 md:p-10"
      style={{
        background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
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
          className="text-center mb-6"
          style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
        >
          {section.subtitle}
        </p>
      )}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        {(section.fields || []).map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`cf-${field.name}`}
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {field.label}
              {field.required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`cf-${field.name}`}
                name={field.name}
                required={field.required}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
                }}
              />
            ) : field.type === 'select' ? (
              <select
                id={`cf-${field.name}`}
                name={field.name}
                required={field.required}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
                }}
              >
                <option value="">--</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={`cf-${field.name}`}
                name={field.name}
                type={field.type}
                required={field.required}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
                }}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--k-accent, #6366f1)', color: '#fff' }}
        >
          {section.submitLabel || 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
