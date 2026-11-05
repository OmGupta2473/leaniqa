import { supabase } from '@/shared/utils/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OwnedGym {
  id: string;
  name: string;
  createdAt: string;
}

export interface PromoCodeRow {
  id: string;
  gymId: string;
  code: string;
  durationDays: number;
  maxRedemptions: number | null;
  currentRedemptions: number;
  active: boolean;
  createdAt: string;
}

export interface GymMember {
  userId: string;
  /** null when the member's profile row is missing or name is unset. */
  name: string | null;
  redeemedAt: string;
  premiumUntil: string;
  shareMealData: boolean;
  consentGrantedAt: string | null;
  consentRevokedAt: string | null;
  /** computed at read time: premiumUntil > now */
  isActive: boolean;
  /** computed at read time: shareMealData && isActive — the R1 gate */
  hasMealAccess: boolean;
}

export interface MemberActivityRow {
  memberUserId: string;
  mealId: string;
  mealTime: string;
  mealText: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  mealSlot: string | null;
  targetKcal: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
}

export interface MemberWeeklyReportRow {
  memberUserId: string;
  weekStart: string;
  weekEnd: string;
  daysWithMeals: number;
  totalCalories: number;
  avgCalories: number;
  totalProteinG: number;
  avgProteinG: number;
  weeklyScore: number;
  confidence: string;
}

export type GymOwnerErrorCode =
  | 'not_authenticated'
  | 'not_gym_owner'
  | 'invalid_range'
  | 'member_not_shareable'
  | 'invalid_duration_v1'
  | 'invalid_max_redemptions_v1'
  | 'custom_code_not_allowed_v1'
  | 'code_generation_failed'
  | 'network'
  | 'unknown';

export interface GymOwnerResult<T> {
  ok: boolean;
  data?: T;
  errorCode?: GymOwnerErrorCode;
  error?: string;
}

// ─── Implementation ────────────────────────────────────────────────────────

export const gymOwnerService = {
  /** Gym list for the current owner. RPC-enforced (list_my_gyms). */
  async listOwnedGyms(): Promise<OwnedGym[]> {
    const { data, error } = await supabase.rpc('list_my_gyms');
    if (error) {
      console.error('[gymOwnerService] listOwnedGyms', error.code, error.message);
      return [];
    }
    const rows = (data ?? []) as Array<{ id: string; name: string; created_at: string }>;
    return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
  },

  /** Codes for one owned gym. Owner RLS on promo_codes enforces the gate. */
  async listPromoCodes(gymId: string): Promise<PromoCodeRow[]> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('id, gym_id, code, duration_days, max_redemptions, current_redemptions, active, created_at')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[gymOwnerService] listPromoCodes', error.code, error.message);
      return [];
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      gymId: r.gym_id,
      code: r.code,
      durationDays: r.duration_days,
      maxRedemptions: r.max_redemptions,
      currentRedemptions: r.current_redemptions,
      active: r.active,
      createdAt: r.created_at,
    }));
  },

  /**
   * v1 policy: server-side generation only. The RPC enforces 30-day duration,
   * 5-redemption cap, and no custom code. The client has no params to pass —
   * this is intentional so the sheet has one button and no configurable input.
   */
  async generatePromoCode(gymId: string): Promise<GymOwnerResult<{ id: string; code: string }>> {
    const { data, error } = await supabase.rpc('generate_promo_code', {
      p_gym_id: gymId,
    });
    if (error) return mapRpcError(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, errorCode: 'unknown', error: 'Empty response.' };
    return { ok: true, data: { id: row.promo_code_id, code: row.code } };
  },

  /**
   * Member list for one owned gym, with display names from profiles.
   * Owner gate + profiles join happen server-side inside the RPC; no
   * profiles SELECT policy is opened to gym owners.
   */
  async listGymMembers(gymId: string): Promise<GymMember[]> {
    const { data, error } = await supabase.rpc('list_gym_members', {
      p_gym_id: gymId,
    });
    if (error) {
      console.error('[gymOwnerService] listGymMembers', error.code, error.message);
      return [];
    }
    const now = Date.now();
    const rows = (data ?? []) as Array<{
      user_id: string;
      name: string | null;
      redeemed_at: string;
      premium_until: string;
      share_meal_data: boolean;
      consent_granted_at: string | null;
      consent_revoked_at: string | null;
    }>;
    return rows.map((r) => {
      const isActive = new Date(r.premium_until).getTime() > now;
      return {
        userId: r.user_id,
        name: r.name,
        redeemedAt: r.redeemed_at,
        premiumUntil: r.premium_until,
        shareMealData: r.share_meal_data,
        consentGrantedAt: r.consent_granted_at,
        consentRevokedAt: r.consent_revoked_at,
        isActive,
        hasMealAccess: r.share_meal_data && isActive,
      };
    });
  },

  /** Meal activity for one gym, filtered server-side by R1. Audited. */
  async getMemberActivity(
    gymId: string,
    memberId: string,
    sinceIso: string,
    untilIso: string,
  ): Promise<GymOwnerResult<MemberActivityRow[]>> {
    const { data, error } = await supabase.rpc('get_gym_member_activity', {
      p_gym_id: gymId,
      p_member_user_id: memberId,
      p_since: sinceIso,
      p_until: untilIso,
    });
    if (error) return mapRpcError(error);
    const rows = (data ?? []) as Array<{
      member_user_id: string;
      meal_id: string;
      meal_time: string;
      meal_text: string;
      calories: number | string;
      protein: number | string;
      fat: number | string;
      carbs: number | string;
      fiber: number | string;
      meal_slot: string | null;
      target_kcal: number | string | null;
      protein_target: number | string | null;
      carbs_target: number | string | null;
      fat_target: number | string | null;
    }>;
    const toNum = (v: number | string | null): number | null =>
      v == null ? null : Number(v);
    return {
      ok: true,
      data: rows.map((r) => ({
        memberUserId: r.member_user_id,
        mealId: r.meal_id,
        mealTime: r.meal_time,
        mealText: r.meal_text,
        calories: Number(r.calories),
        protein: Number(r.protein),
        fat: Number(r.fat),
        carbs: Number(r.carbs),
        fiber: Number(r.fiber),
        mealSlot: r.meal_slot,
        targetKcal: toNum(r.target_kcal),
        proteinTarget: toNum(r.protein_target),
        carbsTarget: toNum(r.carbs_target),
        fatTarget: toNum(r.fat_target),
      })),
    };
  },

  /** Weekly reports for one gym, filtered server-side by R1. Audited. */
  async getMemberWeeklyReports(
    gymId: string,
    memberId: string,
    sinceDate: string,
    untilDate: string,
  ): Promise<GymOwnerResult<MemberWeeklyReportRow[]>> {
    const { data, error } = await supabase.rpc('get_gym_member_weekly_reports', {
      p_gym_id: gymId,
      p_member_user_id: memberId,
      p_since_date: sinceDate,
      p_until_date: untilDate,
    });
    if (error) return mapRpcError(error);
    const rows = (data ?? []) as Array<{
      member_user_id: string;
      week_start: string;
      week_end: string;
      days_with_meals: number;
      total_calories: number | string;
      avg_calories: number | string;
      total_protein_g: number | string;
      avg_protein_g: number | string;
      weekly_score: number;
      confidence: string;
    }>;
    return {
      ok: true,
      data: rows.map((r) => ({
        memberUserId: r.member_user_id,
        weekStart: r.week_start,
        weekEnd: r.week_end,
        daysWithMeals: r.days_with_meals,
        totalCalories: Number(r.total_calories),
        avgCalories: Number(r.avg_calories),
        totalProteinG: Number(r.total_protein_g),
        avgProteinG: Number(r.avg_protein_g),
        weeklyScore: r.weekly_score,
        confidence: r.confidence,
      })),
    };
  },
};

// ─── Error mapping ─────────────────────────────────────────────────────────

function mapRpcError(error: { message?: string; code?: string }): GymOwnerResult<never> {
  const msg = (error.message ?? '').toLowerCase();
  const known: GymOwnerErrorCode[] = [
    'not_authenticated',
    'not_gym_owner',
    'invalid_range',
    'member_not_shareable',
    'invalid_duration_v1',
    'invalid_max_redemptions_v1',
    'custom_code_not_allowed_v1',
    'code_generation_failed',
  ];
  for (const code of known) {
    if (msg.includes(code)) return { ok: false, errorCode: code, error: friendly(code) };
  }
  console.error('[gymOwnerService] unmapped RPC error', error.code, error.message);
  return { ok: false, errorCode: 'unknown', error: 'Something went wrong. Please try again.' };
}

function friendly(code: GymOwnerErrorCode): string {
  switch (code) {
    case 'not_authenticated': return 'Please sign in again.';
    case 'not_gym_owner': return 'You do not own this gym.';
    case 'invalid_range': return 'The selected date range is invalid.';
    case 'invalid_duration_v1': return 'Duration is fixed to 30 days in this version.';
    case 'invalid_max_redemptions_v1': return 'Redemption limit is fixed to 5 in this version.';
    case 'custom_code_not_allowed_v1': return 'Custom codes are not available in this version.';
    case 'code_generation_failed': return 'Could not generate a unique code. Try again.';
    case 'network': return 'Check your connection and try again.';
        case 'member_not_shareable': return 'This member has not consented to share data, or their access has ended.';
    default: return 'Something went wrong.';
  }
}