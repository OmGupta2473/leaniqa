import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

# Check if today is met
# We need to compute it
old_streaks_bar = """      {/* Streaks Summary */}
      <div className="streaks-bar glass-card">
        <div className="text-center py-[14px]">
          <div"""

new_streaks_bar = """      {/* Streaks Summary */}
      <div className="streaks-bar glass-card">
        <div className="text-center py-[14px]">
          <div"""

content = content.replace(old_streaks_bar, new_streaks_bar)

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
