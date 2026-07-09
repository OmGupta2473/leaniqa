import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { TrendingDown, Calendar } from 'lucide-react';

export function TransformationTimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] border-t border-[rgba(255,255,255,0.05)]">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            See the future of your body.
          </h2>
          <p className="text-lg text-[rgba(235,235,245,0.6)] max-w-2xl mx-auto">
            LeanIQA predicts your transformation based on your actual compliance, not just a theoretical formula. Stay on track, and watch the timeline unfold.
          </p>
        </motion.div>

        <div className="w-full relative h-64 md:h-80 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-6 md:p-10 overflow-hidden">
          {/* Chart background grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0zOSAzOXYtMzhIMXYzOHoiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-50" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-wider mb-1">Projected Weight</div>
                <div className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                  72.5 <span className="text-xl text-[rgba(235,235,245,0.5)] font-normal">kg</span>
                  <span className="flex items-center text-sm font-semibold text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-1 rounded-full"><TrendingDown size={14} className="mr-1" /> 12%</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm font-medium text-[rgba(235,235,245,0.6)] bg-white/5 px-4 py-2 rounded-full">
                <Calendar size={16} /> 12 Weeks Out
              </div>
            </div>

            {/* Projected Line Animation */}
            <div className="relative w-full h-32 mt-auto">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path 
                  d="M0,20 Q25,30 50,60 T100,90" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                />
                <motion.path 
                  d="M0,20 Q25,30 50,60 T100,90" 
                  fill="none" 
                  stroke="#D4FF00" 
                  strokeWidth="3"
                  style={{ pathLength: scrollYProgress }}
                />
              </svg>
              {/* Target Marker */}
              <motion.div 
                style={{ left: width }}
                className="absolute top-[90%] -mt-3 -ml-3 w-6 h-6 rounded-full bg-[#D4FF00] border-4 border-[#0A0A0A] shadow-[0_0_20px_rgba(212,255,0,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
