import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

content = content.replace(
"""    if (res.error && res.error.code === 'PGRST204') {""",
"""    // If the error indicates a missing column (PGRST204 or PGRST205 or message includes column), try without meal_slot
    if (res.error && (res.error.code?.startsWith('PGRST20') || res.error.message?.toLowerCase().includes('column'))) {""")

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
