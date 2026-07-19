import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

new_demo = """function InteractiveMealDemo() {
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

  const btnRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x * 0.15);
    mouseY.set(y * 0.15);
  };

  const xSpring = useSpring(mouseX, { stiffness: 400, damping: 30 });
  const ySpring = useSpring(mouseY, { stiffness: 400, damping: 30 });

  return (
    <div className="w-full max-w-[480px] bg-[#0A0A0B] border border-zinc-800/50 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group/demo">
      {/* Background ambient glow */}
      <motion.div 
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[40%] -right-[40%] w-[80%] h-[80%] bg-[#D4FF00]/5 rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div 
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute -bottom-[40%] -left-[40%] w-[80%] h-[80%] bg-[#378ADD]/5 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <span className="text-[#D4FF00] text-sm font-semibold tracking-wider uppercase drop-shadow-[0_0_8px_rgba(212,255,0,0.3)]">Try it yourself</span>
        <motion.span 
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-lg"
        >👇</motion.span>
      </div>
      <p className="text-zinc-400 text-sm mb-6 relative z-10">Click Log This Meal to see how LeanIQA instantly analyzes real food.</p>
      
      {/* Input Field */}
      <motion.div 
        animate={state !== 'idle' ? { opacity: 0.5, scale: 0.98, filter: 'blur(2px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-[#111112]/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between mb-6 relative z-10 shadow-inner group/input cursor-text transition-all duration-300 hover:border-zinc-700 hover:bg-[#111112] hover:shadow-[0_4px_20px_-10px_rgba(255,255,255,0.05)]"
      >
        <span className="text-zinc-200 text-[15px] selection:bg-[#D4FF00]/30 transition-colors duration-300">3 eggs curry, 80g boiled cooked rice</span>
        <X className="w-4 h-4 text-zinc-500 cursor-pointer transition-colors duration-300 group-hover/input:text-zinc-300" />
      </motion.div>

      {/* Primary CTA */}
      <div className="relative z-10" style={{ perspective: 1000 }}>
        <motion.button
          ref={btnRef}
          layout
          onClick={handleLog}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            mouseX.set(0);
            mouseY.set(0);
          }}
          whileTap={state === 'idle' ? { scale: 0.98 } : {}}
          style={{
            x: state === 'idle' && isHovered ? xSpring : 0,
            y: state === 'idle' && isHovered ? ySpring : 0,
            boxShadow: state === 'idle' 
              ? (isHovered ? '0 12px 40px -10px rgba(212,255,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 4px 20px -10px rgba(212,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)')
              : 'none'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          className={`w-full overflow-hidden flex items-center justify-center gap-2 uppercase tracking-wider relative transition-colors duration-300 border border-transparent ${
            state === 'idle' 
              ? 'bg-[#D4FF00] text-black py-4 rounded-2xl font-bold text-base cursor-pointer'
              : state === 'loading'
                ? 'bg-[#18181A] border-zinc-800 text-zinc-400 py-3 rounded-2xl cursor-default scale-95'
                : 'bg-transparent py-0 h-0 opacity-0 pointer-events-none'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {state === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span>🍽️</span> LOG THIS MEAL
              </motion.div>
            )}
            {state === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full relative h-1.5 bg-zinc-800 rounded-full overflow-hidden mx-4"
              >
                <motion.div
                  className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-[#D4FF00] to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ripple Effect (fake pseudo) */}
          {state === 'loading' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
            />
          )}
        </motion.button>
      </div>

      {/* Success View */}
      <AnimatePresence>
        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' }}
            transition={{ type: "spring", stiffness: 250, damping: 25, mass: 0.8 }}
            className="mt-4 relative z-10"
          >
            <div className="bg-[#18181A]/90 backdrop-blur-xl border border-zinc-800/80 rounded-[24px] p-5 relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group/card transition-colors duration-500 hover:border-zinc-700/80">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
                      className="absolute inset-0 bg-green-500/20 rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 relative z-10 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </motion.div>
                  </div>
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="text-zinc-200 text-sm font-medium"
                  >
                    Meal Logged Successfully
                  </motion.span>
                </div>
                <AnimatePresence>
                  {showReplay && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="flex items-center gap-1.5 text-[#D4FF00] hover:text-[#e2ff33] transition-colors text-xs font-semibold uppercase tracking-wider bg-[#D4FF00]/10 px-3 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 hover:shadow-[0_0_12px_rgba(212,255,0,0.2)]"
                    >
                      <motion.span 
                        animate={{ rotate: -360 }} 
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >↻</motion.span> Try Again
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-zinc-100 font-medium text-[15px] mb-5 border-b border-zinc-800/50 pb-4"
              >
                3 eggs curry, 80g boiled cooked rice
              </motion.div>

              {/* Nutrition Chips */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { label: "Calories", val: cal, unit: "kcal", icon: Flame, color: "#FF4D1C", delay: 0.12 },
                  { label: "Protein", val: pro, unit: "g", icon: Dumbbell, color: "#D4FF00", delay: 0.20 },
                  { label: "Fat", val: fat, unit: "g", icon: Droplets, color: "#FFC107", delay: 0.28 },
                  { label: "Carbs", val: carbs, unit: "g", icon: () => <div className="w-3.5 h-3.5 flex items-center justify-center font-serif text-[10px] font-bold">🌾</div>, color: "#378ADD", delay: 0.36 }
                ].map((chip, i) => (
                  <motion.div 
                    key={chip.label}
                    initial={{ opacity: 0, scale: 0.85, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    transition={{ type: "spring", stiffness: 350, damping: 25, delay: chip.delay }} 
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-[#212124]/80 rounded-xl p-3 flex flex-col justify-between h-[84px] border border-white/5 relative overflow-hidden group/chip cursor-default transition-all duration-300 hover:bg-[#252528] hover:shadow-[0_4px_20px_-10px_rgba(255,255,255,0.05)]"
                  >
                    <div className="flex items-center gap-1.5 text-zinc-400 group-hover/chip:text-zinc-300 transition-colors">
                      <chip.icon className="w-3.5 h-3.5" style={{ color: chip.color }} />
                      <span className="text-[11px] font-medium">{chip.label}</span>
                    </div>
                    <div className="text-center relative z-10">
                      <motion.div 
                        initial={{ opacity: 0, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.4, delay: chip.delay + 0.1 }}
                        className="text-white font-bold text-xl leading-none drop-shadow-md"
                      >
                        {chip.val}
                        <span className="text-[12px] text-zinc-400 font-medium ml-0.5">{chip.unit}</span>
                      </motion.div>
                    </div>
                    <div 
                      className="absolute bottom-0 left-0 h-1 rounded-r-full transition-all duration-500 opacity-80 group-hover/chip:opacity-100 group-hover/chip:h-1.5" 
                      style={{ backgroundColor: chip.color, width: chip.label === "Calories" ? '60%' : chip.label === "Protein" ? '70%' : chip.label === "Fat" ? '45%' : '50%', boxShadow: `0 -2px 10px ${chip.color}40` }} 
                    />
                    <div 
                      className="absolute inset-0 opacity-0 group-hover/chip:opacity-10 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at 50% -20%, ${chip.color}, transparent 70%)` }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* AI Insight */}
              <motion.div
                initial={{ opacity: 0, height: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                transition={{ type: "spring", stiffness: 200, damping: 30, delay: 0.6 }}
                className="overflow-hidden"
              >
                <motion.div 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 30, delay: 0.6 }}
                  className="bg-[#212124]/50 rounded-xl p-4 border border-[#378ADD]/20 relative group/insight hover:bg-[#212124]/80 hover:border-[#378ADD]/40 transition-colors duration-500"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#378ADD] shadow-[0_0_12px_rgba(55,138,221,0.5)]"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 15, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="w-4 h-4 text-[#D4FF00] drop-shadow-[0_0_8px_rgba(212,255,0,0.5)]" />
                    </motion.div>
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                      className="text-zinc-200 font-medium text-sm"
                    >
                      Gemini AI Insight
                    </motion.span>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="text-zinc-400 text-[13px] leading-relaxed italic"
                  >
                    <motion.span
                      initial={{ opacity: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="block text-zinc-300 mb-1"
                    >
                      Great choice! This meal provides excellent lean protein from eggs, perfectly balanced with energy-sustaining carbs from the rice.
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.5, delay: 1.3 }}
                      className="block"
                    >
                      To hit your remaining <span className="text-[#D4FF00] font-semibold not-italic drop-shadow-[0_0_4px_rgba(212,255,0,0.3)]">108g protein</span> target today, consider adding grilled chicken breast or a protein shake to your next meal.
                    </motion.span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}"""

pattern = re.compile(r'function InteractiveMealDemo\(\) \{.*?\/\* End InteractiveMealDemo \*\//', re.DOTALL)
if '/* End InteractiveMealDemo */' in content:
    content = re.sub(r'function InteractiveMealDemo\(\) \{.*?\/\* End InteractiveMealDemo \*/', new_demo + '\n/* End InteractiveMealDemo */', content, flags=re.DOTALL)
else:
    # Try simple split
    parts = content.split('function InteractiveMealDemo() {')
    before = parts[0]
    after = 'export function LandingPage' + parts[1].split('export function LandingPage')[1]
    content = before + new_demo + '\n' + after

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Updated script")
