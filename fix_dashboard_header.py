import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

replacement = """        <div className="flex items-center gap-[16px]">
          <div className="flex items-center gap-[6px]">
            <span className="text-[18px]">🔥</span>
            <span className="text-[17px] text-white font-bold tracking-[-0.2px]">{currentStreak > 0 ? currentStreak : '0'}</span>
          </div>
          <div className="w-[1px] h-[28px] bg-[rgba(235,235,245,0.15)]" />
          <div className="flex flex-col items-center">"""

content = content.replace('        <div className="flex flex-col items-center">', replacement)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
