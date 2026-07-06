import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

if "import { useMemo" not in content:
    content = content.replace('import { useState, useRef, useEffect, useCallback } from "react";', 'import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";')

old_meals = """  const breakfastMeals = meals.filter(m => m.meal_slot === "breakfast");
  const lunchMeals = meals.filter(m => m.meal_slot === "lunch");
  const dinnerMeals = meals.filter(m => m.meal_slot === "dinner");"""

new_meals = """  const breakfastMeals = useMemo(() => meals.filter(m => m.meal_slot === "breakfast"), [meals]);
  const lunchMeals = useMemo(() => meals.filter(m => m.meal_slot === "lunch"), [meals]);
  const dinnerMeals = useMemo(() => meals.filter(m => m.meal_slot === "dinner"), [meals]);"""

content = content.replace(old_meals, new_meals)

old_comp = "function MealSlotRow"
new_comp = "const MealSlotRow = memo(function MealSlotRow"

content = content.replace(old_comp, new_comp)

old_comp_end = """      {meals.length === 0 && (
        <div className="text-[11px] text-[rgba(235,235,245,0.3)] italic pt-[4px]">Nothing logged yet</div>
      )}
    </div>
  );
}"""

new_comp_end = """      {meals.length === 0 && (
        <div className="text-[11px] text-[rgba(235,235,245,0.3)] italic pt-[4px]">Nothing logged yet</div>
      )}
    </div>
  );
});"""

content = content.replace(old_comp_end, new_comp_end)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
