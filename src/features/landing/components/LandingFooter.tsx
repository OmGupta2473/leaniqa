import { motion } from "motion/react";
import { SectionContainer } from "@/shared/components/ui/SectionContainer";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#06060A] pt-24 pb-12 border-t border-[rgba(255,255,255,0.03)] z-20">
      <SectionContainer padding="none">
        
        <RevealOnScroll variant="fade">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-gradient-to-br from-[var(--lime)] to-[#96C000] text-[#06060A] text-[12px] font-extrabold shadow-[0_2px_12px_rgba(212,255,0,0.3)]">
                  🔥
                </div>
                <span className="text-[16px] font-extrabold text-[var(--text)] tracking-tight">LeanIQA</span>
              </div>
              <p className="text-[14px] text-[var(--text-3)] mb-6 pr-4">
                The AI body transformation coach built for consistency, not perfection.
              </p>
            </div>

            <div>
              <div className="text-[12px] font-bold text-white uppercase tracking-widest mb-4">Product</div>
              <ul className="space-y-3">
                {["Features", "Pricing", "Testimonials", "Download App"].map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-[14px] text-[var(--text-2)] hover:text-white transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[12px] font-bold text-white uppercase tracking-widest mb-4">Company</div>
              <ul className="space-y-3">
                {["About Us", "Contact Support", "Blog", "Careers"].map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-[14px] text-[var(--text-2)] hover:text-white transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[12px] font-bold text-white uppercase tracking-widest mb-4">Legal</div>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-[14px] text-[var(--text-2)] hover:text-white transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[rgba(255,255,255,0.05)]">
            <div className="text-[13px] text-[var(--text-3)] mb-4 md:mb-0">
              © {currentYear} LeanIQA. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-3)]">
              <span>Built with</span>
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-red-500"
              >
                ❤️
              </motion.span>
              <span>to help people build lasting habits.</span>
            </div>
            <div className="hidden md:block text-[12px] text-[var(--text-3)] opacity-50">
              v1.0.0
            </div>
          </div>
        </RevealOnScroll>
        
      </SectionContainer>
    </footer>
  );
}
