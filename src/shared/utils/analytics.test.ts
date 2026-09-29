import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const posthog = vi.hoisted(() => ({ identify: vi.fn(), reset: vi.fn() }));
vi.mock('posthog-js', () => ({ default: { init: vi.fn(), capture: vi.fn(), identify: posthog.identify, reset: posthog.reset } }));
vi.mock('@/shared/utils/logger', () => ({ devLog: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_POSTHOG_KEY', 'test-key');
  posthog.identify.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('analytics identity', () => {
  it('T4: avoids duplicate identify calls for the same user', async () => {
    const { analytics } = await import('./analytics');
    analytics.identifyUser('user-a');
    analytics.identifyUser('user-a');
    expect(posthog.identify).toHaveBeenCalledTimes(1);
  });
});
