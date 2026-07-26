import re

with open('src/shared/hooks/useCalculatedProfile.ts', 'r') as f:
    content = f.read()

replacement = """        data.estimatedWeeks = calcG.estimatedWeeks;
        data.estimatedCompletionDate = goal.target_date 
          ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : calcG.targetDateStr;
        
        if (goal.macros) {
            data.targetMacros = goal.macros;
        }
"""

content = content.replace("""        data.estimatedWeeks = calcG.estimatedWeeks;
        data.estimatedCompletionDate = goal.target_date 
          ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : calcG.targetDateStr;""", replacement)

with open('src/shared/hooks/useCalculatedProfile.ts', 'w') as f:
    f.write(content)
