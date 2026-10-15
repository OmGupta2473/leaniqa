export type PlanTier = 'free' | 'discipline' | 'premium';
export type AccessType = 'subscription' | 'one_time';
export type RawStatus = 'active' | 'cancelled' | 'expired' | 'halted' | 'pending';

export interface SubscriptionRecord {
  plan: PlanTier;
  status: RawStatus;
  accessType: AccessType;
  currentPeriodEnd: string | null;
  betaExpiresAt: string | null;
}

/**
 * The single source of truth for "does this user have paid access right now,
 * and if so at what tier?" Every consumer — client, edge function, RLS —
 * must agree with this function.
 */
export function resolveAccess(
  record: SubscriptionRecord | null,
  now: Date = new Date(),
): { hasAccess: boolean; tier: PlanTier; reason: string } {
  if (!record) return { hasAccess: false, tier: 'free', reason: 'no_record' };

  const periodEnd = record.currentPeriodEnd ? new Date(record.currentPeriodEnd) : null;
  const betaEnd = record.betaExpiresAt ? new Date(record.betaExpiresAt) : null;

  // Legacy beta_pro mapping.
  if (record.plan === 'free' && betaEnd && betaEnd > now) {
    return { hasAccess: true, tier: 'discipline', reason: 'beta_active' };
  }

  if (record.status === 'expired' || record.status === 'halted') {
    return { hasAccess: false, tier: 'free', reason: `status_${record.status}` };
  }

  if (record.status === 'pending') {
    return { hasAccess: false, tier: 'free', reason: 'pending_activation' };
  }

  // Active subscription: access until period_end (or forever if no end set).
  if (record.status === 'active' && record.accessType === 'subscription') {
    if (periodEnd === null || periodEnd > now) {
      return { hasAccess: true, tier: record.plan, reason: 'sub_active' };
    }
    return { hasAccess: false, tier: 'free', reason: 'sub_period_ended' };
  }

  // One-time: access strictly until period_end.
  if (record.accessType === 'one_time') {
    if (periodEnd && periodEnd > now) {
      return { hasAccess: true, tier: record.plan, reason: 'one_time_active' };
    }
    return { hasAccess: false, tier: 'free', reason: 'one_time_expired' };
  }

  // Cancelled subscription: access until period_end.
  if (record.status === 'cancelled') {
    if (periodEnd && periodEnd > now) {
      return { hasAccess: true, tier: record.plan, reason: 'cancelled_but_active' };
    }
    return { hasAccess: false, tier: 'free', reason: 'cancelled_and_ended' };
  }

  return { hasAccess: false, tier: 'free', reason: 'unhandled' };
}

/** Translate the resolved state into a UI status the client renders. */
export type UiStatus =
  | 'free'
  | 'active'
  | 'cancelled_but_active'
  | 'pending'
  | 'expired'
  | 'one_time_active';

export function toUiStatus(record: SubscriptionRecord | null): UiStatus {
  if (!record) return 'free';
  const r = resolveAccess(record);
  if (!r.hasAccess) {
    if (record.status === 'pending') return 'pending';
    if (record.status === 'expired' || record.status === 'halted') return 'expired';
    return 'free';
  }
  if (record.accessType === 'one_time') return 'one_time_active';
  if (record.status === 'cancelled') return 'cancelled_but_active';
  return 'active';
}