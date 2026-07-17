import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

# Replace hardcoded targets
c = re.sub(
    r'(const fatTarget = 60;\s*// fallback target\s*const carbsTarget = 200;\s*// fallback target)',
    r'const fatTarget = onboardingData?.fatMid || 0;\n  const carbsTarget = onboardingData?.carbMid || 0;',
    c
)

c = re.sub(
    r'(const proteinTarget = profile\?\.protein_target \?\? onboardingData\?\.proteinMid;)',
    r'\1 || 0;',
    c
)

c = re.sub(
    r'(const dailyTargetKcal =.*?\n.*?\n.*?\n.*?;)',
    r'const dailyTargetKcal = (profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : onboardingData?.dailyCalorieGoal) || 0;',
    c
)

# Add remaining text helper
helper = """
  const getRemainingText = (eaten: number, target: number, unit: string = '') => {
    if (!target) return 'No target set';
    const diff = target - eaten;
    if (diff > 0) return `${Math.round(diff)}${unit} left`;
    if (diff < 0) return `${Math.round(Math.abs(diff))}${unit} over`;
    return 'Goal met';
  };
"""
if "getRemainingText" not in c:
    c = c.replace("const calPct =", helper + "\n  const calPct =")

# Update Calorie Ring text
ring_old = """
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[32px] font-bold tracking-tight text-white leading-none mb-1">
                <AnimatedNumber value={eatenKcal} duration={1000} />
              </div>
              <div className="text-[13px] text-[rgba(255,255,255,0.4)]">
                / {dailyTargetKcal || 0} kcal
              </div>
            </div>"""

ring_new = """
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[32px] font-bold tracking-tight text-white leading-none mb-1">
                <AnimatedNumber value={eatenKcal} duration={1000} />
              </div>
              <div className="text-[13px] text-[rgba(255,255,255,0.4)] mb-2">
                / {dailyTargetKcal || 0} kcal
              </div>
              <div className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${eatenKcal > dailyTargetKcal && dailyTargetKcal > 0 ? 'bg-[rgba(255,77,28,0.15)] text-[#FF4D1C]' : 'bg-[rgba(212,255,0,0.1)] text-[#D4FF00]'}`}>
                {getRemainingText(eatenKcal, dailyTargetKcal, '')}
              </div>
            </div>"""
c = c.replace(ring_old, ring_new)

# Update Macro row
macro_old = """
          {/* 4. Macro row */}
          <div className="flex gap-3 mb-6 stagger-children">
            {/* Protein */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/protein')} className="card-base flex-1 flex flex-col items-center py-4 cursor-pointer">
              <div className="text-[18px] font-semibold text-[#378ADD] leading-none mb-1">
                <AnimatedNumber value={eatenProtein} duration={800} />g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Protein
              </div>
              <div className="progress-track w-12 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className="h-full bg-[#378ADD] rounded-full" style={{ width: mounted ? `${proPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s" }} />
              </div>
            </motion.div>
            {/* Fat */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base flex-1 flex flex-col items-center py-4 cursor-pointer">
              <div className="text-[18px] font-semibold text-[#FF4D1C] leading-none mb-1">
                <AnimatedNumber value={eatenFat} duration={800} />g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Fat
              </div>
              <div className="progress-track w-12 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className="h-full bg-[#FF4D1C] rounded-full" style={{ width: mounted ? `${fatPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s" }} />
              </div>
            </motion.div>
            {/* Carbs */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base flex-1 flex flex-col items-center py-4 cursor-pointer">
              <div className="text-[18px] font-semibold text-[#D4FF00] leading-none mb-1">
                <AnimatedNumber value={eatenCarbs} duration={800} />g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Carbs
              </div>
              <div className="progress-track w-12 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className="h-full bg-[#D4FF00] rounded-full" style={{ width: mounted ? `${carbPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.5s" }} />
              </div>
            </motion.div>
          </div>"""

macro_new = """
          {/* 4. Macro row */}
          <div className="flex gap-2 mb-6 stagger-children">
            {/* Protein */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/protein')} className="card-base flex-1 flex flex-col items-center py-3 px-1 cursor-pointer">
              <div className="text-[16px] font-semibold text-[#378ADD] leading-none mb-0.5 flex items-baseline gap-[1px]">
                <AnimatedNumber value={eatenProtein} duration={800} />
                <span className="text-[10px] text-[rgba(255,255,255,0.4)]">/ {proteinTarget || 0}g</span>
              </div>
              <div className={`text-[9px] uppercase tracking-wider mb-2 ${eatenProtein > proteinTarget && proteinTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.38)]'}`}>
                {eatenProtein > proteinTarget && proteinTarget > 0 ? 'Over' : 'Protein'}
              </div>
              <div className="progress-track w-full max-w-[48px] h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className={`h-full rounded-full ${eatenProtein > proteinTarget && proteinTarget > 0 ? 'bg-[#FF4D1C]' : 'bg-[#378ADD]'}`} style={{ width: mounted ? `${proPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s" }} />
              </div>
            </motion.div>
            
            {/* Fat */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base flex-1 flex flex-col items-center py-3 px-1 cursor-pointer">
              <div className="text-[16px] font-semibold text-[#FF4D1C] leading-none mb-0.5 flex items-baseline gap-[1px]">
                <AnimatedNumber value={eatenFat} duration={800} />
                <span className="text-[10px] text-[rgba(255,255,255,0.4)]">/ {fatTarget || 0}g</span>
              </div>
              <div className={`text-[9px] uppercase tracking-wider mb-2 ${eatenFat > fatTarget && fatTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.38)]'}`}>
                {eatenFat > fatTarget && fatTarget > 0 ? 'Over' : 'Fat'}
              </div>
              <div className="progress-track w-full max-w-[48px] h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className={`h-full rounded-full ${eatenFat > fatTarget && fatTarget > 0 ? 'bg-red-600' : 'bg-[#FF4D1C]'}`} style={{ width: mounted ? `${fatPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s" }} />
              </div>
            </motion.div>
            
            {/* Carbs */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base flex-1 flex flex-col items-center py-3 px-1 cursor-pointer">
              <div className="text-[16px] font-semibold text-[#D4FF00] leading-none mb-0.5 flex items-baseline gap-[1px]">
                <AnimatedNumber value={eatenCarbs} duration={800} />
                <span className="text-[10px] text-[rgba(255,255,255,0.4)]">/ {carbsTarget || 0}g</span>
              </div>
              <div className={`text-[9px] uppercase tracking-wider mb-2 ${eatenCarbs > carbsTarget && carbsTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.38)]'}`}>
                {eatenCarbs > carbsTarget && carbsTarget > 0 ? 'Over' : 'Carbs'}
              </div>
              <div className="progress-track w-full max-w-[48px] h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className={`h-full rounded-full ${eatenCarbs > carbsTarget && carbsTarget > 0 ? 'bg-[#FF4D1C]' : 'bg-[#D4FF00]'}`} style={{ width: mounted ? `${carbPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.5s" }} />
              </div>
            </motion.div>
          </div>"""

c = c.replace(macro_old, macro_new)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

