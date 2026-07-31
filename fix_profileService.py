import re

with open('src/features/profile/services/profileService.ts', 'r') as f:
    content = f.read()

old_fallback = """        try {
          const { useUserStore } = await import('@/features/profile/store/userStore');
          useUserStore.getState().setMacroOverrides({
            carbs_target: payload.carbs_target,
            fat_target: payload.fat_target,
            water_target: payload.water_target
          });
        } catch (e) {"""

new_fallback = """        try {
          const { useUserStore } = await import('@/features/profile/store/userStore');
          const overridesToUpdate: any = {};
          if ('carbs_target' in payload) overridesToUpdate.carbs_target = payload.carbs_target;
          if ('fat_target' in payload) overridesToUpdate.fat_target = payload.fat_target;
          if ('water_target' in payload) overridesToUpdate.water_target = payload.water_target;
          
          if (Object.keys(overridesToUpdate).length > 0) {
            useUserStore.getState().setMacroOverrides(overridesToUpdate);
          }
        } catch (e) {"""

content = content.replace(old_fallback, new_fallback)

with open('src/features/profile/services/profileService.ts', 'w') as f:
    f.write(content)

