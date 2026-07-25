import re

with open('src/features/nutrition/pages/CalorieDetailPage.tsx', 'r') as f:
    content = f.read()
    
old_bar = """                            width: `${Math.min(100, (calorieStreak / award.streakRequired) * 100)}%`,
                            transition: "width 0.3s","""
new_bar = """                            width: "100%",
                            transformOrigin: "left",
                            willChange: "transform",
                            transform: `translateX(-${100 - Math.min(100, (calorieStreak / award.streakRequired) * 100)}%)`,
                            transition: "transform 0.3s","""
content = content.replace(old_bar, new_bar)

with open('src/features/nutrition/pages/CalorieDetailPage.tsx', 'w') as f:
    f.write(content)

with open('src/features/nutrition/pages/ProteinDetailPage.tsx', 'r') as f:
    content = f.read()

old_bar = """                            width: `${Math.min(100, (proteinStreak / award.streakRequired) * 100)}%`,
                            transition: "width 0.3s","""
new_bar = """                            width: "100%",
                            transformOrigin: "left",
                            willChange: "transform",
                            transform: `translateX(-${100 - Math.min(100, (proteinStreak / award.streakRequired) * 100)}%)`,
                            transition: "transform 0.3s","""
content = content.replace(old_bar, new_bar)

with open('src/features/nutrition/pages/ProteinDetailPage.tsx', 'w') as f:
    f.write(content)


with open('src/features/reports/components/HourlyBarChart.tsx', 'r') as f:
    content = f.read()

old_bar = """                height: `${Math.max(barHeightPct, val > 0 ? 4 : 0)}%`,
                background: isCurrentHour ? color : `${color}99`,
                borderRadius: '2px 2px 0 0',
                transition: 'height 0.4s ease',"""
new_bar = """                height: '100%',
                background: isCurrentHour ? color : `${color}99`,
                borderRadius: '2px 2px 0 0',
                transformOrigin: 'bottom',
                willChange: 'transform',
                transform: `scaleY(${Math.max(barHeightPct, val > 0 ? 4 : 0) / 100})`,
                transition: 'transform 0.4s ease',"""
content = content.replace(old_bar, new_bar)

with open('src/features/reports/components/HourlyBarChart.tsx', 'w') as f:
    f.write(content)

