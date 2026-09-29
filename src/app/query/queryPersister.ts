import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const REACT_QUERY_OFFLINE_CACHE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

export const queryPersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: REACT_QUERY_OFFLINE_CACHE_KEY,
});
