with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    c = f.read()

c = c.replace("import { CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react';", "import { CheckCircle2, ArrowRight, ChevronLeft, LogOut } from 'lucide-react';\nimport { authService } from '@/features/auth/services/authService';")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(c)
