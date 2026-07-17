import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

# Replace macro blocks to display remaining text
old_pro = """              <div className={`text-[9px] uppercase tracking-wider mb-2 ${eatenProtein > proteinTarget && proteinTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.38)]'}`}>
                {eatenProtein > proteinTarget && proteinTarget > 0 ? 'Over' : 'Protein'}
              </div>"""

new_pro = """              <div className="text-[10px] font-medium tracking-wide uppercase text-[rgba(255,255,255,0.6)] mb-0.5">
                Protein
              </div>
              <div className={`text-[9px] mb-2 font-medium ${eatenProtein > proteinTarget && proteinTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.4)]'}`}>
                {getRemainingText(eatenProtein, proteinTarget, 'g')}
              </div>"""

old_fat = """              <div className={`text-[9px] uppercase tracking-wider mb-2 ${eatenFat > fatTarget && fatTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.38)]'}`}>
                {eatenFat > fatTarget && fatTarget > 0 ? 'Over' : 'Fat'}
              </div>"""

new_fat = """              <div className="text-[10px] font-medium tracking-wide uppercase text-[rgba(255,255,255,0.6)] mb-0.5">
                Fat
              </div>
              <div className={`text-[9px] mb-2 font-medium ${eatenFat > fatTarget && fatTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.4)]'}`}>
                {getRemainingText(eatenFat, fatTarget, 'g')}
              </div>"""

old_carb = """              <div className={`text-[9px] uppercase tracking-wider mb-2 ${eatenCarbs > carbsTarget && carbsTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.38)]'}`}>
                {eatenCarbs > carbsTarget && carbsTarget > 0 ? 'Over' : 'Carbs'}
              </div>"""

new_carb = """              <div className="text-[10px] font-medium tracking-wide uppercase text-[rgba(255,255,255,0.6)] mb-0.5">
                Carbs
              </div>
              <div className={`text-[9px] mb-2 font-medium ${eatenCarbs > carbsTarget && carbsTarget > 0 ? 'text-[#FF4D1C]' : 'text-[rgba(255,255,255,0.4)]'}`}>
                {getRemainingText(eatenCarbs, carbsTarget, 'g')}
              </div>"""

c = c.replace(old_pro, new_pro)
c = c.replace(old_fat, new_fat)
c = c.replace(old_carb, new_carb)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

