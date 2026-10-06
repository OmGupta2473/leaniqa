import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { AWARD_BY_ID } from '@/shared/utils/awardsEngine';
import { awardService } from '@/features/awards/services/awardService';
import { useAwardStore } from '@/features/awards/store/awardStore';
import { useAuthSession } from '@/router/useAuthSession';
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { useKeyboardOpen } from '@/shared/hooks/useVisualViewport';
import { useAppStore } from '@/app/store';
import { haptics } from '@/shared/utils/haptics';

export function AwardCelebrationSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuthSession();
  const { hasCompletedOnboarding } = useHasCompletedOnboarding();
  const isKeyboardOpen = useKeyboardOpen();
  const activeModal = useAppStore((s) => s.activeModal);

  const queue = useAwardStore((s) => s.pendingCelebrations);
  const shift = useAwardStore((s) => s.shiftPendingCelebration);
  const clear = useAwardStore((s) => s.clearPendingCelebrations);

  const current = queue[0];
  const definition = useMemo(
    () => (current ? AWARD_BY_ID[current.award_id] : null),
    [current],
  );

  const shouldRender =
    !!session &&
    hasCompletedOnboarding === true &&
    !isKeyboardOpen &&
    activeModal == null &&
    location.pathname !== '/onboarding' &&
    location.pathname !== '/science' &&
    queue.length > 0;

  useEffect(() => {
    if (shouldRender && definition) haptics.success();
  }, [shouldRender, definition]);

  const acknowledgeCurrent = async () => {
    if (!current) return;
    // Fire-and-forget. If the request fails, the row stays
    // unacknowledged in DB and the sheet re-fires next session.
    void awardService.acknowledgeAwards([current.award_id]);
    shift();
  };

  const acknowledgeAllAndView = async () => {
    const ids = queue.map((row) => row.award_id);
    void awardService.acknowledgeAwards(ids);
    clear();
    useAwardStore.getState().setHasUnseenAwards(false);
    navigate('/awards');
  };

  if (!shouldRender || !definition || !current) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="award-celebration-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={acknowledgeCurrent}
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px] border border-zinc-800/60 bg-[#0F0F10]/95 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="award-celebration-title"
        >
          <button
            onClick={acknowledgeCurrent}
            aria-label="Dismiss"
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/60 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#D4FF00] font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              New award unlocked
            </div>

            <motion.div
              initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className="flex h-28 w-28 items-center justify-center rounded-[32px] text-[56px] mb-5"
              style={{
                background: `linear-gradient(135deg, ${definition.primaryColor}25, ${definition.primaryColor}05)`,
                border: `1px solid ${definition.primaryColor}40`,
                boxShadow: `0 0 40px ${definition.primaryColor}30`,
              }}
            >
              <span className="drop-shadow-2xl">{definition.symbol}</span>
            </motion.div>

            <h2
              id="award-celebration-title"
              className="text-[24px] font-bold tracking-tight text-white mb-2"
            >
              {definition.name}
            </h2>
            <p className="text-[14px] text-zinc-400 leading-relaxed mb-4 max-w-[320px]">
              {definition.description}
            </p>
            <div className="text-[12px] uppercase tracking-wider text-zinc-500">
              {definition.category} · {definition.target} {definition.unitLabel}
            </div>
          </div>

          <div className="flex flex-col gap-2 px-6 pb-[max(20px,env(safe-area-inset-bottom))]">
            <button
              onClick={acknowledgeCurrent}
              className="w-full rounded-full bg-[#D4FF00] py-3.5 text-[15px] font-semibold text-black transition-colors hover:brightness-110"
            >
              Continue
            </button>
            <button
              onClick={acknowledgeAllAndView}
              className="w-full rounded-full bg-transparent py-3 text-[14px] font-medium text-zinc-400 transition-colors hover:text-white"
            >
              View awards
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}