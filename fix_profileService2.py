import re

with open('src/features/profile/services/profileService.ts', 'r') as f:
    content = f.read()

old_func = """      const performUpsert = async (payloadToUse: any, updatePayloadToUse: any) => {
        if (existingProfile) {
          const updateRes = await supabase
            .from('profiles')
            .update(updatePayloadToUse)
            .eq('id', userId)
            .select()
            .maybeSingle();
          return { data: updateRes.data, error: updateRes.error };
        } else {"""

new_func = """      const performUpsert = async (payloadToUse: any, updatePayloadToUse: any) => {
        if (existingProfile) {
          if (Object.keys(updatePayloadToUse).length === 0) {
            return { data: existingProfile, error: null };
          }
          const updateRes = await supabase
            .from('profiles')
            .update(updatePayloadToUse)
            .eq('id', userId)
            .select()
            .maybeSingle();
          return { data: updateRes.data, error: updateRes.error };
        } else {"""

content = content.replace(old_func, new_func)

with open('src/features/profile/services/profileService.ts', 'w') as f:
    f.write(content)

