import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# Replace the layout in HowItWorks
old_layout = """        <div className="relative max-w-4xl mx-auto" ref={containerRef}>
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
        </div>"""

new_layout = """        <div className="relative max-w-4xl mx-auto pl-6 md:pl-0" ref={containerRef}>
          {/* Central connecting line for Desktop, Left line for Mobile */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-zinc-800 md:-translate-x-1/2" />
          <motion.div 
            className="absolute left-0 md:left-1/2 top-0 w-px bg-gradient-to-b from-[#D4FF00] to-transparent md:-translate-x-1/2 origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-12 md:space-y-24">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;
              return (
                <Reveal key={i} delay={0.1}>
                  <div className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    
                    {/* Center Node Desktop / Left Node Mobile */}
                    <div className="flex absolute left-0 md:left-1/2 top-12 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full bg-[#0A0A0B] border-2 border-zinc-800 items-center justify-center z-10 transition-colors duration-500 delay-300">
                       <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 transition-colors duration-500 group-hover:bg-[#D4FF00]" />
                    </div>

                    {/* Content */}
                    <div className="w-full md:w-1/2">
                       <div className="bg-[#111112] border border-zinc-800/60 rounded-3xl p-6 md:p-8 relative group hover:-translate-y-2 transition-all duration-500 hover:border-[#D4FF00]/40 hover:shadow-[0_10px_40px_rgba(212,255,0,0.05)] overflow-hidden">
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
        </div>"""

if old_layout in content:
    content = content.replace(old_layout, new_layout)
    with open('src/LandingPage.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find old layout")
