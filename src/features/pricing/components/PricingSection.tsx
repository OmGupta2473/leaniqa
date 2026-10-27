import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, XCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/utils/utils';
import { PRICING_PLANS, ANNUAL_SAVING_PERCENT, type PricingPlan } from '../plans';
import { PricingCard, type CardState } from './PricingCard';
import { subscriptionService } from '../services/subscriptionService';
import { useToast } from '@/shared/components/Toast';

interface PricingSectionProps {
  variant: 'landing' | 'full';
  title?: string;
  subtitle?: string;
}
/**
 * Maps an HTTP status and raw error message to user-facing copy.
 * Every checkout error path in this component goes through this.
 */
function checkoutErrorMessage(status: number, raw: string | null): string {
  if (status === 401) return 'Your session expired. Please sign in again.';
  if (status === 403) return 'Link Google or email to subscribe. Guests can’t purchase.';
  if (status === 409) return 'You already have an active subscription.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status === 502 || status === 503 || status === 504) {
    return 'Payment service is temporarily unavailable. Try again in a minute.';
  }
  if (status === 0 && /network|fetch/i.test(raw ?? '')) {
    return 'No internet connection. Check your network and try again.';
  }
  if (raw) return raw;
  return 'Something went wrong. Please try again.';
}

let razorpayLoader: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (razorpayLoader) return razorpayLoader;
  razorpayLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayLoader = null;
      reject(new Error('razorpay_script_load_failed'));
    };
    document.head.appendChild(script);
  });
  return razorpayLoader;
}

export function PricingSection({ variant, title, subtitle }: PricingSectionProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<'discipline' | 'premium' | null>(
    null,
  );
  const [loadingOneTime, setLoadingOneTime] = useState<'discipline' | 'premium' | null>(
    null,
  );
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscriptionStatus(),
  });
  const currentPlan = subscription?.plan ?? 'free';
    // Card state drives the CTA copy. Priority:
  //   free         -> no paid access
  //   one_time     -> paid via a one-time order, not a subscription
  //   sub_cancelled -> subscription set to end, still has access until period_end
  //   sub_active   -> active subscription
  const cardState: CardState = (() => {
    if (!subscription || subscription.plan === 'free') return 'free';
    if (subscription.accessType === 'one_time') return 'one_time';
    if (subscription.status === 'cancelled') return 'sub_cancelled';
    return 'sub_active';
  })();

  const handlePlanSelect = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      navigate('/login');
      return;
    }

    if (loadingPlan) return;
    setLoadingPlan(plan.id);

    const { subscriptionId, keyId, error, status } =
      await subscriptionService.startCheckout(plan.id, billing);

    if (error || !subscriptionId || !keyId) {
      setLoadingPlan(null);
      toast({ type: 'error', message: checkoutErrorMessage(status, error) });
      if (status === 401) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      return;
    }

    try {
      await loadRazorpayScript();
    } catch {
      setLoadingPlan(null);
      toast({
        type: 'error',
        message: 'Could not load payment SDK. Check your connection.',
      });
      return;
    }

    const RzpCtor = (window as unknown as {
      Razorpay: new (options: unknown) => { open: () => void };
    }).Razorpay;

    const rzp = new RzpCtor({
      key: keyId,
      subscription_id: subscriptionId,
      name: 'LeanIQA',
      description:
        plan.id === 'premium' ? 'Premium subscription' : 'Discipline subscription',
      theme: { color: '#D4FF00' },
      handler: () => {
        window.location.href = `/subscription/success?plan=${plan.id}`;
      },
      modal: {
        ondismiss: () => {
          setLoadingPlan(null);
        },
      },
    });

    rzp.open();
  };
    const handleOneTimeSelect = async (plan: PricingPlan) => {
    if (plan.id !== 'discipline' && plan.id !== 'premium') return;
    if (loadingOneTime) return;

    setLoadingOneTime(plan.id);

    const { orderId, amount, keyId, error, status } =
      await subscriptionService.startOneTimeCheckout(plan.id);

    if (error || !orderId || !keyId || amount == null) {
      setLoadingOneTime(null);
      toast({ type: 'error', message: checkoutErrorMessage(status, error) });
      if (status === 401) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      return;
    }

    try {
      await loadRazorpayScript();
    } catch {
      setLoadingOneTime(null);
      toast({
        type: 'error',
        message: 'Could not load payment SDK. Check your connection.',
      });
      return;
    }

    const RzpCtor = (window as unknown as {
      Razorpay: new (options: unknown) => { open: () => void };
    }).Razorpay;

    const rzp = new RzpCtor({
      key: keyId,
      order_id: orderId,
      amount,
      currency: 'INR',
      name: 'LeanIQA',
      description:
        plan.id === 'premium'
          ? 'Premium — 1 month'
          : 'Discipline — 1 month',
      theme: { color: '#D4FF00' },
      handler: () => {
        window.location.href = `/subscription/success?plan=${plan.id}`;
      },
      modal: {
        ondismiss: () => {
          setLoadingOneTime(null);
        },
      },
    });

    rzp.open();
  };

  return (
    <section className="py-[clamp(3rem,8dvh,5rem)] px-[clamp(1rem,4vw,1.5rem)]">
      <div className="max-w-6xl mx-auto">
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

        <div className="flex justify-center mb-[clamp(1.5rem,4dvh,2.5rem)]">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                'px-[clamp(1rem,3vw,1.5rem)] py-2 rounded-full text-sm font-medium transition-colors',
                billing === 'monthly'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn(
                'px-[clamp(1rem,3vw,1.5rem)] py-2 rounded-full text-sm font-medium transition-colors flex items-center',
                billing === 'annual'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Annual
              <span
                className={cn(
                  'ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  billing === 'annual'
                    ? 'bg-[#D4FF00] text-black'
                    : 'bg-zinc-800 text-zinc-400',
                )}
              >
                −{ANNUAL_SAVING_PERCENT}%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onSelect={() => handlePlanSelect(plan)}
              onOneTime={() => handleOneTimeSelect(plan)}
              loading={loadingPlan === plan.id}
              oneTimeLoading={loadingOneTime === plan.id}
              currentPlan={currentPlan}
              currentBillingCycle={subscription?.billingCycle ?? null}
              cardState={cardState}
            />
          ))}
        </div>

        <div className="mt-[clamp(1.5rem,4dvh,2.5rem)] flex flex-wrap justify-center gap-x-6 gap-y-2 text-[clamp(0.72rem,1.85dvh,0.85rem)] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4FF00]" />
            No credit card for free plan
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-[#D4FF00]" />
            Cancel anytime
          </span>
        </div>

        {variant === 'full' && <PricingFAQ />}
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: 'What happens after the free plan?',
    a: 'You keep the Free plan forever. Upgrade only when you want more AI parses and full history.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your profile. Your access continues until the end of the billing period.',
  },
  {
    q: 'Is the annual plan really cheaper?',
    a: `Yes — about ${ANNUAL_SAVING_PERCENT}% off compared to paying monthly.`,
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
                <span className="text-sm sm:text-base font-medium text-zinc-100">
                  {faq.q}
                </span>
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