import re

with open("server.ts", "r") as f:
    content = f.read()

old_kb_start = "const KnowledgeBase: Record<string, { calories: number, protein: number, fat: number, carbs: number, fiber: number, serving: string, perUnit?: boolean, unitWeight?: number }> = {"
old_kb_end = "};"

new_kb = """const KnowledgeBase: Record<string, { calories: number, protein: number, fat: number, carbs: number, fiber: number, serving: string, perUnit?: boolean, unitWeight?: number }> = {
  "roti": { calories: 120, protein: 4, fat: 3, carbs: 20, fiber: 3, serving: "1 piece (40g)", perUnit: true, unitWeight: 40 },
  "rice": { calories: 130, protein: 3, fat: 0.5, carbs: 28, fiber: 0.4, serving: "100g (cooked)", perUnit: false },
  "dal": { calories: 150, protein: 8, fat: 4, carbs: 20, fiber: 8, serving: "1 bowl (200g)", perUnit: false },
  "paneer": { calories: 265, protein: 18, fat: 20, carbs: 3, fiber: 0, serving: "100g", perUnit: false },
  "milk": { calories: 60, protein: 3.2, fat: 3, carbs: 5, fiber: 0, serving: "100ml", perUnit: false },
  "egg": { calories: 70, protein: 6, fat: 5, carbs: 0.5, fiber: 0, serving: "1 large (50g)", perUnit: true, unitWeight: 50 },
  "chicken breast": { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "chicken": { calories: 239, protein: 27, fat: 14, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "apple": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, serving: "100g", perUnit: false },
  "banana": { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6, serving: "100g", perUnit: false },
  "poha": { calories: 180, protein: 4, fat: 5, carbs: 30, fiber: 2, serving: "1 bowl (150g)", perUnit: false },
  "idli": { calories: 40, protein: 1.5, fat: 0.2, carbs: 8, fiber: 1, serving: "1 piece (40g)", perUnit: true, unitWeight: 40 },
  "dosa": { calories: 130, protein: 3, fat: 4, carbs: 20, fiber: 2, serving: "1 plain (100g)", perUnit: true, unitWeight: 100 },
  "sambar": { calories: 150, protein: 6, fat: 5, carbs: 20, fiber: 3, serving: "1 bowl", perUnit: false },
  "upma": { calories: 200, protein: 5, fat: 7, carbs: 28, fiber: 2, serving: "1 bowl", perUnit: false },
  "oats": { calories: 389, protein: 16.9, fat: 6.9, carbs: 66, fiber: 10.6, serving: "100g", perUnit: false },
  "rajma": { calories: 140, protein: 8.7, fat: 0.5, carbs: 22.8, fiber: 6.4, serving: "100g", perUnit: false },
  "chole": { calories: 164, protein: 8.9, fat: 2.6, carbs: 27.4, fiber: 7.6, serving: "100g", perUnit: false },
  "soya": { calories: 345, protein: 52, fat: 0.5, carbs: 33, fiber: 13, serving: "100g", perUnit: false },
  "curd": { calories: 98, protein: 11, fat: 4.3, carbs: 3.4, fiber: 0, serving: "100g", perUnit: false },
  "bread": { calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7, serving: "100g", perUnit: false },
  "chana": { calories: 364, protein: 19, fat: 6, carbs: 61, fiber: 17, serving: "100g", perUnit: false },
  "sprouts": { calories: 30, protein: 3.8, fat: 0.2, carbs: 6, fiber: 1.8, serving: "100g", perUnit: false },
  "almonds": { calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12.5, serving: "100g", perUnit: false },
  "peanut butter": { calories: 588, protein: 25, fat: 50, carbs: 20, fiber: 6, serving: "100g", perUnit: false },
  "whey protein": { calories: 379, protein: 78, fat: 2, carbs: 7, fiber: 0, serving: "100g", perUnit: false },
  "sweet potato": { calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3, serving: "100g", perUnit: false },
  "potato": { calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.2, serving: "100g", perUnit: false },
  "carrot": { calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8, serving: "100g", perUnit: false },
  "cucumber": { calories: 15, protein: 0.65, fat: 0.1, carbs: 3.6, fiber: 0.5, serving: "100g", perUnit: false },
  "tomato": { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, serving: "100g", perUnit: false },
  "onion": { calories: 40, protein: 1.1, fat: 0.1, carbs: 9, fiber: 1.7, serving: "100g", perUnit: false },
  "spinach": { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2, serving: "100g", perUnit: false },
  "broccoli": { calories: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6, serving: "100g", perUnit: false },
  "fish": { calories: 206, protein: 22, fat: 12, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "mutton": { calories: 294, protein: 25, fat: 21, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "ghee": { calories: 900, protein: 0, fat: 100, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "butter": { calories: 717, protein: 0.8, fat: 81, carbs: 0.1, fiber: 0, serving: "100g", perUnit: false },
  "oil": { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "sugar": { calories: 387, protein: 0, fat: 0, carbs: 100, fiber: 0, serving: "100g", perUnit: false },
  "jaggery": { calories: 383, protein: 0.4, fat: 0.1, carbs: 98, fiber: 0, serving: "100g", perUnit: false },
  "honey": { calories: 304, protein: 0.3, fat: 0, carbs: 82, fiber: 0.2, serving: "100g", perUnit: false }
};"""

pattern = re.compile(re.escape(old_kb_start) + r'.*?' + re.escape(old_kb_end), re.DOTALL)
content = pattern.sub(lambda m: new_kb, content)

with open("server.ts", "w") as f:
    f.write(content)
