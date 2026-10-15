import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useEntitlements } from '@/features/pricing/hooks/useEntitlements';
import { useAiCredits } from '@/features/nutrition/hooks/useAiCredits';

const PLAN_LABEL: Record<'discipline' | 'premium', string> = {
  discipline: 'Discipline',
  premium: 'Premium',
};

/**
 * Compact plan chip for the dashboard header. Only renders for paid users.
 * Shows the plan name and remaining AI parses for today. Tappable to /pricing.
 */
export function PlanChip() {
  const navigate = useNavigate();
  const { plan } = useEntitlements();
  const { credits } = useAiCredits();

  if (plan === 'free') return null;
  if (!credits) return null;

  const label = PLAN_LABEL[plan];

  return (
    <button
      type="button"
      onClick={() => navigate('/pricing')}
      className="flex items-center gap-1.5 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 px-2.5 py-1.5 transition-colors hover:bg-[#D4FF00]/15 active:scale-95"
      aria-label={`${label} plan. ${credits.remaining} of ${credits.limit} AI parses left today.`}
    >
      <Zap size={11} className="text-[#D4FF00]" strokeWidth={2.5} />
      <span className="text-[11px] font-semibold text-[#D4FF00] tracking-tight">
        {label}
      </span>
      <span className="text-[11px] text-[rgba(212,255,0,0.7)] tabular-nums">
        · {credits.remaining}/{credits.limit}
      </span>
    </button>
  );
}