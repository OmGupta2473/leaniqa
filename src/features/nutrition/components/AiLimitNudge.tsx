import { useNavigate } from 'react-router-dom';
import { ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface AiLimitNudgeProps {
  remaining: number;
  nextTierLimit: number;
}

/**
 * Inline contextual nudge shown in the meal logger only when a free user
 * is about to hit (1 left) or has hit (0 left) their daily AI limit.
 *
 * Renders nothing for paid users or when the user still has headroom.
 * Deliberately appears exactly where the limit matters, not on page load.
 */
export function AiLimitNudge({ remaining, nextTierLimit }: AiLimitNudgeProps) {
  const navigate = useNavigate();

  if (remaining > 1) return null;

  const isExhausted = remaining === 0;
  const headline = isExhausted
    ? 'Out of AI parses for today'
    : '1 AI parse left today';
  const body = isExhausted
    ? `Resets at midnight IST. Discipline gives you ${nextTierLimit}/day.`
    : `Discipline gives you ${nextTierLimit}/day.`;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate('/pricing')}
      className="w-full mb-3 flex items-start gap-3 rounded-[16px] border border-[rgba(212,255,0,0.22)] bg-[rgba(212,255,0,0.05)] px-3.5 py-3 text-left transition-colors hover:bg-[rgba(212,255,0,0.08)] active:scale-[0.99]"
      aria-label="See plans with more AI parses"
    >
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
      <ChevronRight
        size={14}
        className="text-[rgba(212,255,0,0.7)] shrink-0 mt-1.5"
      />
    </motion.button>
  );
}