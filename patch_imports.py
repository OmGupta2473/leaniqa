import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

lucide_imports_match = re.search(r'import \{([\s\S]*?)\} from "lucide-react";', content)
if lucide_imports_match:
    imports_str = lucide_imports_match.group(1)
    new_imports = ["ClipboardList", "BarChart2", "Dumbbell", "Activity", "Droplets", "Brain", "ShieldCheck", "Lock", "X", "Check", "CalendarHeart"]
    
    for imp in new_imports:
        if imp not in imports_str:
            imports_str += f", {imp}"
            
    new_lucide_imports = f'import {{{imports_str}}} from "lucide-react";'
    content = content.replace(lucide_imports_match.group(0), new_lucide_imports)
    
    with open('src/LandingPage.tsx', 'w') as f:
        f.write(content)
        print("Imports updated")
