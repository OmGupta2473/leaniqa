import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# Add ChevronLeft to lucide-react import
content = content.replace("CheckCircle2, ArrowRight } from 'lucide-react';", "CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react';")

# Add Back button near Progress Indicator
back_button = """      {/* Progress Indicator */}
      {step > 0 && step < 7 && (
        <div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">
           <button 
             onClick={() => setStep(step - 1)}
             className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
           >
             <ChevronLeft size={28} />
           </button>
           {[1,2,3,4,5,6].map(s => (
"""

content = content.replace("""      {/* Progress Indicator */}
      {step > 0 && step < 7 && (
        <div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">
           {[1,2,3,4,5,6].map(s => (""", back_button)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)

