import re

with open("src/features/progress/services/weightService.ts", "r") as f:
    content = f.read()

# Replace addWeightLog implementation to check for existing date
# We will do a query to find a log for the same user_id and same date prefix.
old_add = """    const payload = {
      ...logData,
      body_fat: bodyFatEstimate,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('weight_logs')
      .insert(payload)
      .select()
      .maybeSingle();"""

new_add = """    const payload = {
      ...logData,
      body_fat: bodyFatEstimate,
      user_id: userId,
    };

    // Check if an entry for this local date already exists
    // The date is typically 'YYYY-MM-DD' or ISO string. We match the first 10 chars.
    const datePrefix = logData.date.substring(0, 10);
    
    const { data: existing } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('user_id', userId)
      .like('date', `${datePrefix}%`)
      .maybeSingle();

    let data, error;
    if (existing && existing.id) {
      // Update existing
      const res = await supabase
        .from('weight_logs')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      data = res.data;
      error = res.error;
    } else {
      // Insert new
      const res = await supabase
        .from('weight_logs')
        .insert(payload)
        .select()
        .maybeSingle();
      data = res.data;
      error = res.error;
    }"""

content = content.replace(old_add, new_add)

with open("src/features/progress/services/weightService.ts", "w") as f:
    f.write(content)
