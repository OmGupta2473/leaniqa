import os
import re

files_to_process = [
    "src/features/nutrition/pages/MealLoggerPage.tsx",
    "src/features/nutrition/services/mealService.ts",
    "src/features/nutrition/constants/data.ts",
    "src/features/profile/services/profileService.ts",
    "src/features/pricing/services/subscriptionService.ts",
    "src/shared/utils/analytics.ts",
    "src/shared/utils/supabase.ts",
    "src/shared/services/offlineSyncService.ts",
    "src/main.tsx"
]

for filepath in files_to_process:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    needs_update = False
    if 'console.log(' in content:
        content = re.sub(r'\bconsole\.log\(', 'devLog(', content)
        needs_update = True
        
    if 'console.warn(' in content:
        content = re.sub(r'\bconsole\.warn\(', 'devWarn(', content)
        needs_update = True
        
    if needs_update:
        imports_needed = []
        if 'devLog(' in content and 'devLog' not in content[:content.find('devLog(')]: 
            # if we didn't have the import already
            # actually we can just check if import exists
            pass
            
        if 'devLog' not in content and 'devWarn' not in content:
            continue
            
        has_devlog = 'devLog(' in content
        has_devwarn = 'devWarn(' in content
        
        import_stmt = "import { "
        if has_devlog and has_devwarn:
            import_stmt += "devLog, devWarn"
        elif has_devlog:
            import_stmt += "devLog"
        elif has_devwarn:
            import_stmt += "devWarn"
        import_stmt += " } from '@/shared/utils/logger';\n"
        
        # Check if already imported
        if 'import { devLog' not in content and 'import { devWarn' not in content:
            # add import after the last import, or at the top
            lines = content.split('\n')
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            
            if last_import_idx != -1:
                lines.insert(last_import_idx + 1, import_stmt.strip())
            else:
                lines.insert(0, import_stmt.strip())
            
            content = '\n'.join(lines)
            
        with open(filepath, 'w') as f:
            f.write(content)

print("Replacement complete.")
