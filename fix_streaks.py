import re

with open('src/shared/utils/streaks.ts', 'r') as f:
    content = f.read()

old_func = """export const isDailyGoalMet = (m: DbDailyMetric) => 
  m.actual_calories > 0 && 
  m.actual_calories <= m.target_calories && 
  m.actual_protein > 0 && 
  m.actual_protein >= m.target_protein;"""

new_func = """// Streak Tolerances
export const STREAK_TOLERANCE_CALORIES = 100;
export const STREAK_TOLERANCE_PROTEIN = 10;

export const isDailyGoalMet = (m: DbDailyMetric) => {
  if (m.actual_calories <= 0 || m.actual_protein <= 0) return false;
  
  // A streak should represent consistent effort, not mathematical perfection.
  // We allow a tolerance window to not punish users for being slightly above or below.
  const isCaloriesOk = 
    m.actual_calories >= (m.target_calories - STREAK_TOLERANCE_CALORIES) &&
    m.actual_calories <= (m.target_calories + STREAK_TOLERANCE_CALORIES);
    
  // For protein, slight under-eating is okay, and over-eating is also okay 
  // (we won't penalize going way over on protein as it's generally fine, but we'll accept slightly below).
  const isProteinOk = 
    m.actual_protein >= (m.target_protein - STREAK_TOLERANCE_PROTEIN);

  return isCaloriesOk && isProteinOk;
};"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('src/shared/utils/streaks.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find old_func")

