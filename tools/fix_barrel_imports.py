import os
import re

def fix_imports_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacing single quotes
    content = content.replace("import { authService } from '@/features/auth';", "import { authService } from '@/features/auth/services/authService';")
    content = content.replace("import { mealService } from '@/features/nutrition';", "import { mealService } from '@/features/nutrition/services/mealService';")
    content = content.replace("import { weightService } from '@/features/progress';", "import { weightService } from '@/features/progress/services/weightService';")
    content = content.replace("import { profileService } from '@/features/profile';", "import { profileService } from '@/features/profile/services/profileService';")
    content = content.replace("import { useUserStore } from '@/features/profile';", "import { useUserStore } from '@/features/profile/store/userStore';")
    content = content.replace("import { useDashboardStore } from '@/features/dashboard';", "import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';")
    content = content.replace("import { reportService } from '@/features/reports';", "import { reportService } from '@/features/reports/services/reportService';")
    content = content.replace("import { complianceService } from '@/features/reports';", "import { complianceService } from '@/features/reports/services/complianceService';")
    
    # Replacing double quotes
    content = content.replace('import { authService } from "@/features/auth";', 'import { authService } from "@/features/auth/services/authService";')
    content = content.replace('import { mealService } from "@/features/nutrition";', 'import { mealService } from "@/features/nutrition/services/mealService";')
    content = content.replace('import { weightService } from "@/features/progress";', 'import { weightService } from "@/features/progress/services/weightService";')
    content = content.replace('import { profileService } from "@/features/profile";', 'import { profileService } from "@/features/profile/services/profileService";')
    content = content.replace('import { useUserStore } from "@/features/profile";', 'import { useUserStore } from "@/features/profile/store/userStore";')
    content = content.replace('import { useDashboardStore } from "@/features/dashboard";', 'import { useDashboardStore } from "@/features/dashboard/store/dashboardStore";')
    content = content.replace('import { reportService } from "@/features/reports";', 'import { reportService } from "@/features/reports/services/reportService";')
    content = content.replace('import { complianceService } from "@/features/reports";', 'import { complianceService } from "@/features/reports/services/complianceService";')

    # General replacements (just in case)
    content = re.sub(r'from [\'"]@/features/auth[\'"]', "from '@/features/auth/services/authService'", content)
    content = re.sub(r'from [\'"]@/features/nutrition[\'"]', "from '@/features/nutrition/services/mealService'", content)
    content = re.sub(r'from [\'"]@/features/progress[\'"]', "from '@/features/progress/services/weightService'", content)
    
    # Wait, the general replacement could be wrong if importing something other than the service
    # So we'll rely on the specific `import { ... }` replacements first

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_imports_in_file(os.path.join(root, file))
