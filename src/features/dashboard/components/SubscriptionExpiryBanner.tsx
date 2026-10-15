import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { getKolkataDateString } from '@/shared/utils/timezone';

interface SubscriptionExpiryBannerProps {
  userId: string | undefined;
  currentPeriodEnd: string | null;
  /** 'one_time' shows renewal copy; 'subscription' with status cancelled also shows. */
  isOneTime: boolean;
  isCancelledSub: boolean;
}

const DAYS_THRESHOLD = 7;

function daysUntil(iso: string): number {
  const now = Date.now();
  const target = new Date(iso).getTime();
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000));
}

/**
 * Dashboard banner that appears when paid access is ending soon.
 * Two triggers:
 *   - one_time access expiring within 7 days
 *   - cancelled subscription whose current_period_end is within 7 days
 *
 * Dismissible per calendar day (IST).
 */
export function SubscriptionExpiryBanner({
  userId,
  currentPeriodEnd,
  isOneTime,
  isCancelledSub,
}: SubscriptionExpiryBannerProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    if (!userId || !currentPeriodEnd) return;
    if (!isOneTime && !isCancelledSub) return;

    const d = daysUntil(currentPeriodEnd);
    if (d < 0 || d > DAYS_THRESHOLD) return;

    const key = `leaniqa-expiry-banner-dismissed:${userId}:${getKolkataDateString()}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    setDays(d);
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [userId, currentPeriodEnd, isOneTime, isCancelledSub]);

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

  const headline =
    days <= 0
      ? 'Your access ends today'
      : days === 1
      ? 'Your access ends tomorrow'
      : `Your access ends in ${days} days`;

  const body = isOneTime
    ? 'Renew for the same plan, or switch to autopay and never lose access.'
    : 'Your subscription is cancelled. Renew to keep your plan active.';

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
          className="w-full flex items-start gap-3 rounded-2xl border border-[#FFB347]/30 bg-[#FFB347]/[0.06] p-4 text-left active:scale-[0.99] transition-transform"
          aria-label="Renew your subscription"
        >
          <div className="w-9 h-9 rounded-full bg-[#FFB347]/15 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-[#FFB347]" strokeWidth={2.2} />
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