import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

old_ring = """                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <div className="text-[18px] font-bold tracking-tighter text-white leading-none">
                      {Math.round((calPct) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Macro Bars */}"""

new_ring = """                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <div className="text-[18px] font-bold tracking-tighter text-white leading-none">
                      {Math.round((calPct) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Macro Bars */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* Calories Row (Added) */}
                  <div className="flex justify-between items-end text-[11px] leading-none mb-1">
                      <span className="font-semibold text-[#D4FF00] uppercase tracking-wider">Calories</span>
                      <span className="font-medium text-white/60">{eatenKcal} / {dailyTargetKcal} kcal</span>
                  </div>"""

c = c.replace(old_ring, new_ring)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)

