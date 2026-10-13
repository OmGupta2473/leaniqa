import { describe, it, expect } from 'vitest';
import { parseArgs, computeBackfillRange, writeOneWeek } from './backfill-weekly-reports';

describe('parseArgs', () => {
  it('T-BA-1: no args → defaults', () => {
    expect(parseArgs([])).toEqual({ weeks: 12, execute: false });
  });
  it('T-BA-2: --weeks 4', () => {
    expect(parseArgs(['--weeks', '4'])).toEqual({ weeks: 4, execute: false });
  });
  it('T-BA-3: --execute', () => {
    expect(parseArgs(['--execute'])).toEqual({ weeks: 12, execute: true });
  });
  it('T-BA-4: both flags', () => {
    expect(parseArgs(['--weeks', '4', '--execute'])).toEqual({ weeks: 4, execute: true });
  });
  it('T-BA-5: --weeks 0 throws', () => {
    expect(() => parseArgs(['--weeks', '0'])).toThrow();
  });
  it('T-BA-6: --weeks 53 throws', () => {
    expect(() => parseArgs(['--weeks', '53'])).toThrow();
  });
  it('T-BA-7: --weeks abc throws', () => {
    expect(() => parseArgs(['--weeks', 'abc'])).toThrow();
  });
  it('T-BA-8: --weeks 2.5 throws', () => {
    expect(() => parseArgs(['--weeks', '2.5'])).toThrow();
  });
  it('T-BA-9: --weeks with no value throws', () => {
    expect(() => parseArgs(['--weeks'])).toThrow();
  });
  it('T-BA-10: unknown arg throws', () => {
    expect(() => parseArgs(['--unknown'])).toThrow();
  });
});

describe('computeBackfillRange', () => {
  it('T-BR-1: Mon today, 12 weeks', () => {
    expect(computeBackfillRange('2026-10-12', 12)).toEqual({
      earliestWeekStart: '2026-07-19',
      latestWeekStart: '2026-10-04',
      lastCompleteSaturday: '2026-10-10',
    });
  });
  it('T-BR-2: Sunday today, 1 week', () => {
    expect(computeBackfillRange('2026-10-11', 1)).toEqual({
      earliestWeekStart: '2026-10-04',
      latestWeekStart: '2026-10-04',
      lastCompleteSaturday: '2026-10-10',
    });
  });
  it('T-BR-3: Saturday today, 1 week', () => {
    expect(computeBackfillRange('2026-10-17', 1)).toEqual({
      earliestWeekStart: '2026-10-04',
      latestWeekStart: '2026-10-04',
      lastCompleteSaturday: '2026-10-10',
    });
  });
  it('T-BR-4: next Sunday, 1 week', () => {
    expect(computeBackfillRange('2026-10-18', 1)).toEqual({
      earliestWeekStart: '2026-10-11',
      latestWeekStart: '2026-10-11',
      lastCompleteSaturday: '2026-10-17',
    });
  });
  it('T-BR-5: 52 weeks', () => {
    expect(computeBackfillRange('2026-10-12', 52).earliestWeekStart).toBe('2025-10-12');
  });
});

function makeFakeClient(error: unknown): { client: any; upsertCalls: any[] } {
  const upsertCalls: any[] = [];
  const chain: any = {
    upsert: (row: any, opts: any) => {
      upsertCalls.push({ row, opts });
      return {
        select: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error }),
        }),
      };
    },
  };
  return { client: { from: () => chain }, upsertCalls };
}

const emptyWeekTargets = { calories: 2000, protein: 150, carbs: 200, fat: 60 };

describe('writeOneWeek', () => {
  it('T-WOW-1: returns written on success and upserts with the correct conflict target', async () => {
    const { client, upsertCalls } = makeFakeClient(null);
    const outcome = await writeOneWeek(
      client,
      'user-1',
      '2026-09-06',
      '2026-09-12',
      [],
      [],
      emptyWeekTargets,
      '2026-10-12',
    );
    expect(outcome).toBe('written');
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0].opts).toEqual({ onConflict: 'user_id,week_start' });
    const row = upsertCalls[0].row;
    expect(row.user_id).toBe('user-1');
    expect(row.week_start).toBe('2026-09-06');
    expect(row.week_end).toBe('2026-09-12');
    expect(row.status).toBe('final');
    expect(row.confidence).toBe('empty');
    expect(row.target_calories).toBe(2000);
    expect(row.target_protein_g).toBe(150);
    expect(row.target_carbs_g).toBe(200);
    expect(row.target_fat_g).toBe(60);
    expect(row).not.toHaveProperty('finalized_at');
    expect(row).not.toHaveProperty('created_at');
    expect(row).not.toHaveProperty('report');
  });

  it('T-WOW-2: returns failed when Supabase reports a non-PGRST116 error', async () => {
    const { client } = makeFakeClient({ code: 'OTHER', message: 'db down' });
    const outcome = await writeOneWeek(
      client,
      'user-1',
      '2026-09-06',
      '2026-09-12',
      [],
      [],
      emptyWeekTargets,
      '2026-10-12',
    );
    expect(outcome).toBe('failed');
  });

  it('T-WOW-3: PGRST116 is treated as success (row not returned)', async () => {
    const { client } = makeFakeClient({ code: 'PGRST116', message: 'no rows' });
    const outcome = await writeOneWeek(
      client,
      'user-1',
      '2026-09-06',
      '2026-09-12',
      [],
      [],
      emptyWeekTargets,
      '2026-10-12',
    );
    expect(outcome).toBe('written');
  });
});