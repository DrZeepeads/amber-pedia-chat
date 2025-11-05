import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { config } from '@/lib/config';

export const initSentry = () => {
  if (!config.features.errorTracking) {
    console.log('Sentry error tracking disabled');
    return;
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (!sentryDsn) {
    console.warn('VITE_SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: config.app.env,
    release: `nelson-gpt@${config.app.version}`,
    
    integrations: [
      new BrowserTracing({
        tracingOrigins: ['localhost', config.supabase.url, /^\//],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance monitoring
    tracesSampleRate: config.app.env === 'production' ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: config.app.env === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Ignore common errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
    ],

    beforeSend(event, hint) {
      // Filter out errors with PII
      if (event.exception) {
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          if (message.includes('@') || /\b\d{10,}\b/.test(message)) {
            return null; // Don't send if contains email or phone
          }
        }
      }
      return event;
    },

    beforeBreadcrumb(breadcrumb, hint) {
      // Sanitize URLs in breadcrumbs
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(/email=[^&]+/, 'email=***');
      }
      return breadcrumb;
    },
  });

  // Set user context
  const setUserContext = (user: { id: string; email?: string }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  };

  return { setUserContext };
};

export { Sentry };