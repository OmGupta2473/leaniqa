import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, X } from 'lucide-react';
import { getKolkataDateString, getKolkataHour } from '@/shared/utils/timezone';

interface StreakAtRiskBannerProps {
  userId: string | undefined;
  currentStreak: number;
  hasLoggedToday: boolean;
}

const MIN_STREAK = 3;
const EVENING_HOUR_IST = 18;

/**
 * Evening nudge shown on the dashboard when all of these are true:
 *   - user has an active streak of at least 3 days
 *   - it is 6pm or later in IST
 *   - no meals logged today
 *
 * Dismissible per calendar day (IST). Reappears tomorrow if the same
 * conditions hold again. Renders nothing otherwise.
 */
export function StreakAtRiskBanner({
  userId,
  currentStreak,
  hasLoggedToday,
}: StreakAtRiskBannerProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (currentStreak < MIN_STREAK) return;
    if (hasLoggedToday) return;
    if (getKolkataHour() < EVENING_HOUR_IST) return;

    const key = `leaniqa-streak-nudge-dismissed:${userId}:${getKolkataDateString()}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    // Small delay so the dashboard paints before the banner slides in.
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [userId, currentStreak, hasLoggedToday]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    if (userId) {
      try {
        localStorage.setItem(
          `leaniqa-streak-nudge-dismissed:${userId}:${getKolkataDateString()}`,
          '1',
        );
      } catch {
        /* quota — nothing we can do, banner just reappears on refresh */
      }
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => navigate('/meals')}
          className="w-full flex items-start gap-3 rounded-2xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/[0.06] p-4 text-left active:scale-[0.99] transition-transform"
          aria-label="Log a meal to keep your streak"
        >
          <div className="w-9 h-9 rounded-full bg-[#FF4D1C]/15 flex items-center justify-center shrink-0">
            <Flame size={18} className="text-[#FF4D1C]" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white leading-tight">
              Your {currentStreak}-day streak is at risk
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.6)] leading-snug mt-1">
              Log one meal before midnight to keep it going.
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss for today"
            className="w-6 h-6 -mr-1 rounded-full flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:text-white shrink-0 transition-colors"
          >
            <X size={12} />
          </button>
        </motion.button>
      )}
    </AnimatePresence>
  );
}