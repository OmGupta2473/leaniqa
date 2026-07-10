import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll } from "motion/react";
import { useNavigate } from "react-router-dom";
import { PremiumButton } from "@/shared/components/ui/PremiumButton";
import { GlassCard } from "@/shared/components/ui/GlassCard";

export function StickyCTA() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById("hero-section");
      const finalCta = document.getElementById("final-cta");
      
      if (!heroSection || !finalCta) return;

      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const finalCtaTop = finalCta.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      // Show sticky CTA if we've scrolled past the hero, 
      // but haven't reached the final CTA section yet.
      if (heroBottom < 100 && finalCtaTop > windowHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-sticky)]"
        >
          <GlassCard className="flex items-center gap-4 p-2 pl-6 pr-2 rounded-full border-[rgba(255,255,255,0.15)] shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(212,255,0,0.1)] bg-[rgba(13,13,16,0.85)]">
            <span className="text-[14px] font-bold text-white hidden sm:block whitespace-nowrap">
              Start building consistency
            </span>
            <PremiumButton size="sm" onClick={() => navigate("/login")} className="whitespace-nowrap">
              Continue on Web
            </PremiumButton>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
