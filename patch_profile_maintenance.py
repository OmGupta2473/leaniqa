import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

maintenance_section = """
      {/* Maintenance Nutrition */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(212,255,0,0.1)] border-[0.5px] border-[rgba(212,255,0,0.2)] flex items-center justify-center">
              <span className="text-[#D4FF00] font-extrabold text-[16px]">M</span>
            </div>
            <div>
              <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight leading-tight">Maintenance Nutrition</div>
              <div className="text-[13px] text-[rgba(235,235,245,0.5)]">To sustain current physique</div>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg">
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Maintenance Calories</span>
            <span className="text-[14px] font-bold text-[#D4FF00]">{displayVal(tdee)} kcal</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Protein</span>
            <span className="text-[14px] font-medium text-white">{displayVal(proteinMin)}–{displayVal(proteinMax)} g</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Carbs</span>
            <span className="text-[14px] font-medium text-white">{displayVal(carbMin)}–{displayVal(carbMax)} g</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Fat</span>
            <span className="text-[14px] font-medium text-white">{displayVal(fatMin)}–{displayVal(fatMax)} g</span>
          </div>
        </div>
      </div>
"""

# Insert before "Step 2: Body Goal"
old_step_2 = "{/* Step 2: Body Goal */}"
new_step_2 = maintenance_section + "\n      " + old_step_2

content = content.replace(old_step_2, new_step_2)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
