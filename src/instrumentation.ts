/**
 * INSTRUMENTATION - Next.js instrumentation hook
 * Initializes Sentry when @sentry/nextjs is installed and SENTRY_DSN is set.
 * Gracefully no-ops when either is missing.
 */

export async function register() {
  // Skip entirely if no DSN configured
  if (!process.env.SENTRY_DSN) return;

  // Use dynamic require path to prevent webpack from bundling when package is absent
  const sentryModuleName = '@sentry/' + 'nextjs';

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const Sentry = await import(/* webpackIgnore: true */ sentryModuleName);
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.npm_package_version || '1.0.0',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        enabled: process.env.NODE_ENV === 'production',
        ignoreErrors: ['NEXT_NOT_FOUND', 'NEXT_REDIRECT', 'AbortError', 'cancelled'],
        serverName: process.env.HOSTNAME || 'attitudes-vip',
        beforeSend(event: { request?: { headers?: Record<string, string> } }) {
          if (event.request?.headers) {
            delete event.request.headers['cookie'];
            delete event.request.headers['authorization'];
          }
          return event;
        },
      });
    } catch {
      // @sentry/nextjs not installed
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    try {
      const Sentry = await import(/* webpackIgnore: true */ sentryModuleName);
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        enabled: process.env.NODE_ENV === 'production',
      });
    } catch {
      // Edge runtime — Sentry not available
    }
  }
}
