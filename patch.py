import re

with open("src/features/nutrition/services/mealService.ts", "r") as f:
    content = f.read()

content = content.replace(
"""    if (error && error.code !== 'PGRST116') {
      console.error('Error adding meal:', error);
      throw error;
    }""",
"""    if (error && error.code !== 'PGRST116') {
      console.error('--- SUPABASE INSERT ERROR ---');
      console.error('Payload:', payload);
      console.error('Error Details:', JSON.stringify(error, null, 2));
      console.error('Raw Error:', error);
      throw error;
    }
    console.log('--- SUPABASE INSERT SUCCESS ---', data);""")

with open("src/features/nutrition/services/mealService.ts", "w") as f:
    f.write(content)
