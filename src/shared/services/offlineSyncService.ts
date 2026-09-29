import { mealService } from '@/features/nutrition/services/mealService';
import { profileService } from '@/features/profile/services/profileService';
import { weightService } from '@/features/progress/services/weightService';
import { queryClient } from '@/app/query/queryClient';
import { devLog, devWarn } from '@/shared/utils/logger';
import { getSessionUserId } from '@/shared/utils/sessionUser';

const LEGACY_QUEUE_KEY = 'LEANIQA_OFFLINE_QUEUE';
const QUEUE_KEY_PREFIX = `${LEGACY_QUEUE_KEY}:`;
const LEGACY_PENDING_QUEUE_KEY = `${QUEUE_KEY_PREFIX}legacy-pending`;

interface OfflineAction {
  id: string;
  user_id: string;
  type: 'ADD_MEAL' | 'SAVE_GOAL' | 'DELETE_MEAL' | 'ADD_WEIGHT';
  payload: any;
  timestamp: number;
}

let syncTimeoutId: number | null = null;
let retryAttempt = 0;
let isSyncing = false;
let hasMigratedLegacyQueue = false;

function queueKeyForUser(userId: string): string {
  return `${QUEUE_KEY_PREFIX}${userId}`;
}

function migrateLegacyQueue(): void {
  if (hasMigratedLegacyQueue || typeof window === 'undefined') return;

  const legacyQueue = window.localStorage.getItem(LEGACY_QUEUE_KEY);
  if (legacyQueue === null) {
    hasMigratedLegacyQueue = true;
    return;
  }

  // An unauthenticated legacy queue cannot safely be attributed to a user.
  if (!getSessionUserId()) return;

  try {
    if (window.localStorage.getItem(LEGACY_PENDING_QUEUE_KEY) === null) {
      window.localStorage.setItem(LEGACY_PENDING_QUEUE_KEY, legacyQueue);
    }
    window.localStorage.removeItem(LEGACY_QUEUE_KEY);
    hasMigratedLegacyQueue = true;
    devWarn('Legacy offline queue moved to legacy-pending; it will not be replayed automatically.');
  } catch {
    // Leave the legacy queue intact so a later authenticated read can retry.
  }
}

function getQueueForUser(userId: string): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  migrateLegacyQueue();

  try {
    const data = window.localStorage.getItem(queueKeyForUser(userId));
    const queue: OfflineAction[] = data ? JSON.parse(data) : [];
    return queue.filter((action) => action.user_id === userId);
  } catch {
    return [];
  }
}

function saveQueueForUser(userId: string, queue: OfflineAction[]): void {
  window.localStorage.setItem(queueKeyForUser(userId), JSON.stringify(queue));
}

export const offlineSyncService = {
  getQueue(): OfflineAction[] {
    const userId = getSessionUserId();
    if (!userId) return [];
    return getQueueForUser(userId);
  },

  enqueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'user_id'>): void {
    const userId = getSessionUserId();
    if (!userId) {
      if (import.meta.env.DEV) devWarn('Offline action ignored because there is no active session user.');
      return;
    }

    const queue = getQueueForUser(userId);
    queue.push({
      ...action,
      id: crypto.randomUUID(),
      user_id: userId,
      timestamp: Date.now(),
    });
    saveQueueForUser(userId, queue);
    
    // Attempt to flush immediately if online
    if (typeof window !== 'undefined' && navigator.onLine) {
        void this.flush();
    }
  },

  clearQueueForUser(userId: string | null | undefined): void {
    if (typeof window === 'undefined' || !userId) return;
    window.localStorage.removeItem(queueKeyForUser(userId));
  },

  async flush(): Promise<void> {
    const userId = getSessionUserId();
    if (!userId || typeof window === 'undefined' || !navigator.onLine) return;
    if (isSyncing) return;

    const queue = getQueueForUser(userId);
    if (queue.length === 0) {
        retryAttempt = 0;
        return;
    }

    isSyncing = true;

    devLog(`Flushing offline queue (${queue.length} items), attempt ${retryAttempt + 1}`);
    const newQueue: OfflineAction[] = [];
    let hadNetworkError = false;

    for (const action of queue) {
      try {
        if (action.type === 'ADD_MEAL') {
          await mealService.addMeal(action.payload);
        } else if (action.type === 'SAVE_GOAL') {
          await profileService.upsertGoal(action.payload);
        } else if (action.type === 'DELETE_MEAL') {
          await mealService.deleteMeal(action.payload);
        } else if (action.type === 'ADD_WEIGHT') {
          if (action.payload.updates) {
                await profileService.updateProfile(action.payload.updates);
          }
          await weightService.addWeightLog({ weight: action.payload.weight, date: action.payload.date }, action.payload.showAdvanced);
        }
        // Add more actions here if needed
      } catch (err: any) {
        console.error('Failed to sync offline action:', action, err);
        // Keep in queue if it's a network error
        if ((err instanceof TypeError && err.message.includes('fetch')) || err?.message?.toLowerCase().includes('network') || err?.message?.toLowerCase().includes('failed to fetch')) {
          newQueue.push(action);
          hadNetworkError = true;
        } else if (err?.status >= 500) {
          newQueue.push(action);
          hadNetworkError = true;
        }
      }
    }

    // Do not recreate User A's queue after a sign-out or account switch.
    if (getSessionUserId() !== userId) {
      isSyncing = false;
      return;
    }

    if (newQueue.length !== queue.length) {
      saveQueueForUser(userId, newQueue);
      // Re-fetch meals to show synced data
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    }

    isSyncing = false;

    if (hadNetworkError && navigator.onLine) {
        // Schedule next sync with exponential backoff
        retryAttempt++;
        const backoffMs = Math.min(1000 * (2 ** retryAttempt), 5 * 60 * 1000); // Max 5 mins
        devLog(`Sync failed, retrying in ${backoffMs}ms`);
        if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
        syncTimeoutId = window.setTimeout(() => void this.flush(), backoffMs);
    } else if (!hadNetworkError) {
        // Success
        retryAttempt = 0;
        if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
        syncTimeoutId = null;
    }
  }
};

// Listen for online event to flush
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    retryAttempt = 0;
    if (syncTimeoutId) {
        window.clearTimeout(syncTimeoutId);
        syncTimeoutId = null;
    }
    void offlineSyncService.flush();
  });
}

export const offlineQueueStorage = {
  legacyKey: LEGACY_QUEUE_KEY,
  legacyPendingKey: LEGACY_PENDING_QUEUE_KEY,
  keyForUser: queueKeyForUser,
};
