import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { PricingSection } from '../components/PricingSection';
import { analytics } from '@/shared/utils/analytics';
import { useToast } from '@/shared/components/Toast';

export function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscriptionStatus(),
  });

  useEffect(() => {
    analytics.trackEvent('Pricing Viewed');
  }, []);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout !== 'complete') return;

    const initialPlan = currentSubscription?.plan ?? 'free';

    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    setSearchParams(next, { replace: true });

    let attempts = 0;
    const maxAttempts = 30; // ~60 seconds total

    const poll = async () => {
      attempts += 1;
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      const fresh = await subscriptionService.getSubscriptionStatus();

      if (fresh.plan !== 'free' && fresh.plan !== initialPlan) {
        toast({
          type: 'success',
          message: `Welcome to ${fresh.plan === 'premium' ? 'Premium' : 'Discipline'}!`,
        });
        return;
      }

      if (attempts < maxAttempts) {
        window.setTimeout(poll, 2000);
      } else {
        toast({
          type: 'info',
          message: 'Payment received. Your plan will activate shortly.',
        });
      }
    };

    void poll();
  }, [searchParams, setSearchParams, queryClient, toast, currentSubscription?.plan]);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0B] text-zinc-50">
      <PricingSection variant="full" />
      {currentSubscription && currentSubscription.plan !== 'free' && (
        <div className="pb-8 text-center text-zinc-500 text-[13px]">
          You&apos;re on the{' '}
          <span className="text-[#D4FF00]">{currentSubscription.plan}</span> plan.
        </div>
      )}
    </div>
  );
}