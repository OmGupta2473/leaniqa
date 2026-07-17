import os
import re

HAPTICS_IMPORT = "import { haptics } from '@/shared/utils/haptics';\n"

def patch_file(filepath, replacements, add_import=True):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    if add_import and "from '@/shared/utils/haptics'" not in content:
        # insert after the last import
        import_end = content.rfind("import ")
        if import_end != -1:
            newline_after = content.find("\n", import_end)
            if newline_after != -1:
                content = content[:newline_after+1] + HAPTICS_IMPORT + content[newline_after+1:]
        else:
            content = HAPTICS_IMPORT + content

    for old, new in replacements:
        if callable(old):
            content = old(content)
        elif old in content:
            content = content.replace(old, new)
        else:
            print(f"Could not find exact text in {filepath}, using fallback regex if applicable.")
            
    with open(filepath, 'w') as f:
        f.write(content)

# 1. ProfilePage.tsx
def profile_patch(c):
    return re.sub(r'(toast\.success\([\'"].*?[\'"]\);)', r'haptics.success();\n      \1', c)

patch_file("src/features/profile/pages/ProfilePage.tsx", [(profile_patch, "")])

# 2. GoalSetterPage.tsx
patch_file("src/features/goal/pages/GoalSetterPage.tsx", [(profile_patch, "")])

# 3. OnboardingPage.tsx
def onboarding_patch(c):
    return re.sub(r'(await profileService\.saveGoal.*?;\n)', r'\1      haptics.success();\n', c)

patch_file("src/features/onboarding/pages/OnboardingPage.tsx", [(onboarding_patch, "")])

# 4. WeeklyReportPage.tsx
def weekly_patch(c):
    c = c.replace("setIsGenerating(true);", "haptics.tap();\n    setIsGenerating(true);")
    c = c.replace("setInsights(generateDynamicInsights());", "haptics.success();\n      setInsights(generateDynamicInsights());")
    return c

patch_file("src/features/reports/pages/WeeklyReportPage.tsx", [(weekly_patch, "")])

# 5. AuthPage.tsx
def auth_patch(c):
    # we can hook into supabase auth state change in AppLayout or just the login methods
    return re.sub(r'(navigate\([\'"]/dashboard[\'"]\))', r'haptics.success();\n      \1', c)

patch_file("src/features/auth/pages/AuthPage.tsx", [(auth_patch, "")])

# 6. PricingPage.tsx
patch_file("src/features/pricing/pages/PricingPage.tsx", [(profile_patch, "")])

# 7. MealLoggerPage.tsx
def meal_patch(c):
    # Find onSuccess in addMealMutation
    c = re.sub(r'(onSuccess: \(data, text\) => \{\n)', r'\1      haptics.success();\n', c)
    # deleteMealMutation
    c = re.sub(r'(onSuccess: \(\) => \{\n)', r'\1      haptics.success();\n', c)
    return c

patch_file("src/features/nutrition/pages/MealLoggerPage.tsx", [(meal_patch, "")])

