import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Utensils, CheckCircle2 } from 'lucide-react';

export function MealIntelligenceSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] overflow-hidden flex flex-col items-center">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-16">
        
        <div className="w-full md:w-1/2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#378ADD]/10 border border-[#378ADD]/20 text-[#378ADD] text-xs font-semibold uppercase tracking-wider mb-6">
            <Utensils size={14} />
            Meal Intelligence
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Just type. We do the math.
          </h2>
          <p className="text-lg text-[rgba(235,235,245,0.6)] mb-8">
            Stop searching databases and guessing portion sizes. LeanIQA uses advanced AI to instantly parse natural language into precise macronutrients.
          </p>
        </div>

        <div className="w-full md:w-1/2 relative">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="bg-[#1C1C1E] border border-white/10 rounded-xl p-4 mb-6">
              <div className="text-sm text-[rgba(235,235,245,0.5)] mb-2">What did you eat?</div>
              <div className="text-lg text-white font-medium flex items-center">
                "2 roti + 1 bowl dal + 100g paneer"
                {step > 0 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-2 w-2 h-5 bg-[#378ADD] animate-pulse" />}
              </div>
            </div>

            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 10 }}
                className="flex justify-between items-center bg-white/5 p-4 rounded-xl"
              >
                <div className="flex items-center gap-3 text-white font-medium">
                  <span className="w-8 h-8 rounded-full bg-[#FF4D1C]/20 flex items-center justify-center text-[#FF4D1C] text-xs">🔥</span>
                  Calories
                </div>
                <div className="font-bold text-white">480 kcal</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 10 }}
                className="flex justify-between items-center bg-white/5 p-4 rounded-xl"
              >
                <div className="flex items-center gap-3 text-white font-medium">
                  <span className="w-8 h-8 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00] text-xs">🥩</span>
                  Protein
                </div>
                <div className="font-bold text-white">28g</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: step >= 3 ? 1 : 0, scale: step >= 3 ? 1 : 0.95 }}
                className="mt-6 flex items-center justify-center gap-2 text-[#D4FF00] font-medium text-sm bg-[#D4FF00]/10 py-3 rounded-xl border border-[#D4FF00]/20"
              >
                <CheckCircle2 size={16} /> Logged successfully. Target updated.
              </motion.div>
            </div>
          </div>
          
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#378ADD] blur-[100px] opacity-10 z-0" />
        </div>

      </div>
    </section>
  );
}
