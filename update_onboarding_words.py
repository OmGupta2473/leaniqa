with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

import re

old_block = """                                <div className="p-3 text-center">
                                    <span className="text-sm font-medium">{["Essential fat", "Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat"][p-1] || `Type ${p}`}</span>
                                </div>"""

new_block = """                                <div className="p-3 text-center flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-sm font-bold text-white">{["Under 8%", "8–12%", "12–15%", "15–20%", "20–25%", "25–30%", "30–40%"][p-1] || ""}</span>
                                    <span className="text-[13px] font-medium text-zinc-400">{["Essential fat", "Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat"][p-1] || ""}</span>
                                </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Replaced!")
else:
    print("Not found.")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
