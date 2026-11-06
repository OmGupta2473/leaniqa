import { supabase } from '@/shared/utils/supabase';

export interface PromoRedemption {
  gymId: string;
  gymName: string;
  premiumUntil: string;
  redeemedAt: string;
  shareMealData: boolean;
  shareName: boolean; // NEW
  consentGrantedAt: string | null;
  consentRevokedAt: string | null;
}

export interface RedeemResult {
  ok: boolean;
  redemption?: PromoRedemption;
  errorCode?: string;
  error?: string;
}

export const promoService = {
  /**
   * Redeems a gym code via the redeem-promo edge function. Non-throwing for
   * expected failures (invalid_code, already_redeemed, rate_limited) — the
   * caller distinguishes them via errorCode. Only a transport error will
   * surface as errorCode='network'.
   */
  async redeem(code: string, shareMealData: boolean, shareName: boolean): Promise<RedeemResult> {
    try {
      const { data, error } = await supabase.functions.invoke('redeem-promo', {
        body: { code, share_meal_data: shareMealData, share_name: shareName }, // NEW
      });
      if (error) {
        let body: { error?: string; error_code?: string } | null = null;
        const ctx = (error as { context?: Response }).context;
        if (ctx?.json) {
          try { body = await ctx.json(); } catch { /* ignore */ }
        }
        return {
          ok: false,
          errorCode: body?.error_code ?? 'unknown',
          error: body?.error ?? error.message ?? 'Could not redeem this code.',
        };
      }
      if (!data?.ok) {
        return { ok: false, errorCode: 'unknown', error: 'Unexpected response from server.' };
      }
// src/features/profile/services/promoService.ts

      return {
        ok: true,
        redemption: {
          gymId: data.gym_id,
          gymName: data.gym_name,
          premiumUntil: data.premium_until,
          redeemedAt: new Date().toISOString(),
          shareMealData: data.share_meal_data === true,
          shareName: data.share_name === true,
          consentGrantedAt: null,
          consentRevokedAt: null,
        },
      };
    } catch (err) {
      console.error('[promoService] redeem threw', err instanceof Error ? err.message : String(err));
      return { ok: false, errorCode: 'network', error: 'Check your connection and try again.' };
    }
  },

  /**
   * Reads the current user's redemption row (or null). RLS on
   * promo_redemptions is self-select; the join to gyms is allowed by the
   * promo_redemptions_self_select + gyms_member_select policies. Returns
   * null on any error so the UI can render the "redeem" state safely.
   */
  async getRedemption(): Promise<PromoRedemption | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('promo_redemptions')
      .select('gym_id, premium_until, share_meal_data, share_name, redeemed_at, consent_granted_at, consent_revoked_at, gyms(name)')
      .maybeSingle();
    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[promoService] getRedemption', error.code, error.message);
      }
      return null;
    }
    if (!data) return null;
    const gymRel = (data as { gyms?: { name?: string } | Array<{ name?: string }> }).gyms;
    const gymName = (Array.isArray(gymRel) ? gymRel[0]?.name : gymRel?.name) ?? 'Your gym';
    return {
      gymId: data.gym_id,
      gymName,
      premiumUntil: data.premium_until,
      redeemedAt: data.redeemed_at,
      shareMealData: data.share_meal_data,
      shareName: data.share_name, // NEW
      consentGrantedAt: data.consent_granted_at,
      consentRevokedAt: data.consent_revoked_at,
    };

  },

  /**
   * Toggles consent for meal-log sharing. Wraps set_promo_consent RPC;
   * RLS + WHERE user_id = auth.uid() in the RPC means only the owner can
   * flip their own row.
   */
  async setConsent(shareMealData: boolean, shareName: boolean): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('set_promo_consent', { 
        p_share_meal_data: shareMealData, 
        p_share_name: shareName 
      });
      if (error) {
        console.error('[promoService] setConsent', error.code, error.message);
        return { ok: false, error: 'Could not update sharing. Please try again.' };
      }
      return { ok: true };
    } catch (err) {
      console.error('[promoService] setConsent threw', err instanceof Error ? err.message : String(err));
      return { ok: false, error: 'Check your connection and try again.' };
    }
  },
};