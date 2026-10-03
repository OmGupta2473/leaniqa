import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Compass,
  PlusSquare,
  ArrowRight,
  ArrowLeft,
  Share,
  MoreVertical,
} from 'lucide-react';

/**
 * Platform-scoped install wizard. No device detection anywhere: the user picks
 * their own device on the picker screen, so there is nothing to sniff on mount
 * and no wrong-platform mismatch.
 *
 *   platform === null      -> picker (Android / iPhone / iPad cards)
 *   platform === 'android' -> step 0, 1, 2 (Android instructions)
 *   platform === 'ios'     -> step 0, 1, 2 (iOS instructions)
 *   step === 3             -> shared outro
 */
const WIZARD_LENGTH = 4;

export function InstallLeaniqa() {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep(0);
      setPlatform(null);
    }, 300);
  };

  const next = () => setStep((s) => Math.min(s + 1, WIZARD_LENGTH - 1));

  // Back on the first instruction step returns to the picker rather than
  // stepping further back. On the outro the arrow is hidden entirely.
  const prev = () => {
    if (step === 0) {
      setPlatform(null);
      return;
    }
    setStep((s) => s - 1);
  };

  const pick = (p: 'android' | 'ios') => {
    setPlatform(p);
    setStep(0);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
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
          {isOpen && (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={close}
              />
              <motion.div
                initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh]"
              >
                <div className="p-6 pb-2 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {platform !== null && step < WIZARD_LENGTH - 1 ? (
                      <button
                        onClick={prev}
                        aria-label="Previous step"
                        className="p-2 -ml-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors mr-1"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                        <Download className="w-5 h-5 text-[#D4FF00]" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-white leading-tight">Install LeaniQA</h2>
                      <p className="text-xs text-zinc-500">
                        {platform === 'android' ? 'On Android' : platform === 'ios' ? 'On iPhone' : 'Choose your device'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 flex-1 min-h-0 overflow-y-auto flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${platform}-${step}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1"
                    >
                      {platform === null && <PickerScreen onPick={pick} />}
                      {platform === 'android' && step < WIZARD_LENGTH - 1 && (
                        <AndroidInstructions step={step + 1} />
                      )}
                      {platform === 'ios' && step < WIZARD_LENGTH - 1 && (
                        <IOSInstructions step={step + 1} />
                      )}
                      {platform !== null && step === WIZARD_LENGTH - 1 && (
                        <OutroScreen onDone={close} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dot progress + Next/Done only exist once a platform is chosen — on the
                    picker the two platform cards are the CTA. */}
                {platform !== null && (
                  <div className="p-6 pt-4 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: WIZARD_LENGTH }).map((_, i) => (
                      <div key={i} className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            i === step ? 'bg-[#D4FF00] shadow-[0_0_8px_#D4FF00] scale-125'
                              : i < step ? 'bg-zinc-600' : 'bg-zinc-800'
                          }`}
                        />
                        {i < WIZARD_LENGTH - 1 && (
                          <div className={`w-4 h-[1px] mx-1 ${i < step ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {step < WIZARD_LENGTH - 1 ? (
                    <button
                      onClick={next}
                      className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={close}
                      className="bg-[#D4FF00] text-black px-6 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,255,0,0.2)]"
                    >
                      Done
                    </button>
                      )}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function PickerScreen({
  onPick,
}: {
  onPick: (p: 'android' | 'ios') => void;
}) {
  return (
    <div className="flex flex-col h-full justify-center py-4">
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-16 h-16 bg-black border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-2xl relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.15 }}
            className="w-10 h-10 bg-[#D4FF00] rounded-full blur-md opacity-30 absolute"
          />
          <Smartphone className="w-7 h-7 text-[#D4FF00] relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1.5">Add LeanIQA to your home screen</h3>
        <p className="text-zinc-400 text-sm max-w-[280px]">
          Works offline and opens instantly. Choose your device to see the steps.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <motion.button
          onClick={() => onPick('android')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="bg-zinc-900/50 border border-zinc-800 hover:border-[#D4FF00]/50 rounded-2xl p-5 flex flex-col items-center gap-2.5 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-[#D4FF00]" />
          </div>
          <span className="text-white font-medium text-sm">Android</span>
          <span className="text-[11px] text-zinc-500">Chrome browser</span>
        </motion.button>

        <motion.button
          onClick={() => onPick('ios')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="bg-zinc-900/50 border border-zinc-800 hover:border-[#378ADD]/50 rounded-2xl p-5 flex flex-col items-center gap-2.5 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-[#378ADD]/10 flex items-center justify-center">
            <Share className="w-5 h-5 text-[#378ADD]" />
          </div>
          <span className="text-white font-medium text-sm">iPhone / iPad</span>
          <span className="text-[11px] text-zinc-500">Safari browser</span>
        </motion.button>
      </div>
    </div>
  );
}

function OutroScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring' }}
        className="w-24 h-24 bg-[#D4FF00]/10 border border-[#D4FF00]/30 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-12 h-12 text-[#D4FF00]" />
      </motion.div>
      <h3 className="text-2xl font-bold text-white mb-2">You&apos;re set</h3>
      <p className="text-zinc-400 text-center mb-8 max-w-[280px]">
        LeanIQA is on your home screen. Open it any time — no browser, no loading.
      </p>
      <button
        onClick={onDone}
        className="bg-[#D4FF00] text-black px-8 py-3 rounded-full font-semibold"
      >
        Continue
      </button>
    </div>
  );
}

function IOSInstructions({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">1. Open Safari Menu</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap the Share icon at the bottom of Safari.</p>

        <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col justify-end">
          <div className="bg-zinc-800 h-16 w-full flex items-center justify-between px-6 border-t border-zinc-700/50">
            <Compass className="w-6 h-6 text-blue-500" />
            <div className="relative">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Share className="w-6 h-6 text-blue-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -inset-3 border-2 border-blue-500/50 rounded-full"
              />
            </div>
            <MoreVertical className="w-6 h-6 text-zinc-500" />
          </div>
        </div>
      </div>
    );
  } else if (step === 2) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">2. Add to Home Screen</h3>
        <p className="text-zinc-400 text-sm mb-8">Scroll down the menu and tap &quot;Add to Home Screen&quot;.</p>

        <div className="flex-1 relative bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex items-end justify-center pb-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="w-64 bg-zinc-800/90 backdrop-blur-md rounded-2xl border border-zinc-700/50 shadow-2xl p-2 space-y-1"
          >
            <div className="p-3 bg-zinc-700/30 rounded-xl flex items-center justify-between">
              <span className="text-sm text-white">Copy Link</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl flex items-center justify-between border border-blue-500/30 relative">
              <span className="text-sm text-blue-400 font-medium">Add to Home Screen</span>
              <PlusSquare className="w-5 h-5 text-blue-400" />
              <motion.div
                className="absolute inset-0 bg-blue-400/10 rounded-xl"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-semibold text-white mb-2">3. Confirm</h3>
      <p className="text-zinc-400 text-sm mb-8">Tap &quot;Add&quot; in the top right corner.</p>

      <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col pt-4">
        <div className="bg-zinc-800 w-full p-4 rounded-xl shadow-lg border border-zinc-700/50 max-w-[280px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-500 text-sm">Cancel</span>
            <span className="text-white font-semibold text-sm">Add to Home Screen</span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-blue-500 text-sm font-bold bg-blue-500/10 px-2 py-1 rounded"
            >
              Add
            </motion.span>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-lg border border-white/5">
            <div className="w-12 h-12 bg-black border border-zinc-700 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#D4FF00] blur-[2px]" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">LeaniQA</div>
              <div className="text-[10px] text-zinc-500">https://leaniqa.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AndroidInstructions({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">1. Open Menu</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap the three dots in Chrome&apos;s top right corner.</p>

        <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col pt-4">
          <div className="bg-zinc-800 h-14 w-full flex items-center justify-between px-4 border-b border-zinc-700/50 shadow-md">
            <div className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-4 py-1.5 flex-1 mx-4">
              <span className="text-xs text-zinc-400">leaniqa.com</span>
            </div>
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <MoreVertical className="w-6 h-6 text-white" />
              </motion.div>
              <motion.div
                className="absolute -inset-2 border-2 border-white/20 rounded-full"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } else if (step === 2) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">2. Install App</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap &quot;Install App&quot; or &quot;Add to Home Screen&quot;.</p>

        <div className="flex-1 relative bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex justify-end pr-4 pt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top right' }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-56 bg-zinc-800 border border-zinc-700/50 shadow-2xl rounded-xl py-2 z-10"
          >
            <div className="px-4 py-2 text-sm text-zinc-300">Settings</div>
            <div className="px-4 py-2 text-sm text-zinc-300">Translate...</div>
            <div className="px-4 py-2 bg-zinc-700/50 text-white font-medium flex items-center justify-between relative overflow-hidden">
              <span>Install App</span>
              <Download className="w-4 h-4" />
              <motion.div
                className="absolute inset-0 bg-white/5"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <div className="px-4 py-2 text-sm text-zinc-300">Desktop site</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-semibold text-white mb-2">3. Confirm</h3>
      <p className="text-zinc-400 text-sm mb-8">Tap &quot;Install&quot; on the popup that appears.</p>

      <div className="flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 shadow-2xl w-full max-w-[260px]"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-black border border-zinc-700 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-[#D4FF00]" />
            </div>
            <div>
              <div className="font-semibold text-white">Install LeanIQA?</div>
              <div className="text-xs text-zinc-400">app.leaniqa.com</div>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <span className="text-sm font-medium text-zinc-400">Cancel</span>
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sm font-bold text-[#D4FF00]"
            >
              Install
            </motion.span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}