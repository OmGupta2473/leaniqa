import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

old_badge = """                    {m._localOnly && (
                      <span className="text-[9px] bg-[rgba(255,255,255,0.1)] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                        Offline
                      </span>
                    )}"""

new_badge = """                    <div className="flex gap-1.5 mt-0.5">
                      {m._localOnly && (
                        <span className="text-[9px] bg-[rgba(255,255,255,0.1)] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                          Offline
                        </span>
                      )}
                      {m.meal_source === 'manual' && (
                        <span className="text-[9px] bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
                          Manual
                        </span>
                      )}
                    </div>"""

content = content.replace(old_badge, new_badge)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

