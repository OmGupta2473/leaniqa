import { describe, it, expect } from 'vitest';
import {
  getKolkataDateString,
  getKolkataStartOfDay,
  getKolkataEndOfDay,
  kolkataDateStringToUtcMidnight,
  shiftKolkataDateString,
} from './timezone';

describe('Kolkata timezone helpers', () => {
  it('T-C1-1: formats an instant on its IST calendar date', () => {
    expect(getKolkataDateString(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
  });

  it('T-C1-2: advances the calendar date after IST midnight', () => {
    expect(getKolkataDateString(new Date('2025-12-31T19:00:00Z'))).toBe('2026-01-01');
  });

  it('T-C1-3: retains the previous date before IST midnight', () => {
    expect(getKolkataDateString(new Date('2025-12-31T18:29:00Z'))).toBe('2025-12-31');
  });

  it('T-C1-4: returns the UTC instant for IST start of day', () => {
    expect(getKolkataStartOfDay(new Date('2026-01-01T12:00:00Z'))).toBe('2025-12-31T18:30:00.000Z');
  });

  it('T-C1-5: returns the UTC instant for IST end of day', () => {
    expect(getKolkataEndOfDay(new Date('2026-01-01T12:00:00Z'))).toBe('2026-01-01T18:29:59.999Z');
  });

  it('T-C1-6: converts an IST date key to UTC midnight', () => {
    expect(kolkataDateStringToUtcMidnight('2026-03-05').toISOString()).toBe('2026-03-04T18:30:00.000Z');
  });

  it('T-C1-7: shifts to the previous day across a month boundary', () => {
    expect(shiftKolkataDateString('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('T-C1-8: shifts to the next day', () => {
    expect(shiftKolkataDateString('2026-03-01', 1)).toBe('2026-03-02');
  });

  it('T-C1-9: shifts to the next year', () => {
    expect(shiftKolkataDateString('2026-12-31', 1)).toBe('2027-01-01');
  });
});