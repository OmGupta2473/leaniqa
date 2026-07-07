import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

target = """          <div className="flex items-center gap-[6px]">
            <span className="text-[18px]">🔥</span>
            <span className="text-[17px] text-white font-bold tracking-[-0.2px]">{currentStreak > 0 ? currentStreak : '0'}</span>
          </div>"""

replacement = """          <div className="flex items-center gap-[6px]">
            <span className="text-[18px]">{currentStreak > 0 ? '🔥' : '❄️'}</span>
            <span className={`text-[17px] font-bold tracking-[-0.2px] ${currentStreak > 0 ? 'text-white' : 'text-[#EBEBF566]'}`}>{currentStreak > 0 ? currentStreak : '—'}</span>
          </div>"""

content = content.replace(target, replacement)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
