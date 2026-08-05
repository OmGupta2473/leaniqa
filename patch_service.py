import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

old_code = """    const { meal_source, ...restMealData } = mealData as any;
    const payload = {
      ...restMealData,
      user_id: userId,
    };"""

new_code = """    const { meal_source, fiber, ...restMealData } = mealData as any;
    if (restMealData.meal_slot === 'snack') {
      delete restMealData.meal_slot; // snack is not in DB ENUM yet
    }
    const payload = {
      ...restMealData,
      user_id: userId,
    };"""

content = content.replace(old_code, new_code)

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
