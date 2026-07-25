import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

old_str = """        queryClient.invalidateQueries({ queryKey: ["meals", "date", dateKeyStr] }),"""
new_str = """        queryClient.invalidateQueries({ queryKey: ["meals", "date", dateKeyStr] }),
        ...(isToday(selectedDate) ? [queryClient.invalidateQueries({ queryKey: ["meals", "today"] })] : []),"""

content = content.replace(old_str, new_str)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
