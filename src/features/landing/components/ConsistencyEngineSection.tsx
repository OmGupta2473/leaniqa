import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Flame, Trophy, LineChart, ShieldCheck } from 'lucide-react';

export function ConsistencyEngineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const features = [
    { icon: <Flame size={24} className="text-[#FF4D1C]" />, title: "Daily Streaks", desc: "Build momentum day by day. Never miss twice." },
    { icon: <ShieldCheck size={24} className="text-[#D4FF00]" />, title: "Compliance Score", desc: "A realistic 0-100 score of how well you hit your targets." },
    { icon: <LineChart size={24} className="text-[#378ADD]" />, title: "Weekly Insights", desc: "Review your patterns. Let AI tell you what went right." },
    { icon: <Trophy size={24} className="text-yellow-400" />, title: "Achievement Awards", desc: "Unlock badges for consistency, high protein days, and more." }
  ];

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] flex flex-col items-center border-t border-white/5">
      <div className="max-w-6xl w-full text-center mb-20">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
          The Consistency Engine
        </h2>
        <p className="text-lg text-[rgba(235,235,245,0.6)] max-w-2xl mx-auto">
          We don't just track numbers. We track habits. LeanIQA's gamification and accountability loops are engineered to keep you coming back.
        </p>
      </div>

      <motion.div style={{ y }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {features.map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-[rgba(235,235,245,0.5)] text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
