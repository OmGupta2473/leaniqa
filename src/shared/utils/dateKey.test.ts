import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDateKey, parseDateKey } from './dateKey';

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

  it('T-D7-4: parses a padded date key at local midnight', () => {
    const date = parseDateKey('2026-03-05');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth() + 1).toBe(3);
    expect(date.getDate()).toBe(5);
  });

  it('T-D7-5: parses an un-padded legacy date key', () => {
    const date = parseDateKey('2026-3-5');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth() + 1).toBe(3);
    expect(date.getDate()).toBe(5);
  });

  it('T-D7-6: nutrition sources do not construct un-padded date keys', () => {
    const nutritionDirectory = resolve(process.cwd(), 'src/features/nutrition');
    const legacyPattern = '.getMonth() + 1}-' + '${';
    const matches = sourceFilesUnder(nutritionDirectory).filter((filePath) =>
      readFileSync(filePath, 'utf8').includes(legacyPattern),
    );

    expect(matches).toEqual([]);
  });
});
