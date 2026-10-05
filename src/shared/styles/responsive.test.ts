import { describe, it, expect } from 'vitest';
import { COMPACT_THRESHOLD, SHORT_THRESHOLD } from './responsive';

describe('responsive constants', () => {
  it('COMPACT_THRESHOLD is 700', () => {
    expect(COMPACT_THRESHOLD).toBe(700);
  });

  it('SHORT_THRESHOLD is 620', () => {
    expect(SHORT_THRESHOLD).toBe(620);
  });

  it('SHORT is below COMPACT so compact implies short', () => {
    expect(SHORT_THRESHOLD).toBeLessThan(COMPACT_THRESHOLD);
  });
});
