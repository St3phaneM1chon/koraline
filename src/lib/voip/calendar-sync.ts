/**
 * Calendar Sync — Google Calendar + Outlook Auto-Presence
 *
 * Features:
 * - Google Calendar API integration (Events list)
 * - Microsoft Graph API integration (Outlook Calendar)
 * - Auto-presence: set agent status to 'meeting' during calendar events
 * - Periodic sync with configurable interval
 * - Upcoming events query for dashboard display
 */

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  attendees?: string[];
  isMeeting: boolean;
  provider: 'google' | 'outlook';
}

export interface CalendarSyncConfig {
  provider: 'google' | 'outlook';
  accessToken: string;
  refreshToken?: string;
  syncInterval?: number; // minutes, default 5
  autoPresence?: boolean; // auto-set presence to 'meeting' during events
}

// ---------------------------------------------------------------------------
// Google Calendar API response types
// ---------------------------------------------------------------------------

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string }>;
  eventType?: string;
  status?: string;
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  error?: { message?: string; code?: number };
}

// ---------------------------------------------------------------------------
// Microsoft Graph API response types
// ---------------------------------------------------------------------------

interface OutlookCalendarEvent {
  id: string;
  subject?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  attendees?: Array<{ emailAddress?: { address?: string } }>;
  isOnlineMeeting?: boolean;
  showAs?: string;
}

interface OutlookCalendarResponse {
  value?: OutlookCalendarEvent[];
  error?: { message?: string; code?: string };
}

// ---------------------------------------------------------------------------
// CalendarSync
// ---------------------------------------------------------------------------

export class CalendarSync {
  private events: CalendarEvent[] = [];
  private syncTimer?: ReturnType<typeof setInterval>;
  private config: CalendarSyncConfig;

  constructor(config: CalendarSyncConfig) {
    this.config = config;
  }

  /**
   * Sync events from the configured calendar provider.
   * Fetches events for the current day (today 00:00 to 23:59).
   */
  async sync(): Promise<CalendarEvent[]> {
    try {
      const fetched = this.config.provider === 'google'
        ? await this.fetchGoogleEvents()
        : await this.fetchOutlookEvents();

      this.events = fetched;

      logger.info('[CalendarSync] Synced events', {
        provider: this.config.provider,
        count: fetched.length,
      });

      return this.events;
    } catch (error) {
      logger.error('[CalendarSync] Sync failed', {
        provider: this.config.provider,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.events; // return cached events on failure
    }
  }

  /**
   * Fetch events from Google Calendar API.
   * Uses the primary calendar and fetches today's events.
   */
  private async fetchGoogleEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Calendar API ${response.status}: ${text}`);
    }

    const data: GoogleCalendarResponse = await response.json();

    if (data.error) {
      throw new Error(`Google Calendar API error: ${data.error.message}`);
    }

    return (data.items || [])
      .filter(evt => evt.status !== 'cancelled')
      .map(evt => {
        const startStr = evt.start?.dateTime || evt.start?.date || '';
        const endStr = evt.end?.dateTime || evt.end?.date || '';
        const attendeeCount = evt.attendees?.length || 0;

        return {
          id: evt.id,
          title: evt.summary || '(No title)',
          start: new Date(startStr),
          end: new Date(endStr),
          attendees: evt.attendees?.map(a => a.email).filter(Boolean) as string[] | undefined,
          isMeeting: attendeeCount > 1 || evt.eventType === 'default',
          provider: 'google' as const,
        };
      });
  }

  /**
   * Fetch events from Microsoft Graph API (Outlook Calendar).
   * Uses the calendarView endpoint for today's events.
   */
  private async fetchOutlookEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      startDateTime: startOfDay.toISOString(),
      endDateTime: endOfDay.toISOString(),
      $top: '50',
      $orderby: 'start/dateTime',
      $select: 'id,subject,start,end,attendees,isOnlineMeeting,showAs',
    });

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'outlook.timezone="UTC"',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Microsoft Graph API ${response.status}: ${text}`);
    }

    const data: OutlookCalendarResponse = await response.json();

    if (data.error) {
      throw new Error(`Microsoft Graph API error: ${data.error.message}`);
    }

    return (data.value || []).map(evt => {
      const startStr = evt.start?.dateTime || '';
      const endStr = evt.end?.dateTime || '';
      const attendeeCount = evt.attendees?.length || 0;

      return {
        id: evt.id,
        title: evt.subject || '(No title)',
        start: new Date(startStr),
        end: new Date(endStr),
        attendees: evt.attendees
          ?.map(a => a.emailAddress?.address)
          .filter(Boolean) as string[] | undefined,
        isMeeting: attendeeCount > 0 || evt.isOnlineMeeting === true,
        provider: 'outlook' as const,
      };
    });
  }

  /**
   * Check if the user is currently in a meeting.
   * Returns the active meeting event, or null if not in a meeting.
   */
  isInMeeting(): CalendarEvent | null {
    const now = new Date();
    return this.events.find(evt =>
      evt.isMeeting && evt.start <= now && evt.end > now
    ) || null;
  }

  /**
   * Get upcoming events within the next N hours (default: 4).
   */
  getUpcoming(hours = 4): CalendarEvent[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.events.filter(evt =>
      evt.start > now && evt.start <= cutoff
    );
  }

  /**
   * Start periodic sync. Runs immediately, then every syncInterval minutes.
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      return; // already running
    }

    const intervalMs = (this.config.syncInterval || 5) * 60 * 1000;

    // Initial sync
    this.sync().catch(() => {
      // Error already logged in sync()
    });

    this.syncTimer = setInterval(() => {
      this.sync().catch(() => {
        // Error already logged in sync()
      });
    }, intervalMs);

    logger.info('[CalendarSync] Auto-sync started', {
      provider: this.config.provider,
      intervalMinutes: this.config.syncInterval || 5,
    });
  }

  /**
   * Stop periodic sync.
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;

      logger.info('[CalendarSync] Auto-sync stopped', {
        provider: this.config.provider,
      });
    }
  }

  /**
   * Get the recommended presence status based on calendar state.
   * - 'meeting' if currently in a meeting with attendees
   * - 'busy' if in a non-meeting event (focus time, etc.)
   * - 'available' if no current events
   */
  getCalendarPresence(): 'available' | 'meeting' | 'busy' {
    const now = new Date();
    const currentEvent = this.events.find(evt =>
      evt.start <= now && evt.end > now
    );

    if (!currentEvent) {
      return 'available';
    }

    if (currentEvent.isMeeting) {
      return 'meeting';
    }

    return 'busy';
  }
}
