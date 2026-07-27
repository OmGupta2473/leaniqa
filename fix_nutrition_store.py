import re

with open('src/features/nutrition/store/nutritionStore.ts', 'r') as f:
    content = f.read()

old_clear = """      clearNutritionStore: () => set({
        selectedMealSlot: null,
        searchText: '',
        aiParsingLoading: false,
        aiStatus: 'unknown',
      })"""

new_clear = """      clearNutritionStore: () => set({
        mealDrafts: {},
        selectedMealSlot: null,
        searchText: '',
        mealFilters: {},
        aiParsingLoading: false,
        aiStatus: 'unknown',
      })"""

content = content.replace(old_clear, new_clear)

with open('src/features/nutrition/store/nutritionStore.ts', 'w') as f:
    f.write(content)
