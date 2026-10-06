export interface PricingPlan {
  id: 'explorer' | 'discipline' | 'coach';
  name: string;
  tagline: string;
  monthlyINR: number; // 0 for free
  annualINR: number; // 0 for free
  features: string[]; // outcome-focused, 5-6 items
  badge?: string; // "Recommended" for middle
  highlight: boolean; // true for the recommended tier
  ctaLabel: string; // "Start free" / "Start 7-day trial" / "Start 7-day trial"
  ctaHref: string; // route or action
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    tagline: 'For getting started',
    monthlyINR: 0,
    annualINR: 0,
    features: [
      'Manual meal logging',
      'Basic calorie & macro tracking',
      'Daily dashboard & streaks',
      'Standard food database',
    ],
    highlight: false,
    ctaLabel: 'Start free',
    ctaHref: '/login',
  },
  {
    id: 'discipline',
    name: 'Discipline',
    tagline: 'For serious lifters',
    monthlyINR: 399,
    annualINR: 3499,
    features: [
      'Everything in Explorer, plus:',
      'Unlimited AI meal parsing (type & forget)',
      'Adaptive calorie & macro targets',
      'Diet-aware coaching for Indian meals',
      'Projected progress timeline',
      'Priority support',
    ],
    badge: 'Recommended',
    highlight: true,
    ctaLabel: 'Start 7-day trial',
    ctaHref: '/login?next=/pricing',
  },
  {
    id: 'coach',
    name: 'Coach',
    tagline: 'For the disciplined',
    monthlyINR: 799,
    annualINR: 6999,
    features: [
      'Everything in Discipline, plus:',
      'Weekly AI report & recommendations',
      'Advanced progress analytics',
      'Priority Gemini chain (fastest parses)',
      'Early access to new features',
    ],
    highlight: false,
    ctaLabel: 'Start 7-day trial',
    ctaHref: '/login?next=/pricing',
  },
];

export const ANNUAL_SAVING_PERCENT = 27;