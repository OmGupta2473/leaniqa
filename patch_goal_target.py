import re

with open("src/features/goal/pages/GoalSetterPage.tsx", "r") as f:
    c = f.read()

old_grid = """        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bodyFatOptions.filter(opt => !currentBfMid || opt.mid < currentBfMid).map((opt) => {
            const isSelected = targetBfMid === opt.mid;
            return (
              <motion.button
                key={opt.range}
                onClick={() => setTargetBfMid(opt.mid)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "bg-[#111113] border-[0.5px] border-[rgba(255,255,255,0.06)] rounded-2xl p-4 cursor-pointer transition-all duration-200 text-left flex flex-col hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)]",
                  isSelected && "border-[#D4FF00] bg-[rgba(212,255,0,0.06)] shadow-[0_0_20px_rgba(212,255,0,0.15)] hover:border-[#D4FF00]"
                )}
              >
                <div className={cn("text-[20px] font-bold tracking-tight mb-1", isSelected ? "text-[#D4FF00]" : "text-white")}>{opt.range}</div>
                <div className="text-[13px] font-medium text-[rgba(255,255,255,0.8)] mb-1">{opt.label}</div>
                <div className="text-[11px] text-[rgba(255,255,255,0.45)] leading-relaxed">{opt.desc}</div>
              </motion.button>
            )
          })}"""

new_grid = """        <div className="mb-4">
          <BodyFatSelector 
            gender={gender} 
            value={targetBfMid} 
            onChange={setTargetBfMid} 
            maxBf={currentBfMid}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">"""

c = c.replace(old_grid, new_grid)

with open("src/features/goal/pages/GoalSetterPage.tsx", "w") as f:
    f.write(c)
