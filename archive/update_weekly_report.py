import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

# Imports
content = content.replace(
    'import { calculateCurrentCalorieStreak, calculateCurrentProteinStreak, calculateEarnedAwards } from \'@/shared/utils/streaks\';',
    'import { calculateCurrentDailyStreak, calculateEarnedAwards } from \'@/shared/utils/streaks\';'
)

# Variable calculations
content = content.replace(
    '  const calorieStreak = calculateCurrentCalorieStreak(dailyMetrics);\n  const proteinStreak = calculateCurrentProteinStreak(dailyMetrics);',
    '  const currentStreak = calculateCurrentDailyStreak(dailyMetrics);'
)

# Remove the two separate streak divs and replace with one
old_streak_blocks = r"""            <div className="stat-tile">
              <div className="stat-tile-label">Calorie streak</div>
              <div className="stat-tile-value" style={{ color: '#D4FF00' }}>
                {calorieStreak} <span className="stat-tile-unit" style={{ color: 'rgba(212,255,0,0.5)' }}>days 🔥</span>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Protein streak</div>
              <div className="stat-tile-value" style={{ color: '#FF4D1C' }}>
                {proteinStreak} <span className="stat-tile-unit" style={{ color: 'rgba(255,77,28,0.5)' }}>days 💪</span>
              </div>
            </div>"""

new_streak_block = """            <div className="stat-tile">
              <div className="stat-tile-label">Daily streak</div>
              <div className="stat-tile-value" style={{ color: '#D4FF00' }}>
                {currentStreak} <span className="stat-tile-unit" style={{ color: 'rgba(212,255,0,0.5)' }}>days 🔥</span>
              </div>
            </div>"""

content = content.replace(old_streak_blocks, new_streak_block)

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
