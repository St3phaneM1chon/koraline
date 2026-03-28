/**
 * PageRenderer — Renders a Page from the database using the appropriate template.
 *
 * Templates:
 *   - default:      Glass card with rich HTML content
 *   - hero-content:  Full-width hero image banner + content area below
 *   - sections:      Composable sections rendered from JSON array
 *   - landing:       Marketing template (hero + features grid + CTA)
 */

import Link from 'next/link';
import { ContentPageData } from '@/lib/content-pages';

// ── Section types for the "sections" template ───────────────────────

interface PageSection {
  id?: string;
  type: 'text' | 'features' | 'cta' | 'stats' | 'testimonial' | 'faq' | 'image';
  title?: string;
  subtitle?: string;
  content?: string;
  items?: Array<{
    icon?: string;
    title?: string;
    description?: string;
    value?: string;
    label?: string;
    href?: string;
  }>;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

// ── Main renderer ───────────────────────────────────────────────────

export default function PageRenderer({ page }: { page: ContentPageData }) {
  switch (page.template) {
    case 'hero-content':
      return <HeroContentTemplate page={page} />;
    case 'sections':
      return <SectionsTemplate page={page} />;
    case 'landing':
      return <LandingTemplate page={page} />;
    default:
      return <DefaultTemplate page={page} />;
  }
}

// ── Default template ────────────────────────────────────────────────

function DefaultTemplate({ page }: { page: ContentPageData }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--k-bg, #0a0a0f)' }}>
      {/* Hero */}
      <section
        className="py-20 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.10) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="font-heading text-4xl md:text-5xl font-bold mb-6"
            style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
          >
            {page.title}
          </h1>
          {page.excerpt && (
            <p
              className="text-lg"
              style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))', lineHeight: '1.8' }}
            >
              {page.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{
            background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="prose prose-invert max-w-none"
            style={{
              color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
              lineHeight: '1.8',
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <UpdatedAtFooter updatedAt={page.updatedAt} />
        </div>
      </div>
    </div>
  );
}

// ── Hero-content template ───────────────────────────────────────────

function HeroContentTemplate({ page }: { page: ContentPageData }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--k-bg, #0a0a0f)' }}>
      {/* Full-width hero banner */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: '420px',
          background: page.heroImageUrl
            ? `linear-gradient(to bottom, rgba(10,10,15,0.35), rgba(10,10,15,0.85)), url(${page.heroImageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.12) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
          >
            {page.title}
          </h1>
          {page.excerpt && (
            <p
              className="text-lg md:text-xl"
              style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.70))', lineHeight: '1.8' }}
            >
              {page.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Content area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{
            background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="prose prose-invert max-w-none"
            style={{
              color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
              lineHeight: '1.8',
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <UpdatedAtFooter updatedAt={page.updatedAt} />
        </div>
      </div>
    </div>
  );
}

// ── Sections template ───────────────────────────────────────────────

function SectionsTemplate({ page }: { page: ContentPageData }) {
  const sections = parseSections(page.sections);

  return (
    <div className="min-h-screen" style={{ background: 'var(--k-bg, #0a0a0f)' }}>
      {/* Title header */}
      <section
        className="py-16 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.10) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="font-heading text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
          >
            {page.title}
          </h1>
          {page.excerpt && (
            <p
              className="text-lg"
              style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
            >
              {page.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Render each section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {sections.map((section, idx) => (
          <SectionRenderer key={section.id || idx} section={section} />
        ))}
      </div>
    </div>
  );
}

function SectionRenderer({ section }: { section: PageSection }) {
  switch (section.type) {
    case 'text':
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
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {section.title}
            </h2>
          )}
          {section.content && (
            <div
              className="prose prose-invert max-w-none"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))', lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
        </div>
      );

    case 'features':
      return (
        <div>
          {section.title && (
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {section.title}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(section.items || []).map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {item.icon && <div className="text-3xl mb-3">{item.icon}</div>}
                {item.title && (
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
                  >
                    {item.title}
                  </h3>
                )}
                {item.description && (
                  <p style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))', lineHeight: '1.6' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.12) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          {section.title && (
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p
              className="text-lg mb-6"
              style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.70))' }}
            >
              {section.subtitle}
            </p>
          )}
          {section.ctaText && section.ctaUrl && (
            <Link
              href={section.ctaUrl}
              className="inline-flex items-center px-8 py-3.5 rounded-xl font-semibold text-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--k-accent, #6366f1)', color: '#fff' }}
            >
              {section.ctaText}
            </Link>
          )}
        </div>
      );

    case 'stats':
      return (
        <div>
          {section.title && (
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {section.title}
            </h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(section.items || []).map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 text-center"
                style={{
                  background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="text-3xl md:text-4xl font-bold mb-1"
                  style={{ color: 'var(--k-accent, #6366f1)' }}
                >
                  {item.value}
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))' }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={section.imageUrl || ''}
            alt={section.title || ''}
            className="w-full h-auto"
            loading="lazy"
          />
          {section.title && (
            <p
              className="text-center py-3 text-sm"
              style={{
                background: 'var(--k-glass-thin, rgba(255,255,255,0.05))',
                color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))',
              }}
            >
              {section.title}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ── Landing template ────────────────────────────────────────────────

function LandingTemplate({ page }: { page: ContentPageData }) {
  const sections = parseSections(page.sections);
  const featuresSection = sections.find((s) => s.type === 'features');
  const ctaSection = sections.find((s) => s.type === 'cta');

  return (
    <div className="min-h-screen" style={{ background: 'var(--k-bg, #0a0a0f)' }}>
      {/* Hero */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: '500px',
          background: page.heroImageUrl
            ? `linear-gradient(to bottom, rgba(10,10,15,0.30), rgba(10,10,15,0.80)), url(${page.heroImageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.12) 50%, rgba(139,92,246,0.10) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
          >
            {page.title}
          </h1>
          {page.excerpt && (
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-8"
              style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.70))', lineHeight: '1.8' }}
            >
              {page.excerpt}
            </p>
          )}
          {ctaSection?.ctaText && ctaSection?.ctaUrl && (
            <Link
              href={ctaSection.ctaUrl}
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--k-accent, #6366f1)', color: '#fff' }}
            >
              {ctaSection.ctaText}
            </Link>
          )}
        </div>
      </section>

      {/* Content (from WYSIWYG) */}
      {page.content && page.content.trim() !== '' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div
            className="rounded-2xl p-8 md:p-12"
            style={{
              background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="prose prose-invert max-w-none"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))', lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      )}

      {/* Features grid */}
      {featuresSection && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SectionRenderer section={featuresSection} />
        </div>
      )}

      {/* Remaining sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-12">
        {sections
          .filter((s) => s.type !== 'features' && s.type !== 'cta')
          .map((section, idx) => (
            <SectionRenderer key={section.id || idx} section={section} />
          ))}
      </div>

      {/* Bottom CTA */}
      {ctaSection && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SectionRenderer section={ctaSection} />
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function UpdatedAtFooter({ updatedAt }: { updatedAt: Date }) {
  if (!updatedAt) return null;
  return (
    <p
      className="text-sm mt-8 pt-4 text-center"
      style={{
        color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      Last updated: {new Date(updatedAt).toLocaleDateString('fr-CA')}
    </p>
  );
}

function parseSections(raw: unknown): PageSection[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as PageSection[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PageSection[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
