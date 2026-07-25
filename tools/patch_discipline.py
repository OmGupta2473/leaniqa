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
      title: "Accountability",
      other: "Passive Food Diary",
      leaniqa: "AI Coaches You Daily",
      demo: (
        <div className="flex flex-col gap-3">
          <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-3 text-sm text-zinc-300">
            🍛 2 Roti, Dal
            <div className="flex items-center gap-1 mt-2 text-[#D4FF00] text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3"/> Logged
            </div>
          </div>
          <div className="bg-[#D4FF00]/10 border border-[#D4FF00]/20 rounded-xl p-3 text-xs text-[#D4FF00]">
            <span className="font-semibold block mb-1">AI Coach</span>
            +32g Protein Needed to hit today's target.
          </div>
        </div>
      )
    },
    {
      title: "Progress Metric",
      other: "Shows Calories",
      leaniqa: "Daily Score",
      demo: (
        <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Today's Score</span>
            <span className="text-2xl font-bold text-white">91</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-[#D4FF00] w-[91%]" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Calories</span>
            <span className="text-zinc-300">1780 / 2100</span>
          </div>
        </div>
      )
    },
    {
      title: "Goal Clarity",
      other: "Generic Goal",
      leaniqa: "Exact Finish Date",
      demo: (
        <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-4 flex items-center justify-between">
           <div className="text-center">
             <div className="text-xs text-zinc-500 mb-1">Today</div>
             <div className="text-lg font-bold text-zinc-300">62kg</div>
           </div>
           <div className="flex flex-col items-center flex-1 px-4">
             <ArrowRight className="w-4 h-4 text-[#D4FF00] mb-1" />
             <div className="text-[10px] text-[#D4FF00] font-mono bg-[#D4FF00]/10 px-2 py-0.5 rounded-full">Nov 28</div>
           </div>
           <div className="text-center">
             <div className="text-xs text-zinc-500 mb-1">Goal</div>
             <div className="text-lg font-bold text-white">55kg</div>
           </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-24 sm:py-32 px-6 border-t border-zinc-900 bg-[#0A0A0B] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <Reveal>
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-3">
              WHY LEANIQA
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6">
              Most Apps Count Calories.<br/>
              <span className="text-zinc-500">Leaniqa Builds Discipline.</span>
            </h2>
          </Reveal>
        </div>

        <div className="space-y-6">
          {battles.map((b, i) => (
             <Reveal key={i} delay={0.1}>
               <div className="group relative bg-[#111112] border border-zinc-800/60 rounded-3xl overflow-hidden hover:border-[#D4FF00]/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,255,0,0.05)]">
                 <div className="flex flex-col md:flex-row">
                   
                   {/* Other Apps (Left) */}
                   <div className="md:w-5/12 p-8 md:p-10 border-b md:border-b-0 md:border-r border-zinc-800/60 bg-zinc-900/20 relative overflow-hidden group-hover:opacity-40 transition-opacity duration-500">
                     <div className="text-xs font-mono text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                       Other Apps
                     </div>
                     <h3 className="text-xl sm:text-2xl font-semibold text-zinc-500 line-through decoration-red-500/30">
                       {b.other}
                     </h3>
                   </div>

                   {/* Leaniqa (Right) */}
                   <div className="md:w-7/12 p-8 md:p-10 relative bg-gradient-to-br from-transparent to-[#D4FF00]/[0.02]">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                     <div className="relative z-10">
                       <div className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-6 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" />
                         Leaniqa
                       </div>
                       
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                         <h3 className="text-xl sm:text-2xl font-semibold text-white group-hover:text-[#D4FF00] transition-colors duration-500">
                           {b.leaniqa}
                         </h3>
                         
                         <div className="w-full sm:w-64 flex-shrink-0">
                           {b.demo}
                         </div>
                       </div>
                     </div>
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

"""

new_content = content[:start_idx] + new_code + content[end_idx:]

with open('src/LandingPage.tsx', 'w') as f:
    f.write(new_content)

