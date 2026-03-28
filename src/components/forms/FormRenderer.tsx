'use client';

/**
 * FormRenderer — Public-facing dynamic form renderer.
 * Renders a form from its JSON field definitions (from FormDefinition.fields).
 * Supports: text, email, phone, number, textarea, select, radio, checkbox,
 *           date, file, hidden, rating (1-5 stars).
 * Client-side validation + submit with loading state + success/error messages.
 */

import { useState, useCallback } from 'react';
import { Loader2, Star, CheckCircle, AlertCircle } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FormFieldDefinition {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'hidden' | 'rating';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
  defaultValue?: string;
  helpText?: string;
  width?: 'full' | 'half';
}

export interface FormRendererProps {
  formId?: string;
  slug?: string;
  name?: string;
  description?: string;
  fields: FormFieldDefinition[];
  settings?: {
    successMessage?: string;
    redirectUrl?: string;
  };
  /** Override submit action (defaults to POST /api/forms/[slug]) */
  onSubmit?: (data: Record<string, string>) => Promise<{ success: boolean; message?: string; redirectUrl?: string }>;
  /** Visual variant */
  variant?: 'default' | 'glass';
  className?: string;
}

// ── Styles ───────────────────────────────────────────────────────

const inputBase = `
  w-full px-4 py-2.5 rounded-xl text-sm transition-all
  border border-slate-200 bg-white text-slate-900 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500
`;

const inputError = 'border-red-300 focus:ring-red-500 focus:border-red-500';

const glassInput = `
  w-full px-4 py-2.5 rounded-xl text-sm transition-all
  focus:outline-none focus:ring-2 focus:ring-indigo-400
`;

// ── Client-side validation ───────────────────────────────────────

function validateField(field: FormFieldDefinition, value: string): string | null {
  const v = value.trim();

  if (field.required && !v && field.type !== 'checkbox') {
    return `${field.label} est requis`;
  }

  if (!v && field.type !== 'checkbox') return null;

  if (field.type === 'email' && v) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Adresse courriel invalide';
  }

  if (field.type === 'phone' && v) {
    if (!/^[+]?[\d\s()-]{7,20}$/.test(v)) return 'Numéro de téléphone invalide';
  }

  if (field.type === 'number' && v) {
    const num = Number(v);
    if (isNaN(num)) return 'Doit être un nombre';
    if (field.validation?.min !== undefined && num < field.validation.min) return `Minimum: ${field.validation.min}`;
    if (field.validation?.max !== undefined && num > field.validation.max) return `Maximum: ${field.validation.max}`;
  }

  if (field.type === 'rating' && v) {
    const r = Number(v);
    if (isNaN(r) || r < 1 || r > 5) return 'Évaluation entre 1 et 5';
  }

  if (field.validation && v) {
    if (field.validation.minLength && v.length < field.validation.minLength) {
      return `Minimum ${field.validation.minLength} caractères`;
    }
    if (field.validation.maxLength && v.length > field.validation.maxLength) {
      return `Maximum ${field.validation.maxLength} caractères`;
    }
    if (field.validation.pattern) {
      try {
        if (!new RegExp(field.validation.pattern).test(v)) {
          return field.validation.patternMessage || 'Format invalide';
        }
      } catch { /* ignore */ }
    }
  }

  return null;
}

// ── Rating Stars Sub-component ───────────────────────────────────

function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          role="radio"
          aria-checked={value === star}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function FormRenderer({
  slug,
  name,
  description,
  fields,
  settings,
  onSubmit,
  variant = 'default',
  className = '',
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const f of fields) {
      if (f.defaultValue) defaults[f.id] = f.defaultValue;
      else if (f.type === 'checkbox') defaults[f.id] = '';
      else defaults[f.id] = '';
    }
    return defaults;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const isGlass = variant === 'glass';

  const handleChange = useCallback((fieldId: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === 'hidden') continue;
      const err = validateField(field, values[field.id] || '');
      if (err) newErrors[field.id] = err;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstId = Object.keys(newErrors)[0];
      const el = document.getElementById(`ff-${firstId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    try {
      let result: { success: boolean; message?: string; redirectUrl?: string };

      if (onSubmit) {
        result = await onSubmit(values);
      } else if (slug) {
        const res = await fetch(`/api/forms/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: values }),
        });
        result = await res.json();
        if (!res.ok) {
          const errData = result as unknown as { error?: string; fieldErrors?: Record<string, string> };
          if (errData.fieldErrors) {
            setErrors(errData.fieldErrors);
            setSubmitting(false);
            return;
          }
          throw new Error(errData.error || 'Submission failed');
        }
      } else {
        throw new Error('No slug or onSubmit handler provided');
      }

      if (result.success !== false) {
        setSuccessMessage(result.message || settings?.successMessage || 'Merci pour votre soumission !');
        setSubmitted(true);
        if (result.redirectUrl) {
          setTimeout(() => {
            window.location.href = result.redirectUrl!;
          }, 1500);
        }
      } else {
        setSubmitError(result.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }, [fields, values, slug, onSubmit, settings]);

  // ── Success state ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className={`rounded-2xl p-10 text-center ${className}`}
        style={isGlass ? {
          background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        } : undefined}
      >
        <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${isGlass ? 'text-emerald-400' : 'text-emerald-500'}`} />
        <h3
          className="text-xl font-semibold mb-2"
          style={isGlass ? { color: 'var(--k-text-primary, rgba(255,255,255,0.95))' } : undefined}
        >
          {successMessage}
        </h3>
      </div>
    );
  }

  // ── Field renderer ─────────────────────────────────────────────
  const renderField = (field: FormFieldDefinition) => {
    if (field.type === 'hidden') {
      return <input type="hidden" name={field.id} value={values[field.id] || ''} />;
    }

    const hasError = !!errors[field.id];
    const inputStyle = isGlass ? {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
    } : undefined;
    const inputCls = isGlass
      ? `${glassInput} ${hasError ? 'ring-2 ring-red-400' : ''}`
      : `${inputBase} ${hasError ? inputError : ''}`;

    const widthCls = field.width === 'half' ? 'w-full md:w-[calc(50%-0.5rem)]' : 'w-full';

    return (
      <div key={field.id} className={`${widthCls}`} id={`ff-${field.id}`}>
        <label
          htmlFor={`f-${field.id}`}
          className={`block text-sm font-medium mb-1.5 ${
            isGlass ? '' : 'text-slate-700 dark:text-slate-300'
          }`}
          style={isGlass ? { color: 'var(--k-text-primary, rgba(255,255,255,0.95))' } : undefined}
        >
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>

        {/* Text/Email/Phone/Number/Date */}
        {['text', 'email', 'phone', 'number', 'date'].includes(field.type) && (
          <input
            id={`f-${field.id}`}
            name={field.id}
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            required={field.required}
            value={values[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={inputCls}
            style={inputStyle}
            disabled={submitting}
            aria-invalid={hasError}
            aria-describedby={hasError ? `err-${field.id}` : undefined}
          />
        )}

        {/* Textarea */}
        {field.type === 'textarea' && (
          <textarea
            id={`f-${field.id}`}
            name={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={values[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={`${inputCls} resize-y`}
            style={inputStyle}
            rows={4}
            disabled={submitting}
            aria-invalid={hasError}
            aria-describedby={hasError ? `err-${field.id}` : undefined}
          />
        )}

        {/* Select */}
        {field.type === 'select' && (
          <select
            id={`f-${field.id}`}
            name={field.id}
            required={field.required}
            value={values[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={inputCls}
            style={inputStyle}
            disabled={submitting}
            aria-invalid={hasError}
          >
            <option value="">{field.placeholder || '-- Sélectionner --'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Radio */}
        {field.type === 'radio' && (
          <div className="flex flex-wrap gap-3 mt-1" role="radiogroup" aria-label={field.label}>
            {(field.options || []).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 text-sm cursor-pointer ${
                  isGlass ? '' : 'text-slate-700 dark:text-slate-300'
                }`}
                style={isGlass ? { color: 'var(--k-text-primary, rgba(255,255,255,0.95))' } : undefined}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={values[field.id] === opt.value}
                  onChange={() => handleChange(field.id, opt.value)}
                  disabled={submitting}
                  className="accent-indigo-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {/* Checkbox */}
        {field.type === 'checkbox' && (
          <label
            className={`flex items-center gap-2 text-sm cursor-pointer mt-1 ${
              isGlass ? '' : 'text-slate-700 dark:text-slate-300'
            }`}
            style={isGlass ? { color: 'var(--k-text-primary, rgba(255,255,255,0.95))' } : undefined}
          >
            <input
              type="checkbox"
              name={field.id}
              checked={values[field.id] === 'true'}
              onChange={(e) => handleChange(field.id, e.target.checked ? 'true' : '')}
              disabled={submitting}
              className="accent-indigo-600 w-4 h-4"
            />
            {field.placeholder || field.label}
          </label>
        )}

        {/* File */}
        {field.type === 'file' && (
          <input
            id={`f-${field.id}`}
            name={field.id}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleChange(field.id, file ? file.name : '');
            }}
            className={`${inputCls} py-1.5`}
            style={inputStyle}
            disabled={submitting}
            aria-invalid={hasError}
          />
        )}

        {/* Rating */}
        {field.type === 'rating' && (
          <RatingInput
            value={Number(values[field.id]) || 0}
            onChange={(v) => handleChange(field.id, String(v))}
            disabled={submitting}
          />
        )}

        {/* Help text */}
        {field.helpText && !hasError && (
          <p
            className={`text-xs mt-1 ${isGlass ? 'opacity-50' : 'text-slate-400'}`}
            style={isGlass ? { color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' } : undefined}
          >
            {field.helpText}
          </p>
        )}

        {/* Error */}
        {hasError && (
          <p id={`err-${field.id}`} role="alert" className="text-xs text-red-500 mt-1">
            {errors[field.id]}
          </p>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      className={`rounded-2xl p-8 md:p-10 ${className}`}
      style={isGlass ? {
        background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      } : undefined}
    >
      {name && (
        <h2
          className={`text-2xl font-bold mb-2 text-center ${isGlass ? '' : 'text-slate-900 dark:text-white'}`}
          style={isGlass ? { color: 'var(--k-text-primary, rgba(255,255,255,0.95))' } : undefined}
        >
          {name}
        </h2>
      )}
      {description && (
        <p
          className={`text-center mb-6 ${isGlass ? '' : 'text-slate-500 dark:text-slate-400'}`}
          style={isGlass ? { color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' } : undefined}
        >
          {description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" noValidate>
        <div className="flex flex-wrap gap-4">
          {fields.map(renderField)}
        </div>

        {submitError && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`
            w-full mt-6 py-3 rounded-xl font-semibold text-sm transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isGlass
              ? 'hover:opacity-90'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
            }
          `}
          style={isGlass ? { background: 'var(--k-accent, #6366f1)', color: '#fff' } : undefined}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Envoi en cours...
            </span>
          ) : (
            'Envoyer'
          )}
        </button>
      </form>
    </div>
  );
}

export default FormRenderer;
