/**
 * Phase 6.7 R2.0 — unit tests for stripPreparationWords.
 *
 * Vitest. No Deno, no Supabase, no network. Runs alongside the existing
 * foodResolver.selections.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { stripPreparationWords } from '../prepStrip';

describe('stripPreparationWords', () => {
  // -------------------------------------------------------------------------
  // Required cases (per R2.0 spec)
  // -------------------------------------------------------------------------
  it('strips "cooked" from "cooked toor dal"', () => {
    expect(stripPreparationWords('cooked toor dal')).toBe('toor dal');
  });

  it('strips "boiled" from "boiled egg"', () => {
    expect(stripPreparationWords('boiled egg')).toBe('egg');
  });

  it('strips "steamed" from "steamed rice"', () => {
    expect(stripPreparationWords('steamed rice')).toBe('rice');
  });

  it('strips "raw" from "raw banana"', () => {
    expect(stripPreparationWords('raw banana')).toBe('banana');
  });

  it('does NOT strip "fried" from "fried rice"', () => {
    expect(stripPreparationWords('fried rice')).toBe('fried rice');
  });

  // -------------------------------------------------------------------------
  // Nutritional-significant words must be preserved
  // -------------------------------------------------------------------------
  it('preserves "roasted"', () => {
    expect(stripPreparationWords('roasted chicken')).toBe('roasted chicken');
  });

  it('preserves "sautéed"', () => {
    expect(stripPreparationWords('sautéed vegetables')).toBe('sautéed vegetables');
  });

  it('preserves "buttered"', () => {
    expect(stripPreparationWords('buttered toast')).toBe('buttered toast');
  });

  it('preserves "tempered"', () => {
    expect(stripPreparationWords('tempered dal')).toBe('tempered dal');
  });

  // -------------------------------------------------------------------------
  // Case insensitivity
  // -------------------------------------------------------------------------
  it('handles mixed case', () => {
    expect(stripPreparationWords('Cooked Toor Dal')).toBe('Toor Dal');
  });

  it('handles all-caps', () => {
    expect(stripPreparationWords('BOILED EGG')).toBe('EGG');
  });

  // -------------------------------------------------------------------------
  // Word-boundary correctness (no substring stripping)
  // -------------------------------------------------------------------------
  it('does not strip "cooked" from "uncooked"', () => {
    expect(stripPreparationWords('uncooked rice')).toBe('uncooked rice');
  });

  it('does not strip "raw" from "raws"', () => {
    expect(stripPreparationWords('raws')).toBe('raws');
  });

  it('does not strip "steamed" from "steamedx"', () => {
    expect(stripPreparationWords('steamedx')).toBe('steamedx');
  });

  it('does not strip "boiled" from "parboiled"', () => {
    expect(stripPreparationWords('parboiled rice')).toBe('parboiled rice');
  });

  // -------------------------------------------------------------------------
  // Multiple prep words in one term
  // -------------------------------------------------------------------------
  it('strips multiple prep words', () => {
    expect(stripPreparationWords('cooked boiled steamed rice')).toBe('rice');
  });

  it('strips when prep words are interleaved', () => {
    expect(stripPreparationWords('cooked toor dal boiled')).toBe('toor dal');
  });

  // -------------------------------------------------------------------------
  // Whitespace normalization
  // -------------------------------------------------------------------------
  it('collapses leading and trailing whitespace', () => {
    expect(stripPreparationWords('  cooked toor dal  ')).toBe('toor dal');
  });

  it('collapses internal double-spaces left by stripping', () => {
    expect(stripPreparationWords('toor cooked dal')).toBe('toor dal');
  });

  it('handles multiple internal spaces', () => {
    expect(stripPreparationWords('cooked    toor    dal')).toBe('toor dal');
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  it('returns "" for empty string', () => {
    expect(stripPreparationWords('')).toBe('');
  });

  it('returns "" when input is only prep words', () => {
    expect(stripPreparationWords('cooked')).toBe('');
    expect(stripPreparationWords('boiled steamed raw')).toBe('');
  });

  it('returns non-prep terms unchanged (modulo whitespace)', () => {
    expect(stripPreparationWords('paneer tikka')).toBe('paneer tikka');
  });

  // -------------------------------------------------------------------------
  // Idempotency — critical for repeated normalization
  // -------------------------------------------------------------------------
  it('is idempotent', () => {
    const once = stripPreparationWords('cooked toor dal');
    const twice = stripPreparationWords(once);
    expect(twice).toBe(once);
    expect(once).toBe('toor dal');
  });

  it('does not mutate regex state across calls', () => {
    // If the regex carried lastIndex between calls, alternating
    // "cooked X" and "boiled Y" would eventually produce different
    // results on identical input. This test locks the statelessness.
    const a1 = stripPreparationWords('cooked dal');
    const b1 = stripPreparationWords('boiled rice');
    const a2 = stripPreparationWords('cooked dal');
    const b2 = stripPreparationWords('boiled rice');
    expect(a1).toBe('dal');
    expect(a2).toBe(a1);
    expect(b1).toBe('rice');
    expect(b2).toBe(b1);
  });
});