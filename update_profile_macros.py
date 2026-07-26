import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Update destructuring
old_destructure = "fatToLoseKg, targetWeightKg, chosenStrategyName, dailyCalorieGoal, dailyDeficit, estimatedWeeks, estimatedCompletionDate"
new_destructure = "fatToLoseKg, targetWeightKg, chosenStrategyName, dailyCalorieGoal, dailyDeficit, estimatedWeeks, estimatedCompletionDate, targetMacros"
content = content.replace(old_destructure, new_destructure)

# Macros section HTML
old_macros = """      <div className="mb-12">
        <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight mb-3">Daily Nutrition Targets</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Calories</div>
            <div className="text-[20px] font-bold text-[#D4FF00]">{displayVal(dailyCalorieGoal)}<span className="text-[12px] font-medium text-[rgba(212,255,0,0.5)] ml-1">kcal</span></div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Protein</div>
            <div className="text-[20px] font-bold text-[#FF4D1C]">{displayVal(proteinMin)}–{displayVal(proteinMax)}<span className="text-[12px] font-medium text-[rgba(255,77,28,0.5)] ml-1">g</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Carbs</div>
            <div className="text-[16px] font-bold text-white">{displayVal(carbMin)}–{displayVal(carbMax)}</div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Fat</div>
            <div className="text-[16px] font-bold text-white">{displayVal(fatMin)}–{displayVal(fatMax)}</div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Water</div>
            <div className="text-[16px] font-bold text-[#378ADD]">{displayVal(waterLitres)} L</div>
          </div>
        </div>
      </div>"""

new_macros = """      <div className="mb-12">
        <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight mb-3">Daily Nutrition Targets</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Calories</div>
            <div className="text-[20px] font-bold text-[#D4FF00]">{displayVal(dailyCalorieGoal)}<span className="text-[12px] font-medium text-[rgba(212,255,0,0.5)] ml-1">kcal</span></div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Protein</div>
            <div className="text-[20px] font-bold text-[#FF4D1C]">
              {targetMacros?.protein ? displayVal(targetMacros.protein) : `${displayVal(proteinMin)}–${displayVal(proteinMax)}`}
              <span className="text-[12px] font-medium text-[rgba(255,77,28,0.5)] ml-1">g</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Carbs</div>
            <div className="text-[16px] font-bold text-white">
              {targetMacros?.carbs ? displayVal(targetMacros.carbs) : `${displayVal(carbMin)}–${displayVal(carbMax)}`}
            </div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Fat</div>
            <div className="text-[16px] font-bold text-white">
              {targetMacros?.fat ? displayVal(targetMacros.fat) : `${displayVal(fatMin)}–${displayVal(fatMax)}`}
            </div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Water</div>
            <div className="text-[16px] font-bold text-[#378ADD]">{displayVal(waterLitres)} L</div>
          </div>
        </div>
      </div>"""

content = content.replace(old_macros, new_macros)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
