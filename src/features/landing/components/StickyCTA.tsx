import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, MonitorSmartphone, Globe } from 'lucide-react';

export function StickyCTA() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show when scrolling up or at bottom, hide when scrolling down
      // Don't show at the very top (hero section)
      if (currentScrollY < 300) {
        setIsVisible(false);
      } else if (currentScrollY + windowHeight >= documentHeight - 50) {
        setIsVisible(true); // Always show at bottom
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true); // Scrolling up
      } else {
        setIsVisible(false); // Scrolling down
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-0 w-full px-4 z-50 flex justify-center pointer-events-none"
        >
          <div className="bg-[rgba(30,30,32,0.65)] backdrop-blur-2xl border border-[rgba(255,255,255,0.1)] rounded-full p-2 flex items-center gap-2 shadow-2xl pointer-events-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-white/10 transition-colors text-[rgba(235,235,245,0.8)] hover:text-white">
              <Smartphone size={18} />
              <span className="text-sm font-medium hidden sm:block">App Store</span>
            </button>
            
            <div className="w-[1px] h-6 bg-white/10" />
            
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-white/10 transition-colors text-[rgba(235,235,245,0.8)] hover:text-white">
              <MonitorSmartphone size={18} />
              <span className="text-sm font-medium hidden sm:block">Google Play</span>
            </button>

            <div className="w-[1px] h-6 bg-white/10" />

            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full hover:bg-[#D4FF00] transition-colors shadow-lg"
            >
              <Globe size={18} />
              <span className="text-sm font-bold">Continue on Web</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
