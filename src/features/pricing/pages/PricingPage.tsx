import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { PricingSection } from '../components/PricingSection';
import { analytics } from '@/shared/utils/analytics';

export function PricingPage() {
  const { data: currentSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscriptionStatus(),
  });

  useEffect(() => {
    analytics.trackEvent('Subscription Started');
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0B] text-zinc-50">
      <PricingSection variant="full" />
      {currentSubscription && (currentSubscription.plan || '').toLowerCase() !== 'free' && (
        <div className="pb-8 text-center text-zinc-500 text-[13px]">
          You're on the <span className="text-[#D4FF00]">{currentSubscription.plan}</span> plan.
        </div>
      )}
    </div>
  );
}