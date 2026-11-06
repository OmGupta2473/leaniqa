import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock('@/shared/utils/supabase', () => ({
  supabase: { rpc: m.rpc, from: m.from },
}));

import { gymOwnerService } from './gymOwnerService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('gymOwnerService.getMemberDetail', () => {
  it('T-MD-1: maps RPC row to GymMember, preserves has_meal_access', async () => {
    m.rpc.mockResolvedValue({
      data: [
        {
          user_id: 'user-1',
          name: 'Alice',
          redeemed_at: '2026-11-01T00:00:00Z',
          premium_until: '2026-12-01T00:00:00Z',
          share_meal_data: true,
          share_name: true,
          consent_granted_at: '2026-11-01T00:00:00Z',
          consent_revoked_at: null,
          is_active: true,
          has_meal_access: true,
        },
      ],
      error: null,
    });

    const result = await gymOwnerService.getMemberDetail('gym-1', 'user-1');

    expect(m.rpc).toHaveBeenCalledWith('get_gym_member_detail', {
      p_gym_id: 'gym-1',
      p_member_user_id: 'user-1',
    });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      userId: 'user-1',
      name: 'Alice',
      hasMealAccess: true,
      isActive: true,
    });
  });

  it('T-MD-2: empty row → data: null (member not found, ok=true)', async () => {
    m.rpc.mockResolvedValue({ data: [], error: null });
    const result = await gymOwnerService.getMemberDetail('gym-1', 'missing');
    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  it('T-MD-3: not_gym_owner RPC error → mapped error', async () => {
    m.rpc.mockResolvedValue({
      data: null,
      error: { message: 'not_gym_owner', code: 'P0001' },
    });
    const result = await gymOwnerService.getMemberDetail('gym-1', 'user-1');
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('not_gym_owner');
  });

  it('T-MD-4: member_not_found RPC error → ok=true, data=null', async () => {
    m.rpc.mockResolvedValue({
      data: null,
      error: { message: 'member_not_found', code: 'P0001' },
    });
    const result = await gymOwnerService.getMemberDetail('gym-1', 'ghost');
    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });
});