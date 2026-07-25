import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

old_add_meal = """  async addMeal(mealData: Omit<DbMealLog, 'id' | 'user_id'>): Promise<DbMealLog | null> {
    const userId = await authService.getUserId();
    const payload = {
      ...mealData,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('meal_logs')
      .insert(payload)
      .select()
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('--- SUPABASE INSERT ERROR ---');
      console.error('Payload:', payload);
      console.error('Error Details:', JSON.stringify(error, null, 2));
      console.error('Raw Error:', error);
      throw error;
    }
    console.log('--- SUPABASE INSERT SUCCESS ---', data);
    return data || payload;
  },"""

new_add_meal = """  async addMeal(mealData: Omit<DbMealLog, 'id' | 'user_id'>): Promise<DbMealLog | null> {
    const userId = await authService.getUserId();
    const payload = {
      ...mealData,
      user_id: userId,
    };
    
    // Ensure all numeric fields are integers (Supabase expects integers based on schema)
    payload.calories = Math.round(payload.calories || 0);
    payload.protein = Math.round(payload.protein || 0);
    payload.fat = Math.round(payload.fat || 0);
    payload.carbs = Math.round(payload.carbs || 0);
    
    console.log('--- SUPABASE INSERT PAYLOAD ---', payload);
    
    let res = await supabase
      .from('meal_logs')
      .insert(payload)
      .select()
      .maybeSingle();
      
    // If the error is PGRST204 (column not found), try without meal_slot in case the migration hasn't run
    if (res.error && res.error.code === 'PGRST204') {
      console.warn('meal_slot column might be missing. Retrying without meal_slot.');
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).meal_slot;
      res = await supabase
        .from('meal_logs')
        .insert(fallbackPayload)
        .select()
        .maybeSingle();
    }
      
    if (res.error && res.error.code !== 'PGRST116') {
      console.error('--- SUPABASE INSERT ERROR ---');
      console.error('Payload:', payload);
      console.error('Error Details:', JSON.stringify(res.error, null, 2));
      console.error('Raw Error:', res.error);
      throw res.error;
    }
    console.log('--- SUPABASE INSERT SUCCESS ---', res.data);
    return res.data || payload;
  },"""

content = content.replace(old_add_meal, new_add_meal)

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
