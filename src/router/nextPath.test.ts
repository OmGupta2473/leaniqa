import { describe, expect, it } from 'vitest';
import { isSafeNextPath } from './nextPath';

describe('GuestRoute next path validation', () => {
  it('T6: accepts safe relative paths and rejects redirect escapes', () => {
    expect(isSafeNextPath('//evil.com')).toBe(false);
    expect(isSafeNextPath('/\\evil.com')).toBe(false);
    expect(isSafeNextPath('https://evil.com')).toBe(false);
    expect(isSafeNextPath('/dashboard')).toBe(true);
    expect(isSafeNextPath('/progress?x=1')).toBe(true);
  });
});
