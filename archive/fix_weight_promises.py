import re

with open('src/features/progress/services/weightService.ts', 'r') as f:
    weight_content = f.read()

old_weight_2 = """    // Update profile weight and goal body fat if calculated
    if (profile) {
      await profileService.upsertProfile({ weight: logData.weight });
      if (bodyFatEstimate) {
        await supabase.from('goals').update({ current_bf: bodyFatEstimate }).eq('user_id', userId);
      }
    }"""

new_weight_2 = """    // Update profile weight and goal body fat if calculated
    if (profile) {
      const promises: Promise<any>[] = [
        profileService.upsertProfile({ weight: logData.weight })
      ];
      if (bodyFatEstimate) {
        promises.push(supabase.from('goals').update({ current_bf: bodyFatEstimate }).eq('user_id', userId));
      }
      await Promise.all(promises);
    }"""

weight_content = weight_content.replace(old_weight_2, new_weight_2)

with open('src/features/progress/services/weightService.ts', 'w') as f:
    f.write(weight_content)
