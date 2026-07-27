import re
import os

files = [
    "src/features/reports/pages/WeeklyReportPage.tsx",
    "src/features/nutrition/pages/MealLoggerPage.tsx",
    "src/features/dashboard/pages/DashboardPage.tsx",
    "src/features/goal/pages/GoalSetterPage.tsx",
    "src/shared/components/Sidebar.tsx",
    "src/shared/components/BottomNav.tsx",
    "src/shared/components/Header.tsx",
    "src/router/layouts/AppLayout.tsx"
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Replace 'Profiler' import from react with nothing if it's there
    content = re.sub(r'import\s+React(.*?),\s*\{\s*([^}]*?)\s*Profiler\s*([^}]*?)\s*\}\s*from\s+[\'"]react[\'"];?', lambda m: f"import React{m.group(1)}, {{ {m.group(2).strip()}{', ' if m.group(2).strip() and m.group(3).strip() else ''}{m.group(3).strip()} }} from 'react';" if m.group(2).strip() or m.group(3).strip() else f"import React{m.group(1)} from 'react';", content)
    content = re.sub(r'import\s+\{\s*([^}]*?)\s*Profiler\s*([^}]*?)\s*\}\s*from\s+[\'"]react[\'"];?', lambda m: f"import {{ {m.group(1).strip()}{', ' if m.group(1).strip() and m.group(2).strip() else ''}{m.group(2).strip()} }} from 'react';" if m.group(1).strip() or m.group(2).strip() else "", content)

    # Clean up empty destructured imports if we left them like import React, { } from 'react';
    content = re.sub(r'import\s+React(.*?),\s*\{\s*\}\s*from\s+[\'"]react[\'"];?', r"import React\1 from 'react';", content)

    # 2. Replace onRenderCallback, useRenderTracker with PerfProfiler from perfDebug
    content = re.sub(r'import\s+\{\s*([^}]*?)\s*onRenderCallback\s*([^}]*?)\s*\}\s*from\s+[\'"]@/shared/utils/perfDebug[\'"];?', lambda m: f"import {{ {m.group(1).strip()}{', ' if m.group(1).strip() and m.group(2).strip() else ''}{m.group(2).strip()} }} from '@/shared/utils/perfDebug';" if m.group(1).strip() or m.group(2).strip() else "", content)
    content = re.sub(r'import\s+\{\s*([^}]*?)\s*useRenderTracker\s*([^}]*?)\s*\}\s*from\s+[\'"]@/shared/utils/perfDebug[\'"];?', lambda m: f"import {{ {m.group(1).strip()}{', ' if m.group(1).strip() and m.group(2).strip() else ''}{m.group(2).strip()} }} from '@/shared/utils/perfDebug';" if m.group(1).strip() or m.group(2).strip() else "", content)

    # Ensure PerfProfiler is imported
    if "PerfProfiler" not in content and "perfDebug" in content:
        content = re.sub(r'import\s+\{([^}]*?)\}\s*from\s+[\'"]@/shared/utils/perfDebug[\'"];?', r"import {\1, PerfProfiler} from '@/shared/utils/perfDebug';", content)
    elif "PerfProfiler" not in content and "perfDebug" not in content:
        # Add import
        content = "import { PerfProfiler } from '@/shared/utils/perfDebug';\n" + content

    content = content.replace("{ ,", "{").replace(", }", "}").replace(", ,", ",")
    content = re.sub(r'import\s+\{\s*\}\s*from\s+[\'"]@/shared/utils/perfDebug[\'"];?\n?', '', content)
    
    # Also we might have messed up and need PerfProfiler import if we deleted the whole import
    if "PerfProfiler" not in content:
        content = "import { PerfProfiler } from '@/shared/utils/perfDebug';\n" + content

    # 3. Remove useRenderTracker calls
    content = re.sub(r'\s*useRenderTracker\([^\)]+\);?', '', content)

    # 4. Replace <Profiler id="..." onRender={onRenderCallback}> with <PerfProfiler id="...">
    content = re.sub(r'<Profiler\s+id=([\'"][^\'"]+[\'"])\s+onRender=\{onRenderCallback\}>', r'<PerfProfiler id=\1>', content)
    content = re.sub(r'</Profiler>', r'</PerfProfiler>', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

