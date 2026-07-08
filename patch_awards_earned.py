import re

with open("src/shared/utils/streaks.ts", "r") as f:
    content = f.read()

old_logic = """export function calculateEarnedAwards(metrics: DbDailyMetric[]): Award[] {
  if (!metrics || metrics.length === 0) {
    return AWARDS_CATALOG.map(award => ({ ...award, earned: false, earnedDate: null, currentStreak: 0 }));
  }
  
  const currentDailyStreak = calculateCurrentDailyStreak(metrics);
  return AWARDS_CATALOG.map(award => {
    return {
      ...award,
      earned: currentDailyStreak >= award.streakRequired,
      earnedDate: null,
      currentStreak: currentDailyStreak
    };
  });
}"""

new_logic = """export function calculateEarnedAwards(metrics: DbDailyMetric[]): Award[] {
  if (!metrics || metrics.length === 0) {
    return AWARDS_CATALOG.map(award => ({ ...award, earned: false, earnedDate: null, currentStreak: 0 }));
  }
  
  const currentDailyStreak = calculateCurrentDailyStreak(metrics);
  const bestDailyStreak = calculateBestDailyStreak(metrics);
  
  return AWARDS_CATALOG.map(award => {
    return {
      ...award,
      earned: bestDailyStreak >= award.streakRequired,
      earnedDate: null,
      currentStreak: currentDailyStreak
    };
  });
}"""

content = content.replace(old_logic, new_logic)

with open("src/shared/utils/streaks.ts", "w") as f:
    f.write(content)
