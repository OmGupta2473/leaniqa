import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Sparkles, Activity, Target } from 'lucide-react';

export function AICoachSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles size={14} />
              Meet Your AI Coach
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Intelligence that adapts to your life.
            </h2>
            <p className="text-lg text-[rgba(235,235,245,0.6)] mb-8 max-w-md">
              Forget rigid meal plans. LeanIQA learns your eating habits, suggests real-time adjustments, and recalculates your targets instantly if you go off track.
            </p>

            <div className="space-y-6">
              {[
                { icon: <Activity size={20} className="text-[#378ADD]" />, title: "Real-time Macro Parsing", desc: "Just type what you ate. The AI handles the exact calculations." },
                { icon: <Target size={20} className="text-[#FF4D1C]" />, title: "Adaptive Recovery", desc: "Overate at lunch? LeanIQA instantly adjusts your dinner targets." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-[rgba(235,235,245,0.5)] text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative h-[600px] w-full hidden lg:block">
          <motion.div style={{ y: y1 }} className="absolute right-10 top-20 w-72 bg-[#1C1C1E] border border-white/10 rounded-2xl p-5 shadow-2xl z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4FF00] to-green-400" />
              <div>
                <div className="text-xs text-[rgba(235,235,245,0.5)] font-medium">AI Insight</div>
                <div className="text-sm text-white font-semibold">Macro Adjusted</div>
              </div>
            </div>
            <p className="text-sm text-[rgba(235,235,245,0.8)] leading-relaxed">
              "You're 15g short on protein today. I suggest adding 2 boiled eggs to your dinner to hit your target easily."
            </p>
          </motion.div>

          <motion.div style={{ y: y2 }} className="absolute left-10 bottom-20 w-64 bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl z-10">
             <div className="text-xs font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-wider mb-2">Dinner Target</div>
             <div className="text-3xl font-bold text-white mb-1">420 <span className="text-sm font-normal text-[rgba(235,235,245,0.5)]">kcal</span></div>
             <div className="text-sm text-[#FF4D1C] font-medium">-120 kcal from lunch</div>
          </motion.div>
          
          {/* Abstract AI Orb */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <motion.div 
               animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 0] }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="w-64 h-64 rounded-full bg-gradient-to-tr from-[#378ADD]/20 to-[#D4FF00]/20 blur-3xl"
             />
          </div>
        </div>

      </div>
    </section>
  );
}
