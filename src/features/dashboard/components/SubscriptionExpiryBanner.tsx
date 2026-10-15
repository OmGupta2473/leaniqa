import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X, AlertCircle } from 'lucide-react';
import { getKolkataDateString } from '@/shared/utils/timezone';

interface SubscriptionExpiryBannerProps {
  userId: string | undefined;
  currentPeriodEnd: string | null;
  /** User has access right now, but it ends within 7 days. */
  isEndingSoon: boolean;
  /** User has no access now, but had it recently (status = expired). */
  hasJustEnded: boolean;
}

const DAYS_THRESHOLD = 7;
const JUST_ENDED_WINDOW_DAYS = 7;

function daysBetween(iso: string): number {
  const now = Date.now();
  const target = new Date(iso).getTime();
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000));
}

/**
 * Dashboard banner for subscription transitions.
 * Two modes:
 *   ending_soon → hasAccess true, period_end within 7 days
 *   just_ended  → hasAccess false, previously expired within last 7 days
 *
 * Dismissible per calendar day (IST).
 */
export function SubscriptionExpiryBanner({
  userId,
  currentPeriodEnd,
  isEndingSoon,
  hasJustEnded,
}: SubscriptionExpiryBannerProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'ending_soon' | 'just_ended' | null>(null);
  const [days, setDays] = useState(0);

  useEffect(() => {
    if (!userId || !currentPeriodEnd) return;
    if (!isEndingSoon && !hasJustEnded) return;

    const d = daysBetween(currentPeriodEnd);

    let nextMode: 'ending_soon' | 'just_ended' | null = null;

    if (isEndingSoon && d >= 0 && d <= DAYS_THRESHOLD) {
      nextMode = 'ending_soon';
    } else if (
      hasJustEnded &&
      d < 0 &&
      Math.abs(d) <= JUST_ENDED_WINDOW_DAYS
    ) {
      nextMode = 'just_ended';
    }

    if (!nextMode) return;

    const key = `leaniqa-expiry-banner-dismissed:${userId}:${getKolkataDateString()}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    setMode(nextMode);
    setDays(d);
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [userId, currentPeriodEnd, isEndingSoon, hasJustEnded]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    if (userId) {
      try {
        localStorage.setItem(
          `leaniqa-expiry-banner-dismissed:${userId}:${getKolkataDateString()}`,
          '1',
        );
      } catch {}
    }
  };

  if (!mode) return null;

  const isEnded = mode === 'just_ended';

  const headline = isEnded
    ? 'Your access has ended'
    : days <= 0
    ? 'Your access ends today'
    : days === 1
    ? 'Your access ends tomorrow'
    : `Your access ends in ${days} days`;

  const body = isEnded
    ? 'Renew to restore your history, weekly reports, and AI parses.'
    : 'Renew for the same plan, or switch to autopay and never lose access.';

  const accent = isEnded ? '#FF4D1C' : '#FFB347';
  const Icon = isEnded ? AlertCircle : Clock;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => navigate('/pricing')}
          className="w-full flex items-start gap-3 rounded-2xl border p-4 text-left active:scale-[0.99] transition-transform"
          style={{
            borderColor: `${accent}4D`,
            backgroundColor: `${accent}0F`,
          }}
          aria-label="Renew your subscription"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}26` }}
          >
            <Icon size={18} style={{ color: accent }} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white leading-tight">
              {headline}
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.6)] leading-snug mt-1">
              {body}
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