import { beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const supabase = vi.hoisted(() => ({ auth: { getSession: vi.fn(), getUser: vi.fn(), signOut: vi.fn() } }));
vi.mock('@/shared/utils/supabase', () => ({ supabase }));
vi.mock('@/features/nutrition/services/mealService', () => ({ mealService: { addMeal: vi.fn(), deleteMeal: vi.fn() } }));
vi.mock('@/features/profile/services/profileService', () => ({ profileService: { upsertGoal: vi.fn(), updateProfile: vi.fn() } }));
vi.mock('@/features/progress/services/weightService', () => ({ weightService: { addWeightLog: vi.fn() } }));
vi.mock('@/shared/utils/logger', () => ({ devLog: vi.fn(), devWarn: vi.fn(), clearCrashReportingUser: vi.fn() }));
vi.mock('@/shared/utils/analytics', () => ({ analytics: { reset: vi.fn() } }));

let storage: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage, addEventListener: vi.fn(), clearTimeout, setTimeout } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
});

describe('authService session-end cleanup', () => {
  it('T5: removes persisted queries and the current user queue', async () => {
    const { useAuthStore } = await import('@/app/store/authStore');
    const { authService } = await import('./authService');
    const { offlineQueueStorage } = await import('@/shared/services/offlineSyncService');
    useAuthStore.getState().setSession({ user: { id: 'user-a' } } as never);
    storage.setItem('REACT_QUERY_OFFLINE_CACHE', 'cached');
    storage.setItem(offlineQueueStorage.keyForUser('user-a'), '[]');

    await authService.clearCaches();

    expect(storage.getItem('REACT_QUERY_OFFLINE_CACHE')).toBeNull();
    expect(storage.getItem(offlineQueueStorage.keyForUser('user-a'))).toBeNull();
  });
});
