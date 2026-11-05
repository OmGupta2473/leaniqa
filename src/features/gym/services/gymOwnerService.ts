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

export interface RedemptionSummary {
  memberUserId: string;
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
  | 'invalid_duration'
  | 'invalid_max_redemptions'
  | 'invalid_code_length'
  | 'code_exists'
  | 'code_generation_failed'
  | 'network'
  | 'unknown';

export interface GymOwnerResult<T> {
  ok: boolean;
  data?: T;
  errorCode?: GymOwnerErrorCode;
  error?: string;
}

const ZERO: [number, number] = [0, 0];

// ─── Implementation ────────────────────────────────────────────────────────

export const gymOwnerService = {
  /**
   * Gym list for the current owner. RPC-enforced (list_my_gyms filters by
   * owner_id server-side); the client never sees gyms it doesn't own.
   */
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

  /** Server-side code generation via the generate_promo_code RPC. */
  async generatePromoCode(
    gymId: string,
    durationDays: number,
    maxRedemptions: number | null,
    customCode?: string,
  ): Promise<GymOwnerResult<{ id: string; code: string }>> {
    const { data, error } = await supabase.rpc('generate_promo_code', {
      p_gym_id: gymId,
      p_duration_days: durationDays,
      p_max_redemptions: maxRedemptions,
      p_custom_code: customCode?.trim() || null,
    });
    if (error) {
      return mapRpcError(error);
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, errorCode: 'unknown', error: 'Empty response.' };
    return { ok: true, data: { id: row.promo_code_id, code: row.code } };
  },

  /** Redemptions for one owned gym, with R1-derived flags. */
  async listRedemptions(gymId: string): Promise<RedemptionSummary[]> {
    const { data, error } = await supabase
      .from('promo_redemptions')
      .select(
        'user_id, redeemed_at, premium_until, share_meal_data, consent_granted_at, consent_revoked_at',
      )
      .eq('gym_id', gymId)
      .order('redeemed_at', { ascending: false });
    if (error) {
      console.error('[gymOwnerService] listRedemptions', error.code, error.message);
      return [];
    }
    const now = Date.now();
    return (data ?? []).map((r) => {
      const isActive = new Date(r.premium_until).getTime() > now;
      return {
        memberUserId: r.user_id,
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

  /**
   * Meal activity for one gym, filtered server-side by R1. The RPC writes
   * one audit row per member whose data is included. Caller is expected to
   * have already gated on `hasMealAccess` in the UI — this call will still
   * succeed even for members without consent, but return zero rows.
   */
  async getMemberActivity(
    gymId: string,
    sinceIso: string,
    untilIso: string,
  ): Promise<GymOwnerResult<MemberActivityRow[]>> {
    const { data, error } = await supabase.rpc('get_gym_member_activity', {
      p_gym_id: gymId,
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
    }>;
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
      })),
    };
  },

  /** Weekly reports for one gym, filtered server-side by R1. */
  async getMemberWeeklyReports(
    gymId: string,
    sinceDate: string, // YYYY-MM-DD
    untilDate: string, // YYYY-MM-DD
  ): Promise<GymOwnerResult<MemberWeeklyReportRow[]>> {
    const { data, error } = await supabase.rpc('get_gym_member_weekly_reports', {
      p_gym_id: gymId,
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
    'invalid_duration',
    'invalid_max_redemptions',
    'invalid_code_length',
    'code_exists',
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
    case 'invalid_duration': return 'Duration must be between 1 and 365 days.';
    case 'invalid_max_redemptions': return 'Max redemptions must be at least 1.';
    case 'invalid_code_length': return 'Code must be 4–40 characters.';
    case 'code_exists': return 'That code is already in use.';
    case 'code_generation_failed': return 'Could not generate a unique code. Try again.';
    case 'network': return 'Check your connection and try again.';
    default: return 'Something went wrong.';
  }
}