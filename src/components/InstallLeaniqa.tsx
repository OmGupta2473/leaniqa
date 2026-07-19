import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, CheckCircle2, Monitor, ArrowRight, Share, MoreVertical, Compass, Home, PlusSquare, Lock } from 'lucide-react';
import { usePwaInstall, Platform } from './usePwaInstall';

export function InstallLeaniqa() {
  const { deferredPrompt, isInstalled, platform } = usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'installing' | 'success'>('idle');

  if (isInstalled || platform === 'installed') {
    return (
      <div className="bg-white/10 text-zinc-300 w-full sm:w-auto px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide rounded-full border border-white/5 cursor-default">
        <CheckCircle2 className="w-4 h-4 text-[#D4FF00]" />
        Already Installed
      </div>
    );
  }

  const handleInstallClick = async () => {
    setIsOpen(true);
    setStep(1);
    
    if (deferredPrompt) {
      // Simulate beautiful install animation before showing prompt
      setStatus('installing');
      setTimeout(async () => {
        try {
          await deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;
          if (choiceResult.outcome === 'accepted') {
            setStatus('success');
            setTimeout(() => setIsOpen(false), 3000);
          } else {
            // Dismissed, show manual instructions based on platform
            setStatus('idle');
            setStep(1); // Proceed with manual flow
          }
        } catch (e) {
          setStatus('idle');
          setStep(1);
        }
      }, 1500);
    } else {
      // No prompt available, show manual instructions
      setStatus('idle');
    }
  };

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep(0);
      setStatus('idle');
    }, 300);
  };

  return (
    <>
      <motion.button
        onClick={handleInstallClick}
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.1)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="bg-zinc-900/80 text-white w-full sm:w-auto px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide rounded-full border border-zinc-800 shadow-xl backdrop-blur-md"
        style={{ willChange: "transform" }}
      >
        <Smartphone className="w-4 h-4 text-[#D4FF00]" />
        Install LeaniQA
      </motion.button>

      <AnimatePresence>
        {isOpen && createPortal(<InstallWizard platform={platform} step={step} setStep={setStep} status={status} close={close} />, document.body)}
      </AnimatePresence>
    </>
  );
}

function InstallWizard({ platform, step, setStep, status, close }: any) {
  // Wizard content based on platform
  let content = null;
  const maxSteps = platform === 'ios' ? 4 : (platform === 'android' ? 3 : 2);

  if (status === 'installing') {
    content = (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(212,255,0,0.2)]"
        >
          <Smartphone className="w-10 h-10 text-[#D4FF00]" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">Preparing Installation...</h3>
        <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#D4FF00]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
          />
        </div>
      </div>
    );
  } else if (status === 'success') {
    content = (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="w-24 h-24 bg-[#D4FF00]/10 border border-[#D4FF00]/30 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-[#D4FF00]" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">LeaniQA is Ready</h3>
        <p className="text-zinc-400 text-center mb-8">Installation complete. You can now use LeaniQA directly from your home screen.</p>
        <button onClick={close} className="bg-[#D4FF00] text-black px-8 py-3 rounded-full font-semibold">
          Continue
        </button>
      </div>
    );
  } else if (platform === 'ios') {
    content = <IOSInstructions step={step} setStep={setStep} />;
  } else if (platform === 'android') {
    content = <AndroidInstructions step={step} setStep={setStep} />;
  } else {
    content = <DesktopInstructions step={step} setStep={setStep} />;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />
      <motion.div 
        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 pb-2 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-[#D4FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white leading-tight">Install LeaniQA</h2>
              <p className="text-xs text-zinc-500">Premium App Experience</p>
            </div>
          </div>
          <button onClick={close} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 min-h-[300px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${status}-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </div>

        {status === 'idle' && (
          <div className="p-6 pt-4 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array.from({ length: maxSteps }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${i + 1 === step ? 'bg-[#D4FF00] shadow-[0_0_8px_#D4FF00] scale-125' : i + 1 < step ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
                  {i < maxSteps - 1 && <div className={`w-4 h-[1px] mx-1 ${i + 1 < step ? 'bg-zinc-600' : 'bg-zinc-800'}`} />}
                </div>
              ))}
            </div>
            
            {step < maxSteps ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={() => {
                  setStep(step + 1); // just to trigger success or finish
                  close();
                }}
                className="bg-[#D4FF00] text-black px-6 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,255,0,0.2)]"
              >
                Done
              </button>
            )}
          </div>
        )}
      </motion.div>
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
                 initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
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
        <p className="text-zinc-400 text-sm mb-8">Scroll down the menu and tap "Add to Home Screen".</p>
        
        <div className="flex-1 relative bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex items-end justify-center pb-4">
           <motion.div 
             initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }}
             className="w-64 bg-zinc-800/90 backdrop-blur-md rounded-2xl border border-zinc-700/50 shadow-2xl p-2 space-y-1"
           >
             <div className="p-3 bg-zinc-700/30 rounded-xl flex items-center justify-between">
                <span className="text-sm text-white">Copy Link</span>
             </div>
             <div className="p-3 bg-blue-500/10 rounded-xl flex items-center justify-between border border-blue-500/30 relative">
                <span className="text-sm text-blue-400 font-medium">Add to Home Screen</span>
                <PlusSquare className="w-5 h-5 text-blue-400" />
                <motion.div className="absolute inset-0 bg-blue-400/10 rounded-xl" animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
             </div>
           </motion.div>
        </div>
      </div>
    );
  } else if (step === 3) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">3. Confirm</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap "Add" in the top right corner.</p>
        
        <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col pt-4">
           <div className="bg-zinc-800 w-full p-4 rounded-xl shadow-lg border border-zinc-700/50 max-w-[280px] mx-auto">
             <div className="flex items-center justify-between mb-4">
               <span className="text-blue-500 text-sm">Cancel</span>
               <span className="text-white font-semibold text-sm">Add to Home Screen</span>
               <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-blue-500 text-sm font-bold bg-blue-500/10 px-2 py-1 rounded">Add</motion.span>
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
  } else {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <div className="w-20 h-20 bg-black border border-zinc-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative">
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
             className="w-12 h-12 bg-[#D4FF00] rounded-full blur-md opacity-30 absolute"
           />
           <Smartphone className="w-8 h-8 text-[#D4FF00] relative z-10" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Ready to Install</h3>
        <p className="text-zinc-400 text-sm mb-6">LeaniQA will appear on your home screen like a native app.</p>
      </div>
    );
  }
}

function AndroidInstructions({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">1. Open Menu</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap the three dots in Chrome's top right corner.</p>
        
        <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col pt-4">
           <div className="bg-zinc-800 h-14 w-full flex items-center justify-between px-4 border-b border-zinc-700/50 shadow-md">
             <div className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-4 py-1.5 flex-1 mx-4">
                <span className="text-xs text-zinc-400">leaniqa.com</span>
             </div>
             <div className="relative">
               <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                 <MoreVertical className="w-6 h-6 text-white" />
               </motion.div>
               <motion.div className="absolute -inset-2 border-2 border-white/20 rounded-full" animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} />
             </div>
           </div>
        </div>
      </div>
    );
  } else if (step === 2) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">2. Install App</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap "Install App" or "Add to Home Screen".</p>
        
        <div className="flex-1 relative bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex justify-end pr-4 pt-4">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top right' }} animate={{ opacity: 1, scale: 1 }}
             className="w-56 bg-zinc-800 border border-zinc-700/50 shadow-2xl rounded-xl py-2 z-10"
           >
             <div className="px-4 py-2 text-sm text-zinc-300">Settings</div>
             <div className="px-4 py-2 text-sm text-zinc-300">Translate...</div>
             <div className="px-4 py-2 bg-zinc-700/50 text-white font-medium flex items-center justify-between relative overflow-hidden">
                <span>Install App</span>
                <Download className="w-4 h-4" />
                <motion.div className="absolute inset-0 bg-white/5" animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
             </div>
             <div className="px-4 py-2 text-sm text-zinc-300">Desktop site</div>
           </motion.div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">3. Confirm</h3>
        <p className="text-zinc-400 text-sm mb-8">Tap "Install" on the popup that appears.</p>
        
        <div className="flex flex-col items-center justify-center flex-1">
          <motion.div 
             initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
             className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 shadow-2xl w-full max-w-[260px]"
          >
             <div className="flex items-center gap-4 mb-5">
               <div className="w-12 h-12 bg-black border border-zinc-700 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-[#D4FF00]" />
               </div>
               <div>
                 <div className="font-semibold text-white">Install LeaniQA?</div>
                 <div className="text-xs text-zinc-400">app.leaniqa.com</div>
               </div>
             </div>
             <div className="flex justify-end gap-4">
               <span className="text-sm font-medium text-zinc-400">Cancel</span>
               <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-sm font-bold text-[#D4FF00]">Install</motion.span>
             </div>
          </motion.div>
        </div>
      </div>
    );
  }
}

function DesktopInstructions({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">Install on Desktop</h3>
        <p className="text-zinc-400 text-sm mb-8">Click the install icon in your browser's address bar.</p>
        
        <div className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden p-6 flex flex-col">
           <div className="bg-zinc-800 rounded-lg p-2 flex items-center gap-3 border border-zinc-700">
             <div className="flex gap-1.5 ml-2">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
             </div>
             <div className="flex-1 bg-zinc-900 rounded flex items-center px-3 py-1.5 justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-2"><Lock className="w-3 h-3"/> leaniqa.com</span>
                <div className="relative">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Monitor className="w-4 h-4 text-[#D4FF00]" />
                  </motion.div>
                  <motion.div className="absolute -inset-2 border-2 border-[#D4FF00]/30 rounded-full" animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                </div>
             </div>
           </div>
           
           <div className="mt-8 flex justify-end pr-8">
             <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-[#D4FF00] flex flex-col items-center">
                <span className="text-xs font-mono mb-1">Click here</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
             </motion.div>
           </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold text-white mb-2">Confirm Installation</h3>
        <p className="text-zinc-400 text-sm mb-8">Click Install to use LeaniQA like a native app.</p>
        
        <div className="flex flex-col items-center justify-center flex-1">
          <motion.div 
             initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
             className="bg-zinc-800 p-5 rounded-lg border border-zinc-700 shadow-2xl w-full max-w-[280px]"
          >
             <div className="flex gap-4 mb-6">
                <div className="w-10 h-10 bg-black rounded flex items-center justify-center border border-zinc-700">
                   <Monitor className="w-5 h-5 text-[#D4FF00]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Install app?</div>
                  <div className="text-xs text-zinc-400">LeaniQA</div>
                </div>
             </div>
             <div className="flex justify-end gap-3">
               <span className="bg-zinc-700 text-white px-4 py-1.5 rounded text-xs font-medium">Cancel</span>
               <motion.span animate={{ backgroundColor: ["#D4FF00", "#bfe600", "#D4FF00"] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-[#D4FF00] text-black px-4 py-1.5 rounded text-xs font-semibold">Install</motion.span>
             </div>
          </motion.div>
        </div>
      </div>
    );
  }
}
