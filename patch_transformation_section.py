import re

with open('src/features/transformation/components/TransformationSection.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
content = content.replace("import { cn } from '@/shared/utils/utils';", "import { cn } from '@/shared/utils/utils';\nimport { useNavigate } from 'react-router-dom';\n\nfunction displayVal(val: any) {\n  if (val === undefined || val === null || val === '') return '—';\n  if (typeof val === 'number') {\n    if (isNaN(val)) return '—';\n    return Number.isInteger(val) ? val : parseFloat(val.toFixed(1));\n  }\n  if (typeof val === 'string') {\n    const num = Number(val);\n    if (!isNaN(num) && val.trim() !== '') {\n      return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));\n    }\n  }\n  return val;\n}")

# 2. Update the hook destructuring & add navigate
content = content.replace("export function TransformationSection() {", "export function TransformationSection() {\n  const navigate = useNavigate();")
content = content.replace(
    "const { gender = 'Male', currentBodyFatPct, targetBodyFatPct, estimatedWeeks, estimatedCompletionDate, dailyCalorieGoal, proteinMin, proteinMax } = profileData;",
    "const { gender = 'Male', currentBodyFatPct, targetBodyFatPct, estimatedWeeks, estimatedCompletionDate, dailyCalorieGoal, proteinMin, proteinMax, fatToLoseKg, targetWeightKg, chosenStrategyName, dailyDeficit } = profileData;"
)

# 3. Update the header
old_header = """      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-[10px] bg-[rgba(212,255,0,0.1)] border-[0.5px] border-[rgba(212,255,0,0.2)] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.1)]">
          <Zap className="text-[#D4FF00] w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight">Transformation</h3>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Your estimated journey</div>
        </div>
      </div>"""

new_header = """      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(55,138,221,0.1)] border-[0.5px] border-[rgba(55,138,221,0.2)] flex items-center justify-center">
            <span className="text-[#378ADD] font-extrabold text-[16px]">2</span>
          </div>
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight">Body Goal</h3>
            <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Target physique & strategy</div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/goal')} 
          className="bg-[rgba(55,138,221,0.12)] border-[0.5px] border-[rgba(55,138,221,0.3)] rounded-lg text-[#378ADD] font-semibold transition-all active:scale-95"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Update
        </button>
      </div>"""

content = content.replace(old_header, new_header)

# 4. Update the info block
old_info_block = """        {/* Info Block */}
        <div className="bg-[rgba(0,0,0,0.3)] rounded-2xl p-4 border border-[rgba(255,255,255,0.03)] relative z-10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[rgba(235,235,245,0.7)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Estimated Time</span>
              <span className="text-[16px] font-bold text-white tracking-tight">{estimatedWeeks ? `${estimatedWeeks} weeks` : '—'}</span>
              {estimatedCompletionDate && (
                <span className="text-[11px] text-[rgba(235,235,245,0.4)] mt-0.5">{estimatedCompletionDate}</span>
              )}
            </div>
          </div>
          
          <div className="w-[1px] h-10 bg-[rgba(255,255,255,0.06)]" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Daily Goal</span>
              <span className="text-[16px] font-bold text-[#D4FF00] tracking-tight">{dailyCalorieGoal ? `${dailyCalorieGoal} kcal` : '—'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.05)] flex items-center justify-center border border-[rgba(212,255,0,0.1)]">
              <Target className="w-5 h-5 text-[#D4FF00]" />
            </div>
          </div>
        </div>"""

new_info_block = """        {/* Info Block */}
        <div className="bg-[rgba(0,0,0,0.3)] rounded-2xl p-4 border border-[rgba(255,255,255,0.03)] relative z-10 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Fat to lose</span>
              <span className="text-[16px] font-bold text-white">{displayVal(fatToLoseKg)} kg</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Target weight</span>
              <span className="text-[16px] font-bold text-white">{displayVal(targetWeightKg)} kg</span>
            </div>
            <div className="col-span-2 w-full h-[1px] bg-[rgba(255,255,255,0.06)] my-1" />
            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Strategy</span>
              <span className="text-[15px] font-bold text-[#D4FF00]">{displayVal(chosenStrategyName)}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Daily deficit</span>
              <span className="text-[15px] font-bold text-white">{displayVal(dailyDeficit)} kcal</span>
            </div>
            <div className="col-span-2 w-full h-[1px] bg-[rgba(255,255,255,0.06)] my-1" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[rgba(235,235,245,0.7)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Estimated Time</span>
                <span className="text-[15px] font-bold text-white tracking-tight">{estimatedWeeks ? `${estimatedWeeks} weeks` : '—'}</span>
                {estimatedCompletionDate && (
                  <span className="text-[11px] text-[rgba(235,235,245,0.4)] mt-0.5">{estimatedCompletionDate}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <div className="flex flex-col items-end text-right">
                <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Daily Goal</span>
                <span className="text-[15px] font-bold text-[#D4FF00] tracking-tight">{dailyCalorieGoal ? `${dailyCalorieGoal} kcal` : '—'}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.05)] flex items-center justify-center shrink-0 border border-[rgba(212,255,0,0.1)]">
                <Target className="w-5 h-5 text-[#D4FF00]" />
              </div>
            </div>
          </div>
        </div>"""

content = content.replace(old_info_block, new_info_block)

with open('src/features/transformation/components/TransformationSection.tsx', 'w') as f:
    f.write(content)
