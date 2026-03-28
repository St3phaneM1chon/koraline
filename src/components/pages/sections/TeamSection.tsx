'use client';

import type { TeamSection as TeamSectionType } from '@/lib/homepage-sections';

export function TeamRenderer({ section }: { section: TeamSectionType }) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(section.members || []).map((member, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {member.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                style={{
                  background: 'var(--k-accent, #6366f1)',
                  color: '#fff',
                }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
            >
              {member.name}
            </h3>
            <p
              className="text-sm mb-2"
              style={{ color: 'var(--k-accent, #6366f1)' }}
            >
              {member.role}
            </p>
            {member.bio && (
              <p
                className="text-sm"
                style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.60))', lineHeight: '1.6' }}
              >
                {member.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
