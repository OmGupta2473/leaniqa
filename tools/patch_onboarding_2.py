import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# Fix Progress indicator
old_str = r'\{step > 0 && step < 7 && \(\s*<div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">\s*<button\s*onClick=\{\(\) => setStep\(step - 1\)\}\s*className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"\s*>\s*<ChevronLeft size=\{28\} />\s*</button>\s*\{\[1,2,3,4,5,6\]\.map\(s => \(\s*<motion\.div\s*key=\{s\}\s*className=\{cn\("h-1 rounded-full", step >= s \? "bg-\[#D4FF00\]" : "bg-zinc-800"\)\}\s*animate=\{\{ width: step === s \? 40 : 8 \}\}\s*transition=\{\{ type: "spring" as any, stiffness: 300, damping: 30 \}\}\s*/>\s*\)\)\}\s*</div>\s*\)\}'

new_str = """{step > 0 && step !== 7 && (
        <div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">
           <button 
             onClick={() => setStep(step === 8 ? 6 : step - 1)}
             className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-2"
             aria-label="Go Back"
           >
             <ChevronLeft size={28} />
           </button>
           {step < 7 && [1,2,3,4,5,6].map(s => (
             <motion.div 
               key={s}
               className={cn("h-1 rounded-full", step >= s ? "bg-[#D4FF00]" : "bg-zinc-800")}
               animate={{ width: step === s ? 40 : 8 }}
               transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
             />
           ))}
        </div>
      )}"""

content = re.sub(old_str, new_str, content)

# Check if keyboard shortcut logic got inserted
if 'const handleKeyDown' not in content:
    print("Missed keydown logic!")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)

