import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Zap, Flame } from 'lucide-react';

export function AwardsHallSection() {
  const awards = [
    { icon: <Flame size={32} color="#FF4D1C" />, title: "7-Day Streak", color: "#FF4D1C", delay: 0 },
    { icon: <Star size={32} color="#D4FF00" />, title: "Protein Master", color: "#D4FF00", delay: 0.1 },
    { icon: <Zap size={32} color="#378ADD" />, title: "Fast Learner", color: "#378ADD", delay: 0.2 },
    { icon: <Trophy size={32} color="#FFD700" />, title: "1st Milestone", color: "#FFD700", delay: 0.3 }
  ];

  return (
    <section className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] border-t border-white/5 flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-[#D4FF00]/5 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl text-center mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Celebrate every milestone.
        </h2>
        <p className="text-[rgba(235,235,245,0.6)] text-lg">
          Transformation is a long game. We make sure you feel rewarded every step of the way.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-5xl w-full relative z-10 perspective-1000">
        {awards.map((award, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, rotateY: -30, z: -100 }}
            whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ y: -10, rotateY: 10, scale: 1.05 }}
            transition={{ duration: 0.8, delay: award.delay, type: "spring" }}
            className="group relative aspect-square rounded-3xl border border-white/10 bg-[rgba(20,20,22,0.8)] backdrop-blur-md flex flex-col items-center justify-center p-6 cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
              style={{ backgroundColor: award.color }}
            />
            
            <motion.div 
              className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-white/10 bg-white/5"
              style={{ boxShadow: `0 0 30px ${award.color}33` }}
              whileHover={{ rotateZ: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {award.icon}
            </motion.div>
            
            <h3 className="text-white font-bold text-sm text-center">{award.title}</h3>
            <div className="text-[10px] text-[rgba(235,235,245,0.4)] uppercase tracking-wider mt-2">Unlocked</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
