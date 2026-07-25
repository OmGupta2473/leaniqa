import re

with open("src/features/progress/services/weightService.ts", "r") as f:
    content = f.read()

old_code = """    // Check if an entry for this local date already exists
    const targetDate = new Date(logData.date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString();
    
    const { data: existing } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('date', startOfDay)
      .lt('date', endOfDay)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();"""

new_code = """    // Check if an entry for this local date already exists
    const datePrefix = logData.date.substring(0, 10);
    
    const { data: existing } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('date', datePrefix)
      .limit(1)
      .maybeSingle();"""

if old_code in content:
    content = content.replace(old_code, new_code)
else:
    print("WARNING: Could not find code to replace.")

with open("src/features/progress/services/weightService.ts", "w") as f:
    f.write(content)
