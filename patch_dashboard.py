import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

# Replace useQuery for meals
old_query = """  const {
    data: meals,
    isError: isMealsError,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: () => mealService.getTodaysMeals(),
  });"""

new_query = """  const {
    data: allMeals,
    isError: isMealsError,
    isLoading: isMealsLoading,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ["meals"],
    queryFn: () => mealService.getMeals({ days: 30 }),
  });"""

content = content.replace(old_query, new_query)

# Replace isLoading check
old_loading = """  if (isLoading) {"""
new_loading = """  if (isLoading || isMealsLoading) {"""
content = content.replace(old_loading, new_loading)

# Replace todaysMeals calculation
old_todays = """  const todaysMeals = meals || [];"""
new_todays = """  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todaysMeals = (allMeals || []).filter(m => m.meal_time >= startOfToday);
  const isFirstTimeUser = (allMeals || []).length === 0 && metrics.length === 0;"""
content = content.replace(old_todays, new_todays)

# Replace EmptyState logic
old_empty = """        ) : todaysMeals.length === 0 ? ("""
new_empty = """        ) : isFirstTimeUser ? ("""
content = content.replace(old_empty, new_empty)

old_error_text = """<div className="text-red-400 font-medium mb-3">Unable to sync today's data</div>"""
new_error_text = """<div className="text-red-400 font-medium mb-3">Unable to sync data</div>"""
content = content.replace(old_error_text, new_error_text)


with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
