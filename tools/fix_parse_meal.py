import re

with open("supabase/functions/parse-meal/index.ts", "r") as f:
    content = f.read()

# Fix the prompt to enforce proper scaling
old_prompt = r'1\. Identify each food item and its quantity from the text.*?2\. Calculate accurate macros based on standard serving sizes and quantities mentioned.*?3\. For Indian foods, use standard homemade portions \(roti = 40g, rice plate = 300g cooked, dal bowl = 200g, sabzi = 150g\)'
new_prompt = r'1. Identify each food item and its exact quantity from the text. Never default to 100g unless explicitly specified in grams.\n2. Apply quantity scaling strictly. Final nutrition MUST be: Serving Nutrition * Quantity.\n3. Standard conversions: 1 egg = 50g, 1 almond = 1.2g, 1 medium banana, 1 bowl sprouts, 1 cup rice, 1 roti = 40g, dal bowl = 200g, sabzi = 150g.'

content = re.sub(old_prompt, new_prompt, content, flags=re.DOTALL)

with open("supabase/functions/parse-meal/index.ts", "w") as f:
    f.write(content)

