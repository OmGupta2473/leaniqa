import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# Add continue button to gender
gender_btn = """                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!gender}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(3)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}
            {step === 3 && ("""

content = re.sub(r'</motion\.div>\s*\)\}\s*\{step === 3 && \(', gender_btn, content)


# Add continue button to activity
activity_btn = """                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!activity}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(7)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}
            {step === 7 && ("""

content = re.sub(r'</motion\.div>\s*\)\}\s*\{step === 7 && \(', activity_btn, content)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
