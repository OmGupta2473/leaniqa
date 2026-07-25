import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    "const fatTarget = onboardingData?.fatMid || 0;",
    "const fatTarget = Math.round((profile?.fat_target ?? onboardingData?.fatMid) || 0);"
)

c = c.replace(
    "const carbsTarget = onboardingData?.carbMid || 0;",
    "const carbsTarget = Math.round((profile?.carbs_target ?? onboardingData?.carbMid) || 0);"
)

c = c.replace(
    "const proteinTarget = (profile?.protein_target ?? onboardingData?.proteinMid) || 0;",
    "const proteinTarget = Math.round((profile?.protein_target ?? onboardingData?.proteinMid) || 0);"
)

c = c.replace(
    "const dailyTargetKcal = (profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : onboardingData?.dailyCalorieGoal) || 0;",
    "const dailyTargetKcal = Math.round((profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : onboardingData?.dailyCalorieGoal) || 0);"
)

c = c.replace(
    "const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);",
    "const eatenKcal = Math.round(todaysMeals.reduce((acc, m) => acc + m.calories, 0));"
)
c = c.replace(
    "const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);",
    "const eatenProtein = Math.round(todaysMeals.reduce((acc, m) => acc + m.protein, 0));"
)
c = c.replace(
    "const eatenFat = todaysMeals.reduce((acc, m) => acc + m.fat, 0);",
    "const eatenFat = Math.round(todaysMeals.reduce((acc, m) => acc + m.fat, 0));"
)
c = c.replace(
    "const eatenCarbs = todaysMeals.reduce((acc, m) => acc + m.carbs, 0);",
    "const eatenCarbs = Math.round(todaysMeals.reduce((acc, m) => acc + m.carbs, 0));"
)

# Replace the AnimatedNumber wrappers
c = c.replace(
    """              <div className="text-[18px] font-semibold text-[#378ADD] leading-none mb-1">
                <AnimatedNumber value={eatenProtein} duration={800} />g
              </div>""",
    """              <div className="text-[16px] font-semibold text-[#378ADD] leading-none mb-1 flex items-baseline gap-0.5">
                <AnimatedNumber value={eatenProtein} duration={800} />
                <span className="text-[11px] text-[rgba(255,255,255,0.4)] font-medium">/ {proteinTarget}g</span>
              </div>"""
)

c = c.replace(
    """              <div className="text-[18px] font-semibold text-[#FF4D1C] leading-none mb-1">
                <AnimatedNumber value={eatenFat} duration={800} />g
              </div>""",
    """              <div className="text-[16px] font-semibold text-[#FF4D1C] leading-none mb-1 flex items-baseline gap-0.5">
                <AnimatedNumber value={eatenFat} duration={800} />
                <span className="text-[11px] text-[rgba(255,255,255,0.4)] font-medium">/ {fatTarget}g</span>
              </div>"""
)

c = c.replace(
    """              <div className="text-[18px] font-semibold text-[#D4FF00] leading-none mb-1">
                <AnimatedNumber value={eatenCarbs} duration={800} />g
              </div>""",
    """              <div className="text-[16px] font-semibold text-[#D4FF00] leading-none mb-1 flex items-baseline gap-0.5">
                <AnimatedNumber value={eatenCarbs} duration={800} />
                <span className="text-[11px] text-[rgba(255,255,255,0.4)] font-medium">/ {carbsTarget}g</span>
              </div>"""
)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

