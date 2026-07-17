import re

HAPTICS_IMPORT = "import { haptics } from '@/shared/utils/haptics';\n"

def add_import(content):
    if "from '@/shared/utils/haptics'" not in content:
        import_end = content.rfind("import ")
        if import_end != -1:
            newline_after = content.find("\n", import_end)
            if newline_after != -1:
                content = content[:newline_after+1] + HAPTICS_IMPORT + content[newline_after+1:]
        else:
            content = HAPTICS_IMPORT + content
    return content

# 1. OnboardingPage
with open("src/features/onboarding/pages/OnboardingPage.tsx", "r") as f:
    c = f.read()
c = add_import(c)
c = re.sub(r'(const handleNext = async \(\) => \{\n)', r'\1    haptics.tap();\n', c)
c = re.sub(r'(await profileService\.saveGoal.*?;\n)', r'\1      haptics.success();\n', c)
c = re.sub(r'(await profileService\.saveProfile.*?;\n)', r'\1      haptics.success();\n', c)
with open("src/features/onboarding/pages/OnboardingPage.tsx", "w") as f:
    f.write(c)

# 2. MealLoggerPage
with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    c = f.read()
c = add_import(c)
c = re.sub(r'(onSuccess: \(data, text\) => \{\n)', r'\1      haptics.success();\n', c)
with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(c)

# 3. AuthPage
with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    c = f.read()
c = add_import(c)
c = re.sub(r'(setIsOtpSent\(true\);\n)', r'\1      haptics.success();\n', c)
with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(c)

# 4. WeeklyReportPage
with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    c = f.read()
c = add_import(c)
c = c.replace("setIsGenerating(true);", "haptics.tap();\n    setIsGenerating(true);")
c = c.replace("setInsights(generateDynamicInsights());", "haptics.success();\n      setInsights(generateDynamicInsights());")
with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(c)

# 5. PricingPage
with open("src/features/pricing/pages/PricingPage.tsx", "r") as f:
    c = f.read()
c = add_import(c)
c = c.replace("setIsLoading(true);", "haptics.tap();\n    setIsLoading(true);")
c = re.sub(r'(window\.location\.href = url;\n)', r'haptics.success();\n        \1', c)
with open("src/features/pricing/pages/PricingPage.tsx", "w") as f:
    f.write(c)

