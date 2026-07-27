import { describe, it, expect } from 'vitest';
import { computeRingGeometry } from './ringMath';

describe('computeRingGeometry', () => {
  it('handles standard cases correctly', () => {
    const geo = computeRingGeometry(50, 100, 100, 10);
    expect(geo.percent).toBe(50);
    expect(geo.visualPercent).toBe(50);
    expect(geo.isOverflow).toBe(false);
    expect(geo.overflowLaps).toBe(0);
  });

  it('handles overflow/overachievement case correctly', () => {
    const geo = computeRingGeometry(150, 100, 100, 10);
    expect(geo.percent).toBe(150);
    expect(geo.visualPercent).toBe(100);
    expect(geo.isOverflow).toBe(true);
    expect(geo.overflowLaps).toBe(1);
  });

  it('handles multi-lap overflow correctly', () => {
    const geo = computeRingGeometry(350, 100, 100, 10);
    expect(geo.percent).toBe(350);
    expect(geo.visualPercent).toBe(100);
    expect(geo.isOverflow).toBe(true);
    expect(geo.overflowLaps).toBe(3);
  });

  it('handles zero goal safely', () => {
    const geo = computeRingGeometry(50, 0, 100, 10);
    expect(geo.percent).toBe(5000);
  });
});
