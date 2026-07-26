import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# 1. Back button logic
old_back = "onClick={() => setStep(step === 9 ? (gender === 'Male' ? 7 : 6) : (step === 7 ? 6 : step - 1))}"
new_back = "onClick={() => setStep(step === 9 ? 6 : (step === 7 ? 6 : step - 1))}"
content = content.replace(old_back, new_back)

# 2. Progress indicator
old_prog = "{step < 8 && [1,2,3,4,5,6, ...(gender === 'Male' ? [7] : [])].map(s => ("
new_prog = "{step < 8 && [1,2,3,4,5,6].map(s => ("
content = content.replace(old_prog, new_prog)

# 3. Step 6 Next Button
old_step6 = "setTimeout(() => setStep(gender === 'Male' ? 7 : 8), 400);"
new_step6 = "setTimeout(() => setStep(8), 400);"
content = content.replace(old_step6, new_step6)

# Remove the entire step 7
# We need to find {step === 7 && ( ... )} and remove it.
# It ends right before {step === 8 && (
step7_start = content.find("{step === 7 && (")
step8_start = content.find("{step === 8 && (")

if step7_start != -1 and step8_start != -1:
    content = content[:step7_start] + content[step8_start:]
    print("Removed step 7 block.")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
