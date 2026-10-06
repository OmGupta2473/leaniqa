import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUserId: vi.fn(),
}));

vi.mock('@/shared/utils/supabase', () => ({
  supabase: { from: mocks.from },
}));
vi.mock('@/features/auth/services/authService', () => ({
  authService: { getUserId: mocks.getUserId },
}));

import { awardService } from './awardService';
import type { DbUserAward } from '@/shared/types/supabase';

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserId.mockResolvedValue('user-1');
});

describe('awardService', () => {
  describe('getUnacknowledgedAwards', () => {
    it('T-AS-1: filters by user_id, acknowledged_at IS NULL, and orders by unlocked_at ASC', async () => {
      const row1: DbUserAward = { id: '1', user_id: 'user-1', award_id: 'log_first', unlocked_at: '2026-10-01T10:00:00Z', acknowledged_at: null };
      const row2: DbUserAward = { id: '2', user_id: 'user-1', award_id: 'streak_1', unlocked_at: '2026-10-02T10:00:00Z', acknowledged_at: null };
      const chain = buildChain({ data: [row1, row2], error: null });
      mocks.from.mockReturnValue(chain);

      const result = await awardService.getUnacknowledgedAwards();

      expect(mocks.from).toHaveBeenCalledWith('user_awards');
      expect(chain.is).toHaveBeenCalledWith('acknowledged_at', null);
      expect(chain.order).toHaveBeenCalled();
      expect(result).toEqual([row1, row2]);
    });
  });

  describe('acknowledgeAwards', () => {
    it('T-AS-2: issues UPDATE with .in() and .is(acknowledged_at, null)', async () => {
      const chain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(chain);

      const result = await awardService.acknowledgeAwards(['a1', 'a2']);

      expect(result).toBe(true);
      expect(mocks.from).toHaveBeenCalledWith('user_awards');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ acknowledged_at: expect.any(String) }));
      expect(chain.in).toHaveBeenCalledWith('award_id', ['a1', 'a2']);
      expect(chain.is).toHaveBeenCalledWith('acknowledged_at', null);
    });

    it('T-AS-3: returns false on non-PGRST error', async () => {
      const chain = buildChain({ data: null, error: { code: 'OTHER', message: 'Server error' } });
      mocks.from.mockReturnValue(chain);

      const result = await awardService.acknowledgeAwards(['a1']);

      expect(result).toBe(false);
    });

    it('T-AS-4: short-circuits and returns true for empty array without network call', async () => {
      const result = await awardService.acknowledgeAwards([]);

      expect(result).toBe(true);
      expect(mocks.from).not.toHaveBeenCalled();
    });
  });
});