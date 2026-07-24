import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useEffect } from 'react';
import { analytics } from '@/shared/utils/analytics';

export default function App() {
  useEffect(() => {
    analytics.trackEvent('App Open');
  }, []);

  return <RouterProvider router={router} />;
}
