import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# First, extract HowItWorks completely to replace it
start_str = "function HowItWorks() {"
end_str = "function TestimonialStrip() {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find HowItWorks or TestimonialStrip")
    exit(1)

new_how_it_works = """function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Target,
      title: "Define Your Goal",
      desc: "Input your weight, body fat %, and goal. LeanIQA calculates your deficit, macro targets, and a precise completion date.",
      demo: (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 mt-4 group-hover:border-[#D4FF00]/30 transition-colors duration-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400 font-medium">Goal Weight</span>
            <span className="text-xs text-[#D4FF00] flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Calculated</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-300 line-through opacity-50">62kg</span>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
            <span className="text-3xl font-bold text-white">55kg</span>
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
        <div className="mt-4 flex flex-col gap-2">
          <div className="bg-[#D4FF00]/10 border border-[#D4FF00]/20 rounded-2xl rounded-tr-sm p-3 text-sm text-[#D4FF00] self-end max-w-[90%] group-hover:bg-[#D4FF00]/20 transition-colors duration-500">
            2 Roti, Dal, 100g Paneer
          </div>
          <div className="bg-zinc-800/50 border border-white/5 rounded-2xl rounded-tl-sm p-3 text-xs text-zinc-300 self-start max-w-[90%] shadow-lg">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
              <CheckCircle2 className="w-3 h-3 text-[#D4FF00]" />
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
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 mt-4 group-hover:border-[#D4FF00]/30 transition-colors duration-500">
           <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Today's Score</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4FF00]/10 text-[#D4FF00]">Excellent</span>
          </div>
          <div className="flex items-end gap-1 mb-3">
             <span className="text-4xl font-bold text-white leading-none">91</span>
             <span className="text-sm text-zinc-500 mb-1">/100</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 mt-4 relative overflow-hidden group-hover:border-[#D4FF00]/30 transition-colors duration-500">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
           <div className="flex items-center justify-between text-xs font-medium">
             <div className="flex flex-col items-center">
               <div className="w-2 h-2 rounded-full bg-[#D4FF00] mb-2 shadow-[0_0_8px_#D4FF00]" />
               <span className="text-white">Week 1</span>
             </div>
             <div className="h-px bg-zinc-800 flex-1 mx-2 relative">
               <div className="absolute left-0 top-0 h-full bg-[#D4FF00]/50 w-[50%]" />
             </div>
             <div className="flex flex-col items-center">
               <div className="w-2 h-2 rounded-full bg-zinc-700 mb-2" />
               <span className="text-zinc-500">Week 6</span>
             </div>
             <div className="h-px bg-zinc-800 flex-1 mx-2" />
             <div className="flex flex-col items-center">
               <div className="w-2 h-2 rounded-full bg-zinc-700 mb-2" />
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
    <section className="py-24 sm:py-32 px-6 border-t border-zinc-900 bg-[#0A0A0B] overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <Reveal>
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-3">
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

        <div className="relative max-w-4xl mx-auto" ref={containerRef}>
          {/* Central connecting line for Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2" />
          <motion.div 
            className="hidden md:block absolute left-1/2 top-0 w-px bg-gradient-to-b from-[#D4FF00] to-transparent -translate-x-1/2 origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-12 md:space-y-24">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;
              return (
                <Reveal key={i} delay={0.1}>
                  <div className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    
                    {/* Center Node */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0A0A0B] border-2 border-zinc-800 items-center justify-center z-10 transition-colors duration-500 delay-300">
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 transition-colors duration-500" />
                    </div>

                    {/* Content */}
                    <div className="w-full md:w-1/2">
                       <div className="bg-[#111112] border border-zinc-800/60 rounded-3xl p-8 relative group hover:-translate-y-2 transition-all duration-500 hover:border-[#D4FF00]/40 hover:shadow-[0_10px_40px_rgba(212,255,0,0.05)] overflow-hidden">
                          {/* Background blurred number */}
                          <div className="absolute -right-4 -bottom-8 text-9xl font-black text-white/5 blur-sm select-none pointer-events-none group-hover:text-[#D4FF00]/10 transition-colors duration-500">
                             {s.number}
                          </div>

                          <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#D4FF00]/10 group-hover:border-[#D4FF00]/30 transition-all duration-500">
                              <s.icon className="w-6 h-6 text-zinc-400 group-hover:text-[#D4FF00] transition-colors duration-500" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 tracking-tight">
                              {s.title}
                            </h3>
                            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                              {s.desc}
                            </p>
                            
                            {/* Live Demo */}
                            <div className="mt-8">
                              {s.demo}
                            </div>
                          </div>
                       </div>
                    </div>

                    {/* Empty space for alternating layout */}
                    <div className="hidden md:block w-1/2" />
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

"""

new_content = content[:start_idx] + new_how_it_works + content[end_idx:]

with open('src/LandingPage.tsx', 'w') as f:
    f.write(new_content)

