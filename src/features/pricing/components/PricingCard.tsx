import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import type { PricingPlan } from '../plans';
import type { PlanId } from '../entitlements';

export type CardState = 'free' | 'one_time' | 'sub_active' | 'sub_cancelled';

interface PricingCardProps {
  plan: PricingPlan;
  billing: 'monthly' | 'annual';
  onSelect?: () => void;
  onOneTime?: () => void;
  loading?: boolean;
  oneTimeLoading?: boolean;
  currentPlan?: PlanId;
  currentBillingCycle?: 'monthly' | 'annual' | null;
  cardState: CardState;
}

const inr = (n: number) => n.toLocaleString('en-IN');

function isDowngrade(
  currentPlan: PlanId | undefined,
  currentCycle: 'monthly' | 'annual' | null | undefined,
  targetPlan: PlanId,
  targetCycle: 'monthly' | 'annual',
): boolean {
  if (!currentPlan || currentPlan === 'free') return false;
  if (currentPlan === 'premium' && targetPlan === 'discipline') return true;
  if (
    currentPlan === targetPlan &&
    currentCycle === 'annual' &&
    targetCycle === 'monthly'
  ) {
    return true;
  }
  return false;
}

export function PricingCard({
  plan,
  billing,
  onSelect,
  onOneTime,
  loading = false,
  oneTimeLoading = false,
  currentPlan,
  currentBillingCycle,
  cardState,
}: PricingCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const isSameAsCurrent = currentPlan === plan.id && plan.id !== 'free';

  // "Current plan" only makes sense when the user is on the same tier.
  // For subscription users, billing cycle must match. For one-time users,
  // any billing toggle is fine (they paid a lump sum).
  const isCurrent =
    isSameAsCurrent &&
    (cardState === 'one_time' || currentBillingCycle === billing) &&
    cardState !== 'sub_cancelled';

  const isSubCancelledCurrent = isSameAsCurrent && cardState === 'sub_cancelled';

  const downgrade = isDowngrade(currentPlan, currentBillingCycle, plan.id, billing);

  const userHasPaidAccess = currentPlan && currentPlan !== 'free';

  // One-time is available on paid plans, monthly billing only, and never
  // for active or cancelled subscription users (Razorpay manages those).
  const showOneTime =
    billing === 'monthly' &&
    plan.monthlyINR > 0 &&
    plan.id !== 'free' &&
    !!onOneTime &&
    cardState !== 'sub_active' &&
    cardState !== 'sub_cancelled';

  const annual = billing === 'annual';
  const price = annual ? plan.annualINR : plan.monthlyINR;
  const savings = Math.max(0, plan.monthlyINR * 12 - plan.annualINR);
  const display = plan.monthlyINR === 0 ? '₹0' : `₹${inr(price)}`;
  const suffix = plan.monthlyINR === 0 ? '' : annual ? '/yr' : '/mo';

  const isCoarse =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : true;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el || isCoarse) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const handleCta = () => {
    if (!plan.available || loading || isCurrent || downgrade) return;
    if (onSelect) onSelect();
    else navigate(plan.ctaHref);
  };

  const handleOneTime = () => {
    if (!onOneTime || oneTimeLoading || loading) return;
    onOneTime();
  };

  // Primary CTA copy
  const primaryLabel = isCurrent
    ? 'Current plan'
    : isSubCancelledCurrent
    ? 'Renew subscription'
    : downgrade
    ? 'Contact support to downgrade'
    : loading
    ? 'Opening checkout…'
    : plan.ctaLabel;

  // One-time button copy
  const oneTimeLabel =
    cardState === 'one_time' && isSameAsCurrent
      ? `Extend for ₹${inr(plan.monthlyINR)} — adds 30 days`
      : `Pay ₹${inr(plan.monthlyINR)} for 1 month`;

  const borderClass = isCurrent
    ? 'border-2 border-[#D4FF00] bg-gradient-to-b from-[rgba(212,255,0,0.08)] to-transparent'
    : plan.highlight
    ? 'border-2 border-[#D4FF00]/40 bg-gradient-to-b from-[rgba(212,255,0,0.04)] to-transparent lg:scale-105'
    : 'border border-zinc-800/60 bg-zinc-900/40';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn('relative flex flex-col p-6 rounded-2xl overflow-hidden', borderClass)}
    >
      {plan.highlight && !isCoarse && !isCurrent && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(600px circle at var(--x, 50%) var(--y, 0%), rgba(212,255,0,0.08), transparent 40%)',
          }}
        />
      )}

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              {plan.name}
            </div>
            <div className="mt-1 text-[13px] text-zinc-500">{plan.tagline}</div>
          </div>
          {isCurrent ? (
            <span className="shrink-0 bg-[#D4FF00] text-black text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Check size={10} strokeWidth={3} />
              Current
            </span>
          ) : plan.badge ? (
            <span className="shrink-0 bg-[#D4FF00] text-black text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
              {plan.badge}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-[44px] font-extrabold tracking-tighter text-white leading-none tabular-nums">
            {display}
          </span>
          {suffix && (
            <span className="text-[15px] font-medium text-zinc-500">{suffix}</span>
          )}
        </div>

        {plan.monthlyINR > 0 && annual && !isCurrent && (
          <div className="mt-1.5 text-[12px] text-[#D4FF00]/90">
            Save ₹{inr(savings)}/year
          </div>
        )}

        <div className="my-5 h-px bg-zinc-800" />

        <ul className="flex-1 space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check
                className={cn(
                  'shrink-0 mt-0.5 w-4 h-4',
                  plan.highlight || isCurrent ? 'text-[#D4FF00]' : 'text-zinc-400',
                )}
              />
              <span className="text-[14px] leading-snug text-zinc-300">{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleCta}
          disabled={
            !plan.available || loading || isCurrent || downgrade || oneTimeLoading
          }
          className={cn(
            'mt-6 w-full py-3 rounded-full text-[15px] font-semibold transition-colors flex items-center justify-center gap-2',
            isCurrent
              ? 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/40 cursor-default'
              : downgrade
              ? 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/60 cursor-not-allowed'
              : !plan.available
              ? 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/60 cursor-not-allowed'
              : loading
              ? 'bg-zinc-900 text-white border border-zinc-800 cursor-wait opacity-70'
              : plan.highlight
              ? 'bg-[#D4FF00] text-black hover:bg-[#C8F200] cursor-pointer'
              : 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 cursor-pointer',
          )}
        >
          {isCurrent && <Check size={16} strokeWidth={3} />}
          {primaryLabel}
        </button>

        {showOneTime && (
          <>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                or
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <button
              onClick={handleOneTime}
              disabled={oneTimeLoading || loading}
              className={cn(
                'w-full py-2.5 rounded-full text-[13px] font-medium transition-colors border',
                oneTimeLoading
                  ? 'bg-zinc-900 text-white border-zinc-800 cursor-wait opacity-70'
                  : 'bg-transparent text-zinc-300 border-zinc-800 hover:bg-zinc-900/50 hover:text-white cursor-pointer',
              )}
            >
              {oneTimeLoading ? 'Opening checkout…' : oneTimeLabel}
            </button>
            <p className="mt-2 text-[11px] text-zinc-500 text-center leading-snug">
              No autopay. Access for 30 days.
            </p>
          </>
        )}
      </div>
    </div>
  );
}