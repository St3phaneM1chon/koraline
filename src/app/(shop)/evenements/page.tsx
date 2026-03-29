'use client';

/**
 * Public Events Listing Page
 * Displays upcoming events with registration forms.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, MapPin, Video, Clock, Users, DollarSign,
  CheckCircle, ArrowRight, Loader2,
} from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────

interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  startDate: string;
  endDate: string;
  maxAttendees: number | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  _count: { registrations: number };
}

// ── Main Component ────────────────────────────────────────────

export default function EvenementsPublicPage() {
  const { t, formatCurrency } = useI18n();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration state
  const [registeringEvent, setRegisteringEvent] = useState<string | null>(null);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleRegister = async (eventId: string) => {
    if (!regName || !regEmail) {
      toast.error(t('shop.events.nameEmailRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: regName,
          email: regEmail,
          phone: regPhone || null,
        }),
      });

      if (res.ok) {
        toast.success(t('shop.events.registeredSuccess'));
        setRegisteredEvents(prev => new Set(prev).add(eventId));
        setRegisteringEvent(null);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        fetchEvents(); // Refresh counts
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'Already registered') {
          toast.error(t('shop.events.alreadyRegistered'));
        } else if (data.error === 'Event is full') {
          toast.error(t('shop.events.eventFull'));
        } else {
          toast.error(data.error || t('common.error'));
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-CA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t('shop.events.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('shop.events.subtitle')}
        </p>
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('shop.events.noEvents')}
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            {t('shop.events.noEventsDescription')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => {
            const isFull = event.maxAttendees ? event._count.registrations >= event.maxAttendees : false;
            const isRegistered = registeredEvents.has(event.id);
            const isExpanding = registeringEvent === event.id;

            return (
              <article
                key={event.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {event.imageUrl && (
                  <div className="h-48 sm:h-56 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {event.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatDate(event.startDate)}
                    </span>
                    {event.isOnline ? (
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <Video className="w-4 h-4" />
                        {t('shop.events.online')}
                      </span>
                    ) : event.location ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {event._count.registrations}{event.maxAttendees ? `/${event.maxAttendees}` : ''} {t('shop.events.registered')}
                    </span>
                    {Number(event.price) > 0 && (
                      <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(Number(event.price))}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Registration */}
                  {isRegistered ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      {t('shop.events.youAreRegistered')}
                    </div>
                  ) : isFull ? (
                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium">
                      {t('shop.events.eventFull')}
                    </div>
                  ) : isExpanding ? (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder={t('shop.events.yourName')}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder={t('shop.events.yourEmail')}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder={t('shop.events.yourPhone')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRegisteringEvent(null)}
                          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={submitting}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          {t('shop.events.confirmRegistration')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRegisteringEvent(event.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
                    >
                      {Number(event.price) > 0
                        ? t('shop.events.registerPaid', { price: formatCurrency(Number(event.price)) })
                        : t('shop.events.registerFree')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
