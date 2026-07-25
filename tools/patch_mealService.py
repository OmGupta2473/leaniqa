import re

with open('src/features/nutrition/services/mealService.ts', 'r') as f:
    content = f.read()

content = re.sub(r"logError\(new Error\('Error fetching meals'\), \{ error, userId, options \}\);\s*return \[\];", "logError(new Error('Error fetching meals'), { error, userId, options });\n      throw error;", content)
content = re.sub(r"logError\(new Error\('Error fetching todays meals'\), \{ error, userId \}\);\s*return \[\];", "logError(new Error('Error fetching todays meals'), { error, userId });\n      throw error;", content)
content = re.sub(r"logError\(new Error\('Error fetching meals for date'\), \{ error, userId, date: date\.toISOString\(\) \}\);\s*return \[\];", "logError(new Error('Error fetching meals for date'), { error, userId, date: date.toISOString() });\n      throw error;", content)
content = re.sub(r"logError\(new Error\('Error fetching meals by date'\), \{ error, userId, dateStr \}\);\s*return \[\];", "logError(new Error('Error fetching meals by date'), { error, userId, dateStr });\n      throw error;", content)

with open('src/features/nutrition/services/mealService.ts', 'w') as f:
    f.write(content)

