import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# The block to remove starts from {/* Step 2: Body Goal */} to the end of that div block, right before {/* Transformation Section */}
old_block = """      {/* Step 2: Body Goal */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(55,138,221,0.1)] border-[0.5px] border-[rgba(55,138,221,0.2)] flex items-center justify-center">
              <span className="text-[#378ADD] font-extrabold text-[16px]">2</span>
            </div>
            <div>
              <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight leading-tight">Body Goal</div>
              <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Target physique & strategy</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/goal')} 
            className="bg-[rgba(55,138,221,0.12)] border-[0.5px] border-[rgba(55,138,221,0.3)] rounded-lg text-[#378ADD] font-semibold"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Update
          </button>
        </div>
        <div className="bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg">
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Fat to lose</span>
            <span className="text-[14px] font-medium text-white">{displayVal(fatToLoseKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Target weight</span>
            <span className="text-[14px] font-medium text-white">{displayVal(targetWeightKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Strategy</span>
            <span className="text-[14px] font-medium text-[#D4FF00]">{displayVal(chosenStrategyName)}</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Daily deficit</span>
            <span className="text-[14px] font-medium text-white">{displayVal(dailyDeficit)} kcal</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Estimated time</span>
            <span className="text-[14px] font-medium text-white">{displayVal(estimatedWeeks)} weeks</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Target date</span>
            <span className="text-[14px] font-medium text-white">{dateStr}</span>
          </div>
        </div>
      </div>\n\n"""

# Sometimes spaces or newlines mismatch, let's just use regex for the whole block from `{/* Step 2: Body Goal */}` to `<TransformationSection />`
import re
content = re.sub(r'\{\/\* Step 2: Body Goal \*\/\}.*?\{\/\* Transformation Section \*\/\}\s*<TransformationSection \/>', '<TransformationSection />', content, flags=re.DOTALL)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
