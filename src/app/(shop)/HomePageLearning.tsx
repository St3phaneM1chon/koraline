'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import type { TenantBranding } from '@/lib/tenant-branding';

interface CourseData {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  level: string;
  isFree: boolean;
  price: number | string | null;
}

interface HomePageLearningProps {
  branding: TenantBranding;
  courses: CourseData[];
}

/** Map course level enum to display label. */
function levelLabel(level: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    BEGINNER: t('home.levelBeginner') || 'Debutant',
    INTERMEDIATE: t('home.levelIntermediate') || 'Intermediaire',
    ADVANCED: t('home.levelAdvanced') || 'Avance',
    EXPERT: t('home.levelExpert') || 'Expert',
  };
  return labels[level] || level;
}

/** Map level to a color class for the badge. */
function levelColor(level: string): string {
  switch (level) {
    case 'BEGINNER': return 'bg-emerald-500/20 text-emerald-300';
    case 'INTERMEDIATE': return 'bg-blue-500/20 text-blue-300';
    case 'ADVANCED': return 'bg-amber-500/20 text-amber-300';
    case 'EXPERT': return 'bg-red-500/20 text-red-300';
    default: return 'bg-neutral-500/20 text-neutral-300';
  }
}

/**
 * Learning-focused homepage for tenants with courses but no products.
 * Shows tenant branding + a grid of course cards.
 * Dark glass styling, professional, no shop references.
 */
export default function HomePageLearning({ branding, courses }: HomePageLearningProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-850 to-neutral-900">
      {/* Hero section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[var(--tenant-primary,#0066CC)] rounded-full blur-[160px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--tenant-secondary,#003366)] rounded-full blur-[160px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={branding.name}
                width={320}
                height={100}
                className="h-14 md:h-20 w-auto mx-auto brightness-0 invert"
                priority
              />
            ) : (
              <span className="text-4xl md:text-5xl font-bold text-white">
                {branding.name}
              </span>
            )}
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('home.discoverCourses') || 'Decouvrez nos formations'}
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            {t('home.learningDescription') || 'Formez-vous avec des cours interactifs concus pour votre reussite professionnelle.'}
          </p>
        </div>
      </section>

      {/* Course grid */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/learn/courses/${course.slug}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                style={{
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                  {/* Level badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${levelColor(course.level)}`}>
                    {levelLabel(course.level, t)}
                  </span>
                  {/* Free badge */}
                  {course.isFree && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/90 text-white">
                      {t('home.free') || 'Gratuit'}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 group-hover:text-[var(--tenant-primary,#60A5FA)] transition-colors">
                    {course.title}
                  </h3>
                  {course.subtitle && (
                    <p className="text-white/50 text-sm mb-3 line-clamp-1">
                      {course.subtitle}
                    </p>
                  )}
                  {course.description && (
                    <p className="text-white/40 text-sm line-clamp-2 mb-4">
                      {course.description}
                    </p>
                  )}

                  {/* Price / CTA */}
                  <div className="flex items-center justify-between">
                    {!course.isFree && course.price ? (
                      <span className="text-white font-bold">
                        {Number(course.price).toFixed(2)} $
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-sm font-medium">
                        {t('home.free') || 'Gratuit'}
                      </span>
                    )}
                    <span className="text-white/40 text-sm group-hover:text-white/70 transition-colors flex items-center gap-1">
                      {t('home.viewCourse') || 'Voir le cours'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Browse all link */}
          <div className="text-center mt-12">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: branding.primaryColor,
                boxShadow: `0 4px 20px ${branding.primaryColor}40`,
              }}
            >
              {t('home.browseAllCourses') || 'Voir toutes les formations'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Powered by footer */}
      <div className="pb-8 text-center">
        <p className="text-white/20 text-xs">
          {t('home.poweredBy') || 'Propulse par'} Koraline
        </p>
      </div>
    </div>
  );
}
