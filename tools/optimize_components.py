import re
import os

files_to_memoize = {
    'src/shared/components/Header.tsx': 'Header',
    'src/shared/components/BottomNav.tsx': 'BottomNav',
    'src/shared/components/Sidebar.tsx': 'Sidebar',
    'src/shared/components/ScreenSkeleton.tsx': 'ScreenSkeleton',
    'src/features/reports/components/ProgressRing.tsx': 'ProgressRing',
    'src/features/reports/components/MicroRing.tsx': 'MicroRing',
    'src/features/reports/components/HourlyBarChart.tsx': 'HourlyBarChart'
}

for filename, func_name in files_to_memoize.items():
    if not os.path.exists(filename):
        continue
    with open(filename, 'r') as f:
        content = f.read()
    
    if 'memo(' in content:
        continue
        
    if "import { memo }" not in content:
        content = "import { memo } from 'react';\n" + content
    
    # Replace "export function Foo(" with "export const Foo = memo(function Foo("
    content = content.replace(f"export function {func_name}(", f"export const {func_name} = memo(function {func_name}(")
    
    # We need to add `);` to the very last `}` of the file, assuming the component is the last thing.
    # Actually, a better way is to change the end of the file from `}` to `});`
    content = content.rstrip()
    if content.endswith('}'):
        content = content[:-1] + '});\n'
        
    with open(filename, 'w') as f:
        f.write(content)
