import re

with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    content = f.read()

content = content.replace("onClick={() => handleOAuthLogin('apple')}", "onClick={() => window.alert('This feature is currently unavailable.')}")
# optionally change appearance of the button
content = content.replace('className="w-full h-[56px] lg:h-[60px] flex items-center justify-center gap-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] active:scale-[0.98] transition-all border border-white/5 rounded-[16px] text-white text-[16px] font-bold tracking-tight disabled:opacity-50"', 'className="w-full h-[56px] lg:h-[60px] flex items-center justify-center gap-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] active:scale-[0.98] transition-all border border-white/5 rounded-[16px] text-white text-[16px] font-bold tracking-tight disabled:opacity-50 opacity-50 cursor-not-allowed"')

with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(content)
