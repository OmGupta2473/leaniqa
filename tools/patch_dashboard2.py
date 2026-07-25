import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    """  const getRemainingText = (eaten: number, target: number, unit: string = '') => {
    if (!target) return 'No target set';
    const diff = target - eaten;
    if (diff > 0) return `${Math.round(diff)}${unit} left`;
    if (diff < 0) return `${Math.round(Math.abs(diff))}${unit} over`;
    return 'Goal met';
  };""",
    """  const getRemainingText = (eaten: number, target: number, unit: string = '') => {
    if (!target) return 'No target set';
    const diff = target - eaten;
    if (diff > 0) return `${Math.round(diff)}${unit} remaining`;
    if (diff < 0) return `${Math.round(Math.abs(diff))}${unit} over`;
    return 'Goal met';
  };"""
)

# For calories, update to show "kcal remaining"
c = c.replace(
    "{getRemainingText(eatenKcal, dailyTargetKcal, '')}",
    "{getRemainingText(eatenKcal, dailyTargetKcal, ' kcal')}"
)

# Replace the text under protein, fat, carbs with remaining amounts? The user said "Also calculate and display the remaining amount (e.g., 44g remaining)" 
# We can put this in the macro cards or just under the numbers.
# Let's put it as a small text under the progress bar or replacing the label.

c = c.replace(
    """              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Protein
              </div>""",
    """              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Protein
              </div>"""
)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)
