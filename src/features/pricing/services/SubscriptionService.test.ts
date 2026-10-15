import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUserId: vi.fn(),
}));

vi.mock('@/shared/utils/supabase', () => ({
  supabase: { rpc: mocks.rpc },
}));
vi.mock('@/features/auth/services/authService', () => ({
  authService: { getUserId: mocks.getUserId },
}));

import { subscriptionService } from './subscriptionService';

interface RpcReturns {
  row?: Record<string, unknown> | null;
  access?: { has_access: boolean; tier: string; reason: string };
}

function wireRpc({ row = null, access }: RpcReturns) {
  mocks.rpc.mockImplementation((fn: string) => {
    if (fn === 'get_or_create_subscription') {
      return Promise.resolve({ data: row, error: null });
    }
    if (fn === 'resolve_user_access') {
      return Promise.resolve({
        data: access ? [access] : [],
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserId.mockResolvedValue('user-1');
});

describe('subscriptionService.getSubscriptionStatus', () => {
  it('active discipline sub → tier discipline, hasAccess true', async () => {
    wireRpc({
      row: {
        plan: 'discipline',
        status: 'active',
        access_type: 'subscription',
        current_period_end: '2026-11-14T18:30:00Z',
        billing_cycle: 'monthly',
        razorpay_subscription_id: 'sub_abc',
      },
      access: { has_access: true, tier: 'discipline', reason: 'sub_active' },
    });

    const result = await subscriptionService.getSubscriptionStatus();
    expect(result.plan).toBe('discipline');
    expect(result.hasAccess).toBe(true);
    expect(result.accessReason).toBe('sub_active');
    expect(result.billingCycle).toBe('monthly');
  });

  it('cancelled-but-active → tier discipline, hasAccess true', async () => {
    wireRpc({
      row: {
        plan: 'discipline',
        status: 'cancelled',
        access_type: 'subscription',
        current_period_end: '2026-11-14T18:30:00Z',
        billing_cycle: 'monthly',
      },
      access: {
        has_access: true,
        tier: 'discipline',
        reason: 'cancelled_but_active',
      },
    });

    const result = await subscriptionService.getSubscriptionStatus();
    expect(result.plan).toBe('discipline');
    expect(result.hasAccess).toBe(true);
    expect(result.status).toBe('cancelled');
  });

  it('expired one-time → free, hasAccess false', async () => {
    wireRpc({
      row: {
        plan: 'discipline',
        status: 'active',
        access_type: 'one_time',
        current_period_end: '2026-10-01T00:00:00Z',
      },
      access: { has_access: false, tier: 'free', reason: 'one_time_expired' },
    });

    const result = await subscriptionService.getSubscriptionStatus();
    expect(result.plan).toBe('free');
    expect(result.hasAccess).toBe(false);
    expect(result.accessReason).toBe('one_time_expired');
  });

  it('legacy beta_pro with future beta window → discipline', async () => {
    wireRpc({
      row: { plan: 'free', status: 'active', access_type: 'subscription' },
      access: { has_access: true, tier: 'discipline', reason: 'beta_active' },
    });

    const result = await subscriptionService.getSubscriptionStatus();
    expect(result.plan).toBe('discipline');
    expect(result.hasAccess).toBe(true);
  });

  it('no subscription row → free', async () => {
    wireRpc({
      row: null,
      access: { has_access: false, tier: 'free', reason: 'no_record' },
    });

    const result = await subscriptionService.getSubscriptionStatus();
    expect(result.plan).toBe('free');
    expect(result.hasAccess).toBe(false);
  });

  it('RPC error → returns safe fallback', async () => {
    mocks.getUserId.mockResolvedValue('user-1');
    mocks.rpc.mockRejectedValue(new Error('network down'));

    const result = await subscriptionService.getSubscriptionStatus();
    expect(result.plan).toBe('free');
    expect(result.hasAccess).toBe(false);
    expect(result.status).toBe('error');
  });
});