import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function WhyWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] flex flex-col items-center justify-center">
      <motion.div 
        style={{ opacity }}
        className="max-w-4xl w-full text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-12">
          Psychology over Restriction.
        </h2>
        
        <div className="space-y-8 text-left md:text-center text-xl md:text-2xl lg:text-3xl font-medium text-[rgba(235,235,245,0.7)] leading-relaxed md:leading-snug">
          <p>
            Traditional apps treat a missed day as a failure. <span className="text-white font-bold">LeanIQA treats it as data.</span>
          </p>
          <p>
            When you overeat, it doesn't guilt-trip you. It recalculates the rest of your day, showing you exactly how to bounce back.
          </p>
          <p>
            <span className="text-[#D4FF00]">Progress over perfection.</span> That's how permanent transformation happens.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
