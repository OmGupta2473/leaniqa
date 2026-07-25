import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

# Update imports
content = content.replace(
    'import { calculateCurrentCalorieStreak, calculateCurrentProteinStreak } from "@/shared/utils/streaks";',
    'import { calculateCurrentDailyStreak } from "@/shared/utils/streaks";'
)

# Update streak calculations
content = content.replace('  const calorieStreak = calculateCurrentCalorieStreak(metrics);\n  const proteinStreak = calculateCurrentProteinStreak(metrics);', '  const currentStreak = calculateCurrentDailyStreak(metrics);')

# Update the Card 1 section
old_card_1 = """      {/* Card 1: Score & Streaks */}
      <div className="flex gap-[12px] mb-[28px]">
        {/* Score */}
        <div className="glass-card flex-1 p-[20px] flex flex-col justify-center">
          <div className="flex items-center gap-[6px] mb-[12px]">
            <Award size={14} className="text-[#EBEBF599]" />
            <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">
              Compliance Score
            </div>
          </div>
          <div className="text-[48px] font-bold tracking-[-0.04em] leading-[1] mb-[4px] text-white">
            {currentScore}
          </div>
          <div className="text-[14px] font-medium text-[#EBEBF599]">
            {currentScore >= 90
              ? "Excellent consistency"
              : currentScore >= 75
                ? "Good consistency"
                : currentScore >= 50
                  ? "Needs improvement"
                  : "Let's get back on track"}
          </div>
        </div>

        {/* Streak chips */}
        <div className="flex flex-col gap-[12px]">
          {/* Calorie streak */}
          <div className={`streak-chip ${calorieStreak >= 7 ? 'hot' : ''}`}>
            <div className="streak-icon">🔥</div>
            <div className="streak-info">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(235,235,245,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Calorie
              </div>
              <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: calorieStreak > 0 ? '#D4FF00' : 'rgba(235,235,245,0.4)', lineHeight: 1 }}>
                {calorieStreak > 0 ? calorieStreak : '—'}
              </div>
            </div>
          </div>
          {/* Protein streak */}
          <div className={`streak-chip ${proteinStreak >= 7 ? 'hot-protein' : ''}`}>
            <div className="streak-icon">💪</div>
            <div className="streak-info">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(235,235,245,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Protein
              </div>
              <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: proteinStreak > 0 ? '#FF4D1C' : 'rgba(235,235,245,0.4)', lineHeight: 1 }}>
                {proteinStreak > 0 ? proteinStreak : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>"""

new_card_1 = """      {/* Card 1: Score & Streaks */}
      <div className="flex gap-[12px] mb-[28px]">
        {/* Streak */}
        <div className={`streak-chip ${currentStreak >= 7 ? 'hot' : ''} flex-1`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '20px' }}>
          <div className="flex items-center gap-[6px] mb-[12px]">
             <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">
              Daily Streak
            </div>
          </div>
          <div className="flex items-center gap-[12px]">
             <div className="text-[48px] font-bold tracking-[-0.04em] leading-[1] text-[#D4FF00]">
               {currentStreak > 0 ? currentStreak : '—'}
             </div>
             <div className="text-[32px]">{currentStreak > 0 ? '🔥' : '❄️'}</div>
          </div>
          <div className="text-[14px] font-medium text-[#EBEBF599] mt-[4px]">
             {currentStreak > 0 ? 'Days on target' : 'Hit targets to start'}
          </div>
        </div>

        {/* Score */}
        <div className="glass-card flex-1 p-[20px] flex flex-col justify-center">
          <div className="flex items-center gap-[6px] mb-[12px]">
            <Award size={14} className="text-[#EBEBF599]" />
            <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">
              Compliance Score
            </div>
          </div>
          <div className="text-[48px] font-bold tracking-[-0.04em] leading-[1] mb-[4px] text-white">
            {currentScore}
          </div>
          <div className="text-[14px] font-medium text-[#EBEBF599]">
            {currentScore >= 90
              ? "Excellent consistency"
              : currentScore >= 75
                ? "Good consistency"
                : currentScore >= 50
                  ? "Needs improvement"
                  : "Let's get back on track"}
          </div>
        </div>
      </div>"""

content = content.replace(old_card_1, new_card_1)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
