import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-12 w-full flex flex-col items-center justify-center bg-[#0A0A0A]">
      <div className="max-w-4xl w-full flex flex-col items-center text-center">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[#FF4D1C] font-semibold tracking-wider uppercase text-sm mb-6"
        >
          The Real Problem
        </motion.p>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-12"
        >
          People don't fail because they lack motivation.
          <br className="hidden md:block" />
          <span className="text-[rgba(235,235,245,0.3)]">
            They fail because they lack consistency.
          </span>
        </motion.h2>

        <motion.div 
          style={{ scale, opacity }}
          className="w-full max-w-3xl relative h-[200px] md:h-[300px] flex items-center justify-center mt-12"
        >
          {/* Abstract consistency visualization */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 20, opacity: 0.2 }}
                whileInView={{ 
                  height: i === 3 ? 120 : i === 4 ? 30 : i > 4 ? 20 : [40, 80, 100][i % 3], 
                  opacity: i === 4 ? 0.3 : i > 4 ? 0.1 : 1 
                }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + (i * 0.1), type: "spring", stiffness: 50 }}
                className={`w-8 md:w-16 rounded-full ${i === 4 ? 'bg-[#FF4D1C]' : i > 4 ? 'bg-white/10' : 'bg-[#D4FF00]'}`}
              />
            ))}
          </div>
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-4 text-xs font-medium text-[rgba(235,235,245,0.4)]">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span className="text-[#FF4D1C]">Fri (Missed)</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
