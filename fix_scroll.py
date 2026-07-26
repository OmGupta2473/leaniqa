import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

# Add scroll to top on step change
old_effect = """  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [step]);"""

new_effect = """  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Scroll to top of both window and app-scroll container on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollContainer = document.querySelector('.app-scroll');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);"""

content = content.replace(old_effect, new_effect)

# Update Type p with actual names
old_type_map = """                                <div className="p-3 text-center">
                                    <span className="text-sm font-medium">Type {p}</span>
                                </div>"""

new_type_map = """                                <div className="p-3 text-center">
                                    <span className="text-sm font-medium">{["Lean", "Athletic", "Fit", "Average", "Skinny Fat", "Overweight", "Obese"][p-1] || `Type ${p}`}</span>
                                </div>"""

content = content.replace(old_type_map, new_type_map)

# Replace "Does this look similar to your current physique?" with sticky header
# Actually the header sticking issue might just be because the container scrolls but the page doesn't.
# Wait, OnboardingPage progress bar:
# <div className="sticky top-0 w-full px-4 sm:px-8 pt-8 pb-4 sm:pt-12 sm:pb-6 z-50 flex items-center shrink-0 bg-[#0A0A0B]">
# Let's change it to fixed
old_progress = """      {step > 0 && step < 8 && (
        <div className="sticky top-0 w-full px-4 sm:px-8 pt-8 pb-4 sm:pt-12 sm:pb-6 z-50 flex items-center shrink-0 bg-[#0A0A0B]">"""

new_progress = """      {step > 0 && step < 8 && (
        <div className="fixed top-0 left-0 right-0 w-full px-4 sm:px-8 pt-8 pb-4 sm:pt-12 sm:pb-6 z-[100] flex items-center justify-between bg-[#0A0A0B] border-b border-[rgba(255,255,255,0.05)] shadow-md">"""

content = content.replace(old_progress, new_progress)

# Then we need to add padding-top to the main container when step > 0
# <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto">
old_main = """      <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto">"""
new_main = """      <div className={cn("flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto", step > 0 && step < 8 ? "pt-24" : "")}>"""

content = content.replace(old_main, new_main)

# We need to make sure the right side spacer and logout button are correctly structured since we used justify-between
# Ah, I shouldn't mess up the flex-layout if it already had flex justify-start.

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
