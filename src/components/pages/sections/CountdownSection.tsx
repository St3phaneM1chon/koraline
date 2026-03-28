'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CountdownSection as CountdownSectionType } from '@/lib/homepage-sections';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl md:text-5xl font-bold tabular-nums px-4 py-3 rounded-xl"
        style={{
          background: 'var(--k-glass-regular, rgba(255,255,255,0.08))',
          color: 'var(--k-text-primary, rgba(255,255,255,0.95))',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <p
        className="text-xs mt-2 uppercase tracking-wider"
        style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.40))' }}
      >
        {label}
      </p>
    </div>
  );
}

export function CountdownRenderer({ section }: { section: CountdownSectionType }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(section.targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(section.targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [section.targetDate]);

  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.10) 100%)',
        border: '1px solid rgba(99,102,241,0.20)',
      }}
    >
      {section.title && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ color: 'var(--k-text-primary, rgba(255,255,255,0.95))' }}
        >
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p
          className="text-lg mb-8"
          style={{ color: 'var(--k-text-secondary, rgba(255,255,255,0.70))' }}
        >
          {section.subtitle}
        </p>
      )}
      <div className="flex items-center justify-center gap-3 md:gap-6 mb-8">
        <TimeUnit value={timeLeft.days} label="Jours" />
        <span className="text-2xl font-bold" style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.30))' }}>:</span>
        <TimeUnit value={timeLeft.hours} label="Heures" />
        <span className="text-2xl font-bold" style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.30))' }}>:</span>
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <span className="text-2xl font-bold" style={{ color: 'var(--k-text-tertiary, rgba(255,255,255,0.30))' }}>:</span>
        <TimeUnit value={timeLeft.seconds} label="Secondes" />
      </div>
      {section.ctaLabel && section.ctaHref && (
        <Link
          href={section.ctaHref}
          className="inline-flex items-center px-8 py-3.5 rounded-xl font-semibold text-lg transition-opacity hover:opacity-90"
          style={{ background: 'var(--k-accent, #6366f1)', color: '#fff' }}
        >
          {section.ctaLabel}
        </Link>
      )}
    </div>
  );
}
