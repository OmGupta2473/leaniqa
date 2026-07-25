import re

with open('src/shared/services/offlineSyncService.ts', 'r') as f:
    content = f.read()

# Add static imports
imports = """import { mealService } from '@/features/nutrition/services/mealService';
import { profileService } from '@/features/profile/services/profileService';
import { weightService } from '@/features/progress/services/weightService';
import { queryClient } from '@/app/query/queryClient';
"""
content = re.sub(r"import \{ mealService \}.*?\n", imports, content)

# Remove dynamic imports
content = content.replace("const { profileService } = await import('@/features/profile/services/profileService');\n          ", "")
content = content.replace("const { weightService } = await import('@/features/progress/services/weightService');\n          ", "")
content = content.replace("""import('@/app/query/queryClient').then(m => {
        m.queryClient.invalidateQueries({ queryKey: ['meals'] });
        m.queryClient.invalidateQueries({ queryKey: ['goal'] });
      });""", """queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });""")

with open('src/shared/services/offlineSyncService.ts', 'w') as f:
    f.write(content)
