import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { ENTITLEMENTS, type Entitlements, type PlanId } from '../entitlements';

export interface UseEntitlementsResult {
  plan: PlanId;
  entitlements: Entitlements;
}

/**
 * Returns the current user's plan and its entitlements.
 * Uses the shared ['subscription'] query key so React Query dedupes with
 * ProfilePage, PricingPage, and any other consumer.
 * Falls back to the free plan while loading or on error.
 */
export function useEntitlements(): UseEntitlementsResult {
  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscriptionStatus(),
  });

  const plan: PlanId = data?.plan ?? 'free';
  return { plan, entitlements: ENTITLEMENTS[plan] };
}