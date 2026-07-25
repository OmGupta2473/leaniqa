import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

old_layout = """          <div className="space-y-12 md:space-y-24">
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
          </div>"""

new_layout = """          <div className="space-y-12 md:space-y-0">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;
              
              const CardContent = (
                <div className="bg-[#111112] border border-zinc-800/60 rounded-3xl p-6 md:p-8 relative group hover:-translate-y-2 transition-all duration-500 hover:border-[#D4FF00]/40 hover:shadow-[0_10px_40px_rgba(212,255,0,0.05)] overflow-hidden w-full">
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
              );

              return (
                <Reveal key={i} delay={0.1}>
                  {/* We use a grid for desktop to properly place it in columns, and flex for mobile */}
                  <div className="relative grid grid-cols-1 md:grid-cols-2 md:gap-16 items-center w-full md:py-12">
                    
                    {/* Center Node Desktop / Left Node Mobile */}
                    <div className="flex absolute left-0 md:left-1/2 top-12 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full bg-[#0A0A0B] border-2 border-zinc-800 items-center justify-center z-10 transition-colors duration-500 delay-300">
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
          </div>"""

if old_layout in content:
    content = content.replace(old_layout, new_layout)
    with open('src/LandingPage.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find old layout")
