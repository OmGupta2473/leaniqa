import re

with open("src/features/progress/services/weightService.ts", "r") as f:
    content = f.read()

# Replace everything from `const payload = {` to `if (error && error.code !== 'PGRST116') {`
pattern = re.compile(r"const payload = \{.*?(?=if \(error && error\.code !== 'PGRST116'\) \{)", re.DOTALL)

new_add = """const payload = {
      ...logData,
      body_fat: bodyFatEstimate,
      user_id: userId,
    };

    // Check if an entry for this local date already exists
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
    }

    """

content = pattern.sub(new_add, content)

with open("src/features/progress/services/weightService.ts", "w") as f:
    f.write(content)
