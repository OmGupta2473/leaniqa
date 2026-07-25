import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

import_old = """import { calculateCurrentDailyStreak, calculateBestDailyStreak, calculateEarnedAwards } from '@/shared/utils/streaks';"""
import_new = """import { calculateCurrentDailyStreak, calculateBestDailyStreak, calculateEarnedAwards, isDailyGoalMet, toUtcDay } from '@/shared/utils/streaks';"""

content = content.replace(import_old, import_new)

old_streak_vars = """  const currentStreak = calculateCurrentDailyStreak(metrics);
  const bestStreak = calculateBestDailyStreak(metrics);
  const dailyAwards = calculateEarnedAwards(metrics);"""

new_streak_vars = """  const currentStreak = calculateCurrentDailyStreak(metrics);
  const bestStreak = calculateBestDailyStreak(metrics);
  const dailyAwards = calculateEarnedAwards(metrics);
  const todayMetric = metrics.find(m => toUtcDay(m.date) === toUtcDay(new Date()));
  const todayMet = todayMetric ? isDailyGoalMet(todayMetric) : false;"""

content = content.replace(old_streak_vars, new_streak_vars)

old_streaks_bar = """      {/* Streaks Summary */}
      <div className="streaks-bar glass-card">"""

new_streaks_bar = """      {/* Streaks Summary */}
      {todayMet && (
        <div style={{ padding: '0 20px', marginBottom: '16px', textAlign: 'center' }}>
           <div style={{ display: 'inline-block', background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.2)', padding: '6px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: '#D4FF00' }}>
             ⏳ Today's streak is in progress. It will be finalized at the end of the day.
           </div>
        </div>
      )}
      <div className="streaks-bar glass-card">"""

content = content.replace(old_streaks_bar, new_streaks_bar)

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
