import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# Replace step state
content = content.replace(
    'const [step, setStep] = useState(0);',
    'const [step, setStepState] = useState(0);\n  const [direction, setDirection] = useState(1);\n  const setStep = (newStep: number) => {\n    setDirection(newStep > step ? 1 : -1);\n    setStepState(newStep);\n  };'
)

# Add BeforeUnload and Keydown useEffects right after setStep
effect_str = """
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 0 && step < 8 && !editProfileMode) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, editProfileMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step > 0 && step < 7) {
        setStep(step - 1);
      } else if (e.key === 'ArrowLeft' && e.altKey && step > 0 && step < 7) {
        e.preventDefault();
        setStep(step - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);
"""
content = content.replace('const [aiStatus, setAiStatus] = useState(0);', effect_str + '\n  const [aiStatus, setAiStatus] = useState(0);')

# Replace stepVariants
old_variants = """  const stepVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as any, stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } }
  };"""

new_variants = """  const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  const stepVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      y: prefersReducedMotion ? 0 : (dir > 0 ? 20 : -20),
      scale: prefersReducedMotion ? 1 : 0.98
    }),
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as any, stiffness: 300, damping: 25 } },
    exit: (dir: number) => ({
      opacity: 0,
      y: prefersReducedMotion ? 0 : (dir > 0 ? -20 : 20),
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: { duration: 0.2 }
    })
  };"""
content = content.replace(old_variants, new_variants)

# Update AnimatePresence
content = content.replace('<AnimatePresence mode="wait">', '<AnimatePresence mode="wait" custom={direction}>')

# Add custom={direction} to all step variants
content = re.sub(
    r'(<motion\.div key="[^"]+" variants=\{stepVariants\})',
    r'\1 custom={direction}',
    content
)

# Update Progress Indicator to show back button on step 8 too, but progress dots only on step < 7
old_progress = """      {step > 0 && step < 7 && (
        <div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">
           <button 
             onClick={() => setStep(step - 1)}
             className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
           >
             <ChevronLeft size={28} />
           </button>
           {[1,2,3,4,5,6].map(s => (
             <motion.div 
               key={s}
               className={cn("h-1 rounded-full", step >= s ? "bg-[#D4FF00]" : "bg-zinc-800")}
               animate={{ width: step === s ? 40 : 8 }}
               transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
             />
           ))}
        </div>
      )}"""

new_progress = """      {step > 0 && step !== 7 && (
        <div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">
           <button 
             onClick={() => setStep(step === 8 ? 6 : step - 1)}
             className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-2"
             aria-label="Go Back"
           >
             <ChevronLeft size={28} />
           </button>
           {step < 7 && [1,2,3,4,5,6].map(s => (
             <motion.div 
               key={s}
               className={cn("h-1 rounded-full", step >= s ? "bg-[#D4FF00]" : "bg-zinc-800")}
               animate={{ width: step === s ? 40 : 8 }}
               transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
             />
           ))}
        </div>
      )}"""
content = content.replace(old_progress, new_progress)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)

