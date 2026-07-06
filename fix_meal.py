import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("const MealSlotRow = memo(function MealSlotRow", "function MealSlotRow")
content = content.replace("const breakfastMeals = useMemo(() => meals.filter(m => m.meal_slot === \"breakfast\"), [meals]);", "const breakfastMeals = meals.filter(m => m.meal_slot === \"breakfast\");")
content = content.replace("const lunchMeals = useMemo(() => meals.filter(m => m.meal_slot === \"lunch\"), [meals]);", "const lunchMeals = meals.filter(m => m.meal_slot === \"lunch\");")
content = content.replace("const dinnerMeals = useMemo(() => meals.filter(m => m.meal_slot === \"dinner\"), [meals]);", "const dinnerMeals = meals.filter(m => m.meal_slot === \"dinner\");")

# we need to find the specific closing brace for MealSlotRow, which was changed to `});` earlier.
# MealSlotRow is defined around line 47 and ends right before `export function MealLoggerPage`
old_comp_end = """      {meals.length === 0 && (
        <div className="text-[11px] text-[rgba(235,235,245,0.3)] italic pt-[4px]">Nothing logged yet</div>
      )}
    </div>
  );
});"""

new_comp_end = """      {meals.length === 0 && (
        <div className="text-[11px] text-[rgba(235,235,245,0.3)] italic pt-[4px]">Nothing logged yet</div>
      )}
    </div>
  );
}"""

content = content.replace(old_comp_end, new_comp_end)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
