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
Loader2, Check, ClipboardList, BarChart2, Dumbbell, Activity, Droplets, Brain, ShieldCheck, Lock, X, CalendarHeart, RotateCcw, ChevronDown} from "lucide-react";

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
    { value: `${(users / 1000).toFixed(0)}K+`, label: "TEAM LEAN",             color: "#D4FF00", icon: Users },
    { value: `${(score / 10).toFixed(1)}★`,     label: "COMMUNITY RATING",              color: "#D4FF00", icon: Star },
    { value: `${percent}%`,                     label: "NO MORE GUESSING",       color: "#D4FF00", icon: CheckCircle2 },
    { value: "24/7",                            label: "ACCOUNTABILITY",                 color: "#D4FF00", icon: MessageSquare },
  ];
  return (
    <section ref={ref} className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            Trusted by <span style={{ color: "#D4FF00" }}>Team Lean</span>. Built for <span style={{ color: "#D4FF00" }}>Discipline</span>.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            LeaniQA is the friend that keeps you accountable to actually hit your protein and get lean.
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

// ---------------------------------------------------------------------------
// TEMPORARILY DISABLED: "Other apps vs LeanIQA" comparison section.
// Not needed right now. To restore it, delete the "// " prefix from every line
// of this block and uncomment the <DisciplineAdvantage /> render call inside
// the LandingPage() JSX below (search for TEMPORARILY DISABLED).
// ---------------------------------------------------------------------------
// function DisciplineAdvantage() {
//   const battles = [
//     {
//       icon: ClipboardList,
//       other: {
//         title: "Just a food diary",
//         desc: "Leaves you on your own.",
//         demo: (
//           <div className="bg-[#18181A] rounded-xl border border-white/5 p-3 mt-3 shadow-inner">
//              <div className="flex items-center gap-2 text-zinc-500 mb-4 text-xs bg-zinc-900/50 p-2 rounded-lg border border-white/5">
//                 <Search className="w-4 h-4" /> Search food
//              </div>
//              <div className="space-y-4">
//                <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">🍛</div>
//                   <div>
//                     <div className="text-sm font-medium text-zinc-300">Paneer Butter Masala</div>
//                     <div className="text-[10px] text-zinc-500">1 bowl • 450 kcal</div>
//                   </div>
//                </div>
//                <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">🫓</div>
//                   <div>
//                     <div className="text-sm font-medium text-zinc-300">Roti</div>
//                     <div className="text-[10px] text-zinc-500">2 pieces • 240 kcal</div>
//                   </div>
//                </div>
//              </div>
//           </div>
//         )
//       },
//       leaniqa: {
//         title: "Ate biryani? Relax.",
//         desc: "We adjust the rest of your day.",
//         demo: (
//           <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-3 mt-3 relative overflow-hidden shadow-xl shadow-[#D4FF00]/5">
//              <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5 font-medium">
//                <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]"/> AI Coach
//              </div>
//              <div className="flex items-start justify-between gap-4">
//                <div className="flex-1">
//                  <div className="bg-[#18181A] p-3 rounded-lg border border-white/5 text-xs text-zinc-300 leading-relaxed mb-2 inline-block rounded-tl-sm">
//                    Great choice! But you're<br/> 12g protein short.<br/> Add any one:
//                  </div>
//                  <div className="flex flex-wrap gap-2">
//                     <span className="text-[10px] font-medium bg-[#D4FF00]/10 text-[#D4FF00] px-2.5 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 transition-colors cursor-pointer">Moong Dal</span>
//                     <span className="text-[10px] font-medium bg-[#D4FF00]/10 text-[#D4FF00] px-2.5 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 transition-colors cursor-pointer">Greek Yogurt</span>
//                     <span className="text-[10px] font-medium bg-[#D4FF00]/10 text-[#D4FF00] px-2.5 py-1.5 rounded-full border border-[#D4FF00]/20 hover:bg-[#D4FF00]/20 transition-colors cursor-pointer">Paneer</span>
//                  </div>
//                </div>
//                 <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center bg-zinc-950 rounded-full border border-white/5">
//                  <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(212,255,0,0.3)]" viewBox="0 0 36 36">
//                     <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="3" />
//                     <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4FF00" strokeWidth="3" strokeDasharray="91, 100" />
//                  </svg>
//                  <div className="text-center relative z-10">
//                    <div className="text-[8px] text-zinc-500 mb-0.5 leading-none font-medium">Today's<br/>Score</div>
//                    <div className="text-lg font-bold text-white leading-none tracking-tight">91</div>
//                  </div>
//                </div>
//              </div>
//              
//              <div className="mt-5 pt-4 border-t border-white/5">
//                <div className="flex items-center justify-between text-[10px] font-medium mb-2">
//                   <span className="text-zinc-400">Protein</span>
//                   <span className="text-zinc-300">88 / 100g</span>
//                </div>
//                <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
//                   <div className="h-full bg-[#D4FF00] rounded-full w-[88%] shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
//                </div>
//              </div>
//           </div>
//         )
//       }
//     },
//     {
//       icon: BarChart2,
//       other: {
//         title: "Just counts calories",
//         desc: "Doesn't care about your consistency.",
//         demo: (
//           <div className="bg-[#18181A] rounded-xl border border-white/5 p-3 mt-3 shadow-inner">
//             <div className="text-xs font-medium text-zinc-500 mb-4 pb-3 border-b border-white/5">Nutrition Overview</div>
//             <div className="grid grid-cols-3 gap-2">
//                <div className="text-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
//                   <div className="text-[10px] text-zinc-500 mb-1">Calories</div>
//                   <div className="text-lg font-bold text-zinc-300">1780</div>
//                   <div className="text-[9px] text-zinc-600">kcal</div>
//                </div>
//                <div className="text-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
//                   <div className="text-[10px] text-zinc-500 mb-1">Protein</div>
//                   <div className="text-lg font-bold text-zinc-300">65</div>
//                   <div className="text-[9px] text-zinc-600">g</div>
//                </div>
//                <div className="text-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
//                   <div className="text-[10px] text-zinc-500 mb-1">Carbs</div>
//                   <div className="text-lg font-bold text-zinc-300">210</div>
//                   <div className="text-[9px] text-zinc-600">g</div>
//                </div>
//             </div>
//             <div className="mt-4">
//               <div className="flex items-center justify-between text-[10px] mb-2 font-medium">
//                 <span className="text-zinc-500">Calories</span>
//                 <span className="text-zinc-600">1780 / 2100 kcal</span>
//               </div>
//               <div className="w-full h-1.5 bg-zinc-900 rounded-full border border-white/5 overflow-hidden">
//                 <div className="h-full bg-zinc-600 rounded-full w-[85%]" />
//               </div>
//             </div>
//           </div>
//         )
//       },
//       leaniqa: {
//         title: "Your Discipline Score",
//         desc: "Abs care about consistency, not motivation.",
//         demo: (
//           <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-3 mt-3 shadow-xl shadow-[#D4FF00]/5">
//              <div className="flex items-center gap-6">
//                 <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center bg-zinc-950 rounded-full border border-white/5">
//                  <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(212,255,0,0.4)]" viewBox="0 0 36 36">
//                     <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="4" />
//                     <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4FF00" strokeWidth="4" strokeDasharray="91, 100" strokeLinecap="round" />
//                  </svg>
//                  <div className="text-center relative z-10">
//                    <div className="text-[9px] text-zinc-400 mb-0.5 leading-none font-medium">Today's<br/>Score</div>
//                    <div className="text-3xl font-bold text-white leading-none tracking-tighter">91</div>
//                    <div className="text-[9px] text-zinc-500 mt-1 font-mono">/100</div>
//                  </div>
//                </div>
//                
//                <div className="flex-1 space-y-3.5">
//                  <div>
//                    <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
//                      <span className="text-orange-400/90 flex items-center gap-1.5"><Flame className="w-3 h-3"/> Calories</span>
//                      <span className="text-zinc-300">1780 / 2100g</span>
//                    </div>
//                    <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-orange-400/90 rounded-full w-[85%] shadow-[0_0_8px_rgba(251,146,60,0.5)]"/></div>
//                  </div>
//                  <div>
//                    <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
//                      <span className="text-[#D4FF00]/90 flex items-center gap-1.5"><Dumbbell className="w-3 h-3"/> Protein</span>
//                      <span className="text-zinc-300">88 / 100g</span>
//                    </div>
//                    <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-[#D4FF00]/90 rounded-full w-[88%] shadow-[0_0_8px_rgba(212,255,0,0.5)]"/></div>
//                  </div>
//                  <div>
//                    <div className="flex items-center justify-between text-[10px] mb-1.5 font-medium">
//                      <span className="text-blue-400/90 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Steps</span>
//                      <span className="text-zinc-300">8,432 / 10K</span>
//                    </div>
//                    <div className="w-full h-1 bg-zinc-950 rounded-full border border-white/5 overflow-hidden"><div className="h-full bg-blue-400/90 rounded-full w-[84%] shadow-[0_0_8px_rgba(96,165,250,0.5)]"/></div>
//                  </div>
//                </div>
//              </div>
//              
//              <div className="mt-3 pt-2 border-t border-white/5 flex items-start gap-2.5 bg-[#D4FF00]/5 -mx-4 -mb-4 p-4">
//                <Star className="w-4 h-4 text-[#D4FF00] mt-0.5 flex-shrink-0" />
//                <div>
//                  <div className="text-xs text-[#D4FF00] font-medium mb-0.5">You're doing great!</div>
//                  <div className="text-[10px] text-zinc-400">Keep your protein above 90g tomorrow.</div>
//                </div>
//              </div>
//           </div>
//         )
//       }
//     },
//     {
//       icon: Calendar,
//       other: {
//         title: "Vague goals",
//         desc: "Hoping you get lean someday.",
//         demo: (
//           <div className="bg-[#18181A] rounded-xl border border-white/5 p-4 mt-3 shadow-inner">
//              <div className="bg-zinc-900/50 p-4 rounded-lg border border-white/5">
//                <div className="text-[10px] font-medium text-zinc-500 mb-1">Goal</div>
//                <div className="text-sm font-semibold text-zinc-300 mb-5 flex items-center justify-between">
//                   Lose Weight
//                   <Target className="w-4 h-4 text-zinc-600" />
//                </div>
//                
//                <div className="text-[10px] font-medium text-zinc-500 mb-1">Target Weight</div>
//                <div className="text-xl font-bold text-zinc-300 mb-5">55 kg</div>
//                
//                <div className="h-px bg-zinc-800 w-full mb-4" />
//                <div className="text-[10px] text-zinc-600 italic">No specific deadline</div>
//              </div>
//           </div>
//         )
//       },
//       leaniqa: {
//         title: "Know when you'll get lean",
//         desc: "No guessing. A real timeline.",
//         demo: (
//           <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-3 mt-3 shadow-xl shadow-[#D4FF00]/5">
//               <div className="flex items-center sm:items-start justify-between gap-3 mb-4 px-2">
//                <div>
//                  <div className="text-[10px] text-zinc-500 font-medium mb-1">Starting</div>
//                  <div className="text-sm font-semibold text-zinc-300">62.0 kg</div>
//                  <div className="text-[10px] text-zinc-500 mt-1">Today</div>
//                </div>
//                 <div className="text-center bg-[#D4FF00]/10 px-4 sm:px-3 py-2 rounded-xl border border-[#D4FF00]/20">
//                  <div className="text-[10px] text-[#D4FF00] font-medium mb-1">Goal</div>
//                  <div className="text-2xl font-bold text-[#D4FF00] tracking-tight">55.0 <span className="text-sm">kg</span></div>
//                </div>
//                <div className="text-right">
//                  <div className="text-[10px] text-zinc-500 font-medium mb-1">Expected</div>
//                  <div className="text-sm font-semibold text-white">Nov 28, 2024</div>
//                  <div className="text-[10px] text-zinc-500 mt-1">12 weeks</div>
//                </div>
//              </div>
//              
//              <div className="relative mt-5 mb-4 px-2">
//                <div className="h-2 w-full bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
//                  <div className="h-full bg-gradient-to-r from-[#D4FF00]/80 to-[#D4FF00] w-[20%] rounded-full shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
//                </div>
//                <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(212,255,0,0.4)] border-[3px] border-[#D4FF00] z-10" />
//                
//                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-600 rounded-full" />
//                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-800 rounded-full" />
//              </div>
//              
//              <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2.5 bg-[#D4FF00]/5 -mx-4 -mb-4 p-4">
//                <Target className="w-4 h-4 text-[#D4FF00] mt-0.5 flex-shrink-0" />
//                <div>
//                  <div className="text-xs text-[#D4FF00] font-medium mb-0.5">You're on track!</div>
//                  <div className="text-[10px] text-zinc-400">Keep your score above 85 to hit your goal.</div>
//                </div>
//              </div>
//           </div>
//         )
//       }
//     }
//   ];
//
//   return (
//     <section className="py-10 sm:py-16 px-6 bg-[#0A0A0B] overflow-hidden" id="discipline">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-10 md:mb-16 max-w-3xl mx-auto text-center">
//           <Reveal>
//             <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-4">
//               <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" />
//               STOP GUESSING
//             </div>
//             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6 leading-tight">
//               Discipline beats motivation.<br/>
//               <span className="text-[#D4FF00]">Every single time.</span>
//             </h2>
//             <p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed mx-auto">
//               You already know how to lift. But abs are built in the kitchen.<br className="hidden sm:block"/>
//               Standard calorie trackers leave you guessing with Indian food.<br className="hidden sm:block"/>
//               <span className="text-zinc-300 font-medium">LeaniQA is built to fix exactly that.</span>
//             </p>
//           </Reveal>
//         </div>
//
//         {/* Labels for Desktop */}
//         <div className="hidden md:flex justify-between max-w-4xl mx-auto mb-6 px-8 relative z-10">
//            <div className="w-[47%] flex justify-center">
//              <div className="px-5 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest shadow-lg backdrop-blur-sm">
//                OTHER APPS
//              </div>
//            </div>
//            <div className="w-[47%] flex justify-center">
//              <div className="px-5 py-2 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[10px] sm:text-xs font-semibold text-[#D4FF00] uppercase tracking-widest shadow-[0_0_20px_rgba(212,255,0,0.1)] backdrop-blur-sm">
//                LEANIQA
//              </div>
//            </div>
//         </div>
//
//         <div className="relative max-w-4xl mx-auto">
//           {/* Center vertical dashed line for desktop */}
//           <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-zinc-800 -translate-x-1/2 z-0" />
//           
//           <div className="space-y-4 md:space-y-6 relative z-10">
//             {battles.map((b, i) => (
//               <div key={i} className="relative flex flex-col md:flex-row items-stretch gap-0">
//                  
//                  {/* Connecting horizontal lines for center icon */}
//                  <div className="hidden md:block absolute left-[45%] right-[50%] top-1/2 -translate-y-1/2 h-px border-b border-dashed border-zinc-800 z-0" />
//                  <div className="hidden md:block absolute left-[50%] right-[45%] top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-[#D4FF00]/50 to-transparent z-0" />
//
//                  {/* Center Icon */}
//                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0A0A0B] border border-zinc-700 items-center justify-center z-20 text-zinc-500 shadow-xl group hover:border-[#D4FF00] hover:text-[#D4FF00] transition-colors duration-300 cursor-default">
//                     <b.icon className="w-5 h-5 transition-colors duration-300" />
//                     {/* Glow effect */}
//                     <div className="absolute inset-0 rounded-full bg-[#D4FF00]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                  </div>
//                  
//                  {/* Arrow pointing right from the center icon */}
//                  <div className="hidden md:block absolute left-[calc(50%+24px)] top-1/2 -translate-y-1/2 text-[#D4FF00] z-20">
//                    <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
//                  </div>
//
//                  {/* Other Apps (Left) */}
//                  <div className="w-full md:w-[47%] flex flex-col">
//                     <div className="md:hidden flex items-center gap-3 mb-3">
//                       <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
//                         <X className="w-3 h-3 text-red-500/80" /> Other apps
//                       </div>
//                       <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent" />
//                     </div>
//                    <Reveal delay={i * 0.1} className="flex-1">
//                       <div className="bg-gradient-to-br from-[#111112] to-[#0A0A0B] rounded-2xl p-5 md:p-5 border border-zinc-800/80 h-full flex flex-col hover:border-zinc-700 transition-colors duration-300 shadow-xl shadow-black/50">
//                        <div className="flex items-center gap-3 mb-2">
//                          <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 flex-shrink-0">
//                            <X className="w-3 h-3 text-red-500" />
//                          </div>
//                          <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{b.other.title}</h3>
//                        </div>
//                        <p className="text-zinc-400 text-[11px] md:text-xs ml-9">{b.other.desc}</p>
//                        
//                        <div className="mt-auto pt-4">
//                          {b.other.demo}
//                        </div>
//                      </div>
//                    </Reveal>
//                  </div>
//
//                  {/* Spacer for center icon */}
//                  <div className="hidden md:block w-[8%] relative z-10" />
//
//                  {/* Leaniqa (Right) */}
//                  <div className="w-full md:w-[47%] flex flex-col">
//                     {/* Mobile divider between the two cards */}
//                     <div className="md:hidden flex items-center gap-3 my-4 relative">
//                       <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
//                       <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0A0A0B] border border-zinc-800 z-10">
//                         <ArrowRight className="w-3.5 h-3.5 text-[#D4FF00]" />
//                       </div>
//                       <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
//                     </div>
//
//                     <div className="md:hidden flex items-center gap-3 mb-3">
//                       <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#D4FF00] uppercase tracking-widest">
//                         <Check className="w-3 h-3" /> LeanIQA
//                       </div>
//                       <div className="flex-1 h-px bg-gradient-to-r from-[#D4FF00]/40 to-transparent" />
//                     </div>
//                    <Reveal delay={i * 0.1 + 0.1} className="flex-1">
//                       <div className="bg-gradient-to-b from-[#111112] to-[#0A0A0B] rounded-2xl p-5 md:p-5 border border-[#D4FF00]/30 h-full relative group overflow-hidden flex flex-col hover:border-[#D4FF00]/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,255,0,0.1)]">
//                        <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
//                        
//                        {/* Shimmer effect */}
//                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
//                        
//                        <div className="relative z-10 flex flex-col h-full">
//                          <div className="flex items-center gap-3 mb-2">
//                            <div className="w-6 h-6 rounded-full bg-[#D4FF00] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.4)] flex-shrink-0">
//                              <Check className="w-3 h-3 text-black font-bold" />
//                            </div>
//                            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{b.leaniqa.title}</h3>
//                          </div>
//                          <p className="text-zinc-300 text-[11px] md:text-xs ml-9">{b.leaniqa.desc}</p>
//                          
//                          <div className="mt-auto pt-4">
//                            {b.leaniqa.demo}
//                          </div>
//                        </div>
//                      </div>
//                    </Reveal>
//                  </div>
//                  
//               </div>
//             ))}
//           </div>
//         </div>
//
//         {/* Bottom Feature Grid */}
//         <Reveal>
//           <div className="mt-10 md:mt-12 max-w-4xl mx-auto border border-zinc-800/80 rounded-2xl bg-gradient-to-b from-[#111112] to-[#0A0A0B] p-8 md:p-10 shadow-2xl">
//              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
//                <div className="flex items-start md:items-center gap-4">
//                   <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
//                     <Brain className="w-6 h-6 text-[#D4FF00]" />
//                   </div>
//                   <div>
//                     <div className="text-sm font-semibold text-white mb-1 tracking-tight">AI-Powered</div>
//                     <div className="text-xs text-zinc-500">Learns from you</div>
//                   </div>
//                </div>
//                <div className="flex items-start md:items-center gap-4">
//                   <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
//                     <ShieldCheck className="w-6 h-6 text-[#D4FF00]" />
//                   </div>
//                   <div>
//                     <div className="text-sm font-semibold text-white mb-1 tracking-tight">Realistic Plans</div>
//                     <div className="text-xs text-zinc-500">Built for real life</div>
//                   </div>
//                </div>
//                <div className="flex items-start md:items-center gap-4">
//                   <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
//                     <BarChart3 className="w-6 h-6 text-[#D4FF00]" />
//                   </div>
//                   <div>
//                     <div className="text-sm font-semibold text-white mb-1 tracking-tight">Tracks What Matters</div>
//                     <div className="text-xs text-zinc-500">Score, not just calories</div>
//                   </div>
//                </div>
//                <div className="flex items-start md:items-center gap-4">
//                   <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
//                     <Lock className="w-6 h-6 text-[#D4FF00]" />
//                   </div>
//                   <div>
//                     <div className="text-sm font-semibold text-white mb-1 tracking-tight">Privacy First</div>
//                     <div className="text-xs text-zinc-500">Your data is yours</div>
//                   </div>
//                </div>
//              </div>
//           </div>
//         </Reveal>
//
//       </div>
//     </section>
//   );
// }
// ---------------------- end of disabled comparison section ----------------------

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Target,
      title: "Set Your Target",
      desc: "Tell us where you are and where you want to be. We'll handle the math.",
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
      title: "Just tell us what you ate",
      desc: "Type '2 roti + dal + paneer'. We figure out the rest. No barcode scanning.",
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
      title: "Build the Discipline",
      desc: "Focus on your Daily Score. If you slip up, we adjust your next meal. No guilt.",
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
      title: "Watch Your Body Change",
      desc: "Your timeline updates based on your actual consistency. Put in the work, see the results.",
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
              THE LEAN SYSTEM
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6">
              Protein first. Excuses later.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base lg:text-lg">
              Everything is designed to keep you accountable. No more guessing.
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
      quote: "Lost 6kg in 8 weeks without giving up roti or rice. The protein tracking changed everything.",
      name: "Rahul M.",
      detail: "Office worker · Day 68 streak",
      result: "-6kg in 8 weeks",
      initials: "RM",
    },
    {
      quote: "Finally hit 100g protein daily. Stopped feeling guilty after eating biryani — the app just adjusts the rest of my day.",
      name: "Priya S.",
      detail: "College student · Day 41 streak",
      result: "100g protein daily",
      initials: "PS",
    },
    {
      quote: "From skinny fat to visible abs in 4 months. The gym did its job — LeaniQA made my diet do its part.",
      name: "Arjun K.",
      detail: "Gym beginner · Day 112 streak",
      result: "Abs visible in 4 months",
      initials: "AK",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-12 sm:mb-16 max-w-3xl mx-auto text-center">
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-2">
              Team Lean
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              People who finally got lean.
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

                {/* Result badge */}
                {t.result && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#D4FF00]/25 bg-[#D4FF00]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4FF00]">
                    <TrendingUp className="w-3 h-3" />
                    {t.result}
                  </div>
                )}

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



function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "Is this just another calorie tracker?",
      a: "No. LeaniQA focuses on discipline and consistency, not just numbers. We track your Daily Score and help you recover from slip-ups instead of guilt-tripping you." },
    { q: "Does it understand Indian food?",
      a: "Yes — that is the whole point. Type '2 roti + dal + paneer' and we handle the rest. No barcode scanning, no searching databases for every ingredient." },
    { q: "Do I need to weigh my food?",
      a: "No. Just describe your meal naturally — 'one bowl of dal, two rotis, 100g paneer'. Our AI estimates portions from context." },
    { q: "How is this different from MyFitnessPal?",
      a: "MyFitnessPal makes you search and scan. We let you type one sentence. And we adapt your targets when life happens — you do not have to hit the same number every day." },
    { q: "Is my data private?",
      a: "Yes. We do not sell your data, we do not show ads, and your health data stays yours." },
    { q: "Can I cancel anytime?",
      a: "Yes. No contracts, no lock-in. Cancel with one tap from your profile." },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <div className="mb-10 sm:mb-14 text-center">
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-2">
              Questions
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
              Everything you're wondering.
            </h2>
          </div>
        </Reveal>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={i} delay={i * 0.04}>
                <div className="rounded-2xl border border-zinc-800/60 bg-[#111112] overflow-hidden transition-colors hover:border-zinc-700">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left"
                  >
                    <span className="text-sm sm:text-base font-medium text-zinc-100">
                      {faq.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-shrink-0 text-zinc-500"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-sm sm:text-[15px] leading-relaxed text-zinc-400">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
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
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 28 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 28 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ borderColor: "rgba(63,63,70,0.9)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        willChange: "transform",
      }}
      className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 flex flex-col min-h-[200px] cursor-default"
    >
      <div className="flex justify-between items-start mb-10 sm:mb-16">
        <span
          style={{ transform: "translateZ(20px)" }}
          className="text-zinc-500 font-mono text-xs uppercase tracking-wider"
        >
          {feature.subsystem}
        </span>
        <div style={{ transform: "translateZ(40px)" }} className="text-[#D4FF00]">
          <feature.icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-auto">
        <h3
          style={{ transform: "translateZ(30px)" }}
          className="text-lg font-medium mb-2 text-zinc-100"
        >
          {feature.title}
        </h3>
        <p
          style={{ transform: "translateZ(20px)" }}
          className="text-zinc-400 text-sm leading-relaxed"
        >
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
  const bubbleEase = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden relative pt-[16%]">
      <div className="flex-1 p-[5%] flex flex-col justify-end gap-[4%] pb-[20%]">

        {/* User message — slides in from right */}
        <motion.div
          initial={{ opacity: 0, x: 24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.45, delay: 0.75, ease: bubbleEase }}
          className="self-end bg-white/10 rounded-[24px] rounded-tr-sm px-[5%] py-[4%] max-w-[85%]"
        >
          <p className="text-white" style={{ fontSize: "clamp(9px, 3.5%, 14px)" }}>
            2 roti + 1 bowl dal + 100g paneer
          </p>
        </motion.div>

        {/* AI response card — slides in from left */}
        <motion.div
          initial={{ opacity: 0, x: -24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.50, delay: 1.10, ease: bubbleEase }}
          className="self-start bg-[#1C1C1E] border border-white/10 rounded-[24px] rounded-tl-sm px-[5%] py-[5%] max-w-[90%]"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.30, delay: 1.35 }}
            className="flex items-center gap-[3%] mb-[6%]"
          >
            <div className="w-[12%] aspect-square rounded-full bg-[#378ADD]/20 flex items-center justify-center">
              <Sparkles className="w-[60%] h-[60%] text-[#378ADD]" />
            </div>
            <span className="text-[#378ADD] font-semibold" style={{ fontSize: "clamp(8px, 3%, 12px)" }}>AI Coach</span>
          </motion.div>

          {/* "Logged!" text */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 1.50 }}
            className="text-white/90 mb-[6%] leading-relaxed"
            style={{ fontSize: "clamp(9px, 3.5%, 14px)" }}
          >
            Logged! Here is the breakdown:
          </motion.p>

          {/* Macro summary box — scales in */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.40, delay: 1.65, ease: bubbleEase }}
            className="bg-black/40 rounded-lg p-[5%] flex justify-between mb-[6%] border border-white/5"
          >
            <div className="text-center flex-1">
              <div className="text-white/50 uppercase tracking-wider mb-1" style={{ fontSize: "clamp(6px, 2.2%, 10px)" }}>Calories</div>
              <div className="text-[#FF4D1C] font-bold" style={{ fontSize: "clamp(12px, 5%, 20px)" }}>480</div>
            </div>
            <div className="w-[1px] bg-white/10 mx-2" />
            <div className="text-center flex-1">
              <div className="text-white/50 uppercase tracking-wider mb-1" style={{ fontSize: "clamp(6px, 2.2%, 10px)" }}>Protein</div>
              <div className="text-[#D4FF00] font-bold" style={{ fontSize: "clamp(12px, 5%, 20px)" }}>28g</div>
            </div>
          </motion.div>

          {/* Coaching tip */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 1.90 }}
            className="text-white/80 leading-relaxed"
            style={{ fontSize: "clamp(8.5px, 3.2%, 13px)" }}
          >
            You're 15g short on protein. I've adjusted your dinner target.
          </motion.p>
        </motion.div>
      </div>

      {/* Input bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.40, delay: 2.10 }}
        className="absolute bottom-0 w-full p-[5%] border-t border-white/5 bg-[#1C1C1E]/90 backdrop-blur-md"
      >
        <div className="bg-black rounded-full px-[5%] py-[3%] flex items-center justify-between border border-white/10">
          <span className="text-white/30" style={{ fontSize: "clamp(9px, 3.5%, 14px)" }}>Type your meal...</span>
          <div className="w-[12%] aspect-square bg-[#D4FF00] rounded-full flex items-center justify-center">
            <ArrowRight className="w-[50%] h-[50%] text-black" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardScreen() {
  const eatenKcal = useDemoNumber(1420, 1200, true, 0);
  const proteinVal = useDemoNumber(80, 900, true, 0);
  const fatVal = useDemoNumber(45, 900, true, 0);
  const carbsVal = useDemoNumber(120, 900, true, 0);
  const easeOut = [0.22, 1, 0.36, 1] as const;

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
              animate={{ pathLength: 0.645 }}
              transition={{ duration: 1.3, delay: 0.75, ease: easeOut }}
              cx="50%" cy="50%" r="42%" fill="none" stroke="#D4FF00" strokeWidth="8%" strokeLinecap="round"
            />
          </svg>
          <div className="text-center mt-2">
            <div className="font-bold text-white leading-none tabular-nums" style={{ fontSize: "clamp(24px, 10%, 40px)" }}>{eatenKcal.toLocaleString()}</div>
            <div className="text-white/40 uppercase tracking-widest mt-1" style={{ fontSize: "clamp(6px, 2.5%, 10px)" }}>Eaten / 2200</div>
          </div>
        </div>

        <div className="flex justify-between w-[85%]">
          {[
            { name: 'Protein', val: proteinVal, col: '#378ADD', pct: '70%' },
            { name: 'Fat', val: fatVal, col: '#FF4D1C', pct: '40%' },
            { name: 'Carbs', val: carbsVal, col: '#D4FF00', pct: '85%' }
          ].map((m, i) => (
            <div key={i} className="text-center w-[28%]">
              <div className="uppercase text-white/40 tracking-wider mb-1" style={{ fontSize: "clamp(6px, 2.5%, 10px)" }}>{m.name}</div>
              <div className="font-semibold text-white mb-2 tabular-nums" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>{m.val}g</div>
              <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: m.col }}
                  initial={{ width: '0%' }}
                  animate={{ width: m.pct }}
                  transition={{ duration: 0.85, delay: 1.0 + i * 0.1, ease: easeOut }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-[6%] pt-[2%]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5, ease: easeOut }}
          className="bg-white/5 border border-white/5 rounded-[20px] p-[6%]"
        >
          <div className="font-semibold text-white/50 uppercase tracking-wider mb-2" style={{ fontSize: "clamp(7px, 2.8%, 11px)" }}>Adjusted Target</div>
          <div className="text-[#D4FF00] font-semibold mb-1" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>Dinner: 450 kcal</div>
          <div className="text-white/70" style={{ fontSize: "clamp(8px, 3.2%, 13px)" }}>Must include 45g Protein</div>
        </motion.div>
      </div>
    </div>
  );
}

function TimelineScreen() {
  const projectedWeight = useDemoNumber(72.5, 1200, true, 1);
  const percentDrop = useDemoNumber(12, 900, true, 0);
  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col p-[6%] pt-[16%]">
      <div className="flex items-center gap-2 mb-[8%] mt-[4%]">
        <LineChart className="text-[#D4FF00] w-[1em] h-[1em]" style={{ fontSize: "clamp(12px, 5%, 20px)" }} />
        <p className="text-white/80 font-semibold" style={{ fontSize: "clamp(10px, 4%, 16px)" }}>Transformation</p>
      </div>

      <div className="bg-[#1C1C1E] border border-white/5 rounded-[24px] p-[6%] mb-[6%] shadow-lg">
        <div className="text-white/50 uppercase tracking-wider mb-[2%]" style={{ fontSize: "clamp(7px, 2.8%, 11px)" }}>Projected Weight</div>
        <div className="flex items-end gap-[4%]">
          <span className="text-white font-bold tracking-tight tabular-nums" style={{ fontSize: "clamp(28px, 12%, 48px)" }}>
            {projectedWeight.toFixed(1)}<span className="text-white/40 font-normal ml-1" style={{ fontSize: "0.5em" }}>kg</span>
          </span>
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0, ease: easeOut }}
            className="flex items-center bg-[#D4FF00]/10 text-[#D4FF00] px-[3%] py-[1%] rounded-full mb-[2%]"
            style={{ fontSize: "clamp(8px, 3.2%, 13px)" }}
          >
            <TrendingDown className="w-[1em] h-[1em] mr-1" />
            <span className="tabular-nums">{percentDrop}%</span>
          </motion.div>
        </div>
        <div className="text-white/40 mt-[4%]" style={{ fontSize: "clamp(7px, 2.8%, 11px)" }}>In 12 Weeks (Based on 85% compliance)</div>
      </div>

      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[24px] relative overflow-hidden flex flex-col justify-end p-[5%] mt-[2%]">
        <div className="absolute inset-0 flex flex-col justify-between py-[10%] opacity-20">
          {[1,2,3,4].map(i => <div key={i} className="w-full h-[1px] bg-white/20" />)}
        </div>

        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0,20 Q25,30 50,60 T100,90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <motion.path
            d="M0,20 Q25,30 50,60 T100,90"
            fill="none"
            stroke="#D4FF00"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.9, ease: easeOut }}
          />
        </svg>

        <motion.div
          className="absolute bg-[#D4FF00] rounded-full border-2 border-[#1C1C1E] shadow-[0_0_15px_#D4FF00]"
          style={{ width: "8%", aspectRatio: "1", right: "0%", bottom: "10%", x: "50%", y: "50%" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  );
}

function PhoneScreen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 w-full h-full bg-[#0C0C0D] overflow-hidden rounded-[1.8rem]"
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

function StickyScrollFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;
    let entered = false;
    let lastIdx = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const scrollRange = rect.height - viewportH;
      const p = scrollRange > 0
        ? Math.max(0, Math.min(1, -rect.top / scrollRange))
        : 0;

      // Flip hasEntered the first time the section top reaches or passes the
      // viewport top — i.e., the sticky wrapper pins. Before this, the story
      // section renders nothing, so first-load animations don't play offscreen.
      if (!entered && rect.top <= 0) {
        entered = true;
        setHasEntered(true);
      }

      // Pre-trigger: fires ~6% earlier so the change begins as the user
      // approaches the end of a story, not after they cross it.
      const idx = Math.min(Math.floor((p + 0.06) * STORY.length), STORY.length - 1);
      if (idx !== lastIdx) {
        lastIdx = idx;
        setActiveIndex(idx);
      }

      rafId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative bg-[#0A0A0B] text-zinc-50 border-t border-zinc-900"
      style={{ height: `${STORY.length * 160}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <div className="h-full w-full max-w-7xl mx-auto px-6 lg:px-16 py-6 lg:py-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-16">
          {/* Text panel */}
          <div className="relative w-full lg:w-[45%] h-[26vh] lg:h-full flex items-center order-1 shrink-0 lg:shrink">
            <AnimatePresence mode="wait">
              {hasEntered && (
                <StickyStoryText
                  key={activeIndex}
                  step={STORY[activeIndex]}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Phone panel */}
          <div className="relative flex-1 min-h-0 w-full lg:w-[45%] lg:flex-none lg:h-full flex items-center justify-center order-2">
            <PhoneFrame widthClass="w-[clamp(140px,24dvh,200px)] lg:w-[clamp(200px,15vw,280px)]">
              <AnimatePresence mode="wait">
                {hasEntered && (
                  <PhoneScreen key={activeIndex}>
{activeIndex === 0 && <AICoachScreen />}
                  {activeIndex === 1 && <DashboardScreen />}
                  {activeIndex === 2 && <TimelineScreen />}
                  </PhoneScreen>
                )}
              </AnimatePresence>
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

function StickyStoryText({ step }: { step: { title: string; subtitle: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center lg:items-start lg:text-left"
    >
      <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-[1.15] tracking-tight text-white">
        {step.title}
      </h3>
      <p className="mt-3 lg:mt-5 text-sm sm:text-base lg:text-lg text-zinc-400 leading-relaxed max-w-md">
        {step.subtitle}
      </p>
    </motion.div>
  );
}
/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */

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
  const [isHovered, setIsHovered] = useState(false);

  const cal = useDemoNumber(473, 1000, state === 'success', 0);
  const pro = useDemoNumber(35, 1000, state === 'success', 0);
  const fat = useDemoNumber(1.5, 1000, state === 'success', 1);
  const carbs = useDemoNumber(70.5, 1000, state === 'success', 1);

  const handleLog = () => {
    if (state !== 'idle') return;
    setState('loading');
    setTimeout(() => setState('success'), 900);
  };

  const handleReset = () => {
    setState('idle');
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      <div
        aria-hidden
        className="absolute -inset-16 bg-[#D4FF00]/8 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="relative bg-[#0D0D0F] border border-zinc-800/70 rounded-[22px] overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#D4FF00]">
              Live Demo
            </div>
            <div className="text-[12px] text-zinc-500 mt-1">
              See AI parse a real meal
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              Interactive
            </span>
          </div>
        </div>

        <div className="relative h-[380px]">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#141416] px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      Your meal
                    </div>
                    <div className="text-[14px] text-zinc-200 font-medium truncate">
                      soya chunks cooked 150g + 3 roti
                    </div>
                  </div>
                  <span className="w-[2px] h-5 bg-[#D4FF00] rounded-full" />
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-2">
                      Ready to analyze
                    </div>
                    <div className="text-[12px] text-zinc-500">
                      Click below to see macros
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleLog}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: isHovered
                      ? '0 12px 32px -10px rgba(212,255,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4)'
                      : '0 4px 16px -8px rgba(212,255,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                  transition={{ duration: 0.2 }}
                  className="w-full rounded-xl bg-[#D4FF00] text-black py-3.5 text-[14px] font-semibold tracking-tight"
                >
                  Log This Meal
                </motion.button>
              </motion.div>
            )}

            {state === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#141416] px-4 py-3.5 opacity-60">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      Your meal
                    </div>
                    <div className="text-[14px] text-zinc-200 font-medium truncate">
                      soya chunks cooked 150g + 3 roti
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#D4FF00] animate-spin mb-3" />
                  <div className="text-[12px] text-zinc-500">Analyzing your meal...</div>
                </div>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 p-5 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Parsed successfully
                  </span>
                </div>

                <div className="text-[13px] text-zinc-300 mb-4 pb-4 border-b border-zinc-800/60">
                  soya chunks cooked 150g + 3 roti
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Cal', val: cal, unit: '', color: '#FF4D1C' },
                    { label: 'Pro', val: pro, unit: 'g', color: '#D4FF00' },
                    { label: 'Fat', val: fat, unit: 'g', color: '#FFC107' },
                    { label: 'Carb', val: carbs, unit: 'g', color: '#378ADD' },
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className="rounded-lg border border-zinc-800 bg-[#141416] px-2 py-3 text-center"
                    >
                      <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1.5">
                        {chip.label}
                      </div>
                      <div
                        className="text-[15px] font-bold tabular-nums leading-none"
                        style={{ color: chip.color }}
                      >
                        {chip.val}
                        {chip.unit && (
                          <span className="text-[9px] text-zinc-500 ml-0.5 font-medium">
                            {chip.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-zinc-800/60 bg-[#141416] px-3 py-2.5 flex items-start gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4FF00] mt-0.5 shrink-0" />
                  <div className="text-[11.5px] leading-relaxed text-zinc-400">
                    35g protein is excellent for a plant-based meal. Fat is under 2g — add a few almonds or a teaspoon of ghee to round it out.
                  </div>
                </div>

                <div className="flex-1" />

                <button
                  onClick={handleReset}
                  className="w-full text-center text-[12px] font-medium text-zinc-500 hover:text-[#D4FF00] transition-colors py-2"
                >
                  Try another meal
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
      <motion.nav
        className="fixed top-0 w-full z-[999] backdrop-blur-md"
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
      <section className="pt-24 pb-12 sm:pb-16 lg:pb-12 px-6 relative z-100 lg:min-h-[calc(100vh-80px)] flex lg:items-center items-center">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-8">
          <div className="max-w-2xl relative z-100 flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-semibold tracking-tight leading-[1.1] lg:leading-[1.05] mb-4 sm:mb-6"
            >
              The gym builds muscle. Your diet reveals it.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-10 sm:mb-10 leading-relaxed max-w-lg"
            >
              Type what you ate. AI calculates the rest. Built for Indian meals.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              {/* Primary CTA */}
              <motion.button
                onClick={handleEnterApp}
                whileHover={{ scale: 1.03, backgroundColor: "#ffffff" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#D4FF00] text-black w-full sm:w-auto px-6 sm:px-8 py-4 font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide rounded-full"
                style={{ willChange: "transform" }}
              >
                Start Getting Lean
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </motion.button>
              <InstallLeaniqa />
              {/* Secondary CTA */}
              <motion.button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                See how it works <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-5 text-[13px] text-zinc-500"
            >
              Trusted by 10,000+ Indians building discipline. No credit card needed.
            </motion.p>
          </div>
          
          <div className="flex-1 w-full relative z-10 flex justify-center lg:justify-end">
            <InteractiveMealDemo />
          </div>
        </div>
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[#D4FF00] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.15] pointer-events-none" />
        <div className="absolute bottom-1/4 left-[10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-[#378ADD] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.1] pointer-events-none" />
      </section>

      <SocialProofBar />

      {/* ── Storytelling ── */}
      <StickyScrollFeatures />

      {/* TEMPORARILY DISABLED: "Other apps vs LeanIQA" comparison section. */}
      {/* Uncomment the line below and the DisciplineAdvantage() component to restore it. */}
      {/* <DisciplineAdvantage /> */}

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
      <FAQSection />

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
              { name: "Starter", price: "Free",   sub: "For exploring the basics", accent: "#378ADD", features: ["Manual calorie tracking","Basic macro splits","Standard food database"], missing: ["AI Meal Parsing","Adaptive Targets", "Timeline Predictions"], badge: null, delay: 0 },
              { name: "Serious",  price: "₹499",   sub: "per month · for people who want results", accent: LIME,     features: ["Unlimited AI Meal Logging","Adaptive Calorie & Macro Targets","Consistency Engine & Analytics","Physique Prediction Timeline","Priority Support"], missing: [], badge: "Most Popular", delay: 0.1 },
            ].map((p, i) => (
              <Reveal key={i} delay={p.delay}>
                <motion.div
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: p.badge ? "rgba(212,255,0,0.04)" : "rgba(255,255,255,0.02)",
                    border: p.badge ? `2px solid ${LIME}40` : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 24,
                    padding: "32px 24px",
                    boxShadow: p.badge ? `0 0 60px ${LIME}10` : "none",
                    position: "relative",
                    overflow: "hidden",
                    height: "100%",
                    willChange: "transform",
                  }}
                >
                  {p.badge && (
                    <div style={{ position: "absolute", top: 0, right: 0, background: LIME, color: "#020817", fontSize: 10, fontWeight: 800, padding: "6px 16px", borderRadius: "0 22px 0 16px", letterSpacing: 1, textTransform: "uppercase" }}>
                      {p.badge}
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{p.name}</div>
                  <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, color: "#F1F5F9", lineHeight: 1 }}>{p.price}</div>
                  <div style={{ fontSize: 14, color: "#64748B", marginTop: 8, marginBottom: 32 }}>{p.sub}</div>
                  {p.name === "Serious" && (
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>
                      Roughly the cost of one takeaway meal per week.
                    </div>
                  )}
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
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-32 px-6 border-t border-zinc-900 bg-[#0A0A0B] text-center relative z-[100]">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
           <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-[#FF4D1C]/10 via-[#378ADD]/5 to-[#D4FF00]/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-[100]">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 tracking-tight leading-[1.1]">
            Lean is earned.
          </h2>
          <p className="text-[#D4FF00] mb-10 text-lg sm:text-xl font-medium">
            Join Team Lean and start building discipline today.
          </p>
          <motion.button
            onClick={handleEnterApp}
            whileHover={{ scale: 1.04, backgroundColor: "#D4FF00" }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white text-black px-8 py-4 font-semibold inline-flex items-center gap-2 text-sm uppercase tracking-wide rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            style={{ willChange: "transform" }}
          >
            Start Your Journey <ArrowRight className="w-4 h-4" />
          </motion.button>
          <div className="mt-4 flex justify-center"><InstallLeaniqa /></div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-zinc-500 text-xs flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-center md:text-left">
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
