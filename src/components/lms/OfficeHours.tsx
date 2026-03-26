'use client';

/**
 * #19 Aurelia Office Hours
 * Add scheduled Q&A sessions in cohort view.
 * Shows upcoming and past office hours sessions.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

export interface OfficeHourSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number; // minutes
  host: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  attendees: number;
  maxAttendees: number;
  topics: string[];
  joinUrl?: string;
  recordingUrl?: string;
}

interface OfficeHoursProps {
  courseId: string;
  cohortId?: string;
}

export default function OfficeHours({ courseId, cohortId }: OfficeHoursProps) {
  const { t } = useTranslations();
  const [sessions, setSessions] = useState<OfficeHourSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ courseId });
        if (cohortId) params.append('cohortId', cohortId);
        const res = await fetch(`/api/lms/office-hours?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.data?.sessions || []);
        }
      } catch {
        // Non-critical — show empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [courseId, cohortId]);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'upcoming') return s.status === 'upcoming' || s.status === 'live';
    if (filter === 'completed') return s.status === 'completed';
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded-lg" />
        <div className="h-20 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t('lms.officeHours') || 'Office Hours'}
        </h3>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['upcoming', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(`lms.filter.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{t('lms.noOfficeHours') || 'No sessions scheduled yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border transition-colors ${
                session.status === 'live'
                  ? 'border-red-200 bg-red-50'
                  : session.status === 'upcoming'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {session.status === 'live' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatDate(session.scheduledAt)}</span>
                    <span>{session.duration} min</span>
                    <span>{session.attendees}/{session.maxAttendees} {t('lms.attendees') || 'attendees'}</span>
                  </div>
                  {session.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.topics.map((topic) => (
                        <span key={topic} className="px-2 py-0.5 bg-white/80 rounded text-xs text-gray-600">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {(session.status === 'live' || session.status === 'upcoming') && session.joinUrl && (
                    <a
                      href={session.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      {session.status === 'live'
                        ? (t('lms.joinNow') || 'Join Now')
                        : (t('lms.register') || 'Register')
                      }
                    </a>
                  )}
                  {session.status === 'completed' && session.recordingUrl && (
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t('lms.watchRecording') || 'Watch Recording'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
