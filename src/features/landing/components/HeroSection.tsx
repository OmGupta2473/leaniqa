import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[100svh] w-full flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background gradients and glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#D4FF00] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-[#378ADD] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.08]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0zOSAzOXYtMzhIMXYzOHoiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-center text-center mt-[-10vh]"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#D4FF00] animate-pulse" />
          <span className="text-[13px] font-medium tracking-wide text-[rgba(235,235,245,0.8)] uppercase">Introducing LeanIQA</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[100px] font-bold tracking-tighter leading-[1.05] text-white mb-8"
        >
          Your AI Body <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#D4FF00]/50">
            Transformation Coach
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="text-lg md:text-xl lg:text-2xl text-[rgba(235,235,245,0.6)] font-normal max-w-2xl mb-12"
        >
          Eat smarter. Stay consistent. Transform with confidence. 
          The only system that adapts to your life, not the other way around.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <button 
            onClick={() => navigate('/login')}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-[#D4FF00] text-black rounded-full font-semibold text-base w-full sm:w-auto overflow-hidden transition-transform hover:scale-[1.02] active:scale-95"
          >
            <span className="relative z-10">Start Your Journey</span>
            <ChevronRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
        </motion.div>
      </motion.div>

      {/* Floating UI Elements Parallax */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
        className="absolute inset-0 z-0 pointer-events-none hidden md:block"
      >
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] w-64 h-auto bg-[rgba(20,20,22,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 shadow-2xl transform -rotate-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00] text-xs font-bold">L</div>
            <div className="text-sm font-semibold text-white">Daily Streak</div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tighter mb-1">12<span className="text-sm text-[rgba(235,235,245,0.5)] font-normal ml-1">days</span></div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4FF00] w-[80%] rounded-full" />
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[30%] right-[10%] w-56 h-auto bg-[rgba(20,20,22,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 shadow-2xl transform rotate-3"
        >
          <div className="text-[11px] font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-wider mb-1">Dinner Logged</div>
          <div className="text-base font-semibold text-white mb-3">Grilled Chicken & Rice</div>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded bg-[#D4FF00]/10 text-[#D4FF00] text-[10px] font-bold">54g P</span>
            <span className="px-2 py-1 rounded bg-white/5 text-[rgba(235,235,245,0.8)] text-[10px] font-bold">450 kcal</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
