import type { PlanId } from './entitlements';

export interface PricingPlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyINR: number;
  annualINR: number;
  features: string[];
  badge?: string;
  highlight: boolean;
  ctaLabel: string;
  ctaHref: string;
  available: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For getting started',
    monthlyINR: 0,
    annualINR: 0,
    features: [
      'Manual meal logging',
      '5 AI meal parses per day',
      'Last 14 days in full detail',
      'Daily calorie and protein totals',
      'Basic weekly summary and streaks',
    ],
    highlight: false,
    ctaLabel: 'Start free',
    ctaHref: '/login',
    available: true,
  },
  {
    id: 'discipline',
    name: 'Discipline',
    tagline: 'For consistent trackers',
    monthlyINR: 149,
    annualINR: 1199,
    features: [
      'Everything in Free, plus:',
      '12 AI meal parses per day',
      'Full detail for 180 days',
      'Full weekly reports',
      'Macro balance and weekly trends',
      'Coach-style weekly summary',
    ],
    badge: 'Recommended',
    highlight: true,
    ctaLabel: 'Upgrade to Discipline',
    ctaHref: '/pricing',
    available: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'For serious users',
    monthlyINR: 299,
    annualINR: 2399,
    features: [
      'Everything in Discipline, plus:',
      '25 AI meal parses per day',
      'Unlimited detailed history',
      'Advanced progress projections',
    ],
    highlight: false,
    ctaLabel: 'Upgrade to Premium',
    ctaHref: '/pricing',
    available: true,
  },
];

export const ANNUAL_SAVING_PERCENT = 33;