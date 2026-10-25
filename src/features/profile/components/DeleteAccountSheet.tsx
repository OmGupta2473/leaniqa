import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteAccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRequested: () => Promise<void>;
}

export function DeleteAccountSheet({
  isOpen,
  onClose,
  onRequested,
}: DeleteAccountSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onRequested();
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
                  'radial-gradient(circle at 30% 30%, rgba(255,92,77,0.30), rgba(255,92,77,0.06))',
                border: '1px solid rgba(255,92,77,0.35)',
              }}
            >
              <AlertTriangle size={24} className="text-[#FF5C4D]" />
            </div>

            <h2 className="text-[20px] font-semibold text-white tracking-tight mb-2">
              Delete your account?
            </h2>

            <p className="text-[14px] text-[rgba(255,255,255,0.65)] leading-relaxed mb-6">
              This will permanently delete your account, your meal history, your
              streaks, and your awards. You have 24 hours to change your mind. After
              that, the deletion cannot be undone.
            </p>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#FF5C4D] text-white font-semibold text-[15px] transition-opacity disabled:opacity-50 mb-2"
            >
              {submitting ? 'Sending request…' : 'Request account deletion'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full py-3 text-center text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors disabled:opacity-40"
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