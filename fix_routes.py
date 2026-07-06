import re

with open('src/router/routes.tsx', 'r') as f:
    content = f.read()

content = content.replace("import('@/features/dashboard').then(module => ({ default: module.DashboardPage }))", "import('@/features/dashboard/pages/DashboardPage').then(module => ({ default: module.DashboardPage }))")
content = content.replace("import('@/features/nutrition').then(module => ({ default: module.MealLoggerPage }))", "import('@/features/nutrition/pages/MealLoggerPage').then(module => ({ default: module.MealLoggerPage }))")
content = content.replace("import('@/features/progress').then(module => ({ default: module.ProgressPage }))", "import('@/features/progress/pages/ProgressPage').then(module => ({ default: module.ProgressPage }))")
content = content.replace("import('@/features/reports').then(module => ({ default: module.WeeklyReportPage }))", "import('@/features/reports/pages/WeeklyReportPage').then(module => ({ default: module.WeeklyReportPage }))")
content = content.replace("import('@/features/pricing').then(module => ({ default: module.PricingPage }))", "import('@/features/pricing/pages/PricingPage').then(module => ({ default: module.PricingPage }))")
content = content.replace("import('@/features/profile').then(module => ({ default: module.ProfilePage }))", "import('@/features/profile/pages/ProfilePage').then(module => ({ default: module.ProfilePage }))")
content = content.replace("import('@/features/transformation').then(module => ({ default: module.TransformationPage }))", "import('@/features/transformation/pages/TransformationPage').then(module => ({ default: module.TransformationPage }))")
content = content.replace("import('@/features/nutrition').then(module => ({ default: module.CalorieDetailPage }))", "import('@/features/nutrition/pages/CalorieDetailPage').then(module => ({ default: module.CalorieDetailPage }))")
content = content.replace("import('@/features/nutrition').then(module => ({ default: module.ProteinDetailPage }))", "import('@/features/nutrition/pages/ProteinDetailPage').then(module => ({ default: module.ProteinDetailPage }))")
content = content.replace("import('@/features/awards').then(module => ({ default: module.AwardsPage }))", "import('@/features/awards/pages/AwardsPage').then(module => ({ default: module.AwardsPage }))")
content = content.replace("import('@/features/auth').then(module => ({ default: module.AuthPage }))", "import('@/features/auth/pages/AuthPage').then(module => ({ default: module.AuthPage }))")
content = content.replace("import('@/features/onboarding').then(module => ({ default: module.OnboardingPage }))", "import('@/features/onboarding/pages/OnboardingPage').then(module => ({ default: module.OnboardingPage }))")
content = content.replace("import('@/features/goal').then(module => ({ default: module.GoalSetterPage }))", "import('@/features/goal/pages/GoalSetterPage').then(module => ({ default: module.GoalSetterPage }))")

with open('src/router/routes.tsx', 'w') as f:
    f.write(content)
