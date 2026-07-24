import posthog from 'posthog-js';

export type EventName = 
  | 'App Open'
  | 'Sign Up'
  | 'Login'
  | 'Onboarding Started'
  | 'Onboarding Completed'
  | 'Goal Created'
  | 'Meal Logged'
  | 'AI Parse Success'
  | 'AI Parse Failure'
  | 'Weekly Report Viewed'
  | 'Subscription Started'
  | 'Subscription Purchased'
  | 'Subscription Cancelled'
  | 'Retention Milestone';

export const initAnalytics = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY || 'phc_rP4qPtGoTQoMt6g93Kf9NqtrSTnq2JVztTCU2LZSyc2W';
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  // Only init if we're in browser environment
  if (typeof window !== 'undefined') {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      autocapture: false, // Explicitly false as requested to only track what we define
      capture_pageview: false, // We handle this manually in AnalyticsObserver
      capture_pageleave: false,
      person_profiles: 'always',
    });
  }
};

export const analytics = {
  trackPageView: (url: string, title?: string) => {
    console.log(`[Analytics] Page View: ${url} - ${title || 'Unknown Title'}`);
    posthog.capture('$pageview', {
      $current_url: url,
      title: title || 'Unknown Title',
    });
  },
  trackEvent: (eventName: EventName, properties?: Record<string, any>) => {
    const scrubbedProperties = properties ? scrubSensitiveData(properties) : undefined;
    console.log(`[Analytics] Event: ${eventName}`, scrubbedProperties);
    posthog.capture(eventName, scrubbedProperties);
  },
  identifyUser: (userId: string, traits?: Record<string, any>) => {
    const scrubbedTraits = traits ? scrubSensitiveData(traits) : undefined;
    console.log(`[Analytics] Identify: ${userId}`, scrubbedTraits);
    posthog.identify(userId, scrubbedTraits);
  },
  reset: () => {
    console.log(`[Analytics] Reset User`);
    posthog.reset();
  }
};

const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'authorization', 'credit_card'];

function scrubSensitiveData(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      result[key] = '[FILTERED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = scrubSensitiveData(result[key]);
    }
  }
  return result;
}
