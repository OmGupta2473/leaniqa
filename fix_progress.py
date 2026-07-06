import re

# DashboardPage.tsx
with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

old_prog = """        <div className="h-[4px] bg-[rgba(255,255,255,0.1)] rounded-[100px] overflow-hidden mt-[20px] relative z-10">
          <div
            className="h-full rounded-[100px] bg-gradient-to-r from-[#D4FF00] to-[#A8CC00]"
            style={{
              width: mounted ? `${progressPercent}%` : "0%",
              transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s",
            }}
          ></div>
        </div>"""

new_prog = """        <div className="h-[4px] bg-[rgba(255,255,255,0.1)] rounded-[100px] overflow-hidden mt-[20px] relative z-10">
          <div
            className="h-full w-full rounded-[100px] bg-gradient-to-r from-[#D4FF00] to-[#A8CC00] origin-left"
            style={{
              transform: mounted ? `translateX(-${100 - progressPercent}%)` : "translateX(-100%)",
              transition: "transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s",
              willChange: "transform"
            }}
          ></div>
        </div>"""

content = content.replace(old_prog, new_prog)

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)

# Index.css
with open('src/index.css', 'r') as f:
    css = f.read()

# For .progress-bar-fill, if it is used anywhere. Wait, I should just grep for .progress-bar-fill and replace its usage if possible.
# Actually, the user says "Replace them with transform, translate3d, opacity where possible".
