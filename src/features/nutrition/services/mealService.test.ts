import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUserId: vi.fn(),
  insert: vi.fn(),
  insertResult: { data: null as unknown, error: null as unknown },
}));

vi.mock('@/shared/utils/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/features/auth/services/authService', () => ({ authService: { getUserId: mocks.getUserId } }));
vi.mock('@/shared/utils/logger', () => ({ devLog: vi.fn(), devWarn: vi.fn(), logError: vi.fn() }));

import { mealService } from './mealService';

const validMeal = {
  meal_text: 'Oatmeal',
  calories: 350,
  protein: 12,
  fat: 8,
  carbs: 58,
  meal_time: '2026-09-29T12:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserId.mockResolvedValue('user-1');
  mocks.insertResult = { data: null, error: null };
  mocks.insert.mockImplementation(() => ({
    select: () => ({ maybeSingle: async () => mocks.insertResult }),
  }));
  mocks.from.mockImplementation(() => {
    const query: any = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: mocks.insert,
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    return query;
  });
});

describe('mealService.addMeal meal_slot handling', () => {
  it('T-D6-1: throws a missing-column error without retrying the insert', async () => {
    const error = { code: 'PGRST204', message: 'column meal_slot does not exist' };
    mocks.insertResult = { data: null, error };

    await expect(mealService.addMeal({ ...validMeal, meal_slot: 'lunch' })).rejects.toMatchObject(error);

    expect(mocks.from).toHaveBeenCalledWith('meal_logs');
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it('T-D6-2: returns the meal_slot on a successful insert', async () => {
    const row = { ...validMeal, id: 'meal-1', user_id: 'user-1', meal_slot: 'lunch' as const };
    mocks.insertResult = { data: row, error: null };

    const result = await mealService.addMeal({ ...validMeal, meal_slot: 'lunch' });

    expect(result).toMatchObject({ meal_slot: 'lunch' });
  });

  it('T-D6-3: strips snack from the insert payload', async () => {
    await mealService.addMeal({ ...validMeal, meal_slot: 'snack' });

    expect(mocks.insert).toHaveBeenCalledWith(expect.not.objectContaining({ meal_slot: 'snack' }));
  });
});
