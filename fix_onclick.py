import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

bad_str = """                            disabled={false}
                            onClick={() => {
                                if (heightUnit === 'cm' && !height) setHeight('170');
                                if (heightUnit === 'ft' && !heightFt) setHeightFt('5');
                                if (heightUnit === 'ft' && !heightIn) setHeightIn('8');
                                setStep(5);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(5)}"""

good_str = """                            disabled={false}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (heightUnit === 'cm' && !height) setHeight('170');
                                if (heightUnit === 'ft' && !heightFt) setHeightFt('5');
                                if (heightUnit === 'ft' && !heightIn) setHeightIn('8');
                                setStep(5);
                            }}"""

content = content.replace(bad_str, good_str)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
