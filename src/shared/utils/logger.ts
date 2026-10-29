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
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Sentry is only initialised when a DSN is configured. Running Sentry
  // with `enabled: true` and no DSN still installs every integration's
  // `setupOnce` side effects (replay/browser-tracing patch MessageChannel,
  // fetch, XHR, EventTarget, etc.) without ever sending an event. Those
  // side effects are what caused `TypeError: Illegal constructor` on
  // cold-load of /profile in Microsoft Edge: the React scheduler's
  // MessageChannel work-flush was being invoked through a patched
  // MessageChannel whose subclass no longer satisfied Edge's intrinsic
  // %MessageChannel% check. When no DSN is set we skip Sentry entirely —
  // there is nothing to report and nothing to instrument.
  if (!dsn) {
    if (import.meta.env.MODE === 'development') {
      console.log('[Crashlytics/Sentry] VITE_SENTRY_DSN is empty. Skipping Sentry init.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^\/(?!\/)/],

    // Replay is intentionally omitted. Two reasons:
    //   1. rrweb-based replay patches window.MessageChannel and
    //      MessagePort.prototype.postMessage for cross-origin tracking,
    //      which is the source of the Edge `Illegal constructor` crash.
    //   2. Every field is masked (maskAllText/maskAllInputs/blockAllMedia),
    //      so replay captures an empty DOM anyway. The cost is not repaid
    //      by the (non-)signal.
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.breadcrumbsIntegration({ console: false }),
    ],

    ignoreErrors: [
      /ResizeObserver loop limit exceeded/i,
      /Network request failed/i,
    ],

    beforeSend(event) {
      const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'authorization', 'meal', 'meal_text', 'text', 'message', 'chat', 'weight', 'email', 'body'];

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

    enabled: true,
    debug: false,
  });
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

/**
 * Log to console only in development mode.
 */
export const devLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

/**
 * Log warning to console only in development mode.
 */
export const devWarn = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};
