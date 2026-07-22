import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

old_code = """                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(212,255,0,0.05)] to-transparent pointer-events-none" />
                        )}
                        {s.isRecommended && (
                          <div className="absolute top-4 right-4 px-3 py-1 bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[11px] font-bold uppercase tracking-wider rounded-full border border-[rgba(212,255,0,0.2)]">
                            ⭐ AI Recommended
                          </div>
                        )}
                        <h3 className="text-[22px] font-bold text-white tracking-tight mb-1">{s.name}</h3>"""

new_code = """                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(212,255,0,0.05)] to-transparent pointer-events-none" />
                        )}
                        <div className="flex flex-col items-start mb-1 gap-2">
                          {s.isRecommended && (
                            <div className="px-3 py-1 bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[11px] font-bold uppercase tracking-wider rounded-full border border-[rgba(212,255,0,0.2)]">
                              ⭐ AI Recommended
                            </div>
                          )}
                          <h3 className="text-[22px] font-bold text-white tracking-tight leading-none">{s.name}</h3>
                        </div>"""

content = content.replace(old_code, new_code)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
