import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

import_old = """import { calculateCurrentDailyStreak } from "@/shared/utils/streaks";"""
import_new = """import { calculateCurrentDailyStreak, isDailyGoalMet, toUtcDay } from "@/shared/utils/streaks";"""

content = content.replace(import_old, import_new)

old_streak_vars = """  const currentStreak = calculateCurrentDailyStreak(metrics);
  const queryClient = useQueryClient();"""

new_streak_vars = """  const currentStreak = calculateCurrentDailyStreak(metrics);
  const todayMetric = metrics.find(m => toUtcDay(m.date) === toUtcDay(new Date()));
  const todayMet = todayMetric ? isDailyGoalMet(todayMetric) : false;
  const queryClient = useQueryClient();"""

content = content.replace(old_streak_vars, new_streak_vars)

old_streak_html = """          <div className="flex items-center gap-[6px]">
            <span className="text-[18px]">🔥</span>
            <span className="text-[17px] text-white font-bold tracking-[-0.2px]">{currentStreak}</span>
          </div>"""

new_streak_html = """          <div className="flex items-center gap-[6px]">
            <span className="text-[18px]">🔥</span>
            <span className="text-[17px] text-white font-bold tracking-[-0.2px]">{currentStreak}</span>
            {todayMet && (
               <span style={{ fontSize: '12px', background: 'rgba(212,255,0,0.1)', color: '#D4FF00', padding: '2px 8px', borderRadius: '100px', fontWeight: 600, marginLeft: '4px' }}>
                 ⏳ In Progress
               </span>
            )}
          </div>"""

content = content.replace(old_streak_html, new_streak_html)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
