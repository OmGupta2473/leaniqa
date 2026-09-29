import { describe, it, expect } from 'vitest';
import {
  getKolkataDateString,
  getKolkataStartOfDay,
  getKolkataEndOfDay,
  kolkataDateStringToUtcMidnight,
  shiftKolkataDateString,
  msSinceKolkataMidnight,
  getKolkataHour,
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

  it('T-C2-1: measures IST midnight offset from UTC midnight', () => {
    expect(msSinceKolkataMidnight(new Date('2026-01-01T00:00:00Z'))).toBe(5.5 * 3600 * 1000);
  });

  it('T-C2-2: returns zero at IST midnight', () => {
    expect(msSinceKolkataMidnight(new Date('2026-01-01T18:30:00Z'))).toBe(0);
  });

  it('T-C2-3: returns the IST hour at UTC midnight', () => {
    expect(getKolkataHour(new Date('2026-01-01T00:00:00Z'))).toBe(5);
  });

  it('T-C2-4: returns zero at IST midnight', () => {
    expect(getKolkataHour(new Date('2026-01-01T18:30:00Z'))).toBe(0);
  });

  it('T-C2-5: returns the IST hour for an afternoon instant', () => {
    expect(getKolkataHour(new Date('2026-01-01T12:00:00Z'))).toBe(17);
  });
});