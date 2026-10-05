import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { useAuthSession } from '@/router/useAuthSession';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';

const GOAL_LABELS: Record<string, string> = {
  cut: 'Lose Fat',
  recomp: 'Recomp',
  bulk: 'Build Muscle',
};

/** Fallback only - used when the goal row has no derived daily target yet. */
const GOAL_ADJUSTMENTS: Record<string, number> = {
  cut: -0.15,
  recomp: 0,
  bulk: 0.10,
};

/**
 * One-time welcome banner for a freshly onboarded user: their goal label and
 * daily calorie target. Gated by localStorage so it appears once per device
 * until the key is cleared.
 */
export function WelcomeMessage() {
  const { session } = useAuthSession();
  const userId = session?.user.id;
  const { profile, goal, profileData } = useCalculatedProfile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId || !profile || !goal) return;
    const key = `leaniqa-welcome-seen:${userId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    // Let the dashboard paint first, then slide the banner in.
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [userId, profile, goal]);

  const dismiss = () => {
    setVisible(false);
    if (userId) {
      try {
        localStorage.setItem(`leaniqa-welcome-seen:${userId}`, '1');
      } catch {}
    }
  };

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const goalType = goal?.goal_type;
  const goalLabel = (goalType && GOAL_LABELS[goalType]) || 'your goal';

  // Prefer the app's canonical (already goal-adjusted) target; fall back to
  // maintenance plus the Phase 1A goal adjustment.
  const canonical = profileData?.dailyCalorieGoal as number | undefined;
  const adjustment = goalType ? GOAL_ADJUSTMENTS[goalType] ?? 0 : 0;
  const kcal =
    typeof canonical === 'number' && canonical > 0
      ? Math.round(canonical)
      : profile?.maintenance_kcal
        ? Math.round(profile.maintenance_kcal * (1 + adjustment))
        : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-[#D4FF00]/25 bg-[#D4FF00]/5 p-[clamp(0.6rem,1.7dvh,0.9rem)] flex items-start gap-3"
        >
          <div className="w-[clamp(1.75rem,4.5dvh,2.25rem)] h-[clamp(1.75rem,4.5dvh,2.25rem)] rounded-full bg-[#D4FF00]/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#D4FF00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[clamp(0.78rem,2dvh,0.92rem)] font-semibold text-white mb-1">
              Welcome to Team Lean, {firstName}.
            </p>
            <p className="text-[clamp(0.68rem,1.75dvh,0.8rem)] text-zinc-400 leading-relaxed">
              Your goal: <span className="text-[#D4FF00] font-medium">{goalLabel}</span>
              {kcal !== null && (
                <>
                  {' · target '}
                  <span className="text-zinc-200 font-medium tabular-nums">
                    {kcal.toLocaleString()} kcal/day
                  </span>
                </>
              )}
              . Log your first meal to get started.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-zinc-400 shrink-0"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}