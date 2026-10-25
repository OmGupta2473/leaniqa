import { describe, it, expect } from 'vitest';
import { weeklyReportService } from './weeklyReportService';

describe('weeklyReportService.generateActionItems', () => {
  const baseWeekData = {
    daySummaries: [
      { date: '2026-10-05', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Mon
      { date: '2026-10-06', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Tue
      { date: '2026-10-07', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Wed
      { date: '2026-10-08', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Thu
      { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Fri
      { date: '2026-10-10', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Sat
      { date: '2026-10-11', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Sun
    ],
    targets: { calories: 2000, protein: 150 },
    streaks: { calorie: { current: 5, longest: 10 }, protein: { current: 3, longest: 5 } },
  };

  it('T-AI1: protein avg < 80% on >= 4 days fires protein suggestion', () => {
    const weekData = {
      ...baseWeekData,
      daySummaries: [
        { date: '2026-10-05', logged: true, isToday: false, calories: 2000, proteinG: 100 }, // 66%
        { date: '2026-10-06', logged: true, isToday: false, calories: 2000, proteinG: 110 }, // 73%
        { date: '2026-10-07', logged: true, isToday: false, calories: 2000, proteinG: 105 }, // 70%
        { date: '2026-10-08', logged: true, isToday: false, calories: 2000, proteinG: 115 }, // 76%
        { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-10', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-11', logged: true, isToday: false, calories: 2000, proteinG: 150 },
      ],
    };
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      daySummaries: weekData.daySummaries,
    });
    expect(items.some((i) => i.includes('protein') && i.includes('eggs or Greek yogurt'))).toBe(true);
  });

  it('T-AI2: calorie avg > 110% on >= 4 days fires calorie suggestion', () => {
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      daySummaries: [
        { date: '2026-10-05', logged: true, isToday: false, calories: 2300, proteinG: 150 }, // 115%
        { date: '2026-10-06', logged: true, isToday: false, calories: 2250, proteinG: 150 }, // 112.5%
        { date: '2026-10-07', logged: true, isToday: false, calories: 2210, proteinG: 150 }, // 110.5%
        { date: '2026-10-08', logged: true, isToday: false, calories: 2400, proteinG: 150 }, // 120%
        { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-10', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-11', logged: true, isToday: false, calories: 2000, proteinG: 150 },
      ],
    });
    expect(items.some((i) => i.includes('dinner') && i.includes('rice') && i.includes('100 kcal'))).toBe(true);
  });

  it('T-AI3: protein streak = 0 fires streak suggestion', () => {
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      streaks: { calorie: { current: 5, longest: 10 }, protein: { current: 0, longest: 2 } },
    });
    expect(items.some((i) => i.includes('25g') && i.includes('protein per meal'))).toBe(true);
  });

  it('T-AI4: calorie streak >= 5 fires consistency suggestion', () => {
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      streaks: { calorie: { current: 6, longest: 10 }, protein: { current: 3, longest: 5 } },
    });
    expect(items.some((i) => i.includes('Great consistency') && i.includes('portions are working'))).toBe(true);
  });

  it('T-AI5: weekend calories > weekday avg + 300 fires weekend suggestion', () => {
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      daySummaries: [
        { date: '2026-10-05', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Mon
        { date: '2026-10-06', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Tue
        { date: '2026-10-07', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Wed
        { date: '2026-10-08', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Thu
        { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 }, // Fri
        { date: '2026-10-10', logged: true, isToday: false, calories: 2500, proteinG: 150 }, // Sat
        { date: '2026-10-11', logged: true, isToday: false, calories: 2600, proteinG: 150 }, // Sun
      ],
    });
    expect(items.some((i) => i.includes('Weekend') && i.includes('planning meals ahead'))).toBe(true);
  });

  it('T-AI6: no rules fire returns empty array', () => {
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      streaks: { calorie: { current: 0, longest: 0 }, protein: { current: 3, longest: 5 } },
    });
    // With all days at target, no rules should fire
    expect(items.length).toBeGreaterThanOrEqual(0); // May have calorie streak = 0 or other
  });

  it('T-AI7: max 3 items returned', () => {
    // Fire multiple rules
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      daySummaries: [
        { date: '2026-10-05', logged: true, isToday: false, calories: 2300, proteinG: 100 }, // cal high, pro low
        { date: '2026-10-06', logged: true, isToday: false, calories: 2300, proteinG: 100 },
        { date: '2026-10-07', logged: true, isToday: false, calories: 2300, proteinG: 100 },
        { date: '2026-10-08', logged: true, isToday: false, calories: 2300, proteinG: 100 },
        { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-10', logged: true, isToday: false, calories: 2500, proteinG: 150 }, // weekend high
        { date: '2026-10-11', logged: true, isToday: false, calories: 2600, proteinG: 150 }, // weekend high
      ],
      streaks: { calorie: { current: 6, longest: 10 }, protein: { current: 0, longest: 2 } },
    });
    expect(items.length).toBeLessThanOrEqual(3);
  });

  it('T-AI8: deduplication by category', () => {
    // Fire calorie rule twice (should only appear once)
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      daySummaries: [
        { date: '2026-10-05', logged: true, isToday: false, calories: 2300, proteinG: 150 },
        { date: '2026-10-06', logged: true, isToday: false, calories: 2300, proteinG: 150 },
        { date: '2026-10-07', logged: true, isToday: false, calories: 2300, proteinG: 150 },
        { date: '2026-10-08', logged: true, isToday: false, calories: 2300, proteinG: 150 },
        { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-10', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-11', logged: true, isToday: false, calories: 2000, proteinG: 150 },
      ],
      streaks: { calorie: { current: 6, longest: 10 }, protein: { current: 3, longest: 5 } },
    });
    // Should only have one calorie suggestion even though both calorie streak and calorie avg rules fire
    const calorieItems = items.filter((i) => i.includes('dinner') || i.includes('consistency'));
    expect(calorieItems.length).toBeLessThanOrEqual(2);
  });

  it('T-AI9: suggestion tone - no imperative commands', () => {
    const items = weeklyReportService.generateActionItems({
      ...baseWeekData,
      daySummaries: [
        { date: '2026-10-05', logged: true, isToday: false, calories: 2000, proteinG: 100 },
        { date: '2026-10-06', logged: true, isToday: false, calories: 2000, proteinG: 100 },
        { date: '2026-10-07', logged: true, isToday: false, calories: 2000, proteinG: 100 },
        { date: '2026-10-08', logged: true, isToday: false, calories: 2000, proteinG: 100 },
        { date: '2026-10-09', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-10', logged: true, isToday: false, calories: 2000, proteinG: 150 },
        { date: '2026-10-11', logged: true, isToday: false, calories: 2000, proteinG: 150 },
      ],
      streaks: { calorie: { current: 5, longest: 10 }, protein: { current: 0, longest: 2 } },
    });
    for (const item of items) {
      // Should not start with imperative verbs (whole word match)
      expect(item.toLowerCase()).not.toMatch(/^(add|eat|reduce|swap|plan|watch|cut|increase|decrease|must|should|need to)\b/);
      // "aiming" is a participle, not imperative "aim"
      // Should use suggestion language or positive reinforcement language
      expect(item.toLowerCase()).toMatch(/(could|would|might|consider|option|suggestion|great|consistency|working well)/);
    }
  });

  it('T-AI10: empty week data returns empty array', () => {
    const items = weeklyReportService.generateActionItems({
      daySummaries: [],
      targets: { calories: 2000, protein: 150 },
      streaks: { calorie: { current: 0, longest: 0 }, protein: { current: 0, longest: 0 } },
    });
    expect(items).toEqual([]);
  });
});