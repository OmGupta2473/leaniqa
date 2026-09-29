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

const supabase = vi.hoisted(() => ({
  auth: { getSession: vi.fn(), getUser: vi.fn(), signOut: vi.fn() },
  from: vi.fn(),
}));
vi.mock('@/shared/utils/supabase', () => ({ supabase }));
vi.mock('@/shared/utils/logger', () => ({ devLog: vi.fn(), devWarn: vi.fn(), logError: vi.fn(), clearCrashReportingUser: vi.fn() }));
vi.mock('@/shared/utils/analytics', () => ({ analytics: { reset: vi.fn() } }));

let storage: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage, addEventListener: vi.fn(), clearTimeout, setTimeout, location: { href: '' } } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
});

describe('profileService invalid-session recovery', () => {
  it('T8: a goal foreign-key failure invokes logout cleanup', async () => {
    const { useAuthStore } = await import('@/app/store/authStore');
    const { offlineQueueStorage } = await import('@/shared/services/offlineSyncService');
    const { profileService } = await import('./profileService');
    useAuthStore.getState().setSession({ user: { id: 'user-a' } } as never);
    storage.setItem('REACT_QUERY_OFFLINE_CACHE', 'cached');
    storage.setItem(offlineQueueStorage.keyForUser('user-a'), '[]');
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    supabase.from
      .mockReturnValueOnce({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) })
      .mockReturnValueOnce({ insert: () => ({ select: () => ({ maybeSingle: async () => ({ data: null, error: { code: '23503', message: 'goals_user_id_fkey' } }) }) }) });

    await expect(profileService.upsertGoal({ deficit_kcal: 2000 })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    expect(storage.getItem('REACT_QUERY_OFFLINE_CACHE')).toBeNull();
    expect(storage.getItem(offlineQueueStorage.keyForUser('user-a'))).toBeNull();
  });
});

describe('profileService macro target upsert', () => {
  it('T-D14-1: surfaces a missing carbs_target error without retrying', async () => {
    const { useAuthStore } = await import('@/app/store/authStore');
    useAuthStore.getState().setSession({ user: { id: 'user-a' } } as never);
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    const error = { code: 'PGRST204', message: 'column "carbs_target" does not exist' };
    supabase.from
      .mockReturnValueOnce({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) })
      .mockReturnValueOnce({ insert: () => ({ select: () => ({ maybeSingle: async () => ({ data: null, error }) }) }) });
    const { profileService } = await import('./profileService');

    await expect(profileService.upsertProfile({ carbs_target: 200 })).rejects.toMatchObject({
      message: expect.stringContaining('carbs_target'),
    });

    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'profiles');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'profiles');
  });

  it('T-D14-2: returns profile data on a successful upsert', async () => {
    const { useAuthStore } = await import('@/app/store/authStore');
    useAuthStore.getState().setSession({ user: { id: 'user-a' } } as never);
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-a' } } }, error: null });
    const profile = { id: 'user-a', email: 'user@example.com', carbs_target: 200 };
    supabase.from
      .mockReturnValueOnce({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) })
      .mockReturnValueOnce({ insert: () => ({ select: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) });
    const { profileService } = await import('./profileService');

    await expect(profileService.upsertProfile({ carbs_target: 200 })).resolves.toEqual(profile);
  });
});
