import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PlatformBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/* -------------------------------------------------------------------------- */
/*  PlatformBreadcrumbs — lightweight server component for marketing pages    */
/*  Includes Schema.org BreadcrumbList JSON-LD for SEO.                       */
/* -------------------------------------------------------------------------- */

export function PlatformBreadcrumbs({ items }: PlatformBreadcrumbsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://attitudes.vip';

  // Schema.org BreadcrumbList structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${baseUrl}${item.href}` }),
    })),
  };

  // Escape '<' to prevent XSS in JSON-LD
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />

      {/* Breadcrumb navigation */}
      <nav
        aria-label="Fil d'Ariane"
        className="bg-gray-50/80 border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-sm">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const isFirst = index === 0;

              return (
                <li key={index} className="flex items-center gap-1.5">
                  {/* Separator */}
                  {!isFirst && (
                    <svg
                      className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}

                  {/* Item */}
                  {isLast ? (
                    <span
                      className="text-gray-900 font-medium"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      className="text-gray-500 hover:text-[#0066CC] transition-colors flex items-center gap-1"
                    >
                      {isFirst && (
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      )}
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500">{item.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
