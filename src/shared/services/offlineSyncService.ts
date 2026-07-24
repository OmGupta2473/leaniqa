import { mealService } from '@/features/nutrition/services/mealService';

const QUEUE_KEY = 'LEANIQA_OFFLINE_QUEUE';

interface OfflineAction {
  id: string;
  type: 'ADD_MEAL' | 'SAVE_GOAL' | 'DELETE_MEAL';
  payload: any;
  timestamp: number;
}

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
  },

  async flush() {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`Flushing offline queue (${queue.length} items)`);
    const newQueue = [];

    for (const action of queue) {
      try {
        if (action.type === 'ADD_MEAL') {
          await mealService.addMeal(action.payload);
        } else if (action.type === 'SAVE_GOAL') {
          const { profileService } = await import('@/features/profile/services/profileService');
          await profileService.upsertGoal(action.payload);
        } else if (action.type === 'DELETE_MEAL') {
          await mealService.deleteMeal(action.payload);
        }
        // Add more actions here if needed
      } catch (err) {
        console.error('Failed to sync offline action:', action, err);
        // Keep in queue if it's a network error
        if (err instanceof TypeError && err.message.includes('fetch')) {
          newQueue.push(action);
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
  }
};

// Listen for online event to flush
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineSyncService.flush();
  });
}
