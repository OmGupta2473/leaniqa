import { describe, it, expect } from 'vitest';
import { computeWeeklyReport } from './weeklyEngine';
import type { DbMealLog, DbWeightLog } from '@/shared/types/supabase';

const WEEK_START = '2026-10-11'; // Sunday
const WEEK_END = '2026-10-17';   // Saturday
const TODAY_LIVE = '2026-10-13'; // Tuesday, inside the week
const TODAY_FINAL = '2026-10-20'; // After weekEnd

const DEFAULT_TARGETS = { calories: 2000, protein: 150, carbs: 200, fat: 60 };

const DAYS = [
  '2026-10-11',
  '2026-10-12',
  '2026-10-13',
  '2026-10-14',
  '2026-10-15',
  '2026-10-16',
  '2026-10-17',
];

/**
 * Builds a meal whose meal_time is noon IST on the given IST calendar day.
 * 12:00 IST = 06:30 UTC. Using a fixed mid-day instant avoids edge cases
 * near IST midnight.
 */
function mealAt(istDate: string, overrides: Partial<DbMealLog> = {}): DbMealLog {
  const [y, m, d] = istDate.split('-').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, 6, 30, 0, 0);
  return {
    user_id: 'u1',
    meal_text: 'test meal',
    calories: 2000,
    protein: 150,
    fat: 60,
    carbs: 200,
    meal_time: new Date(utcMs).toISOString(),
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<Parameters<typeof computeWeeklyReport>[0]> = {},
): Parameters<typeof computeWeeklyReport>[0] {
  return {
    weekStart: WEEK_START,
    weekEnd: WEEK_END,
    nowIsoDate: TODAY_LIVE,
    meals: [],
    weightLogs: [],
    targets: { ...DEFAULT_TARGETS },
    ...overrides,
  };
}

describe('computeWeeklyReport', () => {
  describe('empty week', () => {
    it('T-E1: zero everything with confidence empty', () => {
      const result = computeWeeklyReport(baseInput());
      expect(result.daysWithMeals).toBe(0);
      expect(result.daysWithWeight).toBe(0);
      expect(result.weeklyScore).toBe(0);
      expect(result.confidence).toBe('empty');
      expect(result.totalCalories).toBe(0);
      expect(result.avgCalories).toBe(0);
      expect(result.avgProteinG).toBe(0);
      expect(result.avgCarbsG).toBe(0);
      expect(result.avgFatG).toBe(0);
      expect(result.daySummaries).toHaveLength(7);
      for (const s of result.daySummaries) {
        expect(s.logged).toBe(false);
        expect(s.status).toBe('not_logged');
        expect(s.score).toBe(0);
        expect(s.calories).toBe(0);
      }
    });

    it('T-E2: daySummaries are Sunday-first with correct dayOfWeek', () => {
      const result = computeWeeklyReport(baseInput());
      expect(result.daySummaries[0].date).toBe('2026-10-11');
      expect(result.daySummaries[0].dayOfWeek).toBe(0);
      expect(result.daySummaries[6].date).toBe('2026-10-17');
      expect(result.daySummaries[6].dayOfWeek).toBe(6);
    });
  });

  describe('perfect week', () => {
    it('T-P1: seven on-target days yields weeklyScore 100 and high confidence', () => {
      const meals = DAYS.map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals, nowIsoDate: '2026-10-18' }));
      expect(result.daysWithMeals).toBe(7);
      expect(result.weeklyScore).toBe(100);
      expect(result.confidence).toBe('high');
      for (const s of result.daySummaries) {
        expect(s.logged).toBe(true);
        expect(s.status).toBe('on_target');
      }
    });
  });

  describe('missing days', () => {
    it('T-M1: six on-target days and one missing yields 97', () => {
      const meals = DAYS.slice(0, 6).map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals, nowIsoDate: '2026-10-18' }));
      expect(result.daysWithMeals).toBe(6);
      expect(result.weeklyScore).toBe(97);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('multiple meals on one day', () => {
    it('T-MM1: three meals on one day collapse to a single logged day', () => {
      const meals = [
        mealAt(DAYS[0], { calories: 500, protein: 40, fat: 15, carbs: 50 }),
        mealAt(DAYS[0], { calories: 700, protein: 55, fat: 25, carbs: 70 }),
        mealAt(DAYS[0], { calories: 800, protein: 55, fat: 20, carbs: 80 }),
      ];
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.daysWithMeals).toBe(1);
      expect(result.daySummaries[0].calories).toBe(2000);
      expect(result.daySummaries[0].proteinG).toBe(150);
      expect(result.daySummaries[0].carbsG).toBe(200);
      expect(result.daySummaries[0].fatG).toBe(60);
    });
  });

  describe('confidence bands', () => {
    it('T-C1: 1 logged day -> insufficient', () => {
      const result = computeWeeklyReport(baseInput({ meals: [mealAt(DAYS[0])] }));
      expect(result.confidence).toBe('insufficient');
    });
    it('T-C2: 2 logged days -> insufficient', () => {
      const meals = DAYS.slice(0, 2).map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.confidence).toBe('insufficient');
    });
    it('T-C3: 3 logged days -> low', () => {
      const meals = DAYS.slice(0, 3).map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.confidence).toBe('low');
    });
    it('T-C4: 4 logged days -> low', () => {
      const meals = DAYS.slice(0, 4).map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.confidence).toBe('low');
    });
    it('T-C5: 5 logged days -> medium', () => {
      const meals = DAYS.slice(0, 5).map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.confidence).toBe('medium');
    });
    it('T-C6: 6 logged days -> medium', () => {
      const meals = DAYS.slice(0, 6).map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.confidence).toBe('medium');
    });
    it('T-C7: 7 logged days -> high', () => {
      const meals = DAYS.map((d) => mealAt(d));
      const result = computeWeeklyReport(baseInput({ meals }));
      expect(result.confidence).toBe('high');
    });
  });

  describe('day status', () => {
    it('T-S1: calories above 110% of target -> over', () => {
      const meal = mealAt(DAYS[0], { calories: 2500 });
      const result = computeWeeklyReport(baseInput({ meals: [meal] }));
      expect(result.daySummaries[0].status).toBe('over');
    });

    it('T-S2: calories below 90% of target -> under', () => {
      const meal = mealAt(DAYS[0], { calories: 1500 });
      const result = computeWeeklyReport(baseInput({ meals: [meal] }));
      expect(result.daySummaries[0].status).toBe('under');
    });

    it('T-S3: calories in range but protein below 90% -> protein_low', () => {
      const meal = mealAt(DAYS[0], { calories: 2000, protein: 100 });
      const result = computeWeeklyReport(baseInput({ meals: [meal] }));
      expect(result.daySummaries[0].status).toBe('protein_low');
    });

    it('T-S4: exactly 90% of target calories -> on_target (inclusive)', () => {
      const meal = mealAt(DAYS[0], { calories: 1800, protein: 150 });
      const result = computeWeeklyReport(baseInput({ meals: [meal] }));
      expect(result.daySummaries[0].status).toBe('on_target');
    });

    it('T-S5: exactly 110% of target calories -> on_target (inclusive)', () => {
      const meal = mealAt(DAYS[0], { calories: 2200, protein: 135 });
      const result = computeWeeklyReport(baseInput({ meals: [meal] }));
      expect(result.daySummaries[0].status).toBe('on_target');
    });
  });

  describe('timezone grouping', () => {
    it('T-TZ1: meal at 2026-10-10T20:00:00Z lands on IST Oct 11', () => {
      const meal: DbMealLog = {
        user_id: 'u1',
        meal_text: 'late night snack',
        calories: 500,
        protein: 20,
        fat: 10,
        carbs: 60,
        meal_time: '2026-10-10T20:00:00.000Z',
      };
      const result = computeWeeklyReport(baseInput({ meals: [meal] }));

      const oct11 = result.daySummaries.find((s) => s.date === '2026-10-11');
      expect(oct11).toBeDefined();
      expect(oct11?.logged).toBe(true);
      expect(oct11?.calories).toBe(500);

      const outsideWeek = result.daySummaries.find((s) => s.date === '2026-10-10');
      expect(outsideWeek).toBeUndefined();
    });
  });

  describe('week status', () => {
    it('T-STAT1: weekEnd before nowIsoDate -> final', () => {
      const result = computeWeeklyReport(baseInput({ nowIsoDate: TODAY_FINAL }));
      expect(result.status).toBe('final');
    });

    it('T-STAT2: weekEnd equals nowIsoDate -> live', () => {
      const result = computeWeeklyReport(baseInput({ nowIsoDate: WEEK_END }));
      expect(result.status).toBe('live');
    });

    it('T-STAT3: nowIsoDate before weekEnd -> live', () => {
      const result = computeWeeklyReport(baseInput({ nowIsoDate: TODAY_LIVE }));
      expect(result.status).toBe('live');
    });
  });

  describe('target snapshot', () => {
    it('T-T1: target fields echo input targets verbatim', () => {
      const targets = { calories: 1850, protein: 140, carbs: 190, fat: 55 };
      const result = computeWeeklyReport(baseInput({ targets }));
      expect(result.targetCalories).toBe(1850);
      expect(result.targetProteinG).toBe(140);
      expect(result.targetCarbsG).toBe(190);
      expect(result.targetFatG).toBe(55);
    });
  });

  describe('weight logs', () => {
    it('T-W1: daysWithWeight counts distinct IST days with a weight log', () => {
      const weightLogs: DbWeightLog[] = [
        { user_id: 'u1', weight: 80, date: '2026-10-11' },
        { user_id: 'u1', weight: 80, date: '2026-10-12' },
        { user_id: 'u1', weight: 80, date: '2026-10-12' },
      ];
      const result = computeWeeklyReport(baseInput({ weightLogs }));
      expect(result.daysWithWeight).toBe(2);
    });

    it('T-W2: out-of-range weight log is not counted', () => {
      const weightLogs: DbWeightLog[] = [
        { user_id: 'u1', weight: 80, date: '2026-10-05' },
      ];
      const result = computeWeeklyReport(baseInput({ weightLogs }));
      expect(result.daysWithWeight).toBe(0);
    });

    it('T-W3: weight log on a day makes hasWeightLogged true for that day', () => {
      const meal = mealAt(DAYS[0]);
      const weightLogs: DbWeightLog[] = [
        { user_id: 'u1', weight: 80, date: DAYS[0] },
      ];
      const result = computeWeeklyReport(baseInput({ meals: [meal], weightLogs }));
      expect(result.daySummaries[0].score).toBe(100);
    });
  });

  describe('averages', () => {
    it('T-AV1: averages divide by daysWithMeals, not by 7', () => {
      const meals = DAYS.slice(0, 3).map((d) =>
        mealAt(d, { calories: 2000, protein: 150, carbs: 200, fat: 60 }),
      );
      const result = computeWeeklyReport(baseInput({ meals, nowIsoDate: '2026-10-18' }));
      expect(result.daysWithMeals).toBe(3);
      expect(result.totalCalories).toBe(6000);
      expect(result.avgCalories).toBe(2000);
      expect(result.totalProteinG).toBe(450);
      expect(result.avgProteinG).toBe(150);
    });
  });
});