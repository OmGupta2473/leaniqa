import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function DashboardPreviewSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] border-t border-white/5 flex flex-col items-center overflow-hidden" style={{ perspective: 1000 }}>
      
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Everything at a glance.
        </h2>
        <p className="text-[rgba(235,235,245,0.6)] text-lg">
          A dashboard designed for clarity, action, and motivation.
        </p>
      </div>

      <motion.div 
        style={{ rotateX, scale, opacity }}
        className="w-full max-w-5xl mx-auto bg-[#1C1C1E] border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl flex flex-col gap-6"
      >
        {/* Mock Top Nav */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4FF00] text-black font-bold flex items-center justify-center">O</div>
            <div>
              <div className="text-white font-semibold">Today's Plan</div>
              <div className="text-xs text-[rgba(235,235,245,0.5)]">Thursday, Oct 12</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
            <span className="text-[#FF4D1C] font-bold">🔥 12</span>
            <span className="text-xs text-[rgba(235,235,245,0.6)] uppercase">Day Streak</span>
          </div>
        </div>

        {/* Main Dashboard UI Mock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calorie Ring Area */}
          <div className="lg:col-span-1 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <motion.circle 
                  initial={{ strokeDasharray: "0 1000" }}
                  whileInView={{ strokeDasharray: "400 1000" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="96" cy="96" r="80" fill="none" stroke="#D4FF00" strokeWidth="12" strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1,420</div>
                <div className="text-xs text-[rgba(235,235,245,0.5)] uppercase tracking-wide">Eaten / 2200</div>
              </div>
            </div>
            
            <div className="flex justify-between w-full mt-8">
              {['Protein', 'Fat', 'Carbs'].map((macro, i) => (
                <div key={macro} className="text-center">
                  <div className="text-[10px] uppercase text-[rgba(235,235,245,0.5)] mb-1">{macro}</div>
                  <div className="text-sm font-semibold text-white">{[80, 45, 120][i]}g</div>
                </div>
              ))}
            </div>
          </div>

          {/* Meals & Coach Area */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl p-6 flex-1">
              <div className="text-sm font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-wider mb-4">Meal Recommendations</div>
              <div className="space-y-3">
                {[
                  { name: "Option A", desc: "4 whole eggs + 1 cup milk", prot: "28g", cals: "350" },
                  { name: "Option B", desc: "150g chicken breast", prot: "33g", cals: "165" }
                ].map((opt, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    key={i} 
                    className="flex justify-between items-center bg-white/5 rounded-xl p-4 border border-white/5"
                  >
                    <div>
                      <div className="text-xs text-[#D4FF00] font-semibold mb-1">{opt.name}</div>
                      <div className="text-sm text-white font-medium">{opt.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{opt.prot}</div>
                      <div className="text-xs text-[rgba(235,235,245,0.5)]">{opt.cals} kcal</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Quick Action */}
            <button className="w-full bg-[#D4FF00] text-black font-bold py-4 rounded-full text-lg hover:bg-white transition-colors">
              Log Meal
            </button>
          </div>
        </div>

      </motion.div>
    </section>
  );
}
