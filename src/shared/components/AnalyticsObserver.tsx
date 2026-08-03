import { useEffect } from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { analytics } from '@/shared/utils/analytics';

export function AnalyticsObserver() {
  const location = useLocation();
  const matches = useMatches();

  useEffect(() => {
    // Find the deepest route match that has a handle with a title
    const match = matches.slice().reverse().find(m => m.handle && (m.handle as any).title);
    const title = match ? (match.handle as any).title : undefined;
    
    analytics.trackPageView(location.pathname + location.search, title);
  }, [location.pathname, location.search, matches]);

  return null;
}
