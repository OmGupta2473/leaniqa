import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

c = c.replace("""                <div className="flex-1 flex flex-col gap-3">
                  {/* Calories Row (Added) */}
                  <div className="flex justify-between items-end text-[11px] leading-none mb-1">
                      <span className="font-semibold text-[#D4FF00] uppercase tracking-wider">Calories</span>
                      <span className="font-medium text-white/60">{eatenKcal} / {dailyTargetKcal} kcal</span>
                  </div>
                <div className="flex-1 flex flex-col gap-3">""", """                <div className="flex-1 flex flex-col gap-3">
                  {/* Calories */}
                  <div className="flex justify-between items-end text-[11px] leading-none">
                      <span className="font-semibold text-[#D4FF00] uppercase tracking-wider">Calories</span>
                      <span className="font-medium text-white/40">{eatenKcal} / {dailyTargetKcal}</span>
                  </div>""")

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)
