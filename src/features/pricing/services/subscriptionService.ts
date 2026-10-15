import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { normalizePlan, type PlanId } from '../entitlements';

export interface SubscriptionStatus {
  isPremium: boolean;
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  billingCycle: 'monthly' | 'annual' | null;
  razorpaySubscriptionId: string | null;
  accessType: 'subscription' | 'one_time';
  hasAccess: boolean;
  accessReason: string;
}

export interface CheckoutResult {
  subscriptionId: string | null;
  keyId: string | null;
  shortUrl: string | null;
  error: string | null;
  /** HTTP status from the edge function, or 0 for network/unknown errors. */
  status: number;
}

export interface OneTimeCheckoutResult {
  orderId: string | null;
  amount: number | null;
  keyId: string | null;
  error: string | null;
  status: number;
}

export interface CancelResult {
  ok: boolean;
  alreadyCancelled: boolean;
  currentPeriodEnd: string | null;
  error: string | null;
}

interface ResolveAccessRow {
  has_access: boolean;
  tier: string;
  reason: string;
}

const EMPTY_STATUS: SubscriptionStatus = {
  isPremium: false,
  plan: 'free',
  status: 'error',
  currentPeriodEnd: null,
  billingCycle: null,
  razorpaySubscriptionId: null,
  accessType: 'subscription',
  hasAccess: false,
  accessReason: 'error',
};

/**
 * Pulls status + body from a Supabase FunctionsHttpError. Falls back
 * gracefully when the error came from the network or from JSON parsing.
 */
async function extractFunctionError(
  error: unknown,
): Promise<{ status: number; message: string }> {
  const err = error as {
    name?: string;
    message?: string;
    context?: Response;
  };

  if (err?.name === 'FunctionsHttpError' && err.context) {
    const status = err.context.status ?? 0;
    try {
      const cloned = err.context.clone();
      const body = (await cloned.json()) as { error?: string };
      return { status, message: body?.error || err.message || 'Request failed' };
    } catch {
      return { status, message: err.message || 'Request failed' };
    }
  }

  const message = err?.message ?? 'Unknown error';
  if (/network|fetch/i.test(message)) {
    return { status: 0, message: 'No internet connection' };
  }
  return { status: 0, message };
}

export const subscriptionService = {
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const userId = await authService.getUserId();

      const [rowRes, accessRes] = await Promise.all([
        supabase.rpc('get_or_create_subscription', { p_user_id: userId }),
        supabase.rpc('resolve_user_access', { p_user_id: userId }),
      ]);

      if (rowRes.error) throw rowRes.error;
      if (accessRes.error) throw accessRes.error;

      const raw = rowRes.data as Record<string, unknown> | null;
      const accessRows = Array.isArray(accessRes.data)
        ? accessRes.data
        : accessRes.data
        ? [accessRes.data]
        : [];
      const access = (accessRows[0] as ResolveAccessRow | undefined) ?? {
        has_access: false,
        tier: 'free',
        reason: 'no_access_row',
      };

      const plan: PlanId = access.has_access
        ? normalizePlan(access.tier)
        : 'free';

      const currentPeriodEnd =
        typeof raw?.current_period_end === 'string'
          ? (raw.current_period_end as string)
          : null;

      const billingCycle: 'monthly' | 'annual' | null =
        raw?.billing_cycle === 'monthly' || raw?.billing_cycle === 'annual'
          ? (raw.billing_cycle as 'monthly' | 'annual')
          : null;

      const razorpaySubscriptionId =
        typeof raw?.razorpay_subscription_id === 'string'
          ? (raw.razorpay_subscription_id as string)
          : null;

      const accessType: 'subscription' | 'one_time' =
        raw?.access_type === 'one_time' ? 'one_time' : 'subscription';

      const status =
        typeof raw?.status === 'string' ? (raw.status as string) : 'active';

      return {
        isPremium: plan !== 'free',
        plan,
        status,
        currentPeriodEnd,
        billingCycle,
        razorpaySubscriptionId,
        accessType,
        hasAccess: access.has_access,
        accessReason: access.reason,
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return EMPTY_STATUS;
    }
  },

  async startCheckout(
    plan: 'discipline' | 'premium',
    billingCycle: 'monthly' | 'annual',
  ): Promise<CheckoutResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-razorpay-subscription',
        { body: { plan, billingCycle } },
      );
      if (error) {
        const { status, message } = await extractFunctionError(error);
        return { subscriptionId: null, keyId: null, shortUrl: null, error: message, status };
      }
      if (!data || typeof data.subscription_id !== 'string') {
        return {
          subscriptionId: null,
          keyId: null,
          shortUrl: null,
          error: 'No subscription returned',
          status: 0,
        };
      }
      return {
        subscriptionId: data.subscription_id,
        keyId: typeof data.razorpay_key_id === 'string' ? data.razorpay_key_id : null,
        shortUrl: typeof data.short_url === 'string' ? data.short_url : null,
        error: null,
        status: 200,
      };
    } catch (err) {
      const { status, message } = await extractFunctionError(err);
      return { subscriptionId: null, keyId: null, shortUrl: null, error: message, status };
    }
  },

  async startOneTimeCheckout(
    plan: 'discipline' | 'premium',
  ): Promise<OneTimeCheckoutResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-razorpay-order',
        { body: { plan } },
      );
      if (error) {
        const { status, message } = await extractFunctionError(error);
        return { orderId: null, amount: null, keyId: null, error: message, status };
      }
      if (!data || typeof data.order_id !== 'string') {
        return { orderId: null, amount: null, keyId: null, error: 'No order returned', status: 0 };
      }
      return {
        orderId: data.order_id,
        amount: typeof data.amount === 'number' ? data.amount : null,
        keyId: typeof data.razorpay_key_id === 'string' ? data.razorpay_key_id : null,
        error: null,
        status: 200,
      };
    } catch (err) {
      const { status, message } = await extractFunctionError(err);
      return { orderId: null, amount: null, keyId: null, error: message, status };
    }
  },

  async cancelAutoRenewal(): Promise<CancelResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'cancel-razorpay-subscription',
        { body: {} },
      );
      if (error) {
        const { message } = await extractFunctionError(error);
        return { ok: false, alreadyCancelled: false, currentPeriodEnd: null, error: message };
      }
      return {
        ok: true,
        alreadyCancelled: data?.already_cancelled === true,
        currentPeriodEnd:
          typeof data?.current_period_end === 'string'
            ? data.current_period_end
            : null,
        error: null,
      };
    } catch (err) {
      const { message } = await extractFunctionError(err);
      return { ok: false, alreadyCancelled: false, currentPeriodEnd: null, error: message };
    }
  },
};