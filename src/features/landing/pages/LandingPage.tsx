import React, { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { LandingNav } from '../components/LandingNav';
import { HeroSection } from '../components/HeroSection';
import { ProblemSection } from '../components/ProblemSection';
import { AICoachSection } from '../components/AICoachSection';
import { TransformationTimelineSection } from '../components/TransformationTimelineSection';
import { MealIntelligenceSection } from '../components/MealIntelligenceSection';
import { ConsistencyEngineSection } from '../components/ConsistencyEngineSection';
import { WhyWorksSection } from '../components/WhyWorksSection';
import { DashboardPreviewSection } from '../components/DashboardPreviewSection';
import { AwardsHallSection } from '../components/AwardsHallSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { PricingSection } from '../components/PricingSection';
import { FinalCTASection } from '../components/FinalCTASection';
import { StickyCTA } from '../components/StickyCTA';

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Reset scroll on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0A0A0A] min-h-screen w-full text-white overflow-x-hidden selection:bg-[#D4FF00] selection:text-black font-sans">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4FF00] to-[#378ADD] transform origin-left z-50"
        style={{ scaleX }}
      />
      
      <LandingNav />
      <div id="home">
        <HeroSection />
      </div>
      <ProblemSection />
      <div id="features">
        <AICoachSection />
      </div>
      <TransformationTimelineSection />
      <MealIntelligenceSection />
      <ConsistencyEngineSection />
      <div id="method">
        <WhyWorksSection />
      </div>
      <DashboardPreviewSection />
      <AwardsHallSection />
      <TestimonialsSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <FinalCTASection />
      
      <StickyCTA />
    </div>
  );
}
