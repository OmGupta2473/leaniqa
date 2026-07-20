'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  LayoutGroup,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';

/**
 * Shared scroll-phase constants.
 * These were previously duplicated as raw numbers ([0.8, 0.9], [0.05, 0.08, 0.8, 0.9], etc.)
 * across ConnectionPaths, TabletConnectionPaths, ScrollCard, and AICore. Centralizing them
 * means the "finale" (end-of-scroll pulse) and "connect" (paths drawing in) phases can only
 * ever drift out of sync if this block changes, not because one of six call sites was missed.
 */
const SCROLL_PHASES = {
  connectStart: 0.05,
  connectEnd: 0.7,
  pathFadeInEnd: 0.08,
  particlesStart: 0.08,
  particlesEnd: 0.12,
  finaleStart: 0.8,
  finaleEnd: 0.9,
} as const;

export function AIOperatingSystem() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, restDelta: 0.001 });

  // Headline Opacities
  const hl1Opacity = useTransform(smoothProgress, [0.0, 0.05, 0.7, 0.75], [0, 1, 1, 0]);
  const hl1Y = useTransform(smoothProgress, [0.0, 0.05, 0.7, 0.75], [20, 0, 0, -20]);
  const hl2Opacity = useTransform(smoothProgress, [0.75, 0.8], [0, 1]);
  const hl2Y = useTransform(smoothProgress, [0.75, 0.8], [20, 0]);

  const mobileCards = [
    { title: "Natural Language", subtitle: "AI Meal Parsing", component: <MealParsingInterface /> },
    { title: "Dynamic Adjustments", subtitle: "Adaptive Recovery", component: <AdaptiveRecoveryInterface /> },
    { title: "Accountability", subtitle: "Compliance Score", component: <ComplianceInterface /> },
    { title: "Forecasting", subtitle: "Physique Timeline", component: <TimelineInterface /> },
    { title: "Motivation", subtitle: "Daily Streaks", component: <StreakInterface /> },
    { title: "Gamification", subtitle: "Achievement Awards", component: <AwardsInterface /> },
    { title: "Next Actions", subtitle: "AI Coach Recommendations", component: <CoachInterface /> }
  ];

  return (
    <section className="bg-[#0C0C0D] relative" ref={containerRef}>
      
      {/* --- DESKTOP & TABLET EXPERIENCE --- */}
      <div className="hidden md:block h-[400vh]">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden py-10">
          
          {/* Background Grid Fade */}
          <motion.div 
            style={{ opacity: useTransform(smoothProgress, [0, 0.05], [0, 0.3]) }}
            className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"
          />

          {/* Global End Pulse */}
          <motion.div 
            style={{ opacity: useTransform(smoothProgress, [0.8, 0.9, 1.0], [0, 0.1, 0.15]) }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,255,0,0.4)_0%,transparent_70%)] pointer-events-none mix-blend-screen"
          />

          <div className="w-full max-w-[1400px] px-6 mx-auto relative z-10 h-full flex flex-col">
            
            {/* Headlines (Fixed Height Container so grid doesn't jump) */}
            <div className="relative h-[120px] sm:h-[150px] w-full max-w-3xl mx-auto flex items-center justify-center text-center z-50 shrink-0">
              {/* sr-only: a single static announcement so screen readers don't hear both
                  stacked/animated headlines read back-to-back (opacity: 0 doesn't remove
                  text from the accessibility tree the way aria-hidden does). */}
              <h2 className="sr-only">
                Intelligence that drives consistency. This isn&apos;t calorie tracking — it&apos;s an AI Operating System for body transformation.
              </h2>
              <div aria-hidden="true" className="contents">
                <motion.div style={{ opacity: hl1Opacity, y: hl1Y }} className="absolute inset-x-0">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 tracking-tight text-white">Intelligence that drives consistency.</h2>
                  <p className="text-zinc-400 text-base sm:text-lg">People don't fail because they lack motivation. They fail because rigid plans break when real life happens. LeanIQA fixes this.</p>
                </motion.div>
                <motion.div style={{ opacity: hl2Opacity, y: hl2Y }} className="absolute inset-x-0">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 tracking-tight text-white">This isn't calorie tracking.</h2>
                  <p className="text-[#D4FF00] text-xl sm:text-2xl font-medium tracking-wide">It's an AI Operating System<br/>for body transformation.</p>
                </motion.div>
              </div>
            </div>

            <LayoutGroup>
            {/* Desktop Bento Grid Layout */}
            <div className="hidden lg:grid grid-cols-12 grid-rows-4 gap-6 flex-1 w-full relative mb-10 min-h-[600px] max-h-[800px]" style={{ perspective: 1500 }}>
              
              {/* Connection Paths */}
              <ConnectionPaths progress={smoothProgress} />

              {/* AI Core */}
              <AICore progress={smoothProgress} />

              {/* 1. Meal Parsing */}
              <ScrollCard progress={smoothProgress} start={0.15} className="col-span-3 row-span-1" title="Natural Language" subtitle="AI Meal Parsing">
                <MealParsingInterface />
              </ScrollCard>

              {/* 2. Adaptive Recovery */}
              <ScrollCard progress={smoothProgress} start={0.22} className="col-span-5 row-span-1" title="Dynamic Adjustments" subtitle="Adaptive Recovery">
                <AdaptiveRecoveryInterface />
              </ScrollCard>

              {/* 3. Compliance */}
              <ScrollCard progress={smoothProgress} start={0.29} className="col-span-4 row-span-2" title="Accountability" subtitle="Compliance Score">
                <ComplianceInterface />
              </ScrollCard>

              {/* 4. Timeline */}
              <ScrollCard progress={smoothProgress} start={0.36} className="col-span-4 row-span-2" title="Forecasting" subtitle="Physique Timeline">
                <TimelineInterface />
              </ScrollCard>

              {/* 5. Daily Streak */}
              <ScrollCard progress={smoothProgress} start={0.43} className="col-span-4 row-span-1" title="Motivation" subtitle="Daily Streaks">
                <StreakInterface />
              </ScrollCard>

              {/* 6. Achievement */}
              <ScrollCard progress={smoothProgress} start={0.50} className="col-span-3 row-span-1" title="Gamification" subtitle="Achievement Awards">
                <AwardsInterface />
              </ScrollCard>

              {/* 7. AI Coach */}
              <ScrollCard progress={smoothProgress} start={0.57} className="col-span-5 row-span-1" title="Next Actions" subtitle="AI Coach Recommendations">
                <CoachInterface />
              </ScrollCard>
              
              {/* 8. Sync */}
              <ScrollCard progress={smoothProgress} start={0.64} className="col-span-4 row-span-1" title="Sync" subtitle="Continuous Updating">
                <SyncInterface />
              </ScrollCard>
            </div>
            {/* Tablet Bento Grid Layout */}
            <div className="hidden md:grid lg:hidden grid-cols-2 grid-rows-8 gap-4 sm:gap-6 flex-1 w-full relative mb-10 min-h-[900px] max-h-[1200px]" style={{ perspective: 1500 }}>
              {/* Tablet Connection Paths */}
              <TabletConnectionPaths progress={smoothProgress} />

              {/* AI Core */}
              <AICore progress={smoothProgress} className="col-span-2 row-span-2" />

              {/* 1. Meal Parsing */}
              <ScrollCard progress={smoothProgress} start={0.15} className="col-span-1 row-span-1" title="Natural Language" subtitle="AI Meal Parsing">
                <MealParsingInterface />
              </ScrollCard>

              {/* 2. Adaptive Recovery */}
              <ScrollCard progress={smoothProgress} start={0.22} className="col-span-1 row-span-1" title="Dynamic Adjustments" subtitle="Adaptive Recovery">
                <AdaptiveRecoveryInterface />
              </ScrollCard>

              {/* 3. Compliance */}
              <ScrollCard progress={smoothProgress} start={0.29} className="col-span-1 row-span-2" title="Accountability" subtitle="Compliance Score">
                <ComplianceInterface />
              </ScrollCard>

              {/* 4. Timeline */}
              <ScrollCard progress={smoothProgress} start={0.36} className="col-span-1 row-span-2" title="Forecasting" subtitle="Physique Timeline">
                <TimelineInterface />
              </ScrollCard>

              {/* 5. Daily Streak */}
              <ScrollCard progress={smoothProgress} start={0.43} className="col-span-1 row-span-1" title="Motivation" subtitle="Daily Streaks">
                <StreakInterface />
              </ScrollCard>

              {/* 6. Achievement */}
              <ScrollCard progress={smoothProgress} start={0.50} className="col-span-1 row-span-1" title="Gamification" subtitle="Achievement Awards">
                <AwardsInterface />
              </ScrollCard>

              {/* 7. AI Coach */}
              <ScrollCard progress={smoothProgress} start={0.57} className="col-span-2 row-span-1" title="Next Actions" subtitle="AI Coach Recommendations">
                <CoachInterface />
              </ScrollCard>
              
              {/* 8. Sync */}
              <ScrollCard progress={smoothProgress} start={0.64} className="col-span-2 row-span-1" title="Sync" subtitle="Continuous Updating">
                <SyncInterface />
              </ScrollCard>
            </div>
            </LayoutGroup>
          </div>
        </div>
      </div>

      {/* --- MOBILE CINEMATIC EXPERIENCE --- */}
      <div className="md:hidden w-full flex flex-col relative bg-[#0C0C0D]">
        {/* Mobile Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
        
        {/* Mobile Intro Headlines */}
        <div className="px-6 pt-20 pb-[15vh] relative z-10 text-center min-h-[60vh] flex flex-col justify-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-semibold mb-6 tracking-tight text-white"
          >
            Intelligence that drives consistency.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg leading-relaxed"
          >
            People don't fail because they lack motivation. They fail because rigid plans break when real life happens. LeanIQA fixes this.
          </motion.p>
        </div>

        {/* AI Orb - Sticky */}
        <div className="sticky top-[2vh] z-50 flex justify-center w-full pointer-events-none pb-4">
           <MobileAICore />
        </div>

        {/* Cinematic Card Stack */}
        <div className="relative z-20 pb-[20vh] mt-[-10vh]">
          {mobileCards.map((card, i) => (
            <div 
              key={i} 
              className="sticky w-full px-4" 
              style={{ 
                top: `${14 + i * 2.5}vh`, 
                height: '75vh', 
                marginTop: i === 0 ? '0' : '100vh' 
              }}
            >
              <MobileScrollCard title={card.title} subtitle={card.subtitle} index={i}>
                 {card.component}
              </MobileScrollCard>
            </div>
          ))}
        </div>
        
        {/* Mobile Outro Headline - Slides up over the stack */}
        <div className="h-[100vh] flex flex-col items-center justify-center text-center px-6 relative z-40 bg-[#0C0C0D]">
          <div className="absolute top-[-150px] left-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[#0C0C0D] pointer-events-none" />
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ margin: "-20% 0px -20% 0px" }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-semibold mb-8 tracking-tight text-white"
          >
            This isn't calorie tracking.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-20% 0px -20% 0px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[#D4FF00] text-2xl font-medium tracking-wide leading-snug"
          >
            It's an AI Operating System<br/>for body transformation.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

const ConnectionPaths = ({ progress }: any) => {
  const paths = [
    "M 500 500 L 500 125 L 125 125",
    "M 500 500 L 500 125",
    "M 500 500 L 875 500 L 875 250",
    "M 500 500 L 166 500",
    "M 500 500 L 875 500 L 875 625",
    "M 500 500 L 500 875 L 125 875",
    "M 500 500 L 500 875",
    "M 500 500 L 875 500 L 875 875"
  ];
  
  const pathLength = useTransform(progress, [0.05, 0.7], [0, 1]);
  const pathOpacity = useTransform(progress, [0.05, 0.08, 0.8, 0.9], [0, 0.15, 0.15, 1]);
  const particlesOpacity = useTransform(progress, [0.08, 0.12], [0, 1]);
  const fastParticlesOpacity = useTransform(progress, [0.8, 0.9], [0, 1]);

  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-10">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {paths.map((p, i) => (
        <g key={i}>
          <motion.path 
            d={p} 
            stroke="#D4FF00" 
            strokeWidth="2" 
            fill="none" 
            vectorEffect="non-scaling-stroke"
            style={{ pathLength, opacity: pathOpacity }}
          />
          {/* Base particles */}
          <motion.circle style={{ opacity: particlesOpacity }} r="4" fill="#D4FF00" filter="url(#glow)">
            <animateMotion dur={`${3 + (i % 3) * 0.5}s`} repeatCount="indefinite" path={p} />
            <animate attributeName="opacity" values="0;1;0" dur={`${3 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
          </motion.circle>
          {/* Accelerated particles (fades in at end) */}
          <motion.circle style={{ opacity: fastParticlesOpacity }} r="6" fill="#D4FF00" filter="url(#glow)">
            <animateMotion dur={`${1 + (i % 3) * 0.2}s`} repeatCount="indefinite" path={p} />
            <animate attributeName="opacity" values="0;1;0" dur={`${1 + (i % 3) * 0.2}s`} repeatCount="indefinite" />
          </motion.circle>
        </g>
      ))}
    </svg>
  );
}

const TabletConnectionPaths = ({ progress }: any) => {
  const paths = [
    "M 500 250 L 500 950", // Central spine starting below AICore
    "M 500 350 L 250 350", // Left branch
    "M 500 350 L 750 350", // Right branch
    "M 500 550 L 250 550", // Left branch
    "M 500 550 L 750 550", // Right branch
    "M 500 750 L 250 750", // Left branch
    "M 500 750 L 750 750", // Right branch
  ];
  
  const pathLength = useTransform(progress, [0.05, 0.7], [0, 1]);
  const pathOpacity = useTransform(progress, [0.05, 0.08, 0.8, 0.9], [0, 0.15, 0.15, 1]);
  const particlesOpacity = useTransform(progress, [0.08, 0.12], [0, 1]);
  const fastParticlesOpacity = useTransform(progress, [0.8, 0.9], [0, 1]);

  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block lg:hidden">
      <defs>
        <filter id="glow-tablet">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {paths.map((p, i) => (
        <g key={`tablet-path-${i}`}>
          <motion.path 
            d={p} 
            stroke="#D4FF00" 
            strokeWidth="2" 
            fill="none" 
            vectorEffect="non-scaling-stroke"
            style={{ pathLength, opacity: pathOpacity }}
          />
          {/* Base particles */}
          <motion.circle style={{ opacity: particlesOpacity }} r="4" fill="#D4FF00" filter="url(#glow-tablet)">
            <animateMotion dur={`${3 + (i % 3) * 0.5}s`} repeatCount="indefinite" path={p} />
            <animate attributeName="opacity" values="0;1;0" dur={`${3 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
          </motion.circle>
          {/* Accelerated particles (fades in at end) */}
          <motion.circle style={{ opacity: fastParticlesOpacity }} r="6" fill="#D4FF00" filter="url(#glow-tablet)">
            <animateMotion dur={`${1 + (i % 3) * 0.2}s`} repeatCount="indefinite" path={p} />
            <animate attributeName="opacity" values="0;1;0" dur={`${1 + (i % 3) * 0.2}s`} repeatCount="indefinite" />
          </motion.circle>
        </g>
      ))}
    </svg>
  );
}

function ScrollCard({ progress, start, className, title, subtitle, children }: any) {
  const shouldReduceMotion = useReducedMotion();
  const opacity = useTransform(progress, [start, start + 0.05], [0, 1]);
  const scale = useTransform(progress, [start, start + 0.05], shouldReduceMotion ? [1, 1] : [0.9, 1]);
  const scrollRotateX = useTransform(progress, [start, start + 0.05], shouldReduceMotion ? [0, 0] : [10, 0]);
  const scrollRotateY = useTransform(progress, [start, start + 0.05], shouldReduceMotion ? [0, 0] : [-10, 0]);
  const filter = useTransform(progress, [start, start + 0.05], ["blur(10px)", "blur(0px)"]);

  const sweepX = useTransform(progress, [start + 0.05, start + 0.1], ["0%", "300%"]);
  const sweepOpacity = useTransform(progress, [start + 0.05, start + 0.075, start + 0.1], [0, 1, 0]);

  const endGlow = useTransform(progress, [0.8, 0.9], ["rgba(212,255,0,0)", "rgba(212,255,0,0.1)"]);
  const endBorder = useTransform(progress, [0.8, 0.9], ["rgba(39,39,42,0.6)", "rgba(212,255,0,0.4)"]);
  const endShadow = useTransform(progress, [0.8, 0.9], ["0 20px 25px -5px rgba(0,0,0,0.1)", "0 0 40px rgba(212,255,0,0.2)"]);

  // Mouse interaction for desktop
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const xPct = useMotionValue(0);
  const yPct = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    mouseX.set(x);
    mouseY.set(y);
    xPct.set((x / width - 0.5) * 2);
    yPct.set((y / height - 0.5) * 2);
  };
  
  const handleMouseLeave = () => {
    xPct.set(0);
    yPct.set(0);
  };

  const smoothXPct = useSpring(xPct, { stiffness: 150, damping: 20 });
  const smoothYPct = useSpring(yPct, { stiffness: 150, damping: 20 });
  
  // Tilt only activates on hover for desktop (handled by xPct/yPct resetting to 0 on leave)
  const tiltX = useTransform(smoothYPct, [-1, 1], shouldReduceMotion ? [0, 0] : [4, -4]);
  const tiltY = useTransform(smoothXPct, [-1, 1], shouldReduceMotion ? [0, 0] : [-4, 4]);

  const mouseXTransform = useTransform(mouseX, (x) => x - 350);
  const mouseYTransform = useTransform(mouseY, (y) => y - 350);

  return (
    <motion.div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ opacity, scale, rotateX: scrollRotateX, rotateY: scrollRotateY, filter, borderColor: endBorder, boxShadow: endShadow }}
      className={`group bg-[#111112] border-zinc-800/60 border rounded-3xl flex flex-col relative z-20 overflow-visible transform-gpu hover:border-[#D4FF00]/40 transition-[border-color] duration-500 ${className}`}
    >
      <motion.div 
        style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        className="w-full h-full p-6 flex flex-col relative overflow-hidden rounded-3xl z-10"
      >
         {/* Mouse hover light sweep using GPU transforms instead of recreating string gradients */}
         {!shouldReduceMotion && (
           <motion.div 
             className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block z-0 w-[700px] h-[700px] rounded-full left-0 top-0 transform-gpu" 
             style={{ 
               background: "radial-gradient(circle, rgba(212,255,0,0.08) 0%, transparent 70%)",
               x: mouseXTransform,
               y: mouseYTransform
             }} 
           />
         )}

         {/* Reactive particles */}
         {!shouldReduceMotion && (
           <motion.div 
             className="absolute inset-0 z-0 pointer-events-none hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform-gpu"
           >
             {[...Array(4)].map((_, i) => (
               <motion.div
                 key={i}
                 className="absolute w-1 h-1 bg-[#D4FF00] rounded-full blur-[1px] transform-gpu"
                 style={{
                   left: `${20 + i * 20}%`,
                   top: `${30 + (i % 2) * 40}%`,
                   x: useTransform(smoothXPct, [-1, 1], [-20 * (i + 1), 20 * (i + 1)]),
                   y: useTransform(smoothYPct, [-1, 1], [-20 * (i + 1), 20 * (i + 1)]),
                 }}
               />
             ))}
           </motion.div>
         )}

         <motion.div style={{ backgroundColor: endGlow }} className="absolute inset-0 pointer-events-none transition-colors duration-300 z-0 transform-gpu" />
         
         <motion.div 
           className="absolute inset-[-50%] pointer-events-none z-0 hidden lg:block opacity-30 transform-gpu" 
           style={{ 
             background: 'linear-gradient(0deg, rgba(255,255,255,0.1), transparent)',
             rotate: useTransform(smoothXPct, [-1, 1], [0, 180])
           }} 
         />
         <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none z-0 lg:hidden" />
         
         <motion.div 
            style={{ x: sweepX, opacity: sweepOpacity }}
            className="absolute top-0 bottom-0 -left-[100%] w-full bg-gradient-to-r from-transparent via-[#D4FF00]/15 to-transparent skew-x-12 z-30 pointer-events-none" 
         />

         <div className="flex items-start gap-4 relative z-10 mb-2" style={{ transform: "translateZ(20px)" }}>
            <div>
              <h4 className="text-zinc-100 font-medium tracking-tight">{subtitle}</h4>
              <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-widest font-bold">{title}</p>
            </div>
         </div>
         <div className="flex-1 flex flex-col relative z-10 h-full w-full" style={{ transform: "translateZ(10px)" }}>
           {children}
         </div>
      </motion.div>
    </motion.div>
  );
}

const AICore = ({ progress, className = "col-span-4 row-span-2" }: any) => {
  const scale = useTransform(progress, [0.08, 0.12], [0.8, 1]);
  const opacity = useTransform(progress, [0.08, 0.12], [0, 1]);
  const filter = useTransform(progress, [0.08, 0.12], ["blur(20px)", "blur(0px)"]);
  
  const endScale = useTransform(progress, [0.8, 0.9], [1, 1.05]);
  const endGlow = useTransform(progress, [0.8, 0.9], ["0 0 40px rgba(212,255,0,0.02)", "0 0 120px rgba(212,255,0,0.3)"]);

  return (
    <motion.div 
      style={{ scale, opacity, filter }}
      className={`${className} bg-zinc-900/40 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center relative backdrop-blur-md z-30 transform-gpu p-6`}
    >
      <motion.div 
         style={{ scale: endScale, boxShadow: endGlow }}
         className="absolute inset-0 rounded-3xl pointer-events-none transition-all"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-transparent rounded-3xl pointer-events-none" />
      
      <div className="w-32 h-32 rounded-full border border-[#D4FF00]/20 flex items-center justify-center relative">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="absolute inset-0 bg-[#D4FF00]/10 rounded-full blur-xl" 
         />
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
           className="absolute inset-[-20px] border border-[#D4FF00]/20 rounded-full border-dashed" 
         />
         
         <div className="w-14 h-14 bg-[#D4FF00]/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,255,0,0.2)] border border-[#D4FF00]/30 relative overflow-hidden">
           <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-[#D4FF00]/20 blur-md" />
           <div className="w-6 h-6 bg-[#D4FF00] rounded-full relative z-10 shadow-[0_0_15px_#D4FF00]" />
         </div>
      </div>
      <h3 className="mt-10 text-white font-semibold text-lg tracking-wide flex items-center gap-2">
         <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
           <div className="w-2.5 h-2.5 bg-[#D4FF00] rounded-full shadow-[0_0_10px_#D4FF00]" />
         </motion.div>
         LeanIQA Engine
      </h3>
      <p className="text-zinc-500 text-xs mt-2 text-center max-w-[220px] leading-relaxed">Continuously analyzing, adapting, and coaching your transformation.</p>
    </motion.div>
  );
}

const MealParsingInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 p-4 flex flex-col justify-center relative overflow-hidden">
    <motion.div 
       animate={{ opacity: [1, 1, 0, 0, 1] }}
       transition={{ duration: 5, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
       className="absolute inset-0 p-4 flex flex-col justify-center"
    >
      <div className="font-mono text-[10px] sm:text-xs text-zinc-500 mb-2">INPUT RECEIVED</div>
      <div className="font-mono text-xs sm:text-sm text-zinc-300 flex items-center">
        {">"} 
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3.5 }}
          className="overflow-hidden whitespace-nowrap inline-block border-r-2 border-[#D4FF00] ml-2"
        >
          Had 2 eggs and toast
        </motion.span>
      </div>
    </motion.div>
    <motion.div 
       animate={{ opacity: [0, 0, 1, 1, 0] }}
       transition={{ duration: 5, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
       className="absolute inset-0 p-4 flex flex-col justify-center items-center bg-zinc-950/50 backdrop-blur-sm"
    >
      <div className="flex gap-2">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.5, 0.8, 1] }} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded shadow-[0_0_10px_rgba(59,130,246,0.2)]">14g PRO</motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.55, 0.8, 1] }} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded shadow-[0_0_10px_rgba(234,179,8,0.2)]">10g FAT</motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.6, 0.8, 1] }} className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded shadow-[0_0_10px_rgba(34,197,94,0.2)]">22g CARBS</motion.div>
      </div>
    </motion.div>
  </div>
);

const AdaptiveRecoveryInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 flex items-end px-6 pb-4 gap-3 relative overflow-hidden">
     <div className="absolute inset-0 bg-gradient-to-t from-[#D4FF00]/5 to-transparent pointer-events-none" />
     
     <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
       <div className="w-full h-[60%] bg-zinc-800 rounded-sm relative"><div className="absolute top-0 inset-x-0 h-[2px] bg-zinc-700" /></div>
       <span className="text-[9px] text-zinc-500 font-mono">BFAST</span>
     </div>

     <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
       <motion.div 
         animate={{ height: ["50%", "90%", "90%", "50%"] }}
         transition={{ duration: 5, repeat: Infinity, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
         className="w-full bg-red-500/80 rounded-sm relative shadow-[0_0_15px_rgba(239,68,68,0.3)]"
       >
         <div className="absolute top-0 inset-x-0 h-[2px] bg-white/50" />
       </motion.div>
       <span className="text-[9px] text-zinc-500 font-mono">LUNCH</span>
     </div>

     <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
       <motion.div 
         animate={{ height: ["60%", "60%", "20%", "60%"] }}
         transition={{ duration: 5, repeat: Infinity, times: [0, 0.2, 0.4, 1], ease: "easeInOut" }}
         className="w-full bg-[#D4FF00] rounded-sm relative shadow-[0_0_15px_rgba(212,255,0,0.3)]"
       >
         <div className="absolute top-0 inset-x-0 h-[2px] bg-white" />
       </motion.div>
       <span className="text-[9px] text-[#D4FF00] font-mono">DINNER</span>
     </div>
  </div>
);

const ComplianceInterface = () => {
  return (
    <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,255,0,0.05)_0%,transparent_70%)]" />
      <div className="w-32 h-32 relative flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" className="stroke-zinc-900" strokeWidth="8" fill="none" />
          <circle cx="50" cy="50" r="40" className="stroke-zinc-800 stroke-dashed opacity-50" strokeWidth="1" fill="none" strokeDasharray="4 4" />
          <motion.circle 
             cx="50" cy="50" r="40" 
             className="stroke-[#D4FF00]" 
             strokeWidth="8" 
             fill="none" 
             strokeLinecap="round"
             strokeDasharray="251.2"
             animate={{ strokeDashoffset: [251.2 * (1 - 0.81), 251.2 * (1 - 0.89), 251.2 * (1 - 0.94), 251.2 * (1 - 0.81)] }}
             transition={{ duration: 6, repeat: Infinity, times: [0, 0.33, 0.66, 1], ease: "easeInOut" }}
          />
        </svg>
        <div className="flex flex-col items-center relative z-10">
           <AnimatedScore />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2">
         <motion.div 
           animate={{ opacity: [0.5, 1, 0.5] }} 
           transition={{ duration: 2, repeat: Infinity }}
           className="w-2 h-2 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" 
         />
         <span className="text-xs font-medium text-zinc-400 tracking-wider">ON TRACK</span>
      </div>
    </div>
  );
};

const AnimatedScore = () => {
  const [score, setScore] = useState(81);
  useEffect(() => {
    let phase = 0;
    const interval = setInterval(() => {
      phase = (phase + 1) % 3;
      if (phase === 0) setScore(81);
      else if (phase === 1) setScore(89);
      else setScore(94);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return <span className="text-white font-bold text-3xl tracking-tighter">{score}<span className="text-lg text-zinc-500">%</span></span>
}

const TimelineInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 p-6 relative overflow-hidden flex flex-col">
     <div className="flex justify-between items-end mb-4">
        <div>
          <div className="text-[10px] font-mono text-zinc-500 mb-1">PROJECTED</div>
          <div className="text-xl font-semibold text-white">72.4 kg</div>
        </div>
        <div className="text-[10px] font-mono text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-1 rounded border border-[#D4FF00]/20">AUG 12</div>
     </div>
     <div className="flex-1 relative w-full border-b border-l border-zinc-800/50 pb-2 pl-2">
       <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <path d="M 0 40 Q 25 38 50 28 T 100 25" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          <motion.path 
            d="M 0 40 Q 25 35 50 20 T 100 5" 
            stroke="#D4FF00" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="150"
            initial={{ strokeDashoffset: 150 }}
            animate={{ strokeDashoffset: [150, 0, 0, 150] }}
            transition={{ duration: 5, repeat: Infinity, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
          />
       </svg>
       <motion.div 
         animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
         transition={{ duration: 5, repeat: Infinity, times: [0, 0.4, 0.8, 1] }}
         className="absolute top-[10%] right-[-4px] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" 
       />
     </div>
  </div>
);

const StreakInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 flex items-center justify-center gap-3 p-4 relative overflow-hidden">
     <div className="flex-1 h-full rounded-lg bg-orange-500/10 flex flex-col items-center justify-center border border-orange-500/20">
       <span className="text-[10px] text-orange-500/50 font-mono mb-1">MON</span>
       <span className="text-orange-500 font-bold">✓</span>
     </div>
     <div className="flex-1 h-full rounded-lg bg-orange-500/10 flex flex-col items-center justify-center border border-orange-500/20">
       <span className="text-[10px] text-orange-500/50 font-mono mb-1">TUE</span>
       <span className="text-orange-500 font-bold">✓</span>
     </div>
     <motion.div 
       animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 15px rgba(212,255,0,0.1)", "0 0 25px rgba(212,255,0,0.3)", "0 0 15px rgba(212,255,0,0.1)"] }}
       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
       className="flex-1 h-full rounded-lg bg-[#D4FF00]/10 flex flex-col items-center justify-center text-[#D4FF00] border border-[#D4FF00]/30 relative overflow-hidden"
     >
       <div className="absolute inset-0 bg-gradient-to-t from-[#D4FF00]/20 to-transparent" />
       
       <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-2"
       >
         <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#D4FF00] opacity-30">
            <path d="M12 2c0 0-4.5 4.5-4.5 9.5a4.5 4.5 0 0 0 9 0C16.5 6.5 12 2 12 2z" />
         </svg>
       </motion.div>

       <span className="font-bold relative z-10 text-2xl mt-3">14</span>
       <span className="text-[9px] text-[#D4FF00]/70 font-mono mt-1 relative z-10">DAY STREAK</span>
     </motion.div>
  </div>
);

const AwardsInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent" />
      <motion.div
         animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
         className="relative z-10"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] border border-yellow-200/50 rotate-45 relative overflow-hidden">
           <motion.div 
             animate={{ x: ["-100%", "200%"] }} 
             transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
             className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-45"
           />
           <span className="text-2xl font-bold text-yellow-950 -rotate-45 block">1</span>
        </div>
      </motion.div>
      <div className="absolute bottom-4 text-[10px] font-bold text-yellow-500/70 tracking-widest uppercase">Unlocked</div>
  </div>
);

const CoachInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 p-5 flex flex-col justify-center gap-3 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
        className="flex gap-3 items-start"
      >
        <div className="w-8 h-8 rounded-lg bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-[-10px] bg-gradient-to-r from-transparent via-[#D4FF00]/30 to-transparent" />
          <div className="w-2 h-2 bg-[#D4FF00] rounded-full shadow-[0_0_10px_#D4FF00] relative z-10" />
        </div>
        <div>
          <div className="text-sm text-zinc-200 font-medium tracking-tight">Protein is low today.</div>
          <div className="text-xs text-zinc-500 mt-1 leading-relaxed">Try adding 150g of chicken breast to dinner to hit your target.</div>
        </div>
      </motion.div>
  </div>
);

const SyncInterface = () => (
  <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 mt-2 flex items-center justify-between px-8 overflow-hidden relative">
      <div className="flex flex-col gap-3 relative z-10 flex-1 pr-6">
        <motion.div animate={{ width: ["20%", "80%", "40%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="h-1.5 bg-zinc-700/80 rounded-full w-16" />
        <motion.div animate={{ width: ["60%", "30%", "70%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="h-1.5 bg-zinc-700/80 rounded-full w-10" />
        <motion.div animate={{ width: ["40%", "90%", "50%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="h-1.5 bg-zinc-700/80 rounded-full w-14" />
      </div>
      <div className="relative z-10 flex-shrink-0">
        <motion.div 
           animate={{ rotate: 360 }} 
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           className="w-12 h-12 border-2 border-zinc-800 border-t-[#D4FF00] rounded-full relative z-10 shadow-[0_0_15px_rgba(212,255,0,0.1)]" 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-zinc-500 rounded-full" />
        </div>
      </div>
  </div>
);

function MobileScrollCard({ title, subtitle, children, index }: any) {
  const shouldReduceMotion = useReducedMotion();
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
  };

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 80, scale: shouldReduceMotion ? 1 : 0.9, rotateX: shouldReduceMotion ? 0 : 10 },
        visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { type: "spring", stiffness: 70, damping: 20, staggerChildren: 0.2 } }
      }}
      whileTap={{ scale: shouldReduceMotion ? 1 : 0.96, transition: { type: "spring", stiffness: 400, damping: 25 }, boxShadow: "0 0 50px rgba(212,255,0,0.2)" }}
      onPointerDown={handlePointerDown}
      className={`bg-[#111112] border-zinc-800 border rounded-3xl p-6 flex flex-col relative z-20 overflow-hidden w-full h-full shadow-[0_-10px_40px_rgba(0,0,0,0.8)] origin-bottom transform-gpu cursor-pointer touch-none select-none`}
    >
       <motion.div 
         variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1 } } }}
         className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none z-0" 
       />

       {!shouldReduceMotion && ripples.map(r => (
         <motion.div
           key={r.id}
           initial={{ opacity: 0.6, scale: 0, x: "-50%", y: "-50%" }}
           animate={{ opacity: 0, scale: 5 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           style={{ left: r.x, top: r.y }}
           className="absolute w-40 h-40 bg-[radial-gradient(circle,rgba(212,255,0,0.3)_0%,transparent_70%)] rounded-full pointer-events-none z-0 mix-blend-screen transform-gpu"
         />
       ))}
       
       {/* Light Sweep */}
       {!shouldReduceMotion && (
         <motion.div 
            variants={{
               hidden: { x: "-100%", opacity: 0 },
               visible: { x: "200%", opacity: [0, 1, 0], transition: { duration: 1.5, ease: "easeInOut", delay: 0.3 } }
            }}
            className="absolute top-0 bottom-0 -left-[100%] w-[200%] bg-gradient-to-r from-transparent via-[#D4FF00]/10 to-transparent skew-x-12 z-10 pointer-events-none transform-gpu" 
         />
       )}

       <motion.div 
         variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } } }}
         className="flex items-start gap-4 relative z-10 mb-6 shrink-0"
       >
          <div>
            <h4 className="text-zinc-100 font-medium tracking-tight text-xl">{subtitle}</h4>
            <p className="text-[#D4FF00] text-xs mt-1 uppercase tracking-widest font-bold">{title}</p>
          </div>
       </motion.div>
       <motion.div 
         variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, delay: 0.4 } } }}
         className="flex-1 flex flex-col relative z-10 w-full min-h-0 items-center justify-center"
       >
         <div className="w-full max-w-sm mx-auto h-full flex flex-col items-center justify-center origin-center">
            {children}
         </div>
       </motion.div>
       
       {/* Particles */}
       {!shouldReduceMotion && (
         <motion.div 
           variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 1.5, duration: 1 } } }}
           className="absolute inset-0 pointer-events-none z-30 transform-gpu"
         >
            {[...Array(5)].map((_, i) => (
               <motion.div 
                  key={`particle-${i}`}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{ 
                     opacity: [0, 1, 0], 
                     y: -100 - Math.random() * 100, 
                     x: (Math.random() - 0.5) * 100 
                  }}
                  transition={{ 
                     duration: 2 + Math.random(), 
                     repeat: Infinity, 
                     delay: Math.random() * 2 
                  }}
                  className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-[#D4FF00] rounded-full shadow-[0_0_8px_#D4FF00] transform-gpu"
               />
            ))}
         </motion.div>
       )}
    </motion.div>
  );
}

const MobileAICore = () => {
  return (
    <div className="w-20 h-20 rounded-full border border-[#D4FF00]/20 flex items-center justify-center relative backdrop-blur-md bg-[#0C0C0D]/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
       <motion.div 
         animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
         className="absolute inset-0 bg-[#D4FF00]/10 rounded-full blur-xl" 
       />
       <motion.div 
         animate={{ rotate: 360 }}
         transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
         className="absolute inset-[-8px] border border-[#D4FF00]/20 rounded-full border-dashed" 
       />
       
       <div className="w-10 h-10 bg-[#D4FF00]/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,255,0,0.2)] border border-[#D4FF00]/30 relative overflow-hidden">
         <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-[#D4FF00]/20 blur-md" />
         <div className="w-4 h-4 bg-[#D4FF00] rounded-full relative z-10 shadow-[0_0_15px_#D4FF00]" />
       </div>
    </div>
  );
}