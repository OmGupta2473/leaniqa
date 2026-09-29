import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUserId: vi.fn(),
  insert: vi.fn(),
  upsert: vi.fn(),
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
  client_token: 'tok-d6',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserId.mockResolvedValue('user-1');
  mocks.insertResult = { data: null, error: null };
  mocks.insert.mockImplementation(() => ({
    select: () => ({ maybeSingle: async () => mocks.insertResult }),
  }));
  mocks.upsert.mockImplementation((payload) => mocks.insert(payload));
  mocks.from.mockImplementation(() => {
    const query: any = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: mocks.insert,
      upsert: mocks.upsert,
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

  it('T-D9-1: upserts the same client_token on retries and returns the same row', async () => {
    const row = { ...validMeal, id: 'meal-1', user_id: 'user-1', meal_slot: 'lunch' as const, client_token: 'tok-1' };
    mocks.insertResult = { data: row, error: null };
    const meal = { ...validMeal, meal_slot: 'lunch' as const, client_token: 'tok-1' };

    const firstResult = await mealService.addMeal(meal);
    const secondResult = await mealService.addMeal(meal);

    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert.mock.calls[0][0]).toEqual(mocks.upsert.mock.calls[1][0]);
    expect(firstResult).toEqual(row);
    expect(secondResult).toEqual(row);
  });

  it('T-D9-2: uses distinct upsert payloads for different client_tokens', async () => {
    await mealService.addMeal({ ...validMeal, client_token: 'tok-a' });
    await mealService.addMeal({ ...validMeal, client_token: 'tok-b' });

    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert.mock.calls[0][0].client_token).toBe('tok-a');
    expect(mocks.upsert.mock.calls[1][0].client_token).toBe('tok-b');
  });

  it('T-D9-3: strips snack from the upsert payload', async () => {
    await mealService.addMeal({ ...validMeal, meal_slot: 'snack' });

    expect(mocks.upsert.mock.calls[0][0]).not.toHaveProperty('meal_slot');
  });

  it('T-D9-4: rounds numeric fields in the upsert payload', async () => {
    await mealService.addMeal({
      ...validMeal,
      calories: 349.7,
      protein: 11.4,
      fat: 7.6,
      carbs: 57.5,
    });

    expect(mocks.upsert.mock.calls[0][0]).toMatchObject({
      calories: 350,
      protein: 11,
      fat: 8,
      carbs: 58,
    });
  });

  it('T-D9-5 (known-bug: fiber dropped): keeps the current zero fiber payload', async () => {
    await mealService.addMeal({ ...validMeal, fiber: 12 });

    expect(mocks.upsert.mock.calls[0][0].fiber).toBe(0);
  });
});
