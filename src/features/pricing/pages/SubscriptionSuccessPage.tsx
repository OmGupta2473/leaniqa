import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, PartyPopper, RefreshCw } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { useToast } from '@/shared/components/Toast';
import { haptics } from '@/shared/utils/haptics';

type TargetPlan = 'discipline' | 'premium';

const PLAN_BENEFITS: Record<TargetPlan, string[]> = {
  discipline: [
    '25 AI meal parses every day',
    '180 days of detailed meal history',
    'Full weekly reports and macro balance',
    'Coach-style weekly summary',
    'Weekly trends and consistency insights',
  ],
  premium: [
    '100 AI meal parses every day',
    'Unlimited detailed meal history',
    'Advanced progress projections',
    'Everything in Discipline',
  ],
};

const PLAN_LABEL: Record<TargetPlan, string> = {
  discipline: 'Discipline',
  premium: 'Premium',
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function SubscriptionSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const planParam = params.get('plan');
  const targetPlan: TargetPlan = planParam === 'premium' ? 'premium' : 'discipline';

  const [confirmed, setConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showBackToApp, setShowBackToApp] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    let backToAppTimer: number | null = null;
    let attempts = 0;
    const maxAttempts = 8; // ~15s at 2s interval

    const poll = async () => {
      if (cancelled || confirmedRef.current) return;
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      const status = await subscriptionService.getSubscriptionStatus();
      if (cancelled) return;

      if (status.hasAccess && status.plan === targetPlan) {
        confirmedRef.current = true;
        setConfirmed(true);
        setCurrentPeriodEnd(status.currentPeriodEnd);
        haptics.success();
        toast({
          type: 'success',
          message: `You now have ${PLAN_LABEL[targetPlan]} access.`,
        });
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        pollTimer = window.setTimeout(poll, 2000);
      } else {
        setTimedOut(true);
        backToAppTimer = window.setTimeout(() => {
          if (!cancelled) setShowBackToApp(true);
        }, 60000);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (pollTimer !== null) window.clearTimeout(pollTimer);
      if (backToAppTimer !== null) window.clearTimeout(backToAppTimer);
    };
  }, [targetPlan, queryClient, toast]);

  const benefits = PLAN_BENEFITS[targetPlan];
  const planLabel = PLAN_LABEL[targetPlan];
  const formattedEnd = formatDate(currentPeriodEnd);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex items-center justify-center px-5 py-12">
      <AnimatePresence mode="wait">
        {!confirmed && !timedOut && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.18), rgba(212,255,0,0.04))',
                border: '1px solid rgba(212,255,0,0.30)',
              }}
            >
              <Loader2 size={32} className="text-[#D4FF00] animate-spin" strokeWidth={2.2} />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight mb-3">
              Confirming your {planLabel} membership
            </h1>
            <p className="text-[14px] text-zinc-400 leading-relaxed">
              This usually takes just a few seconds.
            </p>
          </motion.div>
        )}

        {timedOut && !confirmed && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.18), rgba(212,255,0,0.04))',
                border: '1px solid rgba(212,255,0,0.30)',
              }}
            >
              <RefreshCw size={32} className="text-[#D4FF00]" strokeWidth={2.2} />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight mb-3">
              We&apos;ve received your payment
            </h1>
            <p className="text-[14px] text-zinc-400 leading-relaxed mb-8">
              Confirming with Razorpay — this usually takes under a minute.
              Your {planLabel} plan will activate automatically. If it
              doesn&apos;t, refresh or contact support.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-[#D4FF00] text-black px-8 py-3.5 rounded-full font-semibold text-[15px] active:scale-95 transition-transform min-h-[48px] shadow-[0_0_30px_rgba(212,255,0,0.25)] mb-3"
            >
              Refresh
            </button>
            {showBackToApp ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="text-[14px] font-medium text-zinc-300 hover:text-white transition-colors min-h-[44px] px-4"
              >
                Back to app
              </button>
            ) : (
              <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed">
                You can leave this page — your plan will activate in the
                background and unlock as soon as we confirm payment.
              </p>
            )}
          </motion.div>
        )}

        {confirmed && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 18,
                delay: 0.1,
              }}
              className="relative w-28 h-28 rounded-full flex items-center justify-center mb-6"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.35), rgba(212,255,0,0.08))',
                border: '1px solid rgba(212,255,0,0.5)',
                boxShadow: '0 0 60px rgba(212,255,0,0.35)',
              }}
            >
              <PartyPopper size={48} className="text-[#D4FF00]" strokeWidth={2} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-[28px] font-bold tracking-tight mb-3"
            >
              Welcome to {planLabel}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="text-[15px] text-zinc-400 leading-relaxed mb-8"
            >
              Your {planLabel} membership is now active.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 mb-6 text-left"
            >
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#D4FF00] mb-4">
                You&apos;ve unlocked
              </div>
              <ul className="space-y-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className="text-[#D4FF00] shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span className="text-[14px] text-zinc-200 leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
              {formattedEnd && (
                <div className="mt-5 pt-4 border-t border-zinc-800/60 text-[12px] text-zinc-500">
                  Next billing date:{' '}
                  <span className="text-zinc-300">{formattedEnd}</span>
                </div>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full bg-[#D4FF00] text-black py-4 rounded-full font-semibold text-[15px] active:scale-95 transition-transform min-h-[52px] shadow-[0_0_30px_rgba(212,255,0,0.25)]"
            >
              Start tracking today
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}