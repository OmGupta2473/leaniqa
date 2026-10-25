import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { PlanId } from '@/features/pricing/entitlements';

interface AiLimitNudgeProps {
  remaining: number;
  plan: PlanId;
  onOpenCustomMeal: () => void;
}

/**
 * Shown in the meal logger when the user is about to hit (1 left) or has
 * hit (0 left) their daily AI parse limit.
 *
 * Two paths forward:
 *   1. Upgrade to a higher plan (hidden for Premium — nothing left to upgrade to).
 *   2. Log a custom meal manually — uses no AI credit.
 *
 * Renders nothing when the user still has >1 parses left.
 */
export function AiLimitNudge({ remaining, plan, onOpenCustomMeal }: AiLimitNudgeProps) {
  const navigate = useNavigate();

  if (remaining > 1) return null;

  const isExhausted = remaining === 0;
  const canUpgrade = plan !== 'premium';

  const headline = isExhausted
    ? 'Out of AI parses for today'
    : '1 AI parse left today';

  const body = canUpgrade
    ? isExhausted
      ? 'Upgrade to Premium for 25/day, or log a custom meal below.'
      : 'Premium gives you 25/day. Or log a custom meal below.'
    : 'Resets at midnight IST. Log a custom meal in the meantime.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mb-3 rounded-[16px] border border-[rgba(212,255,0,0.22)] bg-[rgba(212,255,0,0.05)] p-3.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(212,255,0,0.12)' }}
        >
          <Zap size={14} className="text-[#D4FF00]" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white leading-tight">
            {headline}
          </div>
          <div className="text-[12px] text-[rgba(255,255,255,0.55)] leading-snug mt-0.5">
            {body}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onOpenCustomMeal}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.12)] active:scale-[0.98]"
        >
          <Plus size={13} strokeWidth={2.5} />
          Custom meal
        </button>
        {canUpgrade && (
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="flex-1 flex items-center justify-center gap-1 rounded-full bg-[#D4FF00] py-2 text-[12.5px] font-bold text-black transition-colors hover:brightness-110 active:scale-[0.98]"
          >
            Upgrade to Premium
            <ChevronRight size={13} strokeWidth={3} />
          </button>
        )}
      </div>
    </motion.div>
  );
}