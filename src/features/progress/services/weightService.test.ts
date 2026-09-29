import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  getUserId: vi.fn().mockResolvedValue('user-1'),
  upsertResult: { data: null as unknown, error: null as unknown },
  lastUpsert: null as null | { payload: any; opts: any },
}));

vi.mock('@/shared/utils/supabase', () => ({ supabase: { from: mocks.from, auth: {} } }));
vi.mock('@/features/auth/services/authService', () => ({ authService: { getUserId: mocks.getUserId } }));
vi.mock('@/features/profile/services/profileService', () => ({ profileService: { updateProfile: vi.fn().mockResolvedValue(null), getProfile: vi.fn().mockResolvedValue(null) } }));
vi.mock('@/app/query/queryClient', () => ({ queryClient: { getQueryData: vi.fn().mockReturnValue(null), fetchQuery: vi.fn().mockResolvedValue(null) } }));

import { weightService } from './weightService';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upsertResult = { data: null, error: null };
  mocks.lastUpsert = null;
  const upsertChain = { select: () => ({ maybeSingle: async () => mocks.upsertResult }) };
  mocks.upsert.mockImplementation((payload, opts) => {
    mocks.lastUpsert = { payload, opts };
    return upsertChain;
  });
  mocks.from.mockImplementation(() => ({ upsert: mocks.upsert }));
});

describe('weightService.addWeightLog idempotent upsert', () => {
  it('T-D18-1: upserts with the unique conflict target and normalized date', async () => {
    await weightService.addWeightLog({ weight: 80, date: '2026-09-29T10:00:00Z' });

    expect(mocks.lastUpsert).toMatchObject({ payload: { date: '2026-09-29' }, opts: { onConflict: 'user_id,date' } });
  });

  it('T-D18-2: performs exactly one write without a pre-check query', async () => {
    await weightService.addWeightLog({ weight: 80, date: '2026-09-29' });

    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith('weight_logs');
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it('T-D18-3: propagates a non-PGRST116 error', async () => {
    const error = { code: '23505', message: 'duplicate key' };
    mocks.upsertResult = { data: null, error };

    await expect(weightService.addWeightLog({ weight: 80, date: '2026-09-29' })).rejects.toBe(error);
  });

  it('T-D18-4: returns the database row on success', async () => {
    const row = { id: 'w-1', user_id: 'user-1', weight: 80, date: '2026-09-29' };
    mocks.upsertResult = { data: row, error: null };

    await expect(weightService.addWeightLog({ weight: 80, date: '2026-09-29' })).resolves.toEqual(row);
  });
});