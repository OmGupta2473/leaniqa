import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

# Update imports
content = content.replace(
    'import { calculateCurrentCalorieStreak, calculateCurrentProteinStreak } from "@/shared/utils/streaks";',
    'import { calculateCurrentDailyStreak } from "@/shared/utils/streaks";'
)

# Update streak calculations
content = re.sub(
    r'  const calorieStreak = calculateCurrentCalorieStreak\(metrics\);\n  const proteinStreak = calculateCurrentProteinStreak\(metrics\);',
    r'  const currentStreak = calculateCurrentDailyStreak(metrics);',
    content
)

# Update header block
header_pattern = r'      \{\/\* Date & Name \*\/.*?      </div>\n\n      \{\/\* Streak chips \*\/.*?      </div>'
new_header = """      {/* Date & Name */}
      <div className="flex justify-between items-center mb-[24px]">
        <div>
          <h2 className="text-[22px] font-semibold text-white tracking-[-0.3px] mb-1">
            Hi, {name}
          </h2>
          <div className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#EBEBF599]">
            {dateString}
          </div>
        </div>
        <div className="flex gap-[16px]">
          {/* Streak */}
          <div className="flex flex-col items-center">
            <motion.div
              key={currentStreak}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-[44px] h-[44px] rounded-[100px] border-[1.5px] border-[#FF4D1C] flex items-center justify-center text-[#FF4D1C] text-[17px] font-bold bg-[rgba(255,77,28,0.05)] shadow-[0_0_15px_rgba(255,77,28,0.2)] gap-1"
            >
              <span className="text-[14px]">🔥</span>{currentStreak > 0 ? currentStreak : 0}
            </motion.div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mt-[8px]">
              Streak
            </div>
          </div>
          {/* Score */}
          <div className="flex flex-col items-center">
            <motion.div
              key={todayScore}
              initial={{ scale: 1.3, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-[44px] h-[44px] rounded-[100px] border-[1.5px] border-[#D4FF00] flex items-center justify-center text-[#D4FF00] text-[17px] font-bold shadow-[0_0_15px_rgba(212,255,0,0.2)] bg-[rgba(212,255,0,0.05)]"
            >
              {todayScore}
            </motion.div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mt-[8px]">
              Score
            </div>
          </div>
        </div>
      </div>"""

content = re.sub(header_pattern, new_header, content, flags=re.DOTALL)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
