import re

files_to_fix = [
    'src/features/nutrition/pages/MealLoggerPage.tsx',
    'src/features/profile/pages/ProfilePage.tsx',
    'src/shared/components/BottomSheet.tsx',
    'src/features/dashboard/pages/DashboardPage.tsx'
]

for file in files_to_fix:
    with open(file, 'r') as f:
        content = f.read()

    # Optimize transition: all
    content = content.replace("transition: 'all 0.15s ease'", "transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'")
    content = content.replace("transition: 'all 0.2s ease'", "transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease'")
    
    # Optimize backdrop filter blurs
    content = content.replace("blur(40px)", "blur(12px)")
    content = content.replace("blur-[40px]", "blur-[20px]")

    # Check for overflow nested containers
    # DashboardPage
    content = content.replace("overflow-x-auto pb-4 snap-x hide-scrollbar", "overflow-x-auto pb-4 snap-x hide-scrollbar touch-pan-x")
    
    with open(file, 'w') as f:
        f.write(content)
