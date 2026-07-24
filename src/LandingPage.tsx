import { Logo } from "@/shared/components/Logo";
import React, { useRef, useState, useEffect } from "react";
import { InstallLeaniqa } from "@/components/InstallLeaniqa";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useInView,
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
  Sparkles,
  Home,
  Search,
  Plus,
  Play,
  User,
  Shield,
  Clock,
  Calendar,
  ChevronRight,
  Star,
  BarChart3,
  Zap,
  Award,
  Users,
  TrendingUp,
Loader2, Check, ClipboardList, BarChart2, Dumbbell, Activity, Droplets, Brain, ShieldCheck, Lock, X, CalendarHeart, RotateCcw} from "lucide-react";

// Leaniqa Colors
const LIME = "#D4FF00";


// Animated number counter for social proof stats
function useAnimatedCounter(target: number, duration = 1600, trigger = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out-quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, trigger]);
  return value;
}

function SocialProofBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const users   = useAnimatedCounter(10000, 1600, inView);
  const score   = useAnimatedCounter(49,    1400, inView); // displayed as 4.9
  const percent = useAnimatedCounter(100,   1200, inView); 

  const stats = [
    { value: `${(users / 1000).toFixed(0)}K+`, label: "ACTIVE USERS",             color: "#D4FF00", icon: Users },
    { value: `${(score / 10).toFixed(1)}★`,     label: "USER RATING",              color: "#D4FF00", icon: Star },
    { value: `${percent}%`,                     label: "PERSONALIZED PLANS",       color: "#D4FF00", icon: CheckCircle2 },
    { value: "24/7",                            label: "AI COACH",                 color: "#D4FF00", icon: MessageSquare },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            Trusted by <span style={{ color: "#D4FF00" }}>Thousands</span>. Built for <span style={{ color: "#D4FF00" }}>Results</span>.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            LeanIQA is your AI-powered fitness companion for a smarter, healthier you.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4 max-w-6xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#111112] border border-zinc-800/60 rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-3 sm:gap-4"
              style={{ background: "linear-gradient(145deg, rgba(17,17,18,1) 0%, rgba(212,255,0,0.03) 100%)" }}
            >
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 lg:w-16 lg:h-16 rounded-[14px] sm:rounded-2xl flex items-center justify-center bg-[rgba(212,255,0,0.08)] border border-[rgba(212,255,0,0.15)] shadow-[0_0_20px_rgba(212,255,0,0.1)]">
                <s.icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 text-[#D4FF00]" />
              </div>
              <div className="flex flex-col justify-center h-full pt-1 lg:pt-2">
                <div
                  className="text-xl sm:text-3xl lg:text-3xl font-bold tracking-tight mb-1 sm:mb-2"
                  style={{ color: s.color, fontVariantNumeric: "tabular-nums" }}
                >
                  {s.value}
                </div>
                <div className="w-6 sm:w-8 h-[2px] bg-[#D4FF00] mb-1.5 sm:mb-2 mx-auto xl:mx-0 opacity-80" />
                <div className="text-[10px] sm:text-xs lg:text-sm text-zinc-300 font-medium uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DisciplineAdvantage() {
  const battles = [
    {
      icon: ClipboardList,
      other: {
        title: "Passive food diary",
        desc: "You log, it stores.",
        demo: (
          <div className="bg-[#18181A] rounded-xl border border-white/5 p-3 mt-3 shadow-inner">
             <div className="flex items-center gap-2 text-zinc-500 mb-4 text-xs bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                <Search className="w-4 h-4" /> Search food
             </div>
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">🍛</div>
                  <div>
                    <div className="text-sm font-medium text-zinc-300">Paneer Butter Masala</div>
                    <div className="text-[10px] text-zinc-500">1 bowl • 450 kcal</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">🫓</div>
                  <div>
                    <div className="text-sm font-medium text-zinc-300">Roti</div>
                    <div className="text-[10px] text-zinc-500">2 pieces • 240 kcal</div>
                  </div>
               </div>
             </div>
          </div>
        )
      },
      leaniqa: {
        title: "Active AI coaching",
        desc: "It scores, adjusts, and coaches.",
        demo: (
          <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-3 mt-3 relative overflow-hidden shadow-xl shadow-[#D4FF00]/5">
             <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5 font-medium">
               <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]"/> AI Coach
             </div>
             <div className="flex items-start justify-between gap-4">
               <div className="flex-1">
                 <div className="bg-[#18181A] p-3 rounded-lg border border-white/5 text-xs text-zinc-300 leading-relaxed mb-2 inline-block rounded-tl-sm">
                   Great choice! But you're<br/> 12g protein short.<br/> Add any one:
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-medium bg-[#D4FF00]/10 text-[#D4FF00] px-2.5 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 transition-colors cursor-pointer">Moong Dal</span>
                    <span className="text-[10px] font-medium bg-[#D4FF00]/10 text-[#D4FF00] px-2.5 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 transition-colors cursor-pointer">Greek Yogurt</span>
                    <span className="text-[10px] font-medium bg-[#D4FF00]/10 text-[#D4FF00] px-2.5 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 transition-colors cursor-pointer">Paneer</span>
                 </div>
               </div>
               <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-zinc-950 rounded-full border border-white/5">
                 <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(212,255,0,0.3)]" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4FF00" strokeWidth="3" strokeDasharray="91, 100" />
                 </svg>
                 <div className="text-center relative z-10">
                   <div className="text-[8px] text-zinc-500 mb-0.5 leading-none font-medium">Today's<br/>Score</div>
                   <div className="text-lg font-bold text-white leading-none tracking-tight">91</div>
                 </div>
               </div>
             </div>
             
             <div className="mt-5 pt-4 border-t border-white/5">
               <div className="flex items-center justify-between text-[10px] font-medium mb-2">
                  <span className="text-zinc-400">Protein</span>
                  <span className="text-zinc-300">88 / 100g</span>
               </div>
               <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                  <div className="h-full bg-[#D4FF00] rounded-full w-[88%] shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
               </div>
             </div>
          </div>
        )
      }
    },
    {
      icon: BarChart2,
      other: {
        title: "Shows calories",
        desc: "No context on whether it's enough.",
        demo: (
          <div className="bg-[#18181A] rounded-xl border border-white/5 p-3 mt-3 shadow-inner">
            <div className="text-xs font-medium text-zinc-500 mb-4 pb-3 border-b border-white/5">Nutrition Overview</div>
            <div className="grid grid-cols-3 gap-2">
               <div className="text-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 mb-1">Calories</div>
                  <div className="text-lg font-bold text-zinc-300">1780</div>
                  <div className="text-[9px] text-zinc-600">kcal</div>
               </div>
               <div className="text-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 mb-1">Protein</div>
                  <div className="text-lg font-bold text-zinc-300">65</div>
                  <div className="text-[9px] text-zinc-600">g</div>
               </div>
               <div className="text-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-zinc-500 mb-1">Carbs</div>
                  <div className="text-lg font-bold text-zinc-300">210</div>
                  <div className="text-[9px] text-zinc-600">g</div>
               </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] mb-2 font-medium">
                <span className="text-zinc-500">Calories</span>
                <span className="text-zinc-600">1780 / 2100 kcal</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full border border-white/5 overflow-hidden">
                <div className="h-full bg-zinc-600 rounded-full w-[85%]" />
              </div>
            </div>
          </div>
        )
      },
      leaniqa: {
        title: "Daily Score that matters",
        desc: "Focus on compliance, not just calories.",
        demo: (
          <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-3 mt-3 shadow-xl shadow-[#D4FF00]/5">
             <div className="flex items-center gap-6">
               <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center bg-zinc-950 rounded-full border border-white/5">
                 <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(212,255,0,0.4)]" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4FF00" strokeWidth="4" strokeDasharray="91, 100" strokeLinecap="round" />
                 </svg>
                 <div className="text-center relative z-10">
                   <div className="text-[9px] text-zinc-400 mb-0.5 leading-none font-medium">Today's<br/>Score</div>
                   <div className="text-3xl font-bold text-white leading-none tracking-tighter">91</div>
                   <div className="text-[9px] text-zinc-500 mt-1 font-mono">/100</div>
                 </div>
               </div>
               
               <div className="flex-1 space-y-3.5">
                 <div>
                   <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
                     <span className="text-orange-400/90 flex items-center gap-1.5"><Flame className="w-3 h-3"/> Calories</span>
                     <span className="text-zinc-300">1780 / 2100g</span>
                   </div>
                   <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-orange-400/90 rounded-full w-[85%] shadow-[0_0_8px_rgba(251,146,60,0.5)]"/></div>
                 </div>
                 <div>
                   <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
                     <span className="text-[#D4FF00]/90 flex items-center gap-1.5"><Dumbbell className="w-3 h-3"/> Protein</span>
                     <span className="text-zinc-300">88 / 100g</span>
                   </div>
                   <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-[#D4FF00]/90 rounded-full w-[88%] shadow-[0_0_8px_rgba(212,255,0,0.5)]"/></div>
                 </div>
                 <div>
                   <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
                     <span className="text-blue-400/90 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Steps</span>
                     <span className="text-zinc-300">8,432 / 10K</span>
                   </div>
                   <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-blue-400/90 rounded-full w-[84%] shadow-[0_0_8px_rgba(96,165,250,0.5)]"/></div>
                 </div>
                 <div>
                   <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
                     <span className="text-cyan-400/90 flex items-center gap-1.5"><Droplets className="w-3 h-3"/> Water</span>
                     <span className="text-zinc-300">2.4 / 3 L</span>
                   </div>
                   <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-cyan-400/90 rounded-full w-[80%] shadow-[0_0_8px_rgba(34,211,238,0.5)]"/></div>
                 </div>
               </div>
             </div>
             
             <div className="mt-3 pt-2 border-t border-white/5 flex items-start gap-2.5 bg-[#D4FF00]/5 -mx-4 -mb-4 p-4">
               <Star className="w-4 h-4 text-[#D4FF00] mt-0.5 flex-shrink-0" />
               <div>
                 <div className="text-xs text-[#D4FF00] font-medium mb-0.5">You're doing great!</div>
                 <div className="text-[10px] text-zinc-400">Keep your protein above 90g tomorrow.</div>
               </div>
             </div>
          </div>
        )
      }
    },
    {
      icon: Calendar,
      other: {
        title: "Generic goal",
        desc: "Vague goal of losing weight someday.",
        demo: (
          <div className="bg-[#18181A] rounded-xl border border-white/5 p-4 mt-3 shadow-inner">
             <div className="bg-zinc-900/50 p-4 rounded-lg border border-white/5">
               <div className="text-[10px] font-medium text-zinc-500 mb-1">Goal</div>
               <div className="text-sm font-semibold text-zinc-300 mb-5 flex items-center justify-between">
                  Lose Weight
                  <Target className="w-4 h-4 text-zinc-600" />
               </div>
               
               <div className="text-[10px] font-medium text-zinc-500 mb-1">Target Weight</div>
               <div className="text-xl font-bold text-zinc-300 mb-5">55 kg</div>
               
               <div className="h-px bg-zinc-800 w-full mb-4" />
               <div className="text-[10px] text-zinc-600 italic">No specific deadline</div>
             </div>
          </div>
        )
      },
      leaniqa: {
        title: "Exact goal. Real timeline.",
        desc: "Calculated from your real adherence.",
        demo: (
          <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-3 mt-3 shadow-xl shadow-[#D4FF00]/5">
             <div className="flex items-center justify-between mb-4 px-2">
               <div>
                 <div className="text-[10px] text-zinc-500 font-medium mb-1">Starting</div>
                 <div className="text-sm font-semibold text-zinc-300">62.0 kg</div>
                 <div className="text-[10px] text-zinc-500 mt-1">Today</div>
               </div>
               <div className="text-center bg-[#D4FF00]/10 px-4 py-2 rounded-xl border border-[#D4FF00]/20">
                 <div className="text-[10px] text-[#D4FF00] font-medium mb-1">Goal</div>
                 <div className="text-2xl font-bold text-[#D4FF00] tracking-tight">55.0 <span className="text-sm">kg</span></div>
               </div>
               <div className="text-right">
                 <div className="text-[10px] text-zinc-500 font-medium mb-1">Expected</div>
                 <div className="text-sm font-semibold text-white">Nov 28, 2024</div>
                 <div className="text-[10px] text-zinc-500 mt-1">12 weeks</div>
               </div>
             </div>
             
             <div className="relative mt-5 mb-4 px-2">
               <div className="h-2 w-full bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-[#D4FF00]/80 to-[#D4FF00] w-[20%] rounded-full shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
               </div>
               <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(212,255,0,0.4)] border-[3px] border-[#D4FF00] z-10" />
               
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-600 rounded-full" />
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-800 rounded-full" />
             </div>
             
             <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2.5 bg-[#D4FF00]/5 -mx-4 -mb-4 p-4">
               <Target className="w-4 h-4 text-[#D4FF00] mt-0.5 flex-shrink-0" />
               <div>
                 <div className="text-xs text-[#D4FF00] font-medium mb-0.5">You're on track!</div>
                 <div className="text-[10px] text-zinc-400">Keep your score above 85 to hit your goal.</div>
               </div>
             </div>
          </div>
        )
      }
    }
  ];

  return (
    <section className="py-10 sm:py-16 px-6 bg-[#0A0A0B] overflow-hidden" id="discipline">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 md:mb-16 max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" />
              WHY LEANIQA
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6 leading-tight">
              Most apps are food diaries.<br/>
              Leaniqa is a <span className="text-[#D4FF00]">discipline engine.</span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed mx-auto">
              People don't fail transformations because they lack information.<br className="hidden sm:block"/>
              They fail because rigid plans break when real life happens.<br className="hidden sm:block"/>
              <span className="text-zinc-300 font-medium">Leaniqa is built around that reality.</span>
            </p>
          </Reveal>
        </div>

        {/* Labels for Desktop */}
        <div className="hidden md:flex justify-between max-w-4xl mx-auto mb-6 px-8 relative z-10">
           <div className="w-[47%] flex justify-center">
             <div className="px-5 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest shadow-lg backdrop-blur-sm">
               OTHER APPS
             </div>
           </div>
           <div className="w-[47%] flex justify-center">
             <div className="px-5 py-2 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[10px] sm:text-xs font-semibold text-[#D4FF00] uppercase tracking-widest shadow-[0_0_20px_rgba(212,255,0,0.1)] backdrop-blur-sm">
               LEANIQA
             </div>
           </div>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Center vertical dashed line for desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-zinc-800 -translate-x-1/2 z-0" />
          
          <div className="space-y-4 md:space-y-6 relative z-10">
            {battles.map((b, i) => (
              <div key={i} className="relative flex flex-col md:flex-row items-stretch gap-8 md:gap-0">
                 
                 {/* Connecting horizontal lines for center icon */}
                 <div className="hidden md:block absolute left-[45%] right-[50%] top-1/2 -translate-y-1/2 h-px border-b border-dashed border-zinc-800 z-0" />
                 <div className="hidden md:block absolute left-[50%] right-[45%] top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-[#D4FF00]/50 to-transparent z-0" />

                 {/* Center Icon */}
                 <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0A0A0B] border border-zinc-700 items-center justify-center z-20 text-zinc-500 shadow-xl group hover:border-[#D4FF00] hover:text-[#D4FF00] transition-colors duration-300 cursor-default">
                    <b.icon className="w-5 h-5 transition-colors duration-300" />
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-[#D4FF00]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 </div>
                 
                 {/* Arrow pointing right from the center icon */}
                 <div className="hidden md:block absolute left-[calc(50%+24px)] top-1/2 -translate-y-1/2 text-[#D4FF00] z-20">
                   <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                 </div>

                 {/* Other Apps (Left) */}
                 <div className="w-full md:w-[47%] flex flex-col">
                   <div className="md:hidden flex justify-center mb-4">
                     <div className="px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest inline-flex items-center gap-2">
                       <X className="w-3 h-3 text-red-500" /> OTHER APPS
                     </div>
                   </div>
                   <Reveal delay={i * 0.1} className="flex-1">
                     <div className="bg-gradient-to-br from-[#111112] to-[#0A0A0B] rounded-2xl p-4 md:p-5 border border-zinc-800/80 h-full flex flex-col hover:border-zinc-700 transition-colors duration-300 shadow-xl shadow-black/50">
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 flex-shrink-0">
                           <X className="w-3 h-3 text-red-500" />
                         </div>
                         <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{b.other.title}</h3>
                       </div>
                       <p className="text-zinc-400 text-[11px] md:text-xs ml-9">{b.other.desc}</p>
                       
                       <div className="mt-auto pt-4">
                         {b.other.demo}
                       </div>
                     </div>
                   </Reveal>
                 </div>

                 {/* Spacer for center icon */}
                 <div className="hidden md:block w-[8%] relative z-10" />

                 {/* Leaniqa (Right) */}
                 <div className="w-full md:w-[47%] flex flex-col">
                   <div className="md:hidden flex justify-center mt-6 mb-4 relative z-10">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200%] w-px h-8 bg-gradient-to-b from-transparent to-[#D4FF00]/50" />
                     <div className="px-4 py-1.5 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[10px] font-semibold text-[#D4FF00] uppercase tracking-widest inline-flex items-center gap-2">
                       <Check className="w-3 h-3" /> LEANIQA
                     </div>
                   </div>
                   <Reveal delay={i * 0.1 + 0.1} className="flex-1">
                     <div className="bg-gradient-to-b from-[#111112] to-[#0A0A0B] rounded-2xl p-4 md:p-5 border border-[#D4FF00]/30 h-full relative group overflow-hidden flex flex-col hover:border-[#D4FF00]/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,255,0,0.1)]">
                       <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                       
                       {/* Shimmer effect */}
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                       
                       <div className="relative z-10 flex flex-col h-full">
                         <div className="flex items-center gap-3 mb-2">
                           <div className="w-6 h-6 rounded-full bg-[#D4FF00] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.4)] flex-shrink-0">
                             <Check className="w-3 h-3 text-black font-bold" />
                           </div>
                           <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{b.leaniqa.title}</h3>
                         </div>
                         <p className="text-zinc-300 text-[11px] md:text-xs ml-9">{b.leaniqa.desc}</p>
                         
                         <div className="mt-auto pt-4">
                           {b.leaniqa.demo}
                         </div>
                       </div>
                     </div>
                   </Reveal>
                 </div>
                 
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Feature Grid */}
        <Reveal>
          <div className="mt-10 md:mt-12 max-w-4xl mx-auto border border-zinc-800/80 rounded-2xl bg-gradient-to-b from-[#111112] to-[#0A0A0B] p-8 md:p-10 shadow-2xl">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
               <div className="flex items-start md:items-center gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <Brain className="w-6 h-6 text-[#D4FF00]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-1 tracking-tight">AI-Powered</div>
                    <div className="text-xs text-zinc-500">Learns from you</div>
                  </div>
               </div>
               <div className="flex items-start md:items-center gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-[#D4FF00]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-1 tracking-tight">Realistic Plans</div>
                    <div className="text-xs text-zinc-500">Built for real life</div>
                  </div>
               </div>
               <div className="flex items-start md:items-center gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-[#D4FF00]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-1 tracking-tight">Tracks What Matters</div>
                    <div className="text-xs text-zinc-500">Score, not just calories</div>
                  </div>
               </div>
               <div className="flex items-start md:items-center gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <Lock className="w-6 h-6 text-[#D4FF00]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-1 tracking-tight">Privacy First</div>
                    <div className="text-xs text-zinc-500">Your data is yours</div>
                  </div>
               </div>
             </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Target,
      title: "Define Your Goal",
      desc: "Input your weight, body fat %, and goal. LeanIQA calculates your deficit, macro targets, and a precise completion date.",
      demo: (
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5 mt-3 group-hover:border-[#D4FF00]/30 transition-colors duration-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-medium">Goal Weight</span>
            <span className="text-[10px] text-[#D4FF00] flex items-center gap-1"><Sparkles className="w-2.5 h-2.5"/> AI Calculated</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-zinc-300 line-through opacity-50">62kg</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
            <span className="text-2xl font-bold text-white">55kg</span>
          </div>
        </div>
      )
    },
    {
      number: "02",
      icon: MessageSquare,
      title: "Describe Any Meal Naturally",
      desc: "Type '2 roti + dal + 100g paneer'. AI parses it instantly — no barcode scanning, no database hunting.",
      demo: (
        <div className="mt-3 flex flex-col gap-2">
          <div className="bg-[#D4FF00]/10 border border-[#D4FF00]/20 rounded-xl rounded-tr-sm p-2.5 text-xs text-[#D4FF00] self-end max-w-[90%] group-hover:bg-[#D4FF00]/20 transition-colors duration-500">
            2 Roti, Dal, 100g Paneer
          </div>
          <div className="bg-zinc-800/50 border border-white/5 rounded-xl rounded-tl-sm p-2.5 text-[10px] text-zinc-300 self-start max-w-[90%] shadow-lg">
            <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/5">
              <CheckCircle2 className="w-2.5 h-2.5 text-[#D4FF00]" />
              <span className="font-semibold text-white">Parsed</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-zinc-500 mb-0.5">Cal</div><div className="font-medium text-white">450</div></div>
              <div><div className="text-zinc-500 mb-0.5">Pro</div><div className="font-medium text-white">28g</div></div>
              <div><div className="text-zinc-500 mb-0.5">Carb</div><div className="font-medium text-white">45g</div></div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Your AI Coaches Every Decision",
      desc: "Receive a Daily Score (0–100) based on compliance. The app recalibrates your remaining meals in real time.",
      demo: (
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5 mt-3 group-hover:border-[#D4FF00]/30 transition-colors duration-500">
           <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-400 font-medium">Today's Score</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D4FF00]/10 text-[#D4FF00]">Excellent</span>
          </div>
          <div className="flex items-end gap-1 mb-2">
             <span className="text-3xl font-bold text-white leading-none">91</span>
             <span className="text-xs text-zinc-500 mb-1">/100</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4FF00] rounded-full w-[91%]" />
          </div>
        </div>
      )
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "See Your Body Change Week by Week",
      desc: "Your physique timeline updates based on your actual adherence. Stay consistent, and your goal date moves closer.",
      demo: (
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5 mt-3 relative overflow-hidden group-hover:border-[#D4FF00]/30 transition-colors duration-500">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
           <div className="flex items-center justify-between text-[10px] font-medium">
             <div className="flex flex-col items-center">
               <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] mb-1.5 shadow-[0_0_8px_#D4FF00]" />
               <span className="text-white">Week 1</span>
             </div>
             <div className="h-px bg-zinc-800 flex-1 mx-2 relative">
               <div className="absolute left-0 top-0 h-full bg-[#D4FF00]/50 w-[50%]" />
             </div>
             <div className="flex flex-col items-center">
               <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mb-1.5" />
               <span className="text-zinc-500">Week 6</span>
             </div>
             <div className="h-px bg-zinc-800 flex-1 mx-2" />
             <div className="flex flex-col items-center">
               <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mb-1.5" />
               <span className="text-zinc-500">Week 12</span>
             </div>
           </div>
        </div>
      )
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="py-10 sm:py-16 px-6 border-t border-zinc-900 bg-[#0A0A0B] overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <Reveal>
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-2">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6">
              Four simple steps to transform.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base lg:text-lg">
              Everything is designed to reduce friction and increase accountability from day one.
            </p>
          </Reveal>
        </div>

        <div className="relative max-w-4xl mx-auto pl-6 md:pl-0" ref={containerRef}>
          {/* Central connecting line for Desktop, Left line for Mobile */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-zinc-800 md:-translate-x-1/2" />
          <motion.div 
            className="absolute left-0 md:left-1/2 top-0 w-px bg-gradient-to-b from-[#D4FF00] to-transparent md:-translate-x-1/2 origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-12 md:space-y-0">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;
              
              const CardContent = (
                <div className="bg-[#111112] border border-zinc-800/60 rounded-2xl p-5 md:p-6 relative group hover:-translate-y-2 transition-all duration-500 hover:border-[#D4FF00]/40 hover:shadow-[0_10px_40px_rgba(212,255,0,0.05)] overflow-hidden w-full">
                  {/* Background blurred number */}
                  <div className="absolute -right-4 -bottom-6 text-8xl font-black text-white/5 blur-sm select-none pointer-events-none group-hover:text-[#D4FF00]/10 transition-colors duration-500">
                     {s.number}
                  </div>

                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#D4FF00]/10 group-hover:border-[#D4FF00]/30 transition-all duration-500">
                      <s.icon className="w-5 h-5 text-zinc-400 group-hover:text-[#D4FF00] transition-colors duration-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                      {s.desc}
                    </p>
                    
                    {/* Live Demo */}
                    <div className="mt-6">
                      {s.demo}
                    </div>
                  </div>
                </div>
              );

              return (
                <Reveal key={i} delay={0.1}>
                  {/* We use a grid for desktop to properly place it in columns, and flex for mobile */}
                  <div className="relative grid grid-cols-1 md:grid-cols-2 md:gap-16 items-center w-full md:py-12">
                    
                    {/* Center Node Desktop / Left Node Mobile */}
                    <div className="flex absolute left-0 md:left-1/2 top-12 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A0B] border-2 border-zinc-800 items-center justify-center z-10 transition-colors duration-500 delay-300">
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 transition-colors duration-500 group-hover:bg-[#D4FF00]" />
                    </div>

                    {isEven ? (
                      <>
                        <div className="w-full">
                           {CardContent}
                        </div>
                        <div className="hidden md:block" />
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block" />
                        <div className="w-full">
                           {CardContent}
                        </div>
                      </>
                    )}

                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialStrip() {
  const testimonials = [
    {
      quote: "I've tried every app. LeanIQA is the first one that made me feel accountable instead of guilty. The Daily Score changed how I think about food.",
      name: "Rahul M.",
      detail: "Lost 9kg in 14 weeks · 🔥 Day 68 streak",
      initials: "RM",
    },
    {
      quote: "The timeline feature is what got me. Seeing an actual date — not 'a few months' — made the goal feel real for the first time.",
      name: "Priya S.",
      detail: "Lost 6kg in 10 weeks · 🔥 Day 41 streak",
      initials: "PS",
    },
    {
      quote: "Logging 'aloo paratha with curd' and getting precise macros back in two seconds is genuinely magical. No other app handles Indian food this well.",
      name: "Arjun K.",
      detail: "Lost 12kg in 18 weeks · 🔥 Day 112 streak",
      initials: "AK",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-12 sm:mb-16 max-w-3xl mx-auto text-center">
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-2">
              Real results
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              People who finished their transformation.
            </h2>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-1">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 h-full flex flex-col min-h-[220px]">

                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-[#D4FF00] text-[#D4FF00]" />
                  ))}
                </div>

                <blockquote className="text-zinc-300 text-sm leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: "#D4FF00" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{t.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.detail}</p>
                  </div>
                </div>

              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
function GridCard({
  feature,
  delay,
}: {
  feature: any;
  delay: number;
  key?: React.Key;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ borderColor: "rgba(63,63,70,0.9)", y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 flex flex-col min-h-[200px] cursor-default"
    >
      <div className="flex justify-between items-start mb-10 sm:mb-16">
        <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">
          {feature.subsystem}
        </span>
        <div className="text-[#D4FF00]">
          <feature.icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-[9/19] rounded-[40px] border-[8px] border-zinc-900 bg-[#0A0A0B] shadow-2xl overflow-hidden shadow-black/50">
      <div className="absolute top-0 inset-x-0 h-6 bg-zinc-900/90 rounded-b-2xl z-50 flex items-center justify-center">
        <div className="w-16 h-4 bg-black rounded-full" />
      </div>
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-20">
        {children}
      </div>
      <div className="absolute inset-x-6 bottom-0 h-6 bg-[#0C0C0D]/80 blur-xl -z-10" />
    </div>
  );
}

function AICoachScreen() {
  return (
    <div className="p-4 pt-10 pb-8 flex flex-col min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#D4FF00] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-black" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">AI Coach</h4>
          <p className="text-[10px] text-[#D4FF00]">Active now</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-end gap-3">
        <div className="bg-zinc-800/50 border border-white/5 p-3 rounded-2xl rounded-tr-sm self-end max-w-[85%]">
          <p className="text-xs text-zinc-300">Logged: 2 roti with 100g paneer and some dal.</p>
        </div>
        <div className="bg-[#111112] border border-zinc-800/80 p-3 rounded-2xl rounded-tl-sm self-start max-w-[90%] shadow-lg">
          <p className="text-xs text-zinc-300 mb-2 leading-relaxed">Logged. You have 45g of protein left today. Dinner suggestion:</p>
          <div className="flex flex-col gap-2">
            <div className="bg-zinc-900/50 border border-white/5 p-2 rounded-lg flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">Grilled Chicken Salad</span>
              <span className="text-[10px] font-medium text-[#D4FF00]">40g Pro</span>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-2 rounded-lg flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">Soya Chunks Curry</span>
              <span className="text-[10px] font-medium text-[#D4FF00]">45g Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="p-4 pt-10 min-h-full flex flex-col bg-[#0A0A0B]">
      <div className="flex items-center justify-between mb-6">
        <div>
           <p className="text-[10px] text-zinc-500 font-medium">Daily Score</p>
           <div className="text-3xl font-bold text-white tracking-tighter">92<span className="text-lg text-zinc-500 font-normal">/100</span></div>
        </div>
        <div className="w-12 h-12 rounded-full border-[3px] border-[#D4FF00] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.2)]">
           <Flame className="w-5 h-5 text-[#D4FF00]" />
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        <div>
           <div className="flex justify-between text-[10px] mb-1.5 font-medium">
             <span className="text-zinc-400">Calories</span>
             <span className="text-zinc-300">1850 / 2200 kcal</span>
           </div>
           <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full w-[84%]" />
           </div>
        </div>
        <div>
           <div className="flex justify-between text-[10px] mb-1.5 font-medium">
             <span className="text-[#D4FF00]">Protein</span>
             <span className="text-zinc-300">140 / 150 g</span>
           </div>
           <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-[#D4FF00] rounded-full w-[93%]" />
           </div>
        </div>
      </div>
      
      <div className="mt-8 bg-[#111112] border border-zinc-800/80 rounded-xl p-3 flex items-start gap-3">
         <div className="w-8 h-8 rounded-full bg-[#D4FF00]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
           <Trophy className="w-4 h-4 text-[#D4FF00]" />
         </div>
         <div>
           <h5 className="text-xs font-semibold text-white mb-0.5">14 Day Streak!</h5>
           <p className="text-[10px] text-zinc-500">You are in the top 5% of consistent users this week.</p>
         </div>
      </div>
      <div className="absolute bottom-0 w-full p-[5%] border-t border-white/5 bg-[#1C1C1E]/90 backdrop-blur-md"></div>
    </div>
  );
}

function TimelineScreen() {
  return (
    <div className="p-4 pt-10 min-h-full bg-[#0A0A0B]">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-1">Physique Forecast</h4>
        <p className="text-[10px] text-zinc-500">Based on your 92% adherence rate</p>
      </div>
      
      <div className="relative pl-6 space-y-8 border-l border-zinc-800 ml-3">
        <div className="relative">
           <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#D4FF00] border-2 border-[#0A0A0B] shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
           <p className="text-[10px] font-bold text-[#D4FF00] uppercase tracking-wider mb-1">Today</p>
           <h5 className="text-lg font-semibold text-white">78.5 kg</h5>
        </div>
        <div className="relative opacity-60">
           <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-zinc-700 border-2 border-[#0A0A0B]" />
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">In 4 Weeks</p>
           <h5 className="text-lg font-semibold text-white">76.0 kg</h5>
           <p className="text-[10px] text-zinc-500 mt-1">Expected fat loss: 2.5kg</p>
        </div>
        <div className="relative opacity-40">
           <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-zinc-700 border-2 border-[#0A0A0B]" />
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Goal Date: Oct 15</p>
           <h5 className="text-lg font-semibold text-[#D4FF00]">72.0 kg</h5>
        </div>
      </div>
    </div>
  );
}

function MobilePhoneReveal({ step }: { step: number }) {
  return (
    <div className="relative w-full max-w-[280px] aspect-[9/19] rounded-[40px] border-[8px] border-zinc-900 bg-[#0A0A0B] shadow-2xl overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-6 bg-zinc-900/90 rounded-b-2xl z-50 flex items-center justify-center">
        <div className="w-16 h-4 bg-black rounded-full" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-20"
        >
          {step === 0 && <AICoachScreen />}
          {step === 1 && <DashboardScreen />}
          {step === 2 && <TimelineScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const STORY = [
  {
    title: "Log meals instantly.",
    subtitle: "Just type what you ate. LeanIQA's AI handles the exact macronutrient math without you needing to search a database."
  },
  {
    title: "A score you can trust.",
    subtitle: "Stop obsessing over exact calories. Your Daily Score tells you immediately if you're on track, factoring in macros, steps, and consistency."
  },
  {
    title: "See your future.",
    subtitle: "Our forecasting engine uses your actual adherence rate to plot an exact timeline to your goal. The more consistent you are, the faster you get there."
  }
];

function MobileStory() {
  return (
    <div className="lg:hidden flex flex-col">
      {STORY.map((step, i) => (
        <div key={i} className="min-h-[100dvh] flex flex-col px-6 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h3 className="text-3xl sm:text-4xl font-semibold leading-[1.1] text-zinc-50 tracking-tight">
              {step.title}
            </h3>
            <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
              {step.subtitle}
            </p>
          </motion.div>
          <div className="flex-1 flex items-center justify-center">
            <MobilePhoneReveal step={i} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DesktopStory() {
  return (
    <div className="hidden lg:flex flex-col py-24 gap-32">
      {STORY.map((step, i) => (
        <div key={i} className="min-h-screen flex items-center px-6 lg:px-16 max-w-7xl mx-auto w-full">
          <div className={`flex w-full items-center justify-between gap-24 ${i % 2 === 1 ? 'flex-row-reverse' : 'flex-row'}`}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-200px" }}
              transition={{ duration: 0.6 }}
              className="w-[47%]"
            >
              <h3 className="text-4xl lg:text-5xl font-semibold leading-[1.1] text-zinc-50 tracking-tight">
                {step.title}
              </h3>
              <p className="mt-6 text-lg lg:text-xl text-zinc-400 leading-relaxed">
                {step.subtitle}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-200px" }}
              transition={{ duration: 0.8 }}
              className="w-[47%] flex items-center justify-center"
            >
              <PhoneFrame>
                 {i === 0 && <AICoachScreen />}
                 {i === 1 && <DashboardScreen />}
                 {i === 2 && <TimelineScreen />}
              </PhoneFrame>
            </motion.div>
          </div>
        </div>
      ))}
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

function useDemoNumber(target: number, duration = 1000, trigger = false, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, trigger, decimals]);
  return value;
}

function InteractiveMealDemo() {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showReplay, setShowReplay] = useState(false);
  const cal = useDemoNumber(496, 1200, state === 'success', 0);
  const pro = useDemoNumber(20.73, 1200, state === 'success', 2);
  const fat = useDemoNumber(13.76, 1200, state === 'success', 2);
  const carbs = useDemoNumber(74.77, 1200, state === 'success', 2);

  const handleLog = () => {
    if (state !== 'idle') return;
    setState('loading');
    setTimeout(() => {
      setState('success');
      setTimeout(() => setShowReplay(true), 5000);
    }, 800);
  };

  const handleReset = () => {
    setState('idle');
    setShowReplay(false);
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto mt-6 sm:mt-10 lg:mt-0 perspective-1000">
      <div className="absolute -top-[40%] -right-[40%] w-[80%] h-[80%] bg-[#D4FF00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[40%] -left-[40%] w-[80%] h-[80%] bg-[#378ADD]/5 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        animate={state !== 'idle' ? { opacity: 0.5, scale: 0.98, filter: 'blur(2px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.4 }}
        className="bg-[#111112]/80 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 flex items-center justify-between mb-4 relative z-10 shadow-inner"
      >
        <div className="flex items-center gap-3 w-full">
           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
             <MessageSquare className="w-4 h-4 text-zinc-500" />
           </div>
           <div className="flex-1">
             <div className="text-[13px] sm:text-[15px] font-medium text-white truncate pr-2">2 rotis with palak paneer</div>
             <div className="text-[10px] sm:text-[11px] text-[#D4FF00] font-medium opacity-80 mt-0.5">Natural language parsing</div>
           </div>
           <button 
             onClick={handleLog}
             className="w-10 h-10 rounded-xl bg-[#D4FF00] flex items-center justify-center flex-shrink-0 text-black shadow-[0_0_15px_rgba(212,255,0,0.3)] hover:scale-105 active:scale-95 transition-all"
           >
             {state === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
           </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {state === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative z-20"
          >
            <div className="bg-[#18181A]/90 backdrop-blur-xl border border-zinc-800/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-5 sm:mb-6">
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                     <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4FF00]" />
                   </div>
                   <span className="text-xs sm:text-sm font-semibold text-white">Parsed Meal</span>
                 </div>
                 {showReplay && (
                   <motion.button
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     onClick={handleReset}
                     className="text-[10px] sm:text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors bg-zinc-900 px-2 py-1 rounded-md"
                   >
                     <RotateCcw className="w-3 h-3" /> Replay
                   </motion.button>
                 )}
              </div>

              <div className="flex items-end gap-2 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-zinc-800/60">
                 <div className="text-4xl sm:text-5xl font-bold text-white tracking-tighter tabular-nums leading-none">
                   {cal}
                 </div>
                 <div className="text-xs sm:text-sm text-zinc-500 font-medium mb-1">kcal</div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                 <div className="bg-zinc-900/60 border border-zinc-800/50 p-2 sm:p-3 rounded-xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4FF00]/20"><div className="h-full bg-[#D4FF00] w-[60%]" /></div>
                    <span className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Protein</span>
                    <span className="text-base sm:text-lg font-bold text-white tabular-nums">{pro}<span className="text-[10px] text-zinc-500 ml-0.5">g</span></span>
                 </div>
                 <div className="bg-zinc-900/60 border border-zinc-800/50 p-2 sm:p-3 rounded-xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500/20"><div className="h-full bg-blue-500 w-[70%]" /></div>
                    <span className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Carbs</span>
                    <span className="text-base sm:text-lg font-bold text-white tabular-nums">{carbs}<span className="text-[10px] text-zinc-500 ml-0.5">g</span></span>
                 </div>
                 <div className="bg-zinc-900/60 border border-zinc-800/50 p-2 sm:p-3 rounded-xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500/20"><div className="h-full bg-orange-500 w-[40%]" /></div>
                    <span className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">Fat</span>
                    <span className="text-base sm:text-lg font-bold text-white tabular-nums">{fat}<span className="text-[10px] text-zinc-500 ml-0.5">g</span></span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleEnterApp = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-50 font-sans selection:bg-[#D4FF00] selection:text-black overflow-x-hidden relative">
      
      {/* ── Navbar ── */}
      <motion.nav
        className="fixed top-0 w-full z-[999] backdrop-blur-md transition-colors"
        animate={{
          backgroundColor: scrolled ? "rgba(10,10,11,0.95)" : "rgba(10,10,11,0)",
          borderBottomColor: scrolled ? "rgba(39,39,42,0.6)" : "rgba(39,39,42,0)",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo className="w-8 h-8" />
            <span className="font-semibold tracking-tight text-lg">LeanIQA</span>
          </div>
          <motion.button
            onClick={handleEnterApp}
            whileHover={{ color: "#f4f4f5" }}
            transition={{ duration: 0.15 }}
            className="text-sm font-medium text-zinc-400"
          >
            Sign In
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="pt-24 pb-12 sm:pb-16 lg:pb-12 px-6 relative z-10 lg:min-h-[calc(100vh-80px)] flex lg:items-center items-center">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-8">
          <div className="max-w-2xl relative z-10 flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-semibold tracking-tight leading-[1.1] lg:leading-[1.05] mb-4 sm:mb-6"
            >
              Your body adapts every day. Your nutrition coach should too.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-10 sm:mb-10 leading-relaxed max-w-lg"
            >
              Eat smarter. Stay consistent. Transform with confidence. The only system that uses AI to adapt to your life, not the other way around.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <motion.button
                onClick={handleEnterApp}
                whileHover={{ scale: 1.03, backgroundColor: "#ffffff" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#D4FF00] text-black w-full sm:w-auto px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide rounded-full"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </motion.button>
              <InstallLeaniqa />
            </motion.div>
          </div>
          
          <div className="flex-1 w-full relative z-10 flex justify-center lg:justify-end">
            <InteractiveMealDemo />
          </div>
        </div>
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[#D4FF00] rounded-full blur-3xl opacity-[0.15] pointer-events-none" />
        <div className="absolute bottom-1/4 left-[10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-[#378ADD] rounded-full blur-3xl opacity-[0.1] pointer-events-none" />
      </section>

      <SocialProofBar />

      <StickyScrollFeatures />
      <DisciplineAdvantage />

      {/* ── Features grid ── */}
      <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0C0C0D]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16 max-w-3xl mx-auto text-center">
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

      <HowItWorks />
      <TestimonialStrip />

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-zinc-900 bg-[#0A0A0B] py-16 sm:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-3 text-zinc-50">
                Invest in your consistency.
              </h2>
              <p className="text-base text-zinc-400 max-w-2xl mx-auto">
                Simple pricing. No hidden fees. Unlock the full power of your AI Coach.
              </p>
            </div>
          </Reveal>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Starter", price: "Free", sub: "Basic tracking forever", accent: "#378ADD", features: ["Manual calorie tracking","Basic macro splits","Standard food database"], missing: ["AI Meal Parsing","Adaptive Targets", "Timeline Predictions"], badge: null, delay: 0 },
              { name: "Pro", price: "₹499", sub: "per month", accent: "#D4FF00", features: ["Unlimited AI Meal Logging","Adaptive Calorie & Macro Targets","Consistency Engine & Analytics","Physique Prediction Timeline","Priority Support"], missing: [], badge: "Most Popular", delay: 0.1 },
            ].map((p, i) => (
              <Reveal key={i} delay={p.delay}>
                <div className={`p-8 rounded-3xl h-full border ${p.badge ? 'border-[#D4FF00]/40 bg-[#D4FF00]/5' : 'border-zinc-800 bg-[#111112]'} relative overflow-hidden flex flex-col`}>
                  {p.badge && (
                    <div className="absolute top-0 right-0 bg-[#D4FF00] text-black text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                      {p.badge}
                    </div>
                  )}
                  <div className={`text-xs font-bold uppercase tracking-wider mb-3`} style={{color: p.accent}}>{p.name}</div>
                  <div className="text-4xl font-extrabold text-white mb-2">{p.price}</div>
                  <div className="text-sm text-zinc-500 mb-8">{p.sub}</div>
                  
                  <div className="flex flex-col gap-3 mb-8 flex-1">
                    {p.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Check className="w-4 h-4 mt-0.5" style={{color: p.accent}} />
                        <span className="text-sm text-zinc-300">{f}</span>
                      </div>
                    ))}
                    {p.missing.map((f, j) => (
                      <div key={j} className="flex items-start gap-3 opacity-40">
                        <X className="w-4 h-4 mt-0.5 text-zinc-500" />
                        <span className="text-sm text-zinc-500 line-through">{f}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={handleEnterApp} className={`w-full py-3.5 rounded-full font-semibold transition-all ${p.badge ? 'bg-[#D4FF00] text-black hover:bg-[#bce000]' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                    {p.price === "Free" ? "Get started free" : "Start free trial"}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-32 px-6 border-t border-zinc-900 bg-[#0A0A0B] text-center relative z-10 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
           <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-[#FF4D1C]/10 via-[#378ADD]/5 to-[#D4FF00]/10 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 tracking-tight leading-[1.1]">
            The hardest part isn't losing fat. It's staying consistent.
          </h2>
          <p className="text-[#D4FF00] mb-10 text-lg sm:text-xl font-medium">
            LeanIQA helps you do both.
          </p>
          <motion.button
            onClick={handleEnterApp}
            whileHover={{ scale: 1.04, backgroundColor: "#D4FF00" }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white text-black px-8 py-4 font-semibold inline-flex items-center gap-2 text-sm uppercase tracking-wide rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            Start Your Journey <ArrowRight className="w-4 h-4" />
          </motion.button>
          <div className="mt-4 flex justify-center"><InstallLeaniqa /></div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-zinc-500 text-xs flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-center md:text-left relative z-10">
        <div 
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
           <Logo className="w-6 h-6" />
           <span className="font-semibold text-zinc-400 text-sm">LeanIQA</span>
        </div>
        <p className="text-sm">© 2026 LeanIQA · Transforming bodies with AI</p>
      </footer>
    </div>
  );
}
