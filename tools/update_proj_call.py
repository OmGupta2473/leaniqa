import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

old_call = """  const projections = calculateProjections({
    currentWeight,
    currentBf: goal?.current_bf || 25,
    targetBf: goal?.target_bf || 12,
    weeklyDeficitKcal: goal?.deficit_kcal ? goal.deficit_kcal * 7 : 3500,
    complianceScore: complianceScore || 80
  });"""

new_call = """  const projections = calculateProjections({
    currentWeight,
    currentBf: goal?.current_bf || 25,
    targetBf: goal?.target_bf || 12,
    weeklyDeficitKcal: goal?.deficit_kcal ? goal.deficit_kcal * 7 : 3500,
    complianceScore: complianceScore || 80,
    actualPaceKgPerWeek: actualPace > 0 ? actualPace : undefined
  });"""

content = content.replace(old_call, new_call)

# Also update the UI to mention if it's based on actual pace
old_footer = """          <div className="mt-4 text-[10px] text-text-secondary text-center">
            Based on current {complianceScore.toFixed(0)}% compliance and {(goal?.deficit_kcal || 500) * 7} kcal weekly deficit.
          </div>"""

new_footer = """          <div className="mt-4 text-[10px] text-text-secondary text-center">
            {actualPace > 0 
              ? `Projections based on your actual pace of ${actualPace.toFixed(2)} kg/wk lost.`
              : `Based on current ${complianceScore.toFixed(0)}% compliance and ${(goal?.deficit_kcal || 500) * 7} kcal weekly deficit.`
            }
          </div>"""

content = content.replace(old_footer, new_footer)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
