import re

with open('src/router/layouts/AppLayout.tsx', 'r') as f:
    c = f.read()

# Conditionally render Header in AppLayout
c = c.replace('<Header />\n        {children || (', '{location.pathname !== \'/onboarding\' && <Header />}\n        {children || (')

with open('src/router/layouts/AppLayout.tsx', 'w') as f:
    f.write(c)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    c = f.read()

# Add logout button to OnboardingPage
c = c.replace("import { ChevronLeft, Scale, Ruler, Utensils, RefreshCcw } from 'lucide-react';", "import { ChevronLeft, Scale, Ruler, Utensils, RefreshCcw, LogOut } from 'lucide-react';\nimport { authService } from '@/features/auth/services/authService';")
c = c.replace('import { ChevronLeft, Scale, Ruler, Utensils, RefreshCcw, LogOut } from \'lucide-react\';\nimport { authService } from \'@/features/auth/services/authService\';\nimport { authService } from \'@/features/auth/services/authService\';', 'import { ChevronLeft, Scale, Ruler, Utensils, RefreshCcw, LogOut } from \'lucide-react\';\nimport { authService } from \'@/features/auth/services/authService\';')


logout_btn = """           <div className="w-[48px] shrink-0 flex justify-end">
             <button 
               onClick={() => authService.logout()}
               className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors p-2 flex items-center justify-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full hover:bg-[rgba(255,255,255,0.05)]"
               aria-label="Logout"
             >
               <LogOut size={18} />
             </button>
           </div>"""

c = re.sub(r'(<div className="flex gap-2 flex-1 justify-center">.*?</div>)', r'\1\n' + logout_btn, c, flags=re.DOTALL | re.MULTILINE)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(c)
