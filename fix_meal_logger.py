import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Fix calorie bar
content = content.replace(
    '<div className="h-full rounded-full transition-all duration-700" style={{ width: `${caloriePercent}%`, background: eatenKcal > dailyTargetKcal ? \'#FF4D1C\' : \'#D4FF00\' }}></div>',
    '<div className="h-full w-full rounded-full origin-left transition-transform duration-700 will-change-transform" style={{ transform: `translateX(-${100 - caloriePercent}%)`, background: eatenKcal > dailyTargetKcal ? \'#FF4D1C\' : \'#D4FF00\' }}></div>'
)

# Fix protein bar
content = content.replace(
    '<div className="h-full rounded-full bg-[#378ADD] transition-all duration-700" style={{ width: `${proteinPercent}%` }}></div>',
    '<div className="h-full w-full rounded-full bg-[#378ADD] origin-left transition-transform duration-700 will-change-transform" style={{ transform: `translateX(-${100 - proteinPercent}%)` }}></div>'
)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
