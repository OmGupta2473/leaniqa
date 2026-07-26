import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    c = f.read()

# Add physique state
c = c.replace("const [activity, setActivity] = useState<'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'>('Lightly Active');", "const [activity, setActivity] = useState<'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'>('Lightly Active');\n  const [physique, setPhysique] = useState<number | null>(null);")

# Update progress bar condition and logic
# Old: {step > 0 && step !== 7 && (
# New: {step > 0 && step !== 8 && (
c = c.replace("{step > 0 && step !== 7 && (", "{step > 0 && step !== 8 && (")

# Old: onClick={() => setStep(step === 8 ? 6 : step - 1)}
# New: onClick={() => setStep(step === 9 ? (gender === 'Male' ? 7 : 6) : (step === 7 ? 6 : step - 1))}
c = c.replace("onClick={() => setStep(step === 8 ? 6 : step - 1)}", "onClick={() => setStep(step === 9 ? (gender === 'Male' ? 7 : 6) : (step === 7 ? 6 : step - 1))}")

# Old: {step < 7 && [1,2,3,4,5,6].map(s => (
# New: {step < 8 && [1,2,3,4,5,6, ...(gender === 'Male' ? [7] : [])].map(s => (
c = c.replace("{step < 7 && [1,2,3,4,5,6].map(s => (", "{step < 8 && [1,2,3,4,5,6, ...(gender === 'Male' ? [7] : [])].map(s => (")

# Update activity submit to go to step 7 or 8
# Old: setTimeout(() => setStep(7), 400);
# New: setTimeout(() => setStep(gender === 'Male' ? 7 : 8), 400);
c = c.replace("setTimeout(() => setStep(7), 400);", "setTimeout(() => setStep(gender === 'Male' ? 7 : 8), 400);")
c = c.replace("onClick={() => setStep(7)}", "onClick={() => setStep(gender === 'Male' ? 7 : 8)}")

# Update step === 7 to step === 8
c = c.replace("{step === 7 && (", "{step === 8 && (")
c = c.replace("if (step === 7) {", "if (step === 8) {")
c = c.replace("setStep(8);", "setStep(9);")

# Update step === 8 to step === 9
c = c.replace("{step === 8 && results && (", "{step === 9 && results && (")
c = c.replace("step === 8 ? 6", "step === 9 ? (gender === 'Male' ? 7 : 6)")

# Wait, I already did replacement for "onClick={() => setStep(step === 8 ? 6 : step - 1)}"

# Insert new step 7
new_step_7 = """            {step === 7 && (
                <motion.div key="physique" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-center">Does this look similar to your current physique?</h2>
                    <p className="text-center text-zinc-400 mb-8">Select the image that closest matches your body right now.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto overflow-y-auto pb-8">
                        {[1, 2, 3, 4, 5].map(p => (
                            <button
                                key={p}
                                onClick={() => {
                                    setPhysique(p);
                                    setTimeout(() => setStep(8), 400);
                                }}
                                className={cn(
                                    "rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group",
                                    physique === p ? "bg-[rgba(212,255,0,0.1)] border-[#D4FF00]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]"
                                )}
                            >
                                <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                                    <img 
                                        src={`/male_physique_${p}.png`} 
                                        alt={`Male Physique ${p}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23333"><rect width="100%" height="100%"/></svg>';
                                        }}
                                    />
                                    {physique === p && (
                                        <div className="absolute top-2 right-2 bg-[#D4FF00] text-black rounded-full p-1 shadow-lg">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 text-center">
                                    <span className="text-sm font-medium">Type {p}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setStep(8)}
                            className="bg-white text-black px-8 py-3 rounded-full font-semibold"
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            )}

            {step === 8 && ("""

c = c.replace("{step === 8 && (", new_step_7)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(c)
