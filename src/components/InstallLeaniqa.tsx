import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share, MoreVertical, Smartphone } from 'lucide-react';

export function InstallLeaniqa() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="bg-zinc-900/80 text-white w-full sm:w-auto px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide rounded-full border border-zinc-800 shadow-xl backdrop-blur-md"
        style={{ willChange: 'transform' }}
      >
        <Smartphone className="w-4 h-4 text-[#D4FF00]" />
        Install LeaniQA
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[460px] rounded-t-[28px] sm:rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[#0F0F10]/95 shadow-[0_-8px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-6 sm:p-7 mx-0 sm:mx-4"
              >
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] flex items-center justify-center text-zinc-400"
                >
                  <X size={16} />
                </button>

                <div className="mb-6 pr-10">
                  <h2 className="text-[20px] font-semibold text-white tracking-tight">
                    Install LeaniQA
                  </h2>
                  <p className="text-[13px] text-zinc-500 mt-1">
                    Add it to your home screen — works offline, opens instantly.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* ANDROID */}
                  <div className="rounded-2xl border border-zinc-800/60 bg-[#141416] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D4FF00]/10 flex items-center justify-center">
                        <Smartphone size={16} className="text-[#D4FF00]" />
                      </div>
                      <span className="text-[14px] font-semibold text-white">Android</span>
                    </div>
                    <ol className="space-y-2 text-[12.5px] text-zinc-400 leading-relaxed">
                      <li className="flex gap-2">
                        <span className="text-zinc-600 font-mono">1.</span>
                        Open in Chrome
                      </li>
                      <li className="flex gap-2">
                        <span className="text-zinc-600 font-mono">2.</span>
                        <span>
                          Tap <MoreVertical size={12} className="inline text-zinc-300" /> menu
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-zinc-600 font-mono">3.</span>
                        Tap <span className="text-[#D4FF00] font-medium">Install app</span>
                      </li>
                    </ol>
                  </div>

                  {/* iOS */}
                  <div className="rounded-2xl border border-zinc-800/60 bg-[#141416] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#378ADD]/10 flex items-center justify-center">
                        <Share size={16} className="text-[#378ADD]" />
                      </div>
                      <span className="text-[14px] font-semibold text-white">iPhone / iPad</span>
                    </div>
                    <ol className="space-y-2 text-[12.5px] text-zinc-400 leading-relaxed">
                      <li className="flex gap-2">
                        <span className="text-zinc-600 font-mono">1.</span>
                        Open in Safari
                      </li>
                      <li className="flex gap-2">
                        <span className="text-zinc-600 font-mono">2.</span>
                        <span>
                          Tap <Share size={12} className="inline text-zinc-300" /> Share
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-zinc-600 font-mono">3.</span>
                        <span>
                          Tap <span className="text-[#378ADD] font-medium">Add to Home Screen</span>
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="mt-6 w-full rounded-xl border border-zinc-800 bg-transparent text-zinc-300 py-3 text-[14px] font-medium hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}