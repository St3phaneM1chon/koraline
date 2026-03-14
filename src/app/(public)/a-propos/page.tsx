'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/client';

/**
 * PAGE À PROPOS - BioCycle Peptides
 * i18n-enabled with 22 locales
 */

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{
        background: '#143C78',
        color: 'white',
        padding: '80px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="font-heading" style={{ fontSize: '42px', fontWeight: 700, marginBottom: '24px' }}>
            {t('about.heroTitle')}
          </h1>
          <p style={{ fontSize: '18px', lineHeight: 1.7, color: '#d1d5db' }}>
            {t('about.heroDescription')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '64px',
          textAlign: 'center'
        }}>
          <StatCard number="99%+" label={t('about.statPurity')} />
          <StatCard number="500+" label={t('about.statProducts')} />
          <StatCard number="10K+" label={t('about.statResearchers')} />
          <StatCard number="24-48h" label={t('about.statShipping')} />
        </div>

        {/* Notre histoire */}
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: '#1f2937' }}>
            {t('about.historyTitle')}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#4b5563', marginBottom: '16px' }}>
            {t('about.historyP1')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#4b5563', marginBottom: '16px' }}>
            {t('about.historyP2')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8, color: '#4b5563' }}>
            {t('about.historyP3')}
          </p>
        </section>

        {/* Notre engagement */}
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: '#1f2937' }}>
            {t('about.qualityTitle')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <FeatureCard
              icon="🔬"
              title={t('about.labTestsTitle')}
              description={t('about.labTestsDescription')}
            />
            <FeatureCard
              icon="📋"
              title={t('about.coaTitle')}
              description={t('about.coaDescription')}
            />
            <FeatureCard
              icon="❄️"
              title={t('about.coldChainTitle')}
              description={t('about.coldChainDescription')}
            />
            <FeatureCard
              icon="🛡️"
              title={t('about.complianceTitle')}
              description={t('about.complianceDescription')}
            />
          </div>
        </section>

        {/* Navigation vers autres pages */}
        <section style={{
          padding: '40px',
          backgroundColor: '#f9fafb',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1f2937' }}>
            {t('about.learnMoreTitle')}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
            <NavLink href="/a-propos/mission">{t('about.missionLink')}</NavLink>
            <NavLink href="/a-propos/valeurs">{t('about.valuesLink')}</NavLink>
            <NavLink href="/a-propos/histoire">{t('about.historyLink')}</NavLink>
            <NavLink href="/a-propos/engagements">{t('about.commitmentsLink')}</NavLink>
          </div>
        </section>

        {/* CTA */}
        <section style={{ marginTop: '64px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
            {t('about.ctaTitle')}
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            {t('about.ctaDescription')}
          </p>
          <Link
            href="/shop"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#238838',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            {t('about.ctaButton')} →
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '36px', fontWeight: 700, color: '#238838', marginBottom: '8px' }}>
        {number}
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#6b7280' }}>
        {description}
      </p>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '12px 24px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        color: '#374151',
        textDecoration: 'none',
        fontWeight: 500,
        transition: 'all 0.2s'
      }}
    >
      {children}
    </Link>
  );
}
