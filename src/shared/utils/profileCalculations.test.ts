import { describe, it, expect } from 'vitest';
import {
  calculateMacros,
  calculateBodyComposition,
  calculateGoalStats,
  estimateBodyFatPercentage
} from './profileCalculations';

describe('profileCalculations', () => {
  describe('calculateMacros', () => {
    it('calculates macros for standard male', () => {
      const macros = calculateMacros(80, 180, 30, 'Male', 'Lightly Active');
      expect(macros.tdee).toBe(2450);
      expect(macros.proteinMid).toBe(144);
      expect(macros.waterLitres).toBe("2.6");
    });

    it('adjusts water for very active users', () => {
      const macros = calculateMacros(80, 180, 30, 'Male', 'Very Active');
      expect(macros.waterLitres).toBe("3.1");
    });
    
    it('handles very low body weight gracefully', () => {
      const macros = calculateMacros(40, 150, 20, 'Female', 'Sedentary');
      expect(macros.tdee).toBeGreaterThan(0);
      expect(macros.carbMid).toBeGreaterThanOrEqual(0);
      expect(macros.carbMin).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateBodyComposition', () => {
    it('calculates correctly', () => {
      const comp = calculateBodyComposition(100, 25, 15);
      expect(comp.fatMass).toBeCloseTo(25);
      expect(comp.leanMass).toBeCloseTo(75);
      expect(comp.targetFatMass).toBeCloseTo(13.235);
      expect(comp.targetWeightKg).toBeCloseTo(88.235);
      expect(comp.fatToLoseKg).toBeCloseTo(11.765);
    });
  });

  describe('estimateBodyFatPercentage', () => {
    it('differentiates by gender', () => {
      const maleBf = estimateBodyFatPercentage(80, 180, 30, 'Male');
      const femaleBf = estimateBodyFatPercentage(80, 180, 30, 'Female');
      expect(femaleBf).toBeGreaterThan(maleBf);
    });

    it('bounds to 5-50%', () => {
      const extremeLow = estimateBodyFatPercentage(40, 200, 18, 'Male');
      const extremeHigh = estimateBodyFatPercentage(150, 150, 80, 'Female');
      expect(extremeLow).toBeGreaterThanOrEqual(5);
      expect(extremeHigh).toBeLessThanOrEqual(50);
    });
  });
});
