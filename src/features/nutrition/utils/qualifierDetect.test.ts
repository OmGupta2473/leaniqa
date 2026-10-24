import { describe, expect, it } from 'vitest';
import { isQualifierOnly, isQualifierTerm } from './qualifierDetect';

describe('qualifierDetect', () => {
  it('does not treat an empty unresolved list as qualifier-only', () => {
    expect(isQualifierOnly([])).toBe(false);
  });

  it('accepts qualifier-only unresolved terms', () => {
    expect(isQualifierOnly([{ input_term: 'total' }])).toBe(true);
    expect(isQualifierOnly([
      { input_term: 'total' },
      { input_term: 'each' },
    ])).toBe(true);
  });

  it('rejects unresolved terms containing non-qualifiers', () => {
    expect(isQualifierOnly([
      { input_term: 'total' },
      { input_term: 'chicken' },
    ])).toBe(false);
    expect(isQualifierOnly([{ input_term: 'mystery grain' }])).toBe(false);
  });

  it('matches normalized qualifier terms exactly', () => {
    expect(isQualifierTerm('TOTAL')).toBe(true);
    expect(isQualifierTerm(' total ')).toBe(true);
    expect(isQualifierTerm('each one')).toBe(true);
    expect(isQualifierTerm('total pasta')).toBe(false);
  });
});
