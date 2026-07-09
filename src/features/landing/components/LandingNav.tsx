import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[rgba(10,10,10,0.8)] backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4FF00] flex items-center justify-center text-black font-bold text-lg">
            L
          </div>
          <span className="text-xl font-bold tracking-tight text-white">LeanIQA</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-[rgba(235,235,245,0.6)] hover:text-white transition-colors">Features</a>
          <a href="#method" className="text-sm font-medium text-[rgba(235,235,245,0.6)] hover:text-white transition-colors">The Method</a>
          <a href="#pricing" className="text-sm font-medium text-[rgba(235,235,245,0.6)] hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-white hover:text-[#D4FF00] transition-colors hidden sm:block"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-[#D4FF00] transition-all hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.header>
  );
}
