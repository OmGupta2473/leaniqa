import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  AnimatePresence,
  useInView,
  useMotionTemplate,
} from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Target,
  Flame,
  LineChart,
  CheckCircle2,
  Trophy,
  ArrowRight,
  TrendingDown,
  Sparkles
} from "lucide-react";

// Leaniqa Colors
const LIME = "#D4FF00";

/* ─────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

function GridCard({ feature, delay }: { feature: any; delay: number; key?: React.Key }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
      className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 flex flex-col hover:border-zinc-700 transition-colors min-h-[200px]"
    >
      <div className="flex justify-between items-start mb-10 sm:mb-16">
        <span style={{ transform: "translateZ(20px)" }} className="text-zinc-500 font-mono text-xs uppercase tracking-wider">
          {feature.subsystem}
        </span>
        <div style={{ transform: "translateZ(40px)" }} className="text-[#D4FF00]">
          <feature.icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-auto">
        <h3 style={{ transform: "translateZ(30px)" }} className="text-lg font-medium mb-3 text-zinc-100">
          {feature.title}
        </h3>
        <p style={{ transform: "translateZ(20px)" }} className="text-zinc-400 text-sm leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   PHONE FRAME
───────────────────────────────────────────── */
function PhoneFrame({
  children,
  // 1. Mobile width is now based on screen height (28dvh) so it never overflows vertically
  widthClass = "w-[clamp(160px,28dvh,180px)] md:w-[clamp(180px,16vw,260px)] lg:w-[clamp(200px,15vw,280px)]",
}: {
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className={`relative ${widthClass} aspect-[9/19.5] mx-auto`}>
      <div className="absolute inset-x-6 bottom-0 h-6 bg-[#0C0C0D]/80 blur-xl -z-10" />
      <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-[#1C1C1E] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] bg-[#0C0C0D] overflow-hidden ring-1 ring-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/40 pointer-events-none z-30" />
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-[2.5%] left-1/2 -translate-x-1/2 w-[35%] h-[4.2%] min-h-[16px] bg-black rounded-full z-50 border border-zinc-900 shadow-inner flex items-center justify-end px-1.5">
            <div className="w-[35%] max-w-[12px] aspect-square rounded-full bg-[#111112] border border-[#222] mr-1 flex items-center justify-center">
                <div className="w-[40%] aspect-square rounded-full bg-[#142036]" />
            </div>
        </div>
        
        {/* Status Bar: Time & Icons (Responsive using Container Queries 'cqw') */}
        <div className="absolute top-[3%] left-[7%] z-50 text-white font-semibold tracking-tight" style={{ fontSize: "clamp(10px, 4.5cqw, 15px)" }}>
            9:41
        </div>
        <div className="absolute top-[3%] right-[7%] flex items-center gap-1 z-50 w-[17%] justify-end">
           <svg className="w-[40%] h-auto text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21L23.6 7.6C23.1 7.2 18.6 4 12 4C5.4 4 0.9 7.2 0.4 7.6L12 21Z" />
           </svg>
           <svg className="w-[55%] h-auto text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM24 9H22V15H24V9Z" />
           </svg>
        </div>

        <div className="absolute inset-0 font-sans z-0" style={{ containerType: 'inline-size' }}>{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PHONE SCREENS
───────────────────────────────────────────── */

function AICoachScreen() {
  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden relative pt-[16%]">
      <div className="flex-1 p-[5%] flex flex-col justify-end gap-[4%] pb-[20%]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="self-end bg-white/10 rounded-2xl rounded-tr-sm px-[5%] py-[4%] max-w-[85%]"
        >
           <p className="text-white" style={{ fontSize: "clamp(9px, 3.5%, 14px)" }}>2 roti + 1 bowl dal + 100g paneer</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="self-start bg-[#1C1C1E] border border-white/10 rounded-2xl rounded-tl-sm px-[5%] py-[5%] max-w-[90%]"
        >
           <div className="flex items-center gap-[3%] mb-[6%]">
             <div className="w-[12%] aspect-square rounded-full bg-[#378ADD]/20 flex items-center justify-center">
               <Sparkles className="w-[60%] h-[60%] text-[#378ADD]" />
             </div>
             <span className="text-[#378ADD] font-semibold" style={{ fontSize: "clamp(8px, 3%, 12px)" }}>AI Coach</span>
           </div>
           <p className="text-white/90 mb-[6%] leading-relaxed" style={{ fontSize: "clamp(9px, 3.5%, 14px)" }}>Logged! Here is the breakdown:</p>
           
           <div className="bg-black/40 rounded-lg p-[5%] flex justify-between mb-[6%] border border-white/5">
              <div className="text-center flex-1">
                 <div className="text-white/50 uppercase tracking-wider mb-1" style={{ fontSize: "clamp(6px, 2.2%, 10px)" }}>Calories</div>
                 <div className="text-[#FF4D1C] font-bold" style={{ fontSize: "clamp(12px, 5%, 20px)" }}>480</div>
              </div>
              <div className="w-[1px] bg-white/10 mx-2" />
              <div className="text-center flex-1">
                 <div className="text-white/50 uppercase tracking-wider mb-1" style={{ fontSize: "clamp(6px, 2.2%, 10px)" }}>Protein</div>
                 <div className="text-[#D4FF00] font-bold" style={{ fontSize: "clamp(12px, 5%, 20px)" }}>28g</div>
              </div>
           </div>
           
           <p className="text-white/80 leading-relaxed" style={{ fontSize: "clamp(8.5px, 3.2%, 13px)" }}>You're 15g short on protein. I've adjusted your dinner target.</p>
        </motion.div>
      </div>
      
      <div className="absolute bottom-0 w-full p-[5%] border-t border-white/5 bg-[#1C1C1E]/90 backdrop-blur-md">
         <div className="bg-black rounded-full px-[5%] py-[3%] flex items-center justify-between border border-white/10">
            <span className="text-white/30" style={{ fontSize: "clamp(9px, 3.5%, 14px)" }}>Type your meal...</span>
            <div className="w-[12%] aspect-square bg-[#D4FF00] rounded-full flex items-center justify-center">
               <ArrowRight className="w-[50%] h-[50%] text-black" />
            </div>
         </div>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden pt-[16%]">
      <div className="flex items-center justify-between px-[6%] py-[6%] border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-[4%] w-full">
           <div style={{ width: "12%", aspectRatio: "1", borderRadius: "50%", background: "#D4FF00", display: "flex", alignItems: "center", justifyContent: "center", color: "black", fontWeight: "bold", fontSize: "clamp(8px, 3.5%, 14px)" }}>L</div>
           <div>
             <div className="text-white font-semibold" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>Today's Plan</div>
             <div className="text-white/40" style={{ fontSize: "clamp(7px, 2.5%, 11px)" }}>Thursday, Oct 12</div>
           </div>
           <div className="ml-auto bg-white/5 px-[4%] py-[2%] rounded-full flex items-center">
             <span className="text-[#FF4D1C] font-bold" style={{ fontSize: "clamp(8px, 3%, 12px)" }}>🔥 12</span>
           </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-[12%]">
         <div className="relative w-[50%] aspect-square flex items-center justify-center mb-[8%]">
             <svg className="absolute inset-0 w-full h-full transform -rotate-90">
               <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8%" />
               <motion.circle 
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 0.15 }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 cx="50%" cy="50%" r="42%" fill="none" stroke="#D4FF00" strokeWidth="8%" strokeLinecap="round"
               />
             </svg>
             <div className="text-center mt-2">
               <div className="font-bold text-white leading-none" style={{ fontSize: "clamp(24px, 10%, 40px)" }}>1,420</div>
               <div className="text-white/40 uppercase tracking-widest mt-1" style={{ fontSize: "clamp(6px, 2.5%, 10px)" }}>Eaten / 2200</div>
             </div>
         </div>
         
         <div className="flex justify-between w-[85%]">
             {[
               { name: 'Protein', val: '80g', col: '#378ADD', pct: '70%' },
               { name: 'Fat', val: '45g', col: '#FF4D1C', pct: '40%' },
               { name: 'Carbs', val: '120g', col: '#D4FF00', pct: '85%' }
             ].map((m, i) => (
               <div key={i} className="text-center w-[28%]">
                 <div className="uppercase text-white/40 tracking-wider mb-1" style={{ fontSize: "clamp(6px, 2.5%, 10px)" }}>{m.name}</div>
                 <div className="font-semibold text-white mb-2" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>{m.val}</div>
                 <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      style={{ backgroundColor: m.col }}
                      initial={{ width: "0%" }}
                      animate={{ width: m.pct }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                 </div>
               </div>
             ))}
         </div>
      </div>
      
      <div className="flex-1 px-[6%] pt-[2%]">
         <div className="bg-white/5 border border-white/5 rounded-xl p-[6%]">
            <div className="font-semibold text-white/50 uppercase tracking-wider mb-3" style={{ fontSize: "clamp(7px, 2.8%, 11px)" }}>Adjusted Target</div>
            <div className="text-[#D4FF00] font-semibold mb-1" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>Dinner: 450 kcal</div>
            <div className="text-white/70" style={{ fontSize: "clamp(8px, 3.2%, 13px)" }}>Must include 45g Protein</div>
         </div>
      </div>
    </div>
  );
}

function TimelineScreen() {
  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col p-[6%] pt-[16%]">
       <div className="flex items-center gap-2 mb-[8%] mt-[4%]">
         <LineChart className="text-[#D4FF00] w-[1em] h-[1em]" style={{ fontSize: "clamp(12px, 5%, 20px)" }} />
         <p className="text-white/80 font-semibold" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>
           Transformation
         </p>
       </div>
       
       <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-[6%] mb-[6%] shadow-lg">
          <div className="text-white/50 uppercase tracking-wider mb-[2%]" style={{ fontSize: "clamp(7px, 2.8%, 11px)" }}>Projected Weight</div>
          <div className="flex items-end gap-[4%]">
            <span className="text-white font-bold tracking-tight" style={{ fontSize: "clamp(28px, 12%, 48px)" }}>72.5<span className="text-white/40 font-normal ml-1" style={{ fontSize: "0.5em" }}>kg</span></span>
            <div className="flex items-center bg-[#D4FF00]/10 text-[#D4FF00] px-[3%] py-[1%] rounded-full mb-[2%]" style={{ fontSize: "clamp(8px, 3.2%, 13px)" }}>
               <TrendingDown className="w-[1em] h-[1em] mr-1" />
               12%
            </div>
          </div>
          <div className="text-white/40 mt-[4%]" style={{ fontSize: "clamp(7px, 2.8%, 11px)" }}>In 12 Weeks (Based on 85% compliance)</div>
       </div>
       
       <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-end p-[5%] mt-[2%]">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-[10%] opacity-20">
            {[1,2,3,4].map(i => <div key={i} className="w-full h-[1px] bg-white/20" />)}
          </div>
          
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
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>
          <motion.div 
            className="absolute bg-[#D4FF00] rounded-full border-2 border-[#1C1C1E] shadow-[0_0_15px_#D4FF00]"
            style={{ width: "8%", aspectRatio: "1", right: "0%", bottom: "10%", x: "50%", y: "50%" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
          />
       </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMATED PHONE
───────────────────────────────────────────── */
function PremiumPhone({ scrollYProgress }: { scrollYProgress: any }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 25 });

  const scrollFloatY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ y: scrollFloatY, rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      <PhoneFrame>
        <PhoneScreen layerIndex={0} scrollYProgress={scrollYProgress}>
          <AICoachScreen />
        </PhoneScreen>
        <PhoneScreen layerIndex={1} scrollYProgress={scrollYProgress}>
          <DashboardScreen />
        </PhoneScreen>
        <PhoneScreen layerIndex={2} scrollYProgress={scrollYProgress}>
          <TimelineScreen />
        </PhoneScreen>
      </PhoneFrame>
    </motion.div>
  );
}

function getScrollRanges(index, total) {
  // We divide the scroll space into equal segments based on the number of items.
  // For 3 items, the segments are 0.5 long (0 to 0.5, and 0.5 to 1.0).
  const segment = 1 / (total - 1);
  
  // Calculate the exact center points where the crossfades should happen
  const transitionCenter = (index + 0.5) * segment; 
  const prevTransitionCenter = (index - 0.5) * segment; 
  
  // Define how wide the crossfade should be (25% of a segment gives a buttery smooth overlap)
  const fadeWidth = segment * 0.25; 

  let input = [];
  let opacity = [];
  let y = [];
  let blur = [];
  let scale = [];

  if (index === 0) {
    // 1st Item: Starts fully visible, then fades out during its transition center
    input = [0, transitionCenter - fadeWidth, transitionCenter + fadeWidth];
    opacity = [1, 1, 0];
    y = [0, 0, -40];
    blur = [0, 0, 8];
    scale = [1, 1, 1.05];
  } else if (index === total - 1) {
    // Last Item: Fades in during the previous transition center, stays fully visible to the end
    input = [prevTransitionCenter - fadeWidth, prevTransitionCenter + fadeWidth, 1];
    opacity = [0, 1, 1];
    y = [40, 0, 0];
    blur = [8, 0, 0];
    scale = [0.95, 1, 1];
  } else {
    // Middle Items: Fades in, stays fully visible for a bit, then fades out
    input = [
      prevTransitionCenter - fadeWidth, // Start fade in
      prevTransitionCenter + fadeWidth, // Fully visible
      transitionCenter - fadeWidth,     // Start fade out
      transitionCenter + fadeWidth      // Fully hidden
    ];
    opacity = [0, 1, 1, 0];
    y = [40, 0, 0, -40];
    blur = [8, 0, 0, 8];
    scale = [0.95, 1, 1, 1.05];
  }

  return { input, opacity, y, blur, scale };
}

function PhoneScreen({ children, layerIndex, scrollYProgress }: { children: React.ReactNode, layerIndex: number, scrollYProgress: any }) {
  const { input, opacity: opacityOut, blur: blurOut, scale: scaleOut } = getScrollRanges(layerIndex, STORY.length);

  const opacity = useTransform(scrollYProgress, input, opacityOut);
  const scale = useTransform(scrollYProgress, input, scaleOut);
  const blurVal = useTransform(scrollYProgress, input, blurOut);
  const filter = useMotionTemplate`blur(${blurVal}px)`;
  
  const peak = layerIndex / (STORY.length - 1);
  const pointerEvents = useTransform(scrollYProgress, (v: number) => Math.abs(v - peak) < 0.15 ? "auto" : "none");

  return (
    <motion.div
      style={{ opacity, filter, scale, pointerEvents, transformOrigin: "center" }}
      className="absolute inset-0 w-full h-full bg-[#0C0C0D] overflow-hidden rounded-[1.8rem] z-10"
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   STORY CONTENT
───────────────────────────────────────────── */
const STORY = [
  {
    title: "Just type what you ate.",
    subtitle: "Stop searching databases and guessing portion sizes. LeanIQA uses advanced AI to instantly parse natural language into precise macronutrients.",
  },
  {
    title: "Adaptive Targets.",
    subtitle: "Overate at lunch? Traditional apps treat it as a failure. LeanIQA recalculates the rest of your day, showing you exactly how to bounce back.",
  },
  {
    title: "See your future body.",
    subtitle: "LeanIQA predicts your physical transformation based on your actual compliance, not just a theoretical formula. Stay on track, and watch the timeline unfold.",
  },
];

/* ─────────────────────────────────────────────
   STICKY SCROLL
───────────────────────────────────────────── */
function MobilePhoneReveal({ step }: { step: number }) {
  const [hasEntered, setHasEntered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      onViewportEnter={() => setHasEntered(true)}
      transition={{ duration: 0.6 }}
      className="flex justify-center"
    >
      <PhoneFrame>
        {hasEntered && (
           <>
             {step === 0 && <AICoachScreen />}
             {step === 1 && <DashboardScreen />}
             {step === 2 && <TimelineScreen />}
           </>
        )}
      </PhoneFrame>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE STORY (Updated for Single-Screen View)
───────────────────────────────────────────── */
function MobileStory() {
  return (
    <div className="lg:hidden flex flex-col">
      {STORY.map((step, i) => (
        // Each block now takes up exactly one screen height minimum
        <div key={i} className="min-h-[100dvh] flex flex-col px-6 pt-24 pb-12">
          
          {/* Top Text Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-3xl sm:text-4xl font-semibold leading-[1.1] text-zinc-50 tracking-tight">
              {step.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
              {step.subtitle}
            </p>
          </motion.div>
          
          {/* Bottom Phone Section - Centered in remaining space */}
          <div className="flex-1 flex items-center justify-center">
            <MobilePhoneReveal step={i} />
          </div>

        </div>
      ))}
    </div>
  );
}
function StoryTextItem({ step, index, scrollYProgress }: { step: any, index: number, scrollYProgress: any }) {
  const { input, opacity: opacityOut, y: yOut, blur: blurOut } = getScrollRanges(index, STORY.length);

  const opacity = useTransform(scrollYProgress, input, opacityOut);
  const y = useTransform(scrollYProgress, input, yOut);
  const blurVal = useTransform(scrollYProgress, input, blurOut);
  const filter = useMotionTemplate`blur(${blurVal}px)`;
  
  const peak = index / (STORY.length - 1);
  const pointerEvents = useTransform(scrollYProgress, (v: number) => Math.abs(v - peak) < 0.1 ? "auto" : "none");

  return (
    <motion.div
      style={{ opacity, y, filter, pointerEvents }}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 pr-8"
    >
      <h3 className="text-4xl lg:text-5xl xl:text-6xl font-semibold leading-[1.1] text-zinc-50 tracking-tight">
        {step.title}
      </h3>
      <p className="mt-6 text-lg text-zinc-400 leading-relaxed max-w-md">
        {step.subtitle}
      </p>
    </motion.div>
  );
}

function DesktopStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="hidden lg:block relative w-full h-[400vh]">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-16 flex items-center justify-between">
          
          <div className="w-1/2 relative h-[300px]">
            {STORY.map((step, i) => (
              <StoryTextItem
                key={i}
                step={step}
                index={i}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          <div className="w-1/2 flex items-center justify-center" style={{ perspective: "1200px" }}>
            <PremiumPhone scrollYProgress={scrollYProgress} />
          </div>
          
        </div>
      </div>
    </div>
  );
}

function StickyScrollFeatures() {
  return (
    <section className="bg-[#0A0A0B] text-zinc-50 border-t border-zinc-900">
      <DesktopStory />
      <MobileStory />
    </section>
  );
}

/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  
  const handleEnterApp = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-50 font-sans selection:bg-[#D4FF00] selection:text-black overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-[#0A0A0B]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#D4FF00] rounded-sm flex items-center justify-center">
               <span className="text-black text-xs font-bold">L</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">LeanIQA</span>
          </div>
          <button
            onClick={handleEnterApp}
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] text-xs font-mono mb-6 rounded-full uppercase tracking-wider"
            >
              <Sparkles size={14} /> AI Body Transformation Coach
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.1] lg:leading-[1.05] mb-4 sm:mb-6"
            >
              Your body adapts every day. Your nutrition coach should too.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-8 sm:mb-10 leading-relaxed max-w-lg"
            >
              Eat smarter. Stay consistent. Transform with confidence. The only system that uses AI to adapt to your life, not the other way around.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <button
                onClick={handleEnterApp}
                className="bg-[#D4FF00] text-black w-full sm:w-auto px-6 sm:px-8 py-4 font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide rounded-full"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[#D4FF00] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.15] pointer-events-none" />
        <div className="absolute bottom-1/4 left-[10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-[#378ADD] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.1] pointer-events-none" />
      </section>

      {/* ── Storytelling ── */}
      <StickyScrollFeatures />

      {/* ── Features grid ── */}
      <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0C0C0D]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Intelligence that drives consistency.</h2>
            <p className="text-zinc-400 text-sm sm:text-base">People don't fail because they lack motivation. They fail because rigid plans break when real life happens. LeanIQA fixes this.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {[
              { subsystem: "Natural Language",   icon: MessageSquare, title: "AI Meal Parsing",               desc: "Describe your meal in plain English or Hinglish. We handle the exact calorie and macro calculations instantly." },
              { subsystem: "Dynamic Adjustments", icon: Target,  title: "Adaptive Recovery",                desc: "Missed your protein goal or went over on carbs? The AI automatically adjusts your upcoming meals to keep you on track." },
              { subsystem: "Accountability", icon: CheckCircle2, title: "Compliance Scoring",                desc: "A realistic 0-100 score of how well you hit your targets. Progress over perfection. We measure habits, not just numbers." },
              { subsystem: "Forecasting",   icon: LineChart,  title: "Physique Timeline",            desc: "Watch your future unfold. We project your weight and body composition based on your actual adherence rate." },
              { subsystem: "Motivation", icon: Flame, title: "Daily Streaks",        desc: "Build unbreakable momentum. Our system is engineered to help you never miss twice." },
              { subsystem: "Gamification", icon: Trophy, title: "Achievement Awards", desc: "Unlock milestones for consistency, high-protein days, and perfect adherence. Celebrate every step of your journey." },
            ].map((feature, i) => (
              <GridCard key={i} feature={feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-zinc-900 bg-[#0A0A0B] py-16 sm:py-24 px-6">
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: -2, marginBottom: 12, color: "#F1F5F9" }}>
                Invest in your consistency.
              </h2>
              <p style={{ fontSize: 16, color: "#64748B", maxWidth: 600, margin: "0 auto" }}>
                Simple pricing. No hidden fees. Unlock the full power of your AI Coach.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, maxWidth: 800, margin: "0 auto" }}>
            {[
              { name: "Starter", price: "Free",   sub: "Basic tracking forever", accent: "#378ADD", features: ["Manual calorie tracking","Basic macro splits","Standard food database"], missing: ["AI Meal Parsing","Adaptive Targets", "Timeline Predictions"], badge: null, delay: 0 },
              { name: "Pro",  price: "₹499",   sub: "per month", accent: LIME,     features: ["Unlimited AI Meal Logging","Adaptive Calorie & Macro Targets","Consistency Engine & Analytics","Physique Prediction Timeline","Priority Support"], missing: [], badge: "Most Popular", delay: 0.1 },
            ].map((p, i) => (
              <Reveal key={i} delay={p.delay}>
                <div
                  style={{
                    background: p.badge ? "rgba(212,255,0,0.04)" : "rgba(255,255,255,0.02)",
                    border: p.badge ? `2px solid ${LIME}40` : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 24, padding: "32px 24px",
                    boxShadow: p.badge ? `0 0 60px ${LIME}10` : "none",
                    transition: "transform 0.2s", position: "relative", overflow: "hidden", height: "100%",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {p.badge && (
                    <div style={{ position: "absolute", top: 0, right: 0, background: LIME, color: "#020817", fontSize: 10, fontWeight: 800, padding: "6px 16px", borderRadius: "0 22px 0 16px", letterSpacing: 1, textTransform: "uppercase" }}>
                      {p.badge}
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{p.name}</div>
                  <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, color: "#F1F5F9", lineHeight: 1 }}>{p.price}</div>
                  <div style={{ fontSize: 14, color: "#64748B", marginTop: 8, marginBottom: 32 }}>{p.sub}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                    {p.features.map((f, j) => (
                      <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ color: p.accent, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
                        <span style={{ fontSize: 14, color: "#94A3B8" }}>{f}</span>
                      </div>
                    ))}
                    {p.missing.map((f, j) => (
                      <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", opacity: 0.35 }}>
                        <span style={{ color: "#475569", fontSize: 14, flexShrink: 0, marginTop: 2 }}>✗</span>
                        <span style={{ fontSize: 14, color: "#475569", textDecoration: "line-through" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleEnterApp}
                    style={{
                      width: "100%", padding: "14px 0",
                      background: p.badge ? LIME : "transparent",
                      border: p.badge ? "none" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 99, color: p.badge ? "#000" : "#94A3B8",
                      fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { if (!p.badge) { e.currentTarget.style.borderColor = p.accent; e.currentTarget.style.color = "#F1F5F9"; } }}
                    onMouseLeave={e => { if (!p.badge) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94A3B8"; } }}
                  >
                    {p.price === "Free" ? "Get started free" : "Start free trial"}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-32 px-6 border-t border-zinc-900 bg-[#0A0A0B] text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
           <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-[#FF4D1C]/10 via-[#378ADD]/5 to-[#D4FF00]/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 tracking-tight leading-[1.1]">
            The hardest part isn't losing fat. It's staying consistent.
          </h2>
          <p className="text-[#D4FF00] mb-10 text-lg sm:text-xl font-medium">
            LeanIQA helps you do both.
          </p>
          <button
            onClick={handleEnterApp}
            className="bg-white text-black px-8 py-4 font-semibold hover:bg-[#D4FF00] transition-all inline-flex items-center gap-2 text-sm uppercase tracking-wide rounded-full hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            Start Your Journey <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-zinc-500 text-xs flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-center md:text-left">
        <div className="flex items-center gap-2">
           <div className="w-5 h-5 bg-[#D4FF00] rounded-sm flex items-center justify-center">
             <span className="text-black text-[10px] font-bold">L</span>
           </div>
           <span className="font-semibold text-zinc-400 text-sm">LeanIQA</span>
        </div>
        <p className="text-sm">© 2026 LeanIQA · Transforming bodies with AI</p>
      </footer>
    </div>
  );
}
