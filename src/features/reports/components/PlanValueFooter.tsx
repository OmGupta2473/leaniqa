import { Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useEntitlements } from '@/features/pricing/hooks/useEntitlements';

interface PlanValue {
  label: string;
  bullets: string[];
}

const PLAN_VALUE: Record<'discipline' | 'premium', PlanValue> = {
  discipline: {
    label: 'Discipline',
    bullets: [
      '180-day detailed history',
      'Full weekly reports with macro balance',
      'Coach-style weekly summary',
    ],
  },
  premium: {
    label: 'Premium',
    bullets: [
      'Unlimited detailed history',
      'Advanced progress projections',
      'Everything in Discipline',
    ],
  },
};

/**
 * Quiet value reminder for subscribers, rendered at the end of the weekly
 * report. Renders nothing for free users.
 */
export function PlanValueFooter() {
  const { plan } = useEntitlements();
  if (plan === 'free') return null;

  const value = PLAN_VALUE[plan];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
      className="mt-6"
    >
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={12} className="text-[#D4FF00]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4FF00]">
            {value.label} plan
          </span>
        </div>
        <ul className="space-y-1.5">
          {value.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <Check
                size={12}
                className="text-[#D4FF00] shrink-0 mt-[3px]"
                strokeWidth={3}
              />
              <span className="text-[12.5px] text-zinc-400 leading-snug">
                {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}