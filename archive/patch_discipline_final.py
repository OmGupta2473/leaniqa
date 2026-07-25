import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

start_str = "function DisciplineAdvantage() {"
end_str = "function HowItWorks() {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find DisciplineAdvantage or HowItWorks")
    exit(1)

new_code = """function DisciplineAdvantage() {
  const battles = [
    {
      icon: ClipboardList,
      other: {
        title: "Passive food diary",
        desc: "You log, it stores.",
        demo: (
          <div className="bg-[#18181A] rounded-xl border border-white/5 p-4 mt-4 shadow-inner">
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
          <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-4 mt-4 relative overflow-hidden shadow-xl shadow-[#D4FF00]/5">
             <div className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5 font-medium">
               <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]"/> AI Coach
             </div>
             <div className="flex items-start justify-between gap-4">
               <div className="flex-1">
                 <div className="bg-[#18181A] p-3 rounded-lg border border-white/5 text-xs text-zinc-300 leading-relaxed mb-3 inline-block rounded-tl-sm">
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
          <div className="bg-[#18181A] rounded-xl border border-white/5 p-4 mt-4 shadow-inner">
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
          <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-4 mt-4 shadow-xl shadow-[#D4FF00]/5">
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
             
             <div className="mt-5 pt-3 border-t border-white/5 flex items-start gap-2.5 bg-[#D4FF00]/5 -mx-4 -mb-4 p-4">
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
          <div className="bg-[#18181A] rounded-xl border border-white/5 p-5 mt-4 shadow-inner">
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
          <div className="bg-zinc-900/80 rounded-xl border border-white/5 p-4 mt-4 shadow-xl shadow-[#D4FF00]/5">
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
             
             <div className="relative mt-8 mb-6 px-4">
               <div className="h-2 w-full bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-[#D4FF00]/80 to-[#D4FF00] w-[20%] rounded-full shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
               </div>
               <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(212,255,0,0.4)] border-[3px] border-[#D4FF00] z-10" />
               
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-600 rounded-full" />
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-800 rounded-full" />
             </div>
             
             <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2.5 bg-[#D4FF00]/5 -mx-4 -mb-4 p-4">
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
    <section className="py-24 sm:py-32 px-6 bg-[#0A0A0B] overflow-hidden" id="discipline">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 md:mb-24 max-w-4xl mx-auto text-center md:text-left">
          <Reveal>
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" />
              WHY LEANIQA
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6 leading-tight">
              Most apps are food diaries.<br/>
              Leaniqa is a <span className="text-[#D4FF00]">discipline engine.</span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed mx-auto md:mx-0">
              People don't fail transformations because they lack information.<br className="hidden sm:block"/>
              They fail because rigid plans break when real life happens.<br className="hidden sm:block"/>
              <span className="text-zinc-300 font-medium">Leaniqa is built around that reality.</span>
            </p>
          </Reveal>
        </div>

        {/* Labels for Desktop */}
        <div className="hidden md:flex justify-between max-w-5xl mx-auto mb-8 px-12 relative z-10">
           <div className="w-[45%] flex justify-center">
             <div className="px-5 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest shadow-lg backdrop-blur-sm">
               OTHER APPS
             </div>
           </div>
           <div className="w-[45%] flex justify-center">
             <div className="px-5 py-2 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[10px] sm:text-xs font-semibold text-[#D4FF00] uppercase tracking-widest shadow-[0_0_20px_rgba(212,255,0,0.1)] backdrop-blur-sm">
               LEANIQA
             </div>
           </div>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Center vertical dashed line for desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-zinc-800 -translate-x-1/2 z-0" />
          
          <div className="space-y-12 md:space-y-16 relative z-10">
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
                 <div className="w-full md:w-[45%] flex flex-col">
                   <div className="md:hidden flex justify-center mb-4">
                     <div className="px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest inline-flex items-center gap-2">
                       <X className="w-3 h-3 text-red-500" /> OTHER APPS
                     </div>
                   </div>
                   <Reveal delay={i * 0.1} className="flex-1">
                     <div className="bg-gradient-to-br from-[#111112] to-[#0A0A0B] rounded-[2rem] p-6 md:p-8 border border-zinc-800/80 h-full flex flex-col hover:border-zinc-700 transition-colors duration-300 shadow-xl shadow-black/50">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 flex-shrink-0">
                           <X className="w-4 h-4 text-red-500" />
                         </div>
                         <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{b.other.title}</h3>
                       </div>
                       <p className="text-zinc-400 text-sm md:text-base ml-11">{b.other.desc}</p>
                       
                       <div className="mt-auto pt-8">
                         {b.other.demo}
                       </div>
                     </div>
                   </Reveal>
                 </div>

                 {/* Spacer for center icon */}
                 <div className="hidden md:block w-[10%] relative z-10" />

                 {/* Leaniqa (Right) */}
                 <div className="w-full md:w-[45%] flex flex-col">
                   <div className="md:hidden flex justify-center mt-6 mb-4 relative z-10">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200%] w-px h-8 bg-gradient-to-b from-transparent to-[#D4FF00]/50" />
                     <div className="px-4 py-1.5 rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[10px] font-semibold text-[#D4FF00] uppercase tracking-widest inline-flex items-center gap-2">
                       <Check className="w-3 h-3" /> LEANIQA
                     </div>
                   </div>
                   <Reveal delay={i * 0.1 + 0.1} className="flex-1">
                     <div className="bg-gradient-to-b from-[#111112] to-[#0A0A0B] rounded-[2rem] p-6 md:p-8 border border-[#D4FF00]/30 h-full relative group overflow-hidden flex flex-col hover:border-[#D4FF00]/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,255,0,0.1)]">
                       <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                       
                       {/* Shimmer effect */}
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                       
                       <div className="relative z-10 flex flex-col h-full">
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-8 h-8 rounded-full bg-[#D4FF00] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.4)] flex-shrink-0">
                             <Check className="w-4 h-4 text-black font-bold" />
                           </div>
                           <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{b.leaniqa.title}</h3>
                         </div>
                         <p className="text-zinc-300 text-sm md:text-base ml-11">{b.leaniqa.desc}</p>
                         
                         <div className="mt-auto pt-8">
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
          <div className="mt-24 md:mt-32 max-w-5xl mx-auto border border-zinc-800/80 rounded-[2rem] bg-gradient-to-b from-[#111112] to-[#0A0A0B] p-8 md:p-10 shadow-2xl">
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

"""

new_content = content[:start_idx] + new_code + content[end_idx:]

with open('src/LandingPage.tsx', 'w') as f:
    f.write(new_content)
    print("Patched DisciplineAdvantage successfully")

