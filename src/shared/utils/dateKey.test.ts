import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDateKey, parseDateKey } from './dateKey';
import { getKolkataDateString } from './timezone';

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesUnder(entryPath);
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

describe('dateKey', () => {
  it('T-D7-1: pads single-digit month and day', () => {
    expect(formatDateKey(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('T-D7-2: formats the final day of the year', () => {
    expect(formatDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('T-D7-3: formats the first day of the year', () => {
    expect(formatDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('T-D7-4: parses a padded date key to IST midnight', () => {
    const date = parseDateKey('2026-03-05');
    expect(getKolkataDateString(date)).toBe('2026-03-05');
  });

  it('T-D7-5: parses an un-padded legacy date key', () => {
    const date = parseDateKey('2026-3-5');
    expect(getKolkataDateString(date)).toBe('2026-03-05');
  });

  it('T-D7-6: nutrition sources do not construct un-padded date keys', () => {
    const nutritionDirectory = resolve(process.cwd(), 'src/features/nutrition');
    const legacyPattern = '.getMonth() + 1}-' + '${';
    const matches = sourceFilesUnder(nutritionDirectory).filter((filePath) =>
      readFileSync(filePath, 'utf8').includes(legacyPattern),
    );

    expect(matches).toEqual([]);
  });

  it('T-D7-7: formats instants using the IST calendar day', () => {
    expect(formatDateKey(new Date('2025-12-31T20:00:00Z'))).toBe('2026-01-01');
  });
});
