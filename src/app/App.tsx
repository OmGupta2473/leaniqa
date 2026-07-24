import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useEffect } from 'react';
import { analytics } from '@/shared/utils/analytics';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { offlineSyncService } from '@/shared/services/offlineSyncService';
import { KeyboardHandler } from '@/shared/components/KeyboardHandler';

export default function App() {
  useEffect(() => {
    analytics.trackEvent('App Open');
    offlineSyncService.flush();
  }, []);

  return (
    <>
      <KeyboardHandler />
      <OfflineBanner />
      <RouterProvider router={router} />
    </>
  );
}
