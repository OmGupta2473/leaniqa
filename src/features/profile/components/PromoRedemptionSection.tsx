import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Gift, AlertTriangle } from 'lucide-react';
import { promoService, type PromoRedemption } from '../services/promoService';
import { useToast } from '@/shared/components/Toast';
import { haptics } from '@/shared/utils/haptics';

const QUERY_KEY = ['promoRedemption'] as const;

const CARD_BASE =
  'rounded-2xl border p-[clamp(0.75rem,2dvh,1.25rem)]';
const EYEBROW =
  'text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.5rem,1.4dvh,0.75rem)]';
const INPUT_CLASS =
  'w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:border-[#D4FF00] outline-none transition-colors min-h-[44px]';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PromoRedemptionSection() {
  const { data: redemption, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => promoService.getRedemption(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <section className={`${CARD_BASE} border-zinc-800/60 bg-zinc-900/40`}>
        <div className={EYEBROW}>Gym membership</div>
        <div className="h-4 w-32 rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />
      </section>
    );
  }

  if (redemption) {
    return <ActiveOrExpiredCard redemption={redemption} />;
  }

  return <RedeemForm />;
}

function RedeemForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [shareMealData, setShareMealData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeemMutation = useMutation({
    mutationFn: () => promoService.redeem(code.trim(), shareMealData, shareMealData),
    onSuccess: async (result) => {
      if (result.ok && result.redemption) {
        haptics.success();
        toast({
          type: 'success',
          message: `Gym code redeemed. Premium until ${formatDate(result.redemption.premiumUntil)}.`,
          duration: 4000,
        });
        setCode('');
        setShareMealData(false);
        setError(null);
        await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      } else {
        const message = result.error ?? 'Could not redeem this code.';
        setError(message);
        toast({ type: 'error', message, duration: 5000 });
      }
    },
  });

  const canSubmit = code.trim().length >= 4 && !redeemMutation.isPending;

  return (
    <section className={`${CARD_BASE} border-zinc-800/60 bg-zinc-900/40`}>
      <div className={EYEBROW}>Gym membership</div>

      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.28), rgba(212,255,0,0.06))',
            border: '1px solid rgba(212,255,0,0.28)',
          }}
        >
          <Gift size={18} className="text-[#D4FF00]" />
        </div>
        <div className="min-w-0">
          <div className="text-[clamp(0.9rem,2.3dvh,1.05rem)] font-semibold text-white leading-tight">
            Have a gym code?
          </div>
          <div className="text-[clamp(0.72rem,1.85dvh,0.85rem)] text-zinc-400 leading-snug mt-0.5">
            Apply to get 1 month free premium.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="gym-code-input"
            className="text-[clamp(0.65rem,1.7dvh,0.78rem)] font-medium text-zinc-400 mb-1.5 block"
          >
            Code
          </label>
          <input
            id="gym-code-input"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="GYMCODE30"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={40}
            disabled={redeemMutation.isPending}
            className={INPUT_CLASS}
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={shareMealData}
            onChange={(e) => setShareMealData(e.target.checked)}
            disabled={redeemMutation.isPending}
            className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#D4FF00] focus:ring-2 focus:ring-[#D4FF00] cursor-pointer"
          />
          <span className="text-[clamp(0.72rem,1.85dvh,0.85rem)] text-zinc-300 leading-snug">
            Share my meal logs and profile name with the gym associated with this code. You can revoke this later.
          </span>
        </label>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[rgba(255,92,77,0.3)] bg-[rgba(255,92,77,0.08)] px-3 py-2.5 text-[12.5px] text-[#FF5C4D]"
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => redeemMutation.mutate()}
          disabled={!canSubmit}
          className="w-full h-12 rounded-full bg-[#D4FF00] text-black font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity min-h-[48px]"
        >
          {redeemMutation.isPending ? 'Redeeming…' : 'Redeem code'}
        </button>
      </div>
    </section>
  );
}

function ActiveOrExpiredCard({ redemption }: { redemption: PromoRedemption }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isActive = new Date(redemption.premiumUntil) > new Date();

  const consentMutation = useMutation({
    mutationFn: ({ mealData, name }: { mealData: boolean, name: boolean }) => 
      promoService.setConsent(mealData, name),
    onSuccess: async (result) => {
      if (result.ok) {
        haptics.tap();
        await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      } else {
        toast({
          type: 'error',
          message: result.error ?? 'Could not update sharing.',
          duration: 4000,
        });
      }
    },
  });

  const handleToggleMealData = () => {
    consentMutation.mutate({ 
      mealData: !redemption.shareMealData, 
      name: redemption.shareName 
    });
  };

  const handleToggleName = () => {
    consentMutation.mutate({ 
      mealData: redemption.shareMealData, 
      name: !redemption.shareName 
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`${CARD_BASE} ${
        isActive
          ? 'border-[#D4FF00]/30 bg-[#D4FF00]/[0.04]'
          : 'border-zinc-800/60 bg-zinc-900/40'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={EYEBROW} style={{ marginBottom: 0 }}>
          Gym membership
        </div>
        {isActive ? (
          <span className="rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
            Ended
          </span>
        )}
      </div>

      <div className="text-[clamp(0.9rem,2.3dvh,1.05rem)] font-semibold text-white leading-tight">
        {redemption.gymName}
      </div>
      <div
        className={`text-[clamp(0.72rem,1.85dvh,0.85rem)] mt-1 ${
          isActive ? 'text-zinc-400' : 'text-zinc-500'
        }`}
      >
        {isActive ? 'Premium until ' : 'Premium ended '}
        <span className={isActive ? 'text-zinc-200' : 'text-zinc-400'}>
          {formatDate(redemption.premiumUntil)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="min-w-0">
          <div className="text-[clamp(0.8rem,2.1dvh,0.95rem)] font-semibold text-white leading-tight">
            Meal sharing
          </div>
          <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] text-zinc-500 leading-snug mt-0.5">
            Meal logs and weekly reports
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={redemption.shareMealData}
          onClick={handleToggleMealData}
          disabled={consentMutation.isPending}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors disabled:opacity-50 ${
            redemption.shareMealData ? 'bg-[#D4FF00]' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
              redemption.shareMealData ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="min-w-0">
          <div className="text-[clamp(0.8rem,2.1dvh,0.95rem)] font-semibold text-white leading-tight">
            Profile name
          </div>
          <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] text-zinc-500 leading-snug mt-0.5">
            Your display name in the gym dashboard
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={redemption.shareName}
          onClick={handleToggleName}
          disabled={consentMutation.isPending}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors disabled:opacity-50 ${
            redemption.shareName ? 'bg-[#D4FF00]' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
              redemption.shareName ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </motion.section>
  );
}