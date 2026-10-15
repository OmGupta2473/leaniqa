export type PlanId = 'free' | 'discipline' | 'premium';

export interface Entitlements {
  aiParsesPerDay: number;
  historyDays: number | null;
  weeklyReports: 'basic' | 'full';
  macroBalance: boolean;
  coachSummary: 'basic' | 'full';
  exports: boolean;
  projections: 'none' | 'basic' | 'advanced';
}

export const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    aiParsesPerDay: 5,
    historyDays: 14,
    weeklyReports: 'basic',
    macroBalance: false,
    coachSummary: 'basic',
    exports: false,
    projections: 'none',
  },
  discipline: {
    aiParsesPerDay: 25,
    historyDays: 180,
    weeklyReports: 'full',
    macroBalance: true,
    coachSummary: 'full',
    exports: true,
    projections: 'basic',
  },
  premium: {
    aiParsesPerDay: 100,
    historyDays: null,
    weeklyReports: 'full',
    macroBalance: true,
    coachSummary: 'full',
    exports: true,
    projections: 'advanced',
  },
};

export function normalizePlan(raw: string | null | undefined): PlanId {
  if (raw === 'premium') return 'premium';
  if (raw === 'discipline' || raw === 'beta_pro') return 'discipline';
  return 'free';
}