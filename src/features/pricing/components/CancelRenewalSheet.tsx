import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface CancelRenewalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriodEnd: string | null;
  onConfirm: () => Promise<void>;
}

export function CancelRenewalSheet({
  isOpen,
  onClose,
  currentPeriodEnd,
  onConfirm,
}: CancelRenewalSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const formattedEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={submitting ? undefined : onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-[420px] flex-col rounded-t-[28px] sm:rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[#0F0F10]/95 p-6 backdrop-blur-2xl shadow-[0_-8px_60px_rgba(0,0,0,0.6)]"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-white transition-colors disabled:opacity-40"
            >
              <X size={16} />
            </button>

            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(255,179,71,0.30), rgba(255,179,71,0.06))',
                border: '1px solid rgba(255,179,71,0.35)',
              }}
            >
              <AlertTriangle size={24} className="text-[#FFB347]" />
            </div>

            <h2 className="text-[20px] font-semibold text-white tracking-tight mb-2">
              Cancel auto-renewal?
            </h2>

            <p className="text-[14px] text-[rgba(255,255,255,0.65)] leading-relaxed mb-6">
              {formattedEnd ? (
                <>
                  You&apos;ll keep full access until{' '}
                  <span className="text-white font-medium">{formattedEnd}</span>.
                  After that, your account will move to the free plan. You will not
                  be charged again.
                </>
              ) : (
                <>
                  You&apos;ll keep full access until the end of your current billing
                  period. You will not be charged again.
                </>
              )}
            </p>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#FFB347] text-black font-semibold text-[15px] transition-opacity disabled:opacity-50 mb-2"
            >
              {submitting ? 'Cancelling…' : 'Cancel auto-renewal'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full py-3 text-center text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors disabled:opacity-40"
            >
              Keep my subscription
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}