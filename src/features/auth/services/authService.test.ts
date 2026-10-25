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
  supabase.auth.getSession.mockReset();
  supabase.auth.getUser.mockReset();
  supabase.auth.signOut.mockReset();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage, addEventListener: vi.fn(), clearTimeout, setTimeout, location: { href: '' } } });
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

describe('authService.getUserId error classification', () => {
  it('T1: getUser succeeds → returns user id, signOut not called', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const { authService } = await import('./authService');
    const userId = await authService.getUserId();

    expect(userId).toBe('user-a');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('T2: getUser network error → NETWORK_ERROR, signOut NOT called, window.location.href unchanged', async () => {
    const originalHref = window.location.href;
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } });
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const { authService } = await import('./authService');
    const { AppError, ErrorCodes } = await import('@/shared/utils/errors');

    await expect(authService.getUserId()).rejects.toMatchObject({
      code: ErrorCodes.NETWORK_ERROR,
      retryable: true,
      status: 0,
    });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalHref);
  });

  it('T3: getUser 401 → UNAUTHORIZED, signOut called once, window.location.href === /login', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, code: 'invalid_jwt', message: 'invalid JWT' } });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    window.location.href = '/dashboard';

    const { authService } = await import('./authService');
    const { AppError, ErrorCodes } = await import('@/shared/utils/errors');

    await expect(authService.getUserId()).rejects.toMatchObject({
      code: ErrorCodes.UNAUTHORIZED,
      retryable: false,
      status: 401,
    });
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('T4: getSession fetch error → NETWORK_ERROR, signOut NOT called', async () => {
    const originalHref = window.location.href;
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } });
    supabase.auth.signOut.mockResolvedValue({ error: null });

    const { authService } = await import('./authService');
    const { AppError, ErrorCodes } = await import('@/shared/utils/errors');

    await expect(authService.getUserId()).rejects.toMatchObject({
      code: ErrorCodes.NETWORK_ERROR,
      retryable: true,
      status: 0,
    });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalHref);
  });
});
