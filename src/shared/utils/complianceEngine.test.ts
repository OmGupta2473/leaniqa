import { describe, it, expect } from 'vitest';
import { calculateDailyScore } from './complianceEngine';

describe('calculateDailyScore', () => {
  it('should score high for exact target hit', () => {
    const score = calculateDailyScore({
      targetCalories: 2000,
      actualCalories: 2000,
      targetProtein: 150,
      actualProtein: 150,
      hasWeightLogged: true
    });
    // calScore = 50, proScore = 30, weightScore = 20
    expect(score).toBe(100);
  });

  it('should score 0 for calorie component if zero calories logged', () => {
    const score = calculateDailyScore({
      targetCalories: 2000,
      actualCalories: 0,
      targetProtein: 150,
      actualProtein: 150,
      hasWeightLogged: true
    });
    // calScore = 0, proScore = 30, weightScore = 20
    expect(score).toBe(50);
  });

  it('should score 0 for calorie component if massively over target', () => {
    const score = calculateDailyScore({
      targetCalories: 2000,
      actualCalories: 5000,
      targetProtein: 150,
      actualProtein: 150,
      hasWeightLogged: true
    });
    // calDiff = (5000 - 2000)/2000 = 1.5. calRatio = max(0, 1 - 1.5) = 0.
    // calScore = 0, proScore = 30, weightScore = 20
    expect(score).toBe(50);
  });

  it('should properly account for weight logged vs not', () => {
    const scoreLogged = calculateDailyScore({
      targetCalories: 2000,
      actualCalories: 2000,
      targetProtein: 150,
      actualProtein: 150,
      hasWeightLogged: true
    });
    
    const scoreNotLogged = calculateDailyScore({
      targetCalories: 2000,
      actualCalories: 2000,
      targetProtein: 150,
      actualProtein: 150,
      hasWeightLogged: false
    });
    
    expect(scoreLogged).toBe(100);
    expect(scoreNotLogged).toBe(80);
  });
});
