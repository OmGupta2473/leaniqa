import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';

export const subscriptionService = {
  async getSubscriptionStatus() {
    try {
      const userId = await authService.getUserId();
      const { data, error } = await supabase.rpc('get_or_create_subscription', {
        p_user_id: userId
      });

      if (error) throw error;

      const isPremium = data?.plan === 'beta_pro' && 
                        data?.status === 'active' && 
                        (!data?.beta_expires_at || new Date(data.beta_expires_at) > new Date());

      return {
        isPremium,
        plan: data?.plan || 'free',
        status: data?.status || 'active'
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return { isPremium: false, plan: 'free', status: 'error' };
    }
  },

  async activatePro(razorpayOrderId: string) {
    console.log(`Activating pro via razorpay placeholder for order: ${razorpayOrderId}`);
    return { success: true };
  },

  async activatePremium() {
    console.log('Activating premium via placeholder');
    return { success: true };
  },

  async restorePurchases() {
    console.log('Restoring purchases placeholder');
    return { success: true };
  },
  async cancelSubscription() {
    console.log('Canceling subscription placeholder');
    return { success: true };
  }
};
