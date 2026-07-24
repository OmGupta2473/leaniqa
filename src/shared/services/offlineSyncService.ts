import { mealService } from '@/features/nutrition/services/mealService';

const QUEUE_KEY = 'LEANIQA_OFFLINE_QUEUE';

interface OfflineAction {
  id: string;
  type: 'ADD_MEAL' | 'SAVE_GOAL' | 'DELETE_MEAL' | 'ADD_WEIGHT';
  payload: any;
  timestamp: number;
}

let syncTimeoutId: number | null = null;
let retryAttempt = 0;
let isSyncing = false;

export const offlineSyncService = {
  getQueue(): OfflineAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    queue.push({
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    // Attempt to flush immediately if online
    if (typeof window !== 'undefined' && navigator.onLine) {
        this.flush();
    }
  },

  async flush() {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    
    const queue = this.getQueue();
    if (queue.length === 0) {
        retryAttempt = 0;
        return;
    }

    if (isSyncing) return;
    isSyncing = true;

    console.log(`Flushing offline queue (${queue.length} items), attempt ${retryAttempt + 1}`);
    const newQueue = [];
    let hadNetworkError = false;

    for (const action of queue) {
      try {
        if (action.type === 'ADD_MEAL') {
          await mealService.addMeal(action.payload);
        } else if (action.type === 'SAVE_GOAL') {
          const { profileService } = await import('@/features/profile/services/profileService');
          await profileService.upsertGoal(action.payload);
        } else if (action.type === 'DELETE_MEAL') {
          await mealService.deleteMeal(action.payload);
        } else if (action.type === 'ADD_WEIGHT') {
          const { weightService } = await import('@/features/progress/services/weightService');
          if (action.payload.updates) {
             const { profileService } = await import('@/features/profile/services/profileService');
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

    if (newQueue.length !== queue.length) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
      // Re-fetch meals to show synced data
      import('@/app/query/queryClient').then(m => {
        m.queryClient.invalidateQueries({ queryKey: ['meals'] });
        m.queryClient.invalidateQueries({ queryKey: ['goal'] });
      });
    }

    isSyncing = false;

    if (hadNetworkError && navigator.onLine) {
        // Schedule next sync with exponential backoff
        retryAttempt++;
        const backoffMs = Math.min(1000 * (2 ** retryAttempt), 5 * 60 * 1000); // Max 5 mins
        console.log(`Sync failed, retrying in ${backoffMs}ms`);
        if (syncTimeoutId) window.clearTimeout(syncTimeoutId);
        syncTimeoutId = window.setTimeout(() => this.flush(), backoffMs);
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
    offlineSyncService.flush();
  });
}
