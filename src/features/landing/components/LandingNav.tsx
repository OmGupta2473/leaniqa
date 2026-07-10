import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useNavigate } from "react-router-dom";
import { PremiumButton } from "@/shared/components/ui/PremiumButton";
import { cn } from "@/shared/utils/utils";

export function LandingNav() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Derive glassmorphism properties from scroll
  const navBackground = useTransform(scrollY, [0, 50], ["rgba(8, 8, 10, 0)", "rgba(8, 8, 10, 0.85)"]);
  const navBorder = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.08)"]);
  const navBlur = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(20px)"]);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Awards", href: "#awards" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <motion.header
      style={{
        backgroundColor: navBackground,
        borderBottomColor: navBorder,
        backdropFilter: navBlur,
      }}
      className="fixed top-0 left-0 right-0 z-[var(--z-nav)] transition-all duration-300 border-b"
    >
      <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-5 md:px-10 lg:px-16">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[var(--lime)] to-[#96C000] text-[#06060A] text-base font-extrabold shadow-[0_2px_12px_rgba(212,255,0,0.3)]">
            🔥
          </div>
          <span className="text-[18px] font-extrabold text-[var(--text)] tracking-[-0.03em]">LeanIQA</span>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[14px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <PremiumButton variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Sign in
          </PremiumButton>
          <PremiumButton size="sm" onClick={() => navigate("/login")}>
            Continue on Web
          </PremiumButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex md:hidden flex-col items-center justify-center gap-[5px] w-10 h-10 text-[var(--text)]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <motion.div 
            animate={isMobileMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            className="w-5 h-[1.5px] bg-current rounded-full"
          />
          <motion.div 
            animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="w-5 h-[1.5px] bg-current rounded-full"
          />
          <motion.div 
            animate={isMobileMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            className="w-5 h-[1.5px] bg-current rounded-full"
          />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={false}
        animate={isMobileMenuOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
        className="md:hidden overflow-hidden bg-[rgba(13,13,16,0.98)] backdrop-blur-3xl border-b border-[var(--border)]"
      >
        <div className="flex flex-col px-5 py-6 gap-6">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[16px] font-semibold text-[var(--text)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border)]">
            <PremiumButton variant="secondary" className="w-full justify-center" onClick={() => navigate("/login")}>
              Sign in
            </PremiumButton>
            <PremiumButton className="w-full justify-center" onClick={() => navigate("/login")}>
              Continue on Web
            </PremiumButton>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
