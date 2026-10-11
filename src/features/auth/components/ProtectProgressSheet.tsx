import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '@/shared/components/Toast';

const DISMISS_KEY = 'leaniqa-protect-progress-dismissed-until';
const DISMISS_WINDOW_MS = 24 * 60 * 60 * 1000;
const MEAL_THRESHOLD = 3;

export function shouldShowProtectProgress(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    return !Number.isFinite(until) || until < Date.now();
  } catch {
    return true;
  }
}

export const PROTECT_PROGRESS_MEAL_THRESHOLD = MEAL_THRESHOLD;

interface ProtectProgressSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProtectProgressSheet({ isOpen, onClose }: ProtectProgressSheetProps) {
  const [linking, setLinking] = useState(false);
  const { toast } = useToast();

  const handleLink = useCallback(async () => {
    if (linking) return;
    setLinking(true);
    const redirectTo = `${window.location.origin}/profile`;
    const { url, error } = await authService.linkGoogleIdentity(redirectTo);
    if (error) {
      setLinking(false);
      toast({ type: 'error', message: `Could not link Google: ${error}` });
      return;
    }
    if (url) {
      window.location.href = url;
      return;
    }
    setLinking(false);
    toast({ type: 'error', message: 'Could not start Google linking.' });
  }, [linking, toast]);

  const handleNotNow = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_WINDOW_MS));
    } catch {}
    onClose();
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="protect-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={handleNotNow}
        >
          <motion.div
            key="protect-panel"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-[420px] flex-col rounded-t-[28px] sm:rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[#0F0F10]/95 p-6 backdrop-blur-2xl shadow-[0_-8px_60px_rgba(0,0,0,0.6)]"
            role="dialog"
            aria-modal="true"
            aria-label="Protect your progress"
          >
            <button
              type="button"
              onClick={handleNotNow}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.35), rgba(212,255,0,0.10))',
              }}
            >
              <span className="text-[26px]">🔒</span>
            </div>

            <h2 className="text-[22px] font-semibold text-white tracking-tight mb-2">
              Keep your progress safe
            </h2>

            <p className="text-[14px] text-[rgba(255,255,255,0.65)] leading-relaxed mb-6">
              You can use LeanIQA as a guest, but guest progress stays only on this
              device. Link Google to back up your meals, goals, and streak.
            </p>

            <button
              type="button"
              onClick={handleLink}
              disabled={linking}
              className="w-full py-3.5 rounded-2xl bg-[#D4FF00] text-black font-semibold text-[15px] transition-opacity disabled:opacity-50 mb-2"
            >
              {linking ? 'Opening Google…' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={handleNotNow}
              className="w-full py-3 text-center text-[13px] text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
            >
              Not now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}