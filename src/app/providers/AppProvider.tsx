import { ReactNode, StrictMode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/app/query/queryClient';
import { queryPersister } from '@/app/query/queryPersister';
import { ToastProvider } from '@/shared/components/Toast';

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <PersistQueryClientProvider 
        client={queryClient}
        persistOptions={{ 
          persister: queryPersister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Persist profile, goals, meals, metrics
              return query.state.status === 'success' && ['profile', 'goal', 'meals', 'dailyMetrics', 'complianceScore'].some(k => query.queryKey.includes(k));
            }
          }
        }}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </PersistQueryClientProvider>
    </StrictMode>
  );
}
