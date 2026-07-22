import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# Make the continue button enabled or we can set height to 170 if empty
# A better way is to update the disabled condition for height step
old_continue = """                        <motion.button 
                            disabled={heightUnit === 'cm' ? !height : (!heightFt && !heightIn)}"""

new_continue = """                        <motion.button 
                            disabled={false}
                            onClick={() => {
                                if (heightUnit === 'cm' && !height) setHeight('170');
                                if (heightUnit === 'ft' && !heightFt) setHeightFt('5');
                                if (heightUnit === 'ft' && !heightIn) setHeightIn('8');
                                setStep(5);
                            }}"""

content = content.replace(old_continue, new_continue)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
