import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import type { PricingPlan } from '../plans';

interface PricingCardProps {
  plan: PricingPlan;
  billing: 'monthly' | 'annual';
  onSelect?: () => void;
}

const inr = (n: number) => n.toLocaleString('en-IN');

export function PricingCard({ plan, billing, onSelect }: PricingCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const annual = billing === 'annual';
  const price = annual ? plan.annualINR : plan.monthlyINR;
  const savings = Math.max(0, plan.monthlyINR * 12 - plan.annualINR);
  const display = plan.monthlyINR === 0 ? '₹0' : `₹${inr(price)}`;
  const suffix = plan.monthlyINR === 0 ? '' : annual ? '/yr' : '/mo';

  const isCoarse = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
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
    if (onSelect) onSelect();
    else navigate(plan.ctaHref);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'relative flex flex-col p-6 rounded-2xl overflow-hidden',
        plan.highlight
          ? 'border-2 border-[#D4FF00]/40 bg-gradient-to-b from-[rgba(212,255,0,0.04)] to-transparent lg:scale-105'
          : 'border border-zinc-800/60 bg-zinc-900/40',
      )}
    >
      {plan.highlight && !isCoarse && (
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
          {plan.badge && (
            <span className="shrink-0 bg-[#D4FF00] text-black text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-[44px] font-extrabold tracking-tighter text-white leading-none tabular-nums">
            {display}
          </span>
          {suffix && <span className="text-[15px] font-medium text-zinc-500">{suffix}</span>}
        </div>

        {plan.monthlyINR > 0 && annual && (
          <div className="mt-1.5 text-[12px] text-[#D4FF00]/90">
            Save ₹{inr(savings)}/year
          </div>
        )}

        <div className="my-5 h-px bg-zinc-800" />

        <ul className="flex-1 space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check
                className={cn('shrink-0 mt-0.5 w-4 h-4', plan.highlight ? 'text-[#D4FF00]' : 'text-zinc-400')}
              />
              <span className="text-[14px] leading-snug text-zinc-300">{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleCta}
          className={cn(
            'mt-6 w-full py-3 rounded-full text-[15px] font-semibold transition-colors cursor-pointer',
            plan.highlight
              ? 'bg-[#D4FF00] text-black hover:bg-[#C8F200]'
              : 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800',
          )}
        >
          {plan.ctaLabel}
        </button>
      </div>
    </div>
  );
}