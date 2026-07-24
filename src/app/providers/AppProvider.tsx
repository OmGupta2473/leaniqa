import { ReactNode, StrictMode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { queryClient } from '@/app/query/queryClient';

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'REACT_QUERY_OFFLINE_CACHE',
});

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <PersistQueryClientProvider 
        client={queryClient}
        persistOptions={{ 
          persister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Persist profile, goals, meals, metrics
              return ['profile', 'goal', 'meals', 'dailyMetrics', 'complianceScore'].some(k => query.queryKey.includes(k));
            }
          }
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </StrictMode>
  );
}
