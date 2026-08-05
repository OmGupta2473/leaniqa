import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# Remove the frontend compound detection and cache lookup block
old_block_start = "// ── COMPOUND MEAL DETECTION ───────────────────────────────────────────────"
old_block_end = "devLog(\"Nutrition Source Used: AI / Function\");"

new_block = "devLog(\"=== MEAL LOGGING PIPELINE START ===\");\n      devLog(\"User Input:\", text);\n      devLog(\"Nutrition Source Used: AI / Function\");"

pattern = re.compile(r'// ── COMPOUND MEAL DETECTION ───────────────────────────────────────────────.*?devLog\("Nutrition Source Used: AI / Function"\);', re.DOTALL)
content = pattern.sub(new_block, content)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
