import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RotateCcw, XCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/utils/utils';
import { PRICING_PLANS, ANNUAL_SAVING_PERCENT } from '../plans';
import { PricingCard } from './PricingCard';

interface PricingSectionProps {
  variant: 'landing' | 'full';
  title?: string;
  subtitle?: string;
}

export function PricingSection({ variant, title, subtitle }: PricingSectionProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const navigate = useNavigate();

  return (
    <section className="py-[clamp(3rem,8dvh,5rem)] px-[clamp(1rem,4vw,1.5rem)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-[clamp(2rem,5dvh,3rem)]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4FF00] mb-3">
              Pricing
            </div>
            <h2 className="text-[clamp(1.75rem,5dvh,3rem)] font-semibold tracking-tight text-white mb-4">
              {title ?? 'Pay for results, not features.'}
            </h2>
            <p className="text-[clamp(0.85rem,2.2dvh,1rem)] text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {subtitle ?? "Start free. Upgrade when you're serious. Cancel anytime."}
            </p>
          </motion.div>
        </div>

        {/* Billing toggle (annual defaulted) */}
        <div className="flex justify-center mb-[clamp(1.5rem,4dvh,2.5rem)]">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                'px-[clamp(1rem,3vw,1.5rem)] py-2 rounded-full text-sm font-medium transition-colors',
                billing === 'monthly' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white',
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn(
                'px-[clamp(1rem,3vw,1.5rem)] py-2 rounded-full text-sm font-medium transition-colors flex items-center',
                billing === 'annual' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white',
              )}
            >
              Annual
              <span className={cn(
                'ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                billing === 'annual' ? 'bg-[#D4FF00] text-black' : 'bg-zinc-800 text-zinc-400',
              )}>
                −{ANNUAL_SAVING_PERCENT}%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onSelect={() => navigate(plan.ctaHref)}
            />
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-[clamp(1.5rem,4dvh,2.5rem)] flex flex-wrap justify-center gap-x-6 gap-y-2 text-[clamp(0.72rem,1.85dvh,0.85rem)] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4FF00]" />
            No credit card for free plan
          </span>
          <span className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-[#D4FF00]" />
            7-day money-back guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-[#D4FF00]" />
            Cancel anytime
          </span>
        </div>

        {/* FAQ mini (only in 'full' variant) */}
        {variant === 'full' && <PricingFAQ />}
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: 'What happens after the free trial?',
    a: 'You keep the Explorer plan free forever. No charge unless you explicitly upgrade.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your profile. Your access continues until the end of the billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes — 7-day money-back guarantee on any paid plan, no questions asked.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'All UPI apps, cards, and netbanking via Razorpay. Recurring payments supported.',
  },
  {
    q: 'Is the annual plan really cheaper?',
    a: `Yes — ${ANNUAL_SAVING_PERCENT}% off compared to paying monthly. That's about ${Math.round(12 / (1 - ANNUAL_SAVING_PERCENT / 100) - 12)} months free.`,
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-[clamp(3rem,8dvh,5rem)] max-w-3xl mx-auto">
      <h3 className="text-center text-[clamp(1.25rem,3.5dvh,1.75rem)] font-semibold text-white mb-8">
        Questions, answered.
      </h3>
      <div className="space-y-2">
        {FAQ_ITEMS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/60 bg-[#111112] overflow-hidden transition-colors hover:border-zinc-700"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left"
              >
                <span className="text-sm sm:text-base font-medium text-zinc-100">{faq.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-shrink-0 text-zinc-500"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-sm sm:text-[15px] leading-relaxed text-zinc-400">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
