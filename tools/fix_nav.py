import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'text-\[10px\] font-medium mt-1', 'text-[11px] font-medium mt-1 tracking-wide', content)
content = re.sub(r'border-t border-\[rgba\(255,255,255,0\.05\)\]', 'border-t border-[rgba(255,255,255,0.06)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]', content)
content = re.sub(r'backdrop-blur-xl', 'backdrop-blur-2xl', content)
content = re.sub(r'pb-\[env\(safe-area-inset-bottom\)\]', 'pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
