import re

with open('src/features/transformation/components/TransformationSection.tsx', 'r') as f:
    content = f.read()

# Add estimatedCompletionDate to destructuring
content = content.replace(
    "const { gender = 'Male', currentBodyFatPct, targetBodyFatPct, estimatedWeeks, dailyCalorieGoal, proteinMin, proteinMax } = profileData;",
    "const { gender = 'Male', currentBodyFatPct, targetBodyFatPct, estimatedWeeks, estimatedCompletionDate, dailyCalorieGoal, proteinMin, proteinMax } = profileData;"
)

# Update the display HTML
old_html = """            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Estimated Time</span>
              <span className="text-[16px] font-bold text-white tracking-tight">{estimatedWeeks ? `${estimatedWeeks} weeks` : '—'}</span>
            </div>"""

new_html = """            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Estimated Time</span>
              <span className="text-[16px] font-bold text-white tracking-tight">{estimatedWeeks ? `${estimatedWeeks} weeks` : '—'}</span>
              {estimatedCompletionDate && (
                <span className="text-[11px] text-[rgba(235,235,245,0.4)] mt-0.5">{estimatedCompletionDate}</span>
              )}
            </div>"""

content = content.replace(old_html, new_html)

with open('src/features/transformation/components/TransformationSection.tsx', 'w') as f:
    f.write(content)
