import * as Sentry from '@sentry/react';

/**
 * Interface for contextual data passed to the logger
 */
export interface ErrorContext {
  [key: string]: any;
}

/**
 * Initialize crash reporting.
 * Safe to call; only initializes if a DSN is present in the environment or if we mock it for development.
 * We're setting up the Sentry SDK here. 
 */
export const initCrashReporting = () => {
  // Use VITE_SENTRY_DSN from environment, or fallback to the provided default DSN
  const dsn = import.meta.env.VITE_SENTRY_DSN || 'https://3fe7d1053b5cf48ebe5696ca5afc3bfa@o4511789342916608.ingest.de.sentry.io/4511789346390096'; 
  const isDev = import.meta.env.MODE === 'development';

  Sentry.init({
    dsn: dsn || undefined, // Set undefined if empty to disable sending
    environment: import.meta.env.MODE || 'development',
    
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\//],

    // Capture React routing navigation, console logs, etc.
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.breadcrumbsIntegration({ console: true }),
    ],
    
    // Capture Replay for sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Ignore benign errors
    ignoreErrors: [
      /ResizeObserver loop limit exceeded/i,
      /Network request failed/i,
    ],
    
    beforeSend(event) {
      // Global scrub for sensitive fields in request data or breadcrumbs
      const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'authorization'];
      
      const scrubObject = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            obj[key] = '[FILTERED]';
          } else if (typeof obj[key] === 'object') {
            scrubObject(obj[key]);
          }
        }
      };

      if (event.request?.headers) scrubObject(event.request.headers);
      if (event.request?.data) scrubObject(event.request.data);
      if (event.extra) scrubObject(event.extra);
      if (event.breadcrumbs) {
        event.breadcrumbs.forEach(breadcrumb => {
          if (breadcrumb.data) scrubObject(breadcrumb.data);
        });
      }

      return event;
    },

    // Enabled if DSN is set, or if it's production.
    enabled: !!dsn || !isDev,
    
    debug: false, // Turn off noisy Sentry debug logs
  });
  
  if (isDev && !dsn) {
    console.log('[Crashlytics/Sentry] Developer mode: Sentry SDK loaded but mock/disabled because VITE_SENTRY_DSN is empty.');
  }
};

/**
 * Reusable utility for manual error reporting.
 * @param error The error object (Error or string)
 * @param context Additional metadata/breadcrumbs to attach
 */
export const logError = (error: Error | string, context?: ErrorContext) => {
  console.error('[Error Logger]', error, context);
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        // Exclude sensitive keys implicitly if any match (rudimentary check)
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.includes('password') && 
          !lowerKey.includes('token') && 
          !lowerKey.includes('secret') &&
          !lowerKey.includes('apikey')
        ) {
          scope.setExtra(key, context[key]);
        }
      });
    }
    
    if (typeof error === 'string') {
      Sentry.captureMessage(error, 'error');
    } else {
      Sentry.captureException(error);
    }
  });
};

/**
 * Associates an authenticated user with crash reports
 */
export const setCrashReportingUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Clears the user context (e.g. on logout)
 */
export const clearCrashReportingUser = () => {
  Sentry.setUser(null);
};

/**
 * Adds a breadcrumb to the crash report trace
 */
export const logBreadcrumb = (category: string, message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
};

export const SentryErrorBoundary = Sentry.ErrorBoundary;
