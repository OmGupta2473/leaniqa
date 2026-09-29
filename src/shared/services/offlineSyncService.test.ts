import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

vi.mock('@/features/nutrition/services/mealService', () => ({ mealService: { addMeal: vi.fn(), deleteMeal: vi.fn() } }));
vi.mock('@/features/profile/services/profileService', () => ({ profileService: { upsertGoal: vi.fn(), updateProfile: vi.fn() } }));
vi.mock('@/features/progress/services/weightService', () => ({ weightService: { addWeightLog: vi.fn() } }));

let storage: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage, addEventListener: vi.fn(), clearTimeout, setTimeout } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
});

afterEach(() => vi.restoreAllMocks());

async function loadService(userId: string | null) {
  const { useAuthStore } = await import('@/app/store/authStore');
  useAuthStore.getState().setSession(userId ? ({ user: { id: userId } } as never) : null);
  return import('@/shared/services/offlineSyncService');
}

describe('offlineSyncService user scoping', () => {
  it('T1: ignores enqueue without a session user', async () => {
    const { supabase } = await import('@/shared/utils/supabase');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: null }, error: null });
    const { offlineSyncService } = await loadService(null);
    offlineSyncService.enqueue({ type: 'SAVE_GOAL', payload: {} });
    expect(storage.length).toBe(0);
  });

  it('T2: separates queues and flushing User B does not change User A', async () => {
    const { offlineSyncService, offlineQueueStorage } = await loadService('user-a');
    offlineSyncService.enqueue({ type: 'SAVE_GOAL', payload: { calories_target: 2000 } });
    const userAKey = offlineQueueStorage.keyForUser('user-a');
    const userAQueue = storage.getItem(userAKey);

    const { useAuthStore } = await import('@/app/store/authStore');
    useAuthStore.getState().setSession({ user: { id: 'user-b' } } as never);
    offlineSyncService.enqueue({ type: 'SAVE_GOAL', payload: { calories_target: 1800 } });
    (navigator as { onLine: boolean }).onLine = true;
    await offlineSyncService.flush();

    expect(storage.getItem(userAKey)).toBe(userAQueue);
    expect(storage.getItem(offlineQueueStorage.keyForUser('user-b'))).toBe('[]');
  });

  it('T3: quarantines, rather than replays, a legacy global queue', async () => {
    storage.setItem('LEANIQA_OFFLINE_QUEUE', JSON.stringify([{ id: 'legacy' }]));
    const { offlineSyncService, offlineQueueStorage } = await loadService('user-a');

    expect(offlineSyncService.getQueue()).toEqual([]);
    expect(storage.getItem(offlineQueueStorage.legacyKey)).toBeNull();
    expect(storage.getItem(offlineQueueStorage.legacyPendingKey)).toBe(JSON.stringify([{ id: 'legacy' }]));
    expect(storage.getItem(offlineQueueStorage.keyForUser('user-a'))).toBeNull();
  });
});
