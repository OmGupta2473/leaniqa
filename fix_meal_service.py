import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

new_func = """  async getMealsForDate(date: Date): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching meals for date:', error);
      return [];
    }
    return data || [];
  },
"""

# add it before addMeal
content = content.replace("  async addMeal(", new_func + "\n  async addMeal(")

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
