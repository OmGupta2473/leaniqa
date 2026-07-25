import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Insert InteractiveMealDemo above LandingPage function
interactive_demo_code = """
function useDemoNumber(target: number, duration = 1000, trigger = false, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, trigger, decimals]);
  return value;
}

function InteractiveMealDemo() {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showReplay, setShowReplay] = useState(false);

  const cal = useDemoNumber(425, 1200, state === 'success', 0);
  const pro = useDemoNumber(22.7, 1200, state === 'success', 1);
  const fat = useDemoNumber(24.2, 1200, state === 'success', 1);
  const carbs = useDemoNumber(30.2, 1200, state === 'success', 1);

  const handleLog = () => {
    if (state !== 'idle') return;
    setState('loading');
    setTimeout(() => {
      setState('success');
      setTimeout(() => setShowReplay(true), 5000);
    }, 800);
  };

  const handleReset = () => {
    setState('idle');
    setShowReplay(false);
  };

  return (
    <div className="w-full max-w-[480px] bg-[#0A0A0B] border border-zinc-800/50 rounded-[32px] p-6 shadow-2xl relative">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#D4FF00] text-sm font-semibold tracking-wider uppercase">Try it yourself</span>
        <span className="text-lg">👇</span>
      </div>
      <p className="text-zinc-400 text-sm mb-6">Click Log This Meal to see how LeanIQA instantly analyzes real food.</p>
      
      {/* Input Field */}
      <div className="bg-[#111112] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between mb-6">
        <span className="text-zinc-200 text-[15px]">3 eggs curry, 80g boiled cooked rice</span>
        <X className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
      </div>

      {/* Primary CTA */}
      <motion.button
        onClick={handleLog}
        whileHover={state === 'idle' ? { scale: 1.02, backgroundColor: "#e2ff33" } : {}}
        whileTap={state === 'idle' ? { scale: 0.98 } : {}}
        className="w-full bg-[#D4FF00] text-black py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 uppercase tracking-wider relative overflow-hidden transition-shadow"
        style={{
          boxShadow: state === 'idle' ? '0 0 40px -10px rgba(212,255,0,0.4)' : 'none'
        }}
      >
        {state === 'loading' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>🍽️</span> LOG THIS MEAL
          </>
        )}
      </motion.button>

      {/* Success View */}
      <AnimatePresence>
        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="bg-[#18181A] border border-zinc-800/60 rounded-2xl p-5 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-300 text-sm font-medium">Meal Logged Successfully</span>
                </div>
                <AnimatePresence>
                  {showReplay && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleReset}
                      className="flex items-center gap-1.5 text-[#D4FF00] hover:text-white transition-colors text-xs font-medium"
                    >
                      <span>↻</span> Try Again
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-zinc-100 font-medium text-[15px] mb-5">
                3 eggs curry, 80g boiled cooked rice
              </div>

              {/* Nutrition Chips */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#212124] rounded-xl p-3 flex flex-col justify-between h-[84px] border border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Flame className="w-3.5 h-3.5 text-[#FF4D1C]" />
                    <span className="text-[11px] font-medium">Calories</span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl leading-none">{cal}</div>
                    <div className="text-[10px] text-zinc-500 font-medium mt-1">kcal</div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-[#FF4D1C] w-[60%] rounded-r-full"></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-[#212124] rounded-xl p-3 flex flex-col justify-between h-[84px] border border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Dumbbell className="w-3.5 h-3.5 text-[#D4FF00]" />
                    <span className="text-[11px] font-medium">Protein</span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl leading-none">{pro}<span className="text-[12px] text-zinc-400 font-medium">g</span></div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-[#D4FF00] w-[70%] rounded-r-full"></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-[#212124] rounded-xl p-3 flex flex-col justify-between h-[84px] border border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Droplets className="w-3.5 h-3.5 text-[#FFC107]" />
                    <span className="text-[11px] font-medium">Fat</span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl leading-none">{fat}<span className="text-[12px] text-zinc-400 font-medium">g</span></div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-[#FFC107] w-[45%] rounded-r-full"></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-[#212124] rounded-xl p-3 flex flex-col justify-between h-[84px] border border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <div className="w-3.5 h-3.5 text-[#378ADD] flex items-center justify-center font-serif text-[10px] font-bold">🌾</div>
                    <span className="text-[11px] font-medium">Carbs</span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl leading-none">{carbs}<span className="text-[12px] text-zinc-400 font-medium">g</span></div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-[#378ADD] w-[50%] rounded-r-full"></div>
                </motion.div>
              </div>

              {/* AI Insight */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="bg-[#212124] rounded-xl p-4 border border-[#378ADD]/20 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#378ADD]"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#D4FF00]" />
                  <span className="text-zinc-200 font-medium text-sm">Gemini AI Insight</span>
                </div>
                <p className="text-zinc-400 text-[13px] leading-relaxed italic">
                  Great choice for lunch! This meal provides a good start to your protein intake. To hit your remaining 108g protein target for maintenance today, consider adding some lean protein sources to your next meal like grilled chicken breast, paneer, or a protein shake. You still have plenty of calories left to work with.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

content = content.replace("export function LandingPage() {", interactive_demo_code + "\nexport function LandingPage() {")

# 2. Update the Hero section structure
old_hero = """      {/* ── Hero ── */}
      <section className="pt-12 sm:pt-16 lg:pt-16 pb-16 sm:pb-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl relative z-10">
            <motion.h1"""

new_hero = """      {/* ── Hero ── */}
      <section className="pt-12 sm:pt-16 lg:pt-16 pb-16 sm:pb-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="max-w-2xl relative z-10 flex-1">
            <motion.h1"""

content = content.replace(old_hero, new_hero)

old_cta = """              </motion.button>
            </motion.div>
          </div>
        </div>
        
        {/* Ambient Glows */}"""

new_cta = """              </motion.button>
            </motion.div>
          </div>
          
          <div className="flex-1 w-full relative z-10 flex justify-center lg:justify-end">
            <InteractiveMealDemo />
          </div>
        </div>
        
        {/* Ambient Glows */}"""

content = content.replace(old_cta, new_cta)

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Updated LandingPage with InteractiveMealDemo")
