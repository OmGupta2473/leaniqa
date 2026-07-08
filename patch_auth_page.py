import re

with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    content = f.read()

old_left_col = """      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden lg:border-r border-white/5 lg:bg-[#0F0F11] w-full lg:w-1/2 flex-shrink-0">
        
        {/* Desktop glow effects */}
        <div className="hidden lg:block absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4FF00]/10 blur-[120px] pointer-events-none" />
        <div className="hidden lg:block absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4FF00]/5 blur-[120px] pointer-events-none" />
        
        {/* Header / Logo */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-3 mt-4 sm:mt-6 lg:mt-0 lg:absolute lg:top-12 xl:top-16 lg:left-12 xl:left-16 z-10 w-full lg:w-auto">
           <div className="w-16 h-16 lg:w-12 lg:h-12 rounded-[18px] lg:rounded-xl bg-[#D4FF00]/10 flex items-center justify-center border border-[#D4FF00]/20 shadow-[0_0_30px_rgba(212,255,0,0.15)] lg:shadow-none">
              <DumbbellIcon className="w-8 h-8 lg:w-6 lg:h-6 text-[#D4FF00]" />
           </div>
           <span className="text-[28px] lg:text-[24px] font-bold tracking-tight">LeanIQA</span>
        </div>

        {/* Mobile Subtitle */}
        <p className="lg:hidden text-[16px] text-white/60 font-medium tracking-tight mt-2 text-center w-full max-w-[280px]">
           Your AI Body Transformation Coach
        </p>
        
        {/* Desktop Hero Content */}
        <div className="hidden lg:flex flex-col z-10 w-full max-w-[500px]">
           <h2 className="text-[clamp(36px,4vw,56px)] font-bold tracking-tight leading-[1.1] text-white mb-6 xl:mb-8">
              Your AI Body <br/><span className="text-[#D4FF00]">Transformation Coach</span>
           </h2>
           <p className="text-[clamp(16px,1.5vw,18px)] text-white/60 font-medium tracking-tight leading-relaxed mb-8 xl:mb-12 max-w-[400px]">
              Track nutrition. Build consistency. Transform your physique with precision.
           </p>
           
           <div className="flex flex-col gap-5 xl:gap-6">
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                AI Nutrition Coach
             </div>
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                Daily Progress Tracking
             </div>
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                Secure Authentication
             </div>
           </div>
        </div>
        
        {/* Trusted By (Desktop Only) */}
        <div className="hidden lg:block absolute bottom-12 xl:bottom-16 left-12 xl:left-16 z-10 text-[14px] text-white/40 font-medium">
           Trusted by athletes and fitness enthusiasts.
        </div>
      </div>"""

new_left_col = """      {/* Hero Section */}
      <div className="relative flex flex-col p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden lg:border-r border-white/5 lg:bg-[#0F0F11] w-full lg:w-1/2 flex-shrink-0 min-h-[40vh]">
        
        {/* Desktop glow effects */}
        <div className="hidden lg:block absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4FF00]/10 blur-[120px] pointer-events-none" />
        <div className="hidden lg:block absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4FF00]/5 blur-[120px] pointer-events-none" />
        
        {/* Header / Logo */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-3 mt-4 sm:mt-6 lg:mt-0 z-10 w-full lg:w-auto lg:self-start">
           <div className="w-16 h-16 lg:w-12 lg:h-12 rounded-[18px] lg:rounded-xl bg-[#D4FF00]/10 flex items-center justify-center border border-[#D4FF00]/20 shadow-[0_0_30px_rgba(212,255,0,0.15)] lg:shadow-none">
              <DumbbellIcon className="w-8 h-8 lg:w-6 lg:h-6 text-[#D4FF00]" />
           </div>
           <span className="text-[28px] lg:text-[24px] font-bold tracking-tight">LeanIQA</span>
        </div>

        {/* Mobile Subtitle */}
        <p className="lg:hidden text-[16px] text-white/60 font-medium tracking-tight mt-2 text-center w-full max-w-[280px] self-center">
           Your AI Body Transformation Coach
        </p>
        
        {/* Desktop Hero Content */}
        <div className="hidden lg:flex flex-col justify-center flex-1 z-10 w-full max-w-[500px] lg:self-center py-10">
           <h2 className="text-[clamp(36px,4vw,56px)] font-bold tracking-tight leading-[1.1] text-white mb-6 xl:mb-8">
              Your AI Body <br/><span className="text-[#D4FF00]">Transformation Coach</span>
           </h2>
           <p className="text-[clamp(16px,1.5vw,18px)] text-white/60 font-medium tracking-tight leading-relaxed mb-8 xl:mb-12 max-w-[400px]">
              Track nutrition. Build consistency. Transform your physique with precision.
           </p>
           
           <div className="flex flex-col gap-5 xl:gap-6">
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                AI Nutrition Coach
             </div>
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                Daily Progress Tracking
             </div>
             <div className="flex items-center gap-4 text-[15px] xl:text-[16px] text-white/80 font-medium">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#D4FF00] text-sm flex-shrink-0">✓</div>
                Secure Authentication
             </div>
           </div>
        </div>
        
        {/* Trusted By (Desktop Only) */}
        <div className="hidden lg:block z-10 text-[14px] text-white/40 font-medium lg:self-start">
           Trusted by athletes and fitness enthusiasts.
        </div>
      </div>"""

content = content.replace(old_left_col, new_left_col)

with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(content)
