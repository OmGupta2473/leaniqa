import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

row_pattern = r'function MealSlotRow\(\{ slot, icon, label, timeRange, meals \}: \{ slot: string; icon: React\.ReactNode; label: string; timeRange: string; meals: any\[\] \}\) \{.*?<div className="flex gap-\[6px\]">.*?</span>\n                <span.*?</span>\n              </div>\n            </div>\n          \)\)\}'

new_row = """function MealSlotRow({ slot, icon, label, timeRange, meals, onDelete }: { slot: string; icon: React.ReactNode; label: string; timeRange: string; meals: any[], onDelete: (id: string) => void }) {
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pro = meals.reduce((s, m) => s + m.protein, 0);
  return (
    <div className="glass-card p-[14px_16px] mb-[8px]">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[28px] h-[28px] rounded-full bg-[rgba(212,255,0,0.12)] flex items-center justify-center text-[#D4FF00]">
            {icon}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">{label}</div>
            <div className="text-[11px] text-[rgba(235,235,245,0.45)]">{timeRange}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[14px] font-bold text-white">{kcal} <span className="text-[10px] font-normal text-[rgba(235,235,245,0.45)]">kcal</span></div>
          <div className="text-[11px] text-[rgba(55,138,221,0.9)] font-semibold">{pro}g protein</div>
        </div>
      </div>
      {meals.length > 0 && (
        <div className="space-y-[6px] pt-[8px] border-t border-[rgba(255,255,255,0.06)]">
          {meals.map((m, i) => (
            <div key={m.id || i} className="flex items-center justify-between group">
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-[12px] text-[rgba(235,235,245,0.7)] capitalize truncate">{m.meal_text}</div>
              </div>
              <div className="flex items-center gap-[4px] shrink-0">
                <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-[6px] py-[2px] rounded-full font-semibold">{m.calories} kcal</span>
                <span className="text-[10px] bg-[rgba(55,138,221,0.12)] text-[#378ADD] px-[6px] py-[2px] rounded-full font-semibold">{m.protein}g</span>
                {m.id && !m.id.toString().startsWith('opt-') && (
                   <button onClick={() => {
                      if (window.confirm("Delete Meal?\\nThis action cannot be undone.")) {
                         onDelete(m.id);
                      }
                   }} className="w-[20px] h-[20px] rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(235,235,245,0.6)] hover:bg-[rgba(255,77,28,0.2)] hover:text-[#FF4D1C] transition-colors ml-1">
                     <X size={10} />
                   </button>
                )}
              </div>
            </div>
          ))}"""

content = re.sub(row_pattern, new_row, content, flags=re.DOTALL)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
