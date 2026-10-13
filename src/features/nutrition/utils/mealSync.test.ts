import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  recalculateDayScore: vi.fn(),
  upsertWeek: vi.fn(),
}));

vi.mock('@/app/query/queryClient', () => ({
  queryClient: { invalidateQueries: mocks.invalidateQueries },
}));
vi.mock('@/features/reports/services/complianceService', () => ({
  complianceService: { recalculateDayScore: mocks.recalculateDayScore },
}));
vi.mock('@/features/reports/services/weeklyReportService', () => ({
  weeklyReportService: { upsertWeek: mocks.upsertWeek },
}));

import { onMealSaved } from './mealSync';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invalidateQueries.mockResolvedValue(undefined);
  mocks.recalculateDayScore.mockResolvedValue(null);
  mocks.upsertWeek.mockResolvedValue({ status: 'upserted', weekStart: '2026-10-11', weeklyScore: 0, confidence: 'empty' });
});

describe('onMealSaved', () => {
  it('T-MS-1: calls upsertWeek with the weekStart of the meal date', async () => {
    await onMealSaved('2026-10-14');
    expect(mocks.upsertWeek).toHaveBeenCalledTimes(1);
    expect(mocks.upsertWeek).toHaveBeenCalledWith('2026-10-11');
  });

  it('T-MS-2: a throw from upsertWeek does not propagate', async () => {
    mocks.upsertWeek.mockRejectedValue({ code: 'OTHER', message: 'db down' });
    await expect(onMealSaved('2026-10-14')).resolves.toBeUndefined();
    expect(mocks.invalidateQueries).toHaveBeenCalled();
  });

  it('T-MS-3: a Sunday meal date yields the same week', async () => {
    await onMealSaved('2026-10-11');
    expect(mocks.upsertWeek).toHaveBeenCalledWith('2026-10-11');
  });

  it('T-MS-4: a Saturday meal date yields the same week', async () => {
    await onMealSaved('2026-10-17');
    expect(mocks.upsertWeek).toHaveBeenCalledWith('2026-10-11');
  });
});