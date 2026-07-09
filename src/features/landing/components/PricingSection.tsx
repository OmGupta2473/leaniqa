import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] border-t border-white/5 flex flex-col items-center">
      <div className="max-w-4xl text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Invest in your consistency.
        </h2>
        <p className="text-[rgba(235,235,245,0.6)] text-lg">
          Simple pricing. No hidden fees. Unlock the full power of your AI Coach.
        </p>
      </div>

      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-[rgba(20,20,22,0.8)] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 overflow-hidden"
        >
          {/* Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#D4FF00] to-transparent opacity-50" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 bg-[#D4FF00] blur-[100px] opacity-10" />

          <div className="text-center mb-8 relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">Pro Membership</h3>
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-5xl font-bold text-white">₹499</span>
              <span className="text-[rgba(235,235,245,0.5)] mb-1">/month</span>
            </div>
          </div>

          <div className="space-y-4 mb-10 relative z-10">
            {[
              "Unlimited AI Meal Logging",
              "Adaptive Calorie & Macro Targets",
              "Consistency Engine & Analytics",
              "Achievement Unlocks",
              "Priority Email Support"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#D4FF00]/10 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-[#D4FF00]" />
                </div>
                <span className="text-[rgba(235,235,245,0.8)] text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-[#D4FF00] transition-colors relative z-10"
          >
            Start Free Trial
          </button>
        </motion.div>
      </div>
    </section>
  );
}
