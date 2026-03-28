'use client';

/**
 * TemplatePicker — Admin component for selecting a page template.
 *
 * Displays a grid of template cards with category filtering and search.
 * When a template is selected, it calls `onSelect` with the template's sections
 * so the parent can pre-populate a new page.
 */

import { useState, useMemo } from 'react';
import {
  STARTER_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type StarterTemplate,
  type TemplateSection,
} from '@/lib/templates/starter-templates';

// ── Props ────────────────────────────────────────────────────────────

interface TemplatePickerProps {
  /** Called when the user picks a template. Receives the template slug, name, and pre-configured sections. */
  onSelect: (template: {
    slug: string;
    name: string;
    description: string;
    sections: TemplateSection[];
  }) => void;
  /** Called when the user cancels template selection. */
  onCancel?: () => void;
  /** Optional: extra templates loaded from the API (tenant custom templates). */
  customTemplates?: StarterTemplate[];
}

// ── Component ────────────────────────────────────────────────────────

export default function TemplatePicker({
  onSelect,
  onCancel,
  customTemplates = [],
}: TemplatePickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  // Merge system + custom templates
  const allTemplates = useMemo(() => {
    return [...STARTER_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Filter by category and search
  const filteredTemplates = useMemo(() => {
    let result = allTemplates;

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allTemplates, activeCategory, search]);

  // Count sections for preview
  const sectionCount = (template: StarterTemplate) => {
    return template.sections.length;
  };

  // Get section type icons for preview
  const sectionIcons = (template: StarterTemplate) => {
    const iconMap: Record<string, string> = {
      text: 'T',
      features: '◫',
      cta: '▶',
      stats: '#',
      testimonial: '❝',
      faq: '?',
      image: '🖼',
    };
    return template.sections.map((s) => iconMap[s.type] || '□').join(' ');
  };

  // Category badge color
  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      general: 'rgba(156,163,175,0.25)',
      business: 'rgba(59,130,246,0.25)',
      portfolio: 'rgba(168,85,247,0.25)',
      landing: 'rgba(16,185,129,0.25)',
      blog: 'rgba(251,146,60,0.25)',
      event: 'rgba(236,72,153,0.25)',
      ecommerce: 'rgba(234,179,8,0.25)',
      support: 'rgba(20,184,166,0.25)',
    };
    return colors[cat] || 'rgba(156,163,175,0.25)';
  };

  return (
    <div
      className="w-full"
      style={{
        background: 'var(--k-bg, #0a0a0f)',
        color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Choose a Template</h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
          >
            Select a pre-built template to start with, or begin from scratch.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--k-text-secondary, rgba(255,255,255,0.60))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
            }}
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background:
                activeCategory === 'all'
                  ? 'var(--k-accent, #6366f1)'
                  : 'rgba(255,255,255,0.08)',
              color:
                activeCategory === 'all'
                  ? '#fff'
                  : 'var(--k-text-secondary, rgba(255,255,255,0.60))',
            }}
          >
            All
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background:
                  activeCategory === cat.value
                    ? 'var(--k-accent, #6366f1)'
                    : 'rgba(255,255,255,0.08)',
                color:
                  activeCategory === cat.value
                    ? '#fff'
                    : 'var(--k-text-secondary, rgba(255,255,255,0.60))',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p
        className="text-xs mb-4"
        style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
      >
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
      </p>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{
            background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
          >
            No templates found
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
          >
            Try a different search term or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.slug}
              className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
              style={{
                background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
                border:
                  hoveredSlug === template.slug
                    ? '1px solid var(--k-accent, #6366f1)'
                    : '1px solid rgba(255,255,255,0.08)',
                transform: hoveredSlug === template.slug ? 'translateY(-2px)' : 'none',
              }}
              onMouseEnter={() => setHoveredSlug(template.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              onClick={() =>
                onSelect({
                  slug: template.slug,
                  name: template.name,
                  description: template.description,
                  sections: template.sections,
                })
              }
            >
              {/* Thumbnail / Preview */}
              <div
                className="h-36 flex items-center justify-center relative"
                style={{
                  background:
                    template.thumbnail
                      ? `url(${template.thumbnail}) center/cover no-repeat`
                      : 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.10) 100%)',
                }}
              >
                {/* Section layout preview (when no thumbnail) */}
                {!template.thumbnail && (
                  <div className="flex flex-col items-center gap-1.5">
                    {template.sections.length === 0 ? (
                      <div
                        className="text-3xl"
                        style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
                      >
                        +
                      </div>
                    ) : (
                      <>
                        {/* Mini section preview blocks */}
                        <div className="flex gap-1">
                          {template.sections.slice(0, 4).map((s, i) => (
                            <div
                              key={i}
                              className="w-8 h-5 rounded-sm text-[9px] flex items-center justify-center font-mono"
                              style={{
                                background: 'rgba(255,255,255,0.12)',
                                color: 'var(--k-text-tertiary, rgba(255,255,255,0.50))',
                              }}
                            >
                              {s.type.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        {template.sections.length > 4 && (
                          <div className="flex gap-1">
                            {template.sections.slice(4).map((s, i) => (
                              <div
                                key={i}
                                className="w-8 h-5 rounded-sm text-[9px] flex items-center justify-center font-mono"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))',
                                }}
                              >
                                {s.type.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <span
                      className="text-[10px] mt-1"
                      style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
                    >
                      {sectionIcons(template)}
                    </span>
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(99,102,241,0.60)', backdropFilter: 'blur(4px)' }}
                >
                  <span className="text-white font-semibold text-sm px-4 py-2 rounded-lg bg-white/20">
                    Use This Template
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
                  >
                    {template.name}
                  </h3>
                  <span
                    className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: categoryColor(template.category),
                      color: 'var(--k-text-secondary, rgba(255,255,255,0.70))',
                    }}
                  >
                    {template.category}
                  </span>
                </div>
                <p
                  className="text-xs line-clamp-2 mb-2"
                  style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
                >
                  {template.description}
                </p>
                <div
                  className="text-[10px]"
                  style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
                >
                  {sectionCount(template)} section{sectionCount(template) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
