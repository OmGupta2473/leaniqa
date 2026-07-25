import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    """              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Protein
              </div>""",
    """              <div className="flex flex-col items-center mb-3">
                <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)]">
                  Protein
                </div>
                <div className="text-[9px] font-medium text-[rgba(255,255,255,0.5)] mt-0.5">
                  {getRemainingText(eatenProtein, proteinTarget, 'g')}
                </div>
              </div>"""
)

c = c.replace(
    """              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Fat
              </div>""",
    """              <div className="flex flex-col items-center mb-3">
                <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)]">
                  Fat
                </div>
                <div className="text-[9px] font-medium text-[rgba(255,255,255,0.5)] mt-0.5">
                  {getRemainingText(eatenFat, fatTarget, 'g')}
                </div>
              </div>"""
)

c = c.replace(
    """              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Carbs
              </div>""",
    """              <div className="flex flex-col items-center mb-3">
                <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)]">
                  Carbs
                </div>
                <div className="text-[9px] font-medium text-[rgba(255,255,255,0.5)] mt-0.5">
                  {getRemainingText(eatenCarbs, carbsTarget, 'g')}
                </div>
              </div>"""
)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

