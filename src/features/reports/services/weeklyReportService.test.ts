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

import { weeklyReportService } from './weeklyReportService';
import type { DbWeeklyReport } from '@/shared/types/supabase';

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.lt = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return chain;
}

const sampleRow: DbWeeklyReport = {
  id: 'wr-1',
  user_id: 'user-1',
  week_start: '2026-10-11',
  week_end: '2026-10-17',
  status: 'final',
  days_with_meals: 6,
  days_with_weight: 4,
  total_calories: 12000,
  avg_calories: 2000,
  target_calories: 2000,
  total_protein_g: 900,
  avg_protein_g: 150,
  target_protein_g: 150,
  total_carbs_g: 1200,
  avg_carbs_g: 200,
  target_carbs_g: 200,
  total_fat_g: 360,
  avg_fat_g: 60,
  target_fat_g: 60,
  weekly_score: 85,
  confidence: 'medium',
  day_summaries: [],
  computed_at: '2026-10-18T00:00:00Z',
  finalized_at: '2026-10-18T00:00:00Z',
  created_at: '2026-10-18T00:00:00Z',
  updated_at: '2026-10-18T00:00:00Z',
};

const fullProfile = {
  target_kcal: 2000,
  protein_target: 150,
  carbs_target: 200,
  fat_target: 60,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserId.mockResolvedValue('user-1');
});

describe('weeklyReportService', () => {
  describe('getWeek', () => {
    it('T-WRS-1: returns the row on hit', async () => {
      const chain = buildChain({ data: sampleRow, error: null });
      mocks.from.mockReturnValue(chain);
      const result = await weeklyReportService.getWeek('2026-10-11');
      expect(result).toEqual(sampleRow);
      expect(mocks.getUserId).toHaveBeenCalledTimes(1);
      expect(mocks.from).toHaveBeenCalledWith('weekly_reports');
    });

    it('T-WRS-2: returns null on PGRST116', async () => {
      const chain = buildChain({ data: null, error: { code: 'PGRST116' } });
      mocks.from.mockReturnValue(chain);
      const result = await weeklyReportService.getWeek('2026-10-11');
      expect(result).toBeNull();
    });

    it('T-WRS-3: throws on other errors', async () => {
      const error = { code: 'OTHER', message: 'server down' };
      const chain = buildChain({ data: null, error });
      mocks.from.mockReturnValue(chain);
      await expect(weeklyReportService.getWeek('2026-10-11')).rejects.toBe(error);
    });

    it('T-WRS-4: scopes by user_id and week_start', async () => {
      const chain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(chain);
      await weeklyReportService.getWeek('2026-10-11');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.eq).toHaveBeenCalledWith('week_start', '2026-10-11');
    });
  });

  describe('getPreviousWeekWithMeals', () => {
    it('T-WRS-5: returns the row on hit', async () => {
      const chain = buildChain({ data: sampleRow, error: null });
      mocks.from.mockReturnValue(chain);
      const result = await weeklyReportService.getPreviousWeekWithMeals('2026-10-18');
      expect(result).toEqual(sampleRow);
    });

    it('T-WRS-6: returns null when nothing qualifies', async () => {
      const chain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(chain);
      const result = await weeklyReportService.getPreviousWeekWithMeals('2026-10-18');
      expect(result).toBeNull();
    });

    it('T-WRS-7: issues the correct query bounds', async () => {
      const chain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(chain);
      await weeklyReportService.getPreviousWeekWithMeals('2026-10-18');
      expect(chain.lt).toHaveBeenCalledWith('week_start', '2026-10-18');
      expect(chain.gte).toHaveBeenCalledWith('week_start', '2026-07-26');
      expect(chain.gt).toHaveBeenCalledWith('days_with_meals', 0);
    });

    it('T-WRS-8: orders descending and limits to 1', async () => {
      const chain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(chain);
      await weeklyReportService.getPreviousWeekWithMeals('2026-10-18');
      expect(chain.order).toHaveBeenCalledWith('week_start', { ascending: false });
      expect(chain.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('listWeeksWithReports', () => {
    it('T-WRS-9: does not apply a limit', async () => {
      const chain = buildChain({ data: [], error: null });
      mocks.from.mockReturnValue(chain);
      await weeklyReportService.listWeeksWithReports();
      expect(chain.limit).not.toHaveBeenCalled();
    });



    it('T-WRS-11: returns [] when data is null', async () => {
      const chain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(chain);
      const result = await weeklyReportService.listWeeksWithReports();
      expect(result).toEqual([]);
    });

    it('T-WRS-12: scopes by user_id', async () => {
      const chain = buildChain({ data: [], error: null });
      mocks.from.mockReturnValue(chain);
      await weeklyReportService.listWeeksWithReports();
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  describe('upsertWeek', () => {
    it('T-UW-1: skipped_no_session when getUserId throws', async () => {
      mocks.getUserId.mockRejectedValue(new Error('no session'));
      const result = await weeklyReportService.upsertWeek('2026-10-11');
      expect(result).toEqual({ status: 'skipped_no_session' });
      expect(mocks.from).not.toHaveBeenCalled();
    });

    it('T-UW-2: skipped_missing_targets lists every missing field', async () => {
      const profileChain = buildChain({
        data: { target_kcal: null, protein_target: 150, carbs_target: null, fat_target: null },
        error: null,
      });
      mocks.from.mockReturnValue(profileChain);
      const result = await weeklyReportService.upsertWeek('2026-10-11');
      expect(result).toEqual({
        status: 'skipped_missing_targets',
        missing: ['target_kcal', 'carbs_target', 'fat_target'],
      });
      expect(mocks.from).toHaveBeenCalledTimes(1);
      expect(mocks.from).toHaveBeenCalledWith('profiles');
    });

    it('T-UW-3: skips when the profile row is missing entirely', async () => {
      const profileChain = buildChain({ data: null, error: null });
      mocks.from.mockReturnValue(profileChain);
      const result = await weeklyReportService.upsertWeek('2026-10-11');
      expect(result.status).toBe('skipped_missing_targets');
      if (result.status === 'skipped_missing_targets') {
        expect(result.missing.length).toBe(4);
      }
    });

    it('T-UW-4: upserts a report row with all four targets present', async () => {
      const profileChain = buildChain({ data: fullProfile, error: null });
      const mealsChain = buildChain({ data: [], error: null });
      const weightChain = buildChain({ data: [], error: null });
      const upsertChain = buildChain({ data: null, error: null });
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'meal_logs') return mealsChain;
        if (table === 'weight_logs') return weightChain;
        if (table === 'weekly_reports') return upsertChain;
        throw new Error('unexpected table: ' + table);
      });

        const result = await weeklyReportService.upsertWeek('2026-09-06');

        expect(result).toMatchObject({
        status: 'upserted',
        weekStart: '2026-09-06',
      });
      if (result.status === 'upserted') {
        expect(typeof result.weeklyScore).toBe('number');
        expect(result.confidence).toBe('empty');
      }
      expect(upsertChain.upsert).toHaveBeenCalledTimes(1);
      const [payload, opts] = upsertChain.upsert.mock.calls[0];
      expect(opts).toEqual({ onConflict: 'user_id,week_start' });
            expect(payload).toMatchObject({
        user_id: 'user-1',
        week_start: '2026-09-06',
        week_end: '2026-09-12',
        target_calories: 2000,
        target_protein_g: 150,
        target_carbs_g: 200,
        target_fat_g: 60,
        status: 'final',
        confidence: 'empty',
        weekly_score: 0,
      });
      expect(payload).not.toHaveProperty('finalized_at');
      expect(payload).not.toHaveProperty('created_at');
      expect(payload).not.toHaveProperty('report');
    });

    it('T-UW-5: meal query uses the IST week boundaries as UTC instants', async () => {
      const profileChain = buildChain({ data: fullProfile, error: null });
      const mealsChain = buildChain({ data: [], error: null });
      const weightChain = buildChain({ data: [], error: null });
      const upsertChain = buildChain({ data: null, error: null });
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'meal_logs') return mealsChain;
        if (table === 'weight_logs') return weightChain;
        if (table === 'weekly_reports') return upsertChain;
        throw new Error('unexpected table: ' + table);
      });

      await weeklyReportService.upsertWeek('2026-10-11');

      const gteCall = mealsChain.gte.mock.calls.find((c: any[]) => c[0] === 'meal_time');
      const ltCall = mealsChain.lt.mock.calls.find((c: any[]) => c[0] === 'meal_time');
      expect(gteCall?.[1]).toBe('2026-10-10T18:30:00.000Z');
      expect(ltCall?.[1]).toBe('2026-10-17T18:30:00.000Z');
    });

    it('T-UW-6: weight query scopes to the week inclusively by IST date', async () => {
      const profileChain = buildChain({ data: fullProfile, error: null });
      const mealsChain = buildChain({ data: [], error: null });
      const weightChain = buildChain({ data: [], error: null });
      const upsertChain = buildChain({ data: null, error: null });
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'meal_logs') return mealsChain;
        if (table === 'weight_logs') return weightChain;
        if (table === 'weekly_reports') return upsertChain;
        throw new Error('unexpected table: ' + table);
      });

      await weeklyReportService.upsertWeek('2026-10-11');

      expect(weightChain.gte).toHaveBeenCalledWith('date', '2026-10-11');
      expect(weightChain.lte).toHaveBeenCalledWith('date', '2026-10-17');
    });

    it('T-UW-7: throws when the profile read fails with a non-PGRST116 error', async () => {
      const error = { code: 'OTHER', message: 'db down' };
      const profileChain = buildChain({ data: null, error });
      mocks.from.mockReturnValue(profileChain);
      await expect(weeklyReportService.upsertWeek('2026-10-11')).rejects.toBe(error);
    });

    it('T-UW-8: throws when the meals read fails', async () => {
      const profileChain = buildChain({ data: fullProfile, error: null });
      const error = { code: 'OTHER', message: 'db down' };
      const mealsChain = buildChain({ data: null, error });
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'meal_logs') return mealsChain;
        throw new Error('unexpected table: ' + table);
      });
      await expect(weeklyReportService.upsertWeek('2026-10-11')).rejects.toBe(error);
    });

    it('T-UW-9: throws when the upsert fails', async () => {
      const profileChain = buildChain({ data: fullProfile, error: null });
      const mealsChain = buildChain({ data: [], error: null });
      const weightChain = buildChain({ data: [], error: null });
      const error = { code: 'OTHER', message: 'db down' };
      const upsertChain = buildChain({ data: null, error });
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'meal_logs') return mealsChain;
        if (table === 'weight_logs') return weightChain;
        if (table === 'weekly_reports') return upsertChain;
        throw new Error('unexpected table: ' + table);
      });
      await expect(weeklyReportService.upsertWeek('2026-10-11')).rejects.toBe(error);
    });

    it('T-UW-10: engine receives the profile targets verbatim', async () => {
      const customProfile = {
        target_kcal: 1850,
        protein_target: 140,
        carbs_target: 190,
        fat_target: 55,
      };
      const profileChain = buildChain({ data: customProfile, error: null });
      const mealsChain = buildChain({ data: [], error: null });
      const weightChain = buildChain({ data: [], error: null });
      const upsertChain = buildChain({ data: null, error: null });
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'meal_logs') return mealsChain;
        if (table === 'weight_logs') return weightChain;
        if (table === 'weekly_reports') return upsertChain;
        throw new Error('unexpected table: ' + table);
      });

      await weeklyReportService.upsertWeek('2026-10-11');

      const [payload] = upsertChain.upsert.mock.calls[0];
      expect(payload.target_calories).toBe(1850);
      expect(payload.target_protein_g).toBe(140);
      expect(payload.target_carbs_g).toBe(190);
      expect(payload.target_fat_g).toBe(55);
    });
  });
});