// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  invoke: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('@/shared/utils/supabase', () => ({
  supabase: {
    functions: { invoke: m.invoke },
    from: m.from,
    rpc: m.rpc,
    auth: { getUser: m.getUser },
  },
}));

import { promoService } from './promoService';

beforeEach(() => {
  vi.clearAllMocks();
  m.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
});

describe('promoService.redeem', () => {
  it('T-PROMO-1: calls redeem-promo with correct body, returns redemption', async () => {
    m.invoke.mockResolvedValue({
      data: {
        ok: true,
        gym_id: 'gym-1',
        gym_name: 'Test Gym',
        premium_until: '2026-12-05T12:00:00Z',
        share_meal_data: true,
        share_name: true,
      },
      error: null,
    });

    const result = await promoService.redeem('TESTGYM30', true, true);

    expect(m.invoke).toHaveBeenCalledWith('redeem-promo', {
      body: { code: 'TESTGYM30', share_meal_data: true, share_name: true },
    });
    expect(result.ok).toBe(true);
    expect(result.redemption).toMatchObject({
      gymId: 'gym-1',
      gymName: 'Test Gym',
      premiumUntil: '2026-12-05T12:00:00Z',
      shareMealData: true,
      shareName: true,
    });

    // NEW CONTRACT: Client-side timestamps are null. The authoritative
    // values are fetched from the DB via getRedemption() on refetch.
    expect(result.redemption?.consentGrantedAt).toBeNull();
    expect(result.redemption?.consentRevokedAt).toBeNull();
  });

  it('T-PROMO-1b: shareName maps from data.share_name, not data.share_meal_data', async () => {
    // Edge function supports divergent p_share_meal_data / p_share_name.
    // The old `shareName: data.share_meal_data === true` shortcut would
    // return shareName=false here. This asserts the fix.
    m.invoke.mockResolvedValue({
      data: {
        ok: true,
        gym_id: 'gym-1',
        gym_name: 'Test Gym',
        premium_until: '2026-12-05T12:00:00Z',
        share_meal_data: false,
        share_name: true,
      },
      error: null,
    });

    const result = await promoService.redeem('TESTGYM30', false, true);

    expect(result.ok).toBe(true);
    expect(result.redemption?.shareMealData).toBe(false);
    expect(result.redemption?.shareName).toBe(true);
  });

  it('T-PROMO-2: 409 already_redeemed → mapped error', async () => {
    m.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          json: async () => ({
            error: 'You have already redeemed a gym code.',
            error_code: 'already_redeemed',
          }),
        },
      },
    });

    const result = await promoService.redeem('TESTGYM30', false, false);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('already_redeemed');
    expect(result.error).toContain('already');
  });

  it('T-PROMO-3: 404 invalid_code → mapped error', async () => {
    m.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          json: async () => ({
            error: "That code isn't valid.",
            error_code: 'invalid_code',
          }),
        },
      },
    });

    const result = await promoService.redeem('NOPE', false, false);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('invalid_code');
  });
});

describe('promoService.getRedemption', () => {
  it('T-PROMO-4: returns null when no row', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    m.from.mockReturnValue(chain);

    const result = await promoService.getRedemption();
    expect(result).toBeNull();
    expect(m.from).toHaveBeenCalledWith('promo_redemptions');
    // getRedemption filters ownership via RLS (no explicit .eq('user_id', ...)),
    // so assert the select string carries share_name and that the query
    // terminates in order/limit/maybeSingle.
    expect(chain.select).toHaveBeenCalledWith(
      expect.stringContaining('share_name'),
    );
    expect(chain.order).toHaveBeenCalledWith('redeemed_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(chain.maybeSingle).toHaveBeenCalled();
  });

  it('T-PROMO-5: returns joined object when row exists', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          gym_id: 'gym-1',
          premium_until: '2026-12-05T12:00:00Z',
          share_meal_data: true,
          share_name: true,
          redeemed_at: '2026-11-05T12:00:00Z',
          consent_granted_at: '2026-11-05T12:00:00Z',
          consent_revoked_at: null,
          gyms: { name: 'Test Gym' },
        },
        error: null,
      }),
    };
    m.from.mockReturnValue(chain);

    const result = await promoService.getRedemption();
    expect(result).toMatchObject({
      gymId: 'gym-1',
      gymName: 'Test Gym',
      premiumUntil: '2026-12-05T12:00:00Z',
      shareMealData: true,
      shareName: true,
    });
    expect(chain.order).toHaveBeenCalledWith('redeemed_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(1);
  });

  it('T-PROMO-6: returns null when user is signed out', async () => {
    m.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await promoService.getRedemption();
    expect(result).toBeNull();
    expect(m.from).not.toHaveBeenCalled();
  });
});

describe('promoService.setConsent', () => {
  it('T-PROMO-7: calls set_promo_consent RPC with p_share', async () => {
    m.rpc.mockResolvedValue({ data: null, error: null });

    const result = await promoService.setConsent(false, false);

    expect(m.rpc).toHaveBeenCalledWith('set_promo_consent', {
      p_share_meal_data: false,
      p_share_name: false,
    });
    expect(result.ok).toBe(true);
  });

  it('T-PROMO-8: returns ok=false with friendly error on RPC failure', async () => {
    m.rpc.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for function set_promo_consent', code: '42501' },
    });

    const result = await promoService.setConsent(true, true);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});