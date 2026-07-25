import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

delete_meal_code = """
  async deleteMeal(id: string): Promise<boolean> {
    const userId = await authService.getUserId();
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
    return true;
  },
"""

content = content.replace("async getMealsByDate", delete_meal_code + "  async getMealsByDate")

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
