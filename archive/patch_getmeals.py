import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

old_get_meals = """  async getMealsByDate(dateStr: string): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .like('meal_time', `${dateStr}%`)
      .order('meal_time', { ascending: true });"""

new_get_meals = """  async getMealsByDate(dateStr: string): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    // dateStr is 'YYYY-MM-DD'
    const startOfDay = new Date(dateStr).toISOString();
    const endOfDay = new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true });"""

content = content.replace(old_get_meals, new_get_meals)

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
