with open("src/shared/types/supabase.ts", "r") as f:
    content = f.read()

content = content.replace(
    "meal_slot?: 'breakfast' | 'lunch' | 'dinner';",
    "meal_slot?: 'breakfast' | 'lunch' | 'dinner';\n  meal_source?: 'ai' | 'manual';"
)

with open("src/shared/types/supabase.ts", "w") as f:
    f.write(content)
