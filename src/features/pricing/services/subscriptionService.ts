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
}
export interface CheckoutResult {
  subscriptionId: string | null;
  keyId: string | null;
  shortUrl: string | null;
  error: string | null;
}

export interface CancelResult {
  ok: boolean;
  alreadyCancelled: boolean;
  currentPeriodEnd: string | null;
  error: string | null;
}

export const subscriptionService = {
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const userId = await authService.getUserId();
      const { data, error } = await supabase.rpc('get_or_create_subscription', {
        p_user_id: userId,
      });

      if (error) throw error;

      const rawPlan = (data?.plan as string | undefined) ?? 'free';
      const status = (data?.status as string | undefined) ?? 'active';

      const betaExpired =
        rawPlan === 'beta_pro' &&
        data?.beta_expires_at != null &&
        new Date(data.beta_expires_at as string) <= new Date();

      const currentPeriodEnd =
        typeof data?.current_period_end === 'string'
          ? data.current_period_end
          : null;

      const hasActiveAccess =
        status === 'active' ||
        (status === 'cancelled' &&
          currentPeriodEnd != null &&
          new Date(currentPeriodEnd) > new Date());

      const plan: PlanId =
        !hasActiveAccess || betaExpired ? 'free' : normalizePlan(rawPlan);

      const billingCycle: 'monthly' | 'annual' | null =
        data?.billing_cycle === 'monthly' || data?.billing_cycle === 'annual'
          ? (data.billing_cycle as 'monthly' | 'annual')
          : null;

      const razorpaySubscriptionId =
        typeof data?.razorpay_subscription_id === 'string'
          ? data.razorpay_subscription_id
          : null;

      const accessType: 'subscription' | 'one_time' =
        data?.access_type === 'one_time' ? 'one_time' : 'subscription';

      return {
        isPremium: plan !== 'free',
        plan,
        status,
        currentPeriodEnd,
        billingCycle,
        razorpaySubscriptionId,
        accessType,
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return {
        isPremium: false,
        plan: 'free',
        status: 'error',
        currentPeriodEnd: null,
        billingCycle: null,
        razorpaySubscriptionId: null,
        accessType: 'subscription',
      };
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
        return {
          subscriptionId: null,
          keyId: null,
          shortUrl: null,
          error: error.message || 'Checkout failed',
        };
      }
      if (!data || typeof data.subscription_id !== 'string') {
        return {
          subscriptionId: null,
          keyId: null,
          shortUrl: null,
          error: 'No subscription returned',
        };
      }

      return {
        subscriptionId: data.subscription_id,
        keyId: typeof data.razorpay_key_id === 'string' ? data.razorpay_key_id : null,
        shortUrl: typeof data.short_url === 'string' ? data.short_url : null,
        error: null,
      };
    } catch (err) {
      return {
        subscriptionId: null,
        keyId: null,
        shortUrl: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  async cancelAutoRenewal(): Promise<CancelResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'cancel-razorpay-subscription',
        { body: {} },
      );
      if (error) {
        return {
          ok: false,
          alreadyCancelled: false,
          currentPeriodEnd: null,
          error: error.message || 'Cancellation failed',
        };
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
      return {
        ok: false,
        alreadyCancelled: false,
        currentPeriodEnd: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  async startOneTimeCheckout(
    plan: 'discipline' | 'premium',
  ): Promise<{
    orderId: string | null;
    amount: number | null;
    keyId: string | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-razorpay-order',
        { body: { plan } },
      );

      if (error) {
        return {
          orderId: null,
          amount: null,
          keyId: null,
          error: error.message || 'Checkout failed',
        };
      }
      if (!data || typeof data.order_id !== 'string') {
        return {
          orderId: null,
          amount: null,
          keyId: null,
          error: 'No order returned',
        };
      }

      return {
        orderId: data.order_id,
        amount: typeof data.amount === 'number' ? data.amount : null,
        keyId: typeof data.razorpay_key_id === 'string' ? data.razorpay_key_id : null,
        error: null,
      };
    } catch (err) {
      return {
        orderId: null,
        amount: null,
        keyId: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
};