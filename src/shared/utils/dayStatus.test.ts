import { describe, it, expect } from 'vitest';
import {
  classifyMetric,
  classifyDay,
  colorForDayStatus,
  type GoalType,
  type MetricStatus,
} from './dayStatus';

describe('classifyMetric', () => {
  const goals: GoalType[] = ['cut', 'recomp', 'bulk'];

  describe('calories', () => {
    goals.forEach((goal) => {
      describe(`${goal} calories`, () => {
        if (goal === 'cut') {
          it('met when actual ≤ target', () => {
            expect(classifyMetric('cut', 1900, 2000, 'calories')).toBe('met');
            expect(classifyMetric('cut', 2000, 2000, 'calories')).toBe('met');
          });

          it('close when target < actual ≤ target * 1.10', () => {
            expect(classifyMetric('cut', 2100, 2000, 'calories')).toBe('close');
            expect(classifyMetric('cut', 2200, 2000, 'calories')).toBe('close');
          });

          it('far when actual > target * 1.10', () => {
            expect(classifyMetric('cut', 2300, 2000, 'calories')).toBe('far');
            expect(classifyMetric('cut', 2500, 2000, 'calories')).toBe('far');
          });
        }

        if (goal === 'bulk') {
          it('met when actual ≥ target', () => {
            expect(classifyMetric('bulk', 2000, 2000, 'calories')).toBe('met');
            expect(classifyMetric('bulk', 2100, 2000, 'calories')).toBe('met');
          });

          it('close when target * 0.90 ≤ actual < target', () => {
            expect(classifyMetric('bulk', 1800, 2000, 'calories')).toBe('close');
            expect(classifyMetric('bulk', 1900, 2000, 'calories')).toBe('close');
          });

          it('far when actual < target * 0.90', () => {
            expect(classifyMetric('bulk', 1700, 2000, 'calories')).toBe('far');
            expect(classifyMetric('bulk', 1500, 2000, 'calories')).toBe('far');
          });
        }

        if (goal === 'recomp') {
          it('met when |actual − target| ≤ 100', () => {
            expect(classifyMetric('recomp', 2000, 2000, 'calories')).toBe('met');
            expect(classifyMetric('recomp', 1950, 2000, 'calories')).toBe('met');
            expect(classifyMetric('recomp', 2050, 2000, 'calories')).toBe('met');
            expect(classifyMetric('recomp', 1900, 2000, 'calories')).toBe('met');
            expect(classifyMetric('recomp', 2100, 2000, 'calories')).toBe('met');
          });

          it('close when 100 < |actual − target| ≤ 150', () => {
            expect(classifyMetric('recomp', 1850, 2000, 'calories')).toBe('close');
            expect(classifyMetric('recomp', 2150, 2000, 'calories')).toBe('close');
          });

          it('far when |actual − target| > 150', () => {
            expect(classifyMetric('recomp', 1800, 2000, 'calories')).toBe('far');
            expect(classifyMetric('recomp', 2200, 2000, 'calories')).toBe('far');
          });
        }
      });
    });

    describe('protein (all goals share rules)', () => {
      it('met when actual ≥ target', () => {
        goals.forEach((goal) => {
          expect(classifyMetric(goal, 150, 150, 'protein')).toBe('met');
          expect(classifyMetric(goal, 160, 150, 'protein')).toBe('met');
        });
      });

      it('close when target * 0.90 ≤ actual < target', () => {
        goals.forEach((goal) => {
          expect(classifyMetric(goal, 135, 150, 'protein')).toBe('close');
          expect(classifyMetric(goal, 140, 150, 'protein')).toBe('close');
        });
      });

      it('far when actual < target * 0.90', () => {
        goals.forEach((goal) => {
          expect(classifyMetric(goal, 130, 150, 'protein')).toBe('far');
          expect(classifyMetric(goal, 100, 150, 'protein')).toBe('far');
        });
      });
    });
  });

  describe('edge cases', () => {
    it('target === 0 returns far (no divide by zero)', () => {
      expect(classifyMetric('cut', 100, 0, 'calories')).toBe('far');
      expect(classifyMetric('cut', 0, 0, 'protein')).toBe('far');
    });

    it('actual === 0 returns far (no logging is not close)', () => {
      expect(classifyMetric('cut', 0, 2000, 'calories')).toBe('far');
      expect(classifyMetric('cut', 0, 150, 'protein')).toBe('far');
    });

    it('negative values return far', () => {
      expect(classifyMetric('cut', -100, 2000, 'calories')).toBe('far');
      expect(classifyMetric('cut', 100, -2000, 'calories')).toBe('far');
      expect(classifyMetric('cut', -10, 150, 'protein')).toBe('far');
    });
  });
});

describe('classifyDay', () => {
  const goals: GoalType[] = ['cut', 'recomp', 'bulk'];

  describe('aggregate rules', () => {
    it('met+met → met', () => {
      goals.forEach((goal) => {
        expect(
          classifyDay(goal, {
            actual_calories: 2000,
            target_calories: 2000,
            actual_protein: 150,
            target_protein: 150,
          })
        ).toBe('met');
      });
    });

    it('met+close → close', () => {
      goals.forEach((goal) => {
        expect(
          classifyDay(goal, {
            actual_calories: 2000,
            target_calories: 2000,
            actual_protein: 135,
            target_protein: 150,
          })
        ).toBe('close');
      });
    });

    it('met+far → far', () => {
      goals.forEach((goal) => {
        expect(
          classifyDay(goal, {
            actual_calories: 2000,
            target_calories: 2000,
            actual_protein: 100,
            target_protein: 150,
          })
        ).toBe('far');
      });
    });

    it('close+close → close', () => {
      goals.forEach((goal) => {
        expect(
          classifyDay(goal, {
            actual_calories: 2150,
            target_calories: 2000,
            actual_protein: 135,
            target_protein: 150,
          })
        ).toBe('close');
      });
    });

    it('close+far → far', () => {
      goals.forEach((goal) => {
        expect(
          classifyDay(goal, {
            actual_calories: 2150,
            target_calories: 2000,
            actual_protein: 100,
            target_protein: 150,
          })
        ).toBe('far');
      });
    });

    it('far+far → far', () => {
      goals.forEach((goal) => {
        expect(
          classifyDay(goal, {
            actual_calories: 2500,
            target_calories: 2000,
            actual_protein: 100,
            target_protein: 150,
          })
        ).toBe('far');
      });
    });
  });
});

describe('colorForDayStatus', () => {
  it('met → lime #D4FF00', () => {
    expect(colorForDayStatus('met')).toBe('#D4FF00');
  });

  it('close → yellow #fbbf24', () => {
    expect(colorForDayStatus('close')).toBe('#fbbf24');
  });

  it('far → red #FF4D1C', () => {
    expect(colorForDayStatus('far')).toBe('#FF4D1C');
  });
});

describe('colorForDayStatus - all statuses', () => {
  const statuses: MetricStatus[] = ['met', 'close', 'far'];
  const expected = {
    met: '#D4FF00',
    close: '#fbbf24',
    far: '#FF4D1C',
  };

  statuses.forEach((status) => {
    it(`${status} returns ${expected[status]}`, () => {
      expect(colorForDayStatus(status)).toBe(expected[status]);
    });
  });
});