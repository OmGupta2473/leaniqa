import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-40 px-6 md:px-12 w-full bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 flex items-center justify-center">
         <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-[#FF4D1C]/20 via-[#378ADD]/10 to-[#D4FF00]/20 rounded-full blur-[120px] mix-blend-screen opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="max-w-4xl w-full text-center relative z-10"
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-10 leading-[1.1]">
          The hardest part isn't losing fat. <br className="hidden md:block" />
          <span className="text-[rgba(235,235,245,0.4)]">It's staying consistent.</span>
        </h2>
        <p className="text-xl md:text-2xl text-[#D4FF00] font-medium mb-12">
          LeanIQA helps you do both.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="group flex items-center justify-center gap-2 px-8 py-5 bg-white text-black rounded-full font-bold text-lg w-full sm:w-auto hover:scale-105 active:scale-95 transition-all"
          >
            Start Your Journey <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
